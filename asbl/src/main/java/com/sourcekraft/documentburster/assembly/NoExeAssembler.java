package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import java.io.FileFilter;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;

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

		// 2. config/samples/split-two-times-split-only
		String splitTwoTimesSplitOnlyXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/split-two-times-split-only/settings.xml";
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

		// 3. config/samples/generate-only-docx/settings.xml
		String payslipsGenerateOnlyDocxXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-docx/settings.xml";
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

		/// config/samples/generate-only-docx/reporting.xml
		String payslipsGenerateOnlyDocxReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-docx/reporting.xml";
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
		/// 4. config/samples/generate-only-html/settings.xml
		String payslipsGenerateOnlyHtmlXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-html/settings.xml";
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

		/// config/samples/generate-only-html/reporting.xml
		String payslipsGenerateOnlyHtmlReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-html/reporting.xml";
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

		/// 5. config/samples/generate-only-pdf/settings.xml
		String payslipsGenerateOnlyPdfXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-pdf/settings.xml";
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

		/// config/samples/generate-only-pdf/reporting.xml
		String payslipsGenerateOnlyPdfReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-pdf/reporting.xml";
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

		/// 6. config/samples/generate-only-excel/settings.xml
		String payslipsGenerateOnlyExcelXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-excel/settings.xml";
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

		/// config/samples/generate-only-excel/reporting.xml
		String payslipsGenerateOnlyExcelReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-excel/reporting.xml";
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

		/// 7. config/samples/generate-only-excel-xlsx-datasource/settings.xml
		String payslipsGenerateOnlyExcelXlsxDatasourceXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-excel-xlsx-datasource/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(payslipsGenerateOnlyExcelXlsxDatasourceXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyExcelXlsxDatasourceXmlConfigFilePath),
				"UTF-8");

		content = content.replace("<template>My Reports</template>",
				"<template>Payslips Xlsx2XlsxReports</template>");

		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replace("<reportgenerationmailmerge>false</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");
		newFile = new File(payslipsGenerateOnlyExcelXlsxDatasourceXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		/// config/samples/generate-only-excel-xlsx-datasource/reporting.xml
		String payslipsGenerateOnlyExcelReportingXlsxDatasourceXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/generate-only-excel-xlsx-datasource/reporting.xml";
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
        // 8. Customer Sales Summary - SQL -> single Excel file
        // =========================
        String customerSalesSampleDir = packageDirPath + "/" + topFolderName + "/config/samples/generate-customer-sales-excel-sql-ds";
        String customerSalesSettingsFilePath = customerSalesSampleDir + "/settings.xml";
        String customerSalesReportingFilePath = customerSalesSampleDir + "/reporting.xml";

        // copy base settings and tweak for this sample
        FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
                new File(customerSalesSettingsFilePath));
        content = FileUtils.readFileToString(new File(customerSalesSettingsFilePath), "UTF-8");

		// set a friendly template name and disable distribution/mailmerge for a single-file Excel sample
        // handle both self-closing and empty/whitespace variants robustly
        content = content.replaceAll("(?s)<template\\s*/>|<template>\\s*My Reports\\s*</template>",
                "<template>Cust Sales Excel</template>");
        content = content.replaceAll("(?s)<reportdistribution\\s*/>|<reportdistribution>\\s*true\\s*</reportdistribution>",
                "<reportdistribution>false</reportdistribution>");
        content = content.replaceAll("(?s)<reportgenerationmailmerge\\s*/>|<reportgenerationmailmerge>\\s*false\\s*</reportgenerationmailmerge>",
                "<reportgenerationmailmerge>true</reportgenerationmailmerge>");
 
		newFile = new File(customerSalesSettingsFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// prepare reporting.xml for this sample (use defaults and switch to xlsx output and our template)
        FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
                new File(customerSalesReportingFilePath));
        
		content = FileUtils.readFileToString(new File(customerSalesReportingFilePath), "UTF-8");
        content = content.replaceAll("(?s)output\\.none", "output.xlsx");
        // handle both self-closing and empty/whitespace variants for <documentpath>
        content = content.replaceAll("(?s)<documentpath\\s*/>|<documentpath>\\s*</documentpath>",
                "<documentpath>/samples/reports/other/customer-sales-template-excel.html</documentpath>");

		content = content.replaceAll("(?s)<conncode\\s*/>|<conncode>\\s*</conncode>", "<conncode>sample-northwind-sqlite</conncode>");

