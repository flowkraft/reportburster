/*
 * Employee Payslip - Scripted Datasource
 * Returns payslip data for a specific employee based on entityCode
 */

import java.time.LocalDate
import java.time.format.DateTimeFormatter

log.info("Starting employee-payslip-script.groovy...")

// Get the entityCode parameter (employee ID) from ctx.variables
def userVars = ctx.variables.getUserVariables(ctx.token ?: '')
def entityCode = userVars?.get('entityCode')?.toString()

log.info("entityCode parameter: {}", entityCode)

// Mock payslip data for 3 employees
def payslips = [
    'EMP001': [
        EmployeeCode: 'EMP001',
        FullName: 'Alice Johnson',
        Department: 'Engineering',
        Position: 'Senior Software Engineer',
        PayPeriod: 'November 2025',
        PayDate: '2025-11-30',
        
        // Earnings
        BaseSalary: 6500.00,
        Overtime: 325.00,
        Bonus: 500.00,
        GrossEarnings: 7325.00,
        
        // Deductions
        FederalTax: 1172.00,
        StateTax: 366.25,
        SocialSecurity: 454.15,
        Medicare: 106.21,
        HealthInsurance: 185.00,
        Retirement401k: 325.00,
        TotalDeductions: 2608.61,
        
        // Net Pay
        NetPay: 4716.39,
        
        // YTD
        YtdGross: 80575.00,
        YtdDeductions: 28695.31,
        YtdNet: 51879.69,
        
        // Company Info
        CompanyName: 'Northridge Pharmaceuticals',
        CompanyAddress: '123 Tech Park Drive, Suite 400',
        CompanyCity: 'San Francisco, CA 94102'
    ],
    'EMP002': [
        EmployeeCode: 'EMP002',
        FullName: 'Bob Smith',
        Department: 'Sales',
        Position: 'Regional Sales Manager',
        PayPeriod: 'November 2025',
        PayDate: '2025-11-30',
        
        // Earnings
        BaseSalary: 5800.00,
        Overtime: 0.00,
        Bonus: 1200.00,
        GrossEarnings: 7000.00,
        
        // Deductions
        FederalTax: 1120.00,
        StateTax: 350.00,
        SocialSecurity: 434.00,
        Medicare: 101.50,
        HealthInsurance: 245.00,
        Retirement401k: 290.00,
        TotalDeductions: 2540.50,
        
        // Net Pay
        NetPay: 4459.50,
        
        // YTD
        YtdGross: 77000.00,
        YtdDeductions: 27945.50,
        YtdNet: 49054.50,
        
        // Company Info
        CompanyName: 'Northridge Pharmaceuticals',
        CompanyAddress: '123 Tech Park Drive, Suite 400',
        CompanyCity: 'San Francisco, CA 94102'
    ],
    'EMP003': [
        EmployeeCode: 'EMP003',
        FullName: 'Carol Williams',
        Department: 'Marketing',
        Position: 'Marketing Director',
        PayPeriod: 'November 2025',
        PayDate: '2025-11-30',
        
        // Earnings
        BaseSalary: 7200.00,
        Overtime: 0.00,
        Bonus: 800.00,
        GrossEarnings: 8000.00,
        
        // Deductions
        FederalTax: 1280.00,
        StateTax: 400.00,
        SocialSecurity: 496.00,
        Medicare: 116.00,
        HealthInsurance: 185.00,
        Retirement401k: 400.00,
        TotalDeductions: 2877.00,
        
        // Net Pay
        NetPay: 5123.00,
        
        // YTD
        YtdGross: 88000.00,
        YtdDeductions: 31647.00,
        YtdNet: 56353.00,
        
        // Company Info
        CompanyName: 'Northridge Pharmaceuticals',
        CompanyAddress: '123 Tech Park Drive, Suite 400',
        CompanyCity: 'San Francisco, CA 94102'
    ]
]

// If entityCode provided, filter to that employee; otherwise return all
if (entityCode && payslips.containsKey(entityCode)) {
    ctx.reportData = [new LinkedHashMap(payslips[entityCode])]
    log.info("Returning payslip for employee: {}", entityCode)
} else if (entityCode) {
    // Invalid entityCode - return empty
    ctx.reportData = []
    log.warn("No payslip found for entityCode: {}", entityCode)
} else {
    // No entityCode - return all employees (for listing purposes)
    ctx.reportData = payslips.values().collect { new LinkedHashMap(it) }
    log.info("Returning all {} payslips", ctx.reportData.size())
}

ctx.reportColumnNames = ['EmployeeCode', 'FullName', 'Department', 'Position', 'PayPeriod', 'NetPay']

log.info("Finished employee-payslip-script.groovy successfully.")
