/*
 * Ad-hoc Report Generation Script
 *
 * This script demonstrates how to generate a report using only
 * user-provided parameter values - no database or file datasource needed.
 *
 * The parameter values entered by the user in the UI are available
 * via ctx.variables.get('paramName'). This script reads them and
 * builds a single data row for the report template to render.
 */

log.info("Starting ad-hoc report script...")

// Read parameter values provided by the user
def employeeId = ctx.variables.get('EmployeeID')
def firstName  = ctx.variables.get('FirstName')
def lastName   = ctx.variables.get('LastName')

log.info("Parameter values - EmployeeID: {}, FirstName: {}, LastName: {}",
         employeeId, firstName, lastName)

// Build one data row from the parameter values
def row = new LinkedHashMap<String, Object>()
row.put('EmployeeID', employeeId)
row.put('FirstName',  firstName)
row.put('LastName',   lastName)

ctx.reportData = [row]
ctx.reportColumnNames = new ArrayList<>(row.keySet())

log.info("Ad-hoc report script complete. Prepared {} row(s) for report generation.",
         ctx.reportData.size())
