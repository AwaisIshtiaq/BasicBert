from functools import lru_cache
from src.inference import BasicBERTPredictor

# Global predictor instance
_predictor = None

def get_predictor() -> BasicBERTPredictor:
    """
    Load the model only once (singleton pattern)
    """
    global _predictor

    if _predictor is None:
        model_path = "checkpoints/pretrain/final_model.pt"
        tokenizer_path = "data/processed/tokenizer.json"

        _predictor = BasicBERTPredictor(
            model_path=model_path,
            tokenizer_path=tokenizer_path
        )

    return _predictor