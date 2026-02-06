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
    viz_code: Optional[str] = None  # Python visualization code (matplotlib/plotly)
    narrative: Optional[str] = None  # Athena's inline text (code blocks stripped)
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

    # Minimal context - Athena already knows SQL from her skills
    # This identifies the interface context + hints about response formatting
    # for reliable extraction by _extract_sql() and _extract_viz_code()
    CHAT2DB_CONTEXT = (
        "[Chat2DB/Jupyter Interface] "
        "When responding with SQL, wrap it in a ```sql code block. "
        "When a visualization would help understand the results, also include a ```python code block "
        "with matplotlib or plotly code that uses `df` (the query result DataFrame). "
        "Only suggest charts when they genuinely add insight — not for raw data dumps or simple lookups. "
        "Available libraries: matplotlib, plotly, pandas."
    )

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

        # Letta agents can be slow (memory ops, summarization, multiple LLM calls)
        # Use a generous timeout - 5 minutes
        self._client = httpx.Client(timeout=300.0)
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

    def _build_user_prompt(self, question: str) -> str:
        """
        Build the user prompt with optional database context.

        Structure (question first, context second):
        - USER QUERY: <the actual question to answer>
        - --- DATABASE CONTEXT --- (only if Send Tables is checked)

        Athena decides what to do based on the question:
        - Data query → generate SQL
        - Chit-chat → respond conversationally
        - ReportBurster config → guide through UI
        - Unclear → ask for clarification

        We trust her skills (chat2db-jupyter-interface, sql-queries-plain-english-queries-expert).
        """
        parts = []

        # User's question comes FIRST - this is what Athena should answer
        parts.append(f"USER QUERY: {question}")

        # Database context comes AFTER (if provided)
        if self._schema_context:
            parts.append("")
            parts.append("--- DATABASE CONTEXT ---")
            parts.append(self._schema_context)

        return "\n".join(parts)

    def _build_messages(self, user_message: str, include_context_tag: bool = True) -> List[Dict[str, str]]:
        """Build the OpenAI-format messages array.

        Note: Athena already has all SQL knowledge from her skills
        (sql-queries-plain-english-queries-expert, chat2db-jupyter-interface).
        We just add a minimal context tag so she knows the interface.
        """
        messages = []

        if include_context_tag:
            # Minimal context - just identify the interface
            messages.append({"role": "system", "content": self.CHAT2DB_CONTEXT})

        messages.append({"role": "user", "content": user_message})
        return messages

    def _debug_prompt(self, prompt: str) -> None:
        """Print debug info if CHAT2DB_DEBUG is enabled."""
        if os.environ.get('CHAT2DB_DEBUG', '').lower() == 'true':
            print("\n" + "=" * 60)
            print("DEBUG: Prompt being sent to Athena:")
            print("=" * 60)
            print(prompt)
            print("=" * 60 + "\n")

    def generate_sql(self, question: str, schema: Optional[str] = None) -> LettaResponse:
        """
        Ask Athena a question, optionally with table index context.

        Athena decides the appropriate response based on intent:
        - Data query → generates SQL
        - Chit-chat → responds conversationally
        - ReportBurster config → guides through UI
        - Unclear → asks for clarification

        Args:
            question: Natural language question or message.
            schema: Optional table index (table names only, not columns).

        Returns:
            LettaResponse with content and extracted SQL (if applicable).
        """
        # Update schema context
        self._schema_context = schema

        prompt = self._build_user_prompt(question)
        self._debug_prompt(prompt)

        response = self.send_message(prompt, include_context_tag=True)

        # Try to extract SQL if present (Athena may or may not generate SQL)
        response.sql = self._extract_sql(response.content)
        # Try to extract visualization code if present
        response.viz_code = self._extract_viz_code(response.content)
        # Extract Athena's inline narrative (text around code blocks)
        response.narrative = self._extract_narrative(response.content)

        return response

    def send_message(self, message: str, include_context_tag: bool = True) -> LettaResponse:
        """
        Send a message to Athena via the OpenAI-compatible adapter.

        Args:
            message: Message content to send.
            include_context_tag: Whether to include [Chat2DB/Jupyter] context tag.

        Returns:
            LettaResponse from Athena.
        """
        url = f"{self.base_url}/chat/completions"

        payload = {
            "model": self.model,
            "messages": self._build_messages(message, include_context_tag=include_context_tag),
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
        """Extract SQL query from LLM response text.

        Specifically looks for ```sql blocks first, then generic blocks
        containing SQL, then bare SQL statements. Avoids capturing
        ```python blocks (which are visualization code).
        """
        if not text:
            return None

        # Strategy 1: Explicit ```sql code blocks
        sql_block_pattern = r'```sql\s*([\s\S]*?)```'
        matches = re.findall(sql_block_pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip()

        # Strategy 2: Generic code blocks (no language tag) that start with SQL
        generic_block_pattern = r'```\s*((?:SELECT|WITH)[\s\S]*?)```'
        matches = re.findall(generic_block_pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip()

        # Strategy 3: Bare SELECT/WITH statements in text
        sql_pattern = r'((?:SELECT|WITH)\s+[\s\S]*?(?:;|$))'
        matches = re.findall(sql_pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip().rstrip(';') + ';'

        # Strategy 4: Whole response is SQL
        if text.strip().upper().startswith(('SELECT', 'WITH')):
            return text.strip()

        return None

    def _extract_viz_code(self, text: str) -> Optional[str]:
        """Extract Python visualization code from LLM response text.

        Looks for ```python code blocks that contain visualization
        commands (matplotlib, plotly, or pandas .plot).
        """
        if not text:
            return None

        python_block_pattern = r'```python\s*([\s\S]*?)```'
        matches = re.findall(python_block_pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip()

        return None

    def _extract_narrative(self, text: str) -> Optional[str]:
        """Extract Athena's inline narrative by stripping all code blocks.

        Returns the surrounding text that Athena wrote alongside SQL and
        visualization code — her explanations, insights, follow-up suggestions.
        """
        if not text:
            return None

        # Strip all fenced code blocks (```lang ... ```)
        stripped = re.sub(r'```\w*\s*[\s\S]*?```', '', text)
        # Collapse multiple blank lines into one
        stripped = re.sub(r'\n{3,}', '\n\n', stripped).strip()

        return stripped if stripped else None

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
