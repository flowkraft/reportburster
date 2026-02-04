"""
Alternative LLM Providers for Chat2DB

If you don't have Letta AI, you can use other providers:
- OpenAI (direct)
- OpenRouter (100+ models)
- Ollama (local, private)
"""

import os
import re
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from dataclasses import dataclass


@dataclass
class LLMResponse:
    """Generic LLM response."""
    content: str
    sql: Optional[str] = None


class BaseLLMProvider(ABC):
    """Base class for LLM providers."""
    
    SQL_SYSTEM_PROMPT = """You are an expert SQL assistant. When given a question and database schema:
1. Generate ONLY the SQL query - no explanations, no markdown
2. Use standard SQL syntax
3. Be conservative - use LIMIT clauses
4. Never generate DELETE, DROP, UPDATE, TRUNCATE statements"""
    
    @abstractmethod
    def generate_sql(self, question: str, schema: str) -> LLMResponse:
        """Generate SQL from natural language."""
        pass
    
    @abstractmethod
    def explain_results(self, question: str, sql: str, results: str) -> LLMResponse:
        """Explain query results."""
        pass
    
    def _extract_sql(self, text: str) -> Optional[str]:
        """Extract SQL from response text."""
        if not text:
            return None
        
        # Try code blocks
        code_pattern = r'```(?:sql)?\s*([\s\S]*?)```'
        matches = re.findall(code_pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip()
        
        # Try direct SELECT/WITH
        sql_pattern = r'((?:SELECT|WITH)\s+[\s\S]*?(?:;|$))'
        matches = re.findall(sql_pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip()
        
        if text.strip().upper().startswith(('SELECT', 'WITH')):
            return text.strip()
        
        return None


class OpenAIProvider(BaseLLMProvider):
    """OpenAI direct API provider."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        self.model = model or os.environ.get('LLM_MODEL_NAME', 'gpt-4o-mini')
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not set")
        
        from openai import OpenAI
        self.client = OpenAI(api_key=self.api_key)
    
    def generate_sql(self, question: str, schema: str) -> LLMResponse:
        prompt = f"Database schema:\n{schema}\n\nQuestion: {question}\n\nGenerate only the SQL query."
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SQL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        
        content = response.choices[0].message.content
        return LLMResponse(content=content, sql=self._extract_sql(content))
    
    def explain_results(self, question: str, sql: str, results: str) -> LLMResponse:
        prompt = f"Question: {question}\nSQL: {sql}\nResults:\n{results}\n\nExplain these results concisely."
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return LLMResponse(content=response.choices[0].message.content)


class OpenRouterProvider(BaseLLMProvider):
    """OpenRouter API provider (access to 100+ models)."""
    
    def __init__(self, 
                 api_key: Optional[str] = None, 
                 model: str = "mistralai/mistral-7b-instruct"):
        self.api_key = api_key or os.environ.get('OPENROUTER_API_KEY')
        self.model = model or os.environ.get('LLM_MODEL_NAME', 'mistralai/mistral-7b-instruct')
        self.base_url = os.environ.get('OPENAI_API_BASE', 'https://openrouter.ai/api/v1')
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not set")
        
        from openai import OpenAI
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
    
    def generate_sql(self, question: str, schema: str) -> LLMResponse:
        prompt = f"Database schema:\n{schema}\n\nQuestion: {question}\n\nGenerate only the SQL query."
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SQL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        
        content = response.choices[0].message.content
        return LLMResponse(content=content, sql=self._extract_sql(content))
    
    def explain_results(self, question: str, sql: str, results: str) -> LLMResponse:
        prompt = f"Question: {question}\nSQL: {sql}\nResults:\n{results}\n\nExplain these results concisely."
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return LLMResponse(content=response.choices[0].message.content)


class OllamaProvider(BaseLLMProvider):
    """Ollama local LLM provider."""
    
    def __init__(self, 
                 base_url: Optional[str] = None, 
                 model: str = "llama3"):
        self.base_url = base_url or os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model = model or os.environ.get('LLM_MODEL_NAME', 'llama3')
        
        import ollama
        self.client = ollama
    
    def generate_sql(self, question: str, schema: str) -> LLMResponse:
        prompt = f"{self.SQL_SYSTEM_PROMPT}\n\nDatabase schema:\n{schema}\n\nQuestion: {question}\n\nGenerate only the SQL query."
        
        response = self.client.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response['message']['content']
        return LLMResponse(content=content, sql=self._extract_sql(content))
    
    def explain_results(self, question: str, sql: str, results: str) -> LLMResponse:
        prompt = f"Question: {question}\nSQL: {sql}\nResults:\n{results}\n\nExplain these results concisely."
        
        response = self.client.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return LLMResponse(content=response['message']['content'])


def get_llm_provider() -> BaseLLMProvider:
    """
    Auto-detect and return the appropriate LLM provider based on environment.
    
    Checks LLM_VENDOR env var, or tries providers in order:
    1. Letta (if LETTA_AGENT_ID is set)
    2. OpenRouter (if OPENROUTER_API_KEY is set)
    3. OpenAI (if OPENAI_API_KEY is set)
    4. Ollama (if OLLAMA_BASE_URL is set or localhost:11434 responds)
    """
    vendor = os.environ.get('LLM_VENDOR', '').lower()
    
    if vendor == 'openrouter' or os.environ.get('OPENROUTER_API_KEY'):
        return OpenRouterProvider()
    elif vendor == 'openai' or os.environ.get('OPENAI_API_KEY'):
        return OpenAIProvider()
    elif vendor == 'ollama':
        return OllamaProvider()
    else:
        # Default to Letta (handled by main Chat2DB class)
        raise ValueError("No LLM provider configured. Set LLM_VENDOR in .env")
