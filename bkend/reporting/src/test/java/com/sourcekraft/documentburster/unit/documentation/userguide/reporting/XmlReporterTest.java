package com.sourcekraft.documentburster.unit.documentation.userguide.reporting;

import static org.junit.Assert.*;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster._helpers.TestsUtils;
import com.sourcekraft.documentburster.engine.reporting.XmlReporter;
import com.sourcekraft.documentburster.utils.CsvUtils;

public class XmlReporterTest {

    // Paths to test resources (adjust as needed)
    private static final String XML_INPUT_BASIC = "src/test/resources/input/unit/reporting/xmlreporter/basic.xml";
    private static final String XML_INPUT_NAMESPACE = "src/test/resources/input/unit/reporting/xmlreporter/namespace.xml";
    private static final String XML_INPUT_ENCODING = "src/test/resources/input/unit/reporting/xmlreporter/utf16.xml";
    private static final String XML_INPUT_XSD = "src/test/resources/input/unit/reporting/xmlreporter/with-xsd.xml";
    private static final String XML_INPUT_FIELD_MAPPING = "src/test/resources/input/unit/reporting/xmlreporter/field-mapping.xml";
    private static final String XML_INPUT_WHITESPACE = "src/test/resources/input/unit/reporting/xmlreporter/whitespace.xml";

    private static final String HTML_TEMPLATE = "src/main/external-resources/template/samples/reports/payslips/payslips-template.html";
    private static final String DOCX_TEMPLATE = "src/main/external-resources/template/samples/reports/payslips/payslips-template.docx";
    private static final String EXCEL_TEMPLATE = "src/main/external-resources/template/samples/reports/payslips/payslips-template-excel.html";

