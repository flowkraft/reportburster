# JasperReports in DataPallas

Run JasperReports (.jrxml) reports inside DataPallas.

## Jaspersoft Studio (Report Designer)

To create and edit `.jrxml` report templates you need **Jaspersoft Studio Community Edition** — a free, Eclipse-based visual report designer.

1. Download it from [https://community.jaspersoft.com/download-jaspersoft/community-edition/](https://community.jaspersoft.com/download-jaspersoft/community-edition/).
2. Install and launch the application.
3. Use the visual designer to create your report, add parameters, connect to databases, and preview output.
4. Save the report as a `.jrxml` file, then deploy it into DataPallas (see below).

## Adding a JasperReport

1. Design your report in Jaspersoft Studio (see above).

2. Create a folder under `config/reports-jasper/` with a name of your choice:
   ```
   config/reports-jasper/monthly-sales/
   ```

3. Copy your `.jrxml` file (and any resources — subreports, images, style templates) into that folder:
   ```
   config/reports-jasper/monthly-sales/
       monthly_sales.jrxml
       subreport_detail.jrxml
       company_logo.png
   ```

4. The report will appear automatically in DataPallas's UI under the **JasperReports** group.

## Migrating Existing JasperReports

If you already have JasperReports running in another environment (JasperReports Server, standalone app, or embedded in your own code), migrating to DataPallas is straightforward.

### What you need

- Your `.jrxml` template file(s) — the report design source files
- Any resources referenced by the report: subreport `.jrxml` files, images, style templates (`.jrtx`), font files
- Knowledge of which database the report connects to (JDBC URL, credentials)

### Step-by-step migration

1. **Locate your `.jrxml` files.** If you only have compiled `.jasper` files, open them in Jaspersoft Studio and re-export as `.jrxml`. DataPallas compiles templates at runtime, so `.jrxml` source files are required.

2. **Create a report folder** under `config/reports-jasper/` with a descriptive name:
   ```
   config/reports-jasper/my-existing-report/
   ```

3. **Copy all report files** into that folder — the main `.jrxml` plus any subreports, images, and other resources it references:
   ```
   config/reports-jasper/my-existing-report/
       main_report.jrxml
       subreport_header.jrxml
       company_logo.png
   ```

4. **Set up the database connection.** If your report uses a database:
   - If DataPallas already has a default database connection and your report uses the same database, no action is needed — it is used automatically.
   - To use a different connection, configure it in DataPallas (under *Connections* in the UI), then create a `datasource.properties` file in the report folder:
     ```properties
     connectionCode=my-database
     ```

5. **Verify parameters.** DataPallas automatically detects parameters declared in your `.jrxml`. Open the report in DataPallas's UI and confirm that the expected parameters appear. No changes to your `.jrxml` are needed — the existing `<parameter>` declarations work as-is.

6. **Run the report.** Select it from the **JasperReports** group in the Processing tab, fill in any parameters, and click execute.

### Notes on compatibility

- **Subreports:** Subreport paths are resolved relative to the report folder. Place all subreport `.jrxml` files alongside the main template. DataPallas automatically sets the `SUBREPORT_DIR` parameter to the report folder path.
- **JDBC drivers:** DataPallas ships with drivers for PostgreSQL, MySQL, MariaDB, Oracle, SQL Server, DB2, SQLite, DuckDB, and ClickHouse. If your report uses a different database, place the JDBC driver jar in DataPallas's `lib/` folder.
- **Fonts:** If your report uses custom fonts, place the font jar or `.ttf` files in DataPallas's `lib/` folder.
- **JasperReports version:** This version uses JasperReports 7.0.4. Reports designed with older versions generally work without changes. If you encounter compilation errors, open the `.jrxml` in the latest Jaspersoft Studio and re-save it.
- **Compiled `.jasper` files are not used.** DataPallas always compiles from `.jrxml` source to ensure compatibility.

## Database Connection

DataPallas resolves the database connection for each JasperReport using this priority order:

1. **Per-report override** — if `config/reports-jasper/{report-folder}/datasource.properties` exists, it is used.
2. **Global JasperReports override** — if `config/reports-jasper/datasource.properties` exists, it applies to all jasper reports that don't have their own.
3. **DataPallas's default DB connection** — the connection marked as "default" in DataPallas's *Connections* settings.

If none of the above is configured, the report runs without a database (suitable for static reports or reports with embedded data).

### Setting a specific connection

Create a `datasource.properties` file with a single line:

```properties
connectionCode=my-postgres-db
```

The `connectionCode` must match an existing DataPallas database connection
in `config/connections/db-{connectionCode}/`.

Place this file in:
- `config/reports-jasper/datasource.properties` — to set it for **all** JasperReports
- `config/reports-jasper/{report-folder}/datasource.properties` — to set it for a **specific** report (overrides the global one)

## Report Parameters

Parameters declared in your `.jrxml` are automatically detected and shown in the UI.
System parameters (REPORT_CONNECTION, REPORT_DATA_SOURCE, etc.) are filtered out.

Example parameter in `.jrxml`:
```xml
<parameter name="year" class="java.lang.Integer">
    <defaultValueExpression><![CDATA[2025]]></defaultValueExpression>
</parameter>
```

Supported parameter types: String, Integer, Long, Double, Float, BigDecimal, Boolean, Date, Timestamp.

## Folder Structure

```
DataPallas/
    config/
        reports-jasper/              <-- your JasperReports go here
            monthly-sales/
                monthly_sales.jrxml
                datasource.properties    (optional)
```

## License

JasperReports Library is licensed under [LGPL v3](https://www.gnu.org/licenses/lgpl-3.0.txt).
