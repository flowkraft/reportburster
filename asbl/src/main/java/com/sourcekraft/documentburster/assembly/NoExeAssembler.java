package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import java.io.FileFilter;
import java.security.SecureRandom;
import java.util.Base64;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import java.util.regex.Matcher;

import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;

import com.sourcekraft.documentburster.common.db.northwind.NorthwindManager;

public class NoExeAssembler extends AbstractAssembler {

	public NoExeAssembler() {

		super("target/package/db-noexe", "target/package/verified-db-noexe", StringUtils.EMPTY);

	}

	protected void compile() throws Exception {

		// First install the actual parent POM from its correct location
		String mavenParentPomXmlPath = Utils.getTopProjectFolderPath() + "/xtra-tools/bild/common-scripts/maven";
		System.out.println("Maven parent POM path: " + mavenParentPomXmlPath);

		// First install the actual parent POM from its correct location
		Utils.runMaven(mavenParentPomXmlPath, "mvn install -U");

		System.out.println(
				"------------------------------------- DONE_00:NoExeAssembler Utils.runMaven('../xtra-tools/bild/common-scripts/maven', mvn install) ... -------------------------------------");

		// this will execute mvn clean install and generate the jar files for all sub
		// projects
		// assembly is not required to be compiled and should be excluded otherwise
		// 'mvn -pl -assembly clean install' command will be executed recursively in an
		// INFINITE loop
		Utils.runMaven(Utils.getTopProjectFolderPath(), "mvn -pl -asbl clean install -am -U");

		System.out.println(
				"------------------------------------- DONE_01:NoExeAssembler Utils.runMaven(Utils.getTopProjectFolderPath(), mvn clean install) ... -------------------------------------");

	}

	protected void preparePackage() throws Exception {

		_gatherAndCopyBulkOfTheFiles();
		_performAdditionalRefinementsAndCopyAdditionalFiles();

	}

	private void _gatherAndCopyBulkOfTheFiles() throws Exception {

		// copy all MODULE_REPORTING's dependencies to the intermediate folder location
		// MODULE_REPORTING/target/dependencies
		// Line 44
		Utils.runMaven(Utils.getTopProjectFolderPath(), "mvn -pl \":rb-reporting\" -am dependency:copy-dependencies");

		System.out.println(
				"------------------------------------- DONE_02:NoExeAssembler Utils.runMaven(Utils.getTopProjectFolderPath(), mvn -pl ':rb-reporting' -am dependency:copy-dependencies) ... -------------------------------------");

		// copy db template files and folders
		FileUtils.copyDirectory(new File("src/main/external-resources/db-template"),
				new File(packageDirPath + "/" + topFolderName), createDotAppslSelectiveFilter());

		System.out.println(
				"------------------------------------- DONE_03:NoExeAssembler copy db template files and folders ... -------------------------------------");

		// Build and copy rb-webcomponents to Grails and WordPress in target
		_buildAndCopyWebComponents();

		// START MODULE_REPORTING work

		// copy MODULE_REPORTING's template files and folders
		FileUtils.copyDirectory(
				new File(
						Utils.getTopProjectFolderPath() + "/bkend/reporting/" + "src/main/external-resources/template"),
				new File(packageDirPath + "/" + topFolderName));

		System.out.println(
				"------------------------------------- DONE_04:NoExeAssembler copy MODULE_REPORTING's template files and folders ... -------------------------------------");

		// copy MODULE_REPORTING's dependencies jar files
		FileUtils.copyDirectory(new File(Utils.getTopProjectFolderPath() + "/bkend/reporting/target/dependencies"),
				new File(packageDirPath + "/" + topFolderName + "/lib/burst"));

		System.out.println(
				"------------------------------------- DONE_05:NoExeAssembler copy MODULE_REPORTING's dependencies jar files ... -------------------------------------");

		// copy rb-reporting.jar
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/bkend/reporting/target/rb-reporting.jar"),
				new File(packageDirPath + "/" + topFolderName + "/lib/burst/rb-reporting.jar"));

