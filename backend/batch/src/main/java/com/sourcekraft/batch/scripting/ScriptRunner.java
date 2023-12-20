package com.sourcekraft.batch.scripting;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import groovy.lang.Binding;
import groovy.util.GroovyScriptEngine;

public class ScriptRunner {

    private static Logger log = LoggerFactory.getLogger(ScriptRunner.class);

    private GroovyScriptEngine gse;

    protected String scriptName;
    protected Binding binding = new Binding();

    private String when;

    public void setWhen(String when) {
        this.when = when;
    }

    public void setScriptsFolder(String scriptsFolder) throws Exception {

        log.debug("ScriptRunner.setScriptsFolder(String scriptsFolder) : scriptsFolder = " + scriptsFolder);

        gse = new GroovyScriptEngine(new String[]{scriptsFolder});
    }

    public void setScriptName(String scriptName) {
        this.scriptName = scriptName;
    }

    public void setBinding(Binding binding) {
        this.binding = binding;
    }

    public void run() throws Exception {

        if ((scriptName == null) || (scriptName.length() == 0))
            scriptName = "cron.groovy";

        log.debug("ScriptRunner.run() : scriptName = " + scriptName + ", when = " + when);

        if ((when != null) && (when.length() > 0))
            binding.setVariable("when", when);

        gse.run(scriptName, binding);

    }
}
