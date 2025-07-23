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
	public String connectionstring;
	public String defaultquery;

	// Keep these if you need them
	public String driver; // JDBC driver class
	public String url; // Complete JDBC URL

	public void ensureDriverAndUrl() {
		if (this.type == null)
			return;
		switch (this.type.toLowerCase()) {
		case "sqlite":
			if (this.driver == null || this.driver.isEmpty())
				this.driver = "org.sqlite.JDBC";
			if (this.url == null || this.url.isEmpty())
				this.url = this.connectionstring != null ? this.connectionstring : "jdbc:sqlite:" + this.database;
			break;
		case "mysql":
			if (this.driver == null || this.driver.isEmpty())
				this.driver = "com.mysql.cj.jdbc.Driver";
			if (this.url == null || this.url.isEmpty())
				this.url = this.connectionstring != null ? this.connectionstring
						: "jdbc:mysql://" + this.host + ":" + this.port + "/" + this.database;
			break;
		case "postgresql":
			if (this.driver == null || this.driver.isEmpty())
				this.driver = "org.postgresql.Driver";
			if (this.url == null || this.url.isEmpty())
				this.url = this.connectionstring != null ? this.connectionstring
						: "jdbc:postgresql://" + this.host + ":" + this.port + "/" + this.database;
			break;
		case "sqlserver":
			if (this.driver == null || this.driver.isEmpty())
				this.driver = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
			if (this.url == null || this.url.isEmpty())
				this.url = this.connectionstring != null ? this.connectionstring
						: "jdbc:sqlserver://" + this.host + ":" + this.port + ";databaseName=" + this.database;
			break;
		// Add more DB types as needed
		}
	}

}