package com.flowkraft.jobson;

import org.springframework.stereotype.Component;

@Component
public class AppSetup {

	/*
	private static Logger log = LoggerFactory.getLogger(AppSetup.class);

	@Autowired
	private ApplicationConfig appConfig;
	*/
	
	public void createRequiredFolders() throws Exception {

		/*
	
		System.out.println("ApplicationConfig -> createRequiredFolders()");
		
		final Path userFilePath = java.nio.file.Paths.get(appConfig.getUsers().getFile());

		if (!userFilePath.toFile().exists()) {
			final String error = userFilePath.toString()
					+ ": Does not exist. A user file is REQUIRED to boot the server";
			log.error(error);
			throw new RuntimeException(error);
		}
		
		final Path jobSpecsPath = java.nio.file.Paths.get(appConfig.getSpecs().getDir());

		log.debug("Loading a JobSpecDAO backed by " + jobSpecsPath.toString());

		final Path jobsPath = java.nio.file.Paths.get(appConfig.getJobs().getDir());

		if (!jobsPath.toFile().exists()) {
			log.debug(jobsPath + ": does not exist. Creating");
			Files.createDirectory(jobsPath);
		}

		final Path workingDirsPath = java.nio.file.Paths.get(appConfig.getWorkingDirs().getDir());
		if (!workingDirsPath.toFile().exists()) {
			log.info(workingDirsPath + ": does not exist. Creating");
			Files.createDirectory(workingDirsPath);
		}

		*/
	}
}
