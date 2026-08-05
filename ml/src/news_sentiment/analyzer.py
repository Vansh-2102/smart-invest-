from transformers import pipeline
from typing import List, Dict
import re

class NewsSentimentAnalyzer:
    def __init__(self):
        self.classifier = pipeline(
            "text-classification",
            model="mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis",
            return_all_scores=True
        )
        self.labels = ['negative', 'neutral', 'positive']
    
    def clean_text(self, text: str) -> str:
        text = re.sub(r'http\S+', '', text)
        text = re.sub(r'@\w+', '', text)
        text = re.sub(r'#', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def analyze_single(self, text: str) -> Dict:
        cleaned_text = self.clean_text(text)
        results = self.classifier(cleaned_text)[0]
        
        scores = {r['label']: r['score'] for r in results}
        
        max_label = max(scores, key=scores.get)
        
        return {
            'text': cleaned_text,
            'sentiment': max_label,
            'confidence': scores[max_label],
            'scores': scores
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict]:
        return [self.analyze_single(text) for text in texts]
    
    def aggregate_sentiment(self, analyses: List[Dict]) -> Dict:
        if not analyses:
            return {'overall_sentiment': 'neutral', 'average_score': 0.0}
        
        total_pos = sum(1 for a in analyses if a['sentiment'] == 'positive')
        total_neg = sum(1 for a in analyses if a['sentiment'] == 'negative')
        total_neu = sum(1 for a in analyses if a['sentiment'] == 'neutral')
        
        avg_pos = sum(a['scores']['positive'] for a in analyses) / len(analyses)
        avg_neg = sum(a['scores']['negative'] for a in analyses) / len(analyses)
        
        if avg_pos > avg_neg:
            overall = 'positive'
        elif avg_neg > avg_pos:
            overall = 'negative'
        else:
            overall = 'neutral'
        
        return {
            'overall_sentiment': overall,
            'total_articles': len(analyses),
            'counts': {
                'positive': total_pos,
                'negative': total_neg,
                'neutral': total_neu
            },
            'average_scores': {
                'positive': avg_pos,
                'negative': avg_neg,
                'neutral': sum(a['scores']['neutral'] for a in analyses) / len(analyses)
            }
        }
