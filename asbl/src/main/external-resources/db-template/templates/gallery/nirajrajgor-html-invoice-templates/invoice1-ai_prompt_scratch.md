# Modern Clean Invoice Template Design Specification

You are tasked with creating a professional, clean HTML invoice template following modern design principles. The template should be responsive, visually appealing, and follow the specifications outlined below.

## Document Structure Requirements

Create an HTML5 document with:

- Standard DOCTYPE declaration
- English language attribute
- Essential meta tags (UTF-8 charset, X-UA-Compatible for IE, responsive viewport)
- Title "Invoice Template"
- Internal CSS stylesheet

## Design Aesthetic

The invoice should have a clean, modern aesthetic with:

- A card-like appearance with subtle shadow
- Two distinct sections: a light gray header area and a white main content area
- Generous whitespace and clean typography
- A dark navy bottom bar as a design accent

## Typography & Base Styling

1. **Font Family**:

   - Use 'Montserrat' as the primary font with Arial and sans-serif fallbacks
   - Vary font weights for visual hierarchy (normal for body text, 600 for headings)

2. **Color Scheme**:

   - Background: Light gray (#f5f5f5)
   - Invoice card: White (#fff) with light gray header (#fafafa)
   - Text: Black with varying opacity for hierarchy
   - Accent: Dark navy bottom bar (#323149)
   - Table borders: Light gray (#f3f3f3)

3. **Responsive Grid System**:
   - Implement a flexible grid system with rows and columns
   - Breakpoints at 768px and 992px for responsive behavior
   - Column classes should include col-xs-12, col-sm-6, col-sm-3, col-sm-4, col-sm-9, etc.

## Layout Structure

### Container & Wrapper

- Create a centered container with max-width of 800px
- Inside, create an invoice wrapper with max-width of 700px and box shadow

### Top Section (Header)

Design a split header with 40-60px padding that contains:

1. **Left Side (Client Information)**:

   - Client company name (20px, bold)
   - Client address (smaller, lighter color)
   - Reference heading
   - Project description with natural line breaks

2. **Right Side (Company Information)**:
   - Your company name (right-aligned, 16px, bold)
   - Your company address (right-aligned, smaller, lighter color)
   - Logo area that keeps the logo right-aligned (max height 80px)
   - Invoice date (right-aligned)

### Bottom Section (Content)

Design a white section with 40-60px padding that contains:

1. **Title Area**:

   - Large "Invoice" heading (30px, bold)
   - Good margin below (30px)

2. **Invoice Details**:

   - Left column with invoice number
   - Right column (approximately 75% width) with items table

3. **Items Table**:

   - Clean, full-width table with columns for Quantity, Description, and Price
   - Header with bottom border (2px solid #ddd)
   - Body rows with light bottom borders (1px solid #f3f3f3)
   - Last row without border
   - Empty row for spacing before totals
   - Bold total row with top border

4. **Terms Section**:

   - "Terms" heading
   - Bulleted list of payment terms

5. **Footer**:
   - Light divider line
   - Three columns with contact information (left-aligned website, centered email, right-aligned phone)
   - Dark navy bottom bar (26px height)

## Responsive Behavior

- The layout should stack on mobile devices (full width columns)
- At tablet size (768px+), columns should display side by side
- Images should be responsive with max-width 100%

## Special Elements

1. **Logo Area**:

   - Provide space for a company logo
   - Logo should be right-aligned in its container
   - Maximum height of 80px

2. **Table Styling**:

   - Clean borders (only horizontal)
   - Proper text alignment (left for text, might be right for numbers)
   - Vertical spacing between rows
   - Empty row before totals for visual separation

3. **Typography Refinements**:
   - Various headings with appropriate sizing and weights
   - Text alignment classes (left, center, right)
   - Subtle color variations for secondary text

The final result should be a professional, clean invoice template that works well across devices and presents information in a clear, organized manner. The design should convey professionalism while maintaining a modern, minimalist aesthetic.

Generate only the complete HTML code based on the above instructions.
