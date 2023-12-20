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
package com.sourcekraft.documentburster.unit.further.other;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FilenameFilter;

import org.junit.Test;

import com.sourcekraft.documentburster.utils.Utils;

public class UtilsTest {

	public static FilenameFilter outputFilesFilter = new FilenameFilter() {
		public boolean accept(File directory, String fileName) {
			return ((!fileName.contains("quality-assurance"))
					&& (!fileName.endsWith(".txt") && (fileName.endsWith(".pdf") || fileName.endsWith(".xls")
							|| fileName.endsWith(".xlsx") || fileName.endsWith(".zip") || fileName.endsWith(".docx") || fileName.endsWith(".html"))));
		};
	};

	public static FilenameFilter logFilesFilter = new FilenameFilter() {
		public boolean accept(File directory, String fileName) {
			return fileName.endsWith(".log");
		};
	};

	@Test
	public void getFileNameOfBurstedDocument() {

		String fileName = Utils.getFileNameOfBurstDocument("", "burstToken");
		assertTrue(fileName.startsWith("burstToken"));
		assertTrue(fileName.endsWith(".pdf"));

		fileName = Utils.getFileNameOfBurstDocument("default", "burstToken");
		assertTrue(fileName.startsWith("default"));

		fileName = Utils.getFileNameOfBurstDocument(null, "burstToken");
		assertTrue(fileName.startsWith("burstToken"));
		assertTrue(fileName.endsWith(".pdf"));

	}

	@Test
	public void getRandomJobFileName() {

		String jobFilePath = Utils.getRandomJobFileName();

		assertTrue(jobFilePath.endsWith(".job"));

	}

	@Test
	public void getOutputFolder() {
		String outputFolder = "\"C:\\Documents And Settings\\test\"";

		outputFolder = Utils.getOutputFolder(outputFolder);
		assertEquals("C:\\Documents And Settings\\test", outputFolder);

		outputFolder = "C:\\Documents And Settings\\test";

		outputFolder = Utils.getOutputFolder(outputFolder);
		assertEquals("C:\\Documents And Settings\\test", outputFolder);

	}

	@Test
	public void getHumanlyReadableFileSize() {

		String docBookFilePath = "../../xtra-tools/containers/tomcat/tomcat.zip";

		File docBookFile = new File(docBookFilePath);

		double fileSize = Utils.getFileSize(docBookFile.length(), Utils.FileSizeUnit.MEGABYTE);

		System.out.println("tomcat.zip FileSize = " + fileSize);

		assertTrue("tomcat.zip file size should be > 7MB and < 8MB", fileSize > 7 && fileSize < 8);

	}

}
