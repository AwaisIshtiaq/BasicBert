#  Tokenization
# Install hugging face tokenizers library


from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace
from tokenizers.processors import TemplateProcessing


import torch
import torch.nn as nn
import math


# Input Embeddings
class TokenEmbedding(nn.Module):
  """
        vocab_size : size of the vocabulary (from your tokenizer)
        d_model    : embedding dimension (e.g. 512)
  """

  def __init__(self, vocab_size: int, d_model: int):
    super().__init__()
    self.embedding = nn.Embedding(vocab_size, d_model)
    self.d_model = d_model
  def forward(self, x):
    """
        x: (batch_size, seq_len)  → token ids
        returns: (batch_size, seq_len, d_model)
    """
    # Scaling by sqrt(d_model) is from the original paper

    return self.embedding(x) * torch.sqrt(torch.tensor(self.d_model, dtype=torch.float32))




# Positional Encoding
# We’ll implement the original sinusoidal positional encoding from the “Attention is All You Need”

class PositionalEncoding(nn.Module):
  """
        d_model : embedding dimension
        max_len : maximum sequence length you expect
   """

  def __init__(self, d_model: int, max_len: int = 5000, dropout: float = 0.1):
    super().__init__()
    self.dropout = nn.Dropout(p=dropout)


    # Create a matrix of shape (max_len, d_model)
    pe = torch.zeros(max_len, d_model)

    position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
    div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))


    # Apply sin to even indices
    pe[:, 0::2] = torch.sin(position * div_term)

    # Apply cos to odd indices
    pe[:, 1::2] = torch.cos(position * div_term)

    pe = pe.unsqueeze(0)
    self.register_buffer('pe', pe)

  def forward(self, x):
      """
        x: (batch_size, seq_len, d_model)  ← output from TokenEmbedding
      """

      x = x + self.pe[:, :x.size(1), :]
      return self.dropout(x)


