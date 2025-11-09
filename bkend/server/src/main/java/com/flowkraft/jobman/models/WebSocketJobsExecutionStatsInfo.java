package com.flowkraft.jobman.models;

import java.util.stream.Stream;

public class WebSocketJobsExecutionStatsInfo {

    private String eventType;
    private Stream<FileInfo> filesPayload;
    private int exitValue;
    private String exceptionMessage;

    public WebSocketJobsExecutionStatsInfo(String eventType) {
        this.eventType = eventType;
    }

    public WebSocketJobsExecutionStatsInfo(String eventType, Stream<FileInfo> filesPayload) {
        this.eventType = eventType;
        this.filesPayload = filesPayload;
    }

    public WebSocketJobsExecutionStatsInfo(String eventType, int exitValue) {
        this.eventType = eventType;
        this.exitValue = exitValue;
    }

    // Getters
    public String getEventType() {
        return eventType;
    }

    public Stream<FileInfo> getFilesPayload() {
        return filesPayload;
    }

    public int getExitValue() {
        return exitValue;
    }

    public String getExceptionMessage() {
        return exceptionMessage;
    }

    // Setters
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public void setFilesPayload(Stream<FileInfo> filesPayload) {
        this.filesPayload = filesPayload;
    }

    public void setExitValue(int exitValue) {
        this.exitValue = exitValue;
    }

    public void setExceptionMessage(String exceptionMessage) {
        this.exceptionMessage = exceptionMessage;
    }

    // Optional: toString, equals, hashCode
    @Override
    public String toString() {
        return "WebSocketJobsExecutionStatsInfo{" +
            "eventType='" + eventType + '\'' +
            ", filesPayload=" + filesPayload +
            ", exitValue=" + exitValue +
            ", exceptionMessage='" + exceptionMessage + '\'' +
            '}';
    }
}