"""
ReportBurster Database Connection Parser

Parses ReportBurster's XML database connection files and provides 
JDBC connectivity using JayDeBeApi.

Supports all databases that ReportBurster supports:
- PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, IBM DB2
- SQLite, DuckDB, ClickHouse
"""

import os
import glob
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from pathlib import Path

import jaydebeapi
from defusedxml import ElementTree as ET


@dataclass
class DatabaseConnection:
    """Represents a ReportBurster database connection configuration."""
    code: str
    name: str
    db_type: str
    host: Optional[str] = None
    port: Optional[str] = None
    database: Optional[str] = None
    userid: Optional[str] = None
    userpassword: Optional[str] = None
    usessl: bool = False
    default_query: Optional[str] = None
    driver: Optional[str] = None
    url: Optional[str] = None
    default_connection: bool = False
    file_path: Optional[str] = None

    def __post_init__(self):
        """Auto-compute driver and JDBC URL if not provided."""
        self._ensure_driver_and_url()

    def _ensure_driver_and_url(self):
        """
        Mirrors ReportBurster's ServerDatabaseSettings.ensureDriverAndUrl() logic.
        Auto-generates JDBC driver class and URL based on database type.
        """
        if not self.db_type:
            return
        
        t = self.db_type.lower()
        
        driver_map = {
            'sqlite': ('org.sqlite.JDBC', lambda s: f"jdbc:sqlite:{s.database}"),
            'duckdb': ('org.duckdb.DuckDBDriver', lambda s: f"jdbc:duckdb:{s.database or ''}"),
            'mysql': ('com.mysql.cj.jdbc.Driver', 
                     lambda s: f"jdbc:mysql://{s.host}:{s.port}/{s.database}?useSSL={'true' if s.usessl else 'false'}&allowPublicKeyRetrieval=true&serverTimezone=UTC"),
            'mariadb': ('org.mariadb.jdbc.Driver',
                       lambda s: f"jdbc:mariadb://{s.host}:{s.port}/{s.database}"),
            'postgresql': ('org.postgresql.Driver',
                          lambda s: f"jdbc:postgresql://{s.host}:{s.port}/{s.database}"),
            'postgres': ('org.postgresql.Driver',
                        lambda s: f"jdbc:postgresql://{s.host}:{s.port}/{s.database}"),
            'sqlserver': ('com.microsoft.sqlserver.jdbc.SQLServerDriver',
                         lambda s: f"jdbc:sqlserver://{s.host}:{s.port};databaseName={s.database};encrypt=false"),
            'oracle': ('oracle.jdbc.driver.OracleDriver',
                      lambda s: f"jdbc:oracle:thin:@{s.host}:{s.port}/{s.database}"),
            'ibmdb2': ('com.ibm.db2.jcc.DB2Driver',
                      lambda s: f"jdbc:db2://{s.host}:{s.port}/{s.database}"),
            'db2': ('com.ibm.db2.jcc.DB2Driver',
                   lambda s: f"jdbc:db2://{s.host}:{s.port}/{s.database}"),
            'clickhouse': ('com.clickhouse.jdbc.ClickHouseDriver',
                          lambda s: f"jdbc:clickhouse://{s.host}:{s.port}/{s.database}"),
            'supabase': ('org.postgresql.Driver',
                        lambda s: f"jdbc:postgresql://{s.host}:{s.port}/{s.database}?currentSchema=public"),
        }
        
        if t in driver_map:
            default_driver, url_builder = driver_map[t]
            if not self.driver:
                self.driver = default_driver
            if not self.url:
                self.url = url_builder(self)

# Known JDBC driver JAR filename prefixes (version-agnostic).
# Only these JARs need to be on the JVM classpath for database connectivity.
# This avoids loading hundreds of unrelated JARs (~270) which slows the
# first connection by up to a minute.
_JDBC_JAR_PREFIXES = (
    'sqlite-jdbc',
    'duckdb_jdbc',
    'mysql-connector',
    'mariadb-java-client',
    'postgresql',
    'mssql-jdbc',
    'ojdbc',
    'jcc-',
    'clickhouse-jdbc',
    'clickhouse-client',
    'clickhouse-data',
    'clickhouse-http-client',
)


