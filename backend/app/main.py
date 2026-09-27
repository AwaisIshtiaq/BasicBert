from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    MLMRequest, MLMResponse, MLMPrediction,
    ClassificationRequest, ClassificationResponse,
    HealthResponse
)
from app.dependencies import get_predictor
from src.inference import BasicBERTPredictor

app = FastAPI(
    title="BasicBERT API",
    description="A from-scratch BERT model supporting Masked Language Modeling and Classification (English + Urdu)",
    version="1.0.0"
)

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=HealthResponse)
def health_check(predictor: BasicBERTPredictor = Depends(get_predictor)):
    return {
        "status": "ok",
        "model_loaded": predictor is not None
    }

@app.post("/predict/mlm", response_model=MLMResponse)
def predict_mlm(request: MLMRequest, predictor: BasicBERTPredictor = Depends(get_predictor)):
    try:
        results = predictor.predict_mlm(request.text, top_k=request.top_k)

        formatted_predictions = []
        for mask_preds in results:
            formatted_predictions.append([
                MLMPrediction(token=p["token"], probability=p["probability"])
                for p in mask_preds
            ])

        return {
            "input_text": request.text,
            "predictions": formatted_predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/classification", response_model=ClassificationResponse)
def predict_classification(request: ClassificationRequest, predictor: BasicBERTPredictor = Depends(get_predictor)):
    try:
        result = predictor.predict_classification(request.text)

        return {
            "text": request.text,
            "label": result["label"],
            "confidence": result["confidence"],
            "probabilities": result["probabilities"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))