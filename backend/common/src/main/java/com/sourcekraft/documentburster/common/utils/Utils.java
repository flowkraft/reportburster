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
package com.sourcekraft.documentburster.common.utils;

import java.io.File;

import org.apache.commons.lang3.StringUtils;

public class Utils {


	public static String getConfigurationFolderPath(String configurationFilePath) {

		if (StringUtils.isBlank(configurationFilePath))
			return "./config";
		else
			return getParentFolderPathHavingName(configurationFilePath, "config");
	}

	public static String getParentFolderPathHavingName(String filePath, String folderName) {

		if (StringUtils.isBlank(filePath))
			return "./config";
		else {

			File file = new File(filePath);
			File parentFolder = file.getParentFile();

			while (parentFolder != null) {
				if (parentFolder.getName().equalsIgnoreCase(folderName)) {
					return parentFolder.getAbsolutePath();
				}

				parentFolder = parentFolder.getParentFile();
			}

			return StringUtils.EMPTY;
		}
	}


}