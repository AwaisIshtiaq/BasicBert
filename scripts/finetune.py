import os
import sys
import torch

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.config import load_config
from src.model import BasicBERT
from src.data import BasicBERTTokenizer, BasicBERTDataset, MLMCollator
from src.training import Trainer

def main():
    # ======================
    # 1. Load Config
    # ======================
    # You can create configs/finetune.yaml later.
    # For now we reuse pretrain config and override task.
    config = load_config("configs/pretrain.yaml")

    # Override for classification
    config["training"]["task"] = "classification"
    config["training"]["epochs"] = 3
    config["paths"]["output_dir"] = "checkpoints/finetune"

    print("Fine-tuning config loaded!")
    print(f"Task: {config['training']['task']}")

    # ======================
    # 2. Load Tokenizer
    # ======================
    tokenizer = BasicBERTTokenizer()
    tokenizer_path = config["paths"]["tokenizer_path"]

    if os.path.exists(tokenizer_path):
        tokenizer.load(tokenizer_path)
        print(f"Tokenizer loaded from {tokenizer_path}")
    else:
        raise FileNotFoundError(f"Tokenizer not found at {tokenizer_path}")

    vocab_size = tokenizer.get_vocab_size()

    # ======================
    # 3. Dummy Classification Data (for testing)
    # ======================
    # Replace later with real labeled data (English + Urdu)
    train_texts = [
        "this movie is amazing and wonderful",
        "I really loved this film",
        "what a terrible and boring movie",
        "I hated every minute of it",
        "great acting and beautiful story",
        "worst movie I have ever seen"
    ] * 20

    train_labels = [1, 1, 0, 0, 1, 0] * 20   # 1 = positive, 0 = negative

    val_texts = [
        "this is a good movie",
        "this is a bad movie"
    ] * 5
    val_labels = [1, 0] * 5

    train_dataset = BasicBERTDataset(
        texts=train_texts,
        labels=train_labels,
        tokenizer=tokenizer,
        max_length=config["data"]["max_length"]
    )

    val_dataset = BasicBERTDataset(
        texts=val_texts,
        labels=val_labels,
        tokenizer=tokenizer,
        max_length=config["data"]["max_length"]
    )

    # ======================
    # 4. Collator
    # ======================
    # For classification we can still use the same collator
    # (it will just ignore MLM specific parts if needed)
    collator = MLMCollator(
        tokenizer=tokenizer,
        mlm_probability=0.0   # no masking during fine-tuning
    )

    # ======================
    # 5. Model
    # ======================
    model = BasicBERT(
        vocab_size=vocab_size,
        d_model=config["model"]["d_model"],
        num_heads=config["model"]["num_heads"],
        num_layers=config["model"]["num_layers"],
        d_ff=config["model"]["d_ff"],
        max_len=config["model"]["max_len"],
        num_classes=2,
        dropout=config["model"]["dropout"]
    )

    # Optional: Load pretrained weights here later
    # checkpoint = torch.load("checkpoints/pretrain/best_model.pt")
    # model.load_state_dict(checkpoint["model_state_dict"], strict=False)

    print(f"Model created with {sum(p.numel() for p in model.parameters())/1e6:.2f}M parameters")

    # ======================
    # 6. Trainer
    # ======================
    train_config = {
        **config["training"],
        **config["optimizer"],
        **config["scheduler"],
        **config["logging"],
        "output_dir": config["paths"]["output_dir"]
    }

    trainer = Trainer(
        model=model,
        train_dataset=train_dataset,
        val_dataset=val_dataset,
        tokenizer=tokenizer,
        config=train_config,
        collator=collator
    )

    # ======================
    # 7. Start Fine-tuning
    # ======================
    trainer.train()

if __name__ == "__main__":
    main()