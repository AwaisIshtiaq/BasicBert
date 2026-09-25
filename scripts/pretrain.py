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
    config_path = "configs/pretrain.yaml"
    config = load_config(config_path)

    print("Config loaded successfully!")
    print(f"Task: {config['training'].get('task', 'mlm')}")

    # ======================
    # 2. Load Tokenizer
    # ======================
    tokenizer = BasicBERTTokenizer()
    tokenizer_path = config["paths"]["tokenizer_path"]

    if os.path.exists(tokenizer_path):
        tokenizer.load(tokenizer_path)
        print(f"Tokenizer loaded from {tokenizer_path}")
    else:
        raise FileNotFoundError(
            f"Tokenizer not found at {tokenizer_path}.\n"
            "Please train/save the tokenizer first."
        )

    vocab_size = tokenizer.get_vocab_size()
    print(f"Vocab size: {vocab_size}")

    # ======================
    # 3. Prepare Dummy Data (for testing)
    # ======================
    # Replace this later with real English + Urdu data
    train_texts = [
        "this is a simple english sentence for testing",
        "another example sentence to train the model",
        "basic bert is a from scratch implementation",
        "we are building a transformer encoder only model",
        "masked language modeling is the main objective"
    ] * 50   # repeat to make a small dataset

    val_texts = [
        "this is a validation sentence",
        "checking how the model performs"
    ] * 10

    train_dataset = BasicBERTDataset(
        texts=train_texts,
        tokenizer=tokenizer,
        max_length=config["data"]["max_length"]
    )

    val_dataset = BasicBERTDataset(
        texts=val_texts,
        tokenizer=tokenizer,
        max_length=config["data"]["max_length"]
    )

    # ======================
    # 4. Collator
    # ======================
    collator = MLMCollator(
        tokenizer=tokenizer,
        mlm_probability=config["data"]["mlm_probability"]
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
        dropout=config["model"]["dropout"]
    )

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
    # 7. Start Training
    # ======================
    trainer.train()

if __name__ == "__main__":
    main()