"""
Letta AI Chat2DB Integration

Connects to the Athena AI agent for natural language to SQL generation.
Letta provides persistent memory and context awareness.

This module is simplified to use Athena only - the data & analytics oracle.
"""

import os
import json
import re
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

import httpx


@dataclass
class LettaMessage:
    """Represents a message in a Letta conversation."""
    role: str  # 'user' or 'assistant'
    content: str
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class LettaResponse:
    """Response from Letta AI agent."""
    content: str
    sql: Optional[str] = None
    messages: Optional[List[Dict]] = None
    raw_response: Optional[Dict] = None


class LettaChat2DB:
    """
    Letta AI integration for Chat2DB workflow.
    
    Connects to Athena (the data & analytics oracle) to:
    - Generate SQL from natural language
    - Explain query results
    - Maintain conversation context
    
    Usage:
        letta = LettaChat2DB()
        response = letta.generate_sql("Show top 5 customers by revenue")
        print(response.sql)
    """
    
    # System prompt for SQL generation
    SQL_SYSTEM_PROMPT = """You are Athena, the goddess of wisdom and expert SQL assistant.

Your role:
1. When given a natural language question about data, generate ONLY the SQL query
2. When given query results, explain them in plain English
3. Remember previous context in our conversation

Rules for SQL generation:
- Output ONLY the SQL query, no explanations or markdown
- Use standard SQL syntax
- Be conservative with data - use LIMIT clauses
- Never generate DELETE, DROP, UPDATE, TRUNCATE, or ALTER statements
- If unsure about the schema, ask for clarification

When explaining results:
- Be concise and highlight key insights
- Use bullet points for multiple findings
- Mention any notable patterns or anomalies"""
    
    def __init__(self,
                 base_url: Optional[str] = None,
                 agent_id: Optional[str] = None,
                 api_key: Optional[str] = None):
        """
        Initialize Letta AI client for Athena.
        
        Args:
            base_url: Letta server URL. Defaults to LETTA_API_BASE_URL env var.
            agent_id: Athena agent ID. Defaults to AGENT_ATHENA_ID env var.
            api_key: Optional API key. Defaults to LETTA_API_KEY env var.
        """
        self.base_url = (base_url or os.environ.get('LETTA_API_BASE_URL', 'http://localhost:8283')).rstrip('/')
        self.api_key = api_key or os.environ.get('LETTA_API_KEY')
        self.agent_id = agent_id or os.environ.get('AGENT_ATHENA_ID')
        
        self._client = httpx.Client(timeout=60.0)
        self._schema_context: Optional[str] = None
        
        if not self.agent_id:
            print("⚠️  AGENT_ATHENA_ID not set. Set it in your .env file.")
            print("   Example: AGENT_ATHENA_ID=agent-xxx-xxx-xxx")
        
    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for Letta API requests."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers
    
    def set_schema_context(self, schema: str):
        """
        Set the database schema context for Athena.
        
        Args:
            schema: Database schema description (tables, columns, types).
        """
        self._schema_context = schema
        
        # Optionally, update the agent's memory with schema context
        if self.agent_id:
            try:
                self._update_agent_memory(f"Database Schema:\n{schema}")
            except Exception as e:
                print(f"⚠️ Could not update agent memory: {e}")
    
    def _update_agent_memory(self, context: str):
        """Update the Letta agent's memory with new context."""
        url = f"{self.base_url}/v1/agents/{self.agent_id}/memory"
        
        payload = {
            "human": context
        }
        
        response = self._client.patch(url, json=payload, headers=self._get_headers())
        response.raise_for_status()
    
    def _build_sql_prompt(self, question: str) -> str:
        """Build the prompt for SQL generation."""
        prompt_parts = []
        
        if self._schema_context:
            prompt_parts.append(f"Database Schema:\n{self._schema_context}\n")
        
        prompt_parts.append(f"Question: {question}")
        prompt_parts.append("\nGenerate ONLY the SQL query to answer this question. No explanations.")
        
        return "\n".join(prompt_parts)
    
    def generate_sql(self, question: str, schema: Optional[str] = None) -> LettaResponse:
        """
        Generate SQL from a natural language question.
        
        Args:
            question: Natural language question about the data.
            schema: Optional schema context (uses stored schema if not provided).
        
        Returns:
            LettaResponse with generated SQL.
        """
        if schema:
            self._schema_context = schema
        
        prompt = self._build_sql_prompt(question)
        response = self.send_message(prompt)
        
        # Extract SQL from response
        sql = self._extract_sql(response.content)
        response.sql = sql
        
        return response
    
    def explain_results(self, question: str, sql: str, results: str) -> LettaResponse:
        """
        Get AI explanation of query results.
        
        Args:
            question: Original natural language question.
            sql: The SQL query that was executed.
            results: Query results as a string (e.g., DataFrame.to_string()).
        
        Returns:
            LettaResponse with explanation.
        """
        prompt = f"""Original question: {question}

SQL executed:
{sql}

Results:
{results}

Please explain these results in plain English. Highlight any interesting patterns or insights."""
        
        return self.send_message(prompt)
    
    def send_message(self, message: str) -> LettaResponse:
        """
        Send a message to Athena.
        
        Args:
            message: Message content to send.
        
        Returns:
            LettaResponse from Athena.
        """
        if not self.agent_id:
            raise ValueError(
                "Athena agent not configured. Set AGENT_ATHENA_ID in .env file.\n"
                "Example: AGENT_ATHENA_ID=agent-xxx-xxx-xxx"
            )
        
        url = f"{self.base_url}/v1/agents/{self.agent_id}/messages"
        
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": message
                }
            ]
        }
        
        try:
            response = self._client.post(url, json=payload, headers=self._get_headers())
            response.raise_for_status()
            data = response.json()
            
            # Extract assistant's response from Letta's message format
            content = self._extract_assistant_content(data)
            
            return LettaResponse(
                content=content,
                raw_response=data
            )
        except httpx.HTTPError as e:
            raise ConnectionError(f"Failed to communicate with Letta: {e}")
    
    def _extract_assistant_content(self, response_data: Dict) -> str:
        """Extract the assistant's text content from Letta response."""
        if isinstance(response_data, dict):
            # Check for 'messages' array
            if 'messages' in response_data:
                for msg in response_data['messages']:
                    if msg.get('role') == 'assistant':
                        if 'content' in msg:
                            return msg['content']
                        if 'text' in msg:
                            return msg['text']
            
            # Check for direct content
            if 'content' in response_data:
                return response_data['content']
            
            # Check for 'response' field
            if 'response' in response_data:
                return response_data['response']
        
        # Fallback: return stringified response
        return str(response_data)
    
    def _extract_sql(self, text: str) -> Optional[str]:
        """Extract SQL query from LLM response text."""
        if not text:
            return None
        
        # Try to find SQL in code blocks
        code_block_pattern = r'```(?:sql)?\s*([\s\S]*?)```'
        matches = re.findall(code_block_pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip()
        
        # Try to find SELECT/WITH statements
        sql_pattern = r'((?:SELECT|WITH)\s+[\s\S]*?(?:;|$))'
        matches = re.findall(sql_pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip().rstrip(';') + ';'
        
        # If the whole response looks like SQL, return it
        if text.strip().upper().startswith(('SELECT', 'WITH')):
            return text.strip()
        
        return None
    
    def health_check(self) -> bool:
        """Check if Letta server is accessible."""
        try:
            response = self._client.get(f"{self.base_url}/v1/health", timeout=5.0)
            return response.status_code == 200
        except Exception:
            return False
    
    def close(self):
        """Close the HTTP client."""
        self._client.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def test_letta_connection():
    """Test Letta AI connectivity."""
    client = LettaChat2DB()
    
    print(f"🔌 Testing Letta connection to Athena...")
    print(f"   URL: {client.base_url}")
    print(f"   Agent ID: {client.agent_id or '(not set)'}")
    
    if client.health_check():
        print("✅ Letta server is reachable!")
        
        if client.agent_id:
            print("\n📋 Testing Athena communication...")
            try:
                response = client.send_message("Hello! Please respond with 'Ready for SQL generation.'")
                print(f"   Athena response: {response.content[:100]}...")
            except Exception as e:
                print(f"   ⚠️ Athena communication failed: {e}")
        else:
            print("\n⚠️  Set AGENT_ATHENA_ID in .env to enable Athena")
    else:
        print("❌ Cannot reach Letta server")
        print("   Make sure Letta is running and LETTA_API_BASE_URL is correct")


if __name__ == "__main__":
    test_letta_connection()
