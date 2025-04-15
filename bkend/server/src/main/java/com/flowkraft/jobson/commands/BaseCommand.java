package com.flowkraft.jobson.commands;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.flowkraft.jobson.config.ApplicationConfig;

public abstract class BaseCommand implements Runnable {

	protected static final Logger log = LoggerFactory.getLogger(BaseCommand.class);

	@Autowired
	protected ApplicationConfig appConfig;
	
}
