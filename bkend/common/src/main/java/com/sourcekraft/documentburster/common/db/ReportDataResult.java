package com.sourcekraft.documentburster.common.db;

import java.util.LinkedHashMap;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sourcekraft.documentburster.utils.DumpToString;

public class ReportDataResult extends DumpToString {
	@JsonProperty("data")
	public List<LinkedHashMap<String, Object>> reportData;
	public List<String> reportColumnNames;
	public long executionTimeMillis;
	public int totalRows;
	@JsonProperty("last_page")
	public int lastPage;  // total pages for remote pagination (ceil(totalRows / pageSize))
	public boolean truncated;

	// Entity-specific rendering fields
	public String entityCode;
	public String renderedHtml;
}
