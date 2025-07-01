You are an HTML customization assistant. Your task is to take the **customization instructions** provided below and apply them to the **reference HTML template**. Generate the updated HTML code based on the instructions.

**Customization Instructions:**
1. Move the company information section (name, address, phone, etc.) from the center to the left alignment.
2. Use the following TAXES/DEDUCTIONS:
   - Health Insurance
   - Pension Fund Contribution
   - Unemployment Tax
   - Local Tax
3. Change the background color of the "Net Pay" row to gold (`#FFD700`) for better visibility.
4. Replace the company name with "TechWave Solutions" and the address with "123 Elm Street, Innovation City."
5. Change the header title "STATEMENT OF MONTHLY INCOME" to "PAYSLIP - MONTHLY OVERVIEW."

**Reference HTML Template:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Payslip Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
      }
      .company-info {
        text-align: center;
        color: white;
        background-color: #234e70; /* Corporate blue */
      }
      .header {
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        color: #234e70; /* Corporate blue */
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      td {
        padding: 8px;
        border: 1px solid #a3b4c7;
      }
      td.no-border {
        border: none;
      }
      td.amount {
        text-align: right;
      }
      .section-header {
        font-weight: bold;
        background-color: #3b719f; /* Lighter corporate blue */
        color: white;
      }
      .employee-header {
        background-color: #f0f5fa; /* Very light blue */
      }
      .earnings-cell {
        background-color: #eaf5ea; /* Light green for earnings */
      }
      .deductions-cell {
        background-color: #f9f0f0; /* Light red for deductions */
      }
      .totals {
        font-weight: bold;
        background-color: #dde8f3; /* Light blue-gray */
      }
      .net-pay {
        background-color: #2e8b57; /* Sea green */
        color: white;
        text-align: right;
        font-weight: bold;
      }
      .signature {
        border-top: 1px solid #234e70;
        text-align: center;
        color: #555;
        background-color: #f9f9f9;
      }
      .period-row {
        background-color: #fffae6; /* Light yellow */
      }
      .white-on-white {
        color: #ffffff;
        background-color: #ffffff;
        border: none"
      }
    </style>
  </head>
  <body>
    <!-- Single comprehensive table for Excel output -->
    <table>
      <!-- Company info section - separate rows instead of <br> tags -->
      <!-- Row 1: Company name -->
      <tr>
        <td
          colspan="4"
          class="company-info no-border"
        >
          Northridge Pharmaceuticals
        </td>
      </tr>
      <!-- Row 2: Street address -->
      <tr>
        <td
          colspan="4"
          class="company-info no-border"
        >
          7649F Diamond Hts Blvd
        </td>
      </tr>
      <!-- Row 3: City -->
      <tr>
        <td
          colspan="4"
          class="company-info no-border"
        >
          San Francisco
        </td>
      </tr>
      <!-- Row 4: Phone number -->
      <tr>
        <td
          colspan="4"
          class="company-info no-border"
        >
          (415) 872-9214
        </td>
      </tr>

      <tr>
        <td class="no-border" colspan="4"></td>
      </tr>

      <!-- Header/title -->
      <tr>
        <td
          colspan="4"
          class="header no-border"
        >
          STATEMENT OF MONTHLY INCOME
        </td>
      </tr>
      <tr>
        <td colspan="4" class="no-border"></td>
      </tr>
      <!-- Employee details section -->
      <tr>
        <td class="employee-header">Employee Name</td>
        <td>${col0}</td>
        <td class="employee-header">Department</td>
        <td>${col4}</td>
      </tr>
      <tr>
        <td class="employee-header">Employee ID</td>
        <td>${col1}</td>
        <td class="employee-header">Position/Grade</td>
        <td>${col5}</td>
      </tr>
      <tr>
        <td class="employee-header">Social Security #</td>
        <td>${col2}</td>
        <td colspan="2"></td>
      </tr>
      <tr>
        <td class="employee-header">Pay Period</td>
        <td>${col3}</td>
        <td colspan="2"></td>
      </tr>

      <tr>
        <td colspan="4" class="no-border"></td>
      </tr>

      <!-- Earnings/Deductions header -->
      <tr class="section-header">
        <td>EARNINGS</td>
        <td class="amount">AMOUNT</td>
        <td>TAXES/DEDUCTIONS</td>
        <td class="amount">AMOUNT</td>
      </tr>

      <!-- Earnings/Deductions data -->
      <tr>
        <td class="earnings-cell">Basic Salary</td>
        <td class="amount earnings-cell">${col6}</td>
        <td class="deductions-cell">Federal Tax</td>
        <td class="amount deductions-cell">${col7}</td>
      </tr>
      <tr>
        <td class="earnings-cell">Bonuses</td>
        <td class="amount earnings-cell">${col8}</td>
        <td class="deductions-cell">Social Security Tax</td>
        <td class="amount deductions-cell">${col9}</td>
      </tr>
      <tr>
        <td class="earnings-cell"></td>
        <td class="earnings-cell"></td>
        <td class="deductions-cell">Medicare Tax</td>
        <td class="amount deductions-cell">${col10}</td>
      </tr>
      <tr>
        <td class="earnings-cell"></td>
        <td class="earnings-cell"></td>
        <td class="deductions-cell">State Tax</td>
        <td class="amount deductions-cell">${col11}</td>
      </tr>
      <tr>
        <td class="earnings-cell"></td>
        <td class="earnings-cell"></td>
        <td class="deductions-cell">Medical</td>
        <td class="amount deductions-cell">${col12}</td>
      </tr>
      <tr>
        <td class="earnings-cell"></td>
        <td class="earnings-cell"></td>
        <td class="deductions-cell">Dental</td>
        <td class="amount deductions-cell">${col13}</td>
      </tr>

      <!-- Totals -->
      <tr class="totals">
        <td>Total Earnings</td>
        <td class="amount">${col14}</td>
        <td>Total Deductions</td>
        <td class="amount">${col15}</td>
      </tr>

      <tr>
        <td colspan="4" class="no-border"></td>
      </tr>

      <!-- Net Pay -->
      <tr>
        <td colspan="2" class="no-border"></td>
        <td class="net-pay">Net Pay</td>
        <td class="amount net-pay">${col16}</td>
      </tr>

      <tr>
        <td colspan="4" class="no-border"></td>
      </tr>
      <tr>
        <td colspan="4" class="no-border"></td>
      </tr>
      <!-- Signatures -->
      <tr>
        <td class="signature" colspan="2">Employee signature:</td>
        <td class="signature" colspan="2">Director:</td>
      </tr>
      <!-- Hidden row with fixed-width content -->
      <tr>
        <td class="white-on-white">_______________</td>
        <td class="white-on-white">_______________</td>
        <td class="white-on-white">_______________</td>
        <td class="white-on-white">_______________</td>
      </tr>
    </table>
  </body>
</html>
```

Output only the complete updated HTML template with the applied changes.