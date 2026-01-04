"""
AutoAgent Worker - Main Entry Point

This module starts the worker process that:
1. Connects to Supabase Realtime
2. Listens for new tasks (INSERT with status='pending')
3. Executes tasks using browser-use agent
4. Updates task status and logs in real-time
"""

import os
import asyncio
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
from agent import BrowserAgent

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("autoagent.worker")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
WORKER_ID = os.getenv("WORKER_ID", "worker-1")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")


class TaskWorker:
    """
    Worker that listens for pending tasks and executes them using browser-use.
    """

    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.agent = BrowserAgent(self.supabase)
        self.running = False

    async def start(self):
        """Start the worker and begin listening for tasks."""
        self.running = True
        logger.info(f"Worker {WORKER_ID} started, listening for tasks...")

        # Process any existing pending tasks first
        await self._process_pending_tasks()

        # Start real-time subscription
        await self._listen_for_tasks()

    async def stop(self):
        """Stop the worker gracefully."""
        self.running = False
        logger.info(f"Worker {WORKER_ID} stopping...")

    async def _process_pending_tasks(self):
        """Process any pending tasks that were created before worker started."""
        try:
            result = self.supabase.table("tasks").select("*").eq("status", "pending").execute()
            tasks = result.data

            if tasks:
                logger.info(f"Found {len(tasks)} pending tasks to process")
                for task in tasks:
                    await self._execute_task(task)
        except Exception as e:
            logger.error(f"Error processing pending tasks: {e}")

    async def _listen_for_tasks(self):
        """
        Listen for new tasks via polling.
        
        Note: Supabase Python client realtime support is still evolving.
        Using polling as a reliable fallback.
        """
        logger.info("Starting task polling loop...")
        
        while self.running:
            try:
                # Check for pending tasks
                result = (
                    self.supabase.table("tasks")
                    .select("*")
                    .eq("status", "pending")
                    .order("created_at", desc=False)
                    .limit(1)
                    .execute()
                )

                if result.data:
                    task = result.data[0]
                    logger.info(f"Found pending task: {task['id']}")
                    await self._execute_task(task)

                # Also check for tasks that were waiting for secrets and now have input
                result = (
                    self.supabase.table("tasks")
                    .select("*")
                    .eq("status", "running")
                    .not_.is_("user_provided_input", "null")
                    .limit(1)
                    .execute()
                )

                if result.data:
                    task = result.data[0]
                    if task.get("user_provided_input"):
                        logger.info(f"Task {task['id']} has user input, resuming...")
                        await self._resume_task(task)

            except Exception as e:
                logger.error(f"Error in polling loop: {e}")

            # Poll every 5 seconds
            await asyncio.sleep(5)

    async def _execute_task(self, task: dict):
        """Execute a single task using the browser agent."""
        task_id = task["id"]
        prompt = task["prompt"]

        logger.info(f"Executing task {task_id}: {prompt[:50]}...")

        try:
            # Update status to running
            self.supabase.table("tasks").update({
                "status": "running",
                "started_at": "now()",
            }).eq("id", task_id).execute()

            # Log the start
            await self._append_log(task_id, f"Starting task execution...", "info")
            await self._append_log(task_id, f"Prompt: {prompt}", "info")

            # Execute with browser-use
            result = await self.agent.run_task(task_id, prompt)

            # Update task with result
            self.supabase.table("tasks").update({
                "status": "completed",
                "result": result,
                "completed_at": "now()",
            }).eq("id", task_id).execute()

            await self._append_log(task_id, "Task completed successfully!", "success")
            logger.info(f"Task {task_id} completed successfully")

        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}")
            
            self.supabase.table("tasks").update({
                "status": "failed",
                "error_message": str(e),
                "completed_at": "now()",
            }).eq("id", task_id).execute()

            await self._append_log(task_id, f"Task failed: {str(e)}", "error")

    async def _resume_task(self, task: dict):
        """Resume a task after user provided input."""
        task_id = task["id"]
        user_input = task.get("user_provided_input")

        logger.info(f"Resuming task {task_id} with user input")

        try:
            await self._append_log(task_id, "Received user input, resuming...", "info")

            # Clear the user_provided_input so we don't pick it up again
            self.supabase.table("tasks").update({
                "user_provided_input": None,
            }).eq("id", task_id).execute()

            # Resume agent with the secret
            result = await self.agent.resume_with_input(task_id, user_input)

            self.supabase.table("tasks").update({
                "status": "completed",
                "result": result,
                "completed_at": "now()",
            }).eq("id", task_id).execute()

            await self._append_log(task_id, "Task completed successfully!", "success")

        except Exception as e:
            logger.error(f"Task {task_id} failed after resume: {e}")
            
            self.supabase.table("tasks").update({
                "status": "failed",
                "error_message": str(e),
            }).eq("id", task_id).execute()

    async def _append_log(self, task_id: str, message: str, log_type: str = "info"):
        """Append a log entry to the task's logs array."""
        try:
            # Use the RPC function we defined in the schema
            self.supabase.rpc(
                "append_task_log",
                {"task_id": task_id, "log_message": message, "log_type": log_type}
            ).execute()
        except Exception as e:
            logger.warning(f"Failed to append log: {e}")


async def main():
    """Main entry point."""
    worker = TaskWorker()
    
    try:
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    finally:
        await worker.stop()


if __name__ == "__main__":
    asyncio.run(main())
