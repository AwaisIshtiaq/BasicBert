from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace
from tokenizers.processors import TemplateProcessing
import os

class BasicBERTTokenizer:
    def __init__(self, vocab_size: int = 30000):
        self.vocab_size = vocab_size
        self.tokenizer = None

        self.special_tokens = [
            "<PAD>",
            "<UNK>",
            "<SOS>",
            "<EOS>",
            "<MASK>",
            "<CLS>",
            "<SEP>"
        ]

    def train(self, files: list, save_path: str = "tokenizer.json"):
        """
        Train a BPE tokenizer on English + Urdu text files.
        files: list of text file paths
        """
        self.tokenizer = Tokenizer(BPE(unk_token="<UNK>"))
        self.tokenizer.pre_tokenizer = Whitespace()

        trainer = BpeTrainer(
            vocab_size=self.vocab_size,
            special_tokens=self.special_tokens,
            min_frequency=2,
            show_progress=True
        )

        self.tokenizer.train(files, trainer)

        # Add post processing (CLS and SEP style)
        self.tokenizer.post_processor = TemplateProcessing(
            single="<CLS> $A <SEP>",
            pair="<CLS> $A <SEP> $B <SEP>",
            special_tokens=[
                ("<CLS>", self.tokenizer.token_to_id("<CLS>")),
                ("<SEP>", self.tokenizer.token_to_id("<SEP>")),
            ],
        )

        self.tokenizer.enable_padding(
            pad_id=self.tokenizer.token_to_id("<PAD>"),
            pad_token="<PAD>"
        )
        self.tokenizer.enable_truncation(max_length=512)

        # Save
        os.makedirs(os.path.dirname(save_path) if os.path.dirname(save_path) else ".", exist_ok=True)
        self.tokenizer.save(save_path)
        print(f"Tokenizer saved at: {save_path}")

    def load(self, path: str = "tokenizer.json"):
        """Load a previously trained tokenizer"""
        self.tokenizer = Tokenizer.from_file(path)
        print(f"Tokenizer loaded from: {path}")

    def encode(self, text: str, add_special_tokens: bool = True):
        if self.tokenizer is None:
            raise ValueError("Tokenizer is not loaded or trained yet.")
        return self.tokenizer.encode(text, add_special_tokens=add_special_tokens)

    def decode(self, ids: list, skip_special_tokens: bool = True):
        if self.tokenizer is None:
            raise ValueError("Tokenizer is not loaded or trained yet.")
        return self.tokenizer.decode(ids, skip_special_tokens=skip_special_tokens)

    def token_to_id(self, token: str):
        return self.tokenizer.token_to_id(token)

    def get_vocab_size(self):
        return self.tokenizer.get_vocab_size()