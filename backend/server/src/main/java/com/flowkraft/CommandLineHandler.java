package com.flowkraft;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.ExitCodeGenerator;
import org.springframework.stereotype.Component;

import com.flowkraft.jobson.AppSetup;
import com.flowkraft.jobson.commands.JobsonCommands;
import com.flowkraft.jobson.config.ApplicationConfig;

import picocli.CommandLine;
import picocli.CommandLine.IFactory;

@Component
public class CommandLineHandler implements CommandLineRunner, ExitCodeGenerator {

	private int exitCode;

	@Autowired
	private IFactory factory;

	@Autowired
	JobsonCommands jobsonCommands;

	@Autowired
	AppSetup appSetup;
	
	@Override
	public void run(String... args) throws Exception {
		if (!ApplicationConfig.serveWeb) {

			appSetup.createRequiredFolders();

			CommandLine commandLine = new CommandLine(jobsonCommands, factory);
			
			System.out.println("args: " + args);
			
			exitCode = commandLine.execute(args);

		}

		
	}

	@Override
	public int getExitCode() {
		// TODO Auto-generated method stub
		return exitCode;
	}

}
