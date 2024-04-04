package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import java.util.Collection;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;
import org.zeroturnaround.zip.ZipUtil;

public class DocumentBursterServerSpringBatchAdminAssembler extends AbstractAssembler {

	// DONE2 - TODO make sure log4j.xml with batch support is copied
	// DONE2 - TODO make sure batch-context.xml with burst support is copied
	// DONE2 - TODO make sure /config\burst\internal\log4j-perf4j.xml with batch
	// support is copied
	// DONE2 - TODO make sure server/scripts/batch/pollManager.groovy with burst job
	// support is copied
	// DONE2 - TODO make sure server/scripts/batch/scheduled/cron.groovy with
	// 'nightly' job is copied
	// DONE1 - TODO remove the 2 web-console/*.sh files
	// DONE2 - TODO make sure
	// web-console\console\webapps\burst\WEB-INF\classes\batch-hsql.properties
	// contains batch.remote.base.url=http://localhost:8080/batch-web-admin/batch

	private String groovyCompilationLogs = StringUtils.EMPTY;

	private String documentBursterVerifyDirPath;

	public DocumentBursterServerSpringBatchAdminAssembler() {

		super("target/package/db-server", "target/package/verified-db-server", "target/documentburster-server.zip");

	}

	protected void compile() throws Exception {

		// Generate MODULE_BATCH/target/dependencies
		Utils.runMaven(Utils.getTopProjectFolderPath(), "mvn -pl \":rb-batch\" dependency:copy-dependencies");

		System.out.println(
				"------------------------------------- DONE_01:DocumentBursterServer Utils.runMaven(Utils.getTopProjectFolderPath(), mvn -pl :rb-batch dependency:copy-dependencies) ... -------------------------------------");

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

		FileUtils.forceDelete(new File(packageDirPath + "/" + this.topFolderName + "/server/startServer.sh"));
		FileUtils.forceDelete(new File(packageDirPath + "/" + this.topFolderName + "/server/shutServer.sh"));

		FileUtils.forceDelete(new File(packageDirPath + "/" + this.topFolderName + "/web-console/startConsole.sh"));
		FileUtils.forceDelete(new File(packageDirPath + "/" + this.topFolderName + "/web-console/shutConsole.sh"));

		System.out.println(
				"------------------------------------- DONE_03:DocumentBursterServer copy db-server template files and folders ... -------------------------------------");

		// START MODULE_BATCH work

		// copy all MODULE_BATCH's dependencies to the intermediate folder location

		// copy MODULE_BATCH's template files and folders
		FileUtils.copyDirectory(
				new File(Utils.getTopProjectFolderPath() + "/backend/batch/" + "src/main/external-resources/template"),
				new File(packageDirPath + "/" + this.topFolderName + "/server"));

		// put back the customized files
		FileUtils.copyFile(new File(
				"src/main/external-resources/db-server-template/server/config/batch/internal/batch-context.xml"),
				new File(
						packageDirPath + "/" + this.topFolderName + "/server/config/batch/internal/batch-context.xml"));

		FileUtils.copyFile(
				new File("src/main/external-resources/db-server-template/server/scripts/batch/pollManager.groovy"),
				new File(packageDirPath + "/" + this.topFolderName + "/server/scripts/batch/pollManager.groovy"));

		FileUtils.copyFile(
				new File("src/main/external-resources/db-server-template/server/scripts/batch/scheduled/cron.groovy"),
				new File(packageDirPath + "/" + this.topFolderName + "/server/scripts/batch/scheduled/cron.groovy"));

		System.out.println(
				"------------------------------------- DONE_04:DocumentBursterServer copy MODULE_BATCH's template files and folders ... -------------------------------------");

		// copy MODULE_BATCH's dependencies jar files
		FileUtils.copyDirectory(new File(Utils.getTopProjectFolderPath() + "/backend/batch/target/dependencies"),
				new File(packageDirPath + "/" + this.topFolderName + "/server/lib/batch"));

		System.out.println(
				"------------------------------------- DONE_05:DocumentBursterServer copy MODULE_BATCH's dependencies jar files ... -------------------------------------");

		// copy rb-batch.jar
		FileUtils.copyFile(new File(Utils.getTopProjectFolderPath() + "/backend/batch/target/rb-batch.jar"),
				new File(packageDirPath + "/" + this.topFolderName + "/server/lib/batch/rb-batch.jar"));

		System.out.println(
				"------------------------------------- DONE_06:DocumentBursterServer copy rb-batch.jar ... -------------------------------------");

		Utils.removeVersionFromAntLauncherFileName(packageDirPath + "/" + this.topFolderName + "/server/lib/batch");

		System.out.println(
				"------------------------------------- DONE_07:DocumentBursterServer Utils.removeVersionFromAntLauncherFileName ... -------------------------------------");

		// remove MODULE_BATCH's dependencies jar files which are already present in
		// MODULE_BURST lib dir

		/*
		 * Collection<File> jarFilesInLibBatch = FileUtils.listFiles( new
		 * File("target/package/db-server/DocumentBurster/server/lib/batch"), new
		 * String[] { "jar" }, true);
		 * 
		 * if ((jarFilesInLibBatch != null) && (jarFilesInLibBatch.size() > 0)) { for
		 * (File jarFileInLibBatch : jarFilesInLibBatch) {
		 * 
		 * String jarFileName =
		 * FilenameUtils.getName(jarFileInLibBatch.getAbsolutePath());
		 * 
		 * File jarFilesInLibBurst = new File(
		 * "target/package/db-server/DocumentBurster/server/lib/burst/" + jarFileName);
		 * 
		 * if (jarFilesInLibBurst.exists()) jarFileInLibBatch.delete(); } }
		 */

		// END MODULE_BATCH work

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

		// Unzip Tomcat
		ZipUtil.unpack(new File(Utils.getTopProjectFolderPath() + "/xtra-tools/containers/tomcat/tomcat.zip"),
				new File(packageDirPath + "/" + this.topFolderName + "/web-console/console"));

		System.out.println(
				"------------------------------------- DONE_09:DocumentBursterServer Unzip Tomcat ... -------------------------------------");

		// End Unzip Tomcat

		// START MODULE_BATCH_WEB_ADMIN work
		ZipUtil.unpack(
				new File(Utils.getTopProjectFolderPath() + "/backend/batch-web-admin/target/rb-batch-web-admin.war"),
				new File(packageDirPath + "/" + this.topFolderName + "/web-console/console/webapps/burst"));

		FileUtils.copyFile(
				new File(Utils.getTopProjectFolderPath()
						+ "/backend/batch-web-admin/src/main/resources/batch-hsql.properties"),
				new File(packageDirPath + "/" + this.topFolderName
						+ "/web-console/console/webapps/burst/WEB-INF/classes/batch-hsql.properties"));

		System.out.println(
				"------------------------------------- DONE_10:DocumentBursterServer Unzip rb-batch-web-admin.war ... -------------------------------------");

		// Copy batch web admin license files...
		FileUtils.copyDirectory(
				new File(Utils.getTopProjectFolderPath() + "/backend/batch-web-admin/lib/runtime/license"),
				new File(packageDirPath + "/" + this.topFolderName
						+ "/web-console/console/webapps/burst/WEB-INF/lib/license"));

		System.out.println(
				"------------------------------------- DONE_11:DocumentBursterServer batch web admin license files ... -------------------------------------");

		// Copy customized service.bat file...
		FileUtils.copyFile(
				new File("src/main/external-resources/db-server-template/web-console/console/bin/service.bat"),
				new File(packageDirPath + "/" + this.topFolderName + "/web-console/console/bin/service.bat"));

		System.out.println(
				"------------------------------------- DONE_12:DocumentBursterServer Copy customized service.bat file ... -------------------------------------");

		// END MODULE_BATCH_WEB_ADMIN work

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

		// copy MODULE_BATCH's template files and folders
		assertThat(Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + this.topFolderName + "/server"),
				new File(Utils.getTopProjectFolderPath() + "/backend/batch/" + "src/main/external-resources/template")))
						.isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_03:DocumentBursterServer copy MODULE_BATCH's template files and folders ... -------------------------------------");

		// copy MODULE_BATCH's dependencies jar files
		assertThat(
				Utils.dir1ContainsAllDir2Files(new File(verifyDirPath + "/" + this.topFolderName + "/server/lib/batch"),
						new File(Utils.getTopProjectFolderPath() + "/backend/batch/target/dependencies"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_04:DocumentBursterServer copy MODULE_BATCH's dependencies jar files ... -------------------------------------");

		// copy rb-batch.jar
		assertThat(FileUtils.contentEquals(
				new File(verifyDirPath + "/" + this.topFolderName + "/server/lib/batch/rb-batch.jar"),
				new File(Utils.getTopProjectFolderPath() + "/backend/batch/target/rb-batch.jar"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_05:DocumentBursterServer copy rb-batch.jar ... -------------------------------------");

		assertThat(new File(verifyDirPath + "/" + this.topFolderName + "/server/lib/batch/ant-launcher.jar").exists())
				.isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_06:DocumentBursterServer Utils.removeVersionFromAntLauncherFileName ... -------------------------------------");

		// remove MODULE_BATCH's dependencies jar files which are already present in
		// MODULE_BURST lib dir

		/*
		 * Collection<File> jarFilesInLibBatch = FileUtils.listFiles( new
		 * File("target/package/db-server/DocumentBurster/server/lib/batch"), new
		 * String[] { "jar" }, true);
		 * 
		 * if ((jarFilesInLibBatch != null) && (jarFilesInLibBatch.size() > 0)) { for
		 * (File jarFileInLibBatch : jarFilesInLibBatch) {
		 * 
		 * String jarFileName =
		 * FilenameUtils.getName(jarFileInLibBatch.getAbsolutePath());
		 * 
		 * File jarFilesInLibBurst = new File(
		 * "target/package/db-server/DocumentBurster/server/lib/burst/" + jarFileName);
		 * 
		 * if (jarFilesInLibBurst.exists()) jarFileInLibBatch.delete(); } }
		 */

		// END MODULE_BATCH work

		// COMPILE / CHECK the groovy scripts don't give errors

		Collection<File> groovyScriptFiles = FileUtils.listFiles(
				new File(verifyDirPath + "/" + this.topFolderName + "/server/scripts"), new String[] { "groovy" },
				true);

		assertThat(groovyScriptFiles.size() > 0).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_07:DocumentBursterServer CHECK the groovy scripts ... -------------------------------------");

		// END COMPILE groovy scripts

		Collection<File> jspFiles = FileUtils.listFiles(
				new File(verifyDirPath + "/" + this.topFolderName + "/web-console/console/webapps/burst"),
				new String[] { "jsp" }, true);

		assertThat(jspFiles.size() > 0).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_08:DocumentBursterServer check tomcat and rb-batch-web-admin.war ... -------------------------------------");

		// Copy batch web admin license files...
		assertThat(Utils.dir1ContainsAllDir2Files(
				new File(verifyDirPath + "/" + this.topFolderName
						+ "/web-console/console/webapps/burst/WEB-INF/lib/license"),
				new File(Utils.getTopProjectFolderPath() + "/backend/batch-web-admin/lib/runtime/license"))).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_09:DocumentBursterServer batch web admin license files ... -------------------------------------");

		// VERIFY ALL CUSTOM FILES

		// service.bat file...
		String content = FileUtils.readFileToString(
				new File(verifyDirPath + "/" + this.topFolderName + "/web-console/console/bin/service.bat"), "UTF-8");

		assertThat(content.contains("DocumentBurster Web Console")).isTrue();

		// log4j.xml
		content = FileUtils.readFileToString(new File(verifyDirPath + "/" + this.topFolderName + "/server/log4j2.xml"),
				"UTF-8");

		assertThat(content.contains("batch.log")).isTrue();

		// batch-context.xml
		content = FileUtils.readFileToString(
				new File(verifyDirPath + "/" + this.topFolderName + "/server/config/batch/internal/batch-context.xml"),
				"UTF-8");

		assertThat(content.contains("burstJob")).isTrue();

		// log4j-perf4j.xml
		content = FileUtils.readFileToString(
				new File(verifyDirPath + "/" + this.topFolderName + "/server/config/_internal/log4j-perf4j.xml"),
				"UTF-8");

		assertThat(content.contains("logs/batch.log")).isTrue();

		// pollManager.groovy
		content = FileUtils.readFileToString(
				new File(verifyDirPath + "/" + this.topFolderName + "/server/scripts/batch/pollManager.groovy"),
				"UTF-8");

		assertThat(content.contains("burst")).isTrue();

		// cron.groovy
		content = FileUtils.readFileToString(
				new File(verifyDirPath + "/" + this.topFolderName + "/server/scripts/batch/scheduled/cron.groovy"),
				"UTF-8");

		assertThat(content.contains("nightly")).isTrue();

		// batch-hsql.properties
		content = FileUtils.readFileToString(new File(verifyDirPath + "/" + this.topFolderName
				+ "/web-console/console/webapps/burst/WEB-INF/classes/batch-hsql.properties"), "UTF-8");

		assertThat(content.contains("batch-web-admin")).isTrue();

		System.out.println(
				"-------------------------------------  VERIFIED_10:DocumentBursterServer Copy customized service.bat file ... -------------------------------------");

		// END MODULE_BATCH_WEB_ADMIN work

	}

	public void setDocumentBursterVerifyDirPath(String documentBursterVerifyDirPath) {
		this.documentBursterVerifyDirPath = documentBursterVerifyDirPath;
	}

}
