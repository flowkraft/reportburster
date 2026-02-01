package com.sourcekraft.documentburster.common.settings.model;

import com.sourcekraft.documentburster.utils.DumpToString;

public class ServerDatabaseSettings extends DumpToString {
	private static final long serialVersionUID = 1L;

	public String type;
	public String host;
	public String port;
	public String database;
	public String userid;
	public String userpassword;
	public boolean usessl;
	public String defaultquery;

	public String driver; // JDBC driver class
	public String url;    // Complete JDBC URL

	public void ensureDriverAndUrl() {
		if (this.type == null) return;
		String t = this.type.toLowerCase();

		switch (t) {
			case "sqlite":
				if (isBlank(this.driver)) this.driver = "org.sqlite.JDBC";
				// database holds the file path for sqlite
				if (isBlank(this.url))    this.url    = "jdbc:sqlite:" + this.database;
				break;

			case "duckdb":
				if (isBlank(this.driver)) this.driver = "org.duckdb.DuckDBDriver";
				// database holds the file path for duckdb (like sqlite)
				if (isBlank(this.url))    this.url    = "jdbc:duckdb:" + this.database;
				break;

			case "mysql":
				if (isBlank(this.driver)) this.driver = "com.mysql.cj.jdbc.Driver";
				if (isBlank(this.url)) {
					String ssl = this.usessl ? "true" : "false";
					this.url = "jdbc:mysql://" + host + ":" + port + "/" + database
					        + "?useSSL=" + ssl + "&allowPublicKeyRetrieval=true&serverTimezone=UTC";
				}
				break;

			case "mariadb":
				if (isBlank(this.driver)) this.driver = "org.mariadb.jdbc.Driver";
				if (isBlank(this.url))    this.url    = "jdbc:mariadb://" + host + ":" + port + "/" + database;
				break;

			case "postgresql":
			case "postgres":
				if (isBlank(this.driver)) this.driver = "org.postgresql.Driver";
				if (isBlank(this.url))    this.url    = "jdbc:postgresql://" + host + ":" + port + "/" + database;
				break;

			case "sqlserver":
				if (isBlank(this.driver)) this.driver = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
				if (isBlank(this.url))    this.url    = "jdbc:sqlserver://" + host + ":" + port + ";databaseName=" + database + ";encrypt=false";
				break;

			case "oracle":
				if (isBlank(this.driver)) this.driver = "oracle.jdbc.driver.OracleDriver";
				if (isBlank(this.url))    this.url    = "jdbc:oracle:thin:@" + host + ":" + port + "/" + database;
				break;

			case "ibmdb2":
			case "db2":
				if (isBlank(this.driver)) this.driver = "com.ibm.db2.jcc.DB2Driver";
				if (isBlank(this.url))    this.url    = "jdbc:db2://" + host + ":" + port + "/" + database;
				break;

			case "clickhouse":
				if (isBlank(this.driver)) this.driver = "com.clickhouse.jdbc.ClickHouseDriver";
				if (isBlank(this.url))    this.url    = "jdbc:clickhouse://" + host + ":" + port + "/" + database;
				break;
		}
	}

	private static boolean isBlank(String s) { return s == null || s.isEmpty(); }
}