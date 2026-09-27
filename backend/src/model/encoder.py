import torch
import torch.nn as nn
from .attention import MultiHeadAttention


# Residual Connection + LayerNorm (Add & Norm)
class AddNorm(nn.Module):
  """
        d_model : embedding dimension (e.g. 512)
  """
  def __init__(self, d_model: int, dropout: float = 0.1):

    super().__init__()
    self.norm = nn.LayerNorm(d_model)
    self.dropout = nn.Dropout(dropout)

  def forward(self, x, sublayer_output):
    """
        x               : original input
        sublayer_output : output from Multi-Head Attention or Feed-Forward
    """
    # Residual connection + Dropout + LayerNorm
    return self.norm(x + self.dropout(sublayer_output))





#  Feed-Forward Network(Position-wise)
class PositionwiseFeedForward(nn.Module):
  """
        d_model : embedding dimension (e.g. 512)
        d_ff    : hidden dimension of feed-forward (usually 4 * d_model → 2048)
  """
  def __init__(self, d_model: int, d_ff: int = 2048, dropout: float = 0.1):
    super().__init__()
    self.linear1 = nn.Linear(d_model, d_ff)
    self.linear2 = nn.Linear(d_ff, d_model)
    self.dropout = nn.Dropout(dropout)
    self.relu = nn.ReLU()


  def forward(self, x):
    """
        x shape: (batch_size, seq_len, d_model)
    """
    # First linear + ReLU
    x = self.linear1(x)
    x = self.relu(x)
    x = self.dropout(x)

    # Second linear
    x = self.linear2(x)
    return x




# Full Encoder Layer (with both Add & Norm)
class EncoderLayer(nn.Module):
    def __init__(self, d_model: int, num_heads: int, d_ff: int = 2048, dropout: float = 0.1):
        super().__init__()
        # Multi-Head Attention
        self.self_attn = MultiHeadAttention(d_model, num_heads, dropout)

        # Feed-Forward Network
        self.feed_forward = PositionwiseFeedForward(d_model, d_ff, dropout)

        #Two Add & Norm layers (as per the paper)
        self.add_norm1 = AddNorm(d_model, dropout)
        self.add_norm2 = AddNorm(d_model, dropout)


    def forward(self, x, mask=None):
      """
        x shape: (batch_size, seq_len, d_model)
      """
      # 1. Multi-Head Attention + Add & Norm
      attn_output, _ = self.self_attn(x, x, x, mask)
      x = self.add_norm1(x, attn_output)

      # 2. Feed-Forward + Add & Norm
      ff_output = self.feed_forward(x)
      x = self.add_norm2(x, ff_output)

      return x


# ALL Encoder layer(6 Encoder)
class Encoder(nn.Module):



  """
        d_model     : embedding dimension (e.g. 512)
        num_heads   : number of attention heads (e.g. 8)
        num_layers  : number of Encoder Layers (paper uses 6)
        d_ff        : feed-forward hidden size (paper uses 2048)
  """


  def __init__(self, d_model: int, num_heads: int, num_layers: int = 6, d_ff: int = 2048, dropout: float = 0.1):



    super().__init__()

        # Stack of Encoder Layers
    self.layers = nn.ModuleList([
            EncoderLayer(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])

    self.norm = nn.LayerNorm(d_model)

  def forward(self, x, mask=None):

    for layer in self.layers:
      x = layer(x, mask)

  # Final normalization
      x = self.norm(x)

      return x


