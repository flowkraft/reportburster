# Overview

This HTML template generates professional payslips with company information, employee details, earnings, deductions, 
and signature lines. Use it as a starting point for creating your own custom payslips.

## Template Structure

The template consists of:

* Company header section (blue background)
* Document title
* Employee information section (light blue background)
* Earnings and deductions section (green/red backgrounds)
* Totals and net pay calculation
* Signature lines

## Variable Placeholders

The template uses `${colX}` variables that ReportBurster replaces with your data:

* `${col0}` through `${col5}` - Employee information (name, ID, SSN, period, etc.)
* `${col6}` through `${col13}` - Earnings and deductions amounts
* `${col14}` through `${col16}` - Calculated totals and net pay

## Customization Guide

### Modifying Company Information

Replace the company details in the first four rows:

```html
<td colspan="4" class="company-info no-border">YOUR COMPANY NAME</td>
<td colspan="4" class="company-info no-border">YOUR STREET ADDRESS</td>
<td colspan="4" class="company-info no-border">YOUR CITY</td>
<td colspan="4" class="company-info no-border">YOUR PHONE</td>
```

### Adjusting Earnings/Deductions

Add or remove rows in the earnings/deductions section as needed.

### Styling Changes

The CSS in the `<style>` section controls the template's appearance:

- `.company-info` - Header styling (`background-color: #234e70`)
- `.earnings-cell` - Light green background for earnings
- `.deductions-cell` - Light red background for deductions
- `.net-pay` - Green background for the final amount

Adjust colors and styles to match your organization's branding.

## Implementation Tips

1. Ensure your data source has all required fields in the correct order.
2. For testing, create a sample CSV with appropriate placeholder data.
3. Map your data columns to the template variables in ReportBurster.
4. Preview with sample data before generating payslips for distribution.

This template provides a solid foundation that can be extended with additional information, 
custom calculations, or different layouts based on your specific requirements.
