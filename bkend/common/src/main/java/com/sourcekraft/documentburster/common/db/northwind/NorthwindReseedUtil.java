package com.sourcekraft.documentburster.common.db.northwind;

import java.util.HashMap;
import java.util.Map;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

/**
 * Standalone utility to reseed the Northwind SQLite database without a full repackage.
 * Usage: mvn exec:java -Dexec.mainClass=com.sourcekraft.documentburster.common.db.northwind.NorthwindReseedUtil -Dexec.args="path/to/db/folder"
 */
public class NorthwindReseedUtil {

	public static void main(String[] args) throws Exception {
		if (args.length < 1) {
			System.err.println("Usage: NorthwindReseedUtil <db-folder-path>");
			System.err.println("  e.g.: NorthwindReseedUtil c:/Projects/reportburster/frend/reporting/testground/e2e/db/sample-northwind-sqlite");
			System.exit(1);
		}

		String dbFolder = args[0];
		String dbFile = dbFolder + "/northwind.db";
		String jdbcUrl = "jdbc:sqlite:" + dbFile;

		// Delete old DB if exists
		java.io.File f = new java.io.File(dbFile);
		if (f.exists()) {
			System.out.println("Deleting old northwind.db at: " + dbFile);
			f.delete();
		}

		System.out.println("Creating new northwind.db at: " + dbFile);

		Map<String, String> props = new HashMap<>();
		props.put("jakarta.persistence.jdbc.url", jdbcUrl);
		props.put("jakarta.persistence.jdbc.user", "");
		props.put("jakarta.persistence.jdbc.password", "");
		props.put("jakarta.persistence.schema-generation.database.action", "drop-and-create");
		props.put("hibernate.hbm2ddl.auto", "create");

		EntityManagerFactory emf = Persistence.createEntityManagerFactory("northwind-sqlite", props);
		EntityManager em = emf.createEntityManager();

		try {
			new NorthwindDataGenerator(em).generateAll();
			System.out.println("Successfully seeded northwind.db with expanded data.");
		} finally {
			if (em != null && em.isOpen()) em.close();
			if (emf != null && emf.isOpen()) emf.close();
		}
	}
}
