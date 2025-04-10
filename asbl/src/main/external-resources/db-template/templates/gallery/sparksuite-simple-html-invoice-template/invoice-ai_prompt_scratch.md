# Clean and Simple Invoice Template Design Specification

You are tasked with creating a minimal, professional HTML invoice template that prioritizes readability and clean design. The template should be responsive and suitable for businesses of all sizes.

## Document Foundation

Create an HTML5 document with:

- Standard DOCTYPE declaration
- HTML tag with English language attribute
- UTF-8 character encoding
- Responsive viewport meta tag
- Descriptive title: "A simple, clean, and responsive HTML invoice template"
- Optional favicon link

## Design Aesthetic

The template should follow a clean, minimalist design with:

- Ample white space
- Subtle shadows and borders
- Readable typography
- Balanced layout with clear section separation

## Typography & Color Scheme

1. **Font Family**:

   - Use 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif as the font stack
   - This provides a clean, professional appearance across various systems

2. **Text Styles**:

   - Body text: Medium gray (#777), centered alignment
   - Headings:
     - H1: Black (#000), light weight (300)
     - H3: Dark gray (#555), light weight (300), italic style
   - Invoice content: Medium-dark gray (#555)
   - Links: Bright blue (#06f)

3. **Invoice Container**:
   - White background
   - Light gray border (#eee)
   - Subtle box shadow (0 0 10px rgba with 15% opacity)
   - Comfortable padding (30px)
   - Maximum width of 800px, centered on page

## Content Structure

The invoice should be structured as a series of nested tables with the following sections:

### 1. Header Section

- Company logo/name on the left (large 45px font if text-based)
- Invoice details on the right:
  - Invoice number
  - Creation date
  - Due date
- Good spacing between header and next section (20px padding)

### 2. Contact Information Section

- Invoice sender (your company) information on the left:
  - Company name
  - Street address
  - City, state, zip code
- Client information on the right:
  - Company name
  - Contact person
  - Email address
- Substantial spacing after this section (40px padding)

### 3. Payment Method Section

- Two-column layout with light gray background (#eee)
- Left column: "Payment Method" heading
- Right column: Check/reference number
- Bold text for both columns
- Bottom border (1px solid #ddd)
- Detail row below with actual payment information
- Good spacing after details (20px)

### 4. Invoice Items Section

- Two-column table for listing products/services
- Column headers with light gray background (#eee):
  - "Item" (left-aligned)
  - "Price" (right-aligned)
- Individual item rows with:
  - Item description in left column
  - Price in right column
  - Light bottom border (1px solid #eee)
  - No border on last item

### 5. Total Section

- Empty left column
- Right column with:
  - "Total:" followed by the amount
  - Double-weight top border (2px solid #eee)
  - Bold text

## Table Layout Specifications

1. **Base Table Properties**:

   - 100% width
   - Collapsed borders
   - Left-aligned text by default
   - Inherited line height

2. **Cell Formatting**:
   - 5px padding
   - Vertical alignment at top
   - Right-aligned text in second column

## Responsive Behavior

For small screens (max-width: 600px):

- Top section (logo and invoice details) should stack vertically
- Information section (company and client details) should stack vertically
- All stacked elements should be center-aligned
- Content should remain readable without horizontal scrolling

The final template should be clean, professional, and present invoice information in a straightforward manner that is easy to read and understand at a glance.

Generate only the complete HTML code based on the above instructions.
