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
package com.sourcekraft.documentburster.unit.further.startpausecancelretrypolicy;

import com.sourcekraft.documentburster.utils.DumpToString;

/*
 * 
 * 1. All the fields should be public - this is required to have more convenient access to the field values
 * from within the scripts.
 * 
 * 2. Although public, all the fields should have getter/setters. Otherwise   
 * BeanUtils.copyProperties(copyContext, context) will not work properly
 *
 */

public class StartPauseCancelInfo extends DumpToString {

    /**
	 * 
	 */
	private static final long serialVersionUID = 724992956995068108L;

	public String command;

    public String cancelFilePath;
    public String progressFilePath;
    public String pauseFilePath;

}
