package com.sourcekraft.documentburster.common.db.northwind;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import com.sourcekraft.documentburster.common.db.northwind.entities.Category;
import com.sourcekraft.documentburster.common.db.northwind.entities.Customer;
import com.sourcekraft.documentburster.common.db.northwind.entities.Employee;
import com.sourcekraft.documentburster.common.db.northwind.entities.Order;
import com.sourcekraft.documentburster.common.db.northwind.entities.OrderDetail;
import com.sourcekraft.documentburster.common.db.northwind.entities.Product;
import com.sourcekraft.documentburster.common.db.northwind.entities.Shipper;
import com.sourcekraft.documentburster.common.db.northwind.entities.Supplier;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;

/**
 * Generates sample data for the Northwind database schema using JPA.
 */
public class NorthwindDataGenerator {

	// Define a fixed reference date for consistent data generation
	public static final LocalDate REFERENCE_DATE = LocalDate.of(2024, 6, 15);
	private static final ZoneId DEFAULT_ZONE_ID = ZoneId.systemDefault();
	private static final Instant REFERENCE_INSTANT = REFERENCE_DATE.atStartOfDay(DEFAULT_ZONE_ID).toInstant();

	private final EntityManager em;

	public NorthwindDataGenerator(EntityManager em) {
		this.em = em;
	}

	/**
	 * Generates all sample data within a single transaction.
	 */
	public void generateAll() throws Exception {
		EntityTransaction tx = null;
		try {
			tx = em.getTransaction();
			tx.begin();

			createCategories();
			createSuppliers();
			createProducts();
			createCustomers(); // Includes German customers for the test
			createEmployees();
			createShippers();
			createOrdersAndDetails(); // Creates orders and links them
			createBulkDashboardOrders(); // Adds ~72 orders spanning 18 months

			tx.commit();
		} catch (Exception e) {
			if (tx != null && tx.isActive()) {
				tx.rollback();
			}
			throw e;
		}
	}

	private void createCategories() {
		Category cat1 = new Category();
		cat1.setCategoryName("Beverages");
		cat1.setDescription("Soft drinks, coffees, teas, beers, and ales");
		em.persist(cat1);

		Category cat2 = new Category();
		cat2.setCategoryName("Condiments");
		cat2.setDescription("Sweet and savory sauces, relishes, spreads, and seasonings");
		em.persist(cat2);

		Category cat3 = new Category();
		cat3.setCategoryName("Confections");
		cat3.setDescription("Desserts, candies, and sweet breads");
		em.persist(cat3);

		Category cat4 = new Category();
		cat4.setCategoryName("Dairy Products");
		cat4.setDescription("Cheeses");
		em.persist(cat4);

		Category cat5 = new Category();
		cat5.setCategoryName("Grains/Cereals");
		cat5.setDescription("Breads, crackers, pasta, and cereal");
		em.persist(cat5);

		Category cat6 = new Category();
		cat6.setCategoryName("Meat/Poultry");
		cat6.setDescription("Prepared meats");
		em.persist(cat6);

		Category cat7 = new Category();
		cat7.setCategoryName("Produce");
		cat7.setDescription("Dried fruit and bean curd");
		em.persist(cat7);

		Category cat8 = new Category();
		cat8.setCategoryName("Seafood");
		cat8.setDescription("Seaweed and fish");
		em.persist(cat8);
	}

	private void createSuppliers() {
		Supplier sup1 = new Supplier();
		sup1.setCompanyName("Exotic Liquids");
		sup1.setContactName("Charlotte Cooper");
		sup1.setContactTitle("Purchasing Manager");
		sup1.setAddress("49 Gilbert St.");
		sup1.setCity("London");
		sup1.setCountry("UK");
		em.persist(sup1);

		Supplier sup2 = new Supplier();
		sup2.setCompanyName("New Orleans Cajun Delights");
		sup2.setContactName("Shelley Burke");
		sup2.setContactTitle("Order Administrator");
		sup2.setAddress("P.O. Box 78934");
		sup2.setCity("New Orleans");
		sup2.setRegion("LA");
		sup2.setCountry("USA");
		em.persist(sup2);

		Supplier sup3 = new Supplier();
		sup3.setCompanyName("Grandma Kellys Homestead");
		sup3.setContactName("Regina Murphy");
		sup3.setContactTitle("Sales Representative");
		sup3.setAddress("707 Oxford Rd.");
		sup3.setCity("Ann Arbor");
		sup3.setRegion("MI");
		sup3.setCountry("USA");
		em.persist(sup3);

		// --- New suppliers ---
		Supplier sup4 = new Supplier();
		sup4.setCompanyName("Tokyo Traders");
		sup4.setContactName("Yoshi Nagase");
		sup4.setContactTitle("Marketing Manager");
		sup4.setAddress("9-8 Sekimai Musashino-shi");
		sup4.setCity("Tokyo");
		sup4.setPostalCode("100");
		sup4.setCountry("Japan");
		sup4.setPhone("(03) 3555-5011");
		em.persist(sup4);

		Supplier sup5 = new Supplier();
		sup5.setCompanyName("Pavlova Ltd");
		sup5.setContactName("Ian Devling");
		sup5.setContactTitle("Marketing Manager");
		sup5.setAddress("74 Rose St. Moonie Ponds");
		sup5.setCity("Melbourne");
		sup5.setRegion("Victoria");
		sup5.setPostalCode("3058");
		sup5.setCountry("Australia");
		sup5.setPhone("(03) 444-2343");
		em.persist(sup5);

		Supplier sup6 = new Supplier();
		sup6.setCompanyName("Pasta Buttini s.r.l.");
		sup6.setContactName("Giovanni Giudici");
		sup6.setContactTitle("Order Administrator");
		sup6.setAddress("Via dei Gelsomini, 153");
		sup6.setCity("Salerno");
		sup6.setPostalCode("84100");
		sup6.setCountry("Italy");
		sup6.setPhone("(089) 6547665");
		em.persist(sup6);
	}

