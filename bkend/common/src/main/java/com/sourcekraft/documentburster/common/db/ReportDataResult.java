package com.sourcekraft.documentburster.common.db;

import java.util.LinkedHashMap;
import java.util.List;

import com.sourcekraft.documentburster.utils.DumpToString;

public class ReportDataResult extends DumpToString {
	public List<LinkedHashMap<String, Object>> reportData;
	public List<String> reportColumnNames;
	public long executionTimeMillis;
	public int totalRows;
	public int lastPage;  // total pages for remote pagination (ceil(totalRows / pageSize))
	public boolean truncated;

	// Entity-specific rendering fields
	public String entityCode;
	public String renderedHtml;
}
