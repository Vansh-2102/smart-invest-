import os

from dotenv import load_dotenv
from typing import List, Dict
from langchain_groq import ChatGroq  # pyrefly: ignore [missing-import]
from langchain_core.prompts import ChatPromptTemplate  # pyrefly: ignore [missing-import]
from langchain_core.output_parsers import StrOutputParser  # pyrefly: ignore [missing-import]
from duckduckgo_search import DDGS  # pyrefly: ignore [missing-import]

load_dotenv()

class FinancialChatbot:
    def __init__(self):
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            print("Warning: GROQ_API_KEY is not set in environment variables.")
        
        model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        
        # Initialize Groq LLM model
        self.llm = ChatGroq(
            api_key=groq_api_key,
            model_name=model_name,
            temperature=0.2
        )
        
        # Strict Financial Guardrail Prompt Template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a specialized AI Financial Advisor and Analyst.

CRITICAL INSTRUCTIONS & GUARDRAILS:
1. TOPIC ENFORCEMENT: You must ONLY answer questions directly related to finance, personal finance, investing, stock markets, equities, bonds, mutual funds, ETFs, cryptocurrencies, banking, macroeconomic policy, corporate finance, taxes, real estate, and financial education.
2. REJECTION OF OFF-TOPIC QUERIES: If the user asks about ANY non-financial topic (e.g. sports, entertainment, movies, general programming, cooking, history, science, fiction, etc.), you MUST decline politely with the exact message:
   "I am a specialized financial AI assistant. I can only assist with finance, market analysis, and investment-related topics."
3. ACCURACY & CONTEXT: When answering valid finance questions, utilize the provided live web search context to supply factual, up-to-date, and precise information.
4. FORMATTING: Structure your response cleanly using GitHub-flavored markdown with clear bullet points where helpful.

LIVE WEB SEARCH CONTEXT:
{context}"""),
            ("human", "{input}")
        ])

    def search_duckduckgo(self, query: str, max_results: int = 3) -> tuple[str, List[str]]:
        """
        Fetch real-time web search snippets from DuckDuckGo for the query.
        Returns a formatted context string and list of source URLs.
        """
        sources = []
        snippets = []
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(f"financial market {query}", max_results=max_results))
                for r in results:
                    url = r.get("href", "")
                    body = r.get("body", "")
                    title = r.get("title", "")
                    if url:
                        sources.append(url)
                    snippets.append(f"Title: {title}\nSnippet: {body}\nURL: {url}")
        except Exception as e:
            print(f"DuckDuckGo search error: {e}")
            snippets.append("Live web search unavailable at the moment. Responding using base financial knowledge.")
        
        formatted_context = "\n\n---\n\n".join(snippets) if snippets else "No live search results available."
        return formatted_context, sources

    def chat(self, query: str) -> Dict:
        """
        Processes a user query by fetching DuckDuckGo web results, passing through
        Groq LLM with strict finance guardrails, and returning structured output.
        """
        # Step 1: Live Web Search Context Retrieval via DuckDuckGo
        context_str, sources = self.search_duckduckgo(query)
        
        # Step 2: Build Chain & Execute Inference via ChatGroq
        chain = self.prompt_template | self.llm | StrOutputParser()
        
        try:
            answer = chain.invoke({
                "context": context_str,
                "input": query
            })
        except Exception as e:
            print(f"Error during Groq LLM inference: {e}")
            answer = "Sorry, I encountered an error communicating with the Groq AI service. Please verify your GROQ_API_KEY."
            sources = []
            
        return {
            "query": query,
            "answer": answer,
            "sources": sources if sources else ["DuckDuckGo Web Search / Groq AI"]
        }
