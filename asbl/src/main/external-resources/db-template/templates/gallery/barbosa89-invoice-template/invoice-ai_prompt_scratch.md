# Modern Two-Column Invoice Template Generation Prompt

You are tasked with creating a professional HTML invoice template with a contemporary split-column design. The template should be suitable for business use and must follow the detailed specifications below.

## Overall Document Structure

Create an HTML5 document with:

- Proper DOCTYPE declaration
- HTML language set to English
- Essential meta tags including UTF-8 charset, X-UA-Compatible for IE edge mode, and a responsive viewport setting
- Title set to "Invoice template"
- All styling should be contained in an internal stylesheet

## Layout Foundation

The invoice should use a grid-based layout with the following characteristics:

1. **Container Structure**:

   - Fixed-width container (1170px) with small padding on both sides
   - The main content area should be a "page" that triggers a page break when printed
   - Two-column layout with a sidebar and main content area that maintain equal heights

2. **Grid System**:
   - Use a 12-column grid system with responsive classes
   - Column widths follow standard bootstrap-like naming (col-xs-4, col-xs-8, etc.)
   - Include utility classes for column offsets (like col-xs-offset-8)
   - Ensure proper clearfix for rows using :before and :after pseudo-elements

## Visual Styling Specifications

1. **Typography**:

   - Base font: Helvetica Neue with Helvetica and Arial as fallbacks
   - Base font size: 14px with a line height of approximately 1.43
   - Heading hierarchy with proper size scaling (h1=36px, h3=24px, h4=18px, h5=14px, h6=12px)
   - Include utility classes for font weights (light=100, bold=bold)
   - Text color should be dark gray (#333) by default

2. **Color Scheme**:

   - Left sidebar: Light gray background (#dcdddf)
   - Main content area: Very light gray background (#f1f1f1)
   - Accent color for bottom separator line: Light orange (#f0c29e)
   - Muted text: Medium gray (#777)

3. **Dividers and Separators**:

   - Main dividers: 2px solid black lines
   - Secondary dividers: 1px solid gray lines (#949597)
   - Special end divider: 2px solid light orange (#f0c29e)
   - Small 10% width separator lines in the sidebar sections

4. **Spacing**:
   - Consistent margin and padding utility classes (mt-2, mt-4, mb-2, etc.)
   - Approximately 60px spacing between sidebar information blocks

## Content Areas

### Sidebar Column (Left, 1/3 width)

1. **Header Area**:

   - Black horizontal line
   - Large "INVOICE" heading in all caps

2. **Invoice Information Blocks**:
   - Each section separated by small horizontal divider
   - Fields include:
     - Invoice number (with light gray "No." label)
     - Invoice date (January 5, 2018)
     - Due date (January 25, 2018)
3. **Terms Section**:

   - Bold "TERMS" heading
   - Paragraph of explanatory text

4. **Payment Methods Section**:

   - Bold "PAYMENT METHODS" heading
   - PayPal information
   - Accounting number
   - QR code (centered, fluid width)

5. **Company Branding**:
   - Bold, centered company name at bottom of sidebar

### Main Content Area (Right, 2/3 width)

1. **Header Section**:

   - Black horizontal line
   - Two-column layout with:
     - "FROM:" section with company details
     - "TO:" section with customer details
     - Both include name, ID number, address, phone, and email

2. **Invoice Note**:

   - Justified paragraph explaining invoice details

3. **Items Table**:

   - Column headers (Description, Price, Quantity, Total) with black borders above and below
   - Multiple invoice line items, each containing:
     - Item name
     - Small gray date text
     - Center-aligned price and quantity
     - Right-aligned total
   - Light gray separator between each item

4. **Totals Section**:

   - Black horizontal line above
   - Subtotal (bold)
   - Discount line (10%)
   - Taxes line (19%)
   - Special orange-ish bottom border
   - Large bold "TOTAL" text with corresponding amount

5. **Signature Area**:

   - Right-aligned signature image
   - Signer's name in bold
   - Position/title below (lighter weight)

6. **Closing Elements**:
   - Centered contact information paragraph in gray
   - "Thank you" message
   - Page number indication (right-aligned)

## Special Features

1. **Responsive Design**:

   - All images should be fluid (max-width 100%, auto height)
   - Table-based layout that maintains equal heights between columns

2. **Print Optimization**:

   - Page class for proper page breaks
   - Prevention of content breaking across pages

3. **Utility Classes**:
   - Text alignment (center, right, justify)
   - Margin and padding in various directions
   - Display block elements
   - Font weight variations
   - Classes to remove margins when needed

The final template should look modern and professional, with clear separation between the sidebar and main content, proper spacing between elements, and a consistent visual hierarchy. The design should emphasize important information like the invoice total while maintaining a clean, readable layout throughout.

Generate only the complete HTML code based on the above instructions.
