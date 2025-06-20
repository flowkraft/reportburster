package com.sourcekraft.documentburster.common.reportparameters;

public class ParamRef {
    public final String name;
    public ParamRef(String name) {
        this.name = name;
    }
    @Override
    public String toString() {
        return "ParamRef(" + name + ")";
    }
}