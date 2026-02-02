import java.sql.*
import groovy.sql.Sql

log.info('DuckDB Mixed Sources Script: Starting...')

def csvPath = new File('src/test/resources/input/unit/other/employees.csv').absolutePath

// Use ctx.dbSql which is the Groovy SQL wrapper provided by the framework
def sql = ctx.dbSql

// Create an in-memory table with department data
sql.execute('''
    CREATE TABLE IF NOT EXISTS departments (
        employee_id INTEGER,
        department VARCHAR,
        salary DECIMAL(10,2)
    )
''')

// Clear any existing data (in case of test reruns)
sql.execute("DELETE FROM departments")

sql.execute("INSERT INTO departments VALUES (1, 'Engineering', 75000.00)")
sql.execute("INSERT INTO departments VALUES (2, 'Sales', 65000.00)")
sql.execute("INSERT INTO departments VALUES (3, 'Marketing', 70000.00)")

// Join CSV data with in-memory table
def query = """
    SELECT 
        e.employee_id,
        e.email_address,
        e.first_name,
        e.last_name,
        d.department,
        d.salary
    FROM read_csv_auto('${csvPath}') e
    INNER JOIN departments d ON e.employee_id = d.employee_id
    WHERE e.employee_id IN (1, 2)
    ORDER BY e.employee_id
"""

def results = []
sql.eachRow(query) { row ->
    results << new LinkedHashMap([
        employee_id: row.employee_id,
        email_address: row.email_address,
        first_name: row.first_name,
        last_name: row.last_name,
        department: row.department,
        salary: row.salary
    ])
}

ctx.reportData = results
ctx.reportColumnNames = ['employee_id', 'email_address', 'first_name', 'last_name', 'department', 'salary']

log.info('DuckDB Mixed Sources Script: Generated {} enriched records', results.size())
