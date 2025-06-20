package com.sourcekraft.documentburster.common.settings.model;

import com.sourcekraft.documentburster.common.utils.DumpToString;

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
}