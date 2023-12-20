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
package com.sourcekraft.documentburster.settings.model;

import com.sourcekraft.documentburster.utils.DumpToString;

public class BursterSettings extends DumpToString {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1491306376658414919L;

	public String version;

	public String template;

	public String burstfilename;

	public String mergefilename;

	public String outputfolder;

	public String backupfolder;

	public String quarantinefolder;

	public String statsfilename;

	public String logsarchivesfolder;

	public Capabilities capabilities;

	public SendFiles sendfiles;

	public boolean deletefiles;
	public boolean quarantinefiles;

	/* start text extraction options */
	public boolean sortbyposition;
	public boolean shouldseparatebybeads;
	public boolean suppressduplicateoverlappingtext;

	public float averagechartolerancevalue = -1;
	public float spacingtolerancevalue = -1;

	/* end text extraction options */

	public EmailServer emailserver;

	public boolean htmlemail;
	public boolean htmlemaileditcode;

	public EmailSettings emailsettings;

	public UploadSettings uploadsettings;
	public WebUploadSettings webuploadsettings;

	public SmsSettings smssettings;

	public QualityAssurance qualityassurance;

	public Attachments attachments;

	public EmailRfc2822Validator emailrfc2822validator;
	public SimpleJavaMail simplejavamail;

	public Locale locale;

	public int numberofuservariables;
	public double delayeachdistributionby;

	public boolean reusetokenswhennotfound;
	public boolean failjobifanydistributionfails;

	public boolean enableretrypolicy;

	public RetryPolicy retrypolicy;

	public boolean split2ndtime;
	public BurstTokenDelimiters bursttokendelimiters;

}
