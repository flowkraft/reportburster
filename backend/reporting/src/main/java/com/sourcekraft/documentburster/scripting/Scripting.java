package com.sourcekraft.documentburster.scripting;

import java.io.File;
import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
//import org.perf4j.aop.Profiled;

import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.sender.model.AbstractMessage;
import com.sourcekraft.documentburster.utils.Utils;

import groovy.lang.Binding;
import groovy.util.GroovyScriptEngine;

public class Scripting {

	private static Logger log = LoggerFactory.getLogger(Scripting.class);

	private String[] engineRoots = new String[] { "scripts/burst", "scripts/burst/internal" };

	//@Profiled(tag = "executeBurstingLifeCycleScript_{$0}")
	public void executeBurstingLifeCycleScript(String scriptFileName, BurstingContext context) throws Exception {

		executeScript(scriptFileName, context, "ctx");

	}

	//@Profiled(tag = "executeSenderScript_{$0}")
	public void executeSenderScript(String scriptFileName, AbstractMessage message) throws Exception {

		executeScript(scriptFileName, message, "message");

	}

	private void executeScript(String scriptFileName, Object context, String contextObjectName) throws Exception {

		log.debug("scriptFile=" + scriptFileName + ", context=" + context);

		String scriptFilePath = engineRoots[0] + "/" + scriptFileName;
		boolean scriptFound = false;

		for (int i = 0; i < engineRoots.length && !scriptFound; i++) {
			scriptFilePath = engineRoots[i] + "/" + scriptFileName;
			File scriptFile = new File(scriptFilePath);
			scriptFound = scriptFile.exists();
		}

		if (!Utils.isEmptyFile(scriptFilePath)) {

			GroovyScriptEngine gse = new GroovyScriptEngine(engineRoots);

			Binding binding = new Binding();
			binding.setVariable(contextObjectName, context);
			binding.setVariable("log", log);

			gse.run(scriptFileName, binding);

		}

	}

	public void setRoots(String[] roots) {
		
		this.engineRoots = Arrays.copyOf(roots, roots.length);
	
	}

}
