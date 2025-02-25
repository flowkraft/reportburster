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

		// First install the actual parent POM from its correct location
		String mavenParentPomXmlPath = Utils.getTopProjectFolderPath() + "/xtra-tools/build/common-scripts/maven";
		System.out.println("Maven parent POM path: " + mavenParentPomXmlPath);

		// First install the actual parent POM from its correct location
		Utils.runMaven(mavenParentPomXmlPath, "mvn install");

		System.out.println(
				"------------------------------------- DONE_00:NoExeAssembler Utils.runMaven('../xtra-tools/build/common-scripts/maven', mvn install) ... -------------------------------------");

		// this will execute mvn clean install and generate the jar files for all sub
		// projects
		// assembly is not required to be compiled and should be excluded otherwise
		// 'mvn -pl -assembly clean install' command will be executed recursively in an
		// INFINITE loop
		Utils.runMaven(Utils.getTopProjectFolderPath(), "mvn -pl -asbl clean install");

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
				new File(packageDirPath + "/" + topFolderName));

		System.out.println(
				"------------------------------------- DONE_03:NoExeAssembler copy db template files and folders ... -------------------------------------");

		// START MODULE_REPORTING work

		// copy MODULE_REPORTING's template files and folders
		FileUtils.copyDirectory(new File(
				Utils.getTopProjectFolderPath() + "/backend/reporting/" + "src/main/external-resources/template"),
				new File(packageDirPath + "/" + topFolderName));

		System.out.println(
				"------------------------------------- DONE_04:NoExeAssembler copy MODULE_REPORTING's template files and folders ... -------------------------------------");

		// copy MODULE_REPORTING's dependencies jar files
		FileUtils.copyDirectory(new File(Utils.getTopProjectFolderPath() + "/backend/reporting/target/dependencies"),
				new File(packageDirPath + "/" + topFolderName + "/lib/burst"));

		System.out.println(
				"------------------------------------- DONE_05:NoExeAssembler copy MODULE_REPORTING's dependencies jar files ... -------------------------------------");

		// copy rb-reporting.jar
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/backend/reporting/target/rb-reporting.jar"),
				new File(packageDirPath + "/" + topFolderName + "/lib/burst/rb-reporting.jar"));

		// copy "FAT UBER" rb-server.jar
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/backend/server/target/rb-server.jar"),
				new File(packageDirPath + "/" + topFolderName + "/lib/server/rb-server.jar"));

		System.out.println(
				"------------------------------------- DONE_06:NoExeAssembler copy rb-reporting.jar, rb-rserver.jar files ... -------------------------------------");

		// END MODULE_REPORTING work
		
	}

	private void _performAdditionalRefinementsAndCopyAdditionalFiles() throws Exception {

		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(packageDirPath + "/" + topFolderName + "/config/_defaults/settings.xml"));

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

		/// config/samples/payslips-generate-only/settings.xml
		String payslipsGenerateOnlyXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/payslips-generate-only/settings.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/burst/settings.xml"),
				new File(payslipsGenerateOnlyXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>
		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyXmlConfigFilePath), "UTF-8");

		content = content.replace("<template>My Reports</template>", "<template>Payslips Generate</template>");

		content = content.replace("<reportdistribution>true</reportdistribution>",
				"<reportdistribution>false</reportdistribution>");
		content = content.replace("<reportgenerationmailmerge>false</reportgenerationmailmerge>",
				"<reportgenerationmailmerge>true</reportgenerationmailmerge>");
		newFile = new File(payslipsGenerateOnlyXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		/// config/samples/payslips-generate-only/reporting.xml
		String payslipsGenerateOnlyReportingXmlConfigFilePath = packageDirPath + "/" + topFolderName
				+ "/config/samples/payslips-generate-only/reporting.xml";
		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_defaults/reporting.xml"),
				new File(payslipsGenerateOnlyReportingXmlConfigFilePath));
		// replace <reportdistribution>true</reportdistribution> with
		// <reportdistribution>false</reportdistribution>

		content = FileUtils.readFileToString(new File(payslipsGenerateOnlyReportingXmlConfigFilePath), "UTF-8");
		content = content.replace("output.none", "output.docx");

		content = content.replace("<documentpath/>",
				"<documentpath>/samples/reports/payslips/payslips-template.docx</documentpath>");

		newFile = new File(payslipsGenerateOnlyReportingXmlConfigFilePath);
		FileUtils.writeStringToFile(newFile, content, "UTF-8");

		FileUtils.copyFile(new File(packageDirPath + "/" + topFolderName + "/config/_internal/license.xml"),
				new File(packageDirPath + "/" + topFolderName + "/config/_defaults/license.xml"));

		System.out.println(
				"------------------------------------- DONE_09:NoExeAssembler _copyDefaultConfigurationAndLicenseFiles ... -------------------------------------");

		Utils.removeVersionFromAntLauncherFileName(packageDirPath + "/" + topFolderName + "/lib/burst");
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/xtra-tools/other/distributed_by-dbc.groovy"),
				new File(packageDirPath + "/" + topFolderName + "/scripts/burst/internal/distributed_by.groovy"));

		System.out.println(
				"------------------------------------- DONE_10:NoExeAssembler _copyDistributedByGroovyFile ... -------------------------------------");

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
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + topFolderName), new File(
				Utils.getTopProjectFolderPath() + "/backend/reporting/" + "src/main/external-resources/template")))
				.isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_02:NoExeAssembler burst module template files and folders ... -------------------------------------");

		// verify burst dependencies files are there
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + topFolderName + "/lib/burst"),
				new File(Utils.getTopProjectFolderPath() + "/backend/reporting/target/dependencies"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_03:NoExeAssembler burst dependencies files are there ... -------------------------------------");

		// verify rb-reporting.jar files are there
		assertThat(
				FileUtils.contentEquals(new File(verifyDirPath + "/" + topFolderName + "/lib/burst/rb-reporting.jar"),
						new File(Utils.getTopProjectFolderPath() + "/backend/reporting/target/rb-reporting.jar")))
				.isTrue();

		// verify rb-server.jar file is there
		assertThat(
				FileUtils.contentEquals(new File(verifyDirPath + "/" + topFolderName + "/lib/server/rbsj-server.jar"),
						new File(Utils.getTopProjectFolderPath() + "/backend/server/target/rbsj-server.jar")))
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

}
