import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.inference import BasicBERTPredictor

def main():
    # Paths
    model_path = "checkpoints/pretrain/final_model.pt"
    tokenizer_path = "data/processed/tokenizer.json"

    # Check if files exist
    if not os.path.exists(model_path):
        print(f"Model not found at: {model_path}")
        return
    if not os.path.exists(tokenizer_path):
        print(f"Tokenizer not found at: {tokenizer_path}")
        return

    # Load predictor
    predictor = BasicBERTPredictor(
        model_path=model_path,
        tokenizer_path=tokenizer_path
    )

    print("\n" + "="*50)
    print("Testing Masked Language Modeling")
    print("="*50)

    test_sentences = [
        "this is a <MASK> sentence",
        "basic bert is a <MASK> model",
        "I really <MASK> this film"
    ]

    for text in test_sentences:
        print(f"\nInput: {text}")
        results = predictor.predict_mlm(text, top_k=5)
        for i, preds in enumerate(results):
            print(f"Mask {i+1} predictions:")
            for p in preds:
                print(f"  → {p['token']}  ({p['probability']})")

    print("\n" + "="*50)
    print("Testing Classification (Note: model is only pretrained with MLM)")
    print("="*50)

    classification_texts = [
        "this movie is amazing and wonderful",
        "what a terrible and boring movie"
    ]

    for text in classification_texts:
        result = predictor.predict_classification(text)
        print(f"\nText: {text}")
        print(f"Prediction: {result['label']} (confidence: {result['confidence']})")

if __name__ == "__main__":
    main()