    // 1. Test repeatingnodexpath (with and without idcolumn)
    @Test
    public void testRepeatingNodeXPathWithIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-repeatingNodeXPathWithIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "id";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
                ctx.settings.getReportTemplate().documentpath = HTML_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_BASIC, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertFalse(parsedLines.isEmpty());
        assertEquals(3, parsedLines.size());
    }

    @Test
    public void testRepeatingNodeXPathWithoutIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-repeatingNodeXPathWithoutIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                // idcolumn not set, should default to "notused"
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
                ctx.settings.getReportTemplate().documentpath = HTML_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_BASIC, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertFalse(parsedLines.isEmpty());
        assertEquals(3, parsedLines.size());
    }

    // 2. Test idcolumn (by attribute, by element, by index, and not set)
    @Test
    public void testIdColumnByAttribute() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-idColumnByAttribute") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "@id";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
                ctx.settings.getReportTemplate().documentpath = DOCX_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_BASIC, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(3, parsedLines.size());
        assertTrue(parsedLines.get(0)[0] != null && !parsedLines.get(0)[0].isEmpty());
    }

    @Test
    public void testIdColumnByElement() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-idColumnByElement") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "id";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
                ctx.settings.getReportTemplate().documentpath = DOCX_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_BASIC, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(3, parsedLines.size());
        assertTrue(parsedLines.get(0)[0] != null && !parsedLines.get(0)[0].isEmpty());
    }

    @Test
    public void testIdColumnByIndex() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-idColumnByIndex") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "0";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
                ctx.settings.getReportTemplate().documentpath = DOCX_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_BASIC, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(3, parsedLines.size());
        assertTrue(parsedLines.get(0)[0] != null && !parsedLines.get(0)[0].isEmpty());
    }

    @Test
    public void testIdColumnNotSet_DefaultNotUsed() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-idColumnNotSet-DefaultNotUsed") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                // idcolumn not set, should default to "notused"
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
                ctx.settings.getReportTemplate().documentpath = DOCX_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_BASIC, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(3, parsedLines.size());
        // Should still have data, token will be row index
        assertTrue(parsedLines.get(0)[0] != null && !parsedLines.get(0)[0].isEmpty());
    }

    // 3. Test namespaceMappings (with and without idcolumn)
    @Test
    public void testNamespaceMappingsWithIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-namespaceMappingsWithIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/ns:root/ns:records/ns:record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "ns:id";
                ctx.settings.getReportDataSource().xmloptions.namespaceMappings = "ns=http://example.com/ns";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
                ctx.settings.getReportTemplate().documentpath = HTML_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_NAMESPACE, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(2, parsedLines.size());
        assertTrue(parsedLines.get(0)[0] != null && !parsedLines.get(0)[0].isEmpty());
    }

    @Test
    public void testNamespaceMappingsWithoutIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-namespaceMappingsWithoutIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/ns:root/ns:records/ns:record";
                // idcolumn not set
                ctx.settings.getReportDataSource().xmloptions.namespaceMappings = "ns=http://example.com/ns";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
                ctx.settings.getReportTemplate().documentpath = HTML_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_NAMESPACE, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(2, parsedLines.size());
        assertTrue(parsedLines.get(0)[0] != null && !parsedLines.get(0)[0].isEmpty());
    }

    // 4. Test encoding (with and without idcolumn)
    @Test
    public void testEncodingWithIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-encodingWithIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "id";
                ctx.settings.getReportDataSource().xmloptions.encoding = "UTF-16";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_EXCEL;
                ctx.settings.getReportTemplate().documentpath = EXCEL_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_ENCODING, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(1, parsedLines.size());
        assertTrue(parsedLines.get(0)[0] != null && !parsedLines.get(0)[0].isEmpty());
    }

    @Test
    public void testEncodingWithoutIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-encodingWithoutIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                // idcolumn not set
                ctx.settings.getReportDataSource().xmloptions.encoding = "UTF-16";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_EXCEL;
                ctx.settings.getReportTemplate().documentpath = EXCEL_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_ENCODING, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(1, parsedLines.size());
        assertTrue(parsedLines.get(0)[0] != null && !parsedLines.get(0)[0].isEmpty());
    }

    // 5. Test validationSchema (XSD) (with and without idcolumn)
    @Test
    public void testValidationSchemaWithIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-validationSchemaWithIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "id";
                ctx.settings.getReportDataSource().xmloptions.validationSchema = "src/test/resources/input/unit/reporting/xmlreporter/schema.xsd";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
                ctx.settings.getReportTemplate().documentpath = DOCX_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_XSD, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(2, parsedLines.size());
    }

    @Test
    public void testValidationSchemaWithoutIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-validationSchemaWithoutIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                // idcolumn not set
                ctx.settings.getReportDataSource().xmloptions.validationSchema = "src/test/resources/input/unit/reporting/xmlreporter/schema.xsd";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_DOCX;
                ctx.settings.getReportTemplate().documentpath = DOCX_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_XSD, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(2, parsedLines.size());
    }

    // 6. Test fieldMappings (with and without idcolumn)
    @Test
    public void testFieldMappingsWithIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-fieldMappingsWithIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "id";
                ctx.settings.getReportDataSource().xmloptions.fieldMappings = "name:fullName,amount:total";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
                ctx.settings.getReportTemplate().documentpath = HTML_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_FIELD_MAPPING, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(2, parsedLines.size());
        String[] headers = burster.getCtx().reportColumnNames.toArray(new String[0]);
        boolean hasFullName = false, hasTotal = false;
        for (String h : headers) {
            if ("fullName".equals(h)) hasFullName = true;
            if ("total".equals(h)) hasTotal = true;
        }
        assertTrue(hasFullName);
        assertTrue(hasTotal);
    }

    @Test
    public void testFieldMappingsWithoutIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-fieldMappingsWithoutIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                // idcolumn not set
                ctx.settings.getReportDataSource().xmloptions.fieldMappings = "name:fullName,amount:total";
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
                ctx.settings.getReportTemplate().documentpath = HTML_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_FIELD_MAPPING, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(2, parsedLines.size());
        String[] headers = burster.getCtx().reportColumnNames.toArray(new String[0]);
        boolean hasFullName = false, hasTotal = false;
        for (String h : headers) {
            if ("fullName".equals(h)) hasFullName = true;
            if ("total".equals(h)) hasTotal = true;
        }
        assertTrue(hasFullName);
        assertTrue(hasTotal);
    }

    // 7. Test ignoreleadingwhitespace (with and without idcolumn)
    @Test
    public void testIgnoreLeadingWhitespaceWithIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-ignoreLeadingWhitespaceWithIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                ctx.settings.getReportDataSource().xmloptions.idcolumn = "id";
                ctx.settings.getReportDataSource().xmloptions.ignoreleadingwhitespace = true;
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
                ctx.settings.getReportTemplate().documentpath = HTML_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_WHITESPACE, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(2, parsedLines.size());
        assertEquals("John", parsedLines.get(0)[1]);
        assertEquals("Jane", parsedLines.get(1)[1]);
    }

    @Test
    public void testIgnoreLeadingWhitespaceWithoutIdColumn() throws Exception {
        XmlReporter burster = new TestBursterFactory.XmlReporter(StringUtils.EMPTY, "XmlReporterTest-ignoreLeadingWhitespaceWithoutIdColumn") {
            @Override
            protected void executeController() throws Exception {
                super.executeController();
                ctx.settings.getReportDataSource().xmloptions.repeatingnodexpath = "/root/records/record";
                // idcolumn not set
                ctx.settings.getReportDataSource().xmloptions.ignoreleadingwhitespace = true;
                ctx.settings.getReportTemplate().outputtype = CsvUtils.OUTPUT_TYPE_HTML;
                ctx.settings.getReportTemplate().documentpath = HTML_TEMPLATE;
            }
        };

        burster.burst(XML_INPUT_WHITESPACE, false, StringUtils.EMPTY, -1);

        List<String[]> parsedLines = TestsUtils.toArrayRows(burster.getCtx().reportData);
        assertNotNull(parsedLines);
        assertEquals(2, parsedLines.size());
        assertEquals("John", parsedLines.get(0)[1]);
        assertEquals("Jane", parsedLines.get(1)[1]);
    }
}