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

package com.flowkraft.jobson.commands.generators;

import static com.flowkraft.jobson.Helpers.loadResourceFileAsString;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;

import org.springframework.stereotype.Component;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.commands.BaseCommand;

import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;

@Command(name = "spec", description = "generate a default spec in the configured specs folder")
@Component
public class GenerateSpecsCommand extends BaseCommand {

	@Parameters(arity = "1..*", description = "SPEC_NAMES")
	private ArrayList<String> specNames;

	private String specTemplate;

	@Override
	public void run() {
		//System.out.println("GenerateCommand -> GenerateSpecsCommand -> run -> specNames = " + specNames
		//		+ ", AppConfig = " + appConfig.toString());

		try {
			specTemplate = loadResourceFileAsString("jobson/spec-template.yml");
			final Path specsDir = java.nio.file.Paths.get(AppPaths.WORKSPACE_DIR_PATH+ appConfig.getSpecs().getDir());

			if (specsDir.toFile().exists()) {
				ensureSpecsDoNotAlreadyExistIn(specsDir, specNames);
				createDefaultSpecDirs(specsDir, specNames);
			} else {
				System.err.println(specsDir + ": No such directory");
				System.exit(1);
			}
		} catch (IOException e) {
			System.err.println("Error: " + e);
			System.exit(1);
		}

	}

	private void ensureSpecsDoNotAlreadyExistIn(Path specsDir, ArrayList<String> specNames) {
		for (String specName : specNames) {
			if (specsDir.resolve(specName).toFile().exists()) {
				System.err.println("cannot create spec '" + specName + "': already exists");
				System.exit(1);
			}
		}
	}

	private void createDefaultSpecDirs(Path specsDir, ArrayList<String> specNames) {
		for (String specName : specNames)
			createDefaultSpecDir(specsDir, specName);
	}

	private void createDefaultSpecDir(Path specsDir, String specName) {
		final Path specDir = specsDir.resolve(specName);

		try {
			System.err.println("create    " + specDir);
			Files.createDirectory(specDir);

			final Path specFilePath = specDir.resolve(Constants.SPEC_DIR_SPEC_FILENAME);

			System.err.println("create    " + specFilePath);

			Files.write(specFilePath, specTemplate.getBytes());
		} catch (IOException ex) {
			throw new RuntimeException(ex);
		}
	}

}
