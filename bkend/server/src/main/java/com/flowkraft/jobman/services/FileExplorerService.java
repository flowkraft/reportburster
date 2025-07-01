package com.flowkraft.jobman.services;

import com.flowkraft.jobman.config.FileExplorerConfiguration;
import com.flowkraft.jobman.models.FileContentVO;
import com.flowkraft.jobman.models.FileTreeVO;
import com.flowkraft.jobman.models.FileVO;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.*;

@Service
public class FileExplorerService {

	@Autowired
	private FileExplorerConfiguration explorerConfiguration;

	public Map<String, Object> buildMetaInfo() {
		Map<String, Object> metaInfo = new HashMap<>();
		metaInfo.put("title",
				StringUtils.isNotEmpty(explorerConfiguration.getTitle()) ? explorerConfiguration.getTitle()
						: FileExplorerConfiguration.DEFAULT_TITLE);
		metaInfo.put("description",
				StringUtils.isNotEmpty(explorerConfiguration.getDescription()) ? explorerConfiguration.getDescription()
						: FileExplorerConfiguration.DEFAULT_DESCRIPTION);
		metaInfo.put("quickLinks", explorerConfiguration.getQuickLinks() != null ? explorerConfiguration.getQuickLinks()
				: Collections.emptyMap());
		return metaInfo;
	}

	public FileTreeVO buildFileTree(String dir) {

		if (dir == null) {
			dir = explorerConfiguration.getBaseDirPath();
		}

		String currentDirectoryPath = StringUtils.isNotEmpty(dir) ? dir : explorerConfiguration.getBaseDirPath();
		File currentDirectory = new File(currentDirectoryPath);

		// Check if directory exists and is accessible
		if (!currentDirectory.exists() || !currentDirectory.isDirectory() || !currentDirectory.canRead()) {
			// Fall back to base directory
			currentDirectory = new File(explorerConfiguration.getBaseDirPath());
		}

		// Ensure we're within allowed directory
		if (explorerConfiguration.getRestrictToBaseDir() && !isWithinBase(currentDirectory)) {
			currentDirectory = new File(explorerConfiguration.getBaseDirPath());
		}

		Set<FileVO> childDirectories = new TreeSet<>();
		Set<FileVO> files = new TreeSet<>();

		for (File file : currentDirectory.listFiles()) {
			if (file.isDirectory()) {
				childDirectories.add(new FileVO(file));
			} else {
				files.add(new FileVO(file));
			}
		}

		FileTreeVO fileTree = new FileTreeVO();
		fileTree.setCurrentDirectory(new FileVO(currentDirectory));
		if (currentDirectory.getParentFile() != null
				&& (!explorerConfiguration.getRestrictToBaseDir() || isWithinBase(currentDirectory.getParentFile()))) {
			fileTree.setParentDirectory(new FileVO(currentDirectory.getParentFile()));
		}
		fileTree.setChildDirectories(childDirectories);
		fileTree.setFiles(files);

		return fileTree;
	}

	private boolean isWithinBase(File dir) {
		boolean isWithinBase = false;
		File localDir = dir;
		File baseDir = new File(explorerConfiguration.getBaseDirPath());
		if (baseDir.equals(dir)) {
			isWithinBase = true;
		}

		while (!isWithinBase && localDir.getParentFile() != null) {
			if (baseDir.equals(localDir.getParentFile())) {
				isWithinBase = true;
			}
			localDir = localDir.getParentFile();
		}

		return isWithinBase;
	}

	/**
	 * Setter
	 */
	public void setFileExplorerConfiguration(FileExplorerConfiguration explorerConfiguration) {
		this.explorerConfiguration = explorerConfiguration;
	}

	public FileContentVO readFile(String filePath) {
		try {
			File file = new File(filePath);

			FileContentVO fileContentVO = new FileContentVO();
			fileContentVO.setFileName(file.getName());
			fileContentVO.setContent(FileUtils.readFileToByteArray(file));

			return fileContentVO;
		} catch (IOException exp) {
			return null;
		}
	}
}