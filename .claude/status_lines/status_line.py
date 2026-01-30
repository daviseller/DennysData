#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import json
import os
import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def log_status_line(input_data, status_line_output):
    """Log status line event to logs directory."""
    # Ensure logs directory exists
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / 'status_line.json'

    # Read existing log data or initialize empty list
    if log_file.exists():
        with open(log_file, 'r') as f:
            try:
                log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
    else:
        log_data = []

    # Create log entry with input data and generated output
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "input_data": input_data,
        "status_line_output": status_line_output
    }

    # Append the log entry
    log_data.append(log_entry)

    # Write back to file with formatting
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)


def get_git_branch():
    """Get current git branch if in a git repository."""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            capture_output=True,
            text=True,
            timeout=2
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def get_git_status():
    """Get git status indicators."""
    try:
        # Check if there are uncommitted changes
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            timeout=2
        )
        if result.returncode == 0:
            changes = result.stdout.strip()
            if changes:
                lines = changes.split('\n')
                return f"±{len(lines)}"
    except Exception:
        pass
    return ""


def get_output_style():
    """Check for current output style from settings."""
    settings_path = Path('.claude/settings.local.json')
    if settings_path.exists():
        try:
            with open(settings_path, 'r') as f:
                settings = json.load(f)
                output_style = settings.get('outputStyle')
                if output_style:
                    return output_style
        except (json.JSONDecodeError, IOError):
            pass
    return None


def get_token_usage(input_data):
    """Calculate and format token usage from context_window data."""
    context_window = input_data.get('context_window', {})
    context_size = context_window.get('context_window_size', 0)
    current_usage = context_window.get('current_usage', {})

    if not context_size or not current_usage:
        return None

    # Calculate total tokens used
    input_tokens = current_usage.get('input_tokens', 0)
    cache_creation = current_usage.get('cache_creation_input_tokens', 0)
    cache_read = current_usage.get('cache_read_input_tokens', 0)

    total_tokens = input_tokens + cache_creation + cache_read

    if total_tokens == 0:
        return None

    # Calculate percentage
    percent_used = (total_tokens * 100) // context_size

    # Color based on usage level: Green 0-50%, Yellow 50-75%, Red 75%+
    if percent_used < 50:
        color = '\033[32m'  # Green
    elif percent_used < 75:
        color = '\033[33m'  # Yellow
    else:
        color = '\033[31m'  # Red

    return f"{color}{percent_used}%\033[0m"


def get_workflow_status():
    """Get current workflow plan status if active."""
    active_file = Path('.claude/ACTIVE.md')
    if not active_file.exists():
        return None

    try:
        with open(active_file, 'r') as f:
            content = f.read()

        # Look for active plan
        for line in content.split('\n'):
            if line.startswith('**Plan:**'):
                plan = line.replace('**Plan:**', '').strip()
                if plan and plan != 'None':
                    return f"📋 {plan}"
    except IOError:
        pass

    return None


def generate_status_line(input_data):
    """Generate the status line based on input data."""
    parts = []

    # Model display name
    model_info = input_data.get('model', {})
    model_name = model_info.get('display_name', 'Claude')
    parts.append(f"\033[36m[{model_name}]\033[0m")  # Cyan color

    # Token usage (context window)
    token_usage = get_token_usage(input_data)
    if token_usage:
        parts.append(token_usage)

    # Output style indicator
    output_style = get_output_style()
    if output_style:
        parts.append(f"\033[35m{output_style}\033[0m")  # Magenta color

    # Git branch and status
    git_branch = get_git_branch()
    if git_branch:
        git_status = get_git_status()
        git_info = git_branch
        if git_status:
            git_info += f" {git_status}"
        parts.append(f"\033[32m{git_info}\033[0m")  # Green color

    # Workflow status
    workflow_status = get_workflow_status()
    if workflow_status:
        parts.append(f"\033[33m{workflow_status}\033[0m")  # Yellow color

    # Version info (optional, smaller)
    version = input_data.get('version', '')
    if version:
        parts.append(f"\033[90mv{version}\033[0m")  # Gray color

    # Add timestamp
    timestamp = datetime.now().strftime("%H:%M")
    parts.append(f"\033[90m{timestamp}\033[0m")  # Gray color

    return " │ ".join(parts)


def main():
    # Set UTF-8 encoding for Windows
    if sys.platform == 'win32':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

    try:
        # Read JSON input from stdin
        input_text = sys.stdin.read()
        # Fix Windows path escaping
        input_text = input_text.replace('\\', '\\\\')
        input_data = json.loads(input_text)

        # Generate status line
        status_line = generate_status_line(input_data)

        # Log the status line event
        log_status_line(input_data, status_line)

        # Output the status line (first line of stdout becomes the status line)
        print(status_line)

        # Success
        sys.exit(0)

    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully - output basic status
        print("\033[31m[Claude] | Unknown\033[0m")
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully - output basic status
        print("\033[31m[Claude] | Error\033[0m")
        sys.exit(0)


if __name__ == '__main__':
    main()
