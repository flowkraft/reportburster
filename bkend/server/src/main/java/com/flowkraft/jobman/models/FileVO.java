package com.flowkraft.jobman.models;

import org.apache.commons.lang3.JavaVersion;
import org.apache.commons.lang3.SystemUtils;
import org.apache.commons.lang3.Validate;

import java.io.File;
import java.lang.reflect.Method;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class FileVO implements Comparable<FileVO> {

	private static final boolean IS_WINDOWS = SystemUtils.OS_NAME.toLowerCase().indexOf("windows") >= 0;

	private File file;

	public FileVO(File file) {
		Validate.notNull(file, "Null file not allowed.");
		this.file = file;
	}

	public String getName() {
		if (this.file.getParent() == null) {
			return this.file.getPath().replace('\\', '/');
		}
		return this.file.getName();
	}

	public String getPath() {
		return this.file.getPath().replace('\\', '/');
	}

	public String getFullName() {
		return this.file.getAbsolutePath().replace('\\', '/');
	}

	public boolean isWritable() {
		return this.file.canWrite();
	}

	public boolean isReadable() {
		return this.file.canRead();
	}

	public boolean isExecutable() {
		if (IS_WINDOWS && localCanExecute(this.file)
				&& (this.file.getName().endsWith(".cmd") || this.file.getName().endsWith(".bat"))) {
			return true;
		} else if (IS_WINDOWS) { // canExecute is not reliable on Windows -;)
			return false;
		} else {
			return localCanExecute(this.file);
		}
	}

	private boolean localCanExecute(File file) {
		if (SystemUtils.isJavaVersionAtLeast(JavaVersion.JAVA_1_6)) {
			try {
				Method canExecuteMethod = File.class.getMethod("canExecute", (Class[]) null);
				return (Boolean) canExecuteMethod.invoke(file, (Object[]) null);
			} catch (Exception e) {
				throw new RuntimeException("Can't execute File.canExecute()", e);
			}
		}

		return false;
	}

	public String getAccessAttributes() {
		String fileAttrs = "";

		fileAttrs += file.isDirectory() ? "d" : "-";
		fileAttrs += this.localCanExecute(file) ? "x" : "-";
		fileAttrs += file.canRead() ? "r" : "-";
		fileAttrs += file.canWrite() ? "w" : "-";

		return fileAttrs;
	}

	public String getSize() {
		if (file.length() > 0L && file.length() < 1024) {
			return "1 KB";
		}
		return NumberFormat.getIntegerInstance().format(file.length() / 1024) + " KB";
	}

	public String getDateTime() {
		SimpleDateFormat format = new SimpleDateFormat("MM/dd/yyyy h:mm a");
		return format.format(new Date(file.lastModified()));
	}

	public int compareTo(FileVO o) {
		return this.file.compareTo(o.file);
	}

	@Override
	public boolean equals(Object obj) {
		if (obj == null) {
			return false;
		}
		FileVO rhs;
		if (obj instanceof FileVO) {
			rhs = (FileVO) obj;
			return this.file.equals(rhs.file);
		}
		return false;
	}

	@Override
	public int hashCode() {
		return this.file.hashCode();
	}

	@Override
	public Object clone() throws CloneNotSupportedException {
		return new FileVO(this.file);
	}
}