	private void createProducts() {
		// Find categories created earlier
		Category beverages = em
				.createQuery("SELECT c FROM Category c WHERE c.categoryName = 'Beverages'", Category.class)
				.getSingleResult();
		Category condiments = em
				.createQuery("SELECT c FROM Category c WHERE c.categoryName = 'Condiments'", Category.class)
				.getSingleResult();
		Category confections = em
				.createQuery("SELECT c FROM Category c WHERE c.categoryName = 'Confections'", Category.class)
				.getSingleResult();
		Category dairy = em
				.createQuery("SELECT c FROM Category c WHERE c.categoryName = 'Dairy Products'", Category.class)
				.getSingleResult();
		Category grains = em
				.createQuery("SELECT c FROM Category c WHERE c.categoryName = 'Grains/Cereals'", Category.class)
				.getSingleResult();
		Category meat = em
				.createQuery("SELECT c FROM Category c WHERE c.categoryName = 'Meat/Poultry'", Category.class)
				.getSingleResult();
		Category produce = em
				.createQuery("SELECT c FROM Category c WHERE c.categoryName = 'Produce'", Category.class)
				.getSingleResult();
		Category seafood = em.createQuery("SELECT c FROM Category c WHERE c.categoryName = 'Seafood'", Category.class)
				.getSingleResult();

		// Find suppliers
		Supplier exoticLiquids = em
				.createQuery("SELECT s FROM Supplier s WHERE s.companyName = 'Exotic Liquids'", Supplier.class)
				.getSingleResult();
		Supplier cajunDelights = em
				.createQuery("SELECT s FROM Supplier s WHERE s.companyName = 'New Orleans Cajun Delights'",
						Supplier.class)
				.getSingleResult();
		Supplier grandmaKelly = em
				.createQuery("SELECT s FROM Supplier s WHERE s.companyName = 'Grandma Kellys Homestead'",
						Supplier.class)
				.getSingleResult();
		Supplier tokyoTraders = em
				.createQuery("SELECT s FROM Supplier s WHERE s.companyName = 'Tokyo Traders'", Supplier.class)
				.getSingleResult();
		Supplier pavlova = em
				.createQuery("SELECT s FROM Supplier s WHERE s.companyName = 'Pavlova Ltd'", Supplier.class)
				.getSingleResult();
		Supplier pastaButtini = em
				.createQuery("SELECT s FROM Supplier s WHERE s.companyName = 'Pasta Buttini s.r.l.'", Supplier.class)
				.getSingleResult();

		// --- Original 6 products (IDs 1-6) ---

		Product prod1 = new Product();
		prod1.setProductName("Chai");
		prod1.setSupplier(exoticLiquids);
		prod1.setCategory(beverages);
		prod1.setQuantityPerUnit("10 boxes x 20 bags");
		prod1.setUnitPrice(new BigDecimal("18.00"));
		prod1.setUnitsInStock((short) 39);
		prod1.setUnitsOnOrder((short) 0);
		prod1.setReorderLevel((short) 10);
		prod1.setDiscontinued(false);
		em.persist(prod1);

		Product prod2 = new Product();
		prod2.setProductName("Chang");
		prod2.setSupplier(exoticLiquids);
		prod2.setCategory(beverages);
		prod2.setQuantityPerUnit("24 - 12 oz bottles");
		prod2.setUnitPrice(new BigDecimal("19.00"));
		prod2.setUnitsInStock((short) 17);
		prod2.setUnitsOnOrder((short) 40);
		prod2.setReorderLevel((short) 25);
		prod2.setDiscontinued(false);
		em.persist(prod2);

		Product prod3 = new Product();
		prod3.setProductName("Aniseed Syrup");
		prod3.setSupplier(exoticLiquids);
		prod3.setCategory(condiments);
		prod3.setQuantityPerUnit("12 - 550 ml bottles");
		prod3.setUnitPrice(new BigDecimal("10.00"));
		prod3.setUnitsInStock((short) 13);
		prod3.setUnitsOnOrder((short) 70);
		prod3.setReorderLevel((short) 25);
		prod3.setDiscontinued(false);
		em.persist(prod3);

		Product prod4 = new Product();
		prod4.setProductName("Chef Antons Cajun Seasoning");
		prod4.setSupplier(cajunDelights);
		prod4.setCategory(condiments);
		prod4.setQuantityPerUnit("48 - 6 oz jars");
		prod4.setUnitPrice(new BigDecimal("22.00"));
		prod4.setUnitsInStock((short) 53);
		prod4.setUnitsOnOrder((short) 0);
		prod4.setReorderLevel((short) 0);
		prod4.setDiscontinued(false);
		em.persist(prod4);

		Product prod5 = new Product();
		prod5.setProductName("Scottish Longbreads");
		prod5.setSupplier(grandmaKelly);
		prod5.setCategory(confections);
		prod5.setQuantityPerUnit("10 pkgs.");
		prod5.setUnitPrice(new BigDecimal("12.50"));
		prod5.setUnitsInStock((short) 6);
		prod5.setUnitsOnOrder((short) 10);
		prod5.setReorderLevel((short) 15);
		prod5.setDiscontinued(false);
		em.persist(prod5);

		Product prod6 = new Product();
		prod6.setProductName("Boston Crab Meat");
		prod6.setSupplier(grandmaKelly);
		prod6.setCategory(seafood);
		prod6.setQuantityPerUnit("24 - 4 oz tins");
		prod6.setUnitPrice(new BigDecimal("18.40"));
		prod6.setUnitsInStock((short) 123);
		prod6.setUnitsOnOrder((short) 0);
		prod6.setReorderLevel((short) 30);
		prod6.setDiscontinued(false);
		em.persist(prod6);

		// --- New products (IDs 7-20) covering all 8 categories ---

		// Dairy Products (category was empty)
		Product prod7 = new Product();
		prod7.setProductName("Camembert Pierrot");
		prod7.setSupplier(pastaButtini);
		prod7.setCategory(dairy);
		prod7.setQuantityPerUnit("15 - 300 g rounds");
		prod7.setUnitPrice(new BigDecimal("34.00"));
		prod7.setUnitsInStock((short) 19);
		prod7.setUnitsOnOrder((short) 0);
		prod7.setReorderLevel((short) 0);
		prod7.setDiscontinued(false);
		em.persist(prod7);

		Product prod8 = new Product();
		prod8.setProductName("Gorgonzola Telino");
		prod8.setSupplier(pastaButtini);
		prod8.setCategory(dairy);
		prod8.setQuantityPerUnit("12 - 100 g pkgs");
		prod8.setUnitPrice(new BigDecimal("12.50"));
		prod8.setUnitsInStock((short) 0);
		prod8.setUnitsOnOrder((short) 70);
		prod8.setReorderLevel((short) 20);
		prod8.setDiscontinued(false);
		em.persist(prod8);

		// Grains/Cereals (category was empty)
		Product prod9 = new Product();
		prod9.setProductName("Gnocchi di nonna Alice");
		prod9.setSupplier(pastaButtini);
		prod9.setCategory(grains);
		prod9.setQuantityPerUnit("24 - 250 g pkgs.");
		prod9.setUnitPrice(new BigDecimal("38.00"));
		prod9.setUnitsInStock((short) 21);
		prod9.setUnitsOnOrder((short) 10);
		prod9.setReorderLevel((short) 30);
		prod9.setDiscontinued(false);
		em.persist(prod9);

		Product prod10 = new Product();
		prod10.setProductName("Filo Mix");
		prod10.setSupplier(tokyoTraders);
		prod10.setCategory(grains);
		prod10.setQuantityPerUnit("16 - 2 kg boxes");
		prod10.setUnitPrice(new BigDecimal("7.00"));
		prod10.setUnitsInStock((short) 38);
		prod10.setUnitsOnOrder((short) 0);
		prod10.setReorderLevel((short) 25);
		prod10.setDiscontinued(false);
		em.persist(prod10);

		// Meat/Poultry (category was empty)
		Product prod11 = new Product();
		prod11.setProductName("Mishi Kobe Niku");
		prod11.setSupplier(tokyoTraders);
		prod11.setCategory(meat);
		prod11.setQuantityPerUnit("18 - 500 g pkgs.");
		prod11.setUnitPrice(new BigDecimal("97.00"));
		prod11.setUnitsInStock((short) 29);
		prod11.setUnitsOnOrder((short) 0);
		prod11.setReorderLevel((short) 0);
		prod11.setDiscontinued(true);
		em.persist(prod11);

		Product prod12 = new Product();
		prod12.setProductName("Thuringer Rostbratwurst");
		prod12.setSupplier(pavlova);
		prod12.setCategory(meat);
		prod12.setQuantityPerUnit("50 bags x 30 sausgs.");
		prod12.setUnitPrice(new BigDecimal("123.79"));
		prod12.setUnitsInStock((short) 0);
		prod12.setUnitsOnOrder((short) 0);
		prod12.setReorderLevel((short) 0);
		prod12.setDiscontinued(true);
		em.persist(prod12);

		// Produce (category was empty)
		Product prod13 = new Product();
		prod13.setProductName("Uncle Bobs Organic Dried Pears");
		prod13.setSupplier(grandmaKelly);
		prod13.setCategory(produce);
		prod13.setQuantityPerUnit("12 - 1 lb pkgs.");
		prod13.setUnitPrice(new BigDecimal("30.00"));
		prod13.setUnitsInStock((short) 15);
		prod13.setUnitsOnOrder((short) 0);
		prod13.setReorderLevel((short) 10);
		prod13.setDiscontinued(false);
		em.persist(prod13);

		Product prod14 = new Product();
		prod14.setProductName("Tofu");
		prod14.setSupplier(tokyoTraders);
		prod14.setCategory(produce);
		prod14.setQuantityPerUnit("40 - 100 g pkgs.");
		prod14.setUnitPrice(new BigDecimal("23.25"));
		prod14.setUnitsInStock((short) 35);
		prod14.setUnitsOnOrder((short) 0);
		prod14.setReorderLevel((short) 0);
		prod14.setDiscontinued(false);
		em.persist(prod14);

		// More Beverages
		Product prod15 = new Product();
		prod15.setProductName("Guarana Fantastica");
		prod15.setSupplier(cajunDelights);
		prod15.setCategory(beverages);
		prod15.setQuantityPerUnit("12 - 355 ml cans");
		prod15.setUnitPrice(new BigDecimal("4.50"));
		prod15.setUnitsInStock((short) 20);
		prod15.setUnitsOnOrder((short) 0);
		prod15.setReorderLevel((short) 0);
		prod15.setDiscontinued(false);
		em.persist(prod15);

		// More Condiments
		Product prod16 = new Product();
		prod16.setProductName("Genen Shouyu");
		prod16.setSupplier(tokyoTraders);
		prod16.setCategory(condiments);
		prod16.setQuantityPerUnit("24 - 250 ml bottles");
		prod16.setUnitPrice(new BigDecimal("15.50"));
		prod16.setUnitsInStock((short) 39);
		prod16.setUnitsOnOrder((short) 0);
		prod16.setReorderLevel((short) 5);
		prod16.setDiscontinued(false);
		em.persist(prod16);

		// More Confections
		Product prod17 = new Product();
		prod17.setProductName("Pavlova");
		prod17.setSupplier(pavlova);
		prod17.setCategory(confections);
		prod17.setQuantityPerUnit("32 - 500 g boxes");
		prod17.setUnitPrice(new BigDecimal("17.45"));
		prod17.setUnitsInStock((short) 29);
		prod17.setUnitsOnOrder((short) 0);
		prod17.setReorderLevel((short) 10);
		prod17.setDiscontinued(false);
		em.persist(prod17);

		// More Seafood
		Product prod18 = new Product();
		prod18.setProductName("Ikura");
		prod18.setSupplier(tokyoTraders);
		prod18.setCategory(seafood);
		prod18.setQuantityPerUnit("12 - 200 ml jars");
		prod18.setUnitPrice(new BigDecimal("31.00"));
		prod18.setUnitsInStock((short) 31);
		prod18.setUnitsOnOrder((short) 0);
		prod18.setReorderLevel((short) 0);
		prod18.setDiscontinued(false);
		em.persist(prod18);

		// More Dairy
		Product prod19 = new Product();
		prod19.setProductName("Queso Cabrales");
		prod19.setSupplier(pavlova);
		prod19.setCategory(dairy);
		prod19.setQuantityPerUnit("1 kg pkg.");
		prod19.setUnitPrice(new BigDecimal("21.00"));
		prod19.setUnitsInStock((short) 22);
		prod19.setUnitsOnOrder((short) 30);
		prod19.setReorderLevel((short) 30);
		prod19.setDiscontinued(false);
		em.persist(prod19);

		// More Grains
		Product prod20 = new Product();
		prod20.setProductName("Ravioli Angelo");
		prod20.setSupplier(pastaButtini);
		prod20.setCategory(grains);
		prod20.setQuantityPerUnit("24 - 250 g pkgs.");
		prod20.setUnitPrice(new BigDecimal("19.50"));
		prod20.setUnitsInStock((short) 36);
		prod20.setUnitsOnOrder((short) 0);
		prod20.setReorderLevel((short) 20);
		prod20.setDiscontinued(false);
		em.persist(prod20);
	}

