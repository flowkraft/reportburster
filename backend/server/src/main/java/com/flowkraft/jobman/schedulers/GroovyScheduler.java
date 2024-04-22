package com.flowkraft.jobman.schedulers;

import java.nio.file.Files;
import java.nio.file.Paths;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;

import com.flowkraft.common.AppPaths;

import groovy.lang.Binding;
import groovy.util.GroovyScriptEngine;

@Service
public class GroovyScheduler {

	@PostConstruct
	public void init() throws Exception {

		String scriptsFolderPath = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH + "/scripts/batch/";

		String scriptName = "schedules.groovy";

		String scriptPath = Paths.get(scriptsFolderPath, scriptName).toString();

		if (Files.exists(Paths.get(scriptPath))) {
			GroovyScriptEngine gse = new GroovyScriptEngine(new String[] { scriptsFolderPath });
			gse.run(scriptName, new Binding());
		}
	}
}