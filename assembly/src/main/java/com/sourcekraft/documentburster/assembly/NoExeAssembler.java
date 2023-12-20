package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import java.util.Collection;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;

public class NoExeAssembler extends AbstractAssembler {

	public NoExeAssembler() {

		super("target/package/db-noexe", "target/package/verified-db-noexe", StringUtils.EMPTY);

	}

	protected void compile() throws Exception {

		// this will execute mvn clean install and generate the jar files for all sub
		// projects
		// assembly is not required to be compiled and should be excluded otherwise 
		//'mvn -pl -assembly clean install' command will be executed recursively in an INFINITE loop
		Utils.runMaven(Utils.getTopProjectFolderPath(), "mvn -pl -assembly clean install");

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
		Utils.runMaven(Utils.getTopProjectFolderPath(),
				"mvn -pl \":reporting,:update\" dependency:copy-dependencies");

		System.out.println(
				"------------------------------------- DONE_02:NoExeAssembler Utils.runMaven(Utils.getTopProjectFolderPath(), mvn -pl ':reporting,:update' dependency:copy-dependencies) ... -------------------------------------");

		// copy db template files and folders
		FileUtils.copyDirectory(new File("src/main/external-resources/db-template"),
				new File(packageDirPath + "/" + topFolderName));

		FileUtils.forceDelete(new File(packageDirPath + "/" + topFolderName + "/DocumentBurster-GUI.sh"));
		FileUtils.forceDelete(new File(packageDirPath + "/" + topFolderName + "/documentburster.sh"));

		System.out.println(
				"------------------------------------- DONE_03:NoExeAssembler copy db template files and folders ... -------------------------------------");

		// START MODULE_REPORTING work

		// copy MODULE_REPORTING's template files and folders
		FileUtils.copyDirectory(
				new File(Utils.getTopProjectFolderPath() + "/backend/reporting/" + "src/main/external-resources/template"),
				new File(packageDirPath + "/" + topFolderName));

		System.out.println(
				"------------------------------------- DONE_04:NoExeAssembler copy MODULE_REPORTING's template files and folders ... -------------------------------------");

		// copy MODULE_REPORTING's dependencies jar files
		FileUtils.copyDirectory(new File(Utils.getTopProjectFolderPath() + "/backend/reporting/target/dependencies"),
				new File(packageDirPath + "/" + topFolderName + "/lib/burst"));

		System.out.println(
				"------------------------------------- DONE_05:NoExeAssembler copy MODULE_REPORTING's dependencies jar files ... -------------------------------------");

		// copy reporting.jar
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/backend/reporting/target/reporting.jar"),
				new File(packageDirPath + "/" + topFolderName + "/lib/burst/reporting.jar"));

		System.out.println(
				"------------------------------------- DONE_06:NoExeAssembler copy reporting.jar file ... -------------------------------------");

		// END MODULE_REPORTING work

		// documenation files
		_gatherAndCopyDocumentationFiles();

