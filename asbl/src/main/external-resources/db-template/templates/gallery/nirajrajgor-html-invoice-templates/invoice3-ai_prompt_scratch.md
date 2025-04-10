# Modern Professional Invoice Template Design Specification

You are a skilled web designer tasked with creating a sleek, modern invoice template with a distinctive color accent, clean typography, and professional layout. The template should be responsive and visually appealing with clear sections for invoice details, line items, and payment information.

## Document Structure

Create an HTML5 document with:

- Standard DOCTYPE declaration
- HTML tag with English language attribute
- Standard meta tags (UTF-8 charset, IE compatibility, responsive viewport)
- Title "Invoice3"
- Internal CSS stylesheet

## Visual Design System

### Typography & Colors

- Use 'Montserrat' as the primary font with sans-serif fallback
- Create a distinctive colored header area with purple background (#9575CD) that extends beyond the invoice card
- Use a green accent color (rgba(0,200,83,0.95)) for important financial figures
- Implement a blue payment button (#2196F3) with white text
- Use varying shades of gray for secondary text (rgba(0,0,0,0.3), rgba(0,0,0,0.4), etc.)

### Layout Framework

- Design a responsive container system with maximum width of 1170px
- Create a floating white invoice card with subtle shadow that sits partially over the purple background
- Position the invoice card 100px from the top of the page
- Implement a clean grid system with responsive breakpoints at 768px and 992px
- Limit the invoice card width to a maximum of 700px

## Invoice Structure

### Header Section (Top)

Create a light gray (#f5f5f5) header divided into two parts:

1. **Left Section**:

   - Space for company logo (190px wide)
   - Company name in large bold text (24px)
   - Project description in smaller, lighter text (14px, rgba(0,0,0,0.3))

2. **Right Section**:
   - "INVOICE" text in bold (20px)
   - Invoice number with # prefix in lighter text (14px, rgba(0,0,0,0.3))
   - Date in lighter text (14px, rgba(0,0,0,0.3))
   - Total amount in green accent color (16px)

### Content Section (Middle)

Design a white background section with multiple service entries:

1. **Service Entry Structure**:

   - Service title in medium-sized bold text (18px)
   - Service description in smaller gray text (12px, rgba(0,0,0,0.7))
   - Price in green accent color, right-aligned (16px)
   - Optional price note in small gray text (12px)
   - Horizontal divider (light gray) between entries

2. **Totals Section**:
   - Three rows showing:
     - "SUB TOTAL" with corresponding amount
     - "DISCOUNT" with amount (prefixed with minus sign)
     - "TOTAL DUE" with final amount in green accent color
   - All labels in uppercase, right-aligned
   - Final total should be slightly larger (18px)

### Footer Section

Create a light gray background (#fafafa) footer with a three-column layout:

1. **TO Section**:

   - "TO" heading in uppercase, light gray
   - Client name in bold (16px)
   - Client address and contact details in smaller text

2. **FROM Section**:

   - "FROM" heading in uppercase, light gray
   - Company name in bold (16px)
   - Company address and contact details in smaller text

3. **NOTE Section**:
   - "NOTE" heading in uppercase, light gray
   - Special message or terms in smaller gray text
   - Maximum width of 250px

### Payment Button

Design a prominent blue (#2196F3) call-to-action button at the bottom:

- Full width of the invoice
- "PAY NOW" text in white, all caps, linked
- Centered text with comfortable padding (15px)

## Responsive Behavior

The template should:

- Stack elements appropriately on smaller screens
- Maintain proper alignment and readability at all screen sizes
- Adjust column widths at different breakpoints
- Ensure the total and payment sections remain clear and prominent on mobile

## Special Features

1. **Visual Hierarchy**:

   - Use color, size, and weight to emphasize the most important information
   - Clear distinction between sections with background color changes
   - Proper spacing to create breathing room between elements

2. **Professional Details**:
   - Currency symbol ($) preceding all monetary values
   - Invoice number with # prefix
   - Negative values for discounts with minus sign
   - Specialized color for amounts due

The result should be a polished, professional invoice template that presents financial information clearly while maintaining visual appeal and a modern design aesthetic.

Generate only the complete HTML code based on the above instructions.
