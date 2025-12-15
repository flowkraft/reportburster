/*
 * Employee Hire Dates - Scripted Datasource
 * Demonstrates date range filtering with report parameters
 */

import java.time.LocalDate
import java.time.format.DateTimeFormatter

log.info("Starting employee-hire-dates-script.groovy...")

// Mock employee data with hire dates spanning ~2 years
def employees = [
    [EmployeeID: 'EMP001', FirstName: 'Alice',   LastName: 'Johnson',  Department: 'Engineering', HireDate: '2023-03-15'],
    [EmployeeID: 'EMP002', FirstName: 'Bob',     LastName: 'Smith',    Department: 'Sales',       HireDate: '2023-06-22'],
    [EmployeeID: 'EMP003', FirstName: 'Carol',   LastName: 'Williams', Department: 'Marketing',   HireDate: '2023-09-10'],
    [EmployeeID: 'EMP004', FirstName: 'David',   LastName: 'Brown',    Department: 'Engineering', HireDate: '2023-11-05'],
    [EmployeeID: 'EMP005', FirstName: 'Emma',    LastName: 'Davis',    Department: 'HR',          HireDate: '2024-01-20'],
    [EmployeeID: 'EMP006', FirstName: 'Frank',   LastName: 'Miller',   Department: 'Finance',     HireDate: '2024-03-12'],
    [EmployeeID: 'EMP007', FirstName: 'Grace',   LastName: 'Wilson',   Department: 'Engineering', HireDate: '2024-05-08'],
    [EmployeeID: 'EMP008', FirstName: 'Henry',   LastName: 'Moore',    Department: 'Sales',       HireDate: '2024-07-25'],
    [EmployeeID: 'EMP009', FirstName: 'Ivy',     LastName: 'Taylor',   Department: 'Marketing',   HireDate: '2024-09-18'],
    [EmployeeID: 'EMP010', FirstName: 'Jack',    LastName: 'Anderson', Department: 'Engineering', HireDate: '2024-10-30'],
    [EmployeeID: 'EMP011', FirstName: 'Karen',   LastName: 'Thomas',   Department: 'HR',          HireDate: '2024-11-15'],
    [EmployeeID: 'EMP012', FirstName: 'Leo',     LastName: 'Jackson',  Department: 'Finance',     HireDate: '2025-01-10']
]

// Parse date format
def dateFormatter = DateTimeFormatter.ofPattern('yyyy-MM-dd')

// Get filter parameters from ctx.variables (the correct API for accessing report parameters)
// Note: ctx.token may be null during data fetch, so use empty string as fallback
def userVars = ctx.variables.getUserVariables(ctx.token ?: '')
def startDateStr = userVars?.get('startDate')?.toString()
def endDateStr = userVars?.get('endDate')?.toString()

log.info("Filter parameters - startDate: {}, endDate: {}", startDateStr, endDateStr)

// Parse filter dates
LocalDate startDate = null
LocalDate endDate = null

try {
    if (startDateStr) {
        startDate = LocalDate.parse(startDateStr, dateFormatter)
    }
    if (endDateStr) {
        endDate = LocalDate.parse(endDateStr, dateFormatter)
    }
} catch (Exception e) {
    log.warn("Could not parse date parameters: {}", e.message)
}

// Filter employees by hire date range
def filteredEmployees = employees.findAll { emp ->
    def hireDate = LocalDate.parse(emp.HireDate, dateFormatter)
    
    boolean afterStart = (startDate == null) || !hireDate.isBefore(startDate)
    boolean beforeEnd = (endDate == null) || !hireDate.isAfter(endDate)
    
    return afterStart && beforeEnd
}

// Convert to LinkedHashMap for consistent ordering
ctx.reportData = filteredEmployees.collect { new LinkedHashMap(it) }
ctx.reportColumnNames = ['EmployeeID', 'FirstName', 'LastName', 'Department', 'HireDate']

log.info("Returning {} employees (filtered from {} total)", ctx.reportData.size(), employees.size())
log.info("Finished employee-hire-dates-script.groovy successfully.")
