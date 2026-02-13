package com.sourcekraft.documentburster.common.db.northwind;

import java.util.*;

/**
 * Deterministic OLAP data generator for the Northwind Data Warehouse.
 *
 * Generates ~8,000 fact rows (sales line items) with rich dimensional diversity
 * for quality OLAP/pivot-table e2e testing across Browser, DuckDB, and ClickHouse.
 *
 * IMPORTANT: This class is the SINGLE SOURCE OF TRUTH for all 3 engines.
 * - DuckDBDataWarehouseCreator calls this to populate star schema tables
 * - ClickHouseDataWarehouseCreator calls this to populate star schema tables
 * - The Groovy mock script (piv-northwind-warehouse-browser) calls generateSalesDetailRows()
 *
 * Deterministic: Random(SEED=42) guarantees identical data across all invocations.
 * Do NOT change the Random call sequence without updating all 3 consumers.
 */
public class NorthwindOlapDataGenerator {

    public static final long SEED = 42;

    // ─── DIMENSION DATA ───────────────────────────────────────────────────

    /** Countries: {country, continent} */
    private static final String[][] COUNTRIES = {
        {"USA", "North America"},
        {"Canada", "North America"},
        {"Mexico", "North America"},
        {"Brazil", "South America"},
        {"Argentina", "South America"},
        {"UK", "Europe"},
        {"Germany", "Europe"},
        {"France", "Europe"},
        {"Italy", "Europe"},
        {"Sweden", "Other"}
    };

    /** Customers: {company_name, country} — 3 per country = 30 total */
    private static final String[][] CUSTOMERS = {
        {"Global Foods Inc", "USA"},
        {"American Delights", "USA"},
        {"Pacific Trading Co", "USA"},
        {"Maple Leaf Foods", "Canada"},
        {"Northern Harvest", "Canada"},
        {"Canadian Provisions", "Canada"},
        {"Tortilla Express", "Mexico"},
        {"Aztec Imports", "Mexico"},
        {"Mexican Spice Co", "Mexico"},
        {"Rio Grande Foods", "Brazil"},
        {"Amazonia Trading", "Brazil"},
        {"São Paulo Imports", "Brazil"},
        {"Buenos Aires Gourmet", "Argentina"},
        {"Pampas Provisions", "Argentina"},
        {"Andean Flavors", "Argentina"},
        {"London Traders", "UK"},
        {"British Delicacies", "UK"},
        {"Crown Foods", "UK"},
        {"Berliner Delikatessen", "Germany"},
        {"Münchner Feinkost", "Germany"},
        {"Hamburg Trading", "Germany"},
        {"Paris Gourmand", "France"},
        {"Lyon Provisions", "France"},
        {"French Delights", "France"},
        {"Roma Specialità", "Italy"},
        {"Venetian Imports", "Italy"},
        {"Milano Trading", "Italy"},
        {"Stockholm Supplies", "Sweden"},
        {"Nordic Delicacies", "Sweden"},
        {"Scandinavian Foods", "Sweden"}
    };

    /** Products: {product_name, category_name, base_price} — 2 per category = 16 total */
    private static final Object[][] PRODUCTS = {
        {"Chai Tea", "Beverages", 18.00},
        {"Colombian Coffee", "Beverages", 24.00},
        {"Cajun Seasoning", "Condiments", 10.00},
        {"Dijon Mustard", "Condiments", 15.00},
        {"Dark Chocolate Truffles", "Confections", 12.50},
        {"Vanilla Cream Cookies", "Confections", 20.00},
        {"Aged Cheddar", "Dairy Products", 25.00},
        {"Gouda Wheel", "Dairy Products", 35.00},
        {"Organic Quinoa", "Grains/Cereals", 8.00},
        {"Artisan Sourdough", "Grains/Cereals", 14.00},
        {"Wagyu Beef Strips", "Meat/Poultry", 45.00},
        {"Free-Range Chicken", "Meat/Poultry", 28.00},
        {"Heirloom Tomatoes", "Produce", 6.00},
        {"California Avocados", "Produce", 10.00},
        {"Atlantic Salmon", "Seafood", 32.00},
        {"Pacific Prawns", "Seafood", 38.00}
    };

