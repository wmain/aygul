"""
Pytest configuration and fixtures
"""

import pytest
import os
import sys

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

@pytest.fixture(scope="session")
def test_env():
    """Set up test environment variables"""
    os.environ["TESTING"] = "true"
    os.environ["MONGO_URL"] = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    os.environ["DB_NAME"] = os.environ.get("DB_NAME", "languageapp_test")
    yield
    # Cleanup after tests
    if "TESTING" in os.environ:
        del os.environ["TESTING"]
