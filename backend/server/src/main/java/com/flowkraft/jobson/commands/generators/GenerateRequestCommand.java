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

import static com.flowkraft.jobson.Helpers.readYAML;
import static com.flowkraft.jobson.Helpers.toJSON;
import static com.flowkraft.jobson.Helpers.toJSONNode;
import static java.util.stream.Collectors.toMap;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.api.v1.APIJobRequest;
import com.flowkraft.jobson.commands.BaseCommand;
import com.flowkraft.jobson.jobinputs.JobExpectedInput;
import com.flowkraft.jobson.jobinputs.JobExpectedInputId;
import com.flowkraft.jobson.jobinputs.JobInput;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.specs.JobSpecId;
import com.github.javafaker.Faker;

import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;

@Command(name = "request", description = "generate a request against a spec")
@Component
public class GenerateRequestCommand extends BaseCommand {

	@Parameters(arity = "1", description = "JOB_SPEC_ID")
	private String jobSpecId;

	@Override
	public void run() {
		//System.out.println("GenerateCommand -> GenerateRequestCommand -> run -> jobSpecId = " + jobSpecId
		//		+ ", AppConfig = " + appConfig.toString());

		final Path specsDir = java.nio.file.Paths.get(appConfig.getSpecs().getDir());
		final Path specFile = specsDir.resolve(jobSpecId).resolve(Constants.SPEC_DIR_SPEC_FILENAME);

		if (specFile.toFile().exists()) {
			JobSpec jobSpec;

			try {
				jobSpec = readYAML(specFile, JobSpec.class);
				final JobSpecId jobSpecID = new JobSpecId(jobSpecId);
				final String jobName = new Faker().lorem().sentence(5);
				final Map<JobExpectedInputId, JsonNode> generatedInputs = generateInputs(jobSpec);
				final APIJobRequest jobRequest = new APIJobRequest(jobSpecID, jobName, generatedInputs);

				//System.out.println(toJSON(jobRequest));
				System.exit(0);
			} catch (IOException e) {
				System.err.println("Error: " + e.getMessage());
				System.exit(1);
			}

		} else {
			System.err.println(specFile + ": No such file");
			System.exit(1);
		}
	}

	private Map<JobExpectedInputId, JsonNode> generateInputs(JobSpec jobSpec) {
		return jobSpec.getExpectedInputs().stream().collect(toMap(JobExpectedInput::getId, this::generateInput));
	}

	private JsonNode generateInput(JobExpectedInput<?> expectedInput) {
		final JobInput generatedInput = expectedInput.getDefault().isPresent() ? expectedInput.getDefault().get()
				: expectedInput.generateExampleInput();
		return toJSONNode(generatedInput);
	}

}