    /** Employees: {full_name, title} */
    private static final String[][] EMPLOYEES = {
        {"Nancy Davolio", "Sales Representative"},
        {"Andrew Fuller", "Vice President, Sales"},
        {"Janet Leverling", "Sales Representative"}
    };

    /** Discount rates */
    private static final double[] DISCOUNTS = {0.0, 0.0, 0.05, 0.10, 0.15, 0.20};
    // Two 0.0 entries: 33% chance of no discount (realistic)

    /** Market size multiplier per country (controls row count per country-quarter) */
    private static final double[] MARKET_SIZES = {
        1.50, // USA (largest)
        0.90, // Canada
        0.80, // Mexico
        0.70, // Brazil
        0.55, // Argentina
        1.10, // UK
        1.30, // Germany
        1.20, // France
        1.00, // Italy
        0.50  // Sweden (smallest)
    };

    /** Month names */
    private static final String[] MONTH_NAMES = {
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    };

    // ─── PRODUCT POPULARITY BY CONTINENT ──────────────────────────────────
    // Category index: 0=Beverages, 1=Condiments, 2=Confections, 3=Dairy,
    //                 4=Grains, 5=Meat, 6=Produce, 7=Seafood
    // Rows: [NorthAmerica, SouthAmerica, Europe, Other]
    private static final double[][] CATEGORY_WEIGHTS = {
        {1.0, 1.0, 1.3, 1.2},  // Beverages: popular everywhere, esp. Europe
        {1.4, 0.8, 0.9, 0.7},  // Condiments: popular N.America
        {0.8, 0.7, 1.4, 1.0},  // Confections: popular Europe
        {0.7, 0.5, 1.6, 0.8},  // Dairy: very popular Europe
        {0.8, 1.5, 0.7, 0.9},  // Grains: popular S.America
        {1.4, 1.2, 0.7, 0.6},  // Meat: popular Americas
        {1.0, 1.0, 1.0, 1.0},  // Produce: uniform
        {0.8, 0.7, 1.3, 1.5}   // Seafood: popular Europe + coastal (Other=Sweden)
    };

    // ─── PUBLIC API ───────────────────────────────────────────────────────

    /**
     * Generate denormalized sales detail rows (equivalent to vw_sales_detail SELECT).
     * This is the main method called by the Groovy mock script.
     *
     * Columns: sales_key, year, quarter, year_quarter, month_name,
     *          customer_name, customer_country, continent,
     *          category_name, product_name, employee_name,
     *          quantity, unit_price, net_revenue, gross_revenue
     */
    public static List<LinkedHashMap<String, Object>> generateSalesDetailRows() {
        Random rand = new Random(SEED);
        List<LinkedHashMap<String, Object>> rows = new ArrayList<>(8500);
        int salesKey = 0;

        for (int year = 2023; year <= 2024; year++) {
            double yearGrowth = (year == 2024) ? 1.05 : 1.0;

            for (int quarter = 1; quarter <= 4; quarter++) {
                double seasonal = getSeasonalFactor(quarter);

                for (int ci = 0; ci < COUNTRIES.length; ci++) {
                    String country = COUNTRIES[ci][0];
                    String continent = COUNTRIES[ci][1];
                    double marketSize = MARKET_SIZES[ci];

                    // ~100 rows per country-quarter on average, varies by market/season/year
                    int baseCount = (int) (100.0 * seasonal * yearGrowth * marketSize);
                    int numRows = Math.max(20, baseCount + rand.nextInt(11) - 5);

                    for (int r = 0; r < numRows; r++) {
                        salesKey++;

                        // Customer from this country
                        int custIdx = getCountryCustomerStart(ci) + rand.nextInt(3);
                        String customerName = CUSTOMERS[custIdx][0];

                        // Product (weighted by regional preference)
                        int prodIdx = selectWeightedProduct(rand, continent);
                        String productName = (String) PRODUCTS[prodIdx][0];
                        String categoryName = (String) PRODUCTS[prodIdx][1];
                        double basePrice = (double) PRODUCTS[prodIdx][2];

                        // Employee
                        int empIdx = rand.nextInt(EMPLOYEES.length);
                        String employeeName = EMPLOYEES[empIdx][0];

                        // Date within quarter
                        int month = getMonthInQuarter(quarter, rand);
                        int day = rand.nextInt(28) + 1;
                        String monthName = MONTH_NAMES[month - 1];
                        String yearQuarter = year + "-Q" + quarter;

                        // Measures
                        int quantity = 5 + rand.nextInt(46); // 5-50
                        double discount = DISCOUNTS[rand.nextInt(DISCOUNTS.length)];
                        double unitPrice = round2(basePrice * (0.90 + rand.nextDouble() * 0.20));
                        double grossRevenue = round2(quantity * unitPrice);
                        double netRevenue = round2(grossRevenue * (1.0 - discount));

                        LinkedHashMap<String, Object> row = new LinkedHashMap<>();
                        row.put("sales_key", salesKey);
                        row.put("year", year);
                        row.put("quarter", quarter);
                        row.put("year_quarter", yearQuarter);
                        row.put("month_name", monthName);
                        row.put("customer_name", customerName);
                        row.put("customer_country", country);
                        row.put("continent", continent);
                        row.put("category_name", categoryName);
                        row.put("product_name", productName);
                        row.put("employee_name", employeeName);
                        row.put("quantity", quantity);
                        row.put("unit_price", unitPrice);
                        row.put("net_revenue", netRevenue);
                        row.put("gross_revenue", grossRevenue);

                        rows.add(row);
                    }
                }
            }
        }

        return rows;
    }

