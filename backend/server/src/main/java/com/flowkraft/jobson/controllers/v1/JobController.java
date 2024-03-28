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

import static com.flowkraft.jobson.Constants.DEFAULT_BINARY_MIME_TYPE;
import static com.flowkraft.jobson.Constants.HTTP_JOBS_PATH;
import static java.util.Collections.emptyMap;
import static java.util.Objects.requireNonNull;
import static java.util.stream.Collectors.toList;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseEntity.BodyBuilder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.fasterxml.jackson.databind.JsonNode;
import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.Helpers;
import com.flowkraft.jobson.api.v1.APIErrorMessage;
import com.flowkraft.jobson.api.v1.APIJobCreatedResponse;
import com.flowkraft.jobson.api.v1.APIJobDetails;
import com.flowkraft.jobson.api.v1.APIJobDetailsCollection;
import com.flowkraft.jobson.api.v1.APIJobOutput;
import com.flowkraft.jobson.api.v1.APIJobOutputCollection;
import com.flowkraft.jobson.api.v1.APIJobRequest;
import com.flowkraft.jobson.api.v1.APIJobSpec;
import com.flowkraft.jobson.api.v1.APIRestLink;
import com.flowkraft.jobson.api.v1.UserId;
import com.flowkraft.jobson.dao.jobs.JobDAO;
import com.flowkraft.jobson.dao.jobs.JobDetails;
import com.flowkraft.jobson.dao.specs.JobSpecConfigurationDAO;
import com.flowkraft.jobson.jobinputs.JobExpectedInputId;
import com.flowkraft.jobson.jobs.JobId;
import com.flowkraft.jobson.jobs.JobManagerActions;
import com.flowkraft.jobson.jobs.jobstates.ValidJobRequest;
import com.flowkraft.jobson.specs.JobOutputId;
import com.flowkraft.jobson.specs.JobSpec;
import com.flowkraft.jobson.utils.BinaryData;
import com.flowkraft.jobson.utils.Either;
import com.flowkraft.jobson.utils.EitherVisitorT;
import com.flowkraft.jobson.utils.ValidationError;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@OpenAPIDefinition(info = @Info(description = "Operations related to jobs"))
@RestController
@RequestMapping(HTTP_JOBS_PATH)
public final class JobController {

	private static final int MAX_PAGE_SIZE = 20;

	private JobManagerActions jobManagerActions;

	private JobSpecConfigurationDAO jobSpecConfigurationDAO;

	private JobDAO jobDAO;

	@Autowired
	public void setJobManagerActions(JobManagerActions jobManagerActions) {
		requireNonNull(jobManagerActions);
		this.jobManagerActions = jobManagerActions;
	}

	@Autowired
	public void setJobSpecConfigurationDAO(JobSpecConfigurationDAO jobSpecConfigurationDAO) {
		requireNonNull(jobSpecConfigurationDAO);
		this.jobSpecConfigurationDAO = jobSpecConfigurationDAO;
	}

	@Autowired
	public void setJobDAO(JobDAO jobDAO) {
		requireNonNull(jobDAO);
		this.jobDAO = jobDAO;
	}

	private int defaultPageSize = Constants.DEFAULT_PAGE_SIZE;

	public void setDefaultPageSize(int defaultPageSize) {

		if (defaultPageSize < 0)
			throw new RuntimeException("Default page size cannot be negative");

		this.defaultPageSize = defaultPageSize;
	}

	public JobController() {
	}

