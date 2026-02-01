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





def get_last_command_status():
    """Get last command execution statistics."""
    # Try to read from a command history file if available
    history_file = Path('.last_command.json')
    if not history_file.exists():
        return None

    try:
        with open(history_file, 'r') as f:
            last_cmd = json.load(f)

        # Extract command info
        cmd_name = last_cmd.get('command', '').split()[0].split('/')[-1].split('\\')[-1]
        exit_code = last_cmd.get('exit_code', 0)
        exec_time = last_cmd.get('execution_time', 0)
        timestamp = last_cmd.get('timestamp', 0)

        # Only show recent commands (within last 5 minutes)
        if time.time() - timestamp > 300:
            return None

        # Abbreviate common commands
        cmd_abbrev = {
            'npm': 'npm',
            'npm.cmd': 'npm',
            'yarn': 'yarn',
            'yarn.cmd': 'yarn',
            'git': 'git',
            'git.exe': 'git',
            'dotnet': 'dotnet',
            'dotnet.exe': 'dotnet',
            'ng': 'ng',
            'ng.cmd': 'ng',
            'python': 'py',
            'python.exe': 'py',
            'docker': 'docker',
            'kubectl': 'k8s',
            'powershell': 'ps',
            'pwsh': 'ps',
            'cmd': 'cmd'
        }.get(cmd_name.lower(), cmd_name[:3] if cmd_name else '?')

        # Build status string
        parts = []

        # Add command name
        if cmd_abbrev:
            parts.append(cmd_abbrev)

        # Add exit status
        if exit_code == 0:
            parts.append('✅')
        elif exit_code == 1:
            parts.append('⚠️')
        else:
            parts.append(f'❌{exit_code}')

        # Add execution time with performance indicator
        if exec_time > 0:
            if exec_time < 1:
                time_str = f'{exec_time:.1f}s'
                perf = '🚀'  # Fast
            elif exec_time < 10:
                time_str = f'{exec_time:.1f}s'
                perf = '⏱️'  # Normal
            elif exec_time < 60:
                time_str = f'{exec_time:.0f}s'
                perf = '🐌'  # Slow
            else:
                minutes = int(exec_time // 60)
                seconds = int(exec_time % 60)
                time_str = f'{minutes}m{seconds}s' if seconds else f'{minutes}m'
                perf = '⏰'  # Very slow

            # Only show time if > 2 seconds or if command failed
            if exec_time > 2 or exit_code != 0:
                parts.append(time_str)
                if exec_time > 10:  # Only show performance indicator for slow commands
                    parts.append(perf)

        return ' '.join(parts) if parts else None

    except (json.JSONDecodeError, IOError, KeyError):
        return None


def get_active_plan():
    """Get the currently active workflow plan from ACTIVE.md."""
    active_file = Path('.claude/ACTIVE.md')
    if not active_file.exists():
        return None

    try:
        with open(active_file, 'r') as f:
            content = f.read()

        # Parse the **Plan:** line
        for line in content.split('\n'):
            if line.startswith('**Plan:**'):
                plan_name = line.replace('**Plan:**', '').strip()
                if plan_name and plan_name.lower() != 'none':
                    return plan_name
    except IOError:
        pass

    return None


def get_orchestrate_status():
    """Get count of currently running orchestrate commands."""
    orchestrate_file = Path('.claude/state/orchestrate-active.json')
    if not orchestrate_file.exists():
        return None

    try:
        with open(orchestrate_file, 'r') as f:
            orchestrate_data = json.load(f)

        # Count active executions
        if isinstance(orchestrate_data, list):
            active_count = len([item for item in orchestrate_data if item.get('status') == 'running'])
            failed_count = len([item for item in orchestrate_data if item.get('status') == 'failed'])

            if active_count > 0 or failed_count > 0:
                parts = []
                if active_count > 0:
                    parts.append(f"🎼 {active_count}")  # Running orchestrate commands
                if failed_count > 0:
                    parts.append(f"❌ {failed_count}")  # Failed orchestrate commands
                return " ".join(parts)

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




def generate_status_line(input_data):
    """Generate the status line based on input data."""
    parts = []

    # 1. Current working directory
    workspace = input_data.get('workspace', {})
    current_dir = workspace.get('current_dir', '')
    if current_dir:
        dir_name = os.path.basename(current_dir)
        parts.append(f"\033[34m{dir_name}/\033[0m")  # Blue color

    # 2. Git branch and status
    git_branch = get_git_branch()
    if git_branch:
        git_status = get_git_status()
        git_info = git_branch
        if git_status:
            git_info += f" {git_status}"
        parts.append(f"\033[32m{git_info}\033[0m")  # Green color

    # 3. Token usage (context window)
    token_usage = get_token_usage(input_data)
    if token_usage:
        parts.append(token_usage)

    # 4. Model display name
    model_info = input_data.get('model', {})
    model_name = model_info.get('display_name', 'Claude')
    parts.append(f"\033[36m[{model_name}]\033[0m")  # Cyan color

    # Output style indicator
    output_style = get_output_style()
    if output_style:
        parts.append(f"\033[35m{output_style}\033[0m")  # Magenta color

    # Last command status
    last_cmd = get_last_command_status()
    if last_cmd:
        parts.append(f"\033[96mLast: {last_cmd}\033[0m")  # Bright cyan color

    # Orchestrate commands status
    orchestrate_status = get_orchestrate_status()
    if orchestrate_status:
        parts.append(f"\033[37m{orchestrate_status}\033[0m")  # White color

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