    /**
     * Column names matching the reporting.xml SELECT and Groovy ctx.reportColumnNames.
     */
    public static List<String> getColumnNames() {
        return Arrays.asList(
            "sales_key", "year", "quarter", "year_quarter", "month_name",
            "customer_name", "customer_country", "continent",
            "category_name", "product_name", "employee_name",
            "quantity", "unit_price", "net_revenue", "gross_revenue"
        );
    }

    // ─── DIMENSION TABLE DATA (for DuckDB / ClickHouse star schema) ──────

    /** dim_customer: customer_key(1-based), company_name, country, continent */
    public static List<Object[]> getDimCustomers() {
        List<Object[]> list = new ArrayList<>(CUSTOMERS.length);
        for (int i = 0; i < CUSTOMERS.length; i++) {
            String country = CUSTOMERS[i][1];
            String continent = getContinentForCountry(country);
            list.add(new Object[]{i + 1, CUSTOMERS[i][0], country, continent});
        }
        return list;
    }

    /** dim_product: product_key(1-based), product_name, category_name, list_price */
    public static List<Object[]> getDimProducts() {
        List<Object[]> list = new ArrayList<>(PRODUCTS.length);
        for (int i = 0; i < PRODUCTS.length; i++) {
            list.add(new Object[]{i + 1, PRODUCTS[i][0], PRODUCTS[i][1], PRODUCTS[i][2]});
        }
        return list;
    }

    /** dim_employee: employee_key(1-based), full_name, title */
    public static List<Object[]> getDimEmployees() {
        List<Object[]> list = new ArrayList<>(EMPLOYEES.length);
        for (int i = 0; i < EMPLOYEES.length; i++) {
            list.add(new Object[]{i + 1, EMPLOYEES[i][0], EMPLOYEES[i][1]});
        }
        return list;
    }

    /**
     * dim_time: date_key(YYYY-MM-DD), year, quarter, year_quarter, month, month_name
     * All unique dates from the generated fact data.
     */
    public static List<Object[]> getDimTime() {
        // Generate all possible dates in our range (2 years × 12 months × 28 days)
        Set<String> seenDates = new LinkedHashSet<>();
        List<Object[]> list = new ArrayList<>();

        for (int year = 2023; year <= 2024; year++) {
            for (int month = 1; month <= 12; month++) {
                for (int day = 1; day <= 28; day++) {
                    String dateKey = String.format("%d-%02d-%02d", year, month, day);
                    if (seenDates.add(dateKey)) {
                        int quarter = (month - 1) / 3 + 1;
                        list.add(new Object[]{
                            dateKey, year, quarter,
                            year + "-Q" + quarter,
                            month, MONTH_NAMES[month - 1]
                        });
                    }
                }
            }
        }
        return list;
    }

