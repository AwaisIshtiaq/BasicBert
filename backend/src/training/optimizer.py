import torch
from torch.optim import AdamW
from torch.optim.lr_scheduler import LambdaLR
import math

def get_optimizer(model, config: dict):
    """
    Create AdamW optimizer
    """
    no_decay = ["bias", "LayerNorm.weight", "layer_norm.weight"]

    optimizer_grouped_parameters = [
        {
            "params": [p for n, p in model.named_parameters() 
                       if not any(nd in n for nd in no_decay) and p.requires_grad],
            "weight_decay": config.get("weight_decay", 0.01),
        },
        {
            "params": [p for n, p in model.named_parameters() 
                       if any(nd in n for nd in no_decay) and p.requires_grad],
            "weight_decay": 0.0,
        },
    ]

    optimizer = AdamW(
       optimizer_grouped_parameters,
        lr=float(config.get("learning_rate", 5e-5)),
        betas=tuple(config.get("betas", [0.9, 0.999])),
        eps=float(config.get("eps", 1e-8)),
    )

    return optimizer

def get_scheduler(optimizer, config: dict, num_training_steps: int):
    """
    Linear warmup + linear decay scheduler (BERT style)
    """
    warmup_steps = config.get("warmup_steps", None)
    warmup_ratio = config.get("warmup_ratio", 0.1)

    if warmup_steps is None:
        warmup_steps = int(num_training_steps * warmup_ratio)

    def lr_lambda(current_step: int):
        if current_step < warmup_steps:
            return float(current_step) / float(max(1, warmup_steps))
        return max(
            0.0,
            float(num_training_steps - current_step) / float(max(1, num_training_steps - warmup_steps))
        )

    scheduler = LambdaLR(optimizer, lr_lambda)
    return scheduler