	private void createCustomers() {
		// German Customers (11 total for the test)
		createCustomer("ALFKI", "Alfreds Futterkiste", "Maria Anders", "Sales Representative", "Obere Str. 57",
				"Berlin", null, "12209", "Germany", "030-0074321", "030-0076545");
		createCustomer("BLAUS", "Blauer See Delikatessen", "Hanna Moos", "Sales Representative", "Forsterstr. 57",
				"Mannheim", null, "68306", "Germany", "0621-08460", "0621-08924");
		createCustomer("DRACD", "Drachenblut Delikatessen", "Sven Ottlieb", "Order Administrator", "Walserweg 21",
				"Aachen", null, "52066", "Germany", "0241-039123", "0241-059428");
		createCustomer("FRANK", "Frankenversand", "Peter Franken", "Marketing Manager", "Berliner Platz 43", "München",
				null, "80805", "Germany", "089-0877310", "089-0877451");
		createCustomer("KOENE", "Königlich Essen", "Philip Cramer", "Sales Associate", "Maubelstr. 90", "Brandenburg",
				null, "14776", "Germany", "0555-09876", null);
		createCustomer("LEHMS", "Lehmanns Marktstand", "Renate Messner", "Sales Representative", "Magazinweg 7",
				"Frankfurt a.M.", null, "60528", "Germany", "069-0245984", "069-0245874");
		createCustomer("MORGK", "Morgenstern Gesundkost", "Alexander Feuer", "Marketing Assistant", "Heerstr. 22",
				"Leipzig", null, "04179", "Germany", "0342-023176", null);
		createCustomer("OTTIK", "Ottilies Käseladen", "Henriette Pfalzheim", "Owner", "Mehrheimerstr. 369", "Köln",
				null, "50739", "Germany", "0221-0644327", "0221-0765721");
		createCustomer("QUICK", "QUICK-Stop", "Horst Kloss", "Accounting Manager", "Taucherstraße 10", "Cunewalde",
				null, "01307", "Germany", "0372-035188", null);
		createCustomer("TOMSP", "Toms Spezialitäten", "Karin Josephs", "Marketing Manager", "Luisenstr. 48", "Münster",
				null, "44087", "Germany", "0251-031259", "0251-035695");
		createCustomer("WANDK", "Die Wandernde Kuh", "Rita Müller", "Sales Representative", "Adenauerallee 900",
				"Stuttgart", null, "70563", "Germany", "0711-020361", "0711-035428");

		// Other Customers (original 4)
		createCustomer("ANATR", "Ana Trujillo Emparedados y helados", "Ana Trujillo", "Owner",
				"Avda. de la Constitución 2222", "México D.F.", null, "05021", "Mexico", "(5) 555-4729",
				"(5) 555-3745");
		createCustomer("ANTON", "Antonio Moreno Taquería", "Antonio Moreno", "Owner", "Mataderos 2312", "México D.F.",
				null, "05023", "Mexico", "(5) 555-3932", null);
		createCustomer("AROUT", "Around the Horn", "Thomas Hardy", "Sales Representative", "120 Hanover Sq.", "London",
				null, "WA1 1DP", "UK", "(171) 555-7788", "(171) 555-6750");
		createCustomer("BERGS", "Berglunds snabbköp", "Christina Berglund", "Order Administrator", "Berguvsvägen 8",
				"Luleå", null, "S-958 22", "Sweden", "0921-12 34 65", "0921-12 34 67");

		// --- New customers in diverse countries ---
		createCustomer("BONAP", "Bon app'", "Laurence Lebihan", "Owner", "12, rue des Bouchers",
				"Marseille", null, "13008", "France", "91.24.45.40", "91.24.45.41");
		createCustomer("CACTU", "Cactus Comidas para llevar", "Patricio Simpson", "Sales Agent", "Cerrito 333",
				"Buenos Aires", null, "1010", "Argentina", "(1) 135-5555", "(1) 135-4892");
		createCustomer("DUMON", "Du monde entier", "Janine Labrune", "Owner", "67, rue des Cinquante Otages",
				"Nantes", null, "44000", "France", "40.67.88.88", "40.67.89.89");
		createCustomer("ERNSH", "Ernst Handel", "Roland Mendel", "Sales Manager", "Kirchgasse 6",
				"Graz", null, "8010", "Austria", "7675-3425", "7675-3426");
		createCustomer("FOLKO", "Folk och fä HB", "Maria Larsson", "Owner", "Åkergatan 24",
				"Bräcke", null, "S-844 67", "Sweden", "0695-34 67 21", null);
		createCustomer("GREAL", "Great Lakes Food Market", "Howard Snyder", "Marketing Manager", "2732 Baker Blvd.",
				"Eugene", "OR", "97403", "USA", "(503) 555-7555", null);
		createCustomer("HILAA", "HILARION-Abastos", "Carlos Hernandez", "Sales Representative", "Carrera 22 con Ave.",
				"San Cristóbal", "Táchira", "5022", "Venezuela", "(5) 555-1340", "(5) 555-1948");
		createCustomer("ISLAT", "Island Trading", "Helen Bennett", "Marketing Manager", "Garden House Crowther Way",
				"Cowes", "Isle of Wight", "PO31 7PJ", "UK", "(198) 555-8888", null);
		createCustomer("LILAS", "LILA-Supermercado", "Carlos Gonzalez", "Accounting Manager", "Carrera 52 con Ave.",
				"Barquisimeto", "Lara", "3508", "Venezuela", "(9) 331-6954", "(9) 331-7256");
		createCustomer("MAGAA", "Magazzini Alimentari Riuniti", "Giovanni Rovelli", "Marketing Manager", "Via Ludovico il Moro 22",
				"Bergamo", null, "24100", "Italy", "035-640230", "035-640231");
	}

