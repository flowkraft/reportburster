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

import static com.flowkraft.jobson.Constants.HTTP_USERS_PATH;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.web.client.RestTemplate;

import com.flowkraft.jobson.api.v1.APIUserDetails;
import com.flowkraft.jobson.systemtests.SystemTestHelpers;

@SpringBootTest(args = { "-serve" }, webEnvironment = WebEnvironment.RANDOM_PORT)
public class TestUsersAPI {

	@LocalServerPort
	int randomServerPort;

	static {

		System.setProperty("config.protocol", "file");
		System.setProperty("config.file", SystemTestHelpers.createStandardRule());

	}

	@Test
	public void testGetCurrentUserRespondsWithCurrentUser() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_USERS_PATH + "/current", randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		APIUserDetails userDetails = restTemplate.getForObject(path, APIUserDetails.class);

		assertThat(userDetails.getId().toString()).isEqualTo("virgil");
	}
}
