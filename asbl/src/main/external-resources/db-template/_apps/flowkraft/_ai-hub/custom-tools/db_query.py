"""
Universal database query tool for ReportBurster connections.

Executes READ-ONLY SQL queries against any configured ReportBurster database
connection. Supports all 9 database types: SQLite, DuckDB, PostgreSQL, MySQL,
MariaDB, SQL Server, Oracle, IBM Db2, ClickHouse.

Parses connection details from ReportBurster's XML config files at
/reportburster/config/connections/db-*/db-*.xml and routes to the
appropriate native Python driver.

Safety: Blocks all destructive SQL (DELETE, DROP, UPDATE, INSERT, ALTER, etc.)
at the Python level. This tool is strictly read-only.
"""

import os
import re
import json
import csv
import io
import sqlite3
import xml.etree.ElementTree as ET

# Connection config path (mounted in Docker)
CONNECTIONS_PATH = os.environ.get(
    'REPORTBURSTER_CONNECTIONS_PATH',
    '/reportburster/config/connections'
)

# Database file path for SQLite/DuckDB
DB_PATH = os.environ.get('REPORTBURSTER_DB_PATH', '/reportburster/db')

# Dangerous SQL patterns — block these unconditionally
DANGEROUS_PATTERNS = [
    r'\bDELETE\b', r'\bDROP\b', r'\bTRUNCATE\b', r'\bUPDATE\b',
    r'\bALTER\b', r'\bINSERT\b', r'\bCREATE\b', r'\bGRANT\b',
    r'\bREVOKE\b', r'\bEXEC\b', r'\bEXECUTE\b',
]

# Vendor-specific "list tables" queries
LIST_TABLES_QUERIES = {
    'sqlite': "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    'duckdb': "SELECT table_name FROM information_schema.tables WHERE table_schema='main' ORDER BY table_name",
    'postgresql': "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name",
    'postgres': "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name",
    'mysql': "SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE' ORDER BY table_name",
    'mariadb': "SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE' ORDER BY table_name",
    'sqlserver': "SELECT table_name FROM information_schema.tables WHERE table_schema='dbo' AND table_type='BASE TABLE' ORDER BY table_name",
    'oracle': "SELECT table_name FROM user_tables ORDER BY table_name",
    'ibmdb2': "SELECT tabname AS table_name FROM syscat.tables WHERE tabschema=CURRENT SCHEMA AND type='T' ORDER BY tabname",
    'db2': "SELECT tabname AS table_name FROM syscat.tables WHERE tabschema=CURRENT SCHEMA AND type='T' ORDER BY tabname",
    'clickhouse': "SELECT name AS table_name FROM system.tables WHERE database=currentDatabase() ORDER BY name",
}


def _parse_connection_xml(connection_code: str) -> dict:
    """Parse a ReportBurster connection XML file and return connection details."""
    # Check for sample Northwind SQLite (not in config/connections)
    if connection_code == 'sample-northwind-sqlite':
        db_file = os.path.join(DB_PATH, 'sample-northwind-sqlite', 'northwind.db')
        return {
            'code': connection_code,
            'db_type': 'sqlite',
            'database': db_file,
        }

    xml_path = os.path.join(CONNECTIONS_PATH, connection_code, f'{connection_code}.xml')
    if not os.path.exists(xml_path):
        raise Exception(f"Connection config not found: {xml_path}")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    conn_el = root.find('connection')
    if conn_el is None:
        raise Exception(f"No <connection> element in {xml_path}")

    db_el = conn_el.find('databaseserver')
    if db_el is None:
        raise Exception(f"No <databaseserver> element in {xml_path}")

    def txt(parent, tag, default=''):
        el = parent.find(tag)
        return el.text if el is not None and el.text else default

    return {
        'code': txt(conn_el, 'code'),
        'db_type': txt(db_el, 'type', '').lower(),
        'host': txt(db_el, 'host'),
        'port': txt(db_el, 'port'),
        'database': txt(db_el, 'database'),
        'userid': txt(db_el, 'userid'),
        'userpassword': txt(db_el, 'userpassword'),
        'usessl': txt(db_el, 'usessl', 'false').lower() == 'true',
    }


