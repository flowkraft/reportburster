/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.common.settings.model;

import com.sourcekraft.documentburster.utils.DumpToString;

import jakarta.xml.bind.annotation.adapters.XmlJavaTypeAdapter;

public class BursterSettings extends DumpToString {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1491306376658414919L;

	public String version;

	public String template;

	@XmlJavaTypeAdapter(TrimmedStringAdapter.class)
	public String burstfilename;

	public String mergefilename;

	@XmlJavaTypeAdapter(TrimmedStringAdapter.class)
	public String outputfolder;

	@XmlJavaTypeAdapter(TrimmedStringAdapter.class)
	public String backupfolder;

	@XmlJavaTypeAdapter(TrimmedStringAdapter.class)
	public String quarantinefolder;

	@XmlJavaTypeAdapter(TrimmedStringAdapter.class)
	public String statsfilename;

	@XmlJavaTypeAdapter(TrimmedStringAdapter.class)
	public String logsarchivesfolder;

	public Capabilities capabilities;

	public SendFiles sendfiles;

	public Boolean deletefiles;
	public Boolean quarantinefiles;

	/* start text extraction options */
	public Boolean sortbyposition;
	public Boolean shouldseparatebybeads;
	public Boolean suppressduplicateoverlappingtext;

	public Float averagechartolerancevalue;
	public Float spacingtolerancevalue;

	/* end text extraction options */

	public ServerEmailSettings emailserver;

	public Boolean htmlemail;
	public Boolean htmlemaileditcode;

	public EmailSettings emailsettings;

	public UploadSettings uploadsettings;
	public WebUploadSettings webuploadsettings;

	public SmsSettings smssettings;

	public QualityAssurance qualityassurance;

	public Attachments attachments;

	public EmailRfc2822Validator emailrfc2822validator;
	public SimpleJavaMail simplejavamail;

	public Locale locale;
	public FreeMarkerSettings freemarker;

	public Integer numberofuservariables;
	public Double delayeachdistributionby;

	public Boolean reusetokenswhennotfound;
	public Boolean failjobifanydistributionfails;

	public Boolean enableretrypolicy;

	public RetryPolicy retrypolicy;

	public Boolean split2ndtime;
	public BurstTokenDelimiters bursttokendelimiters;
	
	public Boolean dumprecorddataasxml;

	public Boolean enableincubatingfeatures;

	public String notes;
	public String visibility;

}
