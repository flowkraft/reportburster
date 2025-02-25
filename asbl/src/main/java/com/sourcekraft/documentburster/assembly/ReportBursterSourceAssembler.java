package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import org.apache.commons.io.FileUtils;
import org.zeroturnaround.zip.ZipUtil;

public class ReportBursterSourceAssembler extends AbstractAssembler {

    public ReportBursterSourceAssembler() {
        super("target/package/db-src", "target/package/verified-db-src", "target/reportburster-src.zip");
    }

    @Override
    protected void compile() throws Exception {
        // No compilation needed for source package
    }

    @Override
    protected void preparePackage() throws Exception {
        // Copy all source files from top project folder except excluded directories
        File sourceDir = new File(Utils.getTopProjectFolderPath());
        File targetDir = new File(packageDirPath + "/" + topFolderName);

        // Define directories to exclude
        String[] excludes = new String[] {
            "node_modules",
            "target",
            "dist",
            ".git",
            ".settings",
            "build"
        };

        FileUtils.copyDirectory(sourceDir, targetDir, file -> {
            String relativePath = sourceDir.toURI().relativize(file.toURI()).getPath();
            
            // Check if file path contains any excluded directory
            for (String exclude : excludes) {
                if (relativePath.contains("/" + exclude + "/")) {
                    return false;
                }
            }
            return true;
        });

        System.out.println(
            "------------------------------------- DONE:ReportBursterSourceAssembler copied source files ... -------------------------------------");
    }

    @Override
    public void verify() throws Exception {
        ZipUtil.unpack(new File(targetPathZipFile), new File(verifyDirPath));

        // Verify key source directories/files exist
        String[] requiredPaths = {
            "/frontend",
            "/backend",
            "/documentation",
            "pom.xml",
            "README.md"
        };

        for (String path : requiredPaths) {
            assertThat(new File(verifyDirPath + "/" + topFolderName + path).exists())
                .withFailMessage("Required path not found: " + path)
                .isTrue();
        }

        System.out.println(
            "------------------------------------- VERIFIED:ReportBursterSourceAssembler source package ... -------------------------------------");
    }
}