class ReportBursterConnections:
    """
    Manages ReportBurster database connections.

    Reads connection configurations from ReportBurster's config/connections folder
    and provides JDBC connectivity.
    """

    def __init__(self,
                 connections_path: Optional[str] = None,
                 jdbc_drivers_path: Optional[str] = None):
        """
        Initialize the connection manager.

        Args:
            connections_path: Path to ReportBurster's config/connections folder.
                            Defaults to REPORTBURSTER_CONNECTIONS_PATH env var.
            jdbc_drivers_path: Path to JDBC driver JARs.
                             Defaults to JDBC_DRIVERS_PATH env var.
        """
        self.connections_path = connections_path or os.environ.get(
            'REPORTBURSTER_CONNECTIONS_PATH', '/reportburster/config/connections'
        )
        self.jdbc_drivers_path = jdbc_drivers_path or os.environ.get(
            'JDBC_DRIVERS_PATH', '/reportburster/lib'
        )
        self._connections: Dict[str, DatabaseConnection] = {}
        self._active_connection: Optional[jaydebeapi.Connection] = None
        self._all_jars: Optional[List[str]] = None
        
    def list_connections(self) -> List[DatabaseConnection]:
        """
        List all available database connections from ReportBurster config.
        
        Returns:
            List of DatabaseConnection objects.
        """
        self._connections.clear()
        connections = []
        
        # ReportBurster stores database connections in folders like db-*/
        if not os.path.exists(self.connections_path):
            print(f"⚠️ Connections path not found: {self.connections_path}")
            return connections
        
        # Look for db-* folders
        for folder_name in os.listdir(self.connections_path):
            if not folder_name.lower().startswith('db-'):
                continue
            
            folder_path = os.path.join(self.connections_path, folder_name)
            if not os.path.isdir(folder_path):
                continue
            
            # Look for the main XML file inside the folder
            xml_file = os.path.join(folder_path, f"{folder_name}.xml")
            if not os.path.exists(xml_file):
                continue
            
            try:
                conn = self._parse_connection_xml(xml_file)
                if conn:
                    connections.append(conn)
                    self._connections[conn.code] = conn
            except Exception as e:
                print(f"⚠️ Error parsing {xml_file}: {e}")
        
        return connections
    
    def _parse_connection_xml(self, xml_path: str) -> Optional[DatabaseConnection]:
        """
        Parse a ReportBurster database connection XML file.
        
        XML Structure:
        <documentburster>
          <connection>
            <code>db-xxx</code>
            <name>Connection Name</name>
            <default>false</default>
            <databaseserver>
              <type>postgresql</type>
              <host>localhost</host>
              <port>5432</port>
              <database>mydb</database>
              <userid>user</userid>
              <userpassword>pass</userpassword>
              <usessl>false</usessl>
              <defaultquery></defaultquery>
              <driver></driver>
              <url></url>
            </databaseserver>
          </connection>
        </documentburster>
        """
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            connection = root.find('connection')
            if connection is None:
                return None
            
            databaseserver = connection.find('databaseserver')
            if databaseserver is None:
                return None
            
            def get_text(element, tag: str, default: str = '') -> str:
                el = element.find(tag)
                return el.text if el is not None and el.text else default
            
            def get_bool(element, tag: str, default: bool = False) -> bool:
                val = get_text(element, tag, str(default)).lower()
                return val in ('true', '1', 'yes')
            
            db_value = get_text(databaseserver, 'database') or None
            db_type_value = get_text(databaseserver, 'type')

            # For file-based DBs (SQLite, DuckDB), the XML has the Windows host path
            # (e.g. "C:/Projects/.../db/sample-northwind-sqlite/northwind.db").
            # Inside Docker the same file lives under /reportburster/db/...,
            # so remap the host path to the container mount path.
            if db_value and db_type_value and db_type_value.lower() in ('sqlite', 'duckdb'):
                if not os.path.exists(db_value):
                    db_mount = os.environ.get('REPORTBURSTER_DB_PATH', '/reportburster/db')
                    normalized = db_value.replace('\\', '/')
                    idx = normalized.rfind('/db/')
                    if idx >= 0:
                        relative = normalized[idx + len('/db/'):]
                        candidate = os.path.join(db_mount, relative)
                        if os.path.exists(candidate):
                            db_value = candidate

            # For network-based DBs, the XML typically has "localhost" as the host.
            # Inside Docker, localhost refers to the container itself, not the host
            # machine. Remap to host.docker.internal so the container can reach
            # databases running on the host OS (Docker Desktop provides this DNS).
            host_value = get_text(databaseserver, 'host') or None
            if host_value and host_value.lower() in ('localhost', '127.0.0.1'):
                if os.path.exists('/.dockerenv'):
                    host_value = 'host.docker.internal'

            return DatabaseConnection(
                code=get_text(connection, 'code'),
                name=get_text(connection, 'name'),
                default_connection=get_bool(connection, 'default'),
                db_type=db_type_value,
                host=host_value,
                port=get_text(databaseserver, 'port') or None,
                database=db_value,
                userid=get_text(databaseserver, 'userid') or None,
                userpassword=get_text(databaseserver, 'userpassword') or None,
                usessl=get_bool(databaseserver, 'usessl'),
                default_query=get_text(databaseserver, 'defaultquery') or None,
                driver=get_text(databaseserver, 'driver') or None,
                url=get_text(databaseserver, 'url') or None,
                file_path=xml_path
            )
        except Exception as e:
            print(f"Error parsing XML: {e}")
            return None
    
    def get_connection(self, connection_code: str) -> Optional[DatabaseConnection]:
        """Get a specific connection by its code."""
        if not self._connections:
            self.list_connections()
        return self._connections.get(connection_code)
    
    def get_default_connection(self) -> Optional[DatabaseConnection]:
        """Get the default database connection."""
        if not self._connections:
            self.list_connections()
        for conn in self._connections.values():
            if conn.default_connection:
                return conn
        return None
    
    def connect(self, connection_code: str) -> jaydebeapi.Connection:
        """
        Create a JDBC connection to the specified database.
        
        Args:
            connection_code: The ReportBurster connection code (e.g., 'db-northwind-postgres')
        
        Returns:
            A JayDeBeApi Connection object.
        """
        conn_config = self.get_connection(connection_code)
        if not conn_config:
            raise ValueError(f"Connection not found: {connection_code}")
        
        return self.connect_with_config(conn_config)
    
    def _get_all_jdbc_jars(self) -> List[str]:
        """
        Collect JDBC driver JARs from the lib directory.

        JPype starts a single JVM per Python process. JARs passed to
        jaydebeapi.connect() after the JVM is already running are NOT
        added to the classpath (known JPype issue #914). To support
        switching between database types (e.g. SQLite -> DuckDB), we
        must pass ALL driver JARs on the very first connect() call so
        every driver class is available for the lifetime of the JVM.

        Only JARs matching known JDBC driver filename prefixes are
        loaded. This reduces ~270 JARs to ~12, cutting initial
        connection time from ~60s to a few seconds.
        """
        if self._all_jars is not None:
            return self._all_jars

        search_path = os.path.join(self.jdbc_drivers_path, '**', '*.jar')
        all_jars = glob.glob(search_path, recursive=True)

        self._all_jars = [
            jar for jar in all_jars
            if os.path.basename(jar).lower().startswith(_JDBC_JAR_PREFIXES)
        ]

        if self._all_jars:
            print(f"📦 Found {len(self._all_jars)} JDBC driver JAR(s) in {self.jdbc_drivers_path} (filtered from {len(all_jars)} total)")
        else:
            print(f"⚠️ No JDBC JARs found in {self.jdbc_drivers_path}")

        return self._all_jars

    def connect_with_config(self, conn_config: DatabaseConnection) -> jaydebeapi.Connection:
        """
        Create a JDBC connection using a DatabaseConnection config.

        Args:
            conn_config: DatabaseConnection object with connection details.

        Returns:
            A JayDeBeApi Connection object.
        """
        if not conn_config.driver:
            raise ValueError(f"No JDBC driver specified for {conn_config.code}")
        if not conn_config.url:
            raise ValueError(f"No JDBC URL specified for {conn_config.code}")

        # Collect ALL JDBC JARs so every driver is available regardless
        # of which database type is connected first (JPype issue #914).
        all_jars = self._get_all_jdbc_jars()

        # Build connection properties.
        # DuckDB needs duckdb.read_only=true because the Docker volume is
        # mounted :ro — without it DuckDB fails trying to create WAL/lock files.
        # jaydebeapi.connect() accepts either a list [user, pass] or a dict.
        db_type = (conn_config.db_type or '').lower()
        if db_type == 'duckdb':
            connect_args = {'duckdb.read_only': 'true'}
            if conn_config.userid:
                connect_args['user'] = conn_config.userid
            if conn_config.userpassword:
                connect_args['password'] = conn_config.userpassword
        else:
            creds = []
            if conn_config.userid:
                creds.append(conn_config.userid)
            if conn_config.userpassword:
                creds.append(conn_config.userpassword)
            connect_args = creds if creds else None

        print(f"🔌 Connecting to {conn_config.name} ({conn_config.db_type})")
        print(f"   Driver: {conn_config.driver}")
        print(f"   URL: {conn_config.url}")
        print(f"   JARs on classpath: {len(all_jars)}")

        # Create connection — pass all JARs so the JVM classpath includes
        # every driver from the first startup onward.
        connection = jaydebeapi.connect(
            conn_config.driver,
            conn_config.url,
            connect_args,
            all_jars if all_jars else None
        )
        
        self._active_connection = connection
        print(f"✅ Connected successfully!")
        return connection
    
    def close(self):
        """Close the active connection."""
        if self._active_connection:
            self._active_connection.close()
            self._active_connection = None
            print("🔌 Connection closed.")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def print_connections():
    """Utility function to print all available connections."""
    manager = ReportBursterConnections()
    connections = manager.list_connections()
    
    if not connections:
        print("No database connections found.")
        print(f"Looking in: {manager.connections_path}")
        return
    
    print("\n📁 Available ReportBurster Database Connections:\n")
    print("-" * 70)
    
    for conn in connections:
        default_marker = " ⭐ (default)" if conn.default_connection else ""
        print(f"  {conn.code}{default_marker}")
        print(f"    Name: {conn.name}")
        print(f"    Type: {conn.db_type}")
        if conn.host:
            print(f"    Host: {conn.host}:{conn.port}")
        if conn.database:
            print(f"    Database: {conn.database}")
        print()
    
    print("-" * 70)
    print(f"Total: {len(connections)} connection(s)")


if __name__ == "__main__":
    print_connections()
