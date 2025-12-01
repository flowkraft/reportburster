package com.sourcekraft.documentburster.common.db;

import java.util.LinkedHashMap;
import java.util.List;

import com.sourcekraft.documentburster.utils.DumpToString;

public class ReportDataResult extends DumpToString {
	public List<LinkedHashMap<String, Object>> reportData;
	public List<String> reportColumnNames;
	public long executionTimeMillis;
	public boolean isPreview;
	public int totalRows;
}
