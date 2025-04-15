package com.flowkraft.jobson.commands;

import org.springframework.stereotype.Component;

import picocli.CommandLine.Command;

@Command(name = "jobson", description = "Jobson commands", subcommands = { ValidateCommand.class,
		NewCommand.class, GenerateCommand.class, UsersCommand.class, RunCommand.class })
@Component
public class JobsonCommands {
	
}
