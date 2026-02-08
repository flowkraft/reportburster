"""
Chat2DB - Natural Language to SQL Workflow

The main interface for Chat2DB functionality in Jupyter notebooks.
Combines ReportBurster connections with Athena AI for a complete
natural language database query experience.

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
from tabulate import tabulate
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

    def _repr_html_(self):
        """Jupyter notebook HTML representation."""
        html_parts = []

        # Question
        html_parts.append(f"<h4>📝 Question</h4><p>{self.question}</p>")

        # Conversational response (no SQL)
        if self.text_response:
            try:
                import mistune
                rendered = mistune.html(self.text_response)
            except ImportError:
                import html
                rendered = f"<p>{html.escape(self.text_response).replace(chr(10), '<br>')}</p>"
            html_parts.append(f"<h4>🦉 Athena</h4>{rendered}")
            return "".join(html_parts)

        # SQL query response
        if self.sql:
            formatted_sql = sqlparse.format(self.sql, reindent=True, keyword_case='upper')
            html_parts.append(f"<h4>🔍 Generated SQL</h4><pre>{formatted_sql}</pre>")

        # Results
        if self.error:
            html_parts.append(f"<h4>❌ Error</h4><p style='color:red'>{self.error}</p>")
        elif self.sql:
            html_parts.append(f"<h4>📊 Results ({self.row_count} rows, {self.execution_time_ms:.1f}ms)</h4>")
            html_parts.append(self.df.to_html(max_rows=20, max_cols=10))

        # Visualization
        if self.viz_image:
            html_parts.append(f'<h4>📈 Visualization</h4>')
            html_parts.append(f'<img src="data:image/png;base64,{self.viz_image}" style="max-width:100%;">')

        # Athena's narrative (render markdown for bold, bullets, etc.)
        if self.explanation:
            try:
                import mistune
                rendered = mistune.html(self.explanation)
            except ImportError:
                import html
                rendered = f"<p>{html.escape(self.explanation).replace(chr(10), '<br>')}</p>"
            html_parts.append(
                f"<div style='color:#374151;line-height:1.6;font-size:14px;'>{rendered}</div>"
            )

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
            result = QueryResult(
                question=question,
                sql="",
                df=pd.DataFrame(),
                text_response=response.narrative or response.content,
                viz_code=response.viz_code,
                raw_content=response.content,
            )
            # Athena may return viz code without SQL (e.g. follow-up "show me a chart")
            # Execute it if we have a previous result to work with — but since ask()
            # is stateless, just pass the viz_code through for the caller to handle
            return result
        
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

        def _wrap(html):
            """Wrap HTML in a container that enforces strict overflow clipping."""
            return (
                '<div style="position:relative;overflow:hidden;max-width:100%;'
                'box-sizing:border-box;">'
                f'{html}</div>'
            )

        def _user_bubble(text):
            # Escape HTML to prevent XSS and ensure proper rendering
            safe_text = (text.replace('&', '&amp;').replace('<', '&lt;')
                            .replace('>', '&gt;').replace('\n', '<br>'))
            return _wrap(
                '<div style="display:flex;justify-content:flex-end;margin:12px 0;">'
                '<div style="background:#0084ff;color:#fff;padding:10px 16px;'
                'border-radius:18px 18px 4px 18px;max-width:70%;font-size:14px;'
                'line-height:1.5;word-wrap:break-word;overflow-wrap:break-word;'
                f'word-break:break-word;overflow:hidden;">{safe_text}</div></div>'
            )

        def _athena_bubble(sql=None, table_html=None, explanation=None,
                           error=None, row_count=0, exec_ms=0.0,
                           text_response=None, viz_image=None,
                           raw_content=None):
            """Render Athena's response bubble.

            Args:
                sql: Generated SQL query (for data queries)
                table_html: HTML table of results
                explanation: AI explanation of results
                error: Error message (red bubble)
                row_count: Number of result rows
                exec_ms: Execution time in milliseconds
                text_response: Conversational response (chit-chat, guidance, etc.)
                raw_content: Athena's full raw response for copy-to-clipboard
            """
            bubble_counter[0] += 1
            bid = f'athena-bubble-{bubble_counter[0]}'
            raw_id = f'athena-raw-{bubble_counter[0]}'
            copy_btn = _copy_btn(raw_id)
            p = [
                '<div style="display:flex;align-items:flex-start;gap:8px;margin:12px 0;">',
                '<div style="width:30px;height:30px;border-radius:50%;'
                'background:#6366f1;display:flex;align-items:center;'
                'justify-content:center;flex-shrink:0;font-size:16px;">'
                '\U0001f989</div>',
                '<div style="flex:1;max-width:85%;">',
                f'<div style="display:flex;justify-content:flex-end;margin-bottom:4px;">{copy_btn}</div>',
                f'<div id="{bid}">',
            ]
            if error:
                p.append(
                    '<div style="background:#fee2e2;color:#991b1b;padding:10px 14px;'
                    f'border-radius:0 18px 18px 18px;font-size:14px;">{error}</div>'
                )
            elif text_response:
                # Conversational response - no SQL, just Athena talking
                # Render markdown (bold, bullets, code blocks, etc.)
                try:
                    import mistune
                    rendered_text = mistune.html(text_response)
                except ImportError:
                    import html
                    rendered_text = html.escape(text_response).replace('\n', '<br>')
                p.append(
                    '<div style="background:#ede9fe;color:#4c1d95;padding:10px 14px;'
                    'border-radius:0 18px 18px 18px;font-size:14px;line-height:1.6;">'
                    f'{rendered_text}</div>'
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
                if viz_image:
                    p.append(
                        '<div style="background:#fff;border:1px solid #e5e7eb;'
                        'padding:6px;border-radius:4px;margin-top:2px;'
                        'overflow-x:auto;">'
                        f'<img src="data:image/png;base64,{viz_image}" '
                        'style="max-width:100%;height:auto;">'
                        '</div>'
                    )
                if explanation:
                    try:
                        import mistune
                        rendered_expl = mistune.html(explanation)
                    except ImportError:
                        import html as html_mod
                        rendered_expl = html_mod.escape(explanation).replace('\n', '<br>')
                    p.append(
                        '<div style="padding:10px 14px;border-radius:4px 4px 18px 18px;'
                        'font-size:14px;margin-top:2px;line-height:1.6;color:#374151;">'
                        f'{rendered_expl}</div>'
                    )
            p.append('</div>')  # close content div (bid)
            # Hidden div with Athena's raw response for copy-to-clipboard
            if raw_content:
                safe_raw = (raw_content.replace('&', '&amp;')
                            .replace('<', '&lt;').replace('>', '&gt;'))
                p.append(
                    f'<div id="{raw_id}" style="display:none;">'
                    f'{safe_raw}</div>'
                )
            else:
                # Fallback: copy visible text if no raw content available
                p.append(f'<div id="{raw_id}" style="display:none;"></div>')
            p.append(f'<div style="display:flex;justify-content:flex-end;margin-top:4px;">{copy_btn}</div>')
            p.append('</div></div>')
            return _wrap(''.join(p))

        def _sys(text):
            return _wrap(
                '<div style="text-align:center;color:#9ca3af;'
                f'font-size:12px;margin:8px 0;">\u2014 {text} \u2014</div>'
            )

        def _copy_btn(target_id):
            """Copy-to-clipboard button targeting a specific element by ID.
            Uses textContent to read from hidden divs (display:none)."""
            return (
                f'<button onclick="(function(btn){{'
                f'var el=document.getElementById(\'{target_id}\');'
                f'if(el){{navigator.clipboard.writeText(el.textContent).then(function(){{'
                f'btn.innerHTML=\'\\u2705\';'
                f'setTimeout(function(){{btn.innerHTML=\'\\ud83d\\udccb\';}},1500);'
                f'}});}}'
                f'}})(this)" '
                f'title="Copy to clipboard" '
                f'style="background:none;border:1px solid #d1d5db;border-radius:6px;'
                f'padding:4px 8px;cursor:pointer;font-size:18px;color:#6b7280;'
                f'display:inline-flex;align-items:center;'
                f'transition:all 0.2s;" '
                f'onmouseover="this.style.background=\'#f3f4f6\';this.style.borderColor=\'#9ca3af\'" '
                f'onmouseout="this.style.background=\'none\';this.style.borderColor=\'#d1d5db\'"'
                f'>\U0001f4cb</button>'
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
            layout=widgets.Layout(width='350px'),
        )
        conn_btn = widgets.Button(
            description='Connect', button_style='primary', icon='plug',
            layout=widgets.Layout(width='100px'),
        )

        # Schema checkbox - checked by default (sends table names as index)
        schema_checkbox = widgets.Checkbox(
            value=True,
            description='Send Tables',
            indent=False,
            layout=widgets.Layout(width='auto'),
            style={'description_width': 'auto'},
        )
        schema_tooltip = widgets.HTML(
            value=(
                '<span title="Sends table names to Athena as a quick index. '
                'Recommended for database queries. '
                'Uncheck only for chit-chat or non-database topics." '
                'style="cursor:help;color:#6b7280;font-size:14px;margin-left:2px;">'
                '\u24D8</span>'
            )
        )

        status = widgets.HTML(
            '<span style="color:#9ca3af;font-size:13px;">No database selected</span>'
        )

        # -- Chat area ---------------------------------------------------------
        # Use widgets.HTML with a message list - re-render ALL messages each time.
        # This avoids the Output widget's broken overflow behavior.

        chat_messages = []  # List of HTML strings
        bubble_counter = [0]  # Mutable counter for unique bubble IDs
        message_history = []  # User's sent messages (most recent last)
        history_index = [0]  # Current position when walking history with Up/Down

        def _render_chat():
            """Re-render all chat messages as a single HTML block."""
            content = ''.join(chat_messages)
            # Scrollable container — auto-scroll to bottom on re-render
            return (
                f'<div class="chat2db-scroll-container" style="height:380px;overflow-y:auto;'
                f'overflow-x:hidden;padding:12px;box-sizing:border-box;'
                f'min-height:150px;">'
                f'{content}'
                f'</div>'
                f'<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" '
                f'onload="(function(img){{'
                f'var c=img.previousElementSibling;'
                f'if(c)c.scrollTop=c.scrollHeight;'
                f'img.remove();'
                f'}})(this)" style="display:none">'
            )

        chat_html = widgets.HTML(
            value=_render_chat(),
            layout=widgets.Layout(
                height='400px',
                border='1px solid #e5e7eb',
                border_radius='8px',
            )
        )

        def _add_message(html):
            """Add a message and re-render the chat."""
            chat_messages.append(html)
            chat_html.value = _render_chat()

        def _remove_thinking():
            """Remove thinking indicator from message list."""
            nonlocal chat_messages
            chat_messages = [m for m in chat_messages if 'chat2db-thinking' not in m]
            chat_html.value = _render_chat()

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
            chat_messages.clear()
            if self._connection and self._connection_config:
                _add_message(_sys(
                    f'Connected to {self._connection_config.name} '
                    f'({self._connection_config.db_type}). Ask me anything!'
                ))
            else:
                _add_message(_sys(
                    'Select a database above, then ask questions in plain English'
                ))
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
                _add_message(_sys(
                    f'Connected to {self._connection_config.name} '
                    f'({self._connection_config.db_type}). Ask me anything!'
                ))
            except Exception as exc:
                status.value = (
                    f'<span style="color:#ef4444;font-size:13px;">'
                    f'Error: {exc}</span>'
                )

        def _thinking_bubble():
            """Render animated thinking indicator with cycling dots."""
            return _wrap(
                '<div class="chat2db-thinking" style="display:flex;align-items:flex-start;gap:8px;margin:12px 0;">'
                '<div style="width:30px;height:30px;border-radius:50%;'
                'background:#6366f1;display:flex;align-items:center;'
                'justify-content:center;flex-shrink:0;font-size:16px;">'
                '\U0001f989</div>'
                '<div style="background:#f3f4f6;padding:12px 18px;'
                'border-radius:0 18px 18px 18px;font-size:14px;color:#6b7280;">'
                '<style>'
                '@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}'
                '@keyframes dot{0%,100%{opacity:0}25%,75%{opacity:1}}'
                '</style>'
                '<span style="animation:pulse 1.5s ease-in-out infinite;">Thinking</span>'
                '<span style="display:inline-block;width:20px;text-align:left;letter-spacing:2px;">'
                '<span style="animation:dot 1.2s 0.0s ease-in-out infinite;">.</span>'
                '<span style="animation:dot 1.2s 0.2s ease-in-out infinite;">.</span>'
                '<span style="animation:dot 1.2s 0.4s ease-in-out infinite;">.</span>'
                '</span>'
                '</div></div>'
            )

        def _on_send(_btn=None):
            question = inp.value.strip()
            if not question:
                return

            # Store in message history for Up/Down arrow navigation
            # Avoid duplicating if same as last message; cap at 50 entries
            if not message_history or message_history[-1] != question:
                message_history.append(question)
                if len(message_history) > 50:
                    message_history.pop(0)
            # Reset history walk index to "past the end" (ready for new input)
            history_index[0] = len(message_history)
            # Sync history to JS side for Up/Down arrow navigation
            _sync_history()

            inp.value = ''

            # Disable input while processing
            inp.disabled = True
            send_btn.disabled = True

            # Add user message
            _add_message(_user_bubble(question))

            # Show thinking indicator
            _add_message(_thinking_bubble())

            try:
                # Pass schema if checkbox is checked
                result = self.ask(question, send_schema=schema_checkbox.value)

                # Remove thinking indicator
                _remove_thinking()

                # Build table HTML only for SQL query results
                tbl = (
                    result.df.head(20).to_html(index=False)
                    if not result.error and not result.text_response and len(result.df) > 0
                    else None
                )
                _add_message(_athena_bubble(
                    sql=result.sql or None,
                    table_html=tbl,
                    explanation=result.explanation,
                    error=result.error,
                    row_count=result.row_count,
                    exec_ms=result.execution_time_ms,
                    text_response=result.text_response,
                    viz_image=result.viz_image,
                    raw_content=result.raw_content,
                ))
            except Exception as exc:
                # Remove thinking indicator
                _remove_thinking()
                _add_message(_athena_bubble(error=str(exc)))
            finally:
                # Re-enable input
                inp.disabled = False
                send_btn.disabled = False
                inp.focus()

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
            _add_message(_sys(
                f'Connected to {self._connection_config.name}. Ask me anything!'
            ))
        else:
            _add_message(_sys(
                'Select a database above, then ask questions in plain English'
            ))
            if not connections:
                _add_message(_sys(
                    '\u26A0 No database connections found. '
                    'Check REPORTBURSTER_CONNECTIONS_PATH.'
                ))

        # -- Message history Up/Down arrow key navigation ----------------------
        # Inject JS that listens for ArrowUp / ArrowDown on the input widget.
        # The history list is synced from Python via a hidden widget.

        history_data = widgets.HTML(value='')  # Hidden, carries history JSON

        def _sync_history():
            """Push current message_history to the JS side via hidden widget."""
            import json
            history_data.value = (
                f'<span class="chat2db-history-data" style="display:none;">'
                f'{json.dumps(message_history)}</span>'
            )

        # Inject the keyboard handler via a one-time HTML/JS widget
        arrow_js = widgets.HTML(
            value=(
                '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" '
                'onload="(function(img){'
                'var container=img.closest(\'.widget-vbox\');'
                'if(!container){img.remove();return;}'
                'function setup(){'
                'var inp=container.querySelector(\'input[type=text]\');'
                'if(!inp){setTimeout(setup,200);return;}'
                'if(inp._chat2db_history_bound){img.remove();return;}'
                'inp._chat2db_history_bound=true;'
                'var idx=-1;var saved=\'\';'
                'inp.addEventListener(\'keydown\',function(e){'
                'var span=container.querySelector(\'.chat2db-history-data\');'
                'if(!span)return;'
                'var hist=[];'
                'try{hist=JSON.parse(span.textContent);}catch(x){return;}'
                'if(!hist.length)return;'
                'if(e.key===\'ArrowUp\'){'
                'e.preventDefault();'
                'if(idx===-1){saved=inp.value;idx=hist.length;}'
                'if(idx>0){idx--;inp.value=hist[idx];'
                'inp.dispatchEvent(new Event(\'input\',{bubbles:true}));}'
                '}'
                'else if(e.key===\'ArrowDown\'){'
                'e.preventDefault();'
                'if(idx===-1)return;'
                'idx++;'
                'if(idx>=hist.length){idx=-1;inp.value=saved;}'
                'else{inp.value=hist[idx];}'
                'inp.dispatchEvent(new Event(\'input\',{bubbles:true}));'
                '}'
                'else if(e.key!==\'ArrowLeft\'&&e.key!==\'ArrowRight\'){'
                'idx=-1;'
                '}'
                '});'
                '}'
                'setup();'
                'img.remove();'
                '})(this)" style="display:none">'
            )
        )

        # -- Resize handle (separate widget, survives chat re-renders) ---------
        # A visible grip bar at the bottom of the entire widget.
        # Dragging it resizes the chat scroll container + ipywidgets parent.
        resize_handle = widgets.HTML(
            value=(
                '<div class="chat2db-grip" style="'
                'display:flex;justify-content:center;align-items:center;'
                'height:10px;cursor:ns-resize;user-select:none;'
                'color:#9ca3af;font-size:14px;letter-spacing:3px;'
                'border-top:1px solid #e5e7eb;margin:0 8px;'
                '" title="Drag to resize">'
                '\u2261'  # ≡ triple bar grip icon
                '</div>'
                '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" '
                'onload="(function(img){'
                'var grip=img.previousElementSibling;'
                'if(!grip){img.remove();return;}'
                # Walk up to the VBox container, then find the chat scroll area
                'var vbox=img.closest(\'.widget-vbox\');'
                'if(!vbox){img.remove();return;}'
                'function setup(){'
                'var sc=vbox.querySelector(\'.chat2db-scroll-container\');'
                'if(!sc){setTimeout(setup,300);return;}'
                # Find the ipywidgets HTML wrapper that contains the scroll container
                'var htmlWidget=sc.closest(\'.widget-html\');'
                'grip.addEventListener(\'mousedown\',function(e){'
                'e.preventDefault();'
                'var startY=e.clientY;'
                'var startH=sc.offsetHeight;'
                'var startWH=htmlWidget?htmlWidget.offsetHeight:0;'
                'document.body.style.cursor=\'ns-resize\';'
                'function onMove(ev){'
                'var delta=ev.clientY-startY;'
                'var newH=startH+delta;'
                'if(newH<150)newH=150;'
                'if(newH>900)newH=900;'
                'sc.style.height=newH+\'px\';'
                # Also resize the ipywidgets wrapper so it doesn't clip
                'if(htmlWidget)htmlWidget.style.height=(startWH+delta)+\'px\';'
                '}'
                'function onUp(){'
                'document.body.style.cursor=\'\';'
                'document.removeEventListener(\'mousemove\',onMove);'
                'document.removeEventListener(\'mouseup\',onUp);'
                '}'
                'document.addEventListener(\'mousemove\',onMove);'
                'document.addEventListener(\'mouseup\',onUp);'
                '});'
                '}'
                'setup();'
                'img.remove();'
                '})(this)" style="display:none">'
            )
        )

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
            [conn_dd, conn_btn, schema_checkbox, schema_tooltip, status],
            layout=widgets.Layout(margin='0 0 8px', align_items='center'),
        )
        input_row = widgets.HBox(
            [inp, send_btn],
            layout=widgets.Layout(margin='8px 0 0'),
        )

        container = widgets.VBox(
            [header, conn_row, chat_html, input_row, resize_handle,
             history_data, arrow_js],
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
