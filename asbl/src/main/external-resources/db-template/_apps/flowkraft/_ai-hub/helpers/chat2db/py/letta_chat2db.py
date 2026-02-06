"""
Letta AI Chat2DB Integration

Connects to the Athena AI agent for natural language to SQL generation.
Routes through the OpenAI-compatible adapter exposed by ai-hub-frend,
which resolves the "athena" agent key to the current Letta agent UUID.

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

    Connects to Athena (the data & analytics oracle) via the OpenAI-compatible
    adapter exposed by ai-hub-frend. The adapter resolves the "athena" agent key
    to the current Letta agent UUID automatically — no manual agent ID needed.

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
                 model: Optional[str] = None):
        """
        Initialize Letta AI client for Athena.

        Args:
            base_url: OpenAI-compatible API base URL. Defaults to OPENAI_API_BASE env var.
                      Points to the ai-hub-frend adapter that wraps Letta agents.
            model: Model name for the API. Defaults to OPENAI_MODEL env var.
        """
        self.base_url = (base_url or os.environ.get(
            'OPENAI_API_BASE',
            'http://flowkraft-ai-hub-frend:3000/api/openai/athena/v1'
        )).rstrip('/')
        self.model = model or os.environ.get('OPENAI_MODEL', 'letta:athena')

        self._client = httpx.Client(timeout=120.0)
        self._schema_context: Optional[str] = None

    def set_schema_context(self, schema: str):
        """
        Set the database schema context for Athena.

        The schema is included in every SQL generation request,
        giving Athena full awareness of the database structure.

        Args:
            schema: Database schema description (tables, columns, types).
        """
        self._schema_context = schema

    def _build_messages(self, user_message: str) -> List[Dict[str, str]]:
        """Build the OpenAI-format messages array with system context."""
        messages = [
            {"role": "system", "content": self.SQL_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        return messages

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
        Send a message to Athena via the OpenAI-compatible adapter.

        Args:
            message: Message content to send.

        Returns:
            LettaResponse from Athena.
        """
        url = f"{self.base_url}/chat/completions"

        payload = {
            "model": self.model,
            "messages": self._build_messages(message),
            "stream": False,
        }

        try:
            response = self._client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            data = response.json()

            # Standard OpenAI response format: choices[0].message.content
            content = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )

            return LettaResponse(
                content=content,
                raw_response=data,
            )
        except httpx.HTTPStatusError as e:
            error_body = e.response.text if e.response else str(e)
            raise ConnectionError(
                f"Athena request failed (HTTP {e.response.status_code}): {error_body}"
            )
        except httpx.HTTPError as e:
            raise ConnectionError(f"Failed to communicate with Athena: {e}")

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
        """Check if the Athena endpoint is accessible."""
        try:
            response = self._client.get(
                f"{self.base_url}/models",
                timeout=5.0,
            )
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
    """Test Athena AI connectivity via the OpenAI-compatible adapter."""
    client = LettaChat2DB()

    print(f"🔌 Testing Athena connection...")
    print(f"   Endpoint: {client.base_url}")
    print(f"   Model: {client.model}")

    if client.health_check():
        print("✅ Athena endpoint is reachable!")

        print("\n📋 Testing Athena communication...")
        try:
            response = client.send_message("Hello! Please respond with 'Ready for SQL generation.'")
            print(f"   Athena response: {response.content[:200]}...")
        except Exception as e:
            print(f"   ⚠️ Athena communication failed: {e}")
    else:
        print("❌ Cannot reach Athena endpoint")
        print(f"   Make sure ai-hub-frend is running and Athena is provisioned")
        print(f"   Expected: {client.base_url}/chat/completions")


if __name__ == "__main__":
    test_letta_connection()
