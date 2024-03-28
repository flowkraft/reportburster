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

package com.flowkraft.jobson.systemtests;

import static com.flowkraft.jobson.Constants.HTTP_JOBS_PATH;
import static com.flowkraft.jobson.TestHelpers.fixture;
import static com.flowkraft.jobson.TestHelpers.readJSONFixture;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.web.client.RestTemplate;

import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.TestHelpers;
import com.flowkraft.jobson.api.v1.APIJobCreatedResponse;
import com.flowkraft.jobson.api.v1.APIJobDetails;
import com.flowkraft.jobson.api.v1.APIJobRequest;
import com.flowkraft.jobson.jobs.JobId;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.systemtests.httpapi.TestJobSpecsAPI;

public final class SystemTestHelpers {

	// In user file
	public static final String SYSTEMTEST_USER = "testuser";
	public static final String SYSTEMTEST_PASSWORD = "password123";

	public static String createStandardRule() {
		return createStandardRuleWithTemplate("fixtures/jobson/systemtests/application-config-template.yml");
	}

	public static String createStandardRuleWithTemplate(String fixture) {

		try {

			final Path usersFilePath = Files.createTempFile(SystemTestHelpers.class.getSimpleName(), "user-file");
			final String users = fixture("fixtures/jobson/systemtests/users");
			Files.write(usersFilePath, users.getBytes());

			final Path sessionsFilePath = Files.createTempFile(SystemTestHelpers.class.getSimpleName(),
					"sessions-file");

			final Path jobSpecsDir = Files.createTempDirectory(TestJobSpecsAPI.class.getSimpleName());
			final List<JobSpec> specs = Arrays.asList(
					TestHelpers.YAML_MAPPER.readValue(fixture("fixtures/jobson/systemtests/jobspecs.yml"), JobSpec[].class));
			for (JobSpec spec : specs) {
				Files.createDirectory(jobSpecsDir.resolve(spec.getId().toString()));

				final String specYAML = TestHelpers.YAML_MAPPER.writeValueAsString(spec);

				Files.write(jobSpecsDir.resolve(spec.getId().toString()).resolve(Constants.SPEC_DIR_SPEC_FILENAME),
						specYAML.getBytes());
			}

			final String secondSpecScript = fixture("fixtures/jobson/systemtests/script.bat");
			Files.write(jobSpecsDir.resolve("second-spec").resolve("script.bat"), secondSpecScript.getBytes());

			final String eighthSpecDependency = fixture("fixtures/jobson/systemtests/eighth-spec-dependency");
			Files.write(jobSpecsDir.resolve("eighth-spec").resolve("eighth-spec-dependency"),
					eighthSpecDependency.getBytes());

			final Path jobDataDir = Files.createTempDirectory(SystemTestHelpers.class.getSimpleName());

			final Path workingDirsDir = Files.createTempDirectory(SystemTestHelpers.class.getSimpleName());

			// final Path workingDirsDir = java.nio.file.Paths.get(".").toAbsolutePath()
			// .relativize(Files.createTempDirectory(SystemTestHelpers.class.getSimpleName()));

			String resolvedAppConfigText = fixture(fixture);
			resolvedAppConfigText = resolvedAppConfigText.replaceAll("\\$userFile",
					usersFilePath.toAbsolutePath().toString().replaceAll("\\\\", "/"));
			resolvedAppConfigText = resolvedAppConfigText.replaceAll("\\$sessionsFile",
					sessionsFilePath.toAbsolutePath().toString().replaceAll("\\\\", "/"));
			resolvedAppConfigText = resolvedAppConfigText.replaceAll("\\$jobSpecDir",
					jobSpecsDir.toAbsolutePath().toString().replaceAll("\\\\", "/"));
			resolvedAppConfigText = resolvedAppConfigText.replaceAll("\\$jobDataDir",
					jobDataDir.toAbsolutePath().toString().replaceAll("\\\\", "/"));
			resolvedAppConfigText = resolvedAppConfigText.replaceAll("\\$workingDirsDir",
					workingDirsDir.toString().replaceAll("\\\\", "/"));

			final Path resolvedAppConfigPath = Files.createTempFile(TestJobSpecsAPI.class.getSimpleName(), "config");

			Files.write(resolvedAppConfigPath, resolvedAppConfigText.getBytes());

			// return new DropwizardAppRule<>(DemoApplication.class, resolvedAppConfigPath.toString());
			return resolvedAppConfigPath.toAbsolutePath().toString();

		} catch (IOException ex) {
			throw new RuntimeException(ex);
		}
	}

	public static JobId submitJobRequest(RestTemplate restTemplate, int port) throws Exception {
		final String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, port);

		final APIJobRequest apiJobRequest = readJSONFixture("fixtures/jobson/systemtests/request-against-first-spec.json",
				APIJobRequest.class);

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		return restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();
	}

	public static void waitUntilJobTerminates(RestTemplate restTemplate, int port, JobId jobId) throws Exception {

		final String path = String.format("http://localhost:%d" + jobResourceSubpath(jobId), port);

		int maxAttempts = 50;
		while (maxAttempts-- > 0) {
			final APIJobDetails resp = restTemplate.getForEntity(path, APIJobDetails.class).getBody();
			if (resp.latestStatus().isFinal()) {
				break;
			} else {
				Thread.sleep(50);
			}
		}

	}

	public static String jobResourceSubpath(Object subpath) {
		return HTTP_JOBS_PATH + "/" + subpath.toString();
	}
}
