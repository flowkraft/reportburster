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

package com.flowkraft.jobson.controllers.v1;

import static com.flowkraft.jobson.Constants.HTTP_JOBS_PATH;
import static com.flowkraft.jobson.TestHelpers.generateJobDetailsWithStatus;
import static com.flowkraft.jobson.TestHelpers.generateJobId;
import static com.flowkraft.jobson.TestHelpers.generateJobOutputId;
import static com.flowkraft.jobson.TestHelpers.generateRandomBinaryData;
import static com.flowkraft.jobson.TestHelpers.generateRandomJobDetails;
import static com.flowkraft.jobson.TestHelpers.generateRandomList;
import static com.flowkraft.jobson.TestHelpers.generateValidJobDetails;
import static java.util.Collections.emptyList;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.fasterxml.jackson.databind.JsonNode;
import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.TestHelpers;
import com.flowkraft.jobson.api.v1.APIJobCreatedResponse;
import com.flowkraft.jobson.api.v1.APIJobDetails;
import com.flowkraft.jobson.api.v1.APIJobDetailsCollection;
import com.flowkraft.jobson.api.v1.APIJobOutput;
import com.flowkraft.jobson.api.v1.APIJobOutputCollection;
import com.flowkraft.jobson.api.v1.APIJobRequest;
import com.flowkraft.jobson.dao.jobs.JobDAO;
import com.flowkraft.jobson.dao.jobs.JobDetails;
import com.flowkraft.jobson.dao.jobs.JobOutputDetails;
import com.flowkraft.jobson.dao.specs.JobSpecConfigurationDAO;
import com.flowkraft.jobson.jobinputs.JobExpectedInputId;
import com.flowkraft.jobson.jobinputs.JobInput;
import com.flowkraft.jobson.jobinputs.select.SelectInput;
import com.flowkraft.jobson.jobs.JobId;
import com.flowkraft.jobson.jobs.JobManagerActions;
import com.flowkraft.jobson.jobs.JobStatus;
import com.flowkraft.jobson.jobs.jobstates.FinalizedJob;
import com.flowkraft.jobson.jobs.jobstates.ValidJobRequest;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.specs.JobSpecId;
import com.flowkraft.jobson.utils.BinaryData;
import com.flowkraft.jobson.utils.CancelablePromise;
import com.flowkraft.jobson.utils.SimpleCancelablePromise;

public final class JobControllerTest {

	private JobController getInstance(JobManagerActions jobManagerActions, JobDAO jobDAO,
			JobSpecConfigurationDAO jobSpecConfigurationDAO, int defaultPageSize) {

		JobController jobController = new JobController();

		jobController.setJobManagerActions(jobManagerActions);
		jobController.setJobDAO(jobDAO);
		jobController.setJobSpecConfigurationDAO(jobSpecConfigurationDAO);
		jobController.setDefaultPageSize(defaultPageSize);

		return jobController;
	}

	@Test
	public void testCtorThrowIfNullableArgumentsAreNull() {

		final JobManagerActions jobManager = mock(JobManagerActions.class);
		final JobDAO jobDAO = mock(JobDAO.class);
		final JobSpecConfigurationDAO jobSpecConfigurationDAO = mock(JobSpecConfigurationDAO.class);

		Assertions.assertThrows(NullPointerException.class, () -> {
			getInstance(jobManager, jobDAO, null, Constants.DEFAULT_PAGE_SIZE);
		});

		Assertions.assertThrows(NullPointerException.class, () -> {
			getInstance(jobManager, null, jobSpecConfigurationDAO, Constants.DEFAULT_PAGE_SIZE);
		});

		Assertions.assertThrows(NullPointerException.class, () -> {
			getInstance(null, jobDAO, jobSpecConfigurationDAO, Constants.DEFAULT_PAGE_SIZE);
		});

	}

	@Test
	public void testCtorThrowsIfPageSizeIsNegative() {

		Assertions.assertThrows(RuntimeException.class, () -> {
			getInstance(mock(JobManagerActions.class), mock(JobDAO.class), mock(JobSpecConfigurationDAO.class), -1);
		});

	}

	@Test
	public void testFetchJobSummariesReturnsASummariesResponseContainingSummariesFromTheDAO() throws IOException {
		final List<JobDetails> summariesReturnedByDAO = generateRandomJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(summariesReturnedByDAO);
		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetailsCollection returnedSummaries = jobController.getJobs(Optional.empty(), Optional.empty(),
				Optional.empty());

		Assertions.assertEquals(returnedSummaries.getEntries(), summariesReturnedByDAO);
	}

	private JobDAO mockJobDAOThatReturns(List<JobDetails> details) {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getJobs(anyInt(), anyInt())).thenReturn(details);
		return jobDAO;
	}

	private JobController resourceThatUses(JobDAO jobDAO) {
		return getInstance(mock(JobManagerActions.class), jobDAO, mock(JobSpecConfigurationDAO.class),
				Constants.DEFAULT_PAGE_SIZE);
	}

	@Test
	public void testFetchJobSummariesCallsTheDAOWithPageIndex0IfPageIsNotSpecified() throws IOException {
		final List<JobDetails> summariesReturnedByDAO = generateRandomJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(summariesReturnedByDAO);
		final JobController jobController = resourceThatUses(jobDAO);

		jobController.getJobs(Optional.empty(), Optional.empty(), Optional.empty());

		verify(jobDAO, times(1)).getJobs(anyInt(), eq(0));
	}

	@Test
	public void testFetchJobSummariesCallsTheDAOWithSpecifiedPageIndex() throws IOException {
		final List<JobDetails> summariesReturnedByDAO = generateRandomJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(summariesReturnedByDAO);
		final JobController jobController = resourceThatUses(jobDAO);
		final int requestedPage = 5;

		jobController.getJobs(Optional.of(requestedPage), Optional.empty(), Optional.empty());

		verify(jobDAO, times(1)).getJobs(anyInt(), eq(requestedPage));
	}

	@Test
	public void testFetchJobSummariesThrowsExceptionIfSpecifiedPageIndexIsNegative() throws IOException {
		final List<JobDetails> jobSummaries = generateRandomJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(jobSummaries);
		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.getJobs(Optional.of(-1), // Should cause exception
					Optional.empty(), Optional.empty());
		});

	}

	@Test
	public void testFetchJobSummariesCallsTheDAOWithTheDefaultPageSizeIfPageSizeNotSpecifed() throws IOException {
		final List<JobDetails> jobSummaries = generateRandomJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(jobSummaries);
		final int defaultPageSize = TestHelpers.randomIntBetween(5, 15);

		final JobController jobController = getInstance(mock(JobManagerActions.class), jobDAO,
				mock(JobSpecConfigurationDAO.class), defaultPageSize);

		jobController.getJobs(Optional.empty(), Optional.empty(), Optional.empty());

		verify(jobDAO, times(1)).getJobs(eq(defaultPageSize), anyInt());
	}

	@Test
	public void testFetchJobSummariesCallsTheDAOWithThePageSizeIfItIsSpecified() throws IOException {
		final List<JobDetails> jobSummaries = generateRandomJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(jobSummaries);
		final JobController jobController = resourceThatUses(jobDAO);
		final int requestedPageSize = TestHelpers.randomIntBetween(1, jobSummaries.size());

		jobController.getJobs(Optional.empty(), Optional.of(requestedPageSize), Optional.empty());

		verify(jobDAO, times(1)).getJobs(eq(requestedPageSize), anyInt());
	}

	@Test
	public void testFetchJobSummariesThrowsExceptionIfRequestedPageSizeIsNegative() throws IOException {
		final List<JobDetails> jobSummaries = generateRandomJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(jobSummaries);
		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertThrows(RuntimeException.class, () -> {

			jobController.getJobs(Optional.empty(), Optional.of(-1), // Should
																		// cause
																		// exception
					Optional.empty());

		});

	}

	@Test
	public void testFetchJobSummariesCallsTheQueryOverloadOnTheDAOIfAQueryWasSpecified() throws IOException {
		final List<JobDetails> jobSummaries = generateRandomJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(jobSummaries);
		final JobController jobController = resourceThatUses(jobDAO);
		final String queryString = TestHelpers.generateRandomString();

		jobController.getJobs(Optional.empty(), Optional.empty(), Optional.of(queryString));

		verify(jobDAO, times(1)).getJobs(anyInt(), anyInt(), eq(queryString));
	}

	@Test
	public void testFetchJobSummariesContainsLinksToAbortJobIfJobIsAbortable() throws IOException {
		final List<JobDetails> jobSummariesWithAbortableStatus = generateRandomList(10, 20,
				() -> generateJobDetailsWithStatus(JobStatus.RUNNING));

		final JobDAO jobDAO = mockJobDAOThatReturns(jobSummariesWithAbortableStatus);

		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetailsCollection resp = jobController.getJobs(Optional.empty(), Optional.empty(),
				Optional.empty());

		resp.getEntries().forEach(this::assertHasAJobAbortionRESTLink);
	}

	private void assertHasAJobAbortionRESTLink(APIJobDetails jobSummary) {
		Assertions.assertTrue(jobSummary.getLinks().containsKey("abort"));
		Assertions.assertEquals(jobSummary.getLinks().get("abort").getHref().toString(),
				HTTP_JOBS_PATH + "/" + jobSummary.getId().toString() + "/abort");
	}

	@Test
	public void testFetchJobSummariesDoesNotContainsLinksToAbortJobIfJobIsNotAbortable() throws IOException {
		final List<JobDetails> notAbortableSummaries = generateRandomList(10, 20,
				() -> generateJobDetailsWithStatus(JobStatus.FINISHED));

		final JobDAO jobDAO = mockJobDAOThatReturns(notAbortableSummaries);

		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetailsCollection resp = jobController.getJobs(Optional.empty(), Optional.empty(),
				Optional.empty());

		resp.getEntries().forEach(this::assertDoesNotHaveAbortionRESTLink);
	}

	private void assertDoesNotHaveAbortionRESTLink(APIJobDetails jobSummary) {
		Assertions.assertFalse(jobSummary.getLinks().containsKey("abort"));
	}

	@Test
	public void testFetchJobSummariesContainsLinksToJobStdoutIfJobHasStdout() throws IOException {
		final List<JobDetails> summaries = generateRandomJobDetails();

		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getJobs(anyInt(), anyInt())).thenReturn(summaries);
		when(jobDAO.hasStdout(any())).thenReturn(true);

		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetailsCollection resp = jobController.getJobs(Optional.empty(), Optional.empty(),
				Optional.empty());

		resp.getEntries().forEach(this::assertHasAValidStdoutRESTLink);
	}

	private void assertHasAValidStdoutRESTLink(APIJobDetails jobSummary) {
		Assertions.assertTrue(jobSummary.getLinks().containsKey("stdout"));
		Assertions.assertEquals(jobSummary.getLinks().get("stdout").getHref().toString(),
				HTTP_JOBS_PATH + "/" + jobSummary.getId().toString() + "/stdout");
	}

	@Test
	public void testFetchJobSummariesDoesNotContainLinksToStdoutIfJobHasNoStdout() throws IOException {
		final List<JobDetails> jobSummaries = generateRandomJobDetails();

		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getJobs(anyInt(), anyInt())).thenReturn(jobSummaries);
		when(jobDAO.hasStdout(any())).thenReturn(false);

		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetailsCollection resp = jobController.getJobs(Optional.empty(), Optional.empty(),
				Optional.empty());

		resp.getEntries().forEach(this::assertDoesNotHaveAnStdoutRESTLink);
	}

	private void assertDoesNotHaveAnStdoutRESTLink(APIJobDetails jobSummary) {
		Assertions.assertFalse(jobSummary.getLinks().containsKey("stdout"));
	}

	@Test
	public void testFetchJobSummariesContainsLinksToJobStderrIfJobHasStderr() throws IOException {
		final List<JobDetails> jobSummaries = generateRandomJobDetails();

		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getJobs(anyInt(), anyInt())).thenReturn(jobSummaries);
		when(jobDAO.hasStderr(any())).thenReturn(true);

		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetailsCollection resp = jobController.getJobs(Optional.empty(), Optional.empty(),
				Optional.empty());

		resp.getEntries().forEach(this::assertHasAnStderrRESTLink);
	}

	private void assertHasAnStderrRESTLink(APIJobDetails jobSummary) {
		Assertions.assertTrue(jobSummary.getLinks().containsKey("stderr"));
		Assertions.assertEquals(jobSummary.getLinks().get("stderr").getHref().toString(),
				HTTP_JOBS_PATH + "/" + jobSummary.getId().toString() + "/stderr");
	}

	@Test
	public void testFetchJobSummariesDoesNotContainLinksToStderrIfJobHasNoStderr() throws IOException {
		final List<JobDetails> jobSummaries = generateRandomJobDetails();

		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getJobs(anyInt(), anyInt())).thenReturn(jobSummaries);
		when(jobDAO.hasStderr(any())).thenReturn(false);

		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetailsCollection resp = jobController.getJobs(Optional.empty(), Optional.empty(),
				Optional.empty());

		resp.getEntries().forEach(this::assertDoesNotHaveAnStderrRESTLink);
	}

	private void assertDoesNotHaveAnStderrRESTLink(APIJobDetails jobSummary) {
		Assertions.assertFalse(jobSummary.getLinks().containsKey("stderr"));
	}

	@Test
	public void testFetchJobDetailsByIdThrowsWebApplicationExceptionIfJobIdIsNotSpecified() {

		final JobController jobController = resourceThatUses(mock(JobDAO.class));

		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.getJobDetailsById(null);
		});
	}

	@Test
	public void testFetchJobDetailsByIdCallsTheDAOWithTheProvidedJobIdAndReturnsTheJobDetailsFromTheDAO()
			throws IOException {
		final JobDetails jobDetailsFromDAO = generateValidJobDetails();
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.of(jobDetailsFromDAO));
		final JobController jobController = resourceThatUses(jobDAO);

		final Optional<APIJobDetails> jobDetailsResponse = jobController.getJobDetailsById(jobDetailsFromDAO.getId());

		verify(jobDAO, times(1)).getJobDetailsById(eq(jobDetailsFromDAO.getId()));
		Assertions.assertEquals(jobDetailsResponse.get(), jobDetailsFromDAO);

	}

	private JobDAO mockJobDAOThatReturns(Optional<JobDetails> jobDetailsReturnedByDAO) {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getJobDetailsById(any())).thenReturn(jobDetailsReturnedByDAO);
		return jobDAO;
	}

	private JobDAO mockJobDAOThatReturnsSpec(Optional<JobSpec> jobSpec) {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getSpecJobWasSubmittedAgainst(any())).thenReturn(jobSpec);
		return jobDAO;
	}

	@Test
	public void testFetchJobDetailsByIdReturnsEmptyOptionalIfJobIDCannotBeFoundInTheJobsDAO() throws IOException {
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.empty());
		final JobController jobController = resourceThatUses(jobDAO);
		final JobId jobId = TestHelpers.generateJobId();

		final Optional<APIJobDetails> resp = jobController.getJobDetailsById(jobId);

		Assertions.assertEquals(resp, Optional.empty());
	}

	@Test
	public void testFetchJobDetailsByIdThrowsWebApplicationExceptionIfJobIdIsNull() throws IOException {
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.empty());
		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.getJobDetailsById(null);
		});
	}

	@Test
	public void testFetchJobDetailsByIdSetsASelfRESTLink() {
		final APIJobDetails jobDetailsReturnedByDAO = generateJobDetailsWithStatus(JobStatus.RUNNING);
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.of(jobDetailsReturnedByDAO));
		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetails APIJobDetailsDetails = jobController.getJobDetailsById(jobDetailsReturnedByDAO.getId())
				.get();

		assertHasASelfRestLink(APIJobDetailsDetails);
	}

	private void assertHasASelfRestLink(APIJobDetails apiJobDetailsDetails) {
		Assertions.assertTrue(apiJobDetailsDetails.getLinks().containsKey("self"));
		Assertions.assertEquals(apiJobDetailsDetails.getLinks().get("self").getHref().toString(),
				HTTP_JOBS_PATH + "/" + apiJobDetailsDetails.getId());
	}

	@Test
	public void testFetchJobDetailsByIdSetsAnInputsRESTLink() {
		final APIJobDetails jobDetailsReturnedByDAO = generateJobDetailsWithStatus(JobStatus.RUNNING);
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.of(jobDetailsReturnedByDAO));
		when(jobDAO.hasJobInputs(any())).thenReturn(true);
		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetails APIJobDetailsDetails = jobController.getJobDetailsById(jobDetailsReturnedByDAO.getId())
				.get();

		assertHasInputsRESTLink(APIJobDetailsDetails);
	}

	private void assertHasInputsRESTLink(APIJobDetails apiJobDetailsDetails) {
		Assertions.assertTrue(apiJobDetailsDetails.getLinks().containsKey("inputs"));
		Assertions.assertEquals(apiJobDetailsDetails.getLinks().get("inputs").getHref().toString(),
				HTTP_JOBS_PATH + "/" + apiJobDetailsDetails.getId() + "/inputs");
	}

	@Test
	public void testFetchJobDetailsByIdSetsAnOutputsRESTLink() {
		final APIJobDetails jobDetailsReturnedByDAO = generateJobDetailsWithStatus(JobStatus.RUNNING);
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.of(jobDetailsReturnedByDAO));
		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetails APIJobDetailsDetails = jobController.getJobDetailsById(jobDetailsReturnedByDAO.getId())
				.get();

		assertHasOutputsRESTLink(APIJobDetailsDetails);
	}

	private void assertHasOutputsRESTLink(APIJobDetails apiJobDetailsDetails) {
		Assertions.assertTrue(apiJobDetailsDetails.getLinks().containsKey("outputs"));
		Assertions.assertEquals(apiJobDetailsDetails.getLinks().get("outputs").getHref().toString(),
				HTTP_JOBS_PATH + "/" + apiJobDetailsDetails.getId() + "/outputs");
	}

	@Test
	public void testFetchJobDetailsByIdSetsAnAbortRESTLinkIfJobIsAbortable() throws IOException {
		final APIJobDetails jobDetailsReturnedByDAO = generateJobDetailsWithStatus(JobStatus.RUNNING);
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.of(jobDetailsReturnedByDAO));
		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetails APIJobDetailsDetails = jobController.getJobDetailsById(jobDetailsReturnedByDAO.getId())
				.get();

		assertHasAnAbortRESTLink(APIJobDetailsDetails);
	}

	private void assertHasAnAbortRESTLink(APIJobDetails apiJobDetailsDetails) {
		Assertions.assertTrue(apiJobDetailsDetails.getLinks().containsKey("abort"));
		Assertions.assertEquals(apiJobDetailsDetails.getLinks().get("abort").getHref().toString(),
				HTTP_JOBS_PATH + "/" + apiJobDetailsDetails.getId() + "/abort");
	}

	@Test
	public void testFetchJobDetailsByIdDoesNotSetAnAbortRESTLinkIfJobIsNotAbortable() throws IOException {
		final APIJobDetails jobDetailsReturnedByDAO = generateJobDetailsWithStatus(JobStatus.FINISHED);
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.of(jobDetailsReturnedByDAO));
		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetails APIJobDetailsDetails = jobController.getJobDetailsById(jobDetailsReturnedByDAO.getId())
				.get();

		assertDoesNotHaveAnAbortRESTLink(APIJobDetailsDetails);
	}

	private void assertDoesNotHaveAnAbortRESTLink(APIJobDetails apiJobDetailsDetails) {
		Assertions.assertFalse(apiJobDetailsDetails.getLinks().containsKey("abort"));
	}

	@Test
	public void testFetchJobDetailsByIdSetsARESTLinkForTheSpec() {
		final APIJobDetails jobDetailsReturnedByDAO = generateJobDetailsWithStatus(JobStatus.FINISHED);
		final JobDAO jobDAO = mockJobDAOThatReturns(Optional.of(jobDetailsReturnedByDAO));
		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobDetails apiJobDetailsDetails = jobController.getJobDetailsById(jobDetailsReturnedByDAO.getId())
				.get();

		assertHasASpecRESTLink(apiJobDetailsDetails);
	}

	private void assertHasASpecRESTLink(APIJobDetails apiJobDetailsDetails) {
		Assertions.assertTrue(apiJobDetailsDetails.getLinks().containsKey("spec"));
		Assertions.assertEquals(apiJobDetailsDetails.getLinks().get("spec").getHref().toString(),
				HTTP_JOBS_PATH + "/" + apiJobDetailsDetails.getId() + "/spec");
	}

	@Test
	public void testSubmitJobThrowsAWebApplicationExceptionIfJobSubmissionRequestIsNull() {
		final JobController jobController = mockedJobController();
		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.submitJob(null);
		});

	}

	private JobController mockedJobController() {
		return getInstance(mock(JobManagerActions.class), mock(JobDAO.class), mock(JobSpecConfigurationDAO.class),
				Constants.DEFAULT_PAGE_SIZE);
	}

	@Test
	public void testSubmitJobCallsTheDAOSubmitMethodIfValidAgainstSpec() throws IOException {
		final JobManagerActions jobManagerActions = mockJobManagerThatReturns(typicalSubmissionReturn());
		final JobDAO jobDAO = mock(JobDAO.class);
		final JobSpec jobSpec = generateValidJobSpec();
		final JobSpecConfigurationDAO jobSpecConfigurationDAO = mockJobSpecDAOThatReturns(jobSpec);

		final JobController jobController = getInstance(jobManagerActions, jobDAO, jobSpecConfigurationDAO,
				Constants.DEFAULT_PAGE_SIZE);

		jobController.submitJob(generateValidJobRequest());

		verify(jobSpecConfigurationDAO, times(1)).getJobSpecById(new JobSpecId("job-schema-1"));

		verify(jobManagerActions, times(1)).submit(any());
	}

	private Pair<JobId, CancelablePromise<FinalizedJob>> typicalSubmissionReturn() {
		return Pair.of(TestHelpers.generateJobId(), new SimpleCancelablePromise<>());
	}

	private JobManagerActions mockJobManagerThatReturns(Pair<JobId, CancelablePromise<FinalizedJob>> ret) {
		final JobManagerActions jobManagerActions = mock(JobManagerActions.class);
		when(jobManagerActions.submit(any())).thenReturn(ret);
		return jobManagerActions;
	}

	private JobSpec generateValidJobSpec() {
		return TestHelpers.readJSONFixture("fixtures/jobson/resources/1_valid-job-spec-configuration.json", JobSpec.class);
	}

	private JobSpecConfigurationDAO mockJobSpecDAOThatReturns(JobSpec jobSpec) {
		final JobSpecConfigurationDAO jobSpecConfigurationDAO = mock(JobSpecConfigurationDAO.class);
		when(jobSpecConfigurationDAO.getJobSpecById(any())).thenReturn(Optional.of(jobSpec));
		return jobSpecConfigurationDAO;
	}

	private APIJobRequest generateValidJobRequest() {
		return TestHelpers.readJSONFixture("fixtures/jobson/resources/1_valid-job-request-against-spec.json",
				APIJobRequest.class);
	}

	@Test
	public void testSubmitJobReturnsAResponseContainingTheIDReturnedByTheDAO() throws IOException {
		final JobId jobId = TestHelpers.generateJobId();
		final Pair<JobId, CancelablePromise<FinalizedJob>> managerRet = Pair.of(jobId, new SimpleCancelablePromise<>());
		final JobManagerActions jobManagerActions = mockJobManagerThatReturns(managerRet);
		final JobDAO jobDAO = mock(JobDAO.class);
		final JobSpec jobSpec = generateValidJobSpec();
		final JobSpecConfigurationDAO jobSpecConfigurationDAO = mockJobSpecDAOThatReturns(jobSpec);

		final JobController jobController = getInstance(jobManagerActions, jobDAO, jobSpecConfigurationDAO,
				Constants.DEFAULT_PAGE_SIZE);

		final APIJobCreatedResponse resp = jobController.submitJob(generateValidJobRequest());

		Assertions.assertEquals(resp.getId(), jobId);
	}

	@Test
	public void testSubmitJobThrowsWebApplicationErrorIfTheRequestProducedValidationErrors() throws IOException {
		final JobManagerActions jobManagerActions = mockJobManagerThatReturns(typicalSubmissionReturn());
		final JobDAO jobDAO = mock(JobDAO.class);
		final JobSpec jobSpec = generateValidJobSpec();
		final JobSpecConfigurationDAO jobSpecConfigurationDAO = mockJobSpecDAOThatReturns(jobSpec);

		final JobController jobController = getInstance(jobManagerActions, jobDAO, jobSpecConfigurationDAO,
				Constants.DEFAULT_PAGE_SIZE);

		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.submitJob(generateInvalidJobRequest());
		});

	}

	private APIJobRequest generateInvalidJobRequest() {
		return TestHelpers.readJSONFixture("fixtures/jobson/resources/1_invalid-job-request-against-spec.json",
				APIJobRequest.class);
	}

	@Test
	public void testSubmitJobResolvesDefaultValuesInTheRequestIfNotProvidedInTheSubmissionRequest() throws IOException {
		final JobManagerActions jobManagerActions = mockJobManagerThatReturns(typicalSubmissionReturn());
		final JobDAO jobDAO = mock(JobDAO.class);
		final JobSpec jobSpec = generateValidJobSpec();
		final JobSpecConfigurationDAO jobSpecConfigurationDAO = mockJobSpecDAOThatReturns(jobSpec);

		final JobController jobController = getInstance(jobManagerActions, jobDAO, jobSpecConfigurationDAO,
				Constants.DEFAULT_PAGE_SIZE);

		jobController.submitJob(getJobRequestWithMissingButDefaultedArg());

		final ArgumentCaptor<ValidJobRequest> captor = ArgumentCaptor.forClass(ValidJobRequest.class);

		verify(jobManagerActions, times(1)).submit(captor.capture());

		final ValidJobRequest validatedJobRequest = captor.getValue();

		final JobExpectedInputId defaultedInputId = new JobExpectedInputId("foo");
		final JobInput jobInput = validatedJobRequest.getInputs().get(defaultedInputId);

		Assertions.assertNotNull(jobInput);
		Assertions.assertEquals(jobInput.getClass(), SelectInput.class);
		Assertions.assertEquals(((SelectInput) jobInput).getValue(), "a");

	}

	private APIJobRequest getJobRequestWithMissingButDefaultedArg() {
		return TestHelpers.readJSONFixture("fixtures/jobson/resources/2_valid-job-request-without-defaulted-arg.json",
				APIJobRequest.class);
	}

	@Test
	public void testAbortJobThrowsWebApplicationExceptionIfJobIdIsNull() {
		final JobController jobController = mockedJobController();
		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.abortJob(null);
		});
	}

	@Test
	public void testAbortJobThrowsIfJobManagerReturnsFalseForAbort() throws IOException {
		final JobManagerActions jobManager = mock(JobManagerActions.class);
		when(jobManager.tryAbort(any())).thenReturn(false);

		final JobController jobController = resourceThatUses(jobManager);

		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.abortJob(TestHelpers.generateJobId());
		});
	}

	private JobController resourceThatUses(JobManagerActions jobManagerActions) {
		return getInstance(jobManagerActions, mock(JobDAO.class), mock(JobSpecConfigurationDAO.class),
				Constants.DEFAULT_PAGE_SIZE);
	}

	@Test
	public void testAbortJobCallsAbortJobInTheDAOWithTheID() throws IOException {
		final JobManagerActions jobManager = mock(JobManagerActions.class);
		when(jobManager.tryAbort(any())).thenReturn(true);
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(true);

		final JobController jobController = resourceThatUses(jobManager, jobDAO);
		final JobId jobId = TestHelpers.generateJobId();

		jobController.abortJob(jobId);

		verify(jobManager, times(1)).tryAbort(jobId);
	}

	private JobController resourceThatUses(JobManagerActions jobManagerActions, JobDAO jobDAO) {
		return getInstance(jobManagerActions, jobDAO, mock(JobSpecConfigurationDAO.class), Constants.DEFAULT_PAGE_SIZE);
	}

	@Test
	public void testGetJobStdoutByIdThrowsWebApplicationExceptionIfNoJobIdIsProvided() {
		final JobController jobController = mockedJobController();
		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.fetchJobStdoutById(null);
		});
	}

	@Test
	public void testGetJobStdoutByIdReturns404NotFoundIfDAOReturnsEmptyOptional() throws IOException {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getStdout(any())).thenReturn(Optional.empty());

		final JobController jobController = resourceThatUses(jobDAO);

		final ResponseEntity<StreamingResponseBody> jobStdoutResponse = jobController
				.fetchJobStdoutById(TestHelpers.generateJobId());

		Assertions.assertEquals(jobStdoutResponse.getStatusCode(), HttpStatus.NOT_FOUND);
	}

	@Test
	public void testGetJobStdoutByIdReturnsA200ResponseAndTheDataIfTheDAOHasStdoutData() throws IOException {
		final byte[] stdoutRawData = TestHelpers.generateRandomBytes();
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getStdout(any())).thenReturn(Optional.of(BinaryData.wrap(stdoutRawData)));
		final JobController jobController = resourceThatUses(jobDAO);

		final ResponseEntity<StreamingResponseBody> response = jobController
				.fetchJobStdoutById(TestHelpers.generateJobId());

		Assertions.assertEquals(response.getStatusCode(), HttpStatus.OK);
		Assertions.assertEquals(response.getHeaders().get("Content-Type").get(0), "application/octet-stream");
		Assertions.assertEquals(response.getHeaders().get("Content-Length").get(0),
				Long.toString(stdoutRawData.length));
		Assertions.assertArrayEquals(readAsByteArray(response), stdoutRawData);

	}

	private byte[] readAsByteArray(ResponseEntity<StreamingResponseBody> response) throws IOException {
		final ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		response.getBody().writeTo(outputStream);
		return outputStream.toByteArray();
	}

	@Test
	public void testGetJobStderrByIdThrowsWebApplicationExceptionIfNoJobIdProvided() {
		final JobController jobController = mockedJobController();
		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.fetchJobStderrById(null);
		});

	}

	@Test
	public void testGetJobStderrByIdReturns404NotFoundIfDAOReturnsEmptyOptional() throws IOException {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getStderr(any())).thenReturn(Optional.empty());
		final JobController jobController = resourceThatUses(jobDAO);

		final ResponseEntity<StreamingResponseBody> response = jobController
				.fetchJobStderrById(TestHelpers.generateJobId());

		Assertions.assertEquals(response.getStatusCode(), HttpStatus.NOT_FOUND);
	}

	@Test
	public void testGetJobStderrByIdReturnsJobStderrIfPresent() throws IOException {
		final byte[] stderrRawData = TestHelpers.generateRandomBytes();
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.getStderr(any())).thenReturn(Optional.of(BinaryData.wrap(stderrRawData)));
		final JobController jobController = resourceThatUses(jobDAO);

		final ResponseEntity<StreamingResponseBody> response = jobController
				.fetchJobStderrById(TestHelpers.generateJobId());

		Assertions.assertEquals(response.getStatusCode(), HttpStatus.OK);
		Assertions.assertEquals(response.getHeaders().get("Content-Type").get(0), "application/octet-stream");
		Assertions.assertEquals(response.getHeaders().get("Content-Length").get(0),
				Long.toString(stderrRawData.length));
		Assertions.assertArrayEquals(readAsByteArray(response), stderrRawData);

	}

	@Test
	public void testFetchJobSpecJobWasSubmittedAgainstReturnsEmptyIfIdDoesNotExist() {
		final JobDAO jobDAO = mockJobDAOThatReturnsSpec(Optional.empty());
		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertFalse((jobController.fetchJobSpecJobWasSubmittedAgainst(generateJobId()).isPresent()));
	}

	@Test
	public void testFetchJobSpecJobWasSubmittedAgainstReturnsTheJobSpecIfIdDoesExist() {
		final JobSpec jobSpec = generateValidJobSpec();
		final JobDAO jobDAO = mockJobDAOThatReturnsSpec(Optional.of(jobSpec));
		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertTrue((jobController.fetchJobSpecJobWasSubmittedAgainst(generateJobId()).isPresent()));
	}

	@Test
	public void testFetchJobOutputsThrows404ExceptionIfJobDoesNotExist() {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(false);
		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.fetchJobOutputs(generateJobId());
		});

	}

	@Test
	public void testFetchJobOutputsReturnsEmptyMapIfDAOReturnsEmptyMap() {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(true);
		when(jobDAO.getJobOutputs(any())).thenReturn(emptyList());

		final JobController jobController = resourceThatUses(jobDAO);

		final APIJobOutputCollection ret = jobController.fetchJobOutputs(generateJobId());

		Assertions.assertTrue(ret.getEntries().isEmpty());
	}

	@Test
	public void testFetchJobOutputsReturnsMapOfOutputsReturnedFromDAO() {
		final List<JobOutputDetails> outputsFromDAO = generateRandomList(10, 20, TestHelpers::generateJobOutputDetails);

		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(true);
		when(jobDAO.getJobOutputs(any())).thenReturn(outputsFromDAO);

		final JobController jobController = resourceThatUses(jobDAO);

		final JobId jobId = generateJobId();

		final APIJobOutputCollection ret = jobController.fetchJobOutputs(jobId);

		Assertions.assertEquals(ret.getEntries().size(), outputsFromDAO.size());
		Assertions.assertEquals(ret.getEntries().stream().map(APIJobOutput::getId).collect(Collectors.toList()),
				outputsFromDAO.stream().map(JobOutputDetails::getId).collect(Collectors.toList()));

		for (APIJobOutput returnedOutput : ret.getEntries()) {
			final JobOutputDetails outputFromDAO = outputsFromDAO.stream()
					.filter(jobOutput -> jobOutput.getId().equals(returnedOutput.getId())).findFirst().get();

			Assertions.assertEquals(returnedOutput.getMimeType(), outputFromDAO.getMimeType());
			Assertions.assertEquals(returnedOutput.getName(), outputFromDAO.getName());
			Assertions.assertEquals(returnedOutput.getDescription(), outputFromDAO.getDescription());
			Assertions.assertEquals(returnedOutput.getMetadata(), outputFromDAO.getMetadata());
			Assertions.assertTrue(
					returnedOutput.getHref().contains("/jobs/" + jobId + "/outputs/" + returnedOutput.getId()));
		}
	}

	@Test
	public void testFetchJobOutputReturns404IfJobDoesNotExist() {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(false);

		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertThrows(RuntimeException.class, () -> {
			final ResponseEntity<StreamingResponseBody> ret = jobController.fetchJobOutput(generateJobId(),
					generateJobOutputId());
		});

	}

	@Test
	public void testFetchJobOutputReturns404IfOutputDoesNotExist() {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(true);
		when(jobDAO.getOutput(any(), any())).thenReturn(Optional.empty());

		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertThrows(RuntimeException.class, () -> {
			final ResponseEntity<StreamingResponseBody> ret = jobController.fetchJobOutput(generateJobId(),
					generateJobOutputId());
		});

	}

	@Test
	public void testFetchJobOutputReturns200IfOutputExists() {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(true);
		final BinaryData bd = generateRandomBinaryData();
		when(jobDAO.getOutput(any(), any())).thenReturn(Optional.of(bd));

		final JobController jobController = resourceThatUses(jobDAO);

		final ResponseEntity<StreamingResponseBody> ret = jobController.fetchJobOutput(generateJobId(),
				generateJobOutputId());

		Assertions.assertEquals(ret.getStatusCode(), HttpStatus.OK);

	}

	@Test
	public void testFetchJobOutputContentTypeMatchesOutputContentType() {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(true);
		final String mimeType = "application/x-test-type";
		final BinaryData bd = generateRandomBinaryData().withMimeType(mimeType);
		when(jobDAO.getOutput(any(), any())).thenReturn(Optional.of(bd));

		final JobController jobController = resourceThatUses(jobDAO);

		final ResponseEntity<StreamingResponseBody> ret = jobController.fetchJobOutput(generateJobId(),
				generateJobOutputId());

		Assertions.assertEquals(ret.getHeaders().get("Content-Type").get(0), mimeType);

	}

	@Test
	public void testFetchJobOutputSetsContentEncodingToIdentityIfAboveBreakpoint() {
		// *Large* job outputs (i.e. bigger than a breakpoint) should not be
		// compressed on the fly. It is known to cause huge CPU and memory spikes
		// in the server, which might be unpredictable for devs.
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(true);
		final int breakpoint = Constants.MAX_JOB_OUTPUT_SIZE_IN_BYTES_BEFORE_DISABLING_COMPRESSION;
		final byte data[] = TestHelpers.generateRandomBytes(breakpoint + 1);
		final BinaryData bd = BinaryData.wrap(data);
		when(jobDAO.getOutput(any(), any())).thenReturn(Optional.of(bd));

		final JobController jobController = resourceThatUses(jobDAO);

		final ResponseEntity<StreamingResponseBody> ret = jobController.fetchJobOutput(generateJobId(),
				generateJobOutputId());

		Assertions.assertEquals(ret.getHeaders().get("Content-Encoding").get(0), "identity");

	}

	@Test
	public void testFetchJobInputsThrows404IfJobDoesNotExist() {
		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(false);
		when(jobDAO.getJobInputs(any())).thenReturn(Optional.empty());

		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertFalse(jobController.fetchJobInputs(generateJobId()).isPresent());
	}

	@Test
	public void testFetchJobInputsReturnsJobInputsFromDAOIfJobExists() {
		final Map<JobExpectedInputId, JsonNode> inputs = new HashMap<>();

		final JobDAO jobDAO = mock(JobDAO.class);
		when(jobDAO.jobExists(any())).thenReturn(true);
		when(jobDAO.getJobInputs(any())).thenReturn(Optional.of(inputs));

		final JobController jobController = resourceThatUses(jobDAO);

		final Optional<Map<JobExpectedInputId, JsonNode>> ret = jobController.fetchJobInputs(generateJobId());

		Assertions.assertTrue(ret.isPresent());
		Assertions.assertEquals(ret.get(), inputs);
	}

	@Test
	public void testDeleteJobThrowsBadRequestIfJobIdIsNull() {
		final JobDAO jobDAO = mock(JobDAO.class);

		final JobController jobController = resourceThatUses(jobDAO);

		Assertions.assertThrows(RuntimeException.class, () -> {
			jobController.deleteJob(null);
		});
	}

	@Test
	public void testDeleteJobCallsJobDAORemove() {
		final JobDAO jobDAO = mock(JobDAO.class);

		final JobController jobController = resourceThatUses(jobDAO);

		final JobId jobId = generateJobId();

		jobController.deleteJob(jobId);

		verify(jobDAO, times(1)).remove(jobId);
	}

	@Test
	public void testDeleteJobCallsAbortOnJob() {
		final JobManagerActions actions = mock(JobManagerActions.class);
		final JobDAO jobDAO = mock(JobDAO.class);

		final JobController jobController = resourceThatUses(actions, jobDAO);

		final JobId jobId = generateJobId();
		when(actions.tryAbort(jobId)).thenReturn(true);

		jobController.deleteJob(jobId);

		verify(actions, times(1)).tryAbort(jobId);
	}
}