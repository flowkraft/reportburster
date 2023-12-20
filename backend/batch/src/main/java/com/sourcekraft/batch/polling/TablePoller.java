package com.sourcekraft.batch.polling;

import java.util.TimerTask;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.batch.common.job.Manager;

public class TablePoller extends TimerTask {

    private static Logger log = LoggerFactory.getLogger(TablePoller.class);

    private Manager manager;

    public void setManager(Manager manager) {
        this.manager = manager;
    }

    @Override
    public void run() {

        try {
            manager.handle();
        } catch (Exception e) {
            log.error("TablePoller Error When Checking for New Jobs", e);
        }

    }

}