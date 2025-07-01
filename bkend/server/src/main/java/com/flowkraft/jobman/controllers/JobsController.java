package com.flowkraft.jobman.controllers;

import java.io.File;

import jakarta.validation.constraints.NotNull;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.common.AppPaths;
import com.flowkraft.jobman.models.ClientServerCommunicationInfo;
import com.flowkraft.jobman.models.FileInfo;
import com.flowkraft.jobman.services.JobsService;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/api/jobman", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public class JobsController {

	@Autowired
	JobsService jobsService;

	@GetMapping("/jobs")
	public Flux<FileInfo> jobs() throws Exception {

		return Flux.fromStream(jobsService.fetchStats());

	}

	@PostMapping("/jobs")
	public Mono<ResponseEntity<Void>> doBurst(
			@RequestBody @NotNull ClientServerCommunicationInfo clientServerCommunicationInfo) throws Exception {

		//System.out.println("JobManController: doBurst");

		jobsService.doBurst(clientServerCommunicationInfo);

		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));

	}

	@PostMapping("/jobs/pause/cancel")
	public Mono<ResponseEntity<Void>> doPauseCancelJob(
			@RequestBody @NotNull ClientServerCommunicationInfo clientServerCommunicationInfo) throws Exception {

		String pauseCancelFilePath = AppPaths.JOBS_DIR_PATH + "/"
				+ FilenameUtils.getBaseName(clientServerCommunicationInfo.info) + '.'
				+ clientServerCommunicationInfo.id;
		FileUtils.touch(new File(pauseCancelFilePath));

		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));
	}

	@PostMapping("/jobs/resume")
	public Mono<ResponseEntity<Void>> doResumeJob(
			@RequestBody @NotNull ClientServerCommunicationInfo clientServerCommunicationInfo) throws Exception {

		//System.out.println(clientServerCommunicationInfo.id);
		//System.out.println(clientServerCommunicationInfo.info);

		jobsService.doResume(clientServerCommunicationInfo);

		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));
	}

	@DeleteMapping("/jobs/cancel/resume")
	public Mono<ResponseEntity<Void>> doCancelResumeJob(
			@RequestBody @NotNull ClientServerCommunicationInfo clientServerCommunicationInfo) throws Exception {

		//System.out.println(clientServerCommunicationInfo.id);
		//System.out.println(clientServerCommunicationInfo.info);

		FileUtils.deleteQuietly(new File(clientServerCommunicationInfo.id));
		FileUtils.deleteQuietly(new File(clientServerCommunicationInfo.info));

		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));
	}

	@DeleteMapping("/files/quarantine")
	public Mono<ResponseEntity<Void>> clearQuarantinedFiles() throws Exception {

		// System.out.println("Controller clearQuarantinedFiles");

		File quarantineDirectory = new File(AppPaths.QUARANTINE_DIR_PATH);

		boolean isEmpty = false;
		while (!isEmpty) {
			try {
				FileUtils.cleanDirectory(quarantineDirectory);
				isEmpty = FileUtils.isEmptyDirectory(quarantineDirectory);
			} catch (Exception e) {
				isEmpty = false;
			}
		}
		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));

	}

	@DeleteMapping("/temp/{folderName}")
	public Mono<ResponseEntity<Void>> clearTempFiles(@PathVariable String folderName) throws Exception {

		//System.out.println("Controller /temp/{folderName}");

		long activeJobs = jobsService.fetchStats().count();

		if (activeJobs == 0)
			FileUtils.deleteQuietly(new File(AppPaths.JOBS_DIR_PATH + "/" + folderName));

		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));
	}

}
