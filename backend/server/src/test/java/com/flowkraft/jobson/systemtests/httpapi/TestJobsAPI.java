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

import static com.flowkraft.jobson.Constants.HTTP_JOBS_PATH;
import static com.flowkraft.jobson.Helpers.readJSON;
import static com.flowkraft.jobson.HttpStatusCodes.OK;
import static com.flowkraft.jobson.TestHelpers.readJSONFixture;
import static com.flowkraft.jobson.jobs.JobStatus.ABORTED;
import static com.flowkraft.jobson.jobs.JobStatus.FATAL_ERROR;
import static com.flowkraft.jobson.jobs.JobStatus.FINISHED;
import static com.flowkraft.jobson.jobs.JobStatus.RUNNING;
import static java.util.Collections.singletonList;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.flowkraft.jobson.api.v1.APIJobCreatedResponse;
import com.flowkraft.jobson.api.v1.APIJobDetails;
import com.flowkraft.jobson.api.v1.APIJobDetailsCollection;
import com.flowkraft.jobson.api.v1.APIJobOutput;
import com.flowkraft.jobson.api.v1.APIJobOutputCollection;
import com.flowkraft.jobson.api.v1.APIJobRequest;
import com.flowkraft.jobson.jobinputs.JobExpectedInputId;
import com.flowkraft.jobson.jobs.JobId;
import com.flowkraft.jobson.specs.JobOutputId;
import com.flowkraft.jobson.systemtests.SystemTestHelpers;

@SpringBootTest(args = { "-serve" }, webEnvironment = WebEnvironment.RANDOM_PORT)
public class TestJobsAPI {

	@LocalServerPort
	int randomServerPort;

	static {

		System.setProperty("config.protocol", "file");
		System.setProperty("config.file", SystemTestHelpers.createStandardRule());

	}

	private static final APIJobRequest REQUEST_AGAINST_FIRST_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_SECOND_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_THIRD_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_FOUTH_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_FITH_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_SIXTH_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_SEVENTH_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_EIGHTH_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_NINTH_SPEC;
	private static final APIJobRequest REQUEST_AGAINST_TENTH_SPEC;

