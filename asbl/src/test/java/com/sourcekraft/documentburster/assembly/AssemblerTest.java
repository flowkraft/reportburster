package com.sourcekraft.documentburster.assembly;

import org.junit.Test;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;

public class AssemblerTest {

	// trying to follow Maven's Build Lifecycle
	// https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html
	public void doAdHoc() throws Exception {

		new ProcessExecutor().command("cmd", "/c",
				"java -cp target/package/db/ReportBurster/lib/burst/ant-launcher.jar org.apache.tools.ant.launch.Launcher -buildfile bild-groovy.xml")
				.redirectOutput(new LogOutputStream() {
					@Override
					protected void processLine(String line) {
						System.out.println(line);
					}
				}).execute();

	}

	@Test
	public void assembleReportBursterAndReportBursterServer() throws Exception {

		AbstractAssembler e2eAssembler = new NoExeAssembler();

		e2eAssembler.assemble();
		e2eAssembler.verify();

		System.out.println(
				"------------------------------------- FINISHED Assembler:NoExeAssembler ... -------------------------------------");

		AbstractAssembler rbAssembler = new ReportBursterAssembler();
		((ReportBursterAssembler) rbAssembler).setE2EVerifyDirPath(e2eAssembler.getVerifyDirPath());

		rbAssembler.assemble();
		rbAssembler.verify();
		rbAssembler.install();

		System.out.println(
				"------------------------------------- FINISHED Assembler:ReportBursterAssembler ... -------------------------------------");

		AbstractAssembler rbServerAssembler = new ReportBursterServerSpringBootAssembler();

		((ReportBursterServerSpringBootAssembler) rbServerAssembler)
				.setReportBursterVerifyDirPath(rbAssembler.getVerifyDirPath());

		rbServerAssembler.assemble();
		rbServerAssembler.verify();
		rbServerAssembler.install();

		System.out.println(
				"------------------------------------- FINISHED Assembler:ReportBursterServerSpringBootAssembler ... -------------------------------------");

		AbstractAssembler rbSourceAssembler = new ReportBursterSourceAssembler();
		
		rbSourceAssembler.assemble();
		rbSourceAssembler.verify();
		rbSourceAssembler.install();

		System.out.println(
				"------------------------------------- FINISHED Assembler:ReportBursterSourceAssembler ... -------------------------------------");

	}

	@Test
	public void prepareForE2E() throws Exception {

		AbstractAssembler e2eAssembler = new NoExeAssembler();

		e2eAssembler.assemble();
		e2eAssembler.verify();

		System.out.println(
				"------------------------------------- FINISHED Assembler:E2ENoExeAssembler ... -------------------------------------");

	}

}
