package com.sourcekraft.documentburster.common.reportparameters;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.codehaus.groovy.control.CompilerConfiguration;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

public class ReportParametersHelper {

	public static List<ReportParameter> parseGroovyParametersDslCode(String groovyParametersDslCode) throws Exception {

		// 2) set up binding (if you still want to expose reportParametersProvided,
		// etc.)
		Binding binding = new Binding();
		binding.setVariable("reportParametersProvided", false);

		// 3) configure GroovyShell to use our ReportParametersScript as base class
		CompilerConfiguration config = new CompilerConfiguration();
		config.setScriptBaseClass(ReportParametersScript.class.getName());

		// 4) parse + run
		GroovyShell shell = new GroovyShell(binding, config);
		ReportParametersScript script = (ReportParametersScript) shell.parse(groovyParametersDslCode);
		script.setBinding(binding);
		script.run();

		List<Map<String, Object>> paramsMetadataList = script.getParamsMetadataList();
		List<ReportParameter> reportParameters = new ArrayList<>();

		System.out.println("groovyParametersDslCode: " + groovyParametersDslCode.substring(0, 100));
		System.out.println("paramsMetadataList: " + paramsMetadataList.size());

		if (paramsMetadataList != null) {
			for (Map<String, Object> paramMap : paramsMetadataList) {
				ReportParameter rp = new ReportParameter();

				// top-level properties
				rp.id = (String) paramMap.get("id");
				rp.label = (String) paramMap.get("label");
				Object t = paramMap.get("type");
				rp.type = t instanceof Class ? ((Class<?>) t).getSimpleName() : String.valueOf(t);
				rp.description = (String) paramMap.get("description");
				Object defVal = paramMap.get("defaultValue");
				rp.defaultValue = defVal != null ? String.valueOf(defVal) : null;

				Map<String, Object> constraints = (Map<String, Object>) paramMap.getOrDefault("constraints",
						Collections.emptyMap());
				Map<String, Object> uiHints = (Map<String, Object>) paramMap.getOrDefault("ui", Collections.emptyMap());

				// shove the maps straight onto the model
				rp.constraints.putAll(constraints);
				rp.uiHints.putAll(uiHints);

				// finally add to your config
				reportParameters.add(rp);
			}
		}

		return reportParameters;

	}
}
