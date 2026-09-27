import torch
import torch.nn as nn

class MaskedLMHead(nn.Module):
    """
    Masked Language Modeling Head (Basic BERT style)
    """
    def __init__(self, d_model: int, vocab_size: int):
        super().__init__()
        self.dense = nn.Linear(d_model, d_model)
        self.activation = nn.GELU()          # BERT uses GELU (we can keep it basic)
        self.layer_norm = nn.LayerNorm(d_model)
        self.decoder = nn.Linear(d_model, vocab_size, bias=False)
        self.bias = nn.Parameter(torch.zeros(vocab_size))

        # Tie bias
        self.decoder.bias = self.bias

    def forward(self, hidden_states):
        """
        hidden_states: (batch_size, seq_len, d_model)
        returns: (batch_size, seq_len, vocab_size)
        """
        x = self.dense(hidden_states)
        x = self.activation(x)
        x = self.layer_norm(x)
        x = self.decoder(x)
        return x

class ClassificationHead(nn.Module):
    """
    Simple Classification Head for downstream tasks
    (e.g. Sentiment Analysis)
    """
    def __init__(self, d_model: int, num_classes: int, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(d_model, num_classes)

    def forward(self, hidden_states):
        """
        We usually take the [CLS] token (first token)
        hidden_states: (batch_size, seq_len, d_model)
        """
        cls_token = hidden_states[:, 0, :]      # Take [CLS] token
        cls_token = self.dropout(cls_token)
        logits = self.classifier(cls_token)
        return logits