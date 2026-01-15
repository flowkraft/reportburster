package com.flowkraft.jobman.models;

public class SystemInfo {
	
	public String osName;
	public String osVersion;
	public String userName;
	public String osArch;
	
	public String product;

	// Docker availability info (populated by backend)
	public boolean isDockerInstalled = false; // whether 'docker' binary is present
	public boolean isDockerDaemonRunning = false; // whether daemon is reachable
	public String dockerVersion = "DOCKER_NOT_CHECKED"; // DOCKER_NOT_CHECKED => not yet probed

	// Chocolatey availability info (populated by backend)
	public boolean isChocoOk = false; // default: not yet checked
	public String chocoVersion = "CHOCO_NOT_CHECKED_YET";
		
} 
