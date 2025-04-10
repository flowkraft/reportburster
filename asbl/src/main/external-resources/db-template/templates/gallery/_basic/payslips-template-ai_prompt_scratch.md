# Payslip Template Generation Prompt

You are an expert HTML template generator. Your task is to create a **comprehensive, professional payslip template** based on the detailed description below. Follow the specifications closely to ensure the output matches the intended layout and styling.

## Template Description

### General Layout

1. The document is an HTML file with a `<head>` section for metadata and inline CSS styling, and a `<body>` section containing a single comprehensive table for the payslip structure.
2. The document begins with the `<!DOCTYPE html>` declaration and specifies the language as `en` (English).
3. The `<title>` of the page is set as "Payslip Template."
4. The payslip content is presented in a **single table**, using properly structured rows and columns for clarity.

### Styling

1. Font:
   - Use `Arial, sans-serif` as the primary font family.
2. Colors:
   - Use shades of **blue** for corporate branding:
     - Dark corporate blue: `#234e70`
     - Lighter blue: `#3b719f`
   - Use distinct background colors for specific sections:
     - Light green (`#eaf5ea`) for earnings.
     - Light red (`#f9f0f0`) for deductions.
     - Light yellow (`#fffae6`) for pay period row.
     - Light gray-blue (`#dde8f3`) for totals.
     - Sea green (`#2e8b57`) for the "Net Pay" row, with white text.
   - Signatures have a subtle background: light gray (`#f9f9f9`).
3. Borders:
   - All table cells (`<td>`) have borders with the color `#a3b4c7`.
   - Specific cells use the `no-border` class to remove borders.
4. Text alignment:
   - Company information and header/title are centered.
   - Earnings and deductions amounts are right-aligned.

### Content Sections

1. **Company Information**:
   - Positioned at the top of the payslip in rows.
   - Includes the company name, address, city, and phone number.
   - Styled with a blue background (`#234e70`) and white text.
2. **Header/Title**:
   - Displayed below the company information.
   - Text: "STATEMENT OF MONTHLY INCOME" (centered, bold, and blue-colored).
3. **Employee Details**:
   - Includes fields for:
     - Employee Name
     - Employee ID
     - Social Security Number
     - Department
     - Position/Grade
     - Pay Period
   - Organized into two rows with column headers styled in a light blue background (`#f0f5fa`).
4. **Earnings and Deductions**:
   - Section header has the text "EARNINGS" and "TAXES/DEDUCTIONS" with a bold font and a lighter blue background (`#3b719f`).
   - Separate rows for each earning (e.g., Basic Salary, Bonuses) and deduction (e.g., Federal Tax, State Tax, Medical).
   - Amounts are displayed in the rightmost columns, aligned to the right.
5. **Totals**:
   - A row for "Total Earnings" and "Total Deductions."
   - Styled with a distinct light gray-blue background (`#dde8f3`).
6. **Net Pay**:
   - Displayed in a separate row with the text "Net Pay" and the amount.
   - Styled with a bold, green background (`#2e8b57`) and white text.
7. **Signatures**:
   - Two sections for "Employee Signature" and "Director" at the bottom.
   - Includes a hidden row with underscores (`_______________`) for placeholder signatures.

## Output Requirements

- Include all `<style>` definitions directly in the `<head>` section as inline CSS.
- Use semantic and descriptive class names (e.g., `.company-info`, `.section-header`, `.net-pay`).
- Ensure all placeholders for dynamic data (e.g., `${col0}`, `${col1}`) are included in the appropriate table cells for easy future customization.

Generate only the complete HTML code based on the above instructions.