	private void createCustomer(String id, String company, String contact, String title, String address, String city,
			String region, String postal, String country, String phone, String fax) {
		Customer cust = new Customer();
		cust.setCustomerId(id);
		cust.setCompanyName(company);
		cust.setContactName(contact);
		cust.setContactTitle(title);
		cust.setAddress(address);
		cust.setCity(city);
		cust.setRegion(region);
		cust.setPostalCode(postal);
		cust.setCountry(country);
		cust.setPhone(phone);
		cust.setFax(fax);
		em.persist(cust);
	}

	private void createEmployees() {
		Employee emp1 = new Employee();
		emp1.setLastName("Davolio");
		emp1.setFirstName("Nancy");
		emp1.setTitle("Sales Representative");
		emp1.setBirthDate(LocalDate.of(1948, 12, 8));
		emp1.setHireDate(LocalDate.of(1992, 5, 1));
		emp1.setAddress("507 - 20th Ave. E.\nApt. 2A");
		emp1.setCity("Seattle");
		emp1.setRegion("WA");
		emp1.setCountry("USA");
		em.persist(emp1);

		Employee emp2 = new Employee();
		emp2.setLastName("Fuller");
		emp2.setFirstName("Andrew");
		emp2.setTitle("Vice President, Sales");
		emp2.setBirthDate(LocalDate.of(1952, 2, 19));
		emp2.setHireDate(LocalDate.of(1992, 8, 14));
		emp2.setAddress("908 W. Capital Way");
		emp2.setCity("Tacoma");
		emp2.setRegion("WA");
		emp2.setCountry("USA");
		emp2.setManager(null); // Corrected method name
		em.persist(emp2);

		// Make emp1 report to emp2
		emp1.setManager(emp2); // Corrected method name
		em.merge(emp1); // Merge since emp1 was already persisted

		Employee emp3 = new Employee();
		emp3.setLastName("Leverling");
		emp3.setFirstName("Janet");
		emp3.setTitle("Sales Representative");
		emp3.setBirthDate(LocalDate.of(1963, 8, 30));
		emp3.setHireDate(LocalDate.of(1992, 4, 1));
		emp3.setAddress("722 Moss Bay Blvd.");
		emp3.setCity("Kirkland");
		emp3.setRegion("WA");
		emp3.setCountry("USA");
		emp3.setManager(emp2); // Corrected method name
		em.persist(emp3);
	}

