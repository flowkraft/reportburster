package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;

import org.apache.commons.io.FileUtils;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;
import org.zeroturnaround.zip.ZipUtil;

public class ReportBursterAssembler extends AbstractAssembler {

	private String e2eVerifyDirPath;

	public ReportBursterAssembler() {

		super("target/package/db", "target/package/verified-db", "target/reportburster.zip");

	}

	protected void compile() throws Exception {

		//String npmRunCustomReleaseCommand = "npm run custom:release-electron";
		
		String npmRunCustomReleaseCommand = "npm run custom:release-electron --force";

		new ProcessExecutor().directory(new File(Utils.getTopProjectFolderPath() + "/frend/reporting"))
				.command("cmd", "/c", npmRunCustomReleaseCommand).redirectOutput(new LogOutputStream() {
					@Override
					protected void processLine(String line) {
						System.out.println(line);
					}
				}).execute();

		System.out.println(
				"------------------------------------- DONE_01:ReportBurster _generate ReportBurster.exe ... -------------------------------------");

	}

	protected void preparePackage() throws Exception {

		// copy all the already "verified" ReportBurster files
		FileUtils.copyDirectory(new File(e2eVerifyDirPath),
				new File(packageDirPath));

		System.out.println(
				"------------------------------------- DONE_02:ReportBursterServer copy all the already 'verified' ReportBurster files ... -------------------------------------");

		
		FileUtils.copyFile(
				new File(Utils.getTopProjectFolderPath() + "/frend/reporting/release/ReportBurster.exe"),
				new File(packageDirPath + "/" + topFolderName + "/ReportBurster.exe"));

		System.out.println(
				"------------------------------------- DONE_03:ReportBurster _copy ReportBursterExe... -------------------------------------");

		
	}

	@Override
	public void verify() throws Exception {

		ZipUtil.unpack(new File(targetPathZipFile), new File(verifyDirPath));

		// verify ReportBurster.exe;
		assertThat(new File(verifyDirPath + "/" + topFolderName + "/ReportBurster.exe").exists()).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_01:ReportBurster ReportBurster.exe... -------------------------------------");

		System.out.println(
				"------------------------------------- VERIFIED_DONE:ReportBurster ... -------------------------------------");

	}
	
	public void setE2EVerifyDirPath(String e2eVerifyDirPath) {
		this.e2eVerifyDirPath = e2eVerifyDirPath;
	}

}
