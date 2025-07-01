package com.flowkraft.jobman.services;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.unix4j.Unix4j;

import com.flowkraft.jobman.models.FileInfo;

@Service
public class IOUtilsService {

	public Stream<FileInfo> ls(String path) throws Exception {

		List<String> allFileNames = Unix4j.cd(path).ls().toStringList();
		List<FileInfo> allFiles = new ArrayList<FileInfo>();

		allFileNames.forEach(fileName -> {
			FileInfo fileInfo = new FileInfo(fileName, StringUtils.EMPTY, false);
			fileInfo.filePath = path;
			allFiles.add(fileInfo);
		});

		return allFiles.stream();

	}

	public byte[] readBinaryFile(String path) throws Exception {
		return java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(path));
	}

}
