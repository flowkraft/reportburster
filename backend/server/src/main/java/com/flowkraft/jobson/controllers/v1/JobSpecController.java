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
import static java.util.Collections.emptyMap;
import static java.util.Collections.singletonMap;
import static java.util.stream.Collectors.toList;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.validation.constraints.NotNull;
import static java.util.Objects.requireNonNull;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.api.v1.APIErrorMessage;
import com.flowkraft.jobson.api.v1.APIJobSpec;
import com.flowkraft.jobson.api.v1.APIJobSpecSummary;
import com.flowkraft.jobson.api.v1.APIJobSpecSummaryCollection;
import com.flowkraft.jobson.api.v1.APIRestLink;
import com.flowkraft.jobson.dao.specs.JobSpecDAO;
import com.flowkraft.jobson.dao.specs.JobSpecSummary;
import com.flowkraft.jobson.specs.JobSpecId;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@OpenAPIDefinition(info = @Info(description = "Operations related to job specifications"))
@RestController
@RequestMapping(HTTP_SPECS_PATH)
public final class JobSpecController {

	public JobSpecController() {
	}

	private JobSpecDAO jobSpecDAO;

	@Autowired
	public void setJobSpecDAO(JobSpecDAO jobSpecDAO) {
		
		requireNonNull(jobSpecDAO);
		this.jobSpecDAO = jobSpecDAO;
	
	}

	private int defaultPageSize = Constants.DEFAULT_PAGE_SIZE;

	public void setDefaultPageSize(int defaultPageSize) {
		
		if (defaultPageSize < 0)
			throw new RuntimeException("Default page size cannot be negative");

		this.defaultPageSize = defaultPageSize;
	}

	@GetMapping
	@Operation(summary = "Get summaries of the job specs exposed by the system", description = "Returns an object that contains summaries of *some* of the job specs exposed by the system. "
			+ "The response does not necessarily contain summaries for *all* job specs exposed by the system. "
			+ "This is because pagination and client permissions may hide job specs. If further pages of job specs are "
			+ "available, links shall be set to contain hrefs which the client may use to fetch more specs."
			+ "The server may reorder job spec summaries based on its configuration or knowledge about the user. "
			+ "If a client sets a query string, the server will respond appropriately; however, the same rules apply.")
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "Job summaries returned", content = @Content(schema = @Schema(implementation = APIJobSpecSummaryCollection.class))), })
	public APIJobSpecSummaryCollection fetchJobSpecSummaries(
			@Parameter(description = "The page number (0-indexed)") @RequestParam("page") Optional<Integer> page,
			@Parameter(description = "The number of entries a response page should contain.") @RequestParam("page-size") Optional<Integer> pageSize,
			@Parameter(description = "Client query string") @RequestParam("query") Optional<String> query) {

		final int requestedPage = page.isPresent() ? page.get() : 0;
		final int requestedPageSize = pageSize.isPresent() ? pageSize.get() : defaultPageSize;

		if (requestedPage < 0)
			throw new RuntimeException("Requested page cannot be negative");
		if (requestedPageSize < 0)
			throw new RuntimeException("Requested page size cannot be negative");

		final List<JobSpecSummary> jobSummaries = query.isPresent()
				? jobSpecDAO.getJobSpecSummaries(requestedPageSize, requestedPage, query.get())
				: jobSpecDAO.getJobSpecSummaries(requestedPageSize, requestedPage);

		final List<APIJobSpecSummary> apiJobSpecSummaries = jobSummaries.stream().map(summary -> {
			try {
				final Map<String, APIRestLink> restLinks = singletonMap("details",
						new APIRestLink(new URI(HTTP_SPECS_PATH + "/" + summary.getId().toString())));
				return APIJobSpecSummary.fromJobSpecSummary(summary, restLinks);
			} catch (URISyntaxException ex) {
				throw new RuntimeException(ex);
			}
		}).collect(toList());

		return new APIJobSpecSummaryCollection(apiJobSpecSummaries, emptyMap());
	}

	@GetMapping(value = "{job-spec-id}")
	@Operation(summary = "Get a a job spec.", description = "If found, returns a job spec. A job spec describes declaratively what a "
			+ "job needs in order to run.")
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "Job specification found and returned", content = @Content(schema = @Schema(implementation = APIJobSpec.class))),
			@ApiResponse(responseCode = "404", description = "The job specification cannot be found", content = @Content(schema = @Schema(implementation = APIErrorMessage.class))) })
	public Optional<APIJobSpec> fetchJobSpecDetailsById(
			@Parameter(description = "The job spec's ID") @PathVariable("job-spec-id") @NotNull JobSpecId jobSpecId)
			throws IOException {

		if (jobSpecId == null)
			throw new RuntimeException("Job Spec ID cannot be null");

		return jobSpecDAO.getJobSpecById(jobSpecId).map(APIJobSpec::fromJobSpec);
	}
}