		// copy "FAT UBER" rb-server.jar
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/bkend/server/target/rb-server.jar"),
				new File(packageDirPath + "/" + topFolderName + "/lib/server/rb-server.jar"));

		System.out.println(
				"------------------------------------- DONE_06:NoExeAssembler copy rb-reporting.jar, rb-rserver.jar files ... -------------------------------------");

		// END MODULE_REPORTING work

	}

	private void _buildAndCopyWebComponents() throws Exception {
		// Build rb-webcomponents using npm
		String webComponentsPath = Utils.getTopProjectFolderPath() + "/frend/rb-webcomponents";

		// Ensure previous build artifacts are cleaned to avoid stale files
		File distDir = new File(webComponentsPath + "/dist");
		try {
			if (distDir.exists()) {
				System.out.println("Cleaning existing web-components dist: " + distDir.getAbsolutePath());
				FileUtils.deleteDirectory(distDir);
			}
		} catch (Exception ex) {
			System.out.println("Warning: failed to delete existing dist folder: " + ex.getMessage());
		}

		// Run top-level staging script to ensure consistent build + staging behavior
		// Execute from frend/reporting so the npm script `custom:compile-and-stage-web-components` runs
		String reportingDir = Utils.getTopProjectFolderPath() + "/frend/reporting";
		new ProcessExecutor().directory(new File(reportingDir))
				.command("cmd", "/c", "npm run custom:compile-and-stage-web-components").redirectOutput(new LogOutputStream() {
					@Override
					protected void processLine(String line) {
						System.out.println(line);
					}
				}).execute();

		System.out.println(
				"------------------------------------- DONE_03a:NoExeAssembler npm run custom:compile-and-stage-web-components ... -------------------------------------");

		// Copy to tools/rb-webcomponents for serving via static resource handler
		// This allows external apps (Grails, WordPress, etc.) to include: 
		// <script src="http://server:9090/rb-webcomponents/rb-webcomponents.umd.js"></script>
		String toolsWebComponentsPath = packageDirPath + "/" + topFolderName + "/tools/rb-webcomponents";
		FileUtils.forceMkdir(new File(toolsWebComponentsPath));
		FileUtils.copyDirectory(new File(webComponentsPath + "/dist"), new File(toolsWebComponentsPath));

		System.out.println(
			"------------------------------------- DONE_03b:NoExeAssembler copy rb-webcomponents to tools/rb-webcomponents ... -------------------------------------");
	}

	private void _performAdditionalRefinementsAndCopyAdditionalFiles() throws Exception {

		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(packageDirPath + "/" + topFolderName + "/config/_defaults/settings.xml"));

		// SAMPLES START

		// 1. config/samples/split-only
		String splitOnlyXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/split-only/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(splitOnlyXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		String content = FileUtils.readFileToString(new File(splitOnlyXmlConfigFilePath), "UTF-8");
		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		File newFile = new File(splitOnlyXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// 2. config/samples/split-two-times
		String splitTwoTimesSplitOnlyXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/split-two-times/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(splitTwoTimesSplitOnlyXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		content = FileUtils.readFileToString(new File(splitTwoTimesSplitOnlyXmlConfigFilePath), "UTF-8");
		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replace("<split2ndtime>false</split2ndtime>", "<split2ndtime>true</split2ndtime>");
		newFile = new File(splitTwoTimesSplitOnlyXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// 3. config/samples/g-csv2docx/settings.xml
		String payslipsGenerateOnlyDocxXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-csv2docx/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(payslipsGenerateOnlyDocxXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyDocxXmlConfigFilePath), "UTF-8");

		content = content.replace("<template>My Reports</template>", "<template>Payslips Gen DOCX</template>");

		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replace("<reportgenerationmailmerge>false</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");
		newFile = new File(payslipsGenerateOnlyDocxXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		/// config/samples/g-csv2docx/reporting.xml
		String payslipsGenerateOnlyDocxReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-csv2docx/reporting.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(payslipsGenerateOnlyDocxReportingXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>

		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyDocxReportingXmlConfigFilePath), "UTF-8");
		content = content.replace("output.none", "output.docx");

		content = content.replace("<documentpath/>",
				"<documentpath>/samples/reports/payslips/payslips-template.docx</documentpath>");

		newFile = new File(payslipsGenerateOnlyDocxReportingXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// HTML
		/// 4. config/samples/g-csv2htm/settings.xml
		String payslipsGenerateOnlyHtmlXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-csv2htm/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(payslipsGenerateOnlyHtmlXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyHtmlXmlConfigFilePath), "UTF-8");

		content = content.replace("<template>My Reports</template>", "<template>Payslips Gen HTML</template>");

		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replace("<reportgenerationmailmerge>false</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");
		newFile = new File(payslipsGenerateOnlyHtmlXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		/// config/samples/g-csv2htm/reporting.xml
		String payslipsGenerateOnlyHtmlReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-csv2htm/reporting.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(payslipsGenerateOnlyHtmlReportingXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>

		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyHtmlReportingXmlConfigFilePath), "UTF-8");
		content = content.replace("output.none", "output.html");

		content = content.replace("<documentpath/>",
				"<documentpath>/samples/reports/payslips/payslips-template.html</documentpath>");

		newFile = new File(payslipsGenerateOnlyHtmlReportingXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// PDF

		/// 5. config/samples/g-csv2pdf/settings.xml
		String payslipsGenerateOnlyPdfXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-csv2pdf/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(payslipsGenerateOnlyPdfXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyPdfXmlConfigFilePath), "UTF-8");

		content = content.replace("<template>My Reports</template>", "<template>Payslips Gen PDF</template>");

		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replace("<reportgenerationmailmerge>false</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");
		newFile = new File(payslipsGenerateOnlyPdfXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		/// config/samples/g-csv2pdf/reporting.xml
		String payslipsGenerateOnlyPdfReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-csv2pdf/reporting.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(payslipsGenerateOnlyPdfReportingXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>

		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyPdfReportingXmlConfigFilePath), "UTF-8");
		content = content.replace("output.none", "output.pdf");

		content = content.replace("<documentpath/>",
				"<documentpath>/samples/reports/payslips/payslips-template.html</documentpath>");

		newFile = new File(payslipsGenerateOnlyPdfReportingXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// PDF END

		// EXCEL

		/// 6. config/samples/g-csv2xls/settings.xml
		String payslipsGenerateOnlyExcelXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-csv2xls/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(payslipsGenerateOnlyExcelXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyExcelXmlConfigFilePath), "UTF-8");

		content = content.replace("<template>My Reports</template>", "<template>Payslips Gen Excel</template>");

		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replace("<reportgenerationmailmerge>false</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");
		newFile = new File(payslipsGenerateOnlyExcelXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		/// config/samples/g-csv2xls/reporting.xml
		String payslipsGenerateOnlyExcelReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-csv2xls/reporting.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(payslipsGenerateOnlyExcelReportingXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>

		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyExcelReportingXmlConfigFilePath), "UTF-8");
		content = content.replace("output.none", "output.xlsx");

		content = content.replace("<documentpath/>",
				"<documentpath>/samples/reports/payslips/payslips-template-excel.html</documentpath>");

		newFile = new File(payslipsGenerateOnlyExcelReportingXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		/// 7. config/samples/g-xls2xls/settings.xml
		String payslipsGenerateOnlyExcelXlsxDatasourceXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-xls2xls/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(payslipsGenerateOnlyExcelXlsxDatasourceXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyExcelXlsxDatasourceXmlConfigFilePath),
				"UTF-8");

		content = content.replace("<template>My Reports</template>", "<template>Payslips Xlsx2Xlsx</template>");

		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replace("<reportgenerationmailmerge>false</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");
		newFile = new File(payslipsGenerateOnlyExcelXlsxDatasourceXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		/// config/samples/g-xls2xls/reporting.xml
		String payslipsGenerateOnlyExcelReportingXlsxDatasourceXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-xls2xls/reporting.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(payslipsGenerateOnlyExcelReportingXlsxDatasourceXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>

		content = FileUtils
				.readFileToString(new File(payslipsGenerateOnlyExcelReportingXlsxDatasourceXmlConfigFilePath), "UTF-8");
		content = content.replace("ds.csvfile", "ds.excelfile");
		content = content.replace("output.none", "output.xlsx");

		content = content.replace("<documentpath/>",
				"<documentpath>/samples/reports/payslips/payslips-template-excel.html</documentpath>");

		newFile = new File(payslipsGenerateOnlyExcelReportingXlsxDatasourceXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// EXCEL END

		// =========================
		// 8. Student Profiles - SQL -> FOP2PDF (student-labelled demo)
		// =========================
		String studentProfilesSampleDir = packageDirPath + "/" + topFolderName + "/config/samples/g-sql2fop-stud";
		String studentProfilesSettingsFilePath = studentProfilesSampleDir + "/settings.xml";
		String studentProfilesReportingFilePath = studentProfilesSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(studentProfilesSettingsFilePath));
		content = FileUtils.readFileToString(new File(studentProfilesSettingsFilePath), "UTF-8");

		// friendly template name
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>StudentProfiles</template>");

		// ensure burstfilename uses burst token + .pdf
		content = content.replaceAll(
				"(?s)<burstfilename>\\s*\\$\\{burst_token\\}\\.\\$\\{output_type_extension\\}\\s*</burstfilename>",
				Matcher.quoteReplacement("<burstfilename>${FirstName}-${LastName}.pdf</burstfilename>"));

		// no distribution, enable mailmerge so one file per token
		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		FileUtils.writeStringToFile(new File(studentProfilesSettingsFilePath), content, "UTF-8");

		// prepare reporting.xml (defaults -> override for SQL + FOP)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(studentProfilesReportingFilePath));

		content = FileUtils.readFileToString(new File(studentProfilesReportingFilePath), "UTF-8");
		// datasource -> sqlquery
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.sqlquery</type>");
		// output -> fop2pdf
		content = content.replaceAll("(?s)output\\.none", "output.fop2pdf");
		// document path -> FO template we will copy below
		content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
				"<documentpath>/samples/reports/northwind/student-profiles-template.xsl</documentpath>");
		// connection to sample northwind sqlite DB
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		// SQL query: same SELECT used in reporting.spec.ts
		content = content.replaceAll("(?s)<query\\s*/>|<query>\\s*</query>",
				"<query><![CDATA[\n" + "SELECT \n" + "    \"EmployeeID\",\n" + "    \"FirstName\",\n"
						+ "    \"LastName\",\n"
						+ "    date(\"HireDate\"/1000, 'unixepoch', 'localtime') AS \"HireDate\"\n"
						+ "FROM \"Employees\"\n" + "ORDER BY \"HireDate\"\n" + "]]></query>");

		FileUtils.writeStringToFile(new File(studentProfilesReportingFilePath), content, "UTF-8");

		String foTemplateCode = "<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>\\n"
				+ "<fo:root xmlns:fo=\\\"http://www.w3.org/1999/XSL/Format\\\">\\n" + "  <fo:layout-master-set>\\n"
				+ "    <fo:simple-page-master master-name=\\\"A4\\\"\\n" + "      page-height=\\\"29.7cm\\\"\\n"
				+ "      page-width=\\\"21cm\\\"\\n" + "      margin-top=\\\"1cm\\\"\\n"
				+ "      margin-bottom=\\\"1cm\\\"\\n" + "      margin-left=\\\"1.5cm\\\"\\n"
				+ "      margin-right=\\\"1.5cm\\\">\\n" + "      <fo:region-body/>\\n"
				+ "    </fo:simple-page-master>\\n" + "  </fo:layout-master-set>\\n"
				+ "  <fo:page-sequence master-reference=\\\"A4\\\">\\n"
				+ "    <fo:flow flow-name=\\\"xsl-region-body\\\">\\n" + "\\n"
				+ "      <fo:block font-size=\\\"16pt\\\" font-weight=\\\"bold\\\" text-align=\\\"center\\\" space-after=\\\"15pt\\\">\\n"
				+ "        Student Details\\n" + "      </fo:block>\\n" + "\\n"
				+ "      <fo:table table-layout=\\\"fixed\\\" width=\\\"100%\\\" font-size=\\\"10pt\\\">\\n"
				+ "        <fo:table-column column-width=\\\"4cm\\\"/>\\n"
				+ "        <fo:table-column column-width=\\\"5cm\\\"/>\\n"
				+ "        <fo:table-column column-width=\\\"5cm\\\"/>\\n"
				+ "        <fo:table-column column-width=\\\"4cm\\\"/>\\n" + "        <fo:table-body>\\n"
				+ "          <fo:table-row background-color=\\\"#f2f2f2\\\">\\n"
				+ "            <fo:table-cell border=\\\"1pt solid black\\\" padding=\\\"4pt\\\">\\n"
				+ "              <fo:block font-weight=\\\"bold\\\" text-align=\\\"center\\\">Student ID</fo:block>\\n"
				+ "            </fo:table-cell>\\n"
				+ "            <fo:table-cell border=\\\"1pt solid black\\\" padding=\\\"4pt\\\">\\n"
				+ "              <fo:block font-weight=\\\"bold\\\" text-align=\\\"center\\\">First Name</fo:block>\\n"
				+ "            </fo:table-cell>\\n"
				+ "            <fo:table-cell border=\\\"1pt solid black\\\" padding=\\\"4pt\\\">\\n"
				+ "              <fo:block font-weight=\\\"bold\\\" text-align=\\\"center\\\">Last Name</fo:block>\\n"
				+ "            </fo:table-cell>\\n"
				+ "            <fo:table-cell border=\\\"1pt solid black\\\" padding=\\\"4pt\\\">\\n"
				+ "              <fo:block font-weight=\\\"bold\\\" text-align=\\\"center\\\">Enrolment Date</fo:block>\\n"
				+ "            </fo:table-cell>\\n" + "          </fo:table-row>\\n" + "          <fo:table-row>\\n"
				+ "            <fo:table-cell border=\\\"1pt solid black\\\" padding=\\\"4pt\\\">\\n"
				+ "              <fo:block text-align=\\\"center\\\">${EmployeeID!}</fo:block>\\n"
				+ "            </fo:table-cell>\\n"
				+ "            <fo:table-cell border=\\\"1pt solid black\\\" padding=\\\"4pt\\\">\\n"
				+ "              <fo:block>${FirstName!}</fo:block>\\n" + "            </fo:table-cell>\\n"
				+ "            <fo:table-cell border=\\\"1pt solid black\\\" padding=\\\"4pt\\\">\\n"
				+ "              <fo:block>${LastName!}</fo:block>\\n" + "            </fo:table-cell>\\n"
				+ "            <fo:table-cell border=\\\"1pt solid black\\\" padding=\\\"4pt\\\">\\n"
				+ "              <fo:block>\\n" + "                <#if HireDate?is_date>\\n"
				+ "                  ${HireDate?string(\\\"yyyy-MM-dd\\\")}\\n" + "                <#else>\\n"
				+ "                  ${HireDate!}\\n" + "                </#if>\\n" + "              </fo:block>\\n"
				+ "            </fo:table-cell>\\n" + "          </fo:table-row>\\n" + "        </fo:table-body>\\n"
				+ "      </fo:table>\\n" + "\\n" + "    </fo:flow>\\n" + "  </fo:page-sequence>\\n" + "</fo:root>\\n";

		// Minimal fix: convert Java-escaped sequences into real characters before
		// writing
		foTemplateCode = foTemplateCode.replace("\\n", System.lineSeparator()) // convert literal "\n" to real newline
				.replace("\\\"", "\""); // convert literal '\"' to real double-quote

		FileUtils.writeStringToFile(new File(
				packageDirPath + "/" + topFolderName + "/samples/reports/northwind/student-profiles-template.xsl"),
				foTemplateCode, "UTF-8");

		// =========================
		// 9. Customer Statement - SQL -> single HTML file (single customer)
		// =========================
		String customerStatementSampleDir = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-sql2htm-cst-stmt";
		String customerStatementSettingsFilePath = customerStatementSampleDir + "/settings.xml";
		String customerStatementReportingFilePath = customerStatementSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(customerStatementSettingsFilePath));
		content = FileUtils.readFileToString(new File(customerStatementSettingsFilePath), "UTF-8");

		// set a friendly template name and ensure distribution/mailmerge settings are
		// appropriate
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>CustomerStatements</template>");

		// ensure burstfilename uses the burst token and .html extension
		content = content.replaceAll(
				"(?s)<burstfilename>\\s*\\$\\{burst_token\\}\\.\\$\\{output_type_extension\\}\\s*</burstfilename>",
				Matcher.quoteReplacement("<burstfilename>${CustomerID}.html</burstfilename>"));

		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		// keep mailmerge enabled so a per-customer output filename (burst token) is
		// used
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		// leave burstfilename using token pattern so generated filename will be e.g.
		// ALFKI.html
		// write settings back
		FileUtils.writeStringToFile(new File(customerStatementSettingsFilePath), content, "UTF-8");

		// prepare reporting.xml for this sample (use defaults and switch to html output
		// and our template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(customerStatementReportingFilePath));

		content = FileUtils.readFileToString(new File(customerStatementReportingFilePath), "UTF-8");

		// use SQL query datasource
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.sqlquery</type>");
		// html output
		content = content.replaceAll("(?s)output\\.none", "output.html");

		// handle both self-closing and empty/whitespace variants for <documentpath>
		content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
				"<documentpath>/samples/reports/northwind/customer-statement-template.html</documentpath>");

		// set connection to sample northwind sqlite DB (matches other samples)
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		// ensure idcolumn is CustomerID (replace self-closing or any existing value)
		// content =
		// content.replaceAll("(?s)<idcolumn\\s*/>|<idcolumn>\\s*[^<]*\\s*</idcolumn>",
		// "<idcolumn>CustomerID</idcolumn>");

		// set query for single-customer statement (example uses ALFKI as in unit test)
		content = content.replaceAll("(?s)<query\\s*/>|<query>\\s*</query>", "<query><![CDATA[\n"
				+ "SELECT c.CustomerID AS CustomerID, c.CompanyName AS CompanyName,\n"
				+ "       COUNT(o.OrderID) AS TotalOrders,\n" + "       SUM(o.Freight) AS TotalFreight,\n"
				+ "       SUM(CASE WHEN o.ShippedDate IS NULL THEN o.Freight ELSE 0 END) AS OutstandingBalance\n"
				+ "FROM \"Customers\" c\n" + "LEFT JOIN \"Orders\" o ON c.CustomerID=o.CustomerID\n"
				+ "GROUP BY c.CustomerID, c.CompanyName\n" + "]]></query>");

		FileUtils.writeStringToFile(new File(customerStatementReportingFilePath), content, "UTF-8");

		FileUtils.copyFile(
				new File(Utils.getTopProjectFolderPath()
						+ "/bkend/reporting/src/test/resources/templates/northwind/customer_statement_template.html"),
				new File(packageDirPath + "/" + topFolderName
						+ "/samples/reports/northwind/customer-statement-template.html"));

		// =========================
		// 10. Customer Sales Summary - SQL -> single Excel file
		// =========================
		String customerSalesSampleDir = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-sql2xls-cst-sles";
		String customerSalesSettingsFilePath = customerSalesSampleDir + "/settings.xml";
		String customerSalesReportingFilePath = customerSalesSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(customerSalesSettingsFilePath));
		content = FileUtils.readFileToString(new File(customerSalesSettingsFilePath), "UTF-8");

		// set a friendly template name and disable distribution/mailmerge for a
		// single-file Excel sample
		// handle both self-closing and empty/whitespace variants robustly
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>CustomerSales</template>");

		// replace the burstfilename entry that used
		// ${burst_token}.${output_type_extension}
		content = content.replaceAll(
				"(?s)<burstfilename>\\s*\\$\\{burst_token\\}\\.\\$\\{output_type_extension\\}\\s*</burstfilename>",
				"<burstfilename>CustomerSalesSummary.xlsx</burstfilename>");

		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		newFile = new File(customerSalesSettingsFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// prepare reporting.xml for this sample (use defaults and switch to xlsx output
		// and our template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(customerSalesReportingFilePath));

		content = FileUtils.readFileToString(new File(customerSalesReportingFilePath), "UTF-8");

		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.sqlquery</type>");
		content = content.replaceAll("(?s)output\\.none", "output.xlsx");

		// handle both self-closing and empty/whitespace variants for <documentpath>
		content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
				"<documentpath>/samples/reports/northwind/customer-sales-template-excel.html</documentpath>");

		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		content = content.replaceAll("(?s)<query\\s*/>|<query>\\s*</query>", "<query><![CDATA[\n" + "SELECT\n"
				+ "  C.\"CustomerID\",\n" + "  C.\"CompanyName\",\n"
				+ "  COUNT(DISTINCT O.\"OrderID\")                        AS OrdersCount,\n"
				+ "  SUM(OD.\"UnitPrice\" * OD.\"Quantity\" * (1 - COALESCE(OD.\"Discount\",0))) AS TotalSales,\n"
				+ "  ROUND(\n" + "    CASE WHEN COUNT(DISTINCT O.\"OrderID\") = 0 THEN 0\n"
				+ "         ELSE SUM(OD.\"UnitPrice\" * OD.\"Quantity\" * (1 - COALESCE(OD.\"Discount\",0))) / COUNT(DISTINCT O.\"OrderID\")\n"
				+ "    END, 2)                                         AS AvgOrderValue\n" + "FROM \"Customers\" C\n"
				+ "JOIN \"Orders\" O            ON C.\"CustomerID\" = O.\"CustomerID\"\n"
				+ "JOIN \"Order Details\" OD    ON O.\"OrderID\"    = OD.\"OrderID\"\n"
				+ "GROUP BY C.\"CustomerID\", C.\"CompanyName\"\n" + "ORDER BY TotalSales DESC\n" + "LIMIT 20;\n"
				+ "]]></query>");

		FileUtils.writeStringToFile(new File(customerSalesReportingFilePath), content, "UTF-8");

		// =========================
		// 11. Scripted Invoice - ScriptedReporter -> HTML per Order
		// (invoice_${OrderID}.html)
		// =========================
		String scriptedInvoiceSampleDir = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-scr2htm-cst-invo";
		String scriptedInvoiceSettingsFilePath = scriptedInvoiceSampleDir + "/settings.xml";
		String scriptedInvoiceReportingFilePath = scriptedInvoiceSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(scriptedInvoiceSettingsFilePath));
		content = FileUtils.readFileToString(new File(scriptedInvoiceSettingsFilePath), "UTF-8");

		// friendly template name
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>CustomerInvoices</template>");

		// ensure burstfilename uses OrderID token pattern (invoice_${OrderID}.html)
		content = content.replaceAll(
				"(?s)<burstfilename>\\s*\\$\\{burst_token\\}\\.\\$\\{output_type_extension\\}\\s*</burstfilename>",
				Matcher.quoteReplacement("<burstfilename>invoice_${OrderID}.html</burstfilename>"));

		// no distribution, enable mailmerge so engine will create per-order files
		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		FileUtils.writeStringToFile(new File(scriptedInvoiceSettingsFilePath), content, "UTF-8");

		// prepare reporting.xml (defaults -> override to use script datasource + HTML
		// output + template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(scriptedInvoiceReportingFilePath));

		content = FileUtils.readFileToString(new File(scriptedInvoiceReportingFilePath), "UTF-8");

		// datasource -> ds.scriptfile
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.scriptfile</type>");

		// set connection to sample northwind sqlite DB
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		content = content.replaceAll("(?s)<scriptname\\s*/>|<scriptname>\\s*</scriptname>",
				"<scriptname>g-scr2htm-cst-invo-script.groovy</scriptname>");

		// ensure idcolumn is OrderID (script bursts by OrderID)
		content = content.replaceAll("(?s)<idcolumn\\s*/>|<idcolumn>\\s*[^<]*\\s*</idcolumn>",
				"<idcolumn>OrderID</idcolumn>");

		// ensure html output
		content = content.replaceAll("(?s)output\\.none", "output.html");
		// set document path to packaged template
		content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
				"<documentpath>/samples/reports/northwind/scriptedReport-invoice-template.html</documentpath>");

		FileUtils.writeStringToFile(new File(scriptedInvoiceReportingFilePath), content, "UTF-8");

		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath()
				+ "/bkend/reporting/src/test/resources/templates/northwind/scriptedReport_invoice_template.html"),
				new File(packageDirPath + "/" + topFolderName
						+ "/samples/reports/northwind/scriptedReport-invoice-template.html"));

		FileUtils.copyFile(
				new File(Utils.getTopProjectFolderPath()
						+ "/bkend/reporting/src/test/groovy/reporting/scriptedReport_invoice.groovy"),
				new File(scriptedInvoiceSampleDir + "/g-scr2htm-cst-invo-script.groovy"));

		// =========================
		// 12. Scripted Category-Region Crosstab - ScriptedReporter -> single HTML
		// (crosstab_report.html)
		// =========================
		String crosstabSampleDir = packageDirPath + "/" + topFolderName + "/config/samples/g-scr2htm-cross";
		String crosstabSettingsFilePath = crosstabSampleDir + "/settings.xml";
		String crosstabReportingFilePath = crosstabSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(crosstabSettingsFilePath));
		content = FileUtils.readFileToString(new File(crosstabSettingsFilePath), "UTF-8");

		// friendly template name
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>CategoryRegionCrosstab</template>");

		// single output file name
		content = content.replaceAll(
				"(?s)<burstfilename>\\s*\\$\\{burst_token\\}\\.\\$\\{output_type_extension\\}\\s*</burstfilename>",
				"<burstfilename>CategoryRegionCrosstab.html</burstfilename>");

		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		FileUtils.writeStringToFile(new File(crosstabSettingsFilePath), content, "UTF-8");

		// prepare reporting.xml (defaults -> override to use script datasource + HTML
		// output + template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(crosstabReportingFilePath));

		content = FileUtils.readFileToString(new File(crosstabReportingFilePath), "UTF-8");

		// datasource -> ds.scriptfile
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.scriptfile</type>");

		// set connection to sample northwind sqlite DB
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		// set script name used by the ScriptedReporter
		content = content.replaceAll("(?s)<scriptname\\s*/>|<scriptname>\\s*</scriptname>",
				"<scriptname>g-scr2htm-cross-script.groovy</scriptname>");

		// ensure html output
		content = content.replaceAll("(?s)output\\.none", "output.html");

		// set document path to packaged template (we will copy it below)
		content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
				"<documentpath>/samples/reports/northwind/scriptedReport-crosstab-template.html</documentpath>");

		FileUtils.writeStringToFile(new File(crosstabReportingFilePath), content, "UTF-8");

		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath()
				+ "/bkend/reporting/src/test/resources/templates/northwind/scriptedReport_crosstab_template.html"),
				new File(packageDirPath + "/" + topFolderName
						+ "/samples/reports/northwind/scriptedReport-crosstab-template.html"));

		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath()
				+ "/bkend/reporting/src/test/groovy/reporting/scriptedReport_categoryRegionCrosstabReport.groovy"),
				new File(crosstabSampleDir + "/g-scr2htm-cross-script.groovy"));

		// =========================
		// 13. Scripted Monthly Sales Trend - ScriptedReporter -> single HTML
		// (sales_trend_report.html)
		// =========================
		String trendSampleDir = packageDirPath + "/" + topFolderName + "/config/samples/g-scr2htm-trend";
		String trendSettingsFilePath = trendSampleDir + "/settings.xml";
		String trendReportingFilePath = trendSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(trendSettingsFilePath));
		content = FileUtils.readFileToString(new File(trendSettingsFilePath), "UTF-8");

		// friendly template name
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>MonthlySalesTrend</template>");

		// single output file name
		content = content.replaceAll(
				"(?s)<burstfilename>\\s*\\$\\{burst_token\\}\\.\\$\\{output_type_extension\\}\\s*</burstfilename>",
				"<burstfilename>MonthlySalesTrend.html</burstfilename>");

		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		FileUtils.writeStringToFile(new File(trendSettingsFilePath), content, "UTF-8");

		// prepare reporting.xml (defaults -> override to use script datasource + HTML
		// output + template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(trendReportingFilePath));

		content = FileUtils.readFileToString(new File(trendReportingFilePath), "UTF-8");

		// datasource -> ds.scriptfile
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.scriptfile</type>");

		// set connection to sample northwind sqlite DB
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		// set script name used by the ScriptedReporter
		content = content.replaceAll("(?s)<scriptname\\s*/>|<scriptname>\\s*</scriptname>",
				"<scriptname>g-scr2htm-trend-script.groovy</scriptname>");

		// ensure html output
		content = content.replaceAll("(?s)output\\.none", "output.html");

		// set document path to packaged template (we will copy it below)
		content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
				"<documentpath>/samples/reports/northwind/scriptedReport-trend-template.html</documentpath>");

		FileUtils.writeStringToFile(new File(trendReportingFilePath), content, "UTF-8");

		// copy scripted trend HTML template into package samples/reports/other
		FileUtils.copyFile(
				new File(Utils.getTopProjectFolderPath()
						+ "/bkend/reporting/src/test/resources/templates/northwind/scriptedReport_trend_template.html"),
				new File(packageDirPath + "/" + topFolderName
						+ "/samples/reports/northwind/scriptedReport-trend-template.html"));

		// copy the groovy script that builds the trend data into the sample folder
		String srcTrendScript = Utils.getTopProjectFolderPath()
				+ "/bkend/reporting/src/test/groovy/reporting/scriptedReport_monthlySalesTrendReport.groovy";
		File destTrendScript = new File(trendSampleDir + "/g-scr2htm-trend-script.groovy");

		// Read, adapt for SQLite and write
		content = FileUtils.readFileToString(new File(srcTrendScript), "UTF-8");
		// Replace H2 FORMATDATETIME(expr, 'yyyy-MM') -> SQLite strftime('%Y-%m', expr)
		// This covers SELECT and GROUP BY occurrences
		content = content.replaceAll("(?is)FORMATDATETIME\\s*\\(\\s*([^,]+?)\\s*,\\s*'yyyy-MM'\\s*\\)",
				"COALESCE(" + "strftime('%Y-%m', $1)," + // ISO-text dates
						"strftime('%Y-%m', $1/1000, 'unixepoch')," + // epoch milliseconds
						"strftime('%Y-%m', $1, 'unixepoch')," + // epoch seconds
						"substr($1,1,7)" + // fallback 'YYYY-MM' prefix
						")");

		// Write adapted script into package
		FileUtils.writeStringToFile(destTrendScript, content, "UTF-8");

		// =========================
		// 14. Scripted Supplier Scorecard - ScriptedReporter -> per-supplier HTML
		// (supplier_${burst_token}_scorecard.html)
		// =========================
		String scorecardSampleDir = packageDirPath + "/" + topFolderName
				+ "/config/samples/g-scr2htm-supc";
		String scorecardSettingsFilePath = scorecardSampleDir + "/settings.xml";
		String scorecardReportingFilePath = scorecardSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(scorecardSettingsFilePath));
		content = FileUtils.readFileToString(new File(scorecardSettingsFilePath), "UTF-8");

		// friendly template name
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>SupplierScorecard</template>");

		// ensure burstfilename uses supplier_${burst_token}_scorecard.html
		content = content.replaceAll(
				"(?s)<burstfilename>\\s*\\$\\{burst_token\\}\\.\\$\\{output_type_extension\\}\\s*</burstfilename>",
				Matcher.quoteReplacement("<burstfilename>supplier_${burst_token}_scorecard.html</burstfilename>"));

		// no distribution, enable mailmerge
		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		FileUtils.writeStringToFile(new File(scorecardSettingsFilePath), content, "UTF-8");

		// prepare reporting.xml (defaults -> override to use script datasource + HTML
		// output + template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(scorecardReportingFilePath));

		content = FileUtils.readFileToString(new File(scorecardReportingFilePath), "UTF-8");

		// datasource -> ds.scriptfile
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.scriptfile</type>");

		// set connection to sample northwind sqlite DB
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		// set script name used by the ScriptedReporter
		content = content.replaceAll("(?s)<scriptname\\s*/>|<scriptname>\\s*</scriptname>",
				"<scriptname>g-scr2htm-supc-script.groovy</scriptname>");

		// ensure idcolumn is SupplierID (script bursts by SupplierID)
		content = content.replaceAll("(?s)<idcolumn\\s*/>|<idcolumn>\\s*[^<]*\\s*</idcolumn>",
				"<idcolumn>SupplierID</idcolumn>");

		// ensure html output
		content = content.replaceAll("(?s)output\\.none", "output.html");

		// set document path to packaged template
		content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
				"<documentpath>/samples/reports/northwind/scriptedReport-scorecard-template.html</documentpath>");

		FileUtils.writeStringToFile(new File(scorecardReportingFilePath), content, "UTF-8");

		// copy scripted trend HTML template into package samples/reports/other
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath()
				+ "/bkend/reporting/src/test/resources/templates/northwind/scriptedReport_scorecard_template.html"),
				new File(packageDirPath + "/" + topFolderName
						+ "/samples/reports/northwind/scriptedReport-scorecard-template.html"));

		// copy + adapt supplier scorecard script for SQLite (minimal, reliable)
		String srcSupplierScript = Utils.getTopProjectFolderPath()
				+ "/bkend/reporting/src/test/groovy/reporting/scriptedReport_supplierScorecardReport.groovy";
		File destSupplierScript = new File(scorecardSampleDir + "/g-scr2htm-supc-script.groovy");

		content = FileUtils.readFileToString(new File(srcSupplierScript), "UTF-8");

		// 1) Replace exact H2 DATEDIFF(...) pattern with SQLite julianday diff (safe fallback for ms/sec/ISO)
		// Do this first so inserted helper won't be touched by later replacements
		content = content.replaceAll(
				"(?is)DATEDIFF\\s*\\(\\s*'DAY'\\s*,\\s*CAST\\s*\\(\\s*:\\s*orderDate\\s+AS\\s+TIMESTAMP\\s*\\)\\s*,\\s*CAST\\s*\\(\\s*:\\s*shippedDate\\s+AS\\s+TIMESTAMP\\s*\\)\\s*\\)",
				"CAST((" + "COALESCE(julianday(replace(:shippedDate,'T',' ')), julianday(:shippedDate/1000, 'unixepoch'), julianday(:shippedDate, 'unixepoch'))"
						+ " - "
						+ "COALESCE(julianday(replace(:orderDate,'T',' ')),   julianday(:orderDate/1000, 'unixepoch'),   julianday(:orderDate, 'unixepoch'))"
						+ ") AS INTEGER)");

		// 2) Convert .toLocalDateTime() usages to use the helper: order.ShippedDate.toLocalDateTime() -> toLocalDateTime(order.ShippedDate)
		// Run this BEFORE inserting the helper so the helper source is not rewritten accidentally
		content = content.replaceAll("(?m)([a-zA-Z_][\\w\\.\\[\\]\\\"']*)\\.toLocalDateTime\\s*\\(\\s*\\)",
				"toLocalDateTime($1)");

		// 3) Insert small toLocalDateTime helper if not present (insert after rewrites)
		if (!content.contains("def toLocalDateTime = {")) {
			String helper = "" + "def toLocalDateTime = { obj ->\n" + "    if (obj == null) return null\n"
					+ "    if (obj instanceof java.time.LocalDateTime) return obj\n"
					+ "    if (obj instanceof java.sql.Timestamp) return obj.toLocalDateTime()\n"
					+ "    if (obj instanceof java.util.Date) return java.time.Instant.ofEpochMilli(obj.time).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()\n"
					+ "    if (obj instanceof Number) { long v = obj.longValue(); if (v > 9_999_999_999L) return java.time.Instant.ofEpochMilli(v).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime(); else return java.time.Instant.ofEpochSecond(v).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime(); }\n"
					+ "    if (obj instanceof String) {\n" + "        String s = obj.trim()\n"
					+ "        try { return java.time.LocalDateTime.parse(s, java.time.format.DateTimeFormatter.ISO_DATE_TIME) } catch(Exception e) {}\n"
					+ "        try { def fmt = java.time.format.DateTimeFormatter.ofPattern(\"yyyy-MM-dd HH:mm:ss\"); return java.time.LocalDateTime.parse(s.replace('T',' '), fmt) } catch(Exception e) {}\n"
					+ "        try { return java.time.LocalDate.parse(s).atStartOfDay() } catch(Exception e) {}\n"
					+ "        return null\n" + "    }\n" + "    return null\n" + "}\n\n";
			content = content.replaceFirst("(?m)log\\.info\\(",
					java.util.regex.Matcher.quoteReplacement(helper) + "log.info(");
		}

		// write adapted script
		FileUtils.writeStringToFile(destSupplierScript, content, "UTF-8");

		// SAMPLES END

		// FREND SAMPLES START
		// par-employee-hire-dates

		String parEmployeeHireDatesDir = packageDirPath + "/" + topFolderName + "/config/samples/_frend/par-employee-hire-dates";
		String parEmployeeHireDatesSettingsFilePath = parEmployeeHireDatesDir + "/settings.xml";
		String parEmployeeHireDatesReportingFilePath = parEmployeeHireDatesDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(parEmployeeHireDatesSettingsFilePath));
		content = FileUtils.readFileToString(new File(parEmployeeHireDatesSettingsFilePath), "UTF-8");

		// friendly template name
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>EmployeeHireDates</template>");

		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		FileUtils.writeStringToFile(new File(parEmployeeHireDatesSettingsFilePath), content, "UTF-8");
		
				// prepare reporting.xml (defaults -> override to use script datasource + HTML
		// output + template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(parEmployeeHireDatesReportingFilePath));

		content = FileUtils.readFileToString(new File(parEmployeeHireDatesReportingFilePath), "UTF-8");


		// datasource -> ds.scriptfile
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.scriptfile</type>");

		// set connection to sample northwind sqlite DB
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		// set script name used by the ScriptedReporter
		content = content.replaceAll("(?s)<scriptname\\s*/>|<scriptname>\\s*</scriptname>",
				"<scriptname>par-employee-hire-dates-script.groovy</scriptname>");

		content = content.replaceAll("(?s)<scriptnameparamsspec\\s*/>|<scriptnameparamsspec>\\s*</scriptnameparamsspec>",
				"<scriptnameparamsspec>par-employee-hire-dates-report-parameters-spec.groovy</scriptnameparamsspec>");

		FileUtils.writeStringToFile(new File(parEmployeeHireDatesReportingFilePath), content, "UTF-8");

		// piv-sales-region-prod-qtr
		String pivSalesRegionProdSampleDir = packageDirPath + "/" + topFolderName + "/config/samples/_frend/piv-sales-region-prod-qtr";
		String pivSalesRegionProdSettingsFilePath = pivSalesRegionProdSampleDir + "/settings.xml";
		String pivSalesRegionProdReportingFilePath = pivSalesRegionProdSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(pivSalesRegionProdSettingsFilePath));
		content = FileUtils.readFileToString(new File(pivSalesRegionProdSettingsFilePath), "UTF-8");

		// friendly template name
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>SalesRegionProdQtr</template>");

		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		FileUtils.writeStringToFile(new File(pivSalesRegionProdSettingsFilePath), content, "UTF-8");
		
		// prepare reporting.xml (defaults -> override to use script datasource + HTML
		// output + template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(pivSalesRegionProdReportingFilePath));

		content = FileUtils.readFileToString(new File(pivSalesRegionProdReportingFilePath), "UTF-8");	

		// datasource -> ds.scriptfile
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.scriptfile</type>");

		// set connection to sample northwind sqlite DB
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		// set script name used by the ScriptedReporter
		content = content.replaceAll("(?s)<scriptname\\s*/>|<scriptname>\\s*</scriptname>",
				"<scriptname>piv-sales-region-prod-qtr-script.groovy</scriptname>");

		FileUtils.writeStringToFile(new File(pivSalesRegionProdReportingFilePath), content, "UTF-8");
		
		//rep-employee-payslip
		
		String repEmployeePayslipSampleDir = packageDirPath + "/" + topFolderName + "/config/samples/_frend/rep-employee-payslip";
		String repEmployeePayslipSettingsFilePath = repEmployeePayslipSampleDir + "/settings.xml";
		String repEmployeePayslipReportingFilePath = repEmployeePayslipSampleDir + "/reporting.xml";

		// copy base settings and tweak for this sample
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(repEmployeePayslipSettingsFilePath));
		content = FileUtils.readFileToString(new File(repEmployeePayslipSettingsFilePath), "UTF-8");

		// friendly template name
		content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
				"<template>EmployeePayslip</template>");

		content = content.replaceAll(
				"(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replaceAll(
				"(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");

		FileUtils.writeStringToFile(new File(repEmployeePayslipSettingsFilePath), content, "UTF-8");
		
		// prepare reporting.xml (defaults -> override to use script datasource + HTML
		// output + template)
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(repEmployeePayslipReportingFilePath));

		content = FileUtils.readFileToString(new File(repEmployeePayslipReportingFilePath), "UTF-8");	

		// datasource -> ds.scriptfile
		content = content.replaceAll("(?si)<type\\s*>\\s*ds\\.csvfile\\s*</type>", "<type>ds.scriptfile</type>");

		// set connection to sample northwind sqlite DB
		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>",
				"<conncode>rbt-sample-northwind-sqlite-4f2</conncode>");

		// set script name used by the ScriptedReporter
		content = content.replaceAll("(?s)<scriptname\\s*/>|<scriptname>\\s*</scriptname>",
				"<scriptname>rep-employee-payslip-script.groovy</scriptname>");

		content = content.replace("output.none", "output.html");

		content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
				"<documentpath>rep-employee-payslip-template.html</documentpath>");
				
		FileUtils.writeStringToFile(new File(repEmployeePayslipReportingFilePath), content, "UTF-8");
		
		
		// FREND SAMPLES END

		// WebPortal samples - copy paystub templates to plugin views folder
		String webportalSamplesPath = Utils.getTopProjectFolderPath()
				+ "/bkend/reporting/src/main/external-resources/template/samples/webportal";
		String pluginViewsPath = packageDirPath + "/" + topFolderName
				+ "/_apps/cms-webportal-playground/wp-plugins/reportburster-portal/resources/views";

		// Copy and rename page template (page-my-documents-paystubs.php -> page-my-documents.php)
		FileUtils.copyFile(new File(webportalSamplesPath + "/page-my-documents-paystubs.php"),
				new File(pluginViewsPath + "/page-my-documents.php"));

		// Copy and rename single template (single-paystub.php stays the same name)
		FileUtils.copyFile(new File(webportalSamplesPath + "/single-paystub.php"),
				new File(pluginViewsPath + "/single-paystub.php"));

		// Copy content type image
		FileUtils.copyFile(new File(webportalSamplesPath + "/content-type-paystub.png"),
				new File(pluginViewsPath + "/content-type-paystub.png"));

		// license.xml
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_internal/license.xml"),
				new File(packageDirPath + "/" + topFolderName + "/config/_defaults/license.xml"));

		System.out.println(
				"------------------------------------- DONE_09:NoExeAssembler _copyDefaultConfigurationAndLicenseFiles ... -------------------------------------");

		Utils.removeVersionFromAntLauncherFileName(packageDirPath + "/" + topFolderName + "/lib/burst");
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/xtra-tools/other/distributed_by-dbc.groovy"),
				new File(packageDirPath + "/" + topFolderName + "/scripts/burst/internal/distributed_by.groovy"));

		System.out.println(
				"------------------------------------- DONE_10:NoExeAssembler _copyDistributedByGroovyFile ... -------------------------------------");

		_generateSampleNorthwindDatabase();

		System.out.println(
				"------------------------------------- DONE_11:NoExeAssembler _generateSampleNorthwindDatabase() ... -------------------------------------");

	}

	private void _generateSampleNorthwindDatabase() throws Exception {

		try (NorthwindManager northwindManager = new NorthwindManager()) {
			System.out.println("Generating sample Northwind database for SQLite...");
			northwindManager.startDatabase(NorthwindManager.DatabaseVendor.SQLITE,
					packageDirPath + "/" + topFolderName + "/db/sample-northwind-sqlite");
			System.out.println("Successfully generated sample Northwind database for SQLite.");

			System.out.println("Generating sample Northwind database for DuckDB...");
			northwindManager.startDatabase(NorthwindManager.DatabaseVendor.DUCKDB,
					packageDirPath + "/" + topFolderName + "/db/sample-northwind-duckdb");
			System.out.println("Successfully generated sample Northwind database for DuckDB.");
		}
	}

	@Override
	public void verify() throws Exception {

		FileUtils.copyDirectory(new File(packageDirPath), new File(verifyDirPath));

		// verify db general template files and folders
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + topFolderName),
				new File("src/main/external-resources/db-template"), createDotAppslSelectiveFilter())).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_01:NoExeAssembler db general template files and folders ... -------------------------------------");

		// verify burst module template files and folders
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + topFolderName), new File(
				Utils.getTopProjectFolderPath() + "/bkend/reporting/" + "src/main/external-resources/template")))
				.isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_02:NoExeAssembler burst module template files and folders ... -------------------------------------");

		// verify burst dependencies files are there
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + topFolderName + "/lib/burst"),
				new File(Utils.getTopProjectFolderPath() + "/bkend/reporting/target/dependencies"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_03:NoExeAssembler burst dependencies files are there ... -------------------------------------");

		// verify rb-reporting.jar files are there
		assertThat(
				FileUtils.contentEquals(new File(verifyDirPath + "/" + topFolderName + "/lib/burst/rb-reporting.jar"),
						new File(Utils.getTopProjectFolderPath() + "/bkend/reporting/target/rb-reporting.jar")))
				.isTrue();

		// verify rb-server.jar file is there
		assertThat(
				FileUtils.contentEquals(new File(verifyDirPath + "/" + topFolderName + "/lib/server/rbsj-server.jar"),
						new File(Utils.getTopProjectFolderPath() + "/bkend/server/target/rbsj-server.jar")))
				.isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_04:NoExeAssembler rb-reporting.jar, rbsj-server files are there ... -------------------------------------");

		// verify _copyDefaultConfigurationAndLicenseFiles();

		assertThat(FileUtils.contentEquals(new File(verifyDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(verifyDirPath + "/" + topFolderName + "/config/_defaults/settings.xml"))).isTrue();

		assertThat(
				FileUtils.contentEquals(new File(verifyDirPath + "/" + topFolderName + "/config/_internal/license.xml"),
						new File(verifyDirPath + "/" + topFolderName + "/config/_defaults/license.xml")))
				.isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_05:NoExeAssembler _copyDefaultConfigurationAndLicenseFiles() ... -------------------------------------");

		// verify doUtils.removeVersionFromAntLauncherFileName(packageDirPath + "/" +
		// topFolderName + "/lib/burst");

		assertThat(new File(verifyDirPath + "/" + topFolderName + "/lib/burst/ant-launcher.jar").exists()).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_06:NoExeAssembler doUtils.removeVersionFromAntLauncherFileName... -------------------------------------");

		// verify _copyDistributedByGroovyFile();

		assertThat(new File(verifyDirPath + "/" + topFolderName + "/scripts/burst/internal/distributed_by.groovy")
				.exists()).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_07:NoExeAssembler _copyDistributedByGroovyFile... -------------------------------------");

		System.out.println(
				"------------------------------------- VERIFIED_DONE:NoExeAssembler ... -------------------------------------");

	}

	private FileFilter createDotAppslSelectiveFilter() {
		return file -> {
			// Normalize path for consistent comparisons
			String path = file.getPath().replace('\\', '/');
			String fileName = file.getName();

			// ===========================================
			// GLOBAL EXCLUSIONS: Always exclude build artifacts and caches
			// regardless of which project they're in
			// ===========================================
			
			// Exclude northwind.db and northwind.duckdb - they will be generated by the packager itself
			if (fileName.equals("northwind.db") && path.contains("/sample-northwind-sqlite/")) {
				return false;
			}
			if (fileName.equals("northwind.duckdb") && path.contains("/sample-northwind-duckdb/")) {
				return false;
			}
			
			// Gradle build artifacts (Grails projects)
			if (fileName.equals(".gradle") || path.contains("/.gradle/")) {
				return false;
			}
			if (fileName.equals("build") && file.isDirectory() && 
				(path.contains("grails-playground") || path.contains("-playground/build"))) {
				return false;
			}
			if (path.contains("grails-playground/admin/build/") || 
				path.contains("grails-playground/webportal/build/")) {
				return false;
			}
			
			// Maven build artifacts (Spring Boot projects)
			// if (fileName.equals(".mvn") || path.contains("/.mvn/")) {
			// 	return false;
			// }
			
			if (fileName.equals("target") && file.isDirectory() && path.contains("-boot-")) {
				return false;
			}
			if (path.contains("-boot-groovy-playground/target/")) {
				return false;
			}

			// ===========================================
			// GLOBAL NODE.JS/NEXT.JS EXCLUSIONS for ALL _apps
			// These build artifacts and dependencies should NEVER be packaged
			// node_modules can be 500MB+, .next can be 60MB+
			// ===========================================
			if (path.contains("/_apps/")) {
				// Exclude node_modules (dependencies - user runs npm install)
				if (file.getName().equals("node_modules") || path.contains("/node_modules/")) {
					return false;
				}
				// Exclude .next (Next.js build cache - regenerated on build)
				if (file.getName().equals(".next") || path.contains("/.next/")) {
					return false;
				}
				// Exclude .git (version control)
				if (file.getName().equals(".git") || path.contains("/.git/")) {
					return false;
				}
				// Exclude IDE/editor folders
				if (file.getName().equals(".vscode") || path.contains("/.vscode/")) {
					return false;
				}
				if (file.getName().equals(".idea") || path.contains("/.idea/")) {
					return false;
				}
			}

			// ===========================================
			// CMS-WEBPORTAL-PLAYGROUND: Additional exclusions
			// ===========================================
			if (path.contains("/cms-webportal-playground/")) {
				// Exclude PHP vendor folder and public build artifacts
				return !path.contains("/vendor/") && !path.contains("/public/build/")
						&& !path.contains("/.cache/")
						&& !file.getName().equals("vendor");
			}

			return true;
		};
	}

}
