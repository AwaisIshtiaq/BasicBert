import torch
import torch.nn as nn
import math

class MultiHeadAttention(nn.Module):
  """
        d_model   : total embedding dimension (e.g. 512)
        num_heads : number of attention heads (e.g. 8)
  """
  def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):


    super().__init__()
    assert d_model % num_heads == 0
    self.d_model = d_model
    self.num_heads = num_heads
    self.d_k = d_model // num_heads

    # Linear layers for Q, K, V
    self.W_q = nn.Linear(d_model, d_model)
    self.W_k = nn.Linear(d_model, d_model)
    self.W_v = nn.Linear(d_model, d_model)

    # Final output projection
    self.W_o = nn.Linear(d_model, d_model)
    self.dropout = nn.Dropout(dropout)

  def scaled_dot_product_attention(self, Q, K, V, mask=None):

    """
        Q, K, V shape: (batch_size, num_heads, seq_len, d_k)
    """

    # 1. Calculate attention scores
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)


    # 2. Softmax
    attention_weights = torch.softmax(scores, dim=-1)
    attention_weights = self.dropout(attention_weights)


    # 3. Multiply by V
    output = torch.matmul(attention_weights, V)
    return output, attention_weights

  def forward(self, query, key, value, mask=None):
    """
        query, key, value shape: (batch_size, seq_len, d_model)
   """
    batch_size = query.size(0)

    # 1. Linear projections
    Q = self.W_q(query)
    K = self.W_k(key)
    V = self.W_v(value)


    # 2. Split into multiple heads
    Q = Q.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
    K = K.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
    V = V.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)


    # 3. Apply attention
    attn_output, attention_weights = self.scaled_dot_product_attention(Q, K, V, mask)

    # 4. Concatenate heads
    attn_output = attn_output.transpose(1, 2).contiguous()
    attn_output = attn_output.view(batch_size, -1, self.d_model)

    # 5. Final linear layer
    output = self.W_o(attn_output)
    return output, attention_weights
