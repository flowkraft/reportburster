package com.flowkraft.jobman.models;

import java.util.Set;

public class FileTreeVO {
    private FileVO currentDirectory;
    private FileVO parentDirectory;
    private Set<FileVO> childDirectories;
    private Set<FileVO> files;

    public FileVO getCurrentDirectory() {
        return currentDirectory;
    }

    public void setCurrentDirectory(FileVO currentDirectory) {
        this.currentDirectory = currentDirectory;
    }

    public FileVO getParentDirectory() {
        return parentDirectory;
    }

    public void setParentDirectory(FileVO parentDirectory) {
        this.parentDirectory = parentDirectory;
    }

    public Set<FileVO> getChildDirectories() {
        return childDirectories;
    }

    public void setChildDirectories(Set<FileVO> childDirectories) {
        this.childDirectories = childDirectories;
    }

    public Set<FileVO> getFiles() {
        return files;
    }

    public void setFiles(Set<FileVO> files) {
        this.files = files;
    }
}