def _connect(cfg: dict):
    """Create a database connection using the appropriate native Python driver."""
    db_type = cfg['db_type']

    # --- SQLite (stdlib) ---
    if db_type == 'sqlite':
        db_path = cfg['database']
        if not os.path.exists(db_path):
            raise Exception(f"SQLite database file not found: {db_path}")
        return sqlite3.connect(db_path)

    # --- DuckDB ---
    if db_type == 'duckdb':
        try:
            import duckdb
        except ImportError:
            raise Exception("DuckDB driver not installed. Run: pip install duckdb")
        db_path = cfg.get('database', '')
        return duckdb.connect(db_path if db_path else ':memory:')

    # --- PostgreSQL ---
    if db_type in ('postgresql', 'postgres'):
        try:
            import psycopg2
        except ImportError:
            raise Exception("PostgreSQL driver not installed. Run: pip install psycopg2-binary")
        return psycopg2.connect(
            host=cfg['host'], port=int(cfg['port'] or 5432),
            dbname=cfg['database'], user=cfg['userid'],
            password=cfg['userpassword'],
            sslmode='require' if cfg.get('usessl') else 'prefer',
        )

    # --- MySQL / MariaDB ---
    if db_type in ('mysql', 'mariadb'):
        try:
            import mysql.connector
        except ImportError:
            raise Exception("MySQL driver not installed. Run: pip install mysql-connector-python")
        return mysql.connector.connect(
            host=cfg['host'], port=int(cfg['port'] or 3306),
            database=cfg['database'], user=cfg['userid'],
            password=cfg['userpassword'],
            ssl_disabled=not cfg.get('usessl', False),
        )

    # --- SQL Server ---
    if db_type == 'sqlserver':
        try:
            import pyodbc
        except ImportError:
            raise Exception("SQL Server driver not installed. Run: pip install pyodbc")
        conn_str = (
            f"DRIVER={{ODBC Driver 18 for SQL Server}};"
            f"SERVER={cfg['host']},{cfg['port'] or 1433};"
            f"DATABASE={cfg['database']};"
            f"UID={cfg['userid']};PWD={cfg['userpassword']};"
            f"TrustServerCertificate=yes;"
        )
        return pyodbc.connect(conn_str)

    # --- Oracle ---
    if db_type == 'oracle':
        try:
            import oracledb
        except ImportError:
            raise Exception("Oracle driver not installed. Run: pip install oracledb")
        dsn = f"{cfg['host']}:{cfg['port'] or 1521}/{cfg['database']}"
        return oracledb.connect(user=cfg['userid'], password=cfg['userpassword'], dsn=dsn)

    # --- IBM Db2 ---
    if db_type in ('ibmdb2', 'db2'):
        try:
            import ibm_db
            import ibm_db_dbi
        except ImportError:
            raise Exception("IBM Db2 driver not installed. Run: pip install ibm-db")
        conn_str = (
            f"DATABASE={cfg['database']};"
            f"HOSTNAME={cfg['host']};"
            f"PORT={cfg['port'] or 50000};"
            f"PROTOCOL=TCPIP;"
            f"UID={cfg['userid']};PWD={cfg['userpassword']};"
        )
        ibm_conn = ibm_db.connect(conn_str, '', '')
        return ibm_db_dbi.Connection(ibm_conn)

    # --- ClickHouse ---
    if db_type == 'clickhouse':
        try:
            import clickhouse_connect
        except ImportError:
            raise Exception("ClickHouse driver not installed. Run: pip install clickhouse-connect")
        return clickhouse_connect.get_client(
            host=cfg['host'], port=int(cfg['port'] or 8123),
            database=cfg['database'],
            username=cfg['userid'] or 'default',
            password=cfg['userpassword'] or '',
        )

    raise Exception(f"Unsupported database type: {db_type}")


