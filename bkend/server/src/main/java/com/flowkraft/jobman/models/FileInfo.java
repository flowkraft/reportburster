package com.flowkraft.jobman.models;

import org.apache.commons.lang3.StringUtils;

import com.flowkraft.common.Constants;
import com.sourcekraft.documentburster.utils.DumpToString;

public class FileInfo extends DumpToString {

	public FileInfo(String fileName, String fileContent, boolean trimFileContent) {

		this.fileName = fileName;

		if (trimFileContent)
			this.fileContent = fileContent.substring(0,
					Math.min(fileContent.length(), Constants.KEEP_FIRST_N_CHARACTERS));
		else
			this.fileContent = fileContent;

		if (StringUtils.isNotBlank(fileContent))
			this.fileSize = fileContent.length();

		// System.out.println(this.fileContent);

	}

	public long fileSize = -1;

	public String fileName = StringUtils.EMPTY;
	public String filePath = StringUtils.EMPTY;
	public String fileContent = StringUtils.EMPTY;

	public boolean isDirectory = false;
	public long lastModified;

	// public String trimmedFileContent = StringUtils.EMPTY;

}