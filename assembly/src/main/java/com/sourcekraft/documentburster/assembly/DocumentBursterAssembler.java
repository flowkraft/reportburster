package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;

import org.apache.commons.io.FileUtils;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;
import org.zeroturnaround.zip.ZipUtil;

public class DocumentBursterAssembler extends AbstractAssembler {

	private String e2eVerifyDirPath;

	public DocumentBursterAssembler() {

		super("target/package/db", "target/package/verified-db", "target/documentburster.zip");

	}

	protected void compile() throws Exception {

		//String npmRunCustomReleaseCommand = "npm run custom:release";
		
		String npmRunCustomReleaseCommand = "npm run custom:release --force";

		new ProcessExecutor().directory(new File(Utils.getTopProjectFolderPath() + "/frontend/reporting"))
				.command("cmd", "/c", npmRunCustomReleaseCommand).redirectOutput(new LogOutputStream() {
					@Override
					protected void processLine(String line) {
						System.out.println(line);
					}
				}).execute();

		System.out.println(
				"------------------------------------- DONE_01:DocumentBurster _generateDocumentBursterExe && generate angular production /dist ... -------------------------------------");

	}

	protected void preparePackage() throws Exception {

		// copy all the already "verified" DocumentBurster files
		FileUtils.copyDirectory(new File(e2eVerifyDirPath),
				new File(packageDirPath));

		System.out.println(
				"------------------------------------- DONE_02:DocumentBursterServer copy all the already 'verified' DocumentBurster files ... -------------------------------------");

		
		FileUtils.copyFile(
				new File(Utils.getTopProjectFolderPath() + "/frontend/reporting/release/ReportBurster.exe"),
				new File(packageDirPath + "/" + topFolderName + "/ReportBurster.exe"));

		System.out.println(
				"------------------------------------- DONE_03:DocumentBurster _copyDocumentBursterExe... -------------------------------------");

		// copy the angular's production generated /dist folder
		FileUtils.forceMkdir(new File(packageDirPath + "/" + topFolderName + "/lib/frontend"));
		FileUtils.copyDirectory(new File(Utils.getTopProjectFolderPath() + "/frontend/reporting/dist"),
				new File(packageDirPath + "/" + topFolderName + "/lib/frontend"));

		System.out.println(
				"------------------------------------- DONE_02:DocumentBursterServer copy all the already 'verified' DocumentBurster files ... -------------------------------------");

	}

	@Override
	public void verify() throws Exception {

		ZipUtil.unpack(new File(targetPathZipFile), new File(verifyDirPath));

		// verify DocumentBursterExe();
		assertThat(new File(verifyDirPath + "/" + topFolderName + "/ReportBurster.exe").exists()).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_01:DocumentBurster ReportBurster.exe... -------------------------------------");

		System.out.println(
				"------------------------------------- VERIFIED_DONE:DocumentBurster ... -------------------------------------");

	}
	
	public void setE2EVerifyDirPath(String e2eVerifyDirPath) {
		this.e2eVerifyDirPath = e2eVerifyDirPath;
	}

}
