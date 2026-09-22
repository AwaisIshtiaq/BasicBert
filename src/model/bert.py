import torch
import torch.nn as nn

from .embedding import TokenEmbedding, PositionalEncoding
from .encoder import Encoder
from .heads import MaskedLMHead, ClassificationHead

class BasicBERT(nn.Module):
    """
    BasicBERT - A from-scratch BERT style model
    Using the Encoder we built earlier.
    """
    def __init__(
        self,
        vocab_size: int,
        d_model: int = 512,
        num_heads: int = 8,
        num_layers: int = 6,
        d_ff: int = 2048,
        max_len: int = 512,
        num_classes: int = 2,
        dropout: float = 0.1
    ):
        super().__init__()

        # Embedding layers
        self.token_embedding = TokenEmbedding(vocab_size, d_model)
        self.positional_encoding = PositionalEncoding(d_model, max_len, dropout)

        # Encoder (the one we built)
        self.encoder = Encoder(
            d_model=d_model,
            num_heads=num_heads,
            num_layers=num_layers,
            d_ff=d_ff,
            dropout=dropout
        )

        # Heads
        self.mlm_head = MaskedLMHead(d_model, vocab_size)
        self.classification_head = ClassificationHead(d_model, num_classes, dropout)

    def forward(self, input_ids, attention_mask=None, labels=None, task="mlm"):
        """
        input_ids      : (batch_size, seq_len)
        attention_mask : (batch_size, seq_len) optional
        task           : "mlm" or "classification"
        """

        # 1. Token + Positional Embedding
        x = self.token_embedding(input_ids)
        x = self.positional_encoding(x)

        # 2. Encoder
        encoded = self.encoder(x, mask=attention_mask)

        # 3. Task-specific head
        if task == "mlm":
            logits = self.mlm_head(encoded)
            return logits

        elif task == "classification":
            logits = self.classification_head(encoded)
            return logits

        else:
            raise ValueError("task must be 'mlm' or 'classification'")