		System.out.println(
				"------------------------------------- DONE_07:NoExeAssembler with quickstart and advanced documentation files ... -------------------------------------");

	}

	private void _gatherAndCopyDocumentationFiles() throws Exception {

		// copy quickstart html files
		String quickStartDocumentationFolderPath = Utils.getTopProjectFolderPath()
				+ "/documentation/target/generated-docs/" + Utils.getProductVersion() + "/quickstart";
		FileUtils.copyDirectory(new File(quickStartDocumentationFolderPath + "/images"),
				new File(packageDirPath + "/" + topFolderName + "/docs/html_quickstart/images"));

		FileUtils.copyFile(new File(quickStartDocumentationFolderPath + "/quickstart.html"),
				new File(packageDirPath + "/" + topFolderName + "/docs/html_quickstart/quickstart.html"));

		// copy quickstart.pdf
		FileUtils.copyFile(new File(quickStartDocumentationFolderPath + "/quickstart.pdf"),
				new File(packageDirPath + "/" + topFolderName + "/docs/report-bursting-quickstart.pdf"));

		// copy advanced html files
		String advancedDocumentationFolderPath = Utils.getTopProjectFolderPath()
				+ "/documentation/target/generated-docs/" + Utils.getProductVersion() + "/advanced";
		FileUtils.copyDirectory(new File(advancedDocumentationFolderPath + "/images"),
				new File(packageDirPath + "/" + topFolderName + "/docs/html_advanced/images"));

		FileUtils.copyFile(new File(advancedDocumentationFolderPath + "/advanced.html"),
				new File(packageDirPath + "/" + topFolderName + "/docs/html_advanced/advanced.html"));

		// copy advanced.pdf
		FileUtils.copyFile(new File(advancedDocumentationFolderPath + "/advanced.pdf"),
				new File(packageDirPath + "/" + topFolderName + "/docs/advanced-report-delivery.pdf"));

	}

	private void _addTrackingCodeToDocumentationFiles() throws Exception {

		// add zopim chat code to quickstart.html
		String content = FileUtils.readFileToString(
				new File(packageDirPath + "/" + topFolderName + "/docs/html_quickstart/quickstart.html"), "UTF-8");
		content = content.replace("</body>", "<script type=\"text/javascript\">\r\n"
				+ "window.$zopim||(function(d,s){var z=$zopim=function(c){z._.push(c)},$=z.s= d.createElement(s),e=d.getElementsByTagName(s)[0];z.set=function(o){z.set. _.push(o)};z._=[];z.set._=[];$.async=!0;$.setAttribute('charset','utf-8'); $.src='//cdn.zopim.com/?h7mkkauOUJAVdDuy4BEr4FLv2scL9q1J';z.t=+new Date;$. type='text/javascript';e.parentNode.insertBefore($,e)})(document,'script');\r\n"
				+ "</script>\r\n" + "</body>");
		File newFile = new File(packageDirPath + "/" + topFolderName + "/docs/html_quickstart/quickstart.html");
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// add google tag manager code to quickstart.html
		content = FileUtils.readFileToString(
				new File(packageDirPath + "/" + topFolderName + "/docs/html_quickstart/quickstart.html"), "UTF-8");
		content = content.replace("<div id=\"header\">",
				"<noscript><iframe src=\"//www.googletagmanager.com/ns.html?id=GTM-K63768\" height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe></noscript> <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\r\n"
						+ "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\r\n"
						+ "})(window,document,'script','dataLayer','GTM-K63768');</script><div id=\"header\">");
		newFile = new File(packageDirPath + "/" + topFolderName + "/docs/html_quickstart/quickstart.html");
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// add zopim chat code to advanced.html
		content = FileUtils.readFileToString(
				new File(packageDirPath + "/" + topFolderName + "/docs/html_advanced/advanced.html"), "UTF-8");
		content = content.replace("</body>", "<script type=\"text/javascript\">\r\n"
				+ "window.$zopim||(function(d,s){var z=$zopim=function(c){z._.push(c)},$=z.s= d.createElement(s),e=d.getElementsByTagName(s)[0];z.set=function(o){z.set. _.push(o)};z._=[];z.set._=[];$.async=!0;$.setAttribute('charset','utf-8'); $.src='//cdn.zopim.com/?h7mkkauOUJAVdDuy4BEr4FLv2scL9q1J';z.t=+new Date;$. type='text/javascript';e.parentNode.insertBefore($,e)})(document,'script');\r\n"
				+ "</script>\r\n" + "</body>");
		newFile = new File(packageDirPath + "/" + topFolderName + "/docs/html_advanced/advanced.html");
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		// add google tag manager code to quickstart.html
		content = FileUtils.readFileToString(
				new File(packageDirPath + "/" + topFolderName + "/docs/html_advanced/advanced.html"), "UTF-8");
		content = content.replace("<div id=\"header\">",
				"<noscript><iframe src=\"//www.googletagmanager.com/ns.html?id=GTM-K63768\" height=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe></noscript> <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\r\n"
						+ "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\r\n"
						+ "})(window,document,'script','dataLayer','GTM-K63768');</script><div id=\"header\">");
		newFile = new File(packageDirPath + "/" + topFolderName + "/docs/html_advanced/advanced.html");
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

	}

	private void _performAdditionalRefinementsAndCopyAdditionalFiles() throws Exception {

		_addTrackingCodeToDocumentationFiles();

		System.out.println(
				"------------------------------------- DONE_08:NoExeAssembler __addTrackingCodeToDocumentationFiles ... -------------------------------------");

		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(packageDirPath + "/" + topFolderName + "/config/_defaults/settings.xml"));

		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_internal/license.xml"),
				new File(packageDirPath + "/" + topFolderName + "/config/_defaults/license.xml"));

		System.out.println(
				"------------------------------------- DONE_09:NoExeAssembler _copyDefaultConfigurationAndLicenseFiles ... -------------------------------------");

		FileUtils.moveFile(new File(packageDirPath + "/" + topFolderName + "/docs/report-bursting-quickstart.pdf"),
				new File(packageDirPath + "/" + topFolderName + "/docs/readme-Getting-Started-in-5-Minutes.pdf"));

		FileUtils.copyFileToDirectory(
				new File(packageDirPath + "/" + topFolderName + "/docs/readme-Getting-Started-in-5-Minutes.pdf"),
				new File(packageDirPath + "/" + topFolderName));

		System.out.println(
				"------------------------------------- DONE_10:NoExeAssembler _renameAndCopyPDFDocumentationFilesToHaveMoreDescriptiveNames ... -------------------------------------");

		Utils.removeVersionFromAntLauncherFileName(packageDirPath + "/" + topFolderName + "/lib/burst");
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/xtra-tools/other/distributed_by-dbc.groovy"),
				new File(packageDirPath + "/" + topFolderName + "/scripts/burst/internal/distributed_by.groovy"));

		System.out.println(
				"------------------------------------- DONE_11:NoExeAssembler _copyDistributedByGroovyFile ... -------------------------------------");

	}

	@Override
	public void verify() throws Exception {

		FileUtils.copyDirectory(new File(packageDirPath), new File(verifyDirPath));

		// verify db general template files and folders
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + topFolderName),
				new File("src/main/external-resources/db-template"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_01:NoExeAssembler db general template files and folders ... -------------------------------------");

		// verify burst module template files and folders
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + topFolderName),
				new File(Utils.getTopProjectFolderPath() + "/backend/reporting/" + "src/main/external-resources/template")))
						.isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_02:NoExeAssembler burst module template files and folders ... -------------------------------------");

		// verify burst dependencies files are there
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + topFolderName + "/lib/burst"),
				new File(Utils.getTopProjectFolderPath() + "/backend/reporting/target/dependencies"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_03:NoExeAssembler burst dependencies files are there ... -------------------------------------");

		// verify reporting.jar files are there
		assertThat(FileUtils.contentEquals(new File(verifyDirPath + "/" + topFolderName + "/lib/burst/reporting.jar"),
				new File(Utils.getTopProjectFolderPath() + "/backend/reporting/target/reporting.jar"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_04:NoExeAssembler reporting.jar files are there ... -------------------------------------");

		// verify quickstart images, html and PDF files
		String quickStartDocumentationFolderPath = Utils.getTopProjectFolderPath()
				+ "/documentation/target/generated-docs/" + Utils.getProductVersion() + "/quickstart";

		assertThat(Utils.dir1ContainsAllDir2Files(
				new File(verifyDirPath + "/" + topFolderName + "/docs/html_quickstart/images"),
				new File(quickStartDocumentationFolderPath + "/images"))).isTrue();

		String advancedDocumentationFolderPath = Utils.getTopProjectFolderPath()
				+ "/documentation/target/generated-docs/" + Utils.getProductVersion() + "/advanced";

		assertThat(Utils.dir1ContainsAllDir2Files(
				new File(verifyDirPath + "/" + topFolderName + "/docs/html_advanced/images"),
				new File(advancedDocumentationFolderPath + "/images"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_05:NoExeAssembler quickstart / advanced images, html and PDF files ... -------------------------------------");

		// copy quickstart.pdf
		assertThat(FileUtils.contentEquals(
				new File(verifyDirPath + "/" + topFolderName + "/docs/readme-Getting-Started-in-5-Minutes.pdf"),
				new File(quickStartDocumentationFolderPath + "/quickstart.pdf"))).isTrue();

		assertThat(FileUtils.contentEquals(
				new File(verifyDirPath + "/" + topFolderName + "/docs/advanced-report-delivery.pdf"),
				new File(advancedDocumentationFolderPath + "/advanced.pdf"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_06:NoExeAssembler quickstart.pdf and advanced.pdf ... -------------------------------------");

		// verify _addTrackingZopimCodeToHTMLDocumentation();
		Collection<File> htmlFilesInDocs = FileUtils.listFiles(new File(verifyDirPath + "/" + topFolderName + "/docs"),
				new String[] { "html" }, true);

		for (File htmlFile : htmlFilesInDocs) {
			String content = FileUtils.readFileToString(htmlFile, "UTF-8");

			assertThat(content.contains("zopim")).isTrue();

			assertThat(content.contains("googletagmanager")).isTrue();

		}

		System.out.println(
				"------------------------------------- VERIFIED_07:NoExeAssembler _addTrackingZopimCodeToHTMLDocumentation() ... -------------------------------------");

		// verify _copyDefaultConfigurationAndLicenseFiles();

		assertThat(FileUtils.contentEquals(new File(verifyDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(verifyDirPath + "/" + topFolderName + "/config/_defaults/settings.xml"))).isTrue();

		assertThat(FileUtils.contentEquals(
				new File(verifyDirPath + "/" + topFolderName + "/config/_internal/license.xml"),
				new File(verifyDirPath + "/" + topFolderName + "/config/_defaults/license.xml"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_08:NoExeAssembler _copyDefaultConfigurationAndLicenseFiles() ... -------------------------------------");

		// verify _renameAndCopyPDFDocumentationFilesToHaveMoreDescriptiveNames();
		assertThat(new File(verifyDirPath + "/" + topFolderName + "/docs/readme-Getting-Started-in-5-Minutes.pdf")
				.exists()).isTrue();

		assertThat(new File(verifyDirPath + "/" + topFolderName + "/readme-Getting-Started-in-5-Minutes.pdf").exists())
				.isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_09:NoExeAssembler _renameAndCopyPDFDocumentationFilesToHaveMoreDescriptiveNames()... -------------------------------------");

		// verify doUtils.removeVersionFromAntLauncherFileName(packageDirPath + "/" +
		// topFolderName + "/lib/burst");

		assertThat(new File(verifyDirPath + "/" + topFolderName + "/lib/burst/ant-launcher.jar").exists()).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_10:NoExeAssembler doUtils.removeVersionFromAntLauncherFileName... -------------------------------------");

		// verify _copyDistributedByGroovyFile();

		assertThat(new File(verifyDirPath + "/" + topFolderName + "/scripts/burst/internal/distributed_by.groovy")
				.exists()).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_11:NoExeAssembler _copyDistributedByGroovyFile... -------------------------------------");

		System.out.println(
				"------------------------------------- VERIFIED_DONE:NoExeAssembler ... -------------------------------------");

	}

}
