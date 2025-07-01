package com.flowkraft.jobman.models;

import org.apache.commons.lang3.StringUtils;

import com.flowkraft.common.Constants;

public class FileInfo {

	// Fields
	private String name = StringUtils.EMPTY;
	private String path = StringUtils.EMPTY;
	private long size = -1;
	private boolean directory = false;
	private long lastModified = 0;

	// Default constructor needed by SystemController
	public FileInfo() {
	}

	// Existing constructor for backward compatibility
	public FileInfo(String fileName, String fileContent, boolean trimFileContent) {
		this.name = fileName;

		if (trimFileContent)
			this.fileContent = fileContent.substring(0,
					Math.min(fileContent.length(), Constants.KEEP_FIRST_N_CHARACTERS));
		else
			this.fileContent = fileContent;

		if (StringUtils.isNotBlank(fileContent))
			this.size = fileContent.length();
	}

	// Getters and Setters
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}

	public String getFileContent() {
		return fileContent;
	}

	public void setFileContent(String fileContent) {
		this.fileContent = fileContent;
	}

	public long getSize() {
		return size;
	}

	public void setSize(long size) {
		this.size = size;
	}

	public boolean isDirectory() {
		return directory;
	}

	public void setDirectory(boolean directory) {
		this.directory = directory;
	}

	public long getLastModified() {
		return lastModified;
	}

	public void setLastModified(long lastModified) {
		this.lastModified = lastModified;
	}

	// For backward compatibility - maintain public field access
	// but link them to the private fields via getters/setters
	public String fileName = StringUtils.EMPTY;
	public String filePath = StringUtils.EMPTY;
	public String fileContent = StringUtils.EMPTY;

	public long fileSize = -1;

}