content = content.replaceAll("(?s)<query\\s*/>|<query>\\s*</query>", 
  "<query><![CDATA[\n" +
  "SELECT\n" +
  "  C.\"CustomerID\",\n" +
  "  C.\"CompanyName\",\n" +
  "  COUNT(DISTINCT O.\"OrderID\")                        AS OrdersCount,\n" +
  "  SUM(OD.\"UnitPrice\" * OD.\"Quantity\" * (1 - COALESCE(OD.\"Discount\",0))) AS TotalSales,\n" +
  "  ROUND(\n" +
  "    CASE WHEN COUNT(DISTINCT O.\"OrderID\") = 0 THEN 0\n" +
  "         ELSE SUM(OD.\"UnitPrice\" * OD.\"Quantity\" * (1 - COALESCE(OD.\"Discount\",0))) / COUNT(DISTINCT O.\"OrderID\")\n" +
  "    END, 2)                                         AS AvgOrderValue\n" +
  "FROM \"Customers\" C\n" +
  "JOIN \"Orders\" O            ON C.\"CustomerID\" = O.\"CustomerID\"\n" +
  "JOIN \"Order Details\" OD    ON O.\"OrderID\"    = OD.\"OrderID\"\n" +
  "WHERE O.\"OrderDate\" >= DATE('now','-12 months')\n" +
  "GROUP BY C.\"CustomerID\", C.\"CompanyName\"\n" +
  "ORDER BY TotalSales DESC\n" +
  "LIMIT 20;\n" +
  "]]></query>");

		FileUtils.writeStringToFile(new File(customerSalesReportingFilePath), content, "UTF-8");

        // SAMPLES END
		
		// WebPortal samples
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/samples/webportal/content-type-paystub.png"),
				new File(packageDirPath + "/" + topFolderName + "/_apps/cms-webportal-playground/wp-plugins/reportburster-integration/resources/views/content-type-paystub.png"));

		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/samples/webportal/page-my-documents-paystubs.php"),
				new File(packageDirPath + "/" + topFolderName + "/_apps/cms-webportal-playground/wp-plugins/reportburster-integration/resources/views/page-my-documents.php"));

		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/samples/webportal/single-paystub.php"),
				new File(packageDirPath + "/" + topFolderName + "/_apps/cms-webportal-playground/wp-plugins/reportburster-integration/resources/views/single-paystub"));

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

			// Keep EVERYTHING that is not under cms-webportal-playground
			if (!path.contains("/cms-webportal-playground/")) {
				return true;
			}

			// SPECIAL CASE: Always keep these three critical files
			if (path.endsWith("/cms-webportal-playground/.env")
					|| path.endsWith("/cms-webportal-playground/docker-compose.yml")
					|| path.endsWith("/cms-webportal-playground/Dockerfile.cli")) {
				return true;
			}

			// CRITICAL: Include parent directories needed for structure
			if (path.endsWith("/cms-webportal-playground") || path.endsWith("/cms-webportal-playground/wp-plugins")
					|| path.endsWith("/cms-webportal-playground/wp-plugins/reportburster-integration")) {
				return true;
			}

			// SPECIAL CASE: Include files within reportburster-integration plugin folder
			if (path.contains("/cms-webportal-playground/wp-plugins/reportburster-integration/")) {
				// But still exclude git-ignored paths inside the plugin
				return !path.contains("/.vscode/") && !path.contains("/.cache/") && !path.contains("/node_modules/")
						&& !path.contains("/vendor/") && !path.contains("/.git/") && !path.contains("/.github/")
						&& !file.getName().equals(".git") && !file.getName().equals("node_modules")
						&& !file.getName().equals("vendor");
			}

			// EXCLUDE everything else under cms-webportal-playground
			return false;
		};
	}

}
