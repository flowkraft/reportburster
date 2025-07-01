package com.sourcekraft.documentburster.common.reportparameters;

import java.util.HashMap;
import java.util.Map;

import com.sourcekraft.documentburster.utils.DumpToString;

public class ReportParameter extends DumpToString {

	public String id;
	public String type; // 'Date', 'Integer', 'String' etc

	// Optional metadata
	public String label;
	public String description;
	public String defaultValue;

	// Optional configurations
	public Map<String, Object> constraints = new HashMap<>();
	public Map<String, Object> uiHints = new HashMap<>();
	
}
