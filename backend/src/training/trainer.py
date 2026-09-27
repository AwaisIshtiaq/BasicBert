import os
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

from src.training.optimizer import get_optimizer, get_scheduler
from src.training.metrics import compute_loss, compute_mlm_accuracy, compute_classification_accuracy

class Trainer:
    def __init__(
        self,
        model,
        train_dataset,
        val_dataset=None,
        tokenizer=None,
        config: dict = None,
        collator=None,
        device: str = None
    ):
        self.model = model
        self.train_dataset = train_dataset
        self.val_dataset = val_dataset
        self.tokenizer = tokenizer
        self.config = config or {}
        self.collator = collator

        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

        # Training hyperparameters
        self.batch_size = self.config.get("batch_size", 16)
        self.epochs = self.config.get("epochs", 3)
        self.gradient_accumulation_steps = self.config.get("gradient_accumulation_steps", 1)
        self.max_grad_norm = self.config.get("max_grad_norm", 1.0)
        self.task = self.config.get("task", "mlm")
        self.log_every = self.config.get("log_every", 50)
        self.eval_every = self.config.get("eval_every", 500)
        self.save_every = self.config.get("save_every", 1000)
        self.output_dir = self.config.get("output_dir", "checkpoints")

        os.makedirs(self.output_dir, exist_ok=True)

        # DataLoaders
        self.train_loader = DataLoader(
            self.train_dataset,
            batch_size=self.batch_size,
            shuffle=True,
            collate_fn=self.collator,
            num_workers=0
        )

        self.val_loader = None
        if self.val_dataset is not None:
            self.val_loader = DataLoader(
                self.val_dataset,
                batch_size=self.batch_size,
                shuffle=False,
                collate_fn=self.collator,
                num_workers=0
            )

        # Optimizer & Scheduler
        num_training_steps = len(self.train_loader) * self.epochs // self.gradient_accumulation_steps
        self.optimizer = get_optimizer(self.model, self.config)
        self.scheduler = get_scheduler(self.optimizer, self.config, num_training_steps)

        self.global_step = 0
        self.best_val_loss = float("inf")

    def train(self):
        self.model.train()
        print(f"Starting training on {self.device} | Task: {self.task}")

        for epoch in range(self.epochs):
            print(f"\n====== Epoch {epoch + 1}/{self.epochs} ======")
            epoch_loss = 0.0
            epoch_acc = 0.0
            num_batches = 0

            progress_bar = tqdm(self.train_loader, desc=f"Epoch {epoch + 1}")

            for step, batch in enumerate(progress_bar):
                input_ids = batch["input_ids"].to(self.device)
                attention_mask = batch["attention_mask"].to(self.device)
                labels = batch["labels"].to(self.device)

                # Forward
                logits = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    task=self.task
                )

                loss = compute_loss(logits, labels, task=self.task)
                loss = loss / self.gradient_accumulation_steps
                loss.backward()

                if (step + 1) % self.gradient_accumulation_steps == 0:
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.max_grad_norm)
                    self.optimizer.step()
                    self.scheduler.step()
                    self.optimizer.zero_grad()
                    self.global_step += 1

                # Metrics
                with torch.no_grad():
                    if self.task == "mlm":
                        acc = compute_mlm_accuracy(logits, labels)
                    else:
                        acc = compute_classification_accuracy(logits, labels)

                epoch_loss += loss.item() * self.gradient_accumulation_steps
                epoch_acc += acc
                num_batches += 1

                progress_bar.set_postfix({
                    "loss": f"{loss.item() * self.gradient_accumulation_steps:.4f}",
                    "acc": f"{acc:.4f}",
                    "lr": f"{self.scheduler.get_last_lr()[0]:.2e}"
                })

                # Logging
                if self.global_step % self.log_every == 0:
                    avg_loss = epoch_loss / num_batches
                    avg_acc = epoch_acc / num_batches
                    print(f"Step {self.global_step} | Loss: {avg_loss:.4f} | Acc: {avg_acc:.4f}")

                # Evaluation
                if self.val_loader and self.global_step % self.eval_every == 0:
                    val_loss, val_acc = self.evaluate()
                    print(f"Validation | Loss: {val_loss:.4f} | Acc: {val_acc:.4f}")
                    self.model.train()

                    if val_loss < self.best_val_loss:
                        self.best_val_loss = val_loss
                        self.save_model("best_model.pt")

                # Save checkpoint
                if self.global_step % self.save_every == 0:
                    self.save_model(f"checkpoint_step_{self.global_step}.pt")

            # End of epoch
            avg_epoch_loss = epoch_loss / num_batches
            avg_epoch_acc = epoch_acc / num_batches
            print(f"Epoch {epoch + 1} finished | Loss: {avg_epoch_loss:.4f} | Acc: {avg_epoch_acc:.4f}")

            self.save_model(f"epoch_{epoch + 1}.pt")

        print("\nTraining completed!")
        self.save_model("final_model.pt")

    @torch.no_grad()
    def evaluate(self):
        self.model.eval()
        total_loss = 0.0
        total_acc = 0.0
        num_batches = 0

        for batch in self.val_loader:
            input_ids = batch["input_ids"].to(self.device)
            attention_mask = batch["attention_mask"].to(self.device)
            labels = batch["labels"].to(self.device)

            logits = self.model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                task=self.task
            )

            loss = compute_loss(logits, labels, task=self.task)

            if self.task == "mlm":
                acc = compute_mlm_accuracy(logits, labels)
            else:
                acc = compute_classification_accuracy(logits, labels)

            total_loss += loss.item()
            total_acc += acc
            num_batches += 1

        avg_loss = total_loss / max(num_batches, 1)
        avg_acc = total_acc / max(num_batches, 1)
        return avg_loss, avg_acc

    def save_model(self, filename: str):
        path = os.path.join(self.output_dir, filename)
        torch.save({
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "scheduler_state_dict": self.scheduler.state_dict(),
            "global_step": self.global_step,
            "config": self.config
        }, path)
        print(f"Model saved → {path}")