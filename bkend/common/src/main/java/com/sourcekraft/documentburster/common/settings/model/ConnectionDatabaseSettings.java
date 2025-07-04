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

    public boolean autotrainvanna;

    @XmlElement(name = "default")
    public boolean defaultConnection;

    public ServerDatabaseSettings databaseserver;

}