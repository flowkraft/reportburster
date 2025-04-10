# Professional Invoice HTML Template Generation

You are an expert HTML and CSS developer. Create a complete, professional HTML invoice template based on the detailed specifications below. The template should work both as a web page and generate clean PDFs when printed.

## Overview Requirements

Create a sleek, modern invoice template with:

- Professional typography and spacing
- Clearly defined sections for company and client information
- Detailed line items table with proper alignment
- Payment information section
- Footer with contact details
- Page numbering support for multi-page invoices

## Document Structure

1. Create a proper HTML5 document with:

   - HTML5 DOCTYPE declaration
   - HTML tag with English language attribute
   - UTF-8 character encoding
   - Responsive viewport meta tag
   - Title tag containing "Invoice"

2. The body should contain these main sections in order:
   - Page numbering container (for PDF pagination)
   - Logo container
   - Invoice and client information section
   - Line items table
   - Payment information and total due section
   - Footer with contact information and thank you message

## Styling Specifications

1. **Typography**:

   - Use Arial, Helvetica, sans-serif as the font family
   - Base font size of 16px for the body
   - Varied font sizes for different sections:
     - Client name: 1.5em
     - Total and due date: 1.75em
     - Footer thank you message: 1.125em
     - Invoice information: 0.875em
     - Line items and footer contact info: smaller than body text

2. **Colors**:

   - Keep the design minimal with strategic color highlights
   - Use a bright red-pink (#fb7578) for the total amount to draw attention
   - Use light gray (#999) for table headers
   - Use darker gray (#ddd) for table borders
   - Footer contact information should use light gray (#ccc) with black text for the actual information

3. **Layout and Spacing**:

   - Body with 20px padding
   - Logo container with 20px top margin and 70px bottom margin
   - 70px margins around the line items tables
   - 100px top margin for the footer
   - Table cells should have no padding by default, except where specified

4. **Tables**:
   - All tables should be full width with collapsed borders
   - Right-align all rightmost table cells
   - In the line items table, make the quantity column 50px wide
   - Make the price column 100px wide
   - Make the subtotal column 100px wide

## Specific Section Details

### Page Numbering Container

Create a page numbering system that displays "Page X of Y" in the bottom right corner of printed pages using CSS counters:

- Gray text (#999)
- Small font size (12px)
- Right-aligned
- Positioned to appear at the bottom of each printed page

### Logo Container

- Simple container with appropriate spacing
- Should contain an image with height set to 18px
- Image source should be "email-logo-black.png"

### Invoice Information Section

Create a table with two columns containing:

- Left side:
  - Client name (larger font, positioned at the top)
  - Invoice date (with May 24th, 2024 in bold)
  - Invoice number (with 12345 in bold)
- Right side:
  - Company name (Anvil Co)
  - Company address (123 Main Street, San Francisco CA, 94103)
  - Company email (hello@useanvil.com)

### Line Items Table

Create a table with the following characteristics:

- Column headers: Qty, Description, Price, Subtotal
- Headers should be:
  - Uppercase
  - Light gray color
  - Left-aligned (except the last column which is right-aligned)
  - Separated from content with a 2px light gray border
- Three sample rows containing:
  1. 2 Blue large widgets at $15.00 each, subtotal $30.00
  2. 4 Green medium widgets at $10.00 each, subtotal $40.00
  3. 5 Red small widgets with logo at $7.00 each, subtotal $35.00
- Prices in the price column should be right-aligned
- Subtotals should be in bold

### Payment Information Section

Create a second table with:

- Column headers: Payment Info, Due By, Total Due
- Single data row containing:
  - Payment information (account and routing numbers in bold)
  - Due date (May 30th, 2024) in large text
  - Total amount ($105.00) in large text, bold, and red-pink color
- This table should have a bottom border

### Footer

Create a footer with:

- Contact information (email, phone, website) separated by vertical bars
- Right-aligned contact information
- "Thank you!" message with a small heart icon
- Heart icon should be 16px wide and aligned with the text

## Print and PDF Behavior

Implement special styling for printed/PDF output:

- Page numbers should appear at the bottom right of each page
- Footer contact information should appear at the bottom left of each page
- Use CSS page and running elements to position these items correctly
- Adjust footer spacing for print output (30px top margin instead of 100px)

The final template should be clean, professional, and faithfully reproduce the invoice design when rendered as HTML or PDF.

Generate only the complete HTML code based on the above instructions.
