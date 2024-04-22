package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import java.util.Collection;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;
import org.zeroturnaround.zip.ZipUtil;

public class DocumentBursterServerSpringBootAssembler extends AbstractAssembler {

	private String groovyCompilationLogs = StringUtils.EMPTY;

	private String documentBursterVerifyDirPath;

	public DocumentBursterServerSpringBootAssembler() {

		super("target/package/db-server", "target/package/verified-db-server", "target/documentburster-server.zip");

	}

	protected void compile() throws Exception {

		String npmRunCustomReleaseCommand = "npm run custom:release-web --force";

		new ProcessExecutor().directory(new File(Utils.getTopProjectFolderPath() + "/frontend/reporting"))
				.command("cmd", "/c", npmRunCustomReleaseCommand).redirectOutput(new LogOutputStream() {
					@Override
					protected void processLine(String line) {
						System.out.println(line);
					}
				}).execute();

		System.out.println(
				"------------------------------------- DONE_01:DocumentBursterServer npm run custom:release-web --force) ... -------------------------------------");

	}

	protected void preparePackage() throws Exception {

		// copy all the already "verified" DocumentBurster files
		FileUtils.copyDirectory(new File(documentBursterVerifyDirPath + "/" + this.topFolderName),
				new File(packageDirPath + "/" + this.topFolderName + "/server"));

		System.out.println(
				"------------------------------------- DONE_02:DocumentBursterServer copy all the already 'verified' DocumentBurster files ... -------------------------------------");

		// copy db-server template files and folders
		FileUtils.copyDirectory(new File("src/main/external-resources/db-server-template"),
				new File(packageDirPath + "/" + this.topFolderName));

		System.out.println(
				"------------------------------------- DONE_03:DocumentBursterServer copy db-server template files and folders ... -------------------------------------");

		// COMPILE / CHECK the groovy scripts don't give errors

		new ProcessExecutor().command("cmd", "/c", "java -cp " + packageDirPath + "/" + this.topFolderName
				+ "/server/lib/burst/ant-launcher.jar org.apache.tools.ant.launch.Launcher -buildfile build-groovy.xml -DtopFolderName="
				+ this.topFolderName).redirectOutput(new LogOutputStream() {
					@Override
					protected void processLine(String line) {
						System.out.println(line);
						groovyCompilationLogs += line;
					}
				}).execute();

		if (groovyCompilationLogs.toUpperCase().contains("BUILD FAILED"))
			throw new Exception("Groovy Scripts COMPILATION FAILED");

		System.out.println(
				"------------------------------------- DONE_08:DocumentBursterServer COMPILE / CHECK the groovy scripts don't give errors ... -------------------------------------");
		// END COMPILE groovy scripts

	}

	@Override
	public void verify() throws Exception {

		ZipUtil.unpack(new File(targetPathZipFile), new File(verifyDirPath));

		// copy all the already "verified" DocumentBurster files
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + this.topFolderName + "/server"),
				new File(documentBursterVerifyDirPath + "/" + this.topFolderName))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_01:DocumentBursterServer copy all the already 'verified' DocumentBurster files ... -------------------------------------");

		// copy db-server template files and folders
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + this.topFolderName),
				new File("src/main/external-resources/db-server-template"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_02:DocumentBursterServer db-server template files and folders ... -------------------------------------");

		// START MODULE_BATCH work

		// copy all MODULE_BATCH's dependencies to the intermediate folder location

		// COMPILE / CHECK the groovy scripts don't give errors

		Collection<File> groovyScriptFiles = FileUtils.listFiles(
				new File(verifyDirPath + "/" + this.topFolderName + "/server/scripts"), new String[] { "groovy" },
				true);

		assertThat(groovyScriptFiles.size() > 0).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_07:DocumentBursterServer CHECK the groovy scripts ... -------------------------------------");

		// END COMPILE groovy scripts

		// VERIFY ALL CUSTOM FILES

		// service.bat file...
		String content = FileUtils.readFileToString(
				new File(verifyDirPath + "/" + this.topFolderName + "/web-console/console/bin/service.bat"), "UTF-8");

		assertThat(content.contains("ReportBurster Web Console")).isTrue();

		// log4j.xml
		content = FileUtils.readFileToString(new File(verifyDirPath + "/" + this.topFolderName + "/server/log4j2.xml"),
				"UTF-8");

		assertThat(content.contains("batch.log")).isTrue();

	}

	public void setDocumentBursterVerifyDirPath(String documentBursterVerifyDirPath) {
		this.documentBursterVerifyDirPath = documentBursterVerifyDirPath;
	}

}
