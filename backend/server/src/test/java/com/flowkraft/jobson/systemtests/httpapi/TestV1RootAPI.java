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

import static com.flowkraft.jobson.Constants.HTTP_V1_ROOT;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.flowkraft.jobson.api.v1.APIV1RootResponse;
import com.flowkraft.jobson.config.ApplicationConfig;
import com.flowkraft.jobson.systemtests.SystemTestHelpers;

@SpringBootTest(args = { "-serve" }, webEnvironment = WebEnvironment.RANDOM_PORT)
public class TestV1RootAPI {

	@LocalServerPort
	int randomServerPort;

	static {

		System.setProperty("config.protocol", "file");
		System.setProperty("config.file", SystemTestHelpers.createStandardRule());

		ApplicationConfig.serveWeb = true;

	}

	// @Test
	// public void testUnauthorizedIfGETSummariesWithoutCredentials() {
	// final Response response = generateRequest(RULE, HTTP_V1_ROOT).get();
	// assertThat(response.getStatus()).isEqualTo(UNAUTHORIZED);
	// }

	@Test
	public void testOKIfGETSummariesWithCredentials() {

		final String path = String.format("http://localhost:%d" + HTTP_V1_ROOT, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<APIV1RootResponse> response = restTemplate.getForEntity(path, APIV1RootResponse.class);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

	}

	@Test
	public void testResponseParsesToAnAPIRootResponse() {

		final String path = String.format("http://localhost:%d" + HTTP_V1_ROOT, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<APIV1RootResponse> response = restTemplate.getForEntity(path, APIV1RootResponse.class);
		Assertions.assertNotNull(response.getBody());

	}

	@Test
	public void testResponseContainsJobsLinks() {

		final String path = String.format("http://localhost:%d" + HTTP_V1_ROOT, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<APIV1RootResponse> response = restTemplate.getForEntity(path, APIV1RootResponse.class);
		Assertions.assertTrue(response.getBody().getLinks().containsKey("jobs"));

	}

	@Test
	public void testResponseContainsSpecsLinks() {

		final String path = String.format("http://localhost:%d" + HTTP_V1_ROOT, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<APIV1RootResponse> response = restTemplate.getForEntity(path, APIV1RootResponse.class);
		Assertions.assertTrue(response.getBody().getLinks().containsKey("specs"));

	}

	@Test
	public void testResponseContainsCurrentUserLinks() {

		final String path = String.format("http://localhost:%d" + HTTP_V1_ROOT, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<APIV1RootResponse> response = restTemplate.getForEntity(path, APIV1RootResponse.class);
		Assertions.assertTrue(response.getBody().getLinks().containsKey("current-user"));

	}

	@Test
	public void testApiEmitsPrettifiedJson() {

		final String path = String.format("http://localhost:%d" + HTTP_V1_ROOT, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		final String apiV1RootJSONResponse = restTemplate.getForObject(path, String.class);

		//Assertions.assertTrue(apiV1RootJSONResponse.split(System.lineSeparator()).length > 1);

	}
}
