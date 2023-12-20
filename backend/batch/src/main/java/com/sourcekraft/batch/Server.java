package com.sourcekraft.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

import com.sourcekraft.batch.common.Consts;
import com.sourcekraft.batch.common.server.BatchServer;

public class Server {

    private static Logger log = LoggerFactory.getLogger(Server.class);

    public static void main(String[] args) {

        ApplicationContext context = new ClassPathXmlApplicationContext(new String[]{Consts.CONTEXT_FILE});

        BatchServer server = (BatchServer) context.getBean(Consts.BATCH_SERVER_BEAN);
        try {
            server.start();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }

        System.exit(0);

    }
}
