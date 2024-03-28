package com.flowkraft.licenseman;

import org.apache.commons.lang3.StringUtils;

public class AboutInfo {

	public static class ChangeLogInfo {
		
		public String description = StringUtils.EMPTY;
		public String changelog = StringUtils.EMPTY;
		
	}
	
	public static class EDDProductInfo {

		
		public String new_version = StringUtils.EMPTY;
		
		public String name = StringUtils.EMPTY;
		public String slug = StringUtils.EMPTY;
		public String url = StringUtils.EMPTY;
		
		public ChangeLogInfo sections;

	}
	
	public String product = StringUtils.EMPTY;
	public String version = StringUtils.EMPTY;
	public String latestversion = StringUtils.EMPTY;
	public String changelog = StringUtils.EMPTY;

}