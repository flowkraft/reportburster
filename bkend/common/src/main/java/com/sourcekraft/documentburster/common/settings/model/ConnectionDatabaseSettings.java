/*
// ...existing license header...
 */
package com.sourcekraft.documentburster.common.settings.model;

import com.sourcekraft.documentburster.utils.DumpToString;

import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlValue;

import java.util.List;

public class ConnectionDatabaseSettings extends DumpToString {

    /**
     * 
     */
    private static final long serialVersionUID = 8361558733244033457L;

    public String code;

    public String name;

    @XmlElement(name = "default")
    public boolean defaultConnection;

    public ServerDatabaseSettings databaseserver;

    @XmlElement(name = "apps")
    public AppsSettings apps;

    // --- Nested classes for Apps configuration ---

    public static class AppsSettings extends DumpToString {
        private static final long serialVersionUID = 1L;

        @XmlElement(name = "app")
        public List<AppSetting> app;
    }

    public static class AppSetting extends DumpToString {
        private static final long serialVersionUID = 1L;

        @XmlAttribute
        public int index;

        @XmlValue
        public String value;
    }
}