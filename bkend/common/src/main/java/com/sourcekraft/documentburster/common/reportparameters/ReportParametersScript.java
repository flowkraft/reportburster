// File: src/main/java/com/sourcekraft/documentburster/common/reportparameters/ReportParametersScript.java
package com.sourcekraft.documentburster.common.reportparameters;

import groovy.lang.Script;
import groovy.lang.Closure;

import java.util.*;

public abstract class ReportParametersScript extends Script {
    private final List<Map<String,Object>> paramsMetadataList = new ArrayList<>();
    private Map<String,Object> currentParam;
    private Map<String,Object> currentConstraints;
    private Map<String,Object> currentUiHints;

    /**
     * When the script refers to an undefined property (e.g. endDate in a constraint),
     * return a ParamRef so you can resolve it later in Java/Angular.
     */
    public Object propertyMissing(String name) {
        return new ParamRef(name);
    }

    /** Called by ReportParametersHelper to retrieve the final list */
    public List<Map<String,Object>> getParamsMetadataList() {
        return paramsMetadataList;
    }

    /** DSL entry point */
    public void reportParameters(Closure<?> body) {
        body.setDelegate(this);
        body.setResolveStrategy(Closure.DELEGATE_FIRST);
        body.call();
    }

    /** 1) overload for parameter(...) without nested block */
    public void parameter(Map<String,Object> args) {
        parameter(args, null);
    }

    /** 2) main entry for parameter(...) with optional nested constraints/ui */
    public void parameter(Map<String,Object> args, Closure<?> body) {
        // start a new parameter map
        currentParam       = new LinkedHashMap<>(args);
        currentConstraints = new LinkedHashMap<>();
        currentUiHints     = new LinkedHashMap<>();

        // run nested constraints {…} and ui {…} if provided
        if (body != null) {
            body.setDelegate(this);
            body.setResolveStrategy(Closure.DELEGATE_FIRST);
            body.call();
        }

        // attach any collected maps
        if (!currentConstraints.isEmpty()) {
            currentParam.put("constraints", new LinkedHashMap<>(currentConstraints));
        }
        if (!currentUiHints.isEmpty()) {
            currentParam.put("ui", new LinkedHashMap<>(currentUiHints));
        }

        // finally add it to the master list
        paramsMetadataList.add(currentParam);
    }

    /** collect constraints(...) calls */
    public void constraints(Map<String,Object> args) {
        if (currentConstraints != null) {
            currentConstraints.putAll(args);
        }
    }

    /** collect ui(...) calls */
    public void ui(Map<String,Object> args) {
        if (currentUiHints != null) {
            currentUiHints.putAll(args);
        }
    }

    /** run() is invoked by GroovyShell and can stay as-is */
    @Override
    public Object run() {
        return null;
    }
}
