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

import static com.flowkraft.jobson.Constants.HTTP_ROOT;
import static com.flowkraft.jobson.TestHelpers.assertHasKeyWithValue;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.api.APIRootResponse;
import com.flowkraft.jobson.systemtests.SystemTestHelpers;

@SpringBootTest(args = { "-serve" }, webEnvironment = WebEnvironment.RANDOM_PORT)
public class TestRootAPI {

	@LocalServerPort
	int randomServerPort;

	static {

		System.setProperty("config.protocol", "file");
		System.setProperty("config.file", SystemTestHelpers.createStandardRule());

	}

	/* @Test
		// public void testUnauthorizedIfGETRootWithoutCredentials() {
		// final Response response = generateRequest(RULE, HTTP_ROOT).get();
		// assertThat(response.getStatus()).isEqualTo(UNAUTHORIZED);
	 }
	*/
	
	@Test
	public void testAuthorizedRequestReturns200() {
		final ResponseEntity<APIRootResponse> response = _getRequest();
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
	}

	@Test
	public void testGetRootAPIReturnsAnRootAPIResponse() {
		final ResponseEntity<APIRootResponse> response = _getRequest();
		APIRootResponse apiRootResponse = response.getBody();
		Assertions.assertNotNull(apiRootResponse);
	}

	@Test
	public void testGetRootAPIContainsLinkToV1API() {

		final ResponseEntity<APIRootResponse> response = _getRequest();
		APIRootResponse apiRootResponse = response.getBody();

		assertHasKeyWithValue(apiRootResponse.getLinks(), "v1", Constants.HTTP_V1_ROOT);

	}

	public ResponseEntity<APIRootResponse> _getRequest() {

		final String path = String.format("http://localhost:%d" + HTTP_ROOT, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		return restTemplate.getForEntity(path, APIRootResponse.class);

	}

}
