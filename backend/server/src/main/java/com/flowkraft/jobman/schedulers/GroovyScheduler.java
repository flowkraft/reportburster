package com.flowkraft.jobman.schedulers;

import javax.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import groovy.lang.Binding;
import groovy.util.GroovyScriptEngine;

@Service
public class GroovyScheduler {

	@Value("${groovy.scripts.path}")
	private String scriptsPath;

	@PostConstruct
	public void init() throws Exception {
		String scriptName = "schedules.groovy";
		String scriptPath = Paths.get(scriptsPath, scriptName).toString();

		// if (Files.exists(Paths.get(scriptPath))) {
		GroovyScriptEngine gse = new GroovyScriptEngine(new String[] { scriptsPath });
		gse.run(scriptName, new Binding());
		// } else {
		// System.out.println("Script " + scriptPath + " does not exist.");
		// }
	}
}