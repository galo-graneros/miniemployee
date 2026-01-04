"""
BrowserAgent - AI Agent using browser-use for web automation

This module implements the core agent that:
1. Uses browser-use library with Playwright
2. Leverages Claude for intelligent navigation
3. Implements Human-in-the-loop for credentials
"""

import os
import asyncio
import logging
from typing import Optional, Any
from supabase import Client

from browser_use import Agent, Browser, ChatAnthropic

logger = logging.getLogger("autoagent.agent")

# Anthropic configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY must be set")


class BrowserAgent:
    """
    AI agent that navigates the web using browser-use and Claude.
    
    Features:
    - Real browser automation via Playwright
    - Intelligent navigation with Claude
    - Human-in-the-loop for login/2FA
    - Real-time logging to Supabase
    """

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.browser: Optional[Browser] = None
        self.current_task_id: Optional[str] = None

    async def run_task(self, task_id: str, prompt: str) -> dict:
        """
        Execute a browser task with the given prompt.
        
        Args:
            task_id: The Supabase task ID for logging
            prompt: The user's instruction
            
        Returns:
            dict with task results
        """
        self.current_task_id = task_id
        
        try:
            await self._log(task_id, "Initializing browser...", "info")
            
            # Create browser instance (headless=False to see what's happening)
            self.browser = Browser(headless=False)
            
            await self._log(task_id, "Browser initialized, creating agent...", "info")
            
            # Create the browser-use agent
            # browser-use 0.11.x has its own ChatAnthropic wrapper
            llm = ChatAnthropic(
                model="claude-opus-4-5-20251101",
                api_key=ANTHROPIC_API_KEY,
            )
            
            agent = Agent(
                task=prompt,
                llm=llm,
                browser=self.browser,
            )
            
            await self._log(task_id, "Agent created, starting execution...", "info")
            
            # Run the agent
            history = await agent.run(max_steps=25)
            
            await self._log(task_id, "Execution completed", "success")
            
            # Extract meaningful result
            final_result = "Task completed successfully."
            if history:
                if hasattr(history, 'final_result') and callable(history.final_result):
                    final_result = history.final_result() or final_result
                elif hasattr(history, 'result'):
                    final_result = str(history.result) or final_result
                else:
                    final_result = str(history)[:500] if history else final_result
            
            return {
                "success": True,
                "result": final_result,
                "steps_taken": agent.n_steps if hasattr(agent, 'n_steps') else 0,
            }
            
        except LoginRequiredError as e:
            # Handle login/2FA - pause and wait for user input
            return await self._handle_login_required(task_id, e)
            
        except Exception as e:
            logger.error(f"Agent error: {e}")
            await self._log(task_id, f"Error: {str(e)}", "error")
            raise
            
        finally:
            # Cleanup browser
            if self.browser:
                try:
                    await self.browser.close()
                except:
                    pass
                self.browser = None

    async def resume_with_input(self, task_id: str, user_input: str) -> dict:
        """
        Resume a paused task after user provides input (password, 2FA, etc.)
        
        Args:
            task_id: The task ID
            user_input: The secret/code provided by user
            
        Returns:
            dict with task results
        """
        self.current_task_id = task_id
        
        await self._log(task_id, "Resuming with user-provided input...", "info")
        
        # Get the task to retrieve browser state and original prompt
        result = self.supabase.table("tasks").select("*").eq("id", task_id).single().execute()
        task = result.data
        
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        # For now, we restart the task with the input included
        # In a production system, you'd serialize browser state
        original_prompt = task["prompt"]
        required_input = task.get("required_input", {})
        field_name = required_input.get("field_name", "password")
        
        # Construct new prompt with credentials
        augmented_prompt = f"""
        {original_prompt}
        
        IMPORTANT: If you encounter a login page or verification form, 
        use this value for the {field_name} field: {user_input}
        
        Continue where you left off.
        """
        
        return await self.run_task(task_id, augmented_prompt)

    async def _handle_login_required(self, task_id: str, error: 'LoginRequiredError') -> dict:
        """
        Handle when the agent encounters a login or 2FA form.
        Updates task status to waiting_for_secret.
        """
        await self._log(task_id, "Login/verification required, pausing for user input...", "warning")
        
        # Update task to waiting state
        self.supabase.table("tasks").update({
            "status": "waiting_for_secret",
            "required_input": {
                "type": error.input_type if hasattr(error, 'input_type') else "password",
                "field_name": error.field_name if hasattr(error, 'field_name') else "Password/Code",
                "hint": error.hint if hasattr(error, 'hint') else "Please provide the required credentials or verification code.",
            },
        }).eq("id", task_id).execute()
        
        # Return and let the worker's polling handle the resume
        return {
            "success": False,
            "waiting_for_input": True,
            "message": "Waiting for user input",
        }

    async def _on_step_end(self, task_id: str, step: Any):
        """Callback after each agent step for logging."""
        try:
            step_info = str(step) if step else "Step completed"
            await self._log(task_id, f"Step: {step_info[:100]}", "info")
        except Exception as e:
            logger.warning(f"Error logging step: {e}")

    async def _log(self, task_id: str, message: str, log_type: str = "info"):
        """Log a message to both local logger and Supabase."""
        logger.info(f"[{task_id}] {message}")
        try:
            self.supabase.rpc(
                "append_task_log",
                {"task_id": task_id, "log_message": message, "log_type": log_type}
            ).execute()
        except Exception as e:
            logger.warning(f"Failed to log to Supabase: {e}")


class LoginRequiredError(Exception):
    """Exception raised when login or verification is required."""
    
    def __init__(
        self, 
        message: str = "Login or verification required",
        input_type: str = "password",
        field_name: str = "Password",
        hint: str = "Please provide credentials"
    ):
        super().__init__(message)
        self.input_type = input_type
        self.field_name = field_name
        self.hint = hint
