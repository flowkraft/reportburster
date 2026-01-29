package com.sourcekraft.documentburster.common.db.northwind;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Standalone generator for creating the Northwind sample database in DuckDB format.
 * This class uses JPA/Hibernate to create the schema and populate data using NorthwindDataGenerator.
 */
public class DuckDBDatabaseGenerator {

    private static final Logger log = LoggerFactory.getLogger(DuckDBDatabaseGenerator.class);

    public static void main(String[] args) {
        try {
            log.info("Starting DuckDB Northwind database generation...");

            // Determine the database file path
            String dbPath = "./asbl/src/main/external-resources/db-template/db/sample-northwind-duckdb/northwind.duckdb";
            if (args.length > 0) {
                dbPath = args[0];
            }

            // Ensure parent directory exists
            Path dbFile = Paths.get(dbPath);
            Files.createDirectories(dbFile.getParent());

            // Delete existing database file if it exists
            if (Files.exists(dbFile)) {
                log.info("Deleting existing database file: {}", dbPath);
                Files.delete(dbFile);
            }

            log.info("Creating DuckDB database at: {}", dbPath);

            // Override persistence unit properties to use the specified path
            Map<String, String> properties = new HashMap<>();
            properties.put("jakarta.persistence.jdbc.driver", "org.duckdb.DuckDBDriver");
            properties.put("jakarta.persistence.jdbc.url", "jdbc:duckdb:" + dbPath);
            properties.put("jakarta.persistence.jdbc.user", "");
            properties.put("jakarta.persistence.jdbc.password", "");
            properties.put("hibernate.dialect", "org.hibernate.community.dialect.DuckDBDialect");
            properties.put("hibernate.hbm2ddl.auto", "create"); // Create schema automatically
            properties.put("hibernate.show_sql", "true");
            properties.put("hibernate.format_sql", "true");

            // Create EntityManagerFactory with overridden properties
            EntityManagerFactory emf = Persistence.createEntityManagerFactory("northwind-duckdb", properties);
            EntityManager em = null;

            try {
                em = emf.createEntityManager();
                log.info("EntityManager created successfully");

                // Generate Northwind data
                log.info("Generating Northwind sample data...");
                NorthwindDataGenerator generator = new NorthwindDataGenerator(em);
                generator.generateAll();

                log.info("Northwind data generated successfully!");
                log.info("DuckDB database created at: {}", dbPath);
                log.info("Database size: {} bytes", Files.size(dbFile));

            } catch (Exception e) {
                log.error("Failed to generate Northwind data", e);
                if (em != null && em.getTransaction().isActive()) {
                    em.getTransaction().rollback();
                }
                throw e;
            } finally {
                if (em != null && em.isOpen()) {
                    em.close();
                }
                if (emf != null && emf.isOpen()) {
                    emf.close();
                }
            }

            log.info("DuckDB Northwind database generation completed successfully!");

        } catch (Exception e) {
            log.error("Database generation failed", e);
            System.exit(1);
        }
    }
}
