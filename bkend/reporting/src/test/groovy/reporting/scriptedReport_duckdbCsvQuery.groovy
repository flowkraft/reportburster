import java.sql.*
import groovy.sql.Sql

log.info('DuckDB CSV Script: Starting...')

def csvPath = new File('src/test/resources/input/unit/other/employees.csv').absolutePath
log.info('CSV Path: {}', csvPath)

// Query CSV file using DuckDB
def sql = Sql.newInstance(ctx.conn)
def query = "SELECT employee_id, email_address, first_name, last_name FROM read_csv_auto('" + csvPath + "') WHERE employee_id IN (1, 2)"
log.info('Executing query: {}', query)

def results = []
sql.eachRow(query) { row ->
    results << new LinkedHashMap([
        employee_id: row.employee_id,
        email_address: row.email_address,
        first_name: row.first_name,
        last_name: row.last_name
    ])
}

ctx.reportData = results
ctx.reportColumnNames = ['employee_id', 'email_address', 'first_name', 'last_name']

log.info('DuckDB CSV Script: Generated {} records', results.size())
