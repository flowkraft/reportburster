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

import static com.flowkraft.jobson.Constants.HTTP_SPECS_PATH;
import static com.flowkraft.jobson.TestHelpers.generateJobSpec;
import static com.flowkraft.jobson.TestHelpers.generateNJobSpecSummaries;
import static java.util.stream.Collectors.toList;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import com.flowkraft.jobson.TestHelpers;
import com.flowkraft.jobson.api.v1.APIJobSpec;
import com.flowkraft.jobson.api.v1.APIJobSpecSummary;
import com.flowkraft.jobson.api.v1.APIJobSpecSummaryCollection;
import com.flowkraft.jobson.dao.specs.JobSpecDAO;
import com.flowkraft.jobson.dao.specs.JobSpecSummary;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.specs.JobSpecId;

public final class JobSpecControllerTest {

	private static int DEFAULT_PAGE_SIZE = 20;

	private JobSpecController getInstance(JobSpecDAO jobSpecDAO, int defaultPageSize) {

		JobSpecController jobSpecController = new JobSpecController();

		jobSpecController.setJobSpecDAO(jobSpecDAO);
		jobSpecController.setDefaultPageSize(defaultPageSize);

		return jobSpecController;
	}

	@Test
	public void testCtorThrowsNullPointerExceptionIfArgumentIsNull() {

		Assertions.assertThrows(NullPointerException.class, () -> {
			getInstance(null, DEFAULT_PAGE_SIZE);
		});

	}

	@Test
	public void testCtorThrowsRuntimeExceptionIfDefaultPageSizeIsNegative() {
		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);

