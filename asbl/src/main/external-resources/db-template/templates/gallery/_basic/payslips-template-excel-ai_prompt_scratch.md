# Payroll Excel Report Template Generation Prompt

## Overview

Create a professional payslip template that can be exported to Excel using ReportBurster technology. This template should combine clean HTML/CSS design with Excel-specific functionality through specialized data attributes. The result should be a visually organized monthly income statement that maintains its formatting when converted to Excel and includes automatic calculations.

## Design Requirements

### Structure and Layout

Create a single-page payslip with the following sections:

1. **Company Header** - Corporate branding with company name and contact details
2. **Document Title** - "STATEMENT OF MONTHLY INCOME"
3. **Employee Information** - Basic employee details in a structured format
4. **Earnings and Deductions** - Side-by-side comparison with color-coding
5. **Totals Section** - Automatically calculated summary amounts
6. **Net Pay Display** - Highlighted final payment amount
7. **Signature Lines** - Space for employee and director signatures

### Color Scheme and Visual Design

1. **Color Palette**:

   - Dark corporate blue (#234e70) for main headers
   - Lighter blue (#3b719f) for section headers
   - Light green (#eaf5ea) for earnings cells
   - Light red (#f9f0f0) for deductions cells
   - Sea green (#2e8b57) for net pay display
   - Light blue-gray (#dde8f3) for totals row
   - Light yellow (#fffae6) for period row (if used)

2. **Typography**:

   - Arial, sans-serif as the primary font family
   - Bold, centered 24px text for main headers
   - Bold text for section headers and totals
   - Right-aligned amounts

3. **Table Structure**:
   - Collapsed borders
   - Standard 8px cell padding
   - 1px #a3b4c7 border color for cells
   - "No border" option for specific cells

## Excel Export Functionality

The template must include specialized data attributes for ReportBurster Excel export. Include the following Excel-specific features:

### Worksheet Configuration

- Name the worksheet "Payslip" using the `data-sheet-name` attribute on the table

### Text and Formatting Control

- Force text rendering for cells containing IDs, phone numbers, or codes using `data-text-cell="true"`
- Set text color with `data-text-color="#XXXXXX"` where needed
- Apply background colors with `data-bg-color="#XXXXXX"` for headers and sections
- Control text alignment with `data-align="center"` or similar attributes
- Adjust font size with `data-font-size="14"` for headers
- Apply bold formatting with `data-bold="true"` where needed

### Row and Cell Properties

- Control row heights with `data-height="20"` for spacing rows
- Set column widths where appropriate with `data-width="100"`

### Formula Implementation

- Use `data-group="earnings"` for all earning amount cells
- Use `data-group="deductions"` for all deduction amount cells
- Implement automatic totals with `data-group-output="earnings"` and `data-group-output="deductions"`

## Content Requirements

### Company Information

Include placeholder content for:

- Company name (Northridge Pharmaceuticals)
- Address (7649F Diamond Hts Blvd)
- City (San Francisco)
- Phone number ((415) 872-9214)

### Employee Details

Create labeled fields for:

- Employee Name (linked to ${col0})
- Employee ID (linked to ${col1})
- Social Security # (linked to ${col2})
- Pay Period (linked to ${col3})
- Department (linked to ${col4})
- Position/Grade (linked to ${col5})

### Earnings and Deductions

Structure with these elements:

- Earnings section with Basic Salary and Bonuses (linked to ${col6} and ${col8})
- Deductions section with taxes and benefits (linked to ${col7}, ${col9}, ${col10}, ${col11}, ${col12}, ${col13})
- Total Earnings (linked to ${col14})
- Total Deductions (linked to ${col15})
- Net Pay (linked to ${col16})

### Signatures

Include signature lines for both employee and director with appropriate spacing.

## Technical Reference

For Excel export functionality, implement the data attributes according to these guidelines:

1. **Text Control**: Force Excel to treat cell content as text (important for IDs, codes, etc.)

   ```html
   <td data-text-cell="true">13.54</td>
   ```

2. **Formula Groups**: Create named ranges for formula references

   ```html
   <td data-group="groupname">100</td>
   ```

3. **Automatic Calculations**: Output sum of cells in a named range

   ```html
   <td data-group-output="groupname">0</td>
   ```

4. **Cell Formatting**: Control appearance in Excel

   ```html
   <td data-text-color="#FFFFFF" data-bg-color="#234e70" data-align="center" data-font-size="14" data-bold="true">Content</td>
   ```

5. **Row Heights**: Set specific row heights for spacing
   ```html
   <tr data-height="20">
     <td class="no-border" colspan="4"></td>
   </tr>
   ```

The final template should maintain its visual design when exported to Excel while providing functional calculations of totals using the grouped cells.

Generate only the complete HTML code based on the above instructions.
