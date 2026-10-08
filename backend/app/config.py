import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "SIH 2026 - Gen AI Content Transformation Platform"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # Default recommended Flash model
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    DUMMY_DATA_DIR: str = os.getenv("DUMMY_DATA_DIR", "dummy_data")

settings = Settings()