		Assertions.assertThrows(RuntimeException.class, () -> {
			getInstance(jobSpecDAO, -1);
		});

	}

	@Test
	public void testFetchJobSpecSummariesReturnsAResponseIfCalledWithOnlyEmptyOptionals() throws IOException {
		final List<JobSpecSummary> jobSpecSummariesReturnedByDAO = generateNJobSpecSummaries(5);

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecSummaries(anyInt(), anyInt())).thenReturn(jobSpecSummariesReturnedByDAO);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		final APIJobSpecSummaryCollection apiJobSpecSummaryCollection = jobSpecController
				.fetchJobSpecSummaries(Optional.empty(), Optional.empty(), Optional.empty());

		Assertions.assertNotNull(apiJobSpecSummaryCollection);
		Assertions.assertEquals(apiJobSpecSummaryCollection.getEntries().stream()
				.map(APIJobSpecSummary::toJobSpecSummary).collect(toList()), jobSpecSummariesReturnedByDAO);
	}

	@Test
	public void testFetchJobSpecSummariesThrowsExceptionIfPageSizeIsNegative() throws IOException {
		final List<JobSpecSummary> jobSpecSummariesReturnedByDAO = generateNJobSpecSummaries(5);

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecSummaries(anyInt(), anyInt())).thenReturn(jobSpecSummariesReturnedByDAO);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		Assertions.assertThrows(RuntimeException.class, () -> {
			// Should throw
			jobSpecController
					.fetchJobSpecSummaries(Optional.empty(), Optional.of(-1), Optional.empty());
		});

	}

	@Test
	public void testFetchJobSpecSummariesCallsTheDAOWithPage0AndDefaultPageSize() throws IOException {
		final List<JobSpecSummary> jobSpecSummariesReturnedByDAO = generateNJobSpecSummaries(5);

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecSummaries(anyInt(), anyInt())).thenReturn(jobSpecSummariesReturnedByDAO);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		jobSpecController.fetchJobSpecSummaries(Optional.empty(), Optional.empty(), Optional.empty());

		verify(jobSpecDAO, times(1)).getJobSpecSummaries(DEFAULT_PAGE_SIZE, 0);
	}

	@Test
	public void testFetchJobSpecSummariesCallsTheDAOWithTheSpecifiedPageSize() throws IOException {
		final List<JobSpecSummary> jobSpecSummariesReturnedByDAO = generateNJobSpecSummaries(5);

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecSummaries(anyInt(), anyInt())).thenReturn(jobSpecSummariesReturnedByDAO);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		final int specifiedPageSize = TestHelpers.randomIntBetween(10, 30);

		jobSpecController.fetchJobSpecSummaries(Optional.empty(), Optional.of(specifiedPageSize), Optional.empty());

		verify(jobSpecDAO, times(1)).getJobSpecSummaries(specifiedPageSize, 0);
	}

	@Test
	public void testFetchJobSpecSummariesCallsTheDAOWithThePageIfSpecified() throws IOException {
		// 50-100 pages
		final int numEntries = TestHelpers.randomIntBetween(50 * DEFAULT_PAGE_SIZE, 100 * DEFAULT_PAGE_SIZE);

		final List<JobSpecSummary> jobSpecSummariesReturnedByDAO = generateNJobSpecSummaries(numEntries);

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecSummaries(anyInt(), anyInt())).thenReturn(jobSpecSummariesReturnedByDAO);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		final int pageRequested = TestHelpers.randomIntBetween(15, 70);

		jobSpecController.fetchJobSpecSummaries(Optional.of(pageRequested), Optional.empty(), Optional.empty());

		verify(jobSpecDAO, times(1)).getJobSpecSummaries(DEFAULT_PAGE_SIZE, pageRequested);
	}

	@Test
	public void testFetchJobSpecSummariesThrowsWebApplicationExceptionIfPageIsNegative() throws IOException {
		final List<JobSpecSummary> jobSpecSummariesReturnedByDAO = generateNJobSpecSummaries(5);

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecSummaries(anyInt(), anyInt())).thenReturn(jobSpecSummariesReturnedByDAO);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		Assertions.assertThrows(RuntimeException.class, () -> {
			// Should throw
			jobSpecController.fetchJobSpecSummaries(Optional.of(-1), Optional.empty(), Optional.empty());
		});

	}

	@Test
	public void testFetchJobSpecSummariesCallsTheDAOWithTheQuerySpecified() throws IOException {
		final List<JobSpecSummary> jobSpecSummariesReturnedByDAO = generateNJobSpecSummaries(5);

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecSummaries(anyInt(), anyInt())).thenReturn(jobSpecSummariesReturnedByDAO);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		final String query = TestHelpers.generateRandomString();

		jobSpecController.fetchJobSpecSummaries(Optional.empty(), Optional.empty(), Optional.of(query));

		verify(jobSpecDAO, times(1)).getJobSpecSummaries(DEFAULT_PAGE_SIZE, 0, query);
	}

	@Test
	public void testFetchJobSpecSummariesContainsLinkToSummaryDetails() throws IOException {
		final List<JobSpecSummary> jobSpecSummariesReturnedByDAO = generateNJobSpecSummaries(5);

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecSummaries(anyInt(), anyInt())).thenReturn(jobSpecSummariesReturnedByDAO);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		final APIJobSpecSummaryCollection APIJobSpecSummaryCollection = jobSpecController
				.fetchJobSpecSummaries(Optional.empty(), Optional.empty(), Optional.empty());

		for (APIJobSpecSummary APIJobSpecSummary : APIJobSpecSummaryCollection.getEntries()) {
			Assertions.assertTrue(APIJobSpecSummary.getLinks().containsKey("details"));
			Assertions.assertTrue(APIJobSpecSummary.getLinks().get("details").getHref().toString()
					.contains(HTTP_SPECS_PATH + "/" + APIJobSpecSummary.getId().toString()));
		}
	}

	@Test
	public void testFetchJobSpecDetailsByIdThrowsWebApplicationExceptionIfJobSpecIdIsNull() throws IOException {
		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		Assertions.assertThrows(RuntimeException.class, () -> {
			final Optional<APIJobSpec> response = jobSpecController.fetchJobSpecDetailsById(null);
		});

	}

	@Test
	public void testFetchJobSpecDetailsByIdReturnsWhateverTheDAOReturns() throws IOException {
		final JobSpec jobSpecFromDAO = generateJobSpec();

		final JobSpecDAO jobSpecDAO = mock(JobSpecDAO.class);
		when(jobSpecDAO.getJobSpecById(any())).thenReturn(Optional.of(jobSpecFromDAO));

		final JobSpecController jobSpecController = getInstance(jobSpecDAO, DEFAULT_PAGE_SIZE);

		final JobSpecId jobSpecId = jobSpecFromDAO.getId();

		final Optional<APIJobSpec> maybeJobSpecFromResource = jobSpecController.fetchJobSpecDetailsById(jobSpecId);

		Assertions.assertTrue(maybeJobSpecFromResource.isPresent());
		Assertions.assertEquals(maybeJobSpecFromResource.get(), APIJobSpec.fromJobSpec(jobSpecFromDAO));
	}
}