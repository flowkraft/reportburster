package com.sourcekraft.batch.common.server;

import java.io.File;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.batch.db.hsqldb.HsqlServer;
import com.sourcekraft.batch.polling.FolderPoller;

public class BatchServer {

    private Logger log = LoggerFactory.getLogger(getClass());

    private File pidFile = null;

    private HsqlServer dataBaseServer = null;
    private FolderPoller directoryPoller = null;

    public void setPidFilePath(String pidFilePath) {
        this.pidFile = new File(pidFilePath);
    }

    public void setDataBaseServer(HsqlServer dataBaseServer) {
        this.dataBaseServer = dataBaseServer;
    }

    public void setDirectoryPoller(FolderPoller directoryPoller) {
        this.directoryPoller = directoryPoller;
    }

    public void start() throws Exception {

        log.info("*********************** Starting Batch Server ... ***********************");

        if (!pidFile.createNewFile())
            log.warn("PID file already exists!'");

        directoryPoller.poll();

        boolean shutDown = false;
        while (!shutDown) {
            shutDown = !pidFile.exists();
            Thread.sleep(1000);
        }

        stop();

    };

    private void stop() {

        log.info("*********************** Stopping Batch Server ... ***********************");

        directoryPoller.shutDown();
        dataBaseServer.destroy();

    }

}