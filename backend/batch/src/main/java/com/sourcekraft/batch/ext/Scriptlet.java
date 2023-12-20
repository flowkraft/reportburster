package com.sourcekraft.batch.ext;

import org.springframework.batch.core.JobParameters;
import org.springframework.batch.repeat.RepeatStatus;

import com.sourcekraft.batch.common.Consts;
import com.sourcekraft.batch.common.job.Manager;
import com.sourcekraft.batch.scripting.ScriptRunner;

import groovy.lang.Binding;

public class Scriptlet extends SimpleTasklet {

    private ScriptRunner scriptRunner = null;
    private Manager manager = null;

    public void setScriptRunner(ScriptRunner scriptRunner) {
        this.scriptRunner = scriptRunner;
    }

    public void setManager(Manager jobsManager) {
        this.manager = jobsManager;
    }

    protected RepeatStatus execute(JobParameters parameters) throws Exception {

        String scriptName = parameters.getString(Consts.JOB_NAME) + Consts.GROOVY_SCRIPT_EXTENTSION;

        Binding binding = new Binding();
        binding.setVariable("manager", manager);
        binding.setVariable("parameters", parameters);

        scriptRunner.setScriptName(scriptName);
        scriptRunner.setBinding(binding);
        scriptRunner.run();

        return RepeatStatus.FINISHED;

    }

}
