import sys
from pathlib import Path

# Add ml root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.chatbot import FinancialChatbot

def test_chatbot():
    print("Initializing FinancialChatbot...")
    bot = FinancialChatbot()
    
    # Query 1: Valid Financial Question
    q1 = "What is dollar cost averaging?"
    print(f"\n--- Testing Valid Query: '{q1}' ---")
    res1 = bot.chat(q1)
    print("Answer:\n", res1["answer"])
    print("Sources:", res1["sources"])
    
    # Query 2: Off-topic Non-Financial Question
    q2 = "Who won the FIFA World Cup?"
    print(f"\n--- Testing Off-Topic Query: '{q2}' ---")
    res2 = bot.chat(q2)
    print("Answer:\n", res2["answer"])
    print("Sources:", res2["sources"])

if __name__ == "__main__":
    test_chatbot()
