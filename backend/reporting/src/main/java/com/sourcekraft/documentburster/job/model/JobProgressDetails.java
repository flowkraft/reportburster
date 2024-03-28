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
package com.sourcekraft.documentburster.job.model;

import javax.xml.bind.annotation.XmlRootElement;

import com.sourcekraft.documentburster.common.utils.DumpToString;

@XmlRootElement(name = "jobprogress")
public class JobProgressDetails extends DumpToString {

    /**
	 * 
	 */
	private static final long serialVersionUID = 345147044901906731L;
	
	public String currentdate;
    public String filepath;

    public String lasttokenprocessed;
    public String lasttokenindocument;

    public boolean testall;
    public String listoftesttokens;
    public int numberofrandomtesttokens = -1;
    
    public int tokenscount = -1;
    public int pagescount = -1;

    public int numberofremainingtokens = -1;
    public int indexoflasttokenprocessed = -1;

}
