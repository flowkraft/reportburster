package com.flowkraft.common;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.lang3.StringUtils;
import org.apache.tools.ant.DirectoryScanner;
import org.apache.tools.ant.types.FileSet;

import com.flowkraft.jobman.models.FileInfo;

public class Utils {

	@FunctionalInterface
	public interface CheckedConsumer<T> {
	    void accept(T t) throws Exception;
	}

	public static <T> Consumer<T> uncheckedConsumer(CheckedConsumer<T> consumer) {
	    return t -> {
	        try {
	            consumer.accept(t);
	        } catch (Exception e) {
	            throw new RuntimeException(e);
	        }
	    };
	}
	
	public interface CallBackMethod<T extends Object> {
		void handle(T input) throws Exception;
	}

	public static IOFileFilter filesWhichCanBeProcessedFilter = FileFilterUtils.asFileFilter((file) -> {

		String lowerCaseFileName = file.getName().toLowerCase();

		// System.out.println(lowerCaseFileName);

		if (lowerCaseFileName.contains(Constants.PROCESSING_DIR_NAME))
			return false;

		return true;
	});

	public static void emptyFile(String filePath) throws Exception {
		FileUtils.write(new File(filePath), "", Charset.defaultCharset());
	}

	public static String encodeURIComponent(String s) throws Exception {

		return URLEncoder.encode(s, "UTF-8").replaceAll("\\+", "%20").replaceAll("\\%21", "!").replaceAll("\\%27", "'")
				.replaceAll("\\%28", "(").replaceAll("\\%29", ")").replaceAll("\\%7E", "~");

	}

	public static String getProductName() {

		if ((new File("startServer.bat").exists()) || (new File("startServer.sh").exists()))
			return Constants.SERVER_DB_NAME;
		else
			return Constants.DB_NAME;

	}

	public static List<FileInfo> getFilesToProcess(String transactionId, String folderPath) {

		FileSet fs = new FileSet();

		fs.setDir(new File(folderPath));
		fs.setIncludes(transactionId + "/*.*");

		DirectoryScanner ds = fs.getDirectoryScanner(Ant.proj);

		List<String> dsFiles = Arrays.asList(ds.getIncludedFiles());

		List<FileInfo> filesToProcess = new ArrayList<FileInfo>();

		dsFiles.forEach(fName -> {
			FileInfo fileInfo = new FileInfo(fName, StringUtils.EMPTY, false);
			fileInfo.filePath = folderPath + "/" + fName;
			filesToProcess.add(fileInfo);
		});

		return filesToProcess;

	}

	public static String getJvmArgumentValue(String argumentId) {
		String value = StringUtils.EMPTY;
		RuntimeMXBean runtimeMxBean = ManagementFactory.getRuntimeMXBean();
		for (String argument : runtimeMxBean.getInputArguments()) {
			// System.out.println("jvmArgument = " + argument);
			if (StringUtils.isBlank(value) && argument.startsWith(argumentId)) {
				value = argument.substring(argumentId.length());
			}
		}
		return value;
	}

}
