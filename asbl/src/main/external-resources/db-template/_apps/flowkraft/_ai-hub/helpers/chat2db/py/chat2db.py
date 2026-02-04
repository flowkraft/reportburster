"""
Chat2DB - Natural Language to SQL Workflow

The main interface for Chat2DB functionality in Jupyter notebooks.
Combines ReportBurster connections with Athena AI for a complete
natural language database query experience.

This module uses Athena (the data & analytics oracle) exclusively.
"""

import os
import re
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

import pandas as pd
from tabulate import tabulate
import sqlparse

from rb_connections import ReportBursterConnections, DatabaseConnection
from letta_chat2db import LettaChat2DB, LettaResponse


@dataclass
class QueryResult:
    """Result of a Chat2DB query."""
    question: str
    sql: str
    df: pd.DataFrame
    explanation: Optional[str] = None
    execution_time_ms: float = 0.0
    row_count: int = 0
    error: Optional[str] = None
    
    def _repr_html_(self):
        """Jupyter notebook HTML representation."""
        html_parts = []
        
        # Question
        html_parts.append(f"<h4>📝 Question</h4><p>{self.question}</p>")
        
        # SQL
        formatted_sql = sqlparse.format(self.sql, reindent=True, keyword_case='upper')
        html_parts.append(f"<h4>🔍 Generated SQL</h4><pre>{formatted_sql}</pre>")
        
        # Results
        if self.error:
            html_parts.append(f"<h4>❌ Error</h4><p style='color:red'>{self.error}</p>")
        else:
            html_parts.append(f"<h4>📊 Results ({self.row_count} rows, {self.execution_time_ms:.1f}ms)</h4>")
            html_parts.append(self.df.to_html(max_rows=20, max_cols=10))
        
        # Explanation
        if self.explanation:
            html_parts.append(f"<h4>💡 Explanation</h4><p>{self.explanation}</p>")
        
        return "".join(html_parts)


