# Two-Part Professional Invoice Template Design Specification

You are tasked with creating a sophisticated dual-section invoice document template that includes both a proposal (front) and formal invoice (back) section. The design should be modern, professional, and responsive across devices.

## Document Foundation

Create an HTML5 document with:

- Standard DOCTYPE declaration
- HTML language attribute set to English
- Proper UTF-8 character encoding
- IE compatibility mode meta tag
- Responsive viewport settings
- Title "Invoice2"
- Internal stylesheet containing all necessary styling

## Design System

### Typography & Colors

- Primary font: 'Montserrat' with Arial and sans-serif fallbacks
- Background: Light gray (#f5f5f5)
- Primary accent color: Dark navy (#323149) for headers and highlights
- Text colors: Dark for main content, white for text on dark backgrounds
- Semi-transparent white (opacity 0.7-0.8) for secondary text on dark backgrounds

### Layout Framework

- Responsive container system with maximum width of 1170px
- Flexible row and column grid system with breakpoints at 768px and 992px
- Box shadow effect (0 3px 6px rgba) for card-like appearance
- Bottom accent bar in dark navy

## Front Section (Proposal Design)

### Header Area

Design a bold dark navy (#323149) header section that includes:

1. **Two-column layout**:

   - Left side: Freelancer/sender information with:
     - Full name in white, larger text (22px)
     - Professional title in semi-transparent white
     - Location in smaller, semi-transparent white
   - Right side: Client information with:
     - Client name in white, aligned right
     - Company name in semi-transparent white, aligned right
     - Location in semi-transparent white, aligned right
     - Space for a right-aligned company logo

2. **Project Information**:
   - Large white heading describing the service (22px)
   - Date in lighter, smaller text (14px)

### Content Area

Design a white content section containing:

1. **Project Description**:

   - Paragraph with line height of 1.6 explaining the service offering
   - "Specifications" subheading

2. **Specifications Table**:
   - Borderless table listing key project details
   - Include rows for:
     - Hourly rate ($50/hour)
     - Estimated time (100 hours)
     - Start and end dates
     - Deliverables (files provided)
   - Table should occupy approximately 75-80% of the content width

## Back Section (Invoice Design)

### Header Area

Design a subtle gradient header (light gray to lighter gray) containing:

1. **Two-column layout**:
   - Left side: Freelancer/sender information with:
     - Full name, professional title, and location
     - "Invoice" heading with increased spacing above (40px margin)
     - Invoice date in smaller, lighter text
   - Right side: Client information with:
     - Client name, company, and location, all right-aligned

### Content Area

Design a white content section containing:

1. **Task Table**:

   - Position the table to overlap the header and body sections (negative margin)
   - Include column headers: TASK DESCRIPTION, RATE, HOURS, TOTAL
   - Task description column should be approximately 60% of table width
   - Each task row should include:
     - Task name (larger, bolder text)
     - Task description (lighter, smaller text)
     - Rate, hours, and total columns

2. **Total Calculation Area**:

   - Light gray background (#fafafa)
   - Left side showing:
     - SUBTOTAL in one box
     - A plus sign
     - TAXES in another box
   - Right side showing:
     - TOTAL amount in a dark navy box with white text
   - 50px top margin to separate from the task table

3. **Footer**:
   - Light horizontal divider
   - Three columns containing:
     - Left-aligned website
     - Center-aligned email
     - Right-aligned phone number
   - Dark navy bottom bar (26px height)

## Responsive Behavior

The template should:

- Stack columns on mobile devices
- Display side-by-side on tablets and larger screens
- Maintain proper spacing and alignment at all breakpoints
- Ensure text remains readable at all sizes

## Special Elements

1. **Card Styling**:

   - Both sections should appear as individual cards with subtle shadows
   - 20px vertical margin between cards
   - Maximum width of 700px for both cards

2. **Table Styling**:

   - Front section: Borderless specification table with increased vertical spacing
   - Back section: Task table with minimal borders and increased row padding (25px)

3. **Pricing Elements**:
   - Currency symbol ($) preceding all monetary values
   - Clear hierarchy in the totals section

The final result should be a cohesive, professional template that presents both a project proposal and formal invoice in a visually appealing, easy-to-read format suitable for business correspondence.

Generate only the complete HTML code based on the above instructions.
