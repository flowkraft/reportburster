package com.flowkraft.jobman.schedulers;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;

import groovy.lang.Binding;
import groovy.util.GroovyScriptEngine;

@Service
public class GroovyScheduler {

	@PostConstruct
	public void init() throws Exception {
		GroovyScriptEngine gse = new GroovyScriptEngine(new String[] { "./scripts/batch" });
		gse.run("schedules.groovy", new Binding());
	}
}