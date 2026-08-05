import os
import sys
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from transformers import (
    DistilBertTokenizer,
    DistilBertForSequenceClassification,
    TrainingArguments,
    Trainer,
    pipeline
)
import torch

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def load_sentiment_data():
    data_path = Path(__file__).parent.parent.parent / "data" / "financial_sentiment" / "data.csv"
    df = pd.read_csv(data_path, encoding='latin-1')
    
    # Rename columns to standard format
    df = df.rename(columns={'Sentence': 'text', 'Sentiment': 'sentiment'})
    
    # Map sentiments to labels
    label_map = {'negative': 0, 'neutral': 1, 'positive': 2}
    df['label'] = df['sentiment'].map(label_map)
    
    return df

class FinancialSentimentDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

def train_sentiment_model():
    df = load_sentiment_data()
    
    # Split data
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['label'])
    
    # Load tokenizer
    tokenizer = DistilBertTokenizer.from_pretrained("mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis")
    
    # Tokenize
    train_encodings = tokenizer(train_df['text'].tolist(), truncation=True, padding=True, max_length=128)
    test_encodings = tokenizer(test_df['text'].tolist(), truncation=True, padding=True, max_length=128)
    
    # Create datasets
    train_dataset = FinancialSentimentDataset(train_encodings, train_df['label'].tolist())
    test_dataset = FinancialSentimentDataset(test_encodings, test_df['label'].tolist())
    
    # Load model
    model = DistilBertForSequenceClassification.from_pretrained(
        "mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis",
        num_labels=3
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir='./models/sentiment_model',
        num_train_epochs=3,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=64,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir='./logs',
        logging_steps=10,
        evaluation_strategy="epoch"
    )
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset
    )
    
    # Train
    trainer.train()
    
    # Evaluate
    predictions = trainer.predict(test_dataset)
    preds = predictions.predictions.argmax(-1)
    print(f"Test Accuracy: {accuracy_score(test_df['label'], preds):.4f}")
    print("\nClassification Report:")
    print(classification_report(test_df['label'], preds))
    
    # Save model
    model.save_pretrained('./models/sentiment_model')
    tokenizer.save_pretrained('./models/sentiment_model')
    print("Model saved!")

if __name__ == "__main__":
    train_sentiment_model()
