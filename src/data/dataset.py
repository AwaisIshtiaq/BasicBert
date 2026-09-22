import torch
from torch.utils.data import Dataset

class BasicBERTDataset(Dataset):
    """
    Dataset for BasicBERT
    Supports both pre-training (MLM) and fine-tuning (classification)
    """
    def __init__(self, texts, labels=None, tokenizer=None, max_length=128):
        """
        texts      : list of strings
        labels     : list of integers (for classification) or None (for MLM)
        tokenizer  : BasicBERTTokenizer instance
        max_length : maximum sequence length
        """
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]

        # Encode the text
        encoding = self.tokenizer.encode(text, add_special_tokens=True)

        input_ids = encoding.ids[:self.max_length]

        # Padding
        padding_length = self.max_length - len(input_ids)
        input_ids = input_ids + [self.tokenizer.token_to_id("<PAD>")] * padding_length

        attention_mask = [1] * (self.max_length - padding_length) + [0] * padding_length

        item = {
            "input_ids": torch.tensor(input_ids, dtype=torch.long),
            "attention_mask": torch.tensor(attention_mask, dtype=torch.long)
        }

        # If labels are provided (for classification)
        if self.labels is not None:
            item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)

        return item