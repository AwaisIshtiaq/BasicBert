import torch
import torch.nn.functional as F

def compute_mlm_accuracy(logits, labels):
    """
    Compute accuracy for Masked Language Modeling.
    Only calculates accuracy on masked tokens (labels != -100)
    """
    # logits: (batch_size, seq_len, vocab_size)
    # labels: (batch_size, seq_len)

    preds = torch.argmax(logits, dim=-1)

    mask = labels != -100
    correct = (preds == labels) & mask

    accuracy = correct.sum().float() / mask.sum().float()
    return accuracy.item()

def compute_classification_accuracy(logits, labels):
    """
    Compute accuracy for classification tasks.
    """
    preds = torch.argmax(logits, dim=-1)
    correct = (preds == labels).float()
    accuracy = correct.mean().item()
    return accuracy

def compute_loss(logits, labels, task="mlm"):
    """
    Compute loss based on task.
    """
    if task == "mlm":
        # logits: (batch, seq_len, vocab_size)
        # labels: (batch, seq_len)
        loss = F.cross_entropy(
            logits.view(-1, logits.size(-1)),
            labels.view(-1),
            ignore_index=-100
        )
    elif task == "classification":
        loss = F.cross_entropy(logits, labels)
    else:
        raise ValueError(f"Unknown task: {task}")

    return loss