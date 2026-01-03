"""
Human-in-the-Loop Handler

Utilities for detecting when the agent needs human input
and managing the pause/resume flow.
"""

import re
import logging
from typing import Optional, Tuple

logger = logging.getLogger("autoagent.human_loop")

# Common patterns that indicate login/2FA is required
LOGIN_PATTERNS = [
    r"log\s*in",
    r"sign\s*in",
    r"authentication",
    r"password",
    r"username",
    r"email.*password",
    r"enter\s*your\s*credentials",
]

TWO_FA_PATTERNS = [
    r"verification\s*code",
    r"2fa",
    r"two.?factor",
    r"authenticator",
    r"otp",
    r"one.?time\s*password",
    r"security\s*code",
    r"confirm\s*your\s*identity",
    r"verify\s*it.?s\s*you",
    r"enter\s*the\s*code",
]

CAPTCHA_PATTERNS = [
    r"captcha",
    r"i.?m\s*not\s*a\s*robot",
    r"verify\s*you.?re\s*human",
    r"recaptcha",
    r"hcaptcha",
]


def detect_input_requirement(page_content: str, page_url: str = "") -> Optional[Tuple[str, str, str]]:
    """
    Analyze page content to detect if human input is required.
    
    Args:
        page_content: The text content of the page
        page_url: The current page URL
        
    Returns:
        Tuple of (input_type, field_name, hint) if input required, None otherwise
    """
    content_lower = page_content.lower()
    url_lower = page_url.lower()
    
    # Check URL patterns first
    if any(p in url_lower for p in ["login", "signin", "auth", "sso"]):
        return _analyze_login_page(content_lower)
    
    # Check for 2FA patterns - these take priority
    for pattern in TWO_FA_PATTERNS:
        if re.search(pattern, content_lower):
            return (
                "text",
                "Verification Code",
                "Please enter the 2FA/verification code sent to your device or email."
            )
    
    # Check for login patterns
    for pattern in LOGIN_PATTERNS:
        if re.search(pattern, content_lower):
            return _analyze_login_page(content_lower)
    
    # Check for CAPTCHA - these need special handling
    for pattern in CAPTCHA_PATTERNS:
        if re.search(pattern, content_lower):
            return (
                "captcha",
                "CAPTCHA Verification",
                "A CAPTCHA is required. Please solve it manually and indicate when done."
            )
    
    return None


def _analyze_login_page(content: str) -> Tuple[str, str, str]:
    """
    Analyze a login page to determine what credentials are needed.
    """
    # Check if it's asking for both username and password
    has_username = any(word in content for word in ["username", "email", "user id", "account"])
    has_password = "password" in content
    
    if has_username and has_password:
        return (
            "credentials",
            "Username & Password",
            "Please provide your login credentials (username/email and password)."
        )
    elif has_password:
        return (
            "password",
            "Password",
            "Please enter your password to continue."
        )
    elif has_username:
        return (
            "text",
            "Username/Email",
            "Please enter your username or email address."
        )
    
    return (
        "password",
        "Credentials",
        "Please provide the required login information."
    )


class HumanInputRequired(Exception):
    """
    Exception raised when human input is needed.
    Contains metadata about what input is required.
    """
    
    def __init__(
        self,
        input_type: str,
        field_name: str,
        hint: str,
        page_url: str = "",
        screenshot_path: Optional[str] = None
    ):
        self.input_type = input_type
        self.field_name = field_name
        self.hint = hint
        self.page_url = page_url
        self.screenshot_path = screenshot_path
        super().__init__(f"Human input required: {field_name}")
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "type": self.input_type,
            "field_name": self.field_name,
            "hint": self.hint,
            "page_url": self.page_url,
            "screenshot_path": self.screenshot_path,
        }


async def wait_for_user_input(
    supabase_client,
    task_id: str,
    timeout_seconds: int = 300,
    poll_interval: float = 2.0
) -> Optional[str]:
    """
    Wait for user to provide input via Supabase.
    
    Args:
        supabase_client: Supabase client instance
        task_id: The task ID to monitor
        timeout_seconds: Maximum time to wait
        poll_interval: Seconds between polls
        
    Returns:
        The user-provided input, or None if timeout
    """
    import asyncio
    
    elapsed = 0
    
    while elapsed < timeout_seconds:
        # Check if user provided input
        result = supabase_client.table("tasks").select("user_provided_input, status").eq("id", task_id).single().execute()
        
        task = result.data
        if task:
            # Check if user cancelled
            if task["status"] == "cancelled":
                logger.info(f"Task {task_id} was cancelled by user")
                return None
            
            # Check if input was provided
            user_input = task.get("user_provided_input")
            if user_input:
                logger.info(f"Received user input for task {task_id}")
                return user_input
        
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval
    
    logger.warning(f"Timeout waiting for user input on task {task_id}")
    return None