def _format_results(columns: list, rows: list, fmt: str, max_rows: int) -> str:
    """Format query results as table, json, or csv."""
    truncated = len(rows) > max_rows
    rows = rows[:max_rows]

    if fmt == 'json':
        data = [dict(zip(columns, row)) for row in rows]
        result = json.dumps(data, indent=2, default=str)
        if truncated:
            result += f"\n\n[Showing {max_rows} of more rows. Use max_rows parameter to see more.]"
        return result

    if fmt == 'csv':
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(columns)
        writer.writerows(rows)
        result = buf.getvalue()
        if truncated:
            result += f"\n[Showing {max_rows} of more rows.]"
        return result

    # Default: table format using tabulate
    try:
        from tabulate import tabulate
        result = tabulate(rows, headers=columns, tablefmt='simple')
    except ImportError:
        # Fallback: simple column format
        header = ' | '.join(str(c) for c in columns)
        sep = '-+-'.join('-' * max(len(str(c)), 5) for c in columns)
        lines = [header, sep]
        for row in rows:
            lines.append(' | '.join(str(v) for v in row))
        result = '\n'.join(lines)

    if truncated:
        result += f"\n\n[Showing {max_rows} of more rows. Use max_rows parameter to see more.]"

    row_info = f"{len(rows)}{'+ (truncated)' if truncated else ''} row(s)"
    return f"{result}\n\n{row_info}"


def db_query(connection_code: str, sql: str, format: str = "table", max_rows: int = 50) -> str:
    """
    Execute a READ-ONLY SQL query on any ReportBurster database connection.

    This tool connects to any database configured in ReportBurster using the
    connection code (e.g., 'db-northwind-sqlite', 'db-sales-postgres').
    It supports SQLite, DuckDB, PostgreSQL, MySQL, MariaDB, SQL Server,
    Oracle, IBM Db2, and ClickHouse.

    To discover available connections, run:
        db_query(connection_code="", sql="LIST CONNECTIONS")

    To list tables in a database:
        db_query(connection_code="db-northwind-sqlite", sql="SHOW TABLES")

    To query data:
        db_query(connection_code="db-northwind-sqlite", sql="SELECT * FROM Customers LIMIT 10")

    Args:
        connection_code (str): ReportBurster connection code (e.g., 'db-northwind-sqlite').
                              Use empty string with sql="LIST CONNECTIONS" to see available connections.
        sql (str): SQL query to execute. Use "SHOW TABLES" or "LIST TABLES" to list tables.
                   Use "LIST CONNECTIONS" to list available database connections.
        format (str): Output format - "table" (default), "json", or "csv".
        max_rows (int): Maximum rows to return (default: 50). Increase for larger result sets.

    Returns:
        str: Query results formatted as a table, JSON, or CSV.

    Examples:
        >>> db_query("db-northwind-sqlite", "SELECT * FROM Customers LIMIT 5")
        >>> db_query("db-sales-postgres", "SHOW TABLES")
        >>> db_query("db-northwind-sqlite", "SELECT COUNT(*) FROM Orders", format="json")
        >>> db_query("", "LIST CONNECTIONS")
    """
    print(f"db_query called: connection={connection_code}, sql={sql[:100]}...")

    # --- LIST CONNECTIONS mode ---
    if sql.strip().upper() in ('LIST CONNECTIONS', 'SHOW CONNECTIONS'):
        return _list_connections()

    if not connection_code:
        raise Exception("connection_code is required. Use sql='LIST CONNECTIONS' to see available connections.")

    # --- Safety check: block destructive SQL ---
    sql_upper = sql.strip().upper()
    if sql_upper not in ('SHOW TABLES', 'LIST TABLES'):
        for pattern in DANGEROUS_PATTERNS:
            if re.search(pattern, sql, re.IGNORECASE):
                raise Exception(
                    f"BLOCKED: Destructive SQL detected ({pattern.strip()}). "
                    "This tool is READ-ONLY. Only SELECT queries are allowed."
                )

    # --- Parse connection config ---
    cfg = _parse_connection_xml(connection_code)
    db_type = cfg['db_type']
    print(f"db_query: connecting to {connection_code} (type={db_type})")

    # --- SHOW TABLES convenience ---
    if sql_upper in ('SHOW TABLES', 'LIST TABLES'):
        table_query = LIST_TABLES_QUERIES.get(db_type)
        if not table_query:
            raise Exception(f"SHOW TABLES not implemented for database type: {db_type}")
        sql = table_query

    # --- ClickHouse uses a different API (not DB-API 2.0) ---
    if db_type == 'clickhouse':
        return _query_clickhouse(cfg, sql, format, max_rows)

    # --- Standard DB-API 2.0 flow ---
    conn = _connect(cfg)
    try:
        cursor = conn.cursor()
        cursor.execute(sql)

        # Get column names
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        if not columns:
            return "Query executed successfully (no results returned)."

        rows = cursor.fetchall()
        # Convert to plain lists (some drivers return special row types)
        rows = [list(row) for row in rows]

        return _format_results(columns, rows, format, max_rows)
    finally:
        conn.close()


