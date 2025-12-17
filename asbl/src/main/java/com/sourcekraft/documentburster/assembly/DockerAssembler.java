package com.sourcekraft.documentburster.assembly;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;

import org.zeroturnaround.exec.ProcessExecutor;
import org.zeroturnaround.exec.stream.LogOutputStream;
import org.apache.commons.io.FileUtils;

public class DockerAssembler extends AbstractAssembler {

    private String imageTag;
    private String version = "latest";

    public DockerAssembler() {
        // No zip produced for Docker packaging; packageDir used for temporary workspace
        super("target/package/docker", "target/package/verified-docker", "");
        // default imageTag uses latest until we read version from settings.xml
        this.imageTag = "flowkraft/reportburster-server:latest";
    }

    @Override
    protected void compile() throws Exception {
        // Determine version from the assembled NoExe package or fallback to template
        this.version = _readVersionFromSettingsXml();
        if (this.version == null || this.version.trim().isEmpty()) {
            this.version = "latest";
        }
        this.imageTag = "flowkraft/reportburster-server:" + this.version;

        System.out.println("------------------------------------- START: DockerAssembler.compile() building Docker image '" + imageTag + "' ... -------------------------------------");

        File top = new File(Utils.getTopProjectFolderPath());

        // Preprocess Dockerfile to inject the correct version label
        File dockerfileSource = new File(top, "Dockerfile");
        File dockerfileBuild = new File(top, "Dockerfile.assembled");
        _preprocessDockerfile(dockerfileSource, dockerfileBuild, this.version);

        // Try to remove any existing image (ignore failures)
        try {
            new ProcessExecutor().directory(top).command("docker", "rmi", "-f", imageTag)
                    .redirectOutput(new LogOutputStream() {
                        @Override
                        protected void processLine(String line) {
                            System.out.println(line);
                        }
                    }).execute();
        } catch (Throwable t) {
            System.out.println("Docker rmi: image not present or removal failed (ignored): " + t.getMessage());
        }

        // Build the Docker image without cache using the preprocessed Dockerfile
        new ProcessExecutor().directory(top)
                .command("docker", "build", "--no-cache", "-t", imageTag, "-f", dockerfileBuild.getName(), ".")
                .redirectOutput(new LogOutputStream() {
                    @Override
                    protected void processLine(String line) {
                        System.out.println(line);
                    }
                }).execute();

        // cleanup generated Dockerfile (best-effort)
        try {
            dockerfileBuild.delete();
        } catch (Exception ex) {
            // ignore
        }

        System.out.println("------------------------------------- DONE: DockerAssembler.compile() built image '" + imageTag + "' ... -------------------------------------");
    }

