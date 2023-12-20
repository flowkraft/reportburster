package com.sourcekraft.batch.polling;

import java.io.File;

import groovy.lang.Binding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.sadun.util.polling.BasePollManager;
import org.sadun.util.polling.FileMovedEvent;

import com.sourcekraft.batch.common.job.Manager;
import com.sourcekraft.batch.scripting.ScriptRunner;

public class ScriptedPollManager extends BasePollManager {

    private static Logger log = LoggerFactory.getLogger(ScriptedPollManager.class);

    private String script;
    private Manager manager;
    private ScriptRunner scriptRunner;

    public void setScript(String script) {
        this.script = script;
    }

    public void setManager(Manager manager) {
        this.manager = manager;
    }

    public void setScriptRunner(ScriptRunner scriptRunner) {
        this.scriptRunner = scriptRunner;
    }

    public void fileMoved(FileMovedEvent evt) {

        String filePath = evt.getPath().getAbsolutePath();

        log.debug("ScriptedPollManager - new input file was moved to : " + filePath);

        Binding binding = new Binding();
        binding.setVariable("evt", evt);
        binding.setVariable("manager", manager);

        scriptRunner.setScriptName(script);
        scriptRunner.setBinding(binding);
        try {
            scriptRunner.run();
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            File receivedFile = new File(filePath);
            if (receivedFile.exists()) {
                if (!receivedFile.delete())
                    log.warn("Could not delete file '" + filePath + "'");
            }
        }

    }
}