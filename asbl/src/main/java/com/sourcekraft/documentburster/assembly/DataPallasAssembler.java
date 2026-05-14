package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;

import org.apache.commons.io.FileUtils;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;
import org.zeroturnaround.zip.ZipUtil;

public class DataPallasAssembler extends AbstractAssembler {

	private String e2eVerifyDirPath;

	public DataPallasAssembler() {

		super("target/package/db", "target/package/verified-db", "target/datapallas.zip");

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
				}).exitValueNormal().execute();

		System.out.println(
				"------------------------------------- DONE_01:DataPallas _generate DataPallas.exe ... -------------------------------------");

	}

	protected void preparePackage() throws Exception {

		// copy all the already "verified" DataPallas files
		FileUtils.copyDirectory(new File(e2eVerifyDirPath),
				new File(packageDirPath));

		System.out.println(
				"------------------------------------- DONE_02:DataPallasServer copy all the already 'verified' DataPallas files ... -------------------------------------");

		
		FileUtils.copyFile(
				new File(Utils.getTopProjectFolderPath() + "/frend/reporting/release/DataPallas.exe"),
				new File(packageDirPath + "/" + topFolderName + "/DataPallas.exe"));

		System.out.println(
				"------------------------------------- DONE_03:DataPallas _copy DataPallasExe... -------------------------------------");

		
	}

	@Override
	public void verify() throws Exception {

		ZipUtil.unpack(new File(targetPathZipFile), new File(verifyDirPath));

		// verify DataPallas.exe;
		assertThat(new File(verifyDirPath + "/" + topFolderName + "/DataPallas.exe").exists()).isTrue();

		System.out.println(
				"------------------------------------- VERIFIED_01:DataPallas DataPallas.exe... -------------------------------------");

		System.out.println(
				"------------------------------------- VERIFIED_DONE:DataPallas ... -------------------------------------");

	}
	
	public void setE2EVerifyDirPath(String e2eVerifyDirPath) {
		this.e2eVerifyDirPath = e2eVerifyDirPath;
	}

}