	@GetMapping
	@Operation(summary = "Retrieve jobs managed by the system.", description = "Gets *some* of the jobs managed by the system. The response does not necessarily "
			+ "contain *all* the jobs managed by the system because pagination "
			+ "and client permissions may hide entries. ")
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "Entries returned", content = @Content(schema = @Schema(implementation = APIJobDetailsCollection.class))) })
	public APIJobDetailsCollection getJobs(

			@Parameter(description = "The page number (0-indexed)") @RequestParam("page") Optional<Integer> page,
			@Parameter(description = "The number of entries a response page should contain. Max page size is "
					+ MAX_PAGE_SIZE) @RequestParam("page-size") Optional<Integer> pageSize,
			@Parameter(description = "Client query string") @RequestParam("query") Optional<String> query) {

		final int pageRequested = page.isPresent() ? page.get() : 0;
		final int pageSizeRequested = pageSize.isPresent() ? pageSize.get() : defaultPageSize;

		if (pageRequested < 0)
			throw new RuntimeException("Page specified is negative - only positive numbers are allowed");
		if (pageSizeRequested < 0)
			throw new RuntimeException("Page size specified is negative - only positive numbers are allowed");

		final List<JobDetails> jobs = query.isPresent() ? jobDAO.getJobs(pageSizeRequested, pageRequested, query.get())
				: jobDAO.getJobs(pageSizeRequested, pageRequested);

		final List<APIJobDetails> apiJobDetailss = jobs.stream().map(this::toJobResponse).collect(toList());

		return new APIJobDetailsCollection(apiJobDetailss, emptyMap());
	}

	private APIJobDetails toJobResponse(JobDetails jobDetails) {
		final Map<String, APIRestLink> restLinks = generateRestLinks(jobDetails);
		return APIJobDetails.fromJobDetails(jobDetails, restLinks);
	}

	private Map<String, APIRestLink> generateRestLinks(JobDetails job) {
		try {
			final Map<String, APIRestLink> ret = generateRestLinks(job.getId());
			if (job.latestStatus().isAbortable()) {
				final URI abortJobURI = new URI(HTTP_JOBS_PATH + "/" + job.getId().toString() + "/abort");
				ret.put("abort", new APIRestLink(abortJobURI));
			}
			return ret;
		} catch (URISyntaxException ex) {
			throw new RuntimeException(ex);
		}
	}

	private Map<String, APIRestLink> generateRestLinks(JobId jobId) {
		try {
			final HashMap<String, APIRestLink> ret = new HashMap<>();

			final URI jobDetailsURI = new URI(HTTP_JOBS_PATH + "/" + jobId.toString());
			ret.put("self", new APIRestLink(jobDetailsURI));

			final URI jobSpecURI = new URI(HTTP_JOBS_PATH + "/" + jobId.toString() + "/spec");
			ret.put("spec", new APIRestLink(jobSpecURI));

			if (jobDAO.hasJobInputs(jobId)) {
				final URI jobInputsURI = new URI(HTTP_JOBS_PATH + "/" + jobId.toString() + "/inputs");
				ret.put("inputs", new APIRestLink(jobInputsURI));
			}

			final URI jobOutputsURI = new URI(HTTP_JOBS_PATH + "/" + jobId.toString() + "/outputs");
			ret.put("outputs", new APIRestLink(jobOutputsURI));

			if (jobDAO.hasStderr(jobId)) {
				final URI jobStderrURI = new URI(HTTP_JOBS_PATH + "/" + jobId.toString() + "/stderr");
				ret.put("stderr", new APIRestLink(jobStderrURI));
			}

			if (jobDAO.hasStdout(jobId)) {
				final URI jobStdoutURI = new URI(HTTP_JOBS_PATH + "/" + jobId.toString() + "/stdout");
				ret.put("stdout", new APIRestLink(jobStdoutURI));
			}

			return ret;
		} catch (URISyntaxException ex) {
			throw new RuntimeException(ex);
		}
	}

	@GetMapping(value = "{job-id}")
	@Operation(summary = "Get details of a job managed by the system.", description = "")
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "Job details found", content = @Content(schema = @Schema(implementation = APIJobDetails.class))),
			@ApiResponse(responseCode = "404", description = "The job could not be found", content = @Content(schema = @Schema(implementation = APIErrorMessage.class))),
			@ApiResponse(responseCode = "401", description = "Client not authorized to request job details", content = @Content(schema = @Schema(implementation = APIErrorMessage.class))) })
	public Optional<APIJobDetails> getJobDetailsById(

			@Parameter(description = "The job's ID") @PathVariable("job-id") @NotNull JobId jobId) {

		if (jobId == null)
			throw new RuntimeException("Job ID is null");

		return jobDAO.getJobDetailsById(jobId).map(this::toJobResponse);
	}

	@DeleteMapping(value = "{job-id}")
	@Operation(summary = "Delete a job from the system", description = "Deletes a job from the system, removing **all** job data. Running jobs are aborted before deletion.")
	public int deleteJob(

			@Parameter(description = "The job's ID") @PathVariable("job-id") @NotNull JobId jobId) {

		if (jobId == null)
			throw new RuntimeException("Job ID is null");

		// ensure the job is aborted before deleting it: stops dangling IO writes
		jobManagerActions.tryAbort(jobId);
		
		jobDAO.remove(jobId);
		
		return 200;
	}

	@PostMapping
	@Operation(summary = "Submit a new job", description = "Attempt to submit a new job to the system. The system will check the job against "
			+ "the job spec specified in the request. If it does not match, the request will be "
			+ "immediately rejected by the server. Otherwise, the request will be immediately accepted "
			+ "by the server. Note: the server accepting the job is only indicates that the request "
			+ "matches the job spec. It does not guarantee that the underlying job will complete " + "successfully.")
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "Job request accepted", content = @Content(schema = @Schema(implementation = APIJobCreatedResponse.class))),
			@ApiResponse(responseCode = "400", description = "Invalid or malformed job request", content = @Content(schema = @Schema(implementation = APIErrorMessage.class))) })
	public APIJobCreatedResponse submitJob(

			@Parameter(description = "The job request") @RequestBody @NotNull @Valid APIJobRequest apiJobRequest) {

		// final UserId userId = new UserId(context.getUserPrincipal().getName());
		final UserId userId = new UserId("virgil");

		return validateAPIRequest(apiJobRequest, jobSpecConfigurationDAO, userId)
				.visit(new EitherVisitorT<ValidJobRequest, List<ValidationError>, APIJobCreatedResponse>() {
					@Override
					public APIJobCreatedResponse whenLeft(ValidJobRequest left) {
						final JobId jobId = jobManagerActions.submit(left).getLeft();

						return new APIJobCreatedResponse(jobId, generateRestLinks(jobId));
					}

					@Override
					public APIJobCreatedResponse whenRight(List<ValidationError> right) {
						throw new RuntimeException(
								"Validation errors were found in the request: " + Helpers.commaSeparatedList(right));
					}
				});
	}

	public static Either<ValidJobRequest, List<ValidationError>> validateAPIRequest(APIJobRequest APIJobRequest,
			JobSpecConfigurationDAO jobSpecConfigurationDAO, UserId userId) {

		if (APIJobRequest == null)
			throw new RuntimeException("Job id was null");

		final Optional<JobSpec> maybeJobSchemaConfiguration = jobSpecConfigurationDAO
				.getJobSpecById(APIJobRequest.getSpec());

		if (!maybeJobSchemaConfiguration.isPresent())
			throw new RuntimeException("The specified schema id (" + APIJobRequest.getSpec()
					+ ") could not be found. Are you sure it's available?");

		return ValidJobRequest.tryCreate(maybeJobSchemaConfiguration.get(), userId, APIJobRequest);
	}

	@PostMapping(value = "/{job-id}/abort")
	@Operation(summary = "Abort a running job", description = "Abort a job, stopping it or removing it from the job execute. The job's status "
			+ "should immediately change to aborting. However, full job abortion is not guaranteed "
			+ "to be immediate. This is because the underlying job may take time to close gracefully "
			+ "or because the system itself has a short delay before forcibly killing the job outright.")
	public void abortJob(

			@Parameter(description = "ID of the job to abort") @PathVariable("job-id") @NotNull JobId jobId) {

		//System.out.println("Received '/abort' signal for executing jobId " + jobId) ;

		if (jobId == null)
			throw new RuntimeException("Job ID cannot be null");

		if (jobDAO.jobExists(jobId)) {
			if (jobManagerActions.tryAbort(jobId))
				return;
			else
				throw new RuntimeException("Job cannot be aborted");
		} else
			throw new RuntimeException("Job cannot be found");
	}

	@GetMapping(value = "/{job-id}/stdout", produces = DEFAULT_BINARY_MIME_TYPE)
	@Operation(summary = "Get a job's standard output", description = "Get a job's standard output, if available. A job that has not yet started will not have a standard output and, "
			+ "therefore, this method will return a 404. There is no guarantee that all running/finished jobs will have standard output "
			+ "data. This is because administrative and cleanup routines may dequeue a job's output in order to save space on the server. ")
	public ResponseEntity<StreamingResponseBody> fetchJobStdoutById(

			@Parameter(description = "ID of the job to get stdout for") @PathVariable("job-id") @NotNull JobId jobId) {

		if (jobId == null)
			throw new RuntimeException("Job ID cannot be null");

		return generateBinaryDataResponse(jobId, jobDAO.getStdout(jobId));
	}

	private ResponseEntity<StreamingResponseBody> generateBinaryDataResponse(JobId jobId,
			Optional<BinaryData> maybeBinaryData) {
		if (maybeBinaryData.isPresent()) {
			final BinaryData binaryData = maybeBinaryData.get();

			final StreamingResponseBody responseBody = outputStream -> {
				try {
					IOUtils.copyLarge(binaryData.getData(), outputStream);
				} catch (IOException ex) {
					// This *usually* happens because the client closed the TCP
					// connection, which isn't *exceptional*.
				} finally {
					binaryData.getData().close();
				}
			};

			BodyBuilder responeBuilder = ResponseEntity.ok()
					.header("Content-Length", String.valueOf(binaryData.getSizeOf()))
					.header("Content-Type", binaryData.getMimeType());

			if (binaryData.getSizeOf() > Constants.MAX_JOB_OUTPUT_SIZE_IN_BYTES_BEFORE_DISABLING_COMPRESSION)
				responeBuilder.header("Content-Encoding", "identity");

			return responeBuilder.body(responseBody);
		} else {
			return ResponseEntity.notFound().build();

		}
	}

	@GetMapping(value = "/{job-id}/stderr", produces = DEFAULT_BINARY_MIME_TYPE)
	@Operation(summary = "Get the job's standard error", description = "Get the job's standard error, if available. A job that has not yet started will not have a standard error and, "
			+ "therefore, this method will return a 404. There is no guarantee that all running/finished jobs will have standard "
			+ "error data. This is because administrative and cleanup routines may dequeue a job's output in order to save space on "
			+ "the server.")
	public ResponseEntity<StreamingResponseBody> fetchJobStderrById(

			@Parameter(description = "ID of the job to get stderr for") @PathVariable("job-id") @NotNull JobId jobId) {

		if (jobId == null)
			throw new RuntimeException("Job ID cannot be null");

		return generateBinaryDataResponse(jobId, jobDAO.getStderr(jobId));
	}

	@GetMapping(value = "/{job-id}/spec")
	@Operation(summary = "Get the spec the job was submitted against", description = "Get the spec the job was submitted against. Note: This returns the spec as it was when the "
			+ "job was submitted. Any subsequent updates to the spec will not be in the spec returned by this API call.")
	public Optional<APIJobSpec> fetchJobSpecJobWasSubmittedAgainst(

			@Parameter(description = "ID of the job to get the spec for") @PathVariable("job-id") @NotNull JobId jobId) {

		if (jobId == null)
			throw new RuntimeException("Job ID cannot be null");

		return jobDAO.getSpecJobWasSubmittedAgainst(jobId).map(APIJobSpec::fromJobSpec);
	}

	@GetMapping(value = "/{job-id}/inputs")
	@Operation(summary = "Get the job's inputs", description = "Get the inputs that were supplied when the job was submitted.")
	public Optional<Map<JobExpectedInputId, JsonNode>> fetchJobInputs(

			@Parameter(description = "ID of the job to get inputs for") @PathVariable("job-id") @NotNull JobId jobId) {

		if (jobId == null)
			throw new RuntimeException("Job ID cannot be null");

		return jobDAO.getJobInputs(jobId);
	}

	@GetMapping(value = "/{job-id}/outputs")
	@Operation(summary = "Get the outputs produced by the job", description = "Gets all the outputs produced by the job. If the job has not *written* any outputs (even if specified) "
			+ "then an empty map is returned. If the job does not exist, a 404 is returned")
	public APIJobOutputCollection fetchJobOutputs(

			@Parameter(description = "ID of the job to get the outputs for") @PathVariable("job-id") @NotNull JobId jobId) {

		if (!jobDAO.jobExists(jobId))
			throw new RuntimeException(jobId + ": does not exist");

		final List<APIJobOutput> entries = jobDAO.getJobOutputs(jobId).stream().map(jobOutput -> {
			final String href = HTTP_JOBS_PATH + "/" + jobId + "/outputs/" + jobOutput.getId().toString();
			return APIJobOutput.fromJobOutput(href, jobOutput);
		}).collect(Collectors.toList());

		return new APIJobOutputCollection(entries);
	}

	@GetMapping(value = "/{job-id}/outputs/{output-id}")
	@Operation(summary = "Get an output produced by the job", description = "Gets an output produced by the job. If the job has not written this output, of it it has been "
			+ "subsequently deleted, a 404 shall be returned")
	public ResponseEntity<StreamingResponseBody> fetchJobOutput(

			@Parameter(description = "ID of the job to get the output for") @PathVariable("job-id") @NotNull JobId jobId,
			@Parameter(description = "ID of the output") @PathVariable("output-id") @NotNull JobOutputId outputId) {

		if (!jobDAO.jobExists(jobId))
			throw new RuntimeException(jobId + ": does not exist");

		final Optional<BinaryData> maybeJobOutput = jobDAO.getOutput(jobId, outputId);

		if (!maybeJobOutput.isPresent())
			throw new RuntimeException(jobId + ": " + outputId + ": does not exist");

		return generateBinaryDataResponse(jobId, maybeJobOutput);
	}
}