    /**
     * fact_sales rows with dimension keys (for star schema INSERT).
     * Returns: sales_key, date_key, customer_key, product_key, employee_key,
     *          quantity, unit_price, discount_rate, gross_revenue, net_revenue
     */
    public static List<Object[]> getFactSalesRows() {
        Random rand = new Random(SEED);
        List<Object[]> rows = new ArrayList<>(8500);
        int salesKey = 0;

        for (int year = 2023; year <= 2024; year++) {
            double yearGrowth = (year == 2024) ? 1.05 : 1.0;

            for (int quarter = 1; quarter <= 4; quarter++) {
                double seasonal = getSeasonalFactor(quarter);

                for (int ci = 0; ci < COUNTRIES.length; ci++) {
                    String continent = COUNTRIES[ci][1];
                    double marketSize = MARKET_SIZES[ci];

                    int baseCount = (int) (100.0 * seasonal * yearGrowth * marketSize);
                    int numRows = Math.max(20, baseCount + rand.nextInt(11) - 5);

                    for (int r = 0; r < numRows; r++) {
                        salesKey++;

                        int custLocalIdx = rand.nextInt(3);
                        int customerKey = getCountryCustomerStart(ci) + custLocalIdx + 1;

                        int prodIdx = selectWeightedProduct(rand, continent);
                        int productKey = prodIdx + 1;
                        double basePrice = (double) PRODUCTS[prodIdx][2];

                        int employeeKey = rand.nextInt(EMPLOYEES.length) + 1;

                        int month = getMonthInQuarter(quarter, rand);
                        int day = rand.nextInt(28) + 1;
                        String dateKey = String.format("%d-%02d-%02d", year, month, day);

                        int quantity = 5 + rand.nextInt(46);
                        double discount = DISCOUNTS[rand.nextInt(DISCOUNTS.length)];
                        double unitPrice = round2(basePrice * (0.90 + rand.nextDouble() * 0.20));
                        double grossRevenue = round2(quantity * unitPrice);
                        double netRevenue = round2(grossRevenue * (1.0 - discount));

                        rows.add(new Object[]{
                            salesKey, dateKey, customerKey, productKey, employeeKey,
                            quantity, unitPrice, discount, grossRevenue, netRevenue
                        });
                    }
                }
            }
        }

        return rows;
    }

    // ─── INTERNAL HELPERS ─────────────────────────────────────────────────

    private static double getSeasonalFactor(int quarter) {
        switch (quarter) {
            case 1: return 0.85;  // Post-holiday slowdown
            case 2: return 1.00;  // Normal
            case 3: return 1.05;  // Summer
            case 4: return 1.15;  // Holiday peak
            default: return 1.0;
        }
    }

    /** Index into CUSTOMERS array where a country's customers start (3 per country) */
    private static int getCountryCustomerStart(int countryIndex) {
        return countryIndex * 3;
    }

    /** Select a product index using weighted random (regional preferences) */
    private static int selectWeightedProduct(Random rand, String continent) {
        int continentIdx = getContinentIndex(continent);
        double[] weights = new double[PRODUCTS.length];
        double total = 0;

        for (int i = 0; i < PRODUCTS.length; i++) {
            int categoryIdx = i / 2; // 2 products per category
            weights[i] = CATEGORY_WEIGHTS[categoryIdx][continentIdx];
            total += weights[i];
        }

        double r = rand.nextDouble() * total;
        double cumulative = 0;
        for (int i = 0; i < PRODUCTS.length; i++) {
            cumulative += weights[i];
            if (r < cumulative) return i;
        }
        return PRODUCTS.length - 1;
    }

    private static int getContinentIndex(String continent) {
        switch (continent) {
            case "North America": return 0;
            case "South America": return 1;
            case "Europe":        return 2;
            case "Other":         return 3;
            default:              return 3;
        }
    }

    private static String getContinentForCountry(String country) {
        for (String[] c : COUNTRIES) {
            if (c[0].equals(country)) return c[1];
        }
        return "Other";
    }

    /** Random month within a quarter (1-12) */
    private static int getMonthInQuarter(int quarter, Random rand) {
        int baseMonth = (quarter - 1) * 3 + 1; // Q1→1, Q2→4, Q3→7, Q4→10
        return baseMonth + rand.nextInt(3);      // +0, +1, or +2
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
