import torch
from src.model import BasicBERT

# Model configuration
vocab_size = 5000
d_model = 512
num_heads = 8
num_layers = 6
d_ff = 2048
num_classes = 2

# Create model
model = BasicBERT(
    vocab_size=vocab_size,
    d_model=d_model,
    num_heads=num_heads,
    num_layers=num_layers,
    d_ff=d_ff,
    num_classes=num_classes
)

# Dummy input
batch_size = 2
seq_len = 16
input_ids = torch.randint(0, vocab_size, (batch_size, seq_len))

print("Input shape:", input_ids.shape)

# Test 1: Masked Language Modeling
mlm_logits = model(input_ids, task="mlm")
print("MLM output shape:", mlm_logits.shape)   # Expected: (2, 16, 5000)

# Test 2: Classification
cls_logits = model(input_ids, task="classification")
print("Classification output shape:", cls_logits.shape)  # Expected: (2, 2)

print("\nBasicBERT is working correctly!")