package com.sourcekraft.batch.polling;

import java.io.File;
import java.io.FilenameFilter;
import org.sadun.util.polling.DirectoryPoller;

public class FolderPoller {

    private File pollDir = null;
    private Long period = null;

    private ScriptedPollManager scriptedPollManager = null;
    private DirectoryPoller poller = null;

    public void setPollFolder(String folderToPoll) {

        pollDir = new File(folderToPoll);

    }

    public void setScriptedPollManager(ScriptedPollManager scriptedPollManager) {

        this.scriptedPollManager = scriptedPollManager;

    }

    public void setPeriod(Long period) {
        this.period = period;
    }

    public void poll() throws Exception {

        FilenameFilter jobsFilter = new FilenameFilter() {

            public boolean accept(File dir, String name) {

                String lowerCaseName = name.toLowerCase();
                return lowerCaseName.endsWith(".pdf") || lowerCaseName.endsWith(".xls")
                        || lowerCaseName.endsWith(".xlsx");
            
            }

        };

        poller = new DirectoryPoller();

        poller.setFilter(jobsFilter);

        poller.addDirectory(pollDir);

        poller.setAutoMove(true);
        poller.setPollInterval(period);
        poller.addPollManager(scriptedPollManager);

        poller.start();

    }

    public void shutDown() {
        poller.shutdown();
        while (poller.isAlive())
            ;
    }
}
