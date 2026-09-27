from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class MLMRequest(BaseModel):
    text: str = Field(..., example="this is a <MASK> sentence")
    top_k: int = Field(5, ge=1, le=20)

class MLMPrediction(BaseModel):
    token: str
    probability: float

class MLMResponse(BaseModel):
    input_text: str
    predictions: List[List[MLMPrediction]]

class ClassificationRequest(BaseModel):
    text: str = Field(..., example="this movie is amazing")

class ClassificationResponse(BaseModel):
    text: str
    label: str
    confidence: float
    probabilities: Dict[str, float]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool