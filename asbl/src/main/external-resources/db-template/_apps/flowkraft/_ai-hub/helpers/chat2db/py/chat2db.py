"""
Chat2DB - Natural Language to SQL Workflow

Core engine for Chat2DB: natural language → SQL → results → visualization.
Served via FastAPI (see api.py). UI is rendered by the Next.js frontend.

This module uses Athena (the data & analytics oracle) exclusively.
"""

import os
import re
import io
import base64
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

import pandas as pd
import sqlparse

from rb_connections import ReportBursterConnections, DatabaseConnection
from letta_chat2db import LettaChat2DB, LettaResponse


@dataclass
class QueryResult:
    """Result of a Chat2DB query or conversational response."""
    question: str
    sql: str
    df: pd.DataFrame
    explanation: Optional[str] = None
    execution_time_ms: float = 0.0
    row_count: int = 0
    error: Optional[str] = None
    # For conversational responses (chit-chat, guidance) where no SQL is generated
    text_response: Optional[str] = None
    # Visualization: Athena's suggested Python code + rendered base64 PNG
    viz_code: Optional[str] = None
    viz_image: Optional[str] = None  # base64-encoded PNG
    # Athena's raw response (full markdown, unprocessed) for copy-to-clipboard
    raw_content: Optional[str] = None