class Chat2DB:
    """
    Main Chat2DB interface for Jupyter notebooks.
    
    Uses Athena (the data & analytics oracle) for natural language to SQL.
    
    Usage:
        chat = Chat2DB(connection_code="db-northwind-postgres")
        result = chat.ask("What are the top 5 products by sales?")
        result.df  # pandas DataFrame with results
        result.explanation  # AI-generated explanation
    
    Or with widgets:
        chat.interactive()  # Opens chat UI
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
                 auto_explain: bool = True,
                 block_dangerous: bool = True,
                 max_rows: int = 1000):
        """
        Initialize Chat2DB.
        
        Args:
            connection_code: ReportBurster connection code (e.g., 'db-northwind-postgres').
            connection_config: Or provide a DatabaseConnection directly.
            auto_explain: Automatically generate AI explanations for results.
            block_dangerous: Block DELETE, DROP, UPDATE, etc. queries.
            max_rows: Maximum rows to return from queries.
        """
        # Load settings from environment
        self.block_dangerous = block_dangerous if block_dangerous else os.environ.get('BLOCK_DANGEROUS_SQL', 'true').lower() == 'true'
        self.max_rows = max_rows if max_rows != 1000 else int(os.environ.get('MAX_RESULT_ROWS', '1000'))
        self.auto_explain = auto_explain
        
        # Initialize connection manager
        self._conn_manager = ReportBursterConnections()
        self._connection: Optional[Any] = None
        self._connection_config: Optional[DatabaseConnection] = None
        
        # Initialize Letta AI client (Athena)
        self._letta = LettaChat2DB()
        
        # Schema cache
        self._schema: Optional[str] = None
        
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
        """Fetch and cache database schema for AI context."""
        if not self._connection:
            return
        
        try:
            # This is a simplified schema fetch - actual implementation depends on DB type
            schema_parts = []
            
            if hasattr(self._connection, 'execute'):
                # Try to get table information
                # This works for most databases with information_schema
                try:
                    cursor = self._connection.execute("""
                        SELECT table_name, column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_schema = 'public' OR table_schema = 'dbo'
                        ORDER BY table_name, ordinal_position
                    """)
                    
                    current_table = None
                    for row in cursor:
                        table, column, dtype = row
                        if table != current_table:
                            if current_table:
                                schema_parts.append("")
                            schema_parts.append(f"Table: {table}")
                            current_table = table
                        schema_parts.append(f"  - {column}: {dtype}")
                    
                except Exception:
                    # Fallback: just note the connection
                    schema_parts.append(f"Connected to: {self._connection_config.name}")
            
            self._schema = "\n".join(schema_parts) if schema_parts else None
            
            # Send schema to Athena
            if self._schema:
                self._letta.set_schema_context(self._schema)
                
        except Exception as e:
            print(f"⚠️ Could not fetch schema: {e}")
    
    # -------------------------------------------------------------------------
    # Query Methods
    # -------------------------------------------------------------------------
    
    def ask(self, question: str) -> QueryResult:
        """
        Ask a natural language question about your data.
        
        Args:
            question: Natural language question (e.g., "Show top 5 products by revenue")
        
        Returns:
            QueryResult with SQL, DataFrame, and optional explanation.
        
        Example:
            result = chat.ask("Which customers have the highest order totals?")
            result.df  # View the data
            result.sql  # See the generated SQL
        """
        if not self._connection:
            raise RuntimeError("Not connected to a database. Use connect() first.")
        
        # Generate SQL using Athena
        response = self._letta.generate_sql(question, self._schema)
        sql = response.sql
        
        if not sql:
            return QueryResult(
                question=question,
                sql="",
                df=pd.DataFrame(),
                error=f"Could not generate SQL. Athena responded: {response.content}"
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
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = QueryResult(
                question=question,
                sql=sql,
                df=df,
                execution_time_ms=execution_time,
                row_count=len(df)
            )
            
            # Get explanation if enabled
            if self.auto_explain and len(df) > 0:
                try:
                    explain_response = self._letta.explain_results(
                        question=question,
                        sql=sql,
                        results=df.head(20).to_string()
                    )
                    result.explanation = explain_response.content
                except Exception as e:
                    print(f"⚠️ Could not generate explanation: {e}")
            
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
    
    # -------------------------------------------------------------------------
    # Interactive Mode
    # -------------------------------------------------------------------------
    
    def interactive(self):
        """
        Launch interactive chat interface with widgets.
        
        Provides a text input for questions and displays results
        in a formatted output area.
        """
        try:
            import ipywidgets as widgets
            from IPython.display import display, clear_output, HTML
            
            # Input box
            input_box = widgets.Text(
                placeholder='Ask Athena about your data...',
                description='Question:',
                layout=widgets.Layout(width='70%')
            )
            
            # Submit button
            submit_btn = widgets.Button(
                description='Ask Athena',
                button_style='primary',
                icon='search'
            )
            
            # Output area
            output_area = widgets.Output()
            
            def on_submit(btn):
                question = input_box.value
                if not question:
                    return
                
                with output_area:
                    print(f"\n{'='*60}")
                    print(f"🗣️ You: {question}")
                    print(f"\n🦉 Athena is thinking...")
                    
                    result = self.ask(question)
                    
                    clear_output(wait=True)
                    print(f"🗣️ You: {question}")
                    print(f"\n🦉 Athena responds:")
                    
                    if result.error:
                        print(f"❌ Error: {result.error}")
                    else:
                        display(result.df)
                        if result.explanation:
                            print(f"\n💡 {result.explanation}")
                
                input_box.value = ''
            
            submit_btn.on_click(on_submit)
            
            # Handle Enter key in input
            input_box.on_submit(lambda x: on_submit(None))
            
            # Display widgets
            header = widgets.HTML("<h3>🦉 Chat2DB - Ask Athena About Your Data</h3>")
            input_row = widgets.HBox([input_box, submit_btn])
            display(widgets.VBox([header, input_row, output_area]))
            
        except ImportError:
            print("Install ipywidgets for interactive mode: pip install ipywidgets")
    
    def close(self):
        """Close all connections."""
        self._close_connection()
        self._letta.close()
        print("👋 Chat2DB session closed.")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# Convenience function for quick start
def quick_start():
    """Print quick start guide."""
    print("""
╔══════════════════════════════════════════════════════════════════╗
║                    🚀 Chat2DB Quick Start                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. List available database connections:                         ║
║     >>> from chat2db import Chat2DB                              ║
║     >>> chat = Chat2DB()                                         ║
║     >>> chat.list_connections()                                  ║
║                                                                  ║
║  2. Connect and ask questions:                                   ║
║     >>> chat.connect("db-northwind-postgres")                    ║
║     >>> result = chat.ask("Top 5 products by revenue")           ║
║     >>> result.df  # View results                                ║
║                                                                  ║
║  3. Get schema information:                                      ║
║     >>> print(chat.schema())                                     ║
║                                                                  ║
║  4. Interactive mode:                                            ║
║     >>> chat.interactive()                                       ║
║                                                                  ║
║  🦉 All queries are powered by Athena, the data & analytics     ║
║     oracle, who generates SQL and explains results.              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
""")


if __name__ == "__main__":
    quick_start()