	private void createShippers() {
		Shipper shp1 = new Shipper();
		shp1.setCompanyName("Speedy Express");
		shp1.setPhone("(503) 555-9831");
		em.persist(shp1);

		Shipper shp2 = new Shipper();
		shp2.setCompanyName("United Package");
		shp2.setPhone("(503) 555-3199");
		em.persist(shp2);

		Shipper shp3 = new Shipper();
		shp3.setCompanyName("Federal Shipping");
		shp3.setPhone("(503) 555-9931");
		em.persist(shp3);
	}

	private void createOrdersAndDetails() {
		// Find customers, employees, shippers, products created earlier
		Customer alfki = em.find(Customer.class, "ALFKI");
		Customer anatr = em.find(Customer.class, "ANATR");
		Customer arout = em.find(Customer.class, "AROUT"); // Find UK customer
		Customer bergs = em.find(Customer.class, "BERGS"); // Find Sweden customer

		Employee nancy = em.createQuery("SELECT e FROM Employee e WHERE e.firstName = 'Nancy'", Employee.class)
				.getSingleResult();
		Employee janet = em.createQuery("SELECT e FROM Employee e WHERE e.firstName = 'Janet'", Employee.class)
				.getSingleResult();

		Shipper speedy = em.createQuery("SELECT s FROM Shipper s WHERE s.companyName = 'Speedy Express'", Shipper.class)
				.getSingleResult();
		Shipper united = em.createQuery("SELECT s FROM Shipper s WHERE s.companyName = 'United Package'", Shipper.class)
				.getSingleResult();
		Shipper federal = em
				.createQuery("SELECT s FROM Shipper s WHERE s.companyName = 'Federal Shipping'", Shipper.class)
				.getSingleResult();

		Product chai = em.createQuery("SELECT p FROM Product p WHERE p.productName = 'Chai'", Product.class)
				.getSingleResult();
		Product chang = em.createQuery("SELECT p FROM Product p WHERE p.productName = 'Chang'", Product.class)
				.getSingleResult();
		Product syrup = em.createQuery("SELECT p FROM Product p WHERE p.productName = 'Aniseed Syrup'", Product.class)
				.getSingleResult();
		Product cajunSeasoning = em
				.createQuery("SELECT p FROM Product p WHERE p.productName = 'Chef Antons Cajun Seasoning'",
						Product.class)
				.getSingleResult();
		Product longbreads = em
				.createQuery("SELECT p FROM Product p WHERE p.productName = 'Scottish Longbreads'", Product.class)
				.getSingleResult();
		Product crabMeat = em
				.createQuery("SELECT p FROM Product p WHERE p.productName = 'Boston Crab Meat'", Product.class)
				.getSingleResult();

		// --- Add orders spanning multiple months ---
		// Use REFERENCE_DATE for calculations

		// Order ~3 months ago (Order 5)
		Order order5 = new Order();
		order5.setCustomer(alfki); // Use ALFKI
		order5.setEmployee(nancy); // Use Nancy
		order5.setOrderDate(
				REFERENCE_DATE.minusMonths(3).withDayOfMonth(15).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
		order5.setRequiredDate(
				REFERENCE_DATE.minusMonths(3).withDayOfMonth(25).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
		order5.setShippedDate(
				REFERENCE_DATE.minusMonths(3).withDayOfMonth(20).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
		order5.setShipper(speedy); // Use Speedy
		order5.setFreight(new BigDecimal("25.10"));
		order5.setShipName(alfki.getCompanyName());
		order5.setShipAddress(alfki.getAddress());
		order5.setShipCity(alfki.getCity());
		order5.setShipPostalCode(alfki.getPostalCode());
		order5.setShipCountry(alfki.getCountry());
		em.persist(order5);
		// Add details for order5
		OrderDetail detail5_1 = new OrderDetail();
		detail5_1.setOrder(order5);
		detail5_1.setProduct(crabMeat); // Use Crab Meat
		detail5_1.setUnitPrice(crabMeat.getUnitPrice());
		detail5_1.setQuantity((short) 5);
		detail5_1.setDiscount(BigDecimal.ZERO);
		em.persist(detail5_1);
		OrderDetail detail5_2 = new OrderDetail(); // Add another item
		detail5_2.setOrder(order5);
		detail5_2.setProduct(chai); // Use Chai
		detail5_2.setUnitPrice(chai.getUnitPrice());
		detail5_2.setQuantity((short) 3);
		detail5_2.setDiscount(new BigDecimal("0.05")); // 5% discount
		em.persist(detail5_2);

		// Order ~2 months ago (Order 6)
		Order order6 = new Order();
		order6.setCustomer(anatr); // Use ANATR
		order6.setEmployee(janet); // Use Janet
		order6.setOrderDate(
				REFERENCE_DATE.minusMonths(2).withDayOfMonth(5).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
		order6.setRequiredDate(
				REFERENCE_DATE.minusMonths(2).withDayOfMonth(15).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
		// ShippedDate null
		order6.setShipper(united); // Use United
		order6.setFreight(new BigDecimal("15.50"));
		order6.setShipName(anatr.getCompanyName());
		order6.setShipAddress(anatr.getAddress());
		order6.setShipCity(anatr.getCity());
		order6.setShipPostalCode(anatr.getPostalCode());
		order6.setShipCountry(anatr.getCountry());
		em.persist(order6);
		// Add details for order6
		OrderDetail detail6_1 = new OrderDetail();
		detail6_1.setOrder(order6);
		detail6_1.setProduct(syrup); // Use Syrup
		detail6_1.setUnitPrice(syrup.getUnitPrice());
		detail6_1.setQuantity((short) 10);
		detail6_1.setDiscount(new BigDecimal("0.05")); // 5% discount
		em.persist(detail6_1);
		OrderDetail detail6_2 = new OrderDetail();
		detail6_2.setOrder(order6);
		detail6_2.setProduct(longbreads); // Use Longbreads
		detail6_2.setUnitPrice(longbreads.getUnitPrice());
		detail6_2.setQuantity((short) 4);
		detail6_2.setDiscount(BigDecimal.ZERO);
		em.persist(detail6_2);

		// Order ~1 month ago (Order 7)
		Order order7 = new Order();
		order7.setCustomer(bergs); // Use BERGS
		order7.setEmployee(nancy); // Use Nancy
		order7.setOrderDate(
				REFERENCE_DATE.minusMonths(1).withDayOfMonth(20).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
		order7.setRequiredDate(
				REFERENCE_DATE.minusMonths(1).withDayOfMonth(30).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
		order7.setShippedDate(
				REFERENCE_DATE.minusMonths(1).withDayOfMonth(25).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
		order7.setShipper(federal); // Use Federal
		order7.setFreight(new BigDecimal("40.00"));
		order7.setShipName(bergs.getCompanyName());
		order7.setShipAddress(bergs.getAddress());
		order7.setShipCity(bergs.getCity());
		order7.setShipPostalCode(bergs.getPostalCode());
		order7.setShipCountry(bergs.getCountry());
		em.persist(order7);
		// Add details for order7
		OrderDetail detail7_1 = new OrderDetail();
		detail7_1.setOrder(order7);
		detail7_1.setProduct(chai); // Use Chai
		detail7_1.setUnitPrice(chai.getUnitPrice());
		detail7_1.setQuantity((short) 8);
		detail7_1.setDiscount(BigDecimal.ZERO);
		em.persist(detail7_1);
		OrderDetail detail7_2 = new OrderDetail();
		detail7_2.setOrder(order7);
		detail7_2.setProduct(cajunSeasoning); // Use Cajun Seasoning
		detail7_2.setUnitPrice(cajunSeasoning.getUnitPrice());
		detail7_2.setQuantity((short) 3);
		detail7_2.setDiscount(new BigDecimal("0.10")); // 10% discount
		em.persist(detail7_2);
		OrderDetail detail7_3 = new OrderDetail(); // Add a third item
		detail7_3.setOrder(order7);
		detail7_3.setProduct(chang); // Use Chang
		detail7_3.setUnitPrice(chang.getUnitPrice());
		detail7_3.setQuantity((short) 5);
		detail7_3.setDiscount(BigDecimal.ZERO);
		em.persist(detail7_3);
		// --- End of added orders ---

		// Order 1 for ALFKI (Existing) - Use REFERENCE_INSTANT
		Order order1 = new Order();
		order1.setCustomer(alfki);
		order1.setEmployee(janet);
		order1.setOrderDate(REFERENCE_INSTANT.minusSeconds(86400 * 10).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		order1.setRequiredDate(REFERENCE_INSTANT.minusSeconds(86400 * 3).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		order1.setShippedDate(REFERENCE_INSTANT.minusSeconds(86400 * 5).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		order1.setShipper(speedy); // Corrected method name
		order1.setFreight(new BigDecimal("32.38"));
		order1.setShipName("Alfreds Futterkiste");
		order1.setShipAddress("Obere Str. 57");
		order1.setShipCity("Berlin");
		order1.setShipPostalCode("12209");
		order1.setShipCountry("Germany");
		em.persist(order1);

		OrderDetail detail1_1 = new OrderDetail();
		detail1_1.setOrder(order1);
		detail1_1.setProduct(chai);
		detail1_1.setUnitPrice(chai.getUnitPrice());
		detail1_1.setQuantity((short) 12);
		detail1_1.setDiscount(BigDecimal.ZERO);
		em.persist(detail1_1);

		OrderDetail detail1_2 = new OrderDetail();
		detail1_2.setOrder(order1);
		detail1_2.setProduct(chang);
		detail1_2.setUnitPrice(chang.getUnitPrice());
		detail1_2.setQuantity((short) 10);
		detail1_2.setDiscount(BigDecimal.ZERO);
		em.persist(detail1_2);

		// Order 2 for ANATR (Existing) - Use REFERENCE_INSTANT
		Order order2 = new Order();
		order2.setCustomer(anatr);
		order2.setEmployee(nancy);
		order2.setOrderDate(REFERENCE_INSTANT.minusSeconds(86400 * 5).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		order2.setRequiredDate(REFERENCE_INSTANT.plusSeconds(86400 * 10).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		// ShippedDate is null
		order2.setShipper(united); // Corrected method name
		order2.setFreight(new BigDecimal("11.61"));
		order2.setShipName("Ana Trujillo Emparedados y helados");
		order2.setShipAddress("Avda. de la Constitución 2222");
		order2.setShipCity("México D.F.");
		order2.setShipPostalCode("05021");
		order2.setShipCountry("Mexico");
		em.persist(order2);

		OrderDetail detail2_1 = new OrderDetail();
		detail2_1.setOrder(order2);
		detail2_1.setProduct(syrup);
		detail2_1.setUnitPrice(syrup.getUnitPrice());
		detail2_1.setQuantity((short) 3);
		detail2_1.setDiscount(new BigDecimal("0.05"));
		em.persist(detail2_1);

		// Order 3 for AROUT (UK) - New - Use REFERENCE_INSTANT
		Order order3 = new Order();
		order3.setCustomer(arout);
		order3.setEmployee(nancy); // Use Nancy
		// Make RequiredDate slightly earlier to potentially make it late
		order3.setOrderDate(REFERENCE_INSTANT.minusSeconds(86400 * 8).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		order3.setRequiredDate(REFERENCE_INSTANT.minusSeconds(86400 * 3).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		order3.setShippedDate(REFERENCE_INSTANT.minusSeconds(86400 * 2).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		order3.setShipper(federal); // Use Federal Shipping
		order3.setFreight(new BigDecimal("45.50"));
		order3.setShipName("Around the Horn");
		order3.setShipAddress("120 Hanover Sq.");
		order3.setShipCity("London");
		order3.setShipPostalCode("WA1 1DP");
		order3.setShipCountry("UK");
		em.persist(order3);

		// Detail 3.1 (Confections - Supplier 3)
		OrderDetail detail3_1 = new OrderDetail();
		detail3_1.setOrder(order3);
		detail3_1.setProduct(longbreads); // Scottish Longbreads (Supplier 3)
		detail3_1.setUnitPrice(longbreads.getUnitPrice());
		detail3_1.setQuantity((short) 5);
		detail3_1.setDiscount(new BigDecimal("0.10")); // 10% discount
		em.persist(detail3_1);

		// Detail 3.2 (Condiments - Supplier 2)
		OrderDetail detail3_2 = new OrderDetail();
		detail3_2.setOrder(order3);
		detail3_2.setProduct(cajunSeasoning); // Cajun Seasoning (Supplier 2)
		detail3_2.setUnitPrice(cajunSeasoning.getUnitPrice());
		detail3_2.setQuantity((short) 2);
		detail3_2.setDiscount(BigDecimal.ZERO);
		em.persist(detail3_2);

		// Order 4 for BERGS (Sweden) - New - Use REFERENCE_INSTANT
		Order order4 = new Order();
		order4.setCustomer(bergs);
		order4.setEmployee(janet); // Use Janet
		order4.setOrderDate(REFERENCE_INSTANT.minusSeconds(86400 * 3).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		order4.setRequiredDate(REFERENCE_INSTANT.plusSeconds(86400 * 15).atZone(DEFAULT_ZONE_ID).toLocalDateTime());
		// ShippedDate is null
		order4.setShipper(united); // Use United Package
		order4.setFreight(new BigDecimal("22.75"));
		order4.setShipName("Berglunds snabbköp");
		order4.setShipAddress("Berguvsvägen 8");
		order4.setShipCity("Luleå");
		order4.setShipPostalCode("S-958 22");
		order4.setShipCountry("Sweden");
		em.persist(order4);

		// Detail 4.1 (Seafood)
		OrderDetail detail4_1 = new OrderDetail();
		detail4_1.setOrder(order4);
		detail4_1.setProduct(crabMeat); // Boston Crab Meat
		detail4_1.setUnitPrice(crabMeat.getUnitPrice());
		detail4_1.setQuantity((short) 8);
		detail4_1.setDiscount(BigDecimal.ZERO);
		em.persist(detail4_1);
	}

	/**
	 * Creates ~72 bulk orders spanning 18 months across all customers,
	 * covering all product categories for meaningful dashboard visualizations.
	 */
	private void createBulkDashboardOrders() {
		// Load all entities for rotation
		List<Customer> customers = em
				.createQuery("SELECT c FROM Customer c ORDER BY c.customerId", Customer.class)
				.getResultList();
		List<Employee> employees = em
				.createQuery("SELECT e FROM Employee e", Employee.class)
				.getResultList();
		List<Shipper> shippers = em
				.createQuery("SELECT s FROM Shipper s", Shipper.class)
				.getResultList();
		List<Product> products = em
				.createQuery("SELECT p FROM Product p", Product.class)
				.getResultList();

		int orderCount = 72; // 4 orders per month for 18 months
		LocalDate startDate = REFERENCE_DATE.minusMonths(18);

		for (int i = 0; i < orderCount; i++) {
			Customer customer = customers.get(i % customers.size());
			Employee employee = employees.get(i % employees.size());
			Shipper shipper = shippers.get(i % shippers.size());

			// Distribute orders: 4 per month across 18 months
			int monthOffset = i / 4;
			int dayOfMonth = 5 + (i % 4) * 7; // days 5, 12, 19, 26
			LocalDate orderDate = startDate.plusMonths(monthOffset)
					.withDayOfMonth(Math.min(dayOfMonth, 28));

			// ~2/3 of orders are shipped
			boolean shipped = (i % 3 != 0);

			Order order = new Order();
			order.setCustomer(customer);
			order.setEmployee(employee);
			order.setOrderDate(orderDate.atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
			order.setRequiredDate(orderDate.plusDays(14).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
			if (shipped) {
				order.setShippedDate(
						orderDate.plusDays(3 + (i % 7)).atStartOfDay(DEFAULT_ZONE_ID).toLocalDateTime());
			}
			order.setShipper(shipper);
			order.setFreight(new BigDecimal(10 + (i * 7 % 90) + "." + String.format("%02d", i * 3 % 100)));
			order.setShipName(customer.getCompanyName());
			order.setShipAddress(customer.getAddress());
			order.setShipCity(customer.getCity());
			order.setShipPostalCode(customer.getPostalCode());
			order.setShipCountry(customer.getCountry());
			em.persist(order);

			// Each order has 2 or 3 details
			int detailCount = 2 + (i % 2);
			for (int j = 0; j < detailCount; j++) {
				Product product = products.get((i * 3 + j) % products.size());
				OrderDetail detail = new OrderDetail();
				detail.setOrder(order);
				detail.setProduct(product);
				detail.setUnitPrice(product.getUnitPrice());
				detail.setQuantity((short) (2 + (i + j) % 20));
				detail.setDiscount(j == 0 ? BigDecimal.ZERO : new BigDecimal("0.05"));
				em.persist(detail);
			}
		}
	}
}
