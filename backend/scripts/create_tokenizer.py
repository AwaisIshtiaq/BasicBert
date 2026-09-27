import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.tokenizer import BasicBERTTokenizer

def main():
    # Create folders if they don't exist
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("data/raw", exist_ok=True)

    # Dummy English + Urdu style texts for testing
    texts = [
        "this is a simple english sentence for testing",
        "another example sentence to train the model",
        "basic bert is a from scratch implementation",
        "we are building a transformer encoder only model",
        "masked language modeling is the main objective",
        "this movie is amazing and wonderful",
        "I really loved this film",
        "what a terrible and boring movie",
        "یہ ایک آسان جملہ ہے",               # simple Urdu
        "میں یہ فلم بہت پسند کرتا ہوں",     # Urdu
        "یہ بہت بری فلم ہے",
        "basicbert english and urdu support"
    ] * 20

    # Save temporary text file
    raw_path = "data/raw/sample.txt"
    with open(raw_path, "w", encoding="utf-8") as f:
        for line in texts:
            f.write(line + "\n")

    # Train tokenizer
    tokenizer = BasicBERTTokenizer(vocab_size=8000)
    tokenizer.train(files=[raw_path], save_path="data/processed/tokenizer.json")

    print("Tokenizer created successfully!")
    print(f"Vocab size: {tokenizer.get_vocab_size()}")

if __name__ == "__main__":
    main()