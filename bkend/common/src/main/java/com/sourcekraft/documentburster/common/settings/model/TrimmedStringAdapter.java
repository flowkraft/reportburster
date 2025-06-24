package com.sourcekraft.documentburster.common.settings.model;

import jakarta.xml.bind.annotation.adapters.XmlAdapter;

public class TrimmedStringAdapter extends XmlAdapter<String, String> {

	@Override
	public String unmarshal(String v) {
		if (v != null) {
			v = v.replace("\n", ""); // remove newline characters
			v = v.trim(); // remove leading and trailing whitespace
		}
		return v;
	}

	@Override
	public String marshal(String v) {
		return v;
	}
}