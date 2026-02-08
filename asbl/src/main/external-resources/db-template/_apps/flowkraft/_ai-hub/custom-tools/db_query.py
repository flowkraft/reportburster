import os
import re
import json
import csv
import io
import sqlite3
import xml.etree.ElementTree as ET


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

    connections_path = os.environ.get(
        'REPORTBURSTER_CONNECTIONS_PATH',
        '/reportburster/config/connections'
    )

    dangerous_patterns = [
        r'\bDELETE\b', r'\bDROP\b', r'\bTRUNCATE\b', r'\bUPDATE\b',
        r'\bALTER\b', r'\bINSERT\b', r'\bCREATE\b', r'\bGRANT\b',
        r'\bREVOKE\b', r'\bEXEC\b', r'\bEXECUTE\b',
    ]

    list_tables_queries = {
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

    # ── LIST CONNECTIONS mode ──
    if sql.strip().upper() in ('LIST CONNECTIONS', 'SHOW CONNECTIONS'):
        connections = []
        if os.path.exists(connections_path):
            for folder_name in sorted(os.listdir(connections_path)):
                if not folder_name.lower().startswith('db-'):
                    continue
                xml_file = os.path.join(connections_path, folder_name, f'{folder_name}.xml')
                if not os.path.exists(xml_file):
                    continue
                try:
                    tree = ET.parse(xml_file)
                    root = tree.getroot()
                    conn_el = root.find('connection')
                    db_el = conn_el.find('databaseserver') if conn_el is not None else None
                    code_el = conn_el.find('code') if conn_el is not None else None
                    type_el = db_el.find('type') if db_el is not None else None
                    code = code_el.text if code_el is not None and code_el.text else folder_name
                    db_type_str = type_el.text.lower() if type_el is not None and type_el.text else 'unknown'
                    connections.append(f"  {code} ({db_type_str})")
                except Exception as e:
                    connections.append(f"  {folder_name} (error: {e})")

        if not connections:
            return "No database connections found. Check REPORTBURSTER_CONNECTIONS_PATH."
        return "Available ReportBurster Database Connections:\n" + '\n'.join(connections)

    if not connection_code:
        raise Exception("connection_code is required. Use sql='LIST CONNECTIONS' to see available connections.")

    # ── Safety check: block destructive SQL ──
    sql_upper = sql.strip().upper()
    if sql_upper not in ('SHOW TABLES', 'LIST TABLES'):
        for pattern in dangerous_patterns:
            if re.search(pattern, sql, re.IGNORECASE):
                raise Exception(
                    f"BLOCKED: Destructive SQL detected ({pattern.strip()}). "
                    "This tool is READ-ONLY. Only SELECT queries are allowed."
                )

    # ── Parse connection config (always from XML — no synthetic connections) ──
    xml_path = os.path.join(connections_path, connection_code, f'{connection_code}.xml')
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

    # Inline XML text extraction (no nested function — Letta parses all def statements)
    cfg = {}
    for key, parent, tag, default in [
        ('code', conn_el, 'code', ''),
        ('db_type', db_el, 'type', ''),
        ('host', db_el, 'host', ''),
        ('port', db_el, 'port', ''),
        ('database', db_el, 'database', ''),
        ('userid', db_el, 'userid', ''),
        ('userpassword', db_el, 'userpassword', ''),
        ('usessl', db_el, 'usessl', 'false'),
    ]:
        el = parent.find(tag)
        cfg[key] = el.text if el is not None and el.text else default
    cfg['db_type'] = cfg['db_type'].lower()
    cfg['usessl'] = cfg['usessl'].lower() == 'true'

    # For file-based DBs (SQLite, DuckDB), the XML has the Windows host path.
    # Inside Docker the same file lives under /reportburster/db/,
    # so remap the host path to the container mount path.
    if cfg['db_type'] in ('sqlite', 'duckdb') and cfg['database']:
        if not os.path.exists(cfg['database']):
            db_mount = os.environ.get('REPORTBURSTER_DB_PATH', '/reportburster/db')
            normalized = cfg['database'].replace('\\', '/')
            idx = normalized.rfind('/db/')
            if idx >= 0:
                relative = normalized[idx + len('/db/'):]
                candidate = os.path.join(db_mount, relative)
                if os.path.exists(candidate):
                    cfg['database'] = candidate

    db_type = cfg['db_type']
    print(f"db_query: connecting to {connection_code} (type={db_type})")

    # ── SHOW TABLES convenience ──
    if sql_upper in ('SHOW TABLES', 'LIST TABLES'):
        table_query = list_tables_queries.get(db_type)
        if not table_query:
            raise Exception(f"SHOW TABLES not implemented for database type: {db_type}")
        sql = table_query

    # ── Connect and execute ──
    columns = []
    rows = []

    if db_type == 'clickhouse':
        # ClickHouse uses a different API (not DB-API 2.0)
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
        finally:
            client.close()
    else:
        # Standard DB-API 2.0 drivers
        conn = None

        if db_type == 'sqlite':
            db_file = cfg['database']
            if not os.path.exists(db_file):
                raise Exception(f"SQLite database file not found: {db_file}")
            conn = sqlite3.connect(db_file)

        elif db_type == 'duckdb':
            import duckdb
            conn = duckdb.connect(cfg.get('database', '') or ':memory:')

        elif db_type in ('postgresql', 'postgres'):
            import psycopg2
            conn = psycopg2.connect(
                host=cfg['host'], port=int(cfg['port'] or 5432),
                dbname=cfg['database'], user=cfg['userid'],
                password=cfg['userpassword'],
                sslmode='require' if cfg.get('usessl') else 'prefer',
            )

        elif db_type in ('mysql', 'mariadb'):
            import mysql.connector
            conn = mysql.connector.connect(
                host=cfg['host'], port=int(cfg['port'] or 3306),
                database=cfg['database'], user=cfg['userid'],
                password=cfg['userpassword'],
                ssl_disabled=not cfg.get('usessl', False),
            )

        elif db_type == 'sqlserver':
            import pyodbc
            conn = pyodbc.connect(
                f"DRIVER={{ODBC Driver 18 for SQL Server}};"
                f"SERVER={cfg['host']},{cfg['port'] or 1433};"
                f"DATABASE={cfg['database']};"
                f"UID={cfg['userid']};PWD={cfg['userpassword']};"
                f"TrustServerCertificate=yes;"
            )

        elif db_type == 'oracle':
            import oracledb
            dsn = f"{cfg['host']}:{cfg['port'] or 1521}/{cfg['database']}"
            conn = oracledb.connect(user=cfg['userid'], password=cfg['userpassword'], dsn=dsn)

        elif db_type in ('ibmdb2', 'db2'):
            import ibm_db
            import ibm_db_dbi
            ibm_conn = ibm_db.connect(
                f"DATABASE={cfg['database']};HOSTNAME={cfg['host']};"
                f"PORT={cfg['port'] or 50000};PROTOCOL=TCPIP;"
                f"UID={cfg['userid']};PWD={cfg['userpassword']};", '', ''
            )
            conn = ibm_db_dbi.Connection(ibm_conn)

        else:
            raise Exception(f"Unsupported database type: {db_type}")

        try:
            cursor = conn.cursor()
            cursor.execute(sql)
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            if not columns:
                return "Query executed successfully (no results returned)."
            rows = [list(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    # ── Format output ──
    truncated = len(rows) > max_rows
    rows = rows[:max_rows]

    if format == 'json':
        data = [dict(zip(columns, row)) for row in rows]
        result = json.dumps(data, indent=2, default=str)
        if truncated:
            result += f"\n\n[Showing {max_rows} of more rows. Use max_rows parameter to see more.]"
        return result

    if format == 'csv':
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(columns)
        writer.writerows(rows)
        result = buf.getvalue()
        if truncated:
            result += f"\n[Showing {max_rows} of more rows.]"
        return result

    # Default: table format
    try:
        from tabulate import tabulate
        result = tabulate(rows, headers=columns, tablefmt='simple')
    except ImportError:
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