class Chat2DB:
    """
    Chat2DB engine — natural language to SQL with visualization.

    Uses Athena (the data & analytics oracle) for natural language to SQL.
    Served via FastAPI; the Next.js frontend handles the chat UI.

    Usage (programmatic):
        chat = Chat2DB(connection_code="db-northwind-postgres")
        result = chat.ask("What are the top 5 products by sales?")
        result.df  # pandas DataFrame with results
        result.explanation  # AI-generated explanation
    """
    
    DANGEROUS_SQL_PATTERNS = [
        r'\bDELETE\b',
        r'\bDROP\b',
        r'\bTRUNCATE\b',
        r'\bUPDATE\b',
        r'\bALTER\b',
        r'\bINSERT\b',
        r'\bCREATE\b',
        r'\bGRANT\b',
        r'\bREVOKE\b',
    ]
    
    def __init__(self,
                 connection_code: Optional[str] = None,
                 connection_config: Optional[DatabaseConnection] = None,
                 block_dangerous: bool = True,
                 max_rows: int = 1000):
        """
        Initialize Chat2DB.

        Args:
            connection_code: ReportBurster connection code (e.g., 'db-northwind-postgres').
            connection_config: Or provide a DatabaseConnection directly.
            block_dangerous: Block DELETE, DROP, UPDATE, etc. queries.
            max_rows: Maximum rows to return from queries.
        """
        # Load settings from environment
        self.block_dangerous = block_dangerous if block_dangerous else os.environ.get('BLOCK_DANGEROUS_SQL', 'true').lower() == 'true'
        self.max_rows = max_rows if max_rows != 1000 else int(os.environ.get('MAX_RESULT_ROWS', '1000'))
        
        # Initialize connection manager
        self._conn_manager = ReportBursterConnections()
        self._connection: Optional[Any] = None
        self._connection_config: Optional[DatabaseConnection] = None
        
        # Initialize Letta AI client (Athena)
        self._letta = LettaChat2DB()
        
        # Schema cache
        self._schema: Optional[str] = None

        # Last query result (for follow-up viz requests like "show me a chart")
        self._last_df: Optional[pd.DataFrame] = None
        
        # Connect if connection provided
        if connection_code:
            self.connect(connection_code)
        elif connection_config:
            self.connect_with_config(connection_config)
    
    # -------------------------------------------------------------------------
    # Connection Management
    # -------------------------------------------------------------------------
    
    def list_connections(self) -> List[DatabaseConnection]:
        """List all available ReportBurster database connections."""
        connections = self._conn_manager.list_connections()
        
        print("\n📁 Available Database Connections:\n")
        for conn in connections:
            marker = " ⭐" if conn.default_connection else ""
            print(f"  • {conn.code}{marker}")
            print(f"    {conn.name} ({conn.db_type})")
        
        return connections
    
    def connect(self, connection_code: str) -> 'Chat2DB':
        """
        Connect to a database using a ReportBurster connection code.
        
        Args:
            connection_code: The connection code (e.g., 'db-northwind-postgres')
        
        Returns:
            Self for chaining.
        """
        self._close_connection()
        
        config = self._conn_manager.get_connection(connection_code)
        if not config:
            # Try listing connections first
            self._conn_manager.list_connections()
            config = self._conn_manager.get_connection(connection_code)
        
        if not config:
            raise ValueError(f"Connection not found: {connection_code}\nUse list_connections() to see available connections.")
        
        return self.connect_with_config(config)
    
    def connect_with_config(self, config: DatabaseConnection) -> 'Chat2DB':
        """Connect using a DatabaseConnection config."""
        self._close_connection()
        self._connection = self._conn_manager.connect_with_config(config)
        self._connection_config = config
        
        # Fetch and cache schema
        self._fetch_schema()
        
        return self
    
    def _close_connection(self):
        """Close existing connection if any."""
        if self._connection:
            try:
                self._connection.close()
            except:
                pass
            self._connection = None
    
    def _fetch_schema(self):
        """
        Fetch and cache database table names for AI context.

        Only fetches TABLE NAMES (not columns) to keep token count minimal.
        This serves as an "index" for Athena - she can look up column details
        from the full schema files on disk when needed.

        Supports: SQLite, DuckDB, PostgreSQL, MySQL, MariaDB, SQL Server,
                  Oracle, IBM Db2, ClickHouse
        """
        if not self._connection:
            return

        try:
            schema_parts = []
            db_type = ''

            # Include database type so Athena generates correct SQL dialect
            if self._connection_config:
                db_type = self._connection_config.db_type.upper()
                schema_parts.append(f"DATABASE TYPE: {db_type}")
                schema_parts.append("")
                schema_parts.append("TABLE INDEX: Only table names listed (not columns) to keep context minimal.")
                schema_parts.append("For additional schema details, including columns, grep schema files using table names as search terms.")
                schema_parts.append("")

            tables = []
            cursor = self._connection.cursor()

            # =========================================================
            # SQLite / DuckDB
            # =========================================================
            if db_type in ('SQLITE', 'DUCKDB'):
                try:
                    if db_type == 'SQLITE':
                        cursor.execute(
                            "SELECT name FROM sqlite_master WHERE type='table' "
                            "AND name NOT LIKE 'sqlite_%' ORDER BY name"
                        )
                    else:  # DuckDB
                        cursor.execute("SELECT table_name FROM information_schema.tables "
                                       "WHERE table_schema = 'main' ORDER BY table_name")
                    tables = [row[0] for row in cursor.fetchall()]
                except Exception as e:
                    print(f"⚠️ {db_type} table list fetch failed: {e}")

            # =========================================================
            # Oracle
            # =========================================================
            elif db_type == 'ORACLE':
                try:
                    cursor.execute("""
                        SELECT DISTINCT table_name FROM ALL_TAB_COLUMNS
                        WHERE owner = USER ORDER BY table_name
                    """)
                    tables = [row[0] for row in cursor.fetchall()]
                except Exception as e:
                    print(f"⚠️ Oracle table list fetch failed: {e}")

            # =========================================================
            # IBM Db2
            # =========================================================
            elif db_type in ('IBMDB2', 'DB2'):
                try:
                    cursor.execute("""
                        SELECT DISTINCT tabname FROM SYSCAT.COLUMNS
                        WHERE tabschema = CURRENT SCHEMA ORDER BY tabname
                    """)
                    tables = [row[0] for row in cursor.fetchall()]
                except Exception as e:
                    print(f"⚠️ IBM Db2 table list fetch failed: {e}")

            # =========================================================
            # ClickHouse
            # =========================================================
            elif db_type == 'CLICKHOUSE':
                try:
                    cursor.execute("""
                        SELECT DISTINCT table FROM system.columns
                        WHERE database = currentDatabase() ORDER BY table
                    """)
                    tables = [row[0] for row in cursor.fetchall()]
                except Exception as e:
                    print(f"⚠️ ClickHouse table list fetch failed: {e}")

            # =========================================================
            # PostgreSQL, MySQL, MariaDB, SQL Server - information_schema
            # =========================================================
            if not tables:
                try:
                    if db_type == 'SQLSERVER':
                        schema_filter = "table_schema = 'dbo'"
                    elif db_type in ('MYSQL', 'MARIADB'):
                        schema_filter = "table_schema = DATABASE()"
                    else:  # PostgreSQL and others
                        schema_filter = "table_schema = 'public'"

                    cursor.execute(f"""
                        SELECT DISTINCT table_name
                        FROM information_schema.tables
                        WHERE {schema_filter} AND table_type = 'BASE TABLE'
                        ORDER BY table_name
                    """)
                    tables = [row[0] for row in cursor.fetchall()]
                except Exception as e:
                    print(f"⚠️ information_schema fetch failed: {e}")

            cursor.close()

            if tables:
                schema_parts.append(f"TABLES ({len(tables)}):")
                for table in tables:
                    # Quote tables with spaces
                    display = f'"{table}"' if ' ' in table else table
                    schema_parts.append(f"  - {display}")
            else:
                schema_parts.append(f"Connected to: {self._connection_config.name}")
                schema_parts.append("(Table list could not be fetched automatically)")

            self._schema = "\n".join(schema_parts) if schema_parts else None

        except Exception as e:
            print(f"⚠️ Could not fetch table list: {e}")
    
    # -------------------------------------------------------------------------
    # Visualization
    # -------------------------------------------------------------------------

    def _execute_viz(self, viz_code: str, df: pd.DataFrame) -> Optional[str]:
        """
        Execute Athena's visualization code and capture the result as base64 PNG.

        The code runs in a sandboxed namespace with `df` (the query result),
        `pd` (pandas), and plotting libraries pre-injected.

        Args:
            viz_code: Python code from Athena (matplotlib/plotly).
            df: The query result DataFrame.

        Returns:
            Base64-encoded PNG string, or None if execution fails.
        """
        try:
            import matplotlib
            matplotlib.use('Agg')  # Non-interactive backend
            import matplotlib.pyplot as plt

            # Close any leftover figures
            plt.close('all')

            # Build a safe namespace for exec
            namespace = {
                'df': df,
                'pd': pd,
                'plt': plt,
            }

            # Try to inject plotly if available
            try:
                import plotly.express as px
                import plotly.graph_objects as go
                namespace['px'] = px
                namespace['go'] = go
            except ImportError:
                pass

            # Try to inject seaborn if available
            try:
                import seaborn as sns
                namespace['sns'] = sns
            except ImportError:
                pass

            # Execute Athena's code
            exec(viz_code, namespace)

            # Capture the current matplotlib figure
            fig = plt.gcf()
            if fig.get_axes():
                buf = io.BytesIO()
                fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
                buf.seek(0)
                img_b64 = base64.b64encode(buf.read()).decode('utf-8')
                buf.close()
                plt.close('all')
                return img_b64

            plt.close('all')
            return None

        except Exception as e:
            print(f"⚠️ Visualization failed: {e}")
            return None

    # -------------------------------------------------------------------------
    # Query Methods
    # -------------------------------------------------------------------------

    def ask(self, question: str, send_schema: bool = True) -> QueryResult:
        """
        Ask a natural language question about your data.

        Args:
            question: Natural language question (e.g., "Show top 5 products by revenue")
            send_schema: If True (default), send table names as an index to help Athena.
                        She can grep the full schema on disk for column details.
                        Set False for chit-chat or non-database topics.

        Returns:
            QueryResult with SQL, DataFrame, and optional explanation.

        Example:
            result = chat.ask("Which customers have the highest order totals?")
            result.df  # View the data
            result.sql  # See the generated SQL
        """
        if not self._connection:
            raise RuntimeError("Not connected to a database. Use connect() first.")

        # Generate SQL using Athena (optionally include schema)
        schema_to_send = self._schema if send_schema else None
        response = self._letta.generate_sql(question, schema_to_send)
        sql = response.sql

        # No SQL extracted - this could be:
        # 1. Conversational response ("Hello!", "How are you?")
        # 2. ReportBurster guidance ("How do I burst a PDF?")
        # 3. Clarification question from Athena
        # All are valid responses - not errors!
        if not sql:
            # Athena may return viz code without SQL (e.g. follow-up "pie chart please")
            # Execute it against the stored DataFrame from the previous query
            if response.viz_code and self._last_df is not None and len(self._last_df) > 0:
                viz_image = self._execute_viz(response.viz_code, self._last_df)
                return QueryResult(
                    question=question,
                    sql="",
                    df=self._last_df,
                    row_count=len(self._last_df),
                    viz_code=response.viz_code,
                    viz_image=viz_image,
                    # Use narrative (code blocks stripped) — don't show raw Python in UI
                    text_response=response.narrative,
                    explanation=response.narrative,
                    raw_content=response.content,
                )

            # Pure conversational response (no SQL, no viz)
            return QueryResult(
                question=question,
                sql="",
                df=pd.DataFrame(),
                text_response=response.narrative or response.content,
                viz_code=response.viz_code,
                raw_content=response.content,
            )
        
        # Check for dangerous operations
        if self.block_dangerous:
            for pattern in self.DANGEROUS_SQL_PATTERNS:
                if re.search(pattern, sql, re.IGNORECASE):
                    return QueryResult(
                        question=question,
                        sql=sql,
                        df=pd.DataFrame(),
                        error=f"Blocked dangerous SQL operation: {pattern.strip()}"
                    )
        
        # Execute query
        try:
            start_time = datetime.now()
            
            # Add LIMIT if not present
            if 'LIMIT' not in sql.upper():
                sql = sql.rstrip(';') + f" LIMIT {self.max_rows};"
            
            df = pd.read_sql(sql, self._connection)
            self._last_df = df  # Store for follow-up viz requests

            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = QueryResult(
                question=question,
                sql=sql,
                df=df,
                execution_time_ms=execution_time,
                row_count=len(df),
                viz_code=response.viz_code,
                raw_content=response.content,
            )

            # Execute visualization if Athena suggested one
            if response.viz_code and len(df) > 0:
                result.viz_image = self._execute_viz(response.viz_code, df)

            # Use Athena's inline narrative (text around code blocks) as explanation
            result.explanation = response.narrative

            return result
            
        except Exception as e:
            return QueryResult(
                question=question,
                sql=sql,
                df=pd.DataFrame(),
                error=str(e)
            )
    
    def sql(self, query: str) -> pd.DataFrame:
        """
        Execute raw SQL directly.
        
        Args:
            query: SQL query string.
        
        Returns:
            pandas DataFrame with results.
        """
        if not self._connection:
            raise RuntimeError("Not connected to a database. Use connect() first.")
        
        return pd.read_sql(query, self._connection)
    
    def schema(self) -> str:
        """Get the cached database schema."""
        if not self._schema:
            self._fetch_schema()
        return self._schema or "Schema not available"

    def close(self):
        """Close all connections."""
        self._close_connection()
        self._letta.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