    @Override
    protected void preparePackage() throws Exception {
        System.out.println("------------------------------------- START: DockerAssembler.preparePackage() ... -------------------------------------");

        // Write a self-contained docker compose bundle into the package directory
        File dockerDir = new File(packageDirPath + "/" + this.topFolderName + "/docker");
        FileUtils.forceMkdir(dockerDir);

        // Generate a docker-compose.yml that uses 'latest' by default and comments the pinned version
        File templateCompose = new File(Utils.getTopProjectFolderPath() + "/asbl/docker/docker-compose.yml");
        String composeContent = FileUtils.readFileToString(templateCompose, "UTF-8");

        // Replace image line with two lines: unpinned 'latest' and commented pinned version
        composeContent = composeContent.replaceAll("(?m)^\\s*image:\\s*flowkraft/reportburster-server:\\S+",
                "image: flowkraft/reportburster-server:latest\n    # pinned: image: flowkraft/reportburster-server:" + this.version);

        File outCompose = new File(dockerDir, "docker-compose.yml");
        FileUtils.writeStringToFile(outCompose, composeContent, "UTF-8");

        // NOTE: README is maintained under asbl/docker/README.md and is not generated here.
        // Create a small start.sh wrapper (POSIX)
        File startSh = new File(dockerDir, "start.sh");
        String startShContent = "#!/bin/sh\nset -e\ndocker compose -f docker-compose.yml up --build -d\n";
        FileUtils.writeStringToFile(startSh, startShContent, "UTF-8");
        startSh.setExecutable(true, false);

        // Create a small start.ps1 wrapper for convenience (Windows PowerShell)
        File startPs1 = new File(dockerDir, "start.ps1");
        String startPs1Content = "docker compose -f docker-compose.yml up --build -d";
        FileUtils.writeStringToFile(startPs1, startPs1Content, "UTF-8");

        // Copy initial directories from the verified NoExe package into the assembled package directory
        // DIRECTORIES = ("_apps", "backup", "config", "db", "input-files", "logs", "output", "poll", "quarantine", "samples", "scripts", "temp", "templates")
        String[] directories = new String[] {"_apps", "backup", "config", "db", "input-files", "logs", "output", "poll", "quarantine", "samples", "scripts", "temp", "templates"};
        File verifiedRoot = new File(Utils.getTopProjectFolderPath() + "/asbl/target/package/verified-db-noexe/ReportBurster");

        for (String dir : directories) {
            File src = new File(verifiedRoot, dir);
            File dest = new File(packageDirPath + "/" + this.topFolderName + "/" + dir);
            if (src.exists() && src.isDirectory()) {
                System.out.println("Copying directory from verified package: " + src.getPath() + " -> " + dest.getPath());
                FileUtils.copyDirectory(src, dest);
            } else {
                // Ensure the destination folder exists even if the source is missing (create empty dir)
                System.out.println("Source not present for '" + dir + "' in verified package; creating empty folder: " + dest.getPath());
                FileUtils.forceMkdir(dest);
            }
        }

        System.out.println("------------------------------------- DONE: DockerAssembler.preparePackage() wrote docker/ bundle with version '" + this.version + "' ... -------------------------------------");
    }

    @Override
    public void verify() throws Exception {
        // Ensure image exists by checking docker images -q <tag>
        File top = new File(Utils.getTopProjectFolderPath());
        org.zeroturnaround.exec.ProcessResult pr = new ProcessExecutor().directory(top).command("docker", "images", "-q", imageTag)
                .readOutput(true).execute();

        String imageId = pr.getOutput().getString().trim();
        assertThat(imageId).as("Docker image %s should exist", imageTag).isNotEmpty();

        System.out.println("------------------------------------- VERIFIED: DockerAssembler image exists: " + imageId + " ... -------------------------------------");
    }

    private String _readVersionFromSettingsXml() {
        try {
            // Prefer the assembled settings.xml produced by NoExeAssembler
            File settingsPath = new File(Utils.getTopProjectFolderPath()
                    + "/asbl/target/package/verified-db-noexe/ReportBurster/config/burst/settings.xml");
            if (!settingsPath.exists()) {
                // fallback to template settings.xml in backend resources
                settingsPath = new File(Utils.getTopProjectFolderPath()
                        + "/bkend/reporting/src/main/external-resources/template/config/burst/settings.xml");
            }

            if (!settingsPath.exists()) {
                System.out.println("Warning: settings.xml not found to read version; defaulting to 'latest'");
                return null;
            }

            String content = FileUtils.readFileToString(settingsPath, "UTF-8");
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("<version>([^<]+)</version>").matcher(content);
            if (m.find()) {
                return m.group(1).trim();
            }
        } catch (Exception ex) {
            System.out.println("Failed to read version from settings.xml: " + ex.getMessage());
        }
        return null;
    }

    private void _preprocessDockerfile(File src, File dst, String version) {
        try {
            String content = FileUtils.readFileToString(src, "UTF-8");
            content = content.replaceAll("(?m)^\\s*version\\s*=\\s*\"[^\"]*\"", "version=\"" + version + "\"");
            // Also try to replace LABEL version line specifically
            content = content.replaceAll("(?m)version=\"[^\"]*\"", "version=\"" + version + "\"");
            FileUtils.writeStringToFile(dst, content, "UTF-8");
        } catch (Exception ex) {
            System.out.println("Failed to preprocess Dockerfile: " + ex.getMessage());
        }
    }

}
