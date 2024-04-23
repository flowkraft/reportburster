package com.flowkraft.jobman.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.jobman.models.FileInfo;
import com.flowkraft.jobman.models.TailCommandInfo;
import com.flowkraft.jobman.services.SystemService;
import com.flowkraft.jobman.services.LogsService;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/api/jobman", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public class LogsController {

	@Autowired
	LogsService logsService;

	@Autowired
	SystemService fsService;

	@GetMapping("/logs")
	public Flux<FileInfo> logs() throws Exception {

		return Flux.fromStream(logsService.ls());

	}

	@PutMapping("/logs/tailer")
	public Mono<ResponseEntity<Void>> tail(@RequestBody TailCommandInfo tailCommandInfo) throws Exception {

		//System.out.println("tailCommandInfo.fileName = " + tailCommandInfo.fileName);
		//System.out.println("tailCommandInfo.command = " + tailCommandInfo.command);
		
		if (tailCommandInfo.command.equals("start"))
			try {
				fsService.startTailer(tailCommandInfo.fileName);
			} catch (Exception e) {
				fsService.stopTailer(tailCommandInfo.fileName);
				fsService.startTailer(tailCommandInfo.fileName);
			}
		else
			// if (info.equals("stop"))
			fsService.stopTailer(tailCommandInfo.fileName);

		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));
	}

	@DeleteMapping("/logs/{logFileName}")
	public Mono<ResponseEntity<Void>> clearLogs(@PathVariable String logFileName) throws Exception {

		//System.out.println("Controller clearLogs: " + logFileName);

		logsService.clearLogs(logFileName);
		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));

	}

}
