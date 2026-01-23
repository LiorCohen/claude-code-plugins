"""
Pytest fixture discovery file.
Imports fixtures from test_helpers for pytest to discover them automatically.
"""

from test_helpers import prompts_dir, test_project

__all__ = ["prompts_dir", "test_project"]
