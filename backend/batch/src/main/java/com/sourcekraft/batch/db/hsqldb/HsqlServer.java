package com.sourcekraft.batch.db.hsqldb;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.hsqldb.DatabaseManager;
import org.hsqldb.server.ServerConfiguration;
import org.hsqldb.Database;
import org.hsqldb.persist.HsqlProperties;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;

import java.util.Properties;

public class HsqlServer implements InitializingBean, DisposableBean {

    /**
     * Commons Logging instance.
     */
    private static final Logger log = LoggerFactory.getLogger(HsqlServer.class);

    /**
     * Properties used to customize instance.
     */
    private Properties serverProperties;

    /**
     * The actual server instance.
     */
    private org.hsqldb.Server server;

    public Properties getServerProperties() {
        return serverProperties;
    }

    public void setServerProperties(Properties serverProperties) {
        this.serverProperties = serverProperties;
    }

    public void afterPropertiesSet() throws Exception {
        HsqlProperties configProps =
                serverProperties != null ? new HsqlProperties(serverProperties) : new HsqlProperties();

        ServerConfiguration.translateDefaultDatabaseProperty(configProps);

        // finished setting up properties - set some important behaviors as
        // well;
        server = new org.hsqldb.Server();
        server.setRestartOnShutdown(false);
        server.setNoSystemExit(true);
        server.setProperties(configProps);

        log.info("HSQL Server Startup sequence initiated");

        server.start();

        String portMsg = "port " + server.getPort();
        log.info("HSQL Server listening on " + portMsg);
    }

    public void destroy() {
        // Do what it takes to shutdown
        log.info("HSQL Server Shutdown sequence initiated");
        server.signalCloseAllServerConnections();
        server.stop();
        DatabaseManager.closeDatabases(Database.CLOSEMODE_NORMAL);
        log.info("HSQL Server Shutdown completed");
        server = null;
    }

}
