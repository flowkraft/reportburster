package com.sourcekraft.documentburster.common.reportparameters;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;
import org.codehaus.groovy.control.CompilerConfiguration;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;

public class ReportParametersHelper {

    public List<Map<String,Object>> processGroovyParametersDsl(Path paramSpecFilePath) throws Exception {
        // 1) read script text
        String scriptText = Files.readString(paramSpecFilePath, StandardCharsets.UTF_8);

        // 2) set up binding (if you still want to expose reportParametersProvided, etc.)
        Binding binding = new Binding();
        binding.setVariable("reportParametersProvided", false);

        // 3) configure GroovyShell to use our ReportParametersScript as base class
        CompilerConfiguration config = new CompilerConfiguration();
        config.setScriptBaseClass(ReportParametersScript.class.getName());

        // 4) parse + run
        GroovyShell shell = new GroovyShell(binding, config);
        ReportParametersScript script = (ReportParametersScript) shell.parse(scriptText);
        script.setBinding(binding);
        script.run();

        // 5) retrieve collected metadata
        return script.getParamsMetadataList();
    }
}
