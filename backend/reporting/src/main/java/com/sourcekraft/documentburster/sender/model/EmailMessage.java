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
package com.sourcekraft.documentburster.sender.model;

import java.util.ArrayList;
import java.util.List;

import com.sourcekraft.documentburster.common.settings.model.SimpleJavaMail;

public class EmailMessage extends AbstractMessage {

	/**
	 * 
	 */
	private static final long serialVersionUID = -4063374167693720223L;
	
	// EmailServerSettings
	public boolean isAuthentication = false;
	public String authuser;
	public String authpwd;

	public String hostName;
	public String smtpPort;

	public String fromName;
	public String fromAddress;

	public boolean isTls = false;
	public boolean isSsl = false;
	public boolean isDebug = false;

	// Attachments
	public List<String> attachments = new ArrayList<String>();

	// Message
	public boolean isHtmlEmail = true;

	public String subject;
	public String textMessage;
	public String htmlMessage;

	public List<String> tos = new ArrayList<String>();
	public List<String> ccs = new ArrayList<String>();
	public List<String> bccs = new ArrayList<String>();

	public SimpleJavaMail sjm;

}