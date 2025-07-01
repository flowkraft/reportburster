package com.sourcekraft.documentburster.engine.reporting;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Set;

import javax.xml.XMLConstants;
import javax.xml.namespace.NamespaceContext;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.sourcekraft.documentburster.engine.AbstractReporter;

public class XmlReporter extends AbstractReporter {

	private static final Logger log = LoggerFactory.getLogger(XmlReporter.class);

	public XmlReporter(String configFilePath) {
		super(configFilePath);
	}

	@Override
	protected void fetchData() throws Exception {
		log.trace("Entering fetchData...");

		// --- Read XML Options ---
		String repeatingNodeXPath = ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath;
		String idColumn = ctx.settings.getReportDataSource().xmloptions.idcolumn;
		String namespaceMappings = ctx.settings.getReportDataSource().xmloptions.namespacemappings;
		String encoding = ctx.settings.getReportDataSource().xmloptions.encoding;
		boolean ignoreLeadingWhitespace = ctx.settings.getReportDataSource().xmloptions.ignoreleadingwhitespace;

		if (StringUtils.isBlank(repeatingNodeXPath)) {
			throw new IllegalArgumentException("repeatingnodexpath must be provided in XML options.");
		}

		boolean namespaceAware = StringUtils.isNotBlank(namespaceMappings);

		log.debug(
				"XML Options: repeatingNodeXPath={}, idColumn={}, namespaceAware={}, encoding={}, ignoreLeadingWhitespace={}, namespaceMappings={}",
				repeatingNodeXPath, idColumn, namespaceAware, encoding, ignoreLeadingWhitespace, namespaceMappings);

		// --- Parse XML Document ---
		DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
		dbFactory.setNamespaceAware(namespaceAware);
		DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
		Document doc = dBuilder.parse(Files.newInputStream(Paths.get(filePath)), encoding);
		doc.getDocumentElement().normalize();

		XPathFactory xPathFactory = XPathFactory.newInstance();
		XPath xpath = xPathFactory.newXPath();

		// --- Handle Namespace Mappings ---
		if (namespaceAware) {
			Map<String, String> nsMap = new HashMap<>();
			String[] lines = namespaceMappings.split("\\r?\\n");
			for (String line : lines) {
				String trimmed = line.trim();
				if (!trimmed.isEmpty()) {
					int eq = trimmed.indexOf('=');
					if (eq > 0 && eq < trimmed.length() - 1) {
						String prefix = trimmed.substring(0, eq).trim();
						String uri = trimmed.substring(eq + 1).trim();
						nsMap.put(prefix, uri);
					}
				}
			}
			xpath.setNamespaceContext(new NamespaceContext() {
				@Override
				public String getNamespaceURI(String prefix) {
					return nsMap.getOrDefault(prefix, XMLConstants.NULL_NS_URI);
				}

				@Override
				public String getPrefix(String namespaceURI) {
					for (Map.Entry<String, String> entry : nsMap.entrySet()) {
						if (entry.getValue().equals(namespaceURI)) {
							return entry.getKey();
						}
					}
					return null;
				}

				@Override
				public Iterator<String> getPrefixes(String namespaceURI) {
					List<String> prefixes = new ArrayList<>();
					for (Map.Entry<String, String> entry : nsMap.entrySet()) {
						if (entry.getValue().equals(namespaceURI)) {
							prefixes.add(entry.getKey());
						}
					}
					return prefixes.iterator();
				}
			});
		}

		// --- Select Repeating Nodes ---
		NodeList repeatingNodes = (NodeList) xpath.evaluate(repeatingNodeXPath, doc, XPathConstants.NODESET);
		int nodeCount = repeatingNodes.getLength();
		log.info("Found {} repeating nodes using XPath '{}'", nodeCount, repeatingNodeXPath);

		ctx.reportData = new ArrayList<>();
		ctx.reportColumnNames = new ArrayList<>();
		Set<String> columnSet = new LinkedHashSet<>();

		// --- First pass: collect all possible column names ---
		for (int i = 0; i < nodeCount; i++) {
			Node node = repeatingNodes.item(i);
			if (node.getNodeType() == Node.ELEMENT_NODE) {
				NamedNodeMap attrs = node.getAttributes();
				for (int j = 0; j < attrs.getLength(); j++) {
					columnSet.add("@" + attrs.item(j).getNodeName());
				}
				NodeList children = node.getChildNodes();
				for (int j = 0; j < children.getLength(); j++) {
					Node child = children.item(j);
					if (child.getNodeType() == Node.ELEMENT_NODE) {
						columnSet.add(child.getNodeName());
					}
				}
			}
		}
		ctx.reportColumnNames.addAll(columnSet);

		// --- Second pass: extract data rows ---
		for (int i = 0; i < nodeCount; i++) {
			Node node = repeatingNodes.item(i);
			LinkedHashMap<String, Object> rowMap = new LinkedHashMap<>();

			// Add attributes
			NamedNodeMap attrs = node.getAttributes();
			for (int j = 0; j < attrs.getLength(); j++) {
				String attrName = "@" + attrs.item(j).getNodeName();
				String value = attrs.item(j).getNodeValue();
				if (ignoreLeadingWhitespace && value != null) {
					value = value.trim();
				}
				rowMap.put(attrName, toObject(value));
			}

			// Add child elements
			NodeList children = node.getChildNodes();
			for (int j = 0; j < children.getLength(); j++) {
				Node child = children.item(j);
				if (child.getNodeType() == Node.ELEMENT_NODE) {
					String value = child.getTextContent();
					if (ignoreLeadingWhitespace && value != null) {
						value = value.trim();
					}
					rowMap.put(child.getNodeName(), toObject(value));
				}
			}

			ctx.reportData.add(rowMap);
			log.trace("Added data row map: {}", rowMap);
		}

		String fm = ctx.settings.getReportDataSource().xmloptions.fieldmappings;

		if (StringUtils.isNotBlank(fm))
			applyFieldMappings(fm);

		log.info("XML data fetched successfully. Columns: {}. Data rows: {}", ctx.reportColumnNames.size(),
				ctx.reportData.size());
		log.trace("Exiting fetchData.");
	}

	/**
	 * Parse and apply field-mappings (origName:newName,…) to headers and data rows
	 */
	private void applyFieldMappings(String fieldMappings) {
		if (StringUtils.isBlank(fieldMappings)) {
			return;
		}
		Map<String, String> mappings = parseFieldMappings(fieldMappings);

		// 1) rename headers in place
		ListIterator<String> headerIt = ctx.reportColumnNames.listIterator();
		while (headerIt.hasNext()) {
			String col = headerIt.next();
			if (mappings.containsKey(col)) {
				headerIt.set(mappings.get(col));
			}
		}
		// 2) rename each key in each data row
		for (Map<String, Object> row : ctx.reportData) {
			for (Map.Entry<String, String> me : mappings.entrySet()) {
				String orig = me.getKey();
				if (row.containsKey(orig)) {
					Object val = row.remove(orig);
					row.put(me.getValue(), val);
				}
			}
		}
	}

	/** Turn "a:b,c:d" into a map {a→b, c→d} */
	private Map<String, String> parseFieldMappings(String fm) {
		Map<String, String> m = new LinkedHashMap<>();
		for (String pair : fm.split("\\s*,\\s*")) {
			String[] kv = pair.split("\\s*:\\s*");
			if (kv.length == 2) {
				m.put(kv[0], kv[1]);
			}
		}
		return m;
	}
}