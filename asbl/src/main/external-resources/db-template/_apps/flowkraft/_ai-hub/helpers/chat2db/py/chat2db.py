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
        Launch a chat-friendly interface for querying databases.

        Provides a conversational UI: pick a database from the dropdown,
        then type questions in plain English. Athena generates SQL, runs
        it, and explains the results — all shown as chat messages.
        """
        try:
            import ipywidgets as widgets
            from IPython.display import display, HTML
        except ImportError:
            print("Install ipywidgets for interactive mode: pip install ipywidgets")
            return

        # -- HTML renderers ---------------------------------------------------

        def _user_bubble(text):
            return (
                '<div style="display:flex;justify-content:flex-end;margin:12px 0;">'
                '<div style="background:#0084ff;color:#fff;padding:10px 16px;'
                'border-radius:18px 18px 4px 18px;max-width:70%;font-size:14px;'
                f'line-height:1.5;">{text}</div></div>'
            )

        def _athena_bubble(sql=None, table_html=None, explanation=None,
                           error=None, row_count=0, exec_ms=0.0):
            p = [
                '<div style="display:flex;align-items:flex-start;gap:8px;margin:12px 0;">',
                '<div style="width:30px;height:30px;border-radius:50%;'
                'background:#6366f1;display:flex;align-items:center;'
                'justify-content:center;flex-shrink:0;font-size:16px;">'
                '\U0001f989</div>',
                '<div style="flex:1;max-width:85%;">',
            ]
            if error:
                p.append(
                    '<div style="background:#fee2e2;color:#991b1b;padding:10px 14px;'
                    f'border-radius:0 18px 18px 18px;font-size:14px;">{error}</div>'
                )
            else:
                if sql:
                    try:
                        safe = sqlparse.format(sql, reindent=True, keyword_case='upper')
                    except Exception:
                        safe = sql
                    safe = safe.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    p.append(
                        '<div style="background:#f3f4f6;padding:8px 14px;'
                        'border-radius:0 18px 4px 4px;font-size:13px;">'
                        '<details><summary style="cursor:pointer;color:#6b7280;'
                        'font-size:12px;">\u25B6 Show SQL</summary>'
                        '<pre style="background:#1e1e2e;color:#cdd6f4;padding:8px;'
                        'border-radius:6px;font-size:12px;overflow-x:auto;'
                        f'margin:6px 0 0;white-space:pre-wrap;">{safe}</pre>'
                        '</details></div>'
                    )
                if table_html:
                    stats = f'{row_count} row{"s" if row_count != 1 else ""}'
                    if exec_ms:
                        stats += f' \u00b7 {exec_ms:.0f} ms'
                    p.append(
                        '<div style="background:#fff;border:1px solid #e5e7eb;'
                        'padding:6px;border-radius:4px;margin-top:2px;'
                        'overflow-x:auto;font-size:13px;">'
                        f'<div style="color:#9ca3af;font-size:11px;margin-bottom:4px;">{stats}</div>'
                        f'{table_html}</div>'
                    )
                if explanation:
                    p.append(
                        '<div style="background:#f0fdf4;color:#166534;'
                        'padding:10px 14px;border-radius:4px 4px 18px 18px;'
                        'font-size:14px;margin-top:2px;line-height:1.5;">'
                        f'\U0001f4a1 {explanation}</div>'
                    )
            p.append('</div></div>')
            return ''.join(p)

        def _sys(text):
            return (
                '<div style="text-align:center;color:#9ca3af;'
                f'font-size:12px;margin:8px 0;">\u2014 {text} \u2014</div>'
            )

        # -- Connection widgets ------------------------------------------------

        connections = self._conn_manager.list_connections()
        conn_map = {}
        labels = ['-- Select a database --']
        for c in connections:
            lbl = f"{c.code} \u2014 {c.name} ({c.db_type})"
            labels.append(lbl)
            conn_map[lbl] = c.code

        conn_dd = widgets.Dropdown(
            options=labels, value=labels[0],
            layout=widgets.Layout(width='420px'),
        )
        conn_btn = widgets.Button(
            description='Connect', button_style='primary', icon='plug',
            layout=widgets.Layout(width='110px'),
        )
        status = widgets.HTML(
            '<span style="color:#9ca3af;font-size:13px;">No database selected</span>'
        )

        # -- Chat area ---------------------------------------------------------

        chat_out = widgets.Output(
            layout=widgets.Layout(
                min_height='300px', max_height='500px',
                overflow_y='auto', border='1px solid #e5e7eb',
                padding='12px', border_radius='8px',
            )
        )

        # -- Input widgets -----------------------------------------------------

        inp = widgets.Text(
            placeholder='Ask a question about your data\u2026',
            layout=widgets.Layout(width='85%'), disabled=True,
        )
        send_btn = widgets.Button(
            description='Send', button_style='primary', icon='paper-plane',
            layout=widgets.Layout(width='100px'), disabled=True,
        )

        # -- Clear button with inline confirmation ----------------------------

        clear_btn = widgets.Button(
            description='Clear All Messages', button_style='',
            icon='trash',
            tooltip='Start Clean - Clear All Message History',
            layout=widgets.Layout(width='auto'),
        )
        confirm_yes = widgets.Button(
            description='Yes, clear', button_style='danger', icon='check',
            layout=widgets.Layout(width='auto'),
        )
        confirm_no = widgets.Button(
            description='Cancel', button_style='', icon='times',
            layout=widgets.Layout(width='auto'),
        )
        confirm_box = widgets.HBox(
            [
                widgets.HTML(
                    '<span style="color:#ef4444;font-size:13px;'
                    'margin-right:6px;">Clear all messages?</span>'
                ),
                confirm_yes, confirm_no,
            ],
            layout=widgets.Layout(display='none'),
        )

        def _show_confirm(_btn):
            clear_btn.layout.display = 'none'
            confirm_box.layout.display = 'flex'

        def _do_clear(_btn):
            chat_out.clear_output()
            with chat_out:
                if self._connection and self._connection_config:
                    display(HTML(_sys(
                        f'Connected to {self._connection_config.name} '
                        f'({self._connection_config.db_type}). Ask me anything!'
                    )))
                else:
                    display(HTML(_sys(
                        'Select a database above, then ask questions in plain English'
                    )))
            confirm_box.layout.display = 'none'
            clear_btn.layout.display = ''

        def _cancel_clear(_btn):
            confirm_box.layout.display = 'none'
            clear_btn.layout.display = ''

        clear_btn.on_click(_show_confirm)
        confirm_yes.on_click(_do_clear)
        confirm_no.on_click(_cancel_clear)

        # -- Handlers ----------------------------------------------------------

        def _unlock():
            inp.disabled = False
            send_btn.disabled = False

        def _on_connect(_btn):
            code = conn_map.get(conn_dd.value)
            if not code:
                status.value = (
                    '<span style="color:#ef4444;font-size:13px;">'
                    'Please select a database first</span>'
                )
                return
            status.value = (
                '<span style="color:#f59e0b;font-size:13px;">Connecting\u2026</span>'
            )
            try:
                self.connect(code)
                status.value = (
                    f'<span style="color:#22c55e;font-size:13px;">'
                    f'\u2713 Connected to {code}</span>'
                )
                _unlock()
                with chat_out:
                    display(HTML(_sys(
                        f'Connected to {self._connection_config.name} '
                        f'({self._connection_config.db_type}). Ask me anything!'
                    )))
            except Exception as exc:
                status.value = (
                    f'<span style="color:#ef4444;font-size:13px;">'
                    f'Error: {exc}</span>'
                )

        def _on_send(_btn=None):
            question = inp.value.strip()
            if not question:
                return
            inp.value = ''

            with chat_out:
                display(HTML(_user_bubble(question)))

            try:
                result = self.ask(question)
                tbl = (
                    result.df.head(20).to_html(index=False)
                    if not result.error and len(result.df) > 0
                    else None
                )
                with chat_out:
                    display(HTML(_athena_bubble(
                        sql=result.sql or None,
                        table_html=tbl,
                        explanation=result.explanation,
                        error=result.error,
                        row_count=result.row_count,
                        exec_ms=result.execution_time_ms,
                    )))
            except Exception as exc:
                with chat_out:
                    display(HTML(_athena_bubble(error=str(exc))))

        conn_btn.on_click(_on_connect)
        send_btn.on_click(_on_send)
        inp.on_submit(lambda _: _on_send())

        # -- Auto-connect if session already active ----------------------------

        if self._connection and self._connection_config:
            for lbl, code in conn_map.items():
                if code == self._connection_config.code:
                    conn_dd.value = lbl
                    break
            status.value = (
                f'<span style="color:#22c55e;font-size:13px;">'
                f'\u2713 Connected to {self._connection_config.code}</span>'
            )
            _unlock()
            with chat_out:
                display(HTML(_sys(
                    f'Connected to {self._connection_config.name}. Ask me anything!'
                )))
        else:
            with chat_out:
                display(HTML(_sys(
                    'Select a database above, then ask questions in plain English'
                )))
                if not connections:
                    display(HTML(_sys(
                        '\u26A0 No database connections found. '
                        'Check REPORTBURSTER_CONNECTIONS_PATH.'
                    )))

        # -- Assemble layout ---------------------------------------------------

        header = widgets.HBox(
            [
                widgets.HTML(
                    '<h3 style="margin:0;color:#1e1b4b;">'
                    '\U0001f989 Chat2DB</h3>'
                ),
                widgets.Box(layout=widgets.Layout(flex='1')),
                clear_btn,
                confirm_box,
            ],
            layout=widgets.Layout(
                align_items='center', margin='0 0 8px',
            ),
        )
        conn_row = widgets.HBox(
            [conn_dd, conn_btn, status],
            layout=widgets.Layout(margin='0 0 8px'),
        )
        input_row = widgets.HBox(
            [inp, send_btn],
            layout=widgets.Layout(margin='8px 0 0'),
        )

        container = widgets.VBox(
            [header, conn_row, chat_out, input_row],
            layout=widgets.Layout(
                padding='16px', border='1px solid #e5e7eb',
                border_radius='12px',
            ),
        )
        display(container)
    
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
