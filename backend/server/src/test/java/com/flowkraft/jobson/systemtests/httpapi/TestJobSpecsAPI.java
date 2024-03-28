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

package com.flowkraft.jobson.systemtests.httpapi;

import static com.flowkraft.jobson.Constants.HTTP_SPECS_PATH;
import static com.flowkraft.jobson.TestHelpers.readYAMLFixture;
import static java.util.Arrays.asList;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.flowkraft.jobson.api.v1.APIJobSpec;
import com.flowkraft.jobson.api.v1.APIJobSpecSummaryCollection;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.systemtests.SystemTestHelpers;

@SpringBootTest(args = { "-serve" }, webEnvironment = WebEnvironment.RANDOM_PORT)
public class TestJobSpecsAPI {

	@LocalServerPort
	int randomServerPort;

	static {

		System.setProperty("config.protocol", "file");
		System.setProperty("config.file", SystemTestHelpers.createStandardRule());

	}

	/*
	 * @Test public void testUnauthorizedIfGETSummariesWithoutCredentials() { final
	 * Response response = generateRequest(RULE, HTTP_SPECS_PATH).get();
	 * assertThat(response.getStatus()).isEqualTo(UNAUTHORIZED); }
	 */

	@Test
	public void testOKIfGETSummariesWithCredentials() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_SPECS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<APIJobSpecSummaryCollection> response = restTemplate.getForEntity(path,
				APIJobSpecSummaryCollection.class);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

	}

	@Test
	public void testOKSummariesResponseContainsSummaries() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_SPECS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<APIJobSpecSummaryCollection> response = restTemplate.getForEntity(path,
				APIJobSpecSummaryCollection.class);
		assertThat(response.getBody().getEntries()).isNotNull();

	}

	@Test
	public void testGetJobSpecSummariesContainsTheJobSpecsInTheJobSpecsFolder() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_SPECS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<APIJobSpecSummaryCollection> response = restTemplate.getForEntity(path,
				APIJobSpecSummaryCollection.class);

		final List<JobSpec> specsProvidedWhenBooting = asList(
				readYAMLFixture("fixtures/jobson/systemtests/jobspecs.yml", JobSpec[].class));

		assertThat(response.getBody().getEntries().size()).isEqualTo(specsProvidedWhenBooting.size());
	}

	/*
	 * 
	 * @Test public void testGetJobSpecByIdHasAuthenticationErrorIfNotSignedIn() {
	 * final Response response = generateRequest(RULE,HTTP_SPECS_PATH +
	 * "/first-spec").get();
	 * assertThat(response.getStatus()).isEqualTo(UNAUTHORIZED); }
	 * 
	 */

	@Test
	public void testGetJobSpecByIdReturnsAJobSpecIfSignedIn() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_SPECS_PATH + "/first-spec", randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		APIJobSpec apiJobSpec = restTemplate.getForObject(path, APIJobSpec.class);

		assertThat(apiJobSpec.getDescription()).isEqualTo("The first job spec");

	}

}
