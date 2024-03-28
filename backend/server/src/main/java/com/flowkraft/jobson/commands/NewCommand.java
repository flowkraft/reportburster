/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package com.flowkraft.jobson.commands;

import static com.flowkraft.jobson.Helpers.openResourceFile;
import static com.google.common.io.ByteStreams.copy;
import static java.nio.file.Files.newOutputStream;
import static org.apache.commons.io.IOUtils.toInputStream;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.stereotype.Component;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobson.Constants;

import picocli.CommandLine.Command;
import picocli.CommandLine.Option;

@Command(name = "new", description = "generate a new jobson deployment in the current working directory")
@Component
public class NewCommand extends BaseCommand {

	@Option(names = { "--demo" }, description = "Generate application with a demo spec (default: ${DEFAULT-VALUE})")
	private final Boolean generateDemoSpec = false;

	@Override
	public void run() {

		//System.out.println("NewCommand -> run -> generateDemoSpec = " + generateDemoSpec + ", AppConfig = "
		//		+ appConfig.toString());

		try {
			final Path configPath = java.nio.file.Paths.get(AppPaths.WORKSPACE_DIR_PATH + Constants.WORKSPACE_CONFIG_FILENAME);
			tryWriteFile(configPath, openResourceFile("jobson/config-template.yml"));

			final Path usersPath = java.nio.file.Paths.get(AppPaths.WORKSPACE_DIR_PATH + Constants.WORKSPACE_USER_FILENAME);
			tryWriteFile(usersPath, toInputStream("", Charset.forName("UTF-8")));

			final Path specDir = java.nio.file.Paths.get(AppPaths.WORKSPACE_DIR_PATH + Constants.WORKSPACE_SPECS_DIRNAME);
			tryCreateDir(specDir);

			if (generateDemoSpec) {
				tryWriteDemoSpec(specDir);
			}

			final Path jobsDir = java.nio.file.Paths.get(AppPaths.WORKSPACE_DIR_PATH + Constants.WORKSPACE_JOBS_DIRNAME);
			tryCreateDir(jobsDir);

			final Path wdsDir = java.nio.file.Paths.get(AppPaths.WORKSPACE_DIR_PATH + Constants.WORKSPACE_WDS_DIRNAME);
			tryCreateDir(wdsDir);

			//System.out.println(
			//		"Deployment created. Remember to add users (`user add`, `user passwd`), specs (`generate spec`), and boot the server (`serve`)");
			System.exit(0);
		} catch (IOException ex) {
			System.err.println(ex.toString());
			System.err.println("Error creating jobson files/directories. Do you have file permissions? "
					+ "Could some of the files already exist (this app won't overwrite files)?");
			System.exit(1);
		}

	}

	private void tryWriteFile(Path path, InputStream data) throws IOException {
		if (!path.toFile().exists()) {
			System.err.println("create    " + path);
			copy(data, newOutputStream(path));
		} else {
			copy(data, newOutputStream(path));
			System.err.println("cannot create file '" + path + "': file exists: skipping");
		}
	}

	private void tryCreateDir(Path path) throws IOException {
		if (!path.toFile().exists()) {
			System.err.println("create    " + path);
			Files.createDirectory(path);
		} else {
			System.err.println("cannot create directory '" + path + "': already exists: skipping");
		}
	}

	private void tryWriteDemoSpec(Path specsDir) throws IOException {
		final Path demoDirPath = specsDir.resolve(Constants.DEMO_SPEC_DIRNAME);
		tryCreateDir(demoDirPath);

		tryWriteFile(demoDirPath.resolve(Constants.SPEC_DIR_SPEC_FILENAME), openResourceFile("jobson/demo-spec.yml"));
		tryWriteFile(demoDirPath.resolve("demo-script.sh"), openResourceFile("jobson/demo-script.sh"));
		tryWriteFile(demoDirPath.resolve("demo-dependency"), openResourceFile("jobson/demo-dependency"));
	}

}
