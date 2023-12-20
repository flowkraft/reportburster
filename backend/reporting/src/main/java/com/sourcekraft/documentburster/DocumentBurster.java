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
package com.sourcekraft.documentburster;

import java.util.Arrays;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.utils.Utils;

public class DocumentBurster {

	private static Logger log = LoggerFactory.getLogger(DocumentBurster.class);

	public static void main(String[] args) throws Throwable {

		int exitCode = 0;

		log.info("***********************Program Started with Arguments : " + Arrays.toString(args)
				+ "***********************");

		GlobalContext global = new GlobalContext();

		MainProgram program = new MainProgram();
		program.setGlobal(global);

		try {

			program.execute(args);

			exitCode = 0;

		} catch (Throwable e) {

			exitCode = -1;

			log.error("Exception: ", e);

			throw e;

		} finally {

			log.info("***************************Execution Ended***************************");

			if (StringUtils.isNotEmpty(global.logsArchivesFolder))
				Utils.archiveLogFiles(global.logsArchivesFolder);

			System.exit(exitCode);
		}

	}

}
