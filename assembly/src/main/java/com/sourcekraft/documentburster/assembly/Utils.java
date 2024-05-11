package com.sourcekraft.documentburster.assembly;

import java.io.File;
import java.io.FileReader;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOCase;
import org.apache.commons.io.filefilter.DirectoryFileFilter;
import org.apache.commons.io.filefilter.NotFileFilter;
import org.apache.commons.io.filefilter.TrueFileFilter;
import org.apache.commons.io.filefilter.WildcardFileFilter;
import org.apache.maven.model.Model;
import org.apache.maven.model.io.xpp3.MavenXpp3Reader;
import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;

public class Utils {

	private static String PRODUCT_NAME = "ReportBurster";

	public static boolean dir1ContainsAllDir2Files(File dir1, File dir2) throws Exception {

		Set<String> ignores = new HashSet<String>();

		ignores.add(Utils.getInstallationTopFolderName());
		ignores.add("dependencies");
		ignores.add("db-template");
		ignores.add("db-server-template");
		ignores.add("template");

		Set<String> dir1FileNames = new HashSet<String>();

		Collection<File> dir1Files = FileUtils.listFilesAndDirs(dir1, TrueFileFilter.TRUE, TrueFileFilter.TRUE);

		for (File dir1File : dir1Files) {

			dir1FileNames.add(FilenameUtils.getName(dir1File.getCanonicalPath()));

		}

		Set<String> dir2FileNames = new HashSet<String>();

		Collection<File> dir2Files = FileUtils.listFilesAndDirs(dir2, TrueFileFilter.TRUE, TrueFileFilter.TRUE);

		for (File dir2File : dir2Files) {

			String fileName = FilenameUtils.getName(dir2File.getCanonicalPath());

			// these files should be ignored because they are renamed afterwards (for
			// various reasons)
			if (!fileName.startsWith("ant-launcher") && !fileName.startsWith("schedules.groovy"))
				dir2FileNames.add(fileName);

		}

		dir2FileNames.removeAll(dir1FileNames);
		dir2FileNames.removeAll(ignores);

		if (dir2FileNames.size() > 0)
			throw new Exception("Following files were found in '" + dir2.getAbsolutePath() + "' and were not found in '"
					+ dir1.getAbsolutePath() + "' : " + dir2FileNames.toString());

		return true;

	}

	public static String getTopProjectFolderPath() throws Exception {

		String topProjectFolderPath = (new File("..")).getCanonicalPath();

		return topProjectFolderPath;

	}

	public static void runMaven(String pomXmlFolderPath, String mavenCommand) throws Exception {

		if (!mavenCommand.contains("-Djavac.compiler.path")) {
			mavenCommand += " -Djavac.compiler.path=C:\\Program Files/Java/jdk-17.0.2/bin/javac.exe";
		}

		new ProcessExecutor().directory(new File(pomXmlFolderPath)).command("cmd", "/c", mavenCommand)
				.redirectOutput(new LogOutputStream() {
					@Override
					protected void processLine(String line) {
						System.out.println(line);
					}
				}).execute();

	}

	public static void removeVersionFromAntLauncherFileName(String folderPath) throws Exception {

		Collection<File> files = FileUtils.listFiles(new File(folderPath),
				new WildcardFileFilter("ant-launcher*.jar", IOCase.INSENSITIVE),
				new NotFileFilter(DirectoryFileFilter.DIRECTORY));

		if ((files == null) || (files.size() != 1))
			throw new Exception("ant-launcher*.jar WAS NOT FOUND IN " + folderPath + " directory");

		FileUtils.moveFile(files.iterator().next(), new File(folderPath + "/" + "ant-launcher.jar"));

	}

	public static String getInstallationTopFolderName() throws Exception {

		// return PRODUCT_NAME + "-" + Utils.getProductVersion();
		return PRODUCT_NAME;

	}

	public static String getProductVersion() throws Exception {

		return Utils.getMavenProperty("revision");

	}

	public static String getMavenProperty(String property) throws Exception {

		MavenXpp3Reader reader = new MavenXpp3Reader();
		Model model = reader.read(new FileReader("../pom.xml"));

		return model.getProperties().getProperty(property);

	}

}
