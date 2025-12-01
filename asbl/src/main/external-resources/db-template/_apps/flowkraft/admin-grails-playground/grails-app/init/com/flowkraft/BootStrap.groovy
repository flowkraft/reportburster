package com.flowkraft

import grails.util.Holders

class BootStrap {

    def grailsApplication

    def init = { servletContext ->
        boolean useLiquibaseGroovy = grailsApplication.config.getProperty('ENABLE_LIQUIDBASE_GROOVY_MIGRATIONS', Boolean, false)

        if (useLiquibaseGroovy) {
            // Disable GORM auto-migrations if supported
            grailsApplication.config.setProperty('grails.gorm.autoMigrate', false)
            runLiquibaseGroovyMigration()
        } else {
            // Enable GORM auto-migrations (default)
            grailsApplication.config.setProperty('grails.gorm.autoMigrate', true)
            // GORM will handle migrations as usual
        }
    }

    def destroy = {
    }

    private void runLiquibaseGroovyMigration() {
        // Example using Liquibase API
        import liquibase.Liquibase
        import liquibase.database.DatabaseFactory
        import liquibase.resource.ClassLoaderResourceAccessor

        def dataSource = Holders.applicationContext.getBean('dataSource')
        def connection = dataSource.getConnection()
        def database = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(connection)
        def liquibase = new Liquibase("db/migration/changelog.groovy", new ClassLoaderResourceAccessor(), database)
        liquibase.update("")
        connection.close()
    }
}