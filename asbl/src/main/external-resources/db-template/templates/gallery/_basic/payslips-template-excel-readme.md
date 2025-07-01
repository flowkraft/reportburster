# Excel Payslip Template Guide

## Overview

This HTML template generates professional-looking Excel payslips with company information, employee details, earnings, deductions, and signature lines. It leverages special data attributes to enhance the Excel output beyond standard HTML capabilities.

## Template Structure

The template includes:

- Company header section with corporate branding
- Employee information section
- Earnings and deductions with automatic calculations
- Totals and net pay section
- Signature lines

## Variable Placeholders

The template uses `${colX}` variables that ReportBurster replaces with your data:

- `${col0}` through `${col5}` - Employee information fields
- `${col6}` through `${col13}` - Earnings and deductions amounts
- `${col14}` through `${col16}` - Calculated totals and net pay

## Excel-Specific Features

This template includes special data attributes that control Excel-specific formatting:

### Sheet Control

- `data-sheet-name="Payslip"` - Names the Excel worksheet

### Cell Formatting

- `data-text-cell="true"` - Forces Excel to treat the cell as text
- `data-text-color="#FFFFFF"` - Sets text color
- `data-bg-color="#234e70"` - Sets background color
- `data-align="center"` - Controls text alignment
- `data-font-size="14"` - Sets font size
- `data-bold="true"` - Makes text bold
- `data-height="20"` - Sets row height
- `data-width="100"` - Sets column width

### Formulas and Calculations

- `data-group="earnings"` - Adds cells to named groups for calculations
- `data-group-output="earnings"` - Outputs SUM formula for the named group

## Customization Guide

### Modifying Company Information

```html
<td colspan="4" class="company-info no-border" data-text-cell="true" data-text-color="#FFFFFF" data-bg-color="#234e70" data-align="center" data-font-size="14" data-bold="true">YOUR COMPANY NAME</td>
```

Add or update the relevant company details as needed.

### Adding Formula-Based Calculations

To create automatic calculations in Excel:

1. Add `data-group="groupName"` to cells that should be included in calculations.
2. Add `data-group-output="groupName"` to cells that should display the result.

#### Example:

```html
<!-- Values to be summed -->
<td class="amount earnings-cell" data-group="earnings">${col6}</td>
<td class="amount earnings-cell" data-group="earnings">${col8}</td>

<!-- Cell displaying sum -->
<td class="amount" data-group-output="earnings">${col14}</td>
```

## Implementation Tips

1. Maintain all data-\* attributes when customizing the template
2. Test your template with ReportBurster's preview feature
3. For complex formulas, consider using multiple data-group attributes
4. Excel formatting takes precedence over HTML/CSS styling

This template provides a foundation for creating Excel-based payslips that take advantage of Excel's native
features while maintaining the convenience of HTML-based templating.
