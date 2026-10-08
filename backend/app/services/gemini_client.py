# Wrapper around Google's genai SDK to get structured Pydantic responses
import os
import json
from typing import Optional, Type, TypeVar
from pydantic import BaseModel
from app.config import settings

T = TypeVar("T", bound=BaseModel)

class GeminiService:
    def __init__(self):
        # read api key and target model from our config
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        
        # initialize client only if key is given
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Warning: Failed to initialize Google GenAI Client: {e}")

    @property
    def is_available(self) -> bool:
        # return true if client is ready to call
        return self._client is not None

    def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None
    ) -> Optional[T]:
        # returns None if offline or no api key configured
        if not self.is_available:
            return None
        
        try:
            from google.genai import types
            # enforce json mime and response_schema so Gemini returns matching json
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
                system_instruction=system_instruction
            )
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            # parse directly into our Pydantic model
            return response_schema.model_validate_json(response.text)
        except Exception as e:
            print(f"Gemini API generation error: {e}")
            return None

# global instance for the app
gemini_service = GeminiService()
