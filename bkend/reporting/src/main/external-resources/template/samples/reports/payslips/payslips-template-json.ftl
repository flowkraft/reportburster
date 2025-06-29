{
  "Payslip": {
    "id": "${col1}",
    "Employee": {
      "Name": "${col0}",
      "ID": "${col1}",
      "SocialSecurity": "${col2}"
    },
    "PayPeriod": <#if col3?is_date>"${col3?string("MM/dd/yy")}"<#else>"${col3}"</#if>,
    "Department": "${col4}",
    "Position": "${col5}",
    "Earnings": {
      "BasicSalary": "${col6}",
      "Bonuses": "${col8}"
    },
    "Deductions": {
      "FederalTax": "${col7}",
      "SocialSecurityTax": "${col9}",
      "MedicareTax": "${col10}",
      "StateTax": "${col11}",
      "Medical": "${col12}",
      "Dental": "${col13}"
    },
    "Totals": {
      "TotalEarnings": "${col14}",
      "TotalDeductions": "${col15}"
    },
    "NetPay": "${col16}"
  },
} 