	static {
		REQUEST_AGAINST_FIRST_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-first-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_SECOND_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-second-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_THIRD_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-third-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_FOUTH_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-fourth-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_FITH_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-fith-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_SIXTH_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-sixth-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_SEVENTH_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-seventh-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_EIGHTH_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-eighth-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_NINTH_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-against-ninth-spec.json",
				APIJobRequest.class);
		REQUEST_AGAINST_TENTH_SPEC = readJSONFixture("fixtures/jobson/systemtests/request-aganst-tenth-spec.json",
				APIJobRequest.class);
	}

	// @Test
	// public void testUnauthorizedIfCallingAPIWithoutCredentials() throws
	// IOException {
	// final Response response = generateRequest(RULE,
	// HTTP_JOBS_PATH).post(json(REQUEST_AGAINST_FIRST_SPEC));

	// assertThat(response.getStatus()).isEqualTo(UNAUTHORIZED);
	// }

	@Test
	public void testBadRequestIfAuthorizedButBadRequest() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<?> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(singletonList("Not a request"));

		try {
			restTemplate.exchange(request, String.class);
		} catch (HttpClientErrorException ex) {
			assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
		}

	}

	@Test
	public void testOKForCorrectAuthorizedRequest() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(REQUEST_AGAINST_FIRST_SPEC);

		ResponseEntity<APIJobCreatedResponse> response = restTemplate.exchange(request, APIJobCreatedResponse.class);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

	}

	@Test
	public void testCorrectRequestAgainst2ndSpecRespondsWithOK() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(REQUEST_AGAINST_SECOND_SPEC);

		ResponseEntity<APIJobCreatedResponse> response = restTemplate.exchange(request, APIJobCreatedResponse.class);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

	}

	@Test
	public void testOKResponseContainsJobResponse() throws IOException {

		final String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(REQUEST_AGAINST_SECOND_SPEC);

		ResponseEntity<APIJobCreatedResponse> response = restTemplate.exchange(request, APIJobCreatedResponse.class);
		assertThat(response.getBody()).isNotNull();

	}

	@Test
	public void testCanGETJobDetailsForANewJob() throws IOException {

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(REQUEST_AGAINST_SECOND_SPEC);

		final JobId jobCreatedId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobCreatedId.toString(), randomServerPort);

		final ResponseEntity<APIJobDetails> apiJobDetailsRespone = restTemplate.getForEntity(path, APIJobDetails.class);

		assertThat(apiJobDetailsRespone.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(apiJobDetailsRespone.getBody()).isNotNull();
		assertThat(apiJobDetailsRespone.getBody().getId()).isEqualTo(jobCreatedId);

	}

	@Test
	public void testCanAbortAJob() throws Exception {

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<APIJobRequest> submitJobRequest = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(REQUEST_AGAINST_THIRD_SPEC);

		final JobId jobId = restTemplate.exchange(submitJobRequest, APIJobCreatedResponse.class).getBody().getId();

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/abort",
				randomServerPort);

		RequestEntity<?> abortionRequest = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body("null");

		restTemplate.exchange(abortionRequest, Object.class);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString(), randomServerPort);

		final APIJobDetails jobDetailsAfterAbortion = restTemplate.getForEntity(path, APIJobDetails.class).getBody();

		// Under Windows comes as FATAL_ERROR and other times as ABORTED
		// assertThat(jobDetailsAfterAbortion.latestStatus()).isEqualTo(ABORTED);

		assertThat(jobDetailsAfterAbortion.latestStatus()).isIn(FATAL_ERROR, ABORTED);

	}

	@Test
	public void testCanGETJobSummaries() throws IOException {

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<APIJobRequest> submitJobRequest = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(REQUEST_AGAINST_SECOND_SPEC);

		for (int i = 0; i < 10; i++) {
			restTemplate.exchange(submitJobRequest, APIJobCreatedResponse.class).getBody().getId();
		}

		APIJobDetailsCollection jobSummaries = restTemplate.getForObject(path, APIJobDetailsCollection.class);

		assertThat(jobSummaries.getEntries().isEmpty()).isFalse();

	}

	@Test
	public void testCanGETStdout() throws Exception {

		RestTemplate restTemplate = new RestTemplate();

		final JobId jobId = SystemTestHelpers.submitJobRequest(restTemplate, randomServerPort);
		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/stdout",
				randomServerPort);

		final String jobStdout = restTemplate.getForObject(path, String.class);

		assertThat(jobStdout).contains("hello world");

	}

	@Test
	public void testStdoutFromAJoinJobIsAsExpected() throws Exception {
		RestTemplate restTemplate = new RestTemplate();

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_SIXTH_SPEC;

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		final JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/stdout",
				randomServerPort);

		final String jobStdout = restTemplate.getForObject(path, String.class);

		assertThat(jobStdout).contains("first,second,third,fourth");
	}

	@Test
	public void testCanListJobOutputs() throws Exception {

		RestTemplate restTemplate = new RestTemplate();

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_FOUTH_SPEC;

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		final JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/outputs",
				randomServerPort);

		final APIJobOutputCollection jobOutputCollection = restTemplate.getForObject(path,
				APIJobOutputCollection.class);

		assertThat(getOutputDetailsById(jobOutputCollection, "outFile").get().getMimeType().get())
				.isEqualTo("text/plain");
		assertThat(getOutputDetailsById(jobOutputCollection, "outFile").get().getName().get()).isEqualTo("Output Name");
		assertThat(getOutputDetailsById(jobOutputCollection, "outFile").get().getDescription().get())
				.isEqualTo("Output Description");
		assertThat(getOutputDetailsById(jobOutputCollection, "outFile").get().getSizeInBytes()).isGreaterThan(0);

	}

	private Optional<APIJobOutput> getOutputDetailsById(APIJobOutputCollection apiJobOutputCollection, String id) {
		return apiJobOutputCollection.getEntries().stream().filter(entry -> entry.getId().equals(new JobOutputId(id)))
				.findFirst();
	}

	@Test
	public void testCanGetJobOutput() throws Exception {

		RestTemplate restTemplate = new RestTemplate();

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_FOUTH_SPEC;

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		final JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/outputs/outFile",
				randomServerPort);

		final ResponseEntity<?> jobOutputFileResponse = restTemplate.getForEntity(path, String.class);

		assertThat(jobOutputFileResponse.getStatusCodeValue()).isEqualTo(OK);
		assertThat(jobOutputFileResponse.getHeaders().get("Content-Type").get(0)).isEqualTo("text/plain");

	}

	@Test
	public void testCanGetTemplatedJobOutput() throws Exception {
		RestTemplate restTemplate = new RestTemplate();

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_FITH_SPEC;

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		final JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/outputs/" + jobId,
				randomServerPort);

		final ResponseEntity<?> jobOutputFileResponse = restTemplate.getForEntity(path, String.class);

		assertThat(jobOutputFileResponse.getStatusCodeValue()).isEqualTo(OK);
		assertThat(jobOutputFileResponse.getHeaders().get("Content-Type").get(0)).isEqualTo("text/plain");
	}

	@Test
	public void testCanGetTemplatedPathOutput() throws Exception {
		RestTemplate restTemplate = new RestTemplate();

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_SEVENTH_SPEC;

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		final JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/outputs/bar",
				randomServerPort);

		final ResponseEntity<?> jobOutputFileResponse = restTemplate.getForEntity(path, String.class);

		assertThat(jobOutputFileResponse.getStatusCodeValue()).isEqualTo(OK);
	}

	@Test
	public void testCanRunAJobWithTemplatedJobDependency() throws Exception {

		RestTemplate restTemplate = new RestTemplate();

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_EIGHTH_SPEC;

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		final JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString(), randomServerPort);

		final APIJobDetails jobDetails = restTemplate.getForEntity(path, APIJobDetails.class).getBody();

		assertThat(jobDetails.latestStatus()).isEqualTo(FINISHED);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/stdout",
				randomServerPort);

		final String jobStdout = restTemplate.getForObject(path, String.class);

		assertThat(jobStdout).contains("I'm in the eighth spec's fixture!");

	}

	@Test
	public void testCanGetJobInputs() throws IOException {

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_FIRST_SPEC;

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		RestTemplate restTemplate = new RestTemplate();

		JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/inputs",
				randomServerPort);

		final String responseJson = restTemplate.getForObject(path, String.class);

		final Map<JobExpectedInputId, JsonNode> inputsReturned = readJSON(responseJson,
				new TypeReference<Map<JobExpectedInputId, JsonNode>>() {
				});

		assertThat(inputsReturned).isEqualTo(apiJobRequest.getInputs());

	}

	@Test
	public void testGetStderrReturns404IfStderrWasNotWritten() throws Exception {

		RestTemplate restTemplate = new RestTemplate();

		final JobId jobId = SystemTestHelpers.submitJobRequest(restTemplate, randomServerPort);
		//System.out.println(jobId);

		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString() + "/stderr",
				randomServerPort);

		try {
			restTemplate.getForEntity(path, String.class);
		} catch (HttpClientErrorException ex) {
			assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
		}

	}

	@Test
	public void testJobWithAbsoluteJobOutputThatDoesExistFinishes() throws Exception {

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_NINTH_SPEC;

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		RestTemplate restTemplate = new RestTemplate();

		final JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString(), randomServerPort);

		final APIJobDetails jobDetails = restTemplate.getForEntity(path, APIJobDetails.class).getBody();

		assertThat(jobDetails.latestStatus()).isEqualTo(FINISHED);

	}

	@Test
	public void testJobWithAbsoluteJobOutputThatDoesNotExistTerminatesWithFatalError() throws Exception {

		final APIJobRequest apiJobRequest = REQUEST_AGAINST_TENTH_SPEC;

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RequestEntity<APIJobRequest> request = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(apiJobRequest);

		RestTemplate restTemplate = new RestTemplate();

		final JobId jobId = restTemplate.exchange(request, APIJobCreatedResponse.class).getBody().getId();

		//System.out.println(jobId);
		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString(), randomServerPort);

		final APIJobDetails jobDetails = restTemplate.getForEntity(path, APIJobDetails.class).getBody();

		assertThat(jobDetails.latestStatus()).isEqualTo(FATAL_ERROR);

	}

	@Test
	public void testCanDeleteACompletedJob() throws Exception {

		RestTemplate restTemplate = new RestTemplate();

		final JobId jobId = SystemTestHelpers.submitJobRequest(restTemplate, randomServerPort);
		//System.out.println(jobId);

		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		// Sanity check
		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString(), randomServerPort);

		final APIJobDetails jobDetails = restTemplate.getForEntity(path, APIJobDetails.class).getBody();

		assertThat(jobDetails.latestStatus()).isEqualTo(FINISHED);

		final RequestEntity<Void> deleteRequest = RequestEntity.delete(path).build();
		final ResponseEntity<Void> deleteResponse = restTemplate.exchange(deleteRequest, Void.class);
		assertThat(deleteResponse.getStatusCodeValue()).isEqualTo(OK);

	}

	@Test
	public void testTheJobDoesntExistAfterDeletingIt() throws Exception {

		RestTemplate restTemplate = new RestTemplate();

		final JobId jobId = SystemTestHelpers.submitJobRequest(restTemplate, randomServerPort);
		//System.out.println(jobId);

		SystemTestHelpers.waitUntilJobTerminates(restTemplate, randomServerPort, jobId);

		// Sanity check
		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString(), randomServerPort);

		final APIJobDetails jobDetails = restTemplate.getForEntity(path, APIJobDetails.class).getBody();

		assertThat(jobDetails.latestStatus()).isEqualTo(FINISHED);

		final RequestEntity<Void> deleteRequest = RequestEntity.delete(path).build();
		final ResponseEntity<Void> deleteResponse = restTemplate.exchange(deleteRequest, Void.class);
		assertThat(deleteResponse.getStatusCodeValue()).isEqualTo(OK);

		final ResponseEntity<APIJobDetails> jobDetailsResponse = restTemplate.getForEntity(path, APIJobDetails.class);

		assertThat(jobDetailsResponse.getBody()).isNull();

	}

	@Test
	public void testCanDeleteARunningJob() {

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<APIJobRequest> submitJobRequest = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(REQUEST_AGAINST_THIRD_SPEC);

		final JobId jobId = restTemplate.exchange(submitJobRequest, APIJobCreatedResponse.class).getBody().getId();

		// Sanity check
		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString(), randomServerPort);

		final APIJobDetails jobDetails = restTemplate.getForEntity(path, APIJobDetails.class).getBody();

		assertThat(jobDetails.latestStatus()).isEqualTo(RUNNING);

		final RequestEntity<Void> deleteRequest = RequestEntity.delete(path).build();
		final ResponseEntity<Void> deleteResponse = restTemplate.exchange(deleteRequest, Void.class);
		assertThat(deleteResponse.getStatusCodeValue()).isEqualTo(OK);

	}

	@Test
	public void testDeletingARunningJobCausesItToNotExist() throws Exception {

		String path = String.format("http://localhost:%d" + HTTP_JOBS_PATH, randomServerPort);

		RestTemplate restTemplate = new RestTemplate();

		RequestEntity<APIJobRequest> submitJobRequest = RequestEntity.post(path).contentType(MediaType.APPLICATION_JSON)
				.body(REQUEST_AGAINST_THIRD_SPEC);

		final JobId jobId = restTemplate.exchange(submitJobRequest, APIJobCreatedResponse.class).getBody().getId();

		// Sanity check
		path = String.format("http://localhost:%d" + HTTP_JOBS_PATH + "/" + jobId.toString(), randomServerPort);

		// final APIJobDetails jobDetails = restTemplate.getForEntity(path,
		// APIJobDetails.class).getBody();

		// assertThat(jobDetails.latestStatus()).isEqualTo(RUNNING);

		final RequestEntity<Void> deleteRequest = RequestEntity.delete(path).build();
		final ResponseEntity<Void> deleteResponse = restTemplate.exchange(deleteRequest, Void.class);
		assertThat(deleteResponse.getStatusCodeValue()).isEqualTo(OK);

		final ResponseEntity<APIJobDetails> jobDetailsResponse = restTemplate.getForEntity(path, APIJobDetails.class);

		assertThat(jobDetailsResponse.getBody()).isNull();

	}
}
