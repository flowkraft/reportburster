package com.flowkraft.licenseman.model;

import jakarta.xml.bind.annotation.XmlRootElement;

import org.apache.commons.lang3.StringUtils;

@XmlRootElement(name = "license")
public class LicenseDetails {

	public String key = StringUtils.EMPTY;
    public String product = StringUtils.EMPTY;
    public String status = StringUtils.EMPTY;
    public String expires = StringUtils.EMPTY;

    public String customername = StringUtils.EMPTY;
    public String customeremail = StringUtils.EMPTY;
 
    public String latestversion = StringUtils.EMPTY;
    public String changelog = StringUtils.EMPTY;
    
}