def _query_clickhouse(cfg: dict, sql: str, fmt: str, max_rows: int) -> str:
    """ClickHouse uses clickhouse-connect which has a different API."""
    import clickhouse_connect
    client = clickhouse_connect.get_client(
        host=cfg['host'], port=int(cfg['port'] or 8123),
        database=cfg['database'],
        username=cfg['userid'] or 'default',
        password=cfg['userpassword'] or '',
    )
    try:
        result = client.query(sql)
        columns = result.column_names
        rows = [list(row) for row in result.result_rows]
        return _format_results(columns, rows, fmt, max_rows)
    finally:
        client.close()


def _list_connections() -> str:
    """List all available ReportBurster database connections."""
    connections = []

    if os.path.exists(CONNECTIONS_PATH):
        for folder_name in sorted(os.listdir(CONNECTIONS_PATH)):
            if not folder_name.lower().startswith('db-'):
                continue
            xml_path = os.path.join(CONNECTIONS_PATH, folder_name, f'{folder_name}.xml')
            if not os.path.exists(xml_path):
                continue
            try:
                cfg = _parse_connection_xml(folder_name)
                connections.append(f"  {cfg['code']} ({cfg['db_type']})")
            except Exception as e:
                connections.append(f"  {folder_name} (error: {e})")

    # Check for sample Northwind SQLite
    northwind = os.path.join(DB_PATH, 'sample-northwind-sqlite', 'northwind.db')
    if os.path.exists(northwind):
        connections.append("  sample-northwind-sqlite (sqlite)")

    if not connections:
        return "No database connections found. Check REPORTBURSTER_CONNECTIONS_PATH."

    header = "Available ReportBurster Database Connections:\n"
    return header + '\n'.join(connections)


# --- Self-test ---
if __name__ == '__main__':
    print("=== db_query self-test ===\n")

    # Test LIST CONNECTIONS
    print("1. Listing connections:")
    try:
        print(db_query("", "LIST CONNECTIONS"))
    except Exception as e:
        print(f"   Error: {e}")

    # Test SHOW TABLES on Northwind SQLite
    print("\n2. SHOW TABLES on sample-northwind-sqlite:")
    try:
        print(db_query("sample-northwind-sqlite", "SHOW TABLES"))
    except Exception as e:
        print(f"   Error: {e}")

    # Test a simple query
    print("\n3. SELECT query:")
    try:
        print(db_query("sample-northwind-sqlite", "SELECT * FROM Customers LIMIT 5"))
    except Exception as e:
        print(f"   Error: {e}")

    # Test safety: should be blocked
    print("\n4. Safety check (should be blocked):")
    try:
        print(db_query("sample-northwind-sqlite", "DELETE FROM Customers"))
    except Exception as e:
        print(f"   Correctly blocked: {e}")

    print("\n=== Self-test complete ===")
