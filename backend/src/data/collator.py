import torch
import random

class MLMCollator:
    """
    Data Collator for Masked Language Modeling (Basic BERT style)
    """
    def __init__(self, tokenizer, mlm_probability=0.15):
        self.tokenizer = tokenizer
        self.mlm_probability = mlm_probability

        self.mask_token_id = tokenizer.token_to_id("<MASK>")
        self.pad_token_id = tokenizer.token_to_id("<PAD>")
        self.cls_token_id = tokenizer.token_to_id("<CLS>")
        self.sep_token_id = tokenizer.token_to_id("<SEP>")
        self.unk_token_id = tokenizer.token_to_id("<UNK>")

    def __call__(self, batch):
        input_ids = torch.stack([item["input_ids"] for item in batch])
        attention_mask = torch.stack([item["attention_mask"] for item in batch])

        # Create labels (copy of input_ids)
        labels = input_ids.clone()

        # Create probability matrix
        probability_matrix = torch.full(labels.shape, self.mlm_probability)

        # Do not mask special tokens
        special_tokens_mask = (
            (input_ids == self.cls_token_id) |
            (input_ids == self.sep_token_id) |
            (input_ids == self.pad_token_id)
        )
        probability_matrix.masked_fill_(special_tokens_mask, value=0.0)

        # Decide which tokens to mask
        masked_indices = torch.bernoulli(probability_matrix).bool()
        labels[~masked_indices] = -100          # Only compute loss on masked tokens

        # 80% of the time → replace with [MASK]
        indices_replaced = torch.bernoulli(torch.full(labels.shape, 0.8)).bool() & masked_indices
        input_ids[indices_replaced] = self.mask_token_id

        # 10% of the time → replace with random token
        indices_random = torch.bernoulli(torch.full(labels.shape, 0.5)).bool() & masked_indices & ~indices_replaced
        random_tokens = torch.randint(len(self.tokenizer.tokenizer.get_vocab()), labels.shape, dtype=torch.long)
        input_ids[indices_random] = random_tokens[indices_random]

        # Remaining 10% → keep original token

        batch_output = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "labels": labels
        }

        # If classification labels exist
        if "labels" in batch[0] and not torch.is_tensor(batch[0].get("labels")) is False:
            if "labels" in batch[0] and batch[0]["labels"].dim() == 0:
                batch_output["class_labels"] = torch.stack([item["labels"] for item in batch])

        return batch_output