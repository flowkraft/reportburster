package com.sourcekraft.documentburster.assembly;

import org.junit.Test;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;

public class AssemblerTest {

	// trying to follow Maven's Build Lifecycle
	// https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html
	public void doAdHoc() throws Exception {

		new ProcessExecutor().command("cmd", "/c",
				"java -cp target/package/db/DocumentBurster/lib/burst/ant-launcher.jar org.apache.tools.ant.launch.Launcher -buildfile build-groovy.xml")
				.redirectOutput(new LogOutputStream() {
					@Override
					protected void processLine(String line) {
						System.out.println(line);
					}
				}).execute();

	}

	@Test
	public void assembleDocumentBursterAndDocumentBursterServer() throws Exception {

		AbstractAssembler e2eAssembler = new NoExeAssembler();

		e2eAssembler.assemble();
		e2eAssembler.verify();

		System.out.println(
				"------------------------------------- FINISHED Assembler:NoExeAssembler ... -------------------------------------");

		AbstractAssembler dbAssembler = new DocumentBursterAssembler();
		((DocumentBursterAssembler) dbAssembler).setE2EVerifyDirPath(e2eAssembler.getVerifyDirPath());

		dbAssembler.assemble();
		dbAssembler.verify();
		dbAssembler.install();

		System.out.println(
				"------------------------------------- FINISHED Assembler:DocumentBursterAssembler ... -------------------------------------");

		AbstractAssembler dbServerAssembler = new DocumentBursterServerSpringBootAssembler();

		((DocumentBursterServerSpringBatchAdminAssembler) dbServerAssembler)
				.setDocumentBursterVerifyDirPath(dbAssembler.getVerifyDirPath());

		dbServerAssembler.assemble();
		dbServerAssembler.verify();
		dbServerAssembler.install();

		System.out.println(
				"------------------------------------- FINISHED Assembler:DocumentBursterServerSpringBootAssembler ... -------------------------------------");

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
