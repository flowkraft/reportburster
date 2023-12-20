package com.sourcekraft.batch.it;

import junit.framework.TestCase;

import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

import com.sourcekraft.batch.Consts;
import com.sourcekraft.batch.common.server.BatchServer;

public class BatchJobsFlowIntegrationTest extends TestCase {

    public void testNormalFlow() throws Exception {

        ApplicationContext context = new ClassPathXmlApplicationContext(new String[]{Consts.TEST_CONTEXT_FILE});

        BatchServer server = (BatchServer) context.getBean(Consts.BATCH_SERVER_BEAN);
        server.start();

    }

    protected void tearDown() {

        assertNotNull("burst1.pdf file not found", getClass().getResourceAsStream(Consts.BURST1_FILE_PATH));
        assertNotNull("burst2.pdf file not found", getClass().getResourceAsStream(Consts.BURST2_FILE_PATH));

    }

}
