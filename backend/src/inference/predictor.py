import torch
from src.model import BasicBERT
from src.data.tokenizer import BasicBERTTokenizer

class BasicBERTPredictor:
    def __init__(self, model_path: str, tokenizer_path: str, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        # Load tokenizer
        self.tokenizer = BasicBERTTokenizer()
        self.tokenizer.load(tokenizer_path)

        # Load model
        checkpoint = torch.load(model_path, map_location=self.device)
        config = checkpoint.get("config", {})

        self.model = BasicBERT(
            vocab_size=self.tokenizer.get_vocab_size(),
            d_model=config.get("d_model", 512),
            num_heads=config.get("num_heads", 8),
            num_layers=config.get("num_layers", 6),
            d_ff=config.get("d_ff", 2048),
            max_len=config.get("max_len", 512),
            dropout=config.get("dropout", 0.1)
        )

        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

        print(f"Model loaded from {model_path}")
        print(f"Running on {self.device}")

    @torch.no_grad()
    def predict_mlm(self, text: str, top_k: int = 5):
        """
        Simple Masked Language Modeling prediction.
        Example: "this is a [MASK] sentence"
        """
        # Replace [MASK] with the actual mask token if needed
        text = text.replace("[MASK]", "<MASK>")

        encoding = self.tokenizer.encode(text)
        input_ids = torch.tensor([encoding.ids]).to(self.device)

        logits = self.model(input_ids, task="mlm")

        # Find mask positions
        mask_token_id = self.tokenizer.token_to_id("<MASK>")
        mask_positions = (input_ids == mask_token_id).nonzero(as_tuple=True)[1]

        results = []
        for pos in mask_positions:
            pos_logits = logits[0, pos]
            probs = torch.softmax(pos_logits, dim=-1)
            top_probs, top_indices = torch.topk(probs, top_k)

            predictions = []
            for prob, idx in zip(top_probs, top_indices):
                token = self.tokenizer.decode([idx.item()])
                predictions.append({
                    "token": token,
                    "probability": round(prob.item(), 4)
                })
            results.append(predictions)

        return results

    @torch.no_grad()
    def predict_classification(self, text: str):
        """
        Classification prediction (positive / negative)
        """
        encoding = self.tokenizer.encode(text)
        input_ids = torch.tensor([encoding.ids]).to(self.device)

        logits = self.model(input_ids, task="classification")
        probs = torch.softmax(logits, dim=-1)
        pred_class = torch.argmax(probs, dim=-1).item()
        confidence = probs[0, pred_class].item()

        label = "Positive" if pred_class == 1 else "Negative"

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "probabilities": {
                "Negative": round(probs[0, 0].item(), 4),
                "Positive": round(probs[0, 1].item(), 4)
            }
        }