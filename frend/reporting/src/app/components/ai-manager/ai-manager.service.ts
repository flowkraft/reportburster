import { Injectable } from '@angular/core';

// Define the structure for prompt information
export interface PromptInfo {
  id: string; // Unique identifier for the prompt
  title: string; // Short, descriptive title
  description: string; // Brief explanation of the prompt's purpose
  promptText: string; // The actual prompt text
  tags: string[]; // Keywords for categorization and searching
  category:
  | 'Database Schema'
  | 'Template Creation/Modification'
  | 'Email Templates'
  | 'Email Templates (Responsive)'
  | 'Excel Report Generation'
  | 'JasperReports (.jrxml) Generation'
  | 'PDF Generation (from HTML)'
  | 'PDF Generation (from XSL-FO)'
  | 'SQL Writing Assistance'
  | 'Script Writing Assistance'
  | 'Dashboard Creation'
  | 'DSL Configuration'
  | 'Web Portal / CMS'
;
}

@Injectable({
  providedIn: 'root',
})
export class AiManagerService {
  constructor() { }

  // Shared HTML layout rules for dashboard prompts — used by both
  // DASHBOARD_BUILD_LAYOUT and DASHBOARD_BUILD_STEP_BY_STEP_INSTRUCTIONS
  private static readonly DASHBOARD_HTML_RULES = `1. **Visually self-contained** — this HTML will be injected into an existing page's DOM, so it MUST NOT leak styles or be affected by parent styles. Follow these CSS isolation rules strictly:
   - Wrap the entire dashboard in a single root \`<div class="rb-dashboard-root">\` container.
   - Start the \`<style>\` block with \`.rb-dashboard-root { all: initial; display: block; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; }\` to reset all inherited styles.
   - Add \`.rb-dashboard-root *, .rb-dashboard-root *::before, .rb-dashboard-root *::after { box-sizing: inherit; }\` to reset box-sizing for all children.
   - **Every CSS selector MUST be scoped** under \`.rb-dashboard-root\` (e.g., \`.rb-dashboard-root h1 {}\`, \`.rb-dashboard-root .kpi-card {}\`). Never use bare element selectors like \`h1 {}\`, \`p {}\`, \`div {}\`.
   - Use a \`<style>\` block (not inline styles on each element) — but every rule must be scoped under \`.rb-dashboard-root\`.
   - Do NOT use \`<link>\` tags, \`@import\`, or external stylesheets.
2. **No JavaScript** — no \`<script>\` tags. The web components are self-initializing.
3. **Layout with CSS Grid or Flexbox** — arrange components in a responsive dashboard layout. Use CSS Grid for the overall dashboard grid and Flexbox for smaller arrangements.
4. **Add HTML context around components** — include headings, section titles, summary cards, KPI boxes, or any other HTML elements that make the dashboard informative and professional.
5. **Responsive design** — the dashboard should look good on different screen sizes. Use relative units and media queries where appropriate.
6. **Visual identity — cohesive color theme** — pick a color palette that fits the business domain, not random or generic blue-gray. Define colors as CSS variables in the style block for consistency. Use a dominant neutral for backgrounds, one or two accent colors for KPIs and highlights, and subtle borders or separators. Avoid the default Bootstrap look — make intentional color choices. Avoid cliché AI aesthetics (purple gradients, neon glows).
7. **Typography — clear hierarchy** — use font weight and size to create a clear visual hierarchy: dashboard title > section headings > KPI values > KPI labels > body text. KPI numbers should be large and bold — they are the first thing the eye hits. System fonts are fine but use them with intention — vary weight, size, and letter-spacing to create contrast. Do not use more than 2–3 font sizes; hierarchy comes from weight and spacing, not endless size variations.
8. **Spacing and polish** — use generous, consistent spacing between sections — white space is a design tool, not wasted space. Cards and sections should have consistent padding, border-radius, and subtle shadows or borders. Align elements to a visible grid — nothing should look randomly placed. Small details matter: consistent border-radius values, subtle hover states on interactive elements, smooth color transitions.`;

  // Repository of AI prompts
  prompts: Array<PromptInfo> = [
    // --- Database Schema ---
    {
      id: 'DB-SCHEMA-DOMAIN-GROUPED',
      title: 'Generate Domain-Grouped Schema',
      description:
        'Transforms a flat database schema into a domain-grouped schema, preserving all input table objects word-for-word.',
      promptText: `You are an expert Database Modeler and Data Architect. Your mission is to transform a given flat JSON database schema into a "Domain-Grouped Schema". This new schema should logically organize tables into business domains and present this hierarchy in a JSON format optimized for tree-like UI controls (such as PrimeNG p-tree).
    
    **INPUT:**
    
    \`\`\`json
    [INSERT YOUR DATABASE SCHEMA HERE]
    \`\`\`
        
    The above JSON object represents the existing database schema. It typically includes an array of tables, where each table details its name, columns, primary keys, foreign keys, and other metadata. **You must preserve every part of the input table objects exactly as provided—your output should include the identical table data, simply organized into groups by domain.**
    
    **YOUR TASK:**
    
    * Analyze Schema: Thoroughly examine the input schema. Identify table names, column semantics, and relationships (both explicit via foreign keys and implicit from naming conventions or common business understanding).
    * Define Business Domains: Identify logical business domains (e.g., "Sales & Orders", "Product Catalog", "Customer Management", "Human Resources", "Inventory"). These domains should reflect distinct functional areas of a business.
    * Group Tables: Assign each table from the input schema to the most relevant business domain. A table should belong to one primary domain.
    * Structure for Tree UI: Organize the domains and their tables into a hierarchical JSON structure suitable for a tree display. **When grouping, include each table exactly as provided in the input schema—no modifications or additional fields.**
    
**OUTPUT REQUIREMENTS:** You must return a single JSON object with two top-level properties:

1.  **\`originalSchema\`**: This property MUST contain the exact, unmodified input JSON schema that you received.

2.  **\`domainGroupedSchema\`**: This property MUST be an array. The elements of this array can ONLY be "Domain Objects".
    *   **Domain Object Structure:** Each "Domain Object" MUST have the following two properties and NO OTHERS at its top level:
        *   \`"label"\`: (String) The display name for the business domain or sub-domain (e.g., "Sales & Orders").
        *   \`"children"\`: (Array) An array containing the items belonging to this domain. The elements of this \`children\` array can be:
            *   **Nested "Domain Objects":** Allowing for hierarchical sub-domains. These nested "Domain Objects" MUST follow the same structure (\`label\` and \`children\`).
            *   **"Table Objects":** These "Table Objects" MUST be 101% identical copies of the corresponding table objects found in the \`originalSchema\`. They are placed directly into the \`children\` array without any wrapper object or any modification whatsoever (no added \`label\` property, no \`type\` property, etc.). The UI will identify these as tables by their inherent structure (e.g., presence of \`tableName\`, \`columns\` properties which are part of the \`originalSchema\` table structure) and will derive their display name from the table's original naming property (e.g., \`tableName\`).

    *   **Example \`domainGroupedSchema\` Structure:**
        \`\`\`json
        [
          {
            "label": "Customer Management (Top-Level Domain)",
            "children": [
              {
                // Table object for 'Customers', IDENTICAL to its entry in originalSchema.
                // Example: { "tableName": "Customers", "columns": [...], ...otherOriginalProps }
              },
              {
                "label": "Location Data (Sub-Domain)", // This is a nested "Domain Object"
                "children": [
                  {
                    // Table object for 'Addresses', IDENTICAL to originalSchema
                  },
                  {
                    // Table object for 'Countries', IDENTICAL to originalSchema
                  }
                ]
              }
            ]
          },
          {
            "label": "Product Catalog (Top-Level Domain)",
            "children": [
              {
                // Table object for 'Products', IDENTICAL to originalSchema
              },
              {
                // Table object for 'Categories', IDENTICAL to originalSchema
              }
            ]
          }
          // ... other top-level "Domain Objects"
        ]
        \`\`\`

*   If a domain can be logically broken down into sub-domains, you can nest them by including an additional "children" array within the domain object.
*   Ensure every table from the \`originalSchema\` is represented exactly once within one of the \`children\` arrays in the \`domainGroupedSchema\` hierarchy, as an identical copy.
*   **Strict Adherence:** The structure described above for \`domainGroupedSchema\` and its "Domain Objects" is absolute. Do not introduce any other properties or deviate from this format.
    
    GUIDELINES FOR DOMAIN GROUPING:
    
    * **Business Relevance:** Groupings should make sense from a business process perspective. Name domains based on business function (and not technical purpose) and strive for names that are intuitive to business users.
    * **Cohesion:** Tables that are frequently used together or manage closely related entities (e.g., Orders and OrderDetails) should typically be grouped within the same domain.
    * **Clarity:** The domain names and structure should be clear and unambiguous.
    * **Completeness:** All tables from the input schema must be assigned to a single domain (no duplication).
    * **Common Sense & Standard Practices:** Apply your expertise in database modeling and your knowledge of common business structures (like CRM, ERP modules) to form the most 
    logical groupings, even if relationships are not explicitly defined via foreign keys.
    
    Be decisive and use common sense when the domain isn't obvious from the schema alone.
    
    Produce a single, valid JSON object as your output. Your goal is to reliably return the best possible and most common-sense 
    "Domain-Grouped Schema" based on the input, while preserving every aspect of the original schema exactly as provided—only 
    grouping the tables by business domain.`,
      tags: ['database', 'schema', 'domain-grouped'],
      category: 'Database Schema',
    },
    {
      id: 'DB-SCHEMA-ER-DIAGRAM-PLANTUML',
      title: 'Generate ER Diagram',
      description:
        'Converts a flat database schema into a comprehensive Entity-Relationship diagram using Chen Notation in PlantUML format.',
      promptText: `You are an expert Database Modeler and Visual Designer specializing in Entity-Relationship (ER) diagrams using PlantUML. Your mission is to transform a given flat JSON database schema into a complete, high quality ER diagram expressed in PlantUML syntax. This diagram must accurately represent every table, column, primary key, and foreign key as provided in the input JSON, using the stylistic conventions of PlantUML's crow's foot notation.

**INPUT:**

\`\`\`json
[INSERT YOUR DATABASE SCHEMA HERE]
\`\`\`

The above JSON object represents the existing database schema. It typically includes an array of tables, where each table details its name, columns, primary keys, foreign keys, and other metadata.

**YOUR TASK:**

1. **Analyze the Schema:**  
   - Examine the input JSON in depth to extract all tables (entities), columns (attributes), primary keys, and any **explicit foreign key definitions** (e.g., from a \`foreignKeys\` array within each table object).
   - Identify all relationships based on these **explicit foreign key definitions** if they are present.
   - **Crucially, if explicit foreign keys are missing, incomplete, or if the \`foreignKeys\` array is empty for tables, you MUST use your expertise as a Database Modeler and business analyst to infer logical relationships.** Base these inferences on common naming conventions (e.g., a \`CustomerID\` column in an \`Orders\` table implies a link to a \`Customers\` table's primary key, or a \`ProductID\` in an \`Order Details\` table links to a \`Products\` table) and typical business entity interconnections. Your goal is to produce a diagram with **complete and accurate relationships**, reflecting how these entities would realistically interconnect in a business context. Ensure every logical relationship is captured.

2. **Translate to an ER Diagram Using PlantUML Crow's Foot Notation:**  
   - For each table, create an entity using PlantUML's ERD syntax. Represent entities with clear boundaries and list their attributes (columns) inside the entity block.
   - Clearly distinguish primary keys within each entity by prefixing with \`+\` (e.g., \`+CustomerID : INTEGER\`).
   - Represent foreign keys by defining relationships using PlantUML's crow's foot notation (e.g., \`OrderDetails }|--|| Orders : "OrderID"\`). Ensure these relationships accurately reflect both explicit and inferred foreign keys.
   - Use \`@startuml\` and \`@enduml\` delimiters.

3. **Output Requirements:**  
   - The output must be a single, self-contained PlantUML script that, when processed by a PlantUML renderer, displays the complete ER diagram.
   - The generated PlantUML script should contain only the PlantUML syntax necessary for the diagram definition and must exclude all explanatory comments.

**Example:**

\`\`\`plantuml
@startuml
entity CUSTOMER {
  +CustomerID : INTEGER
  Name : VARCHAR
}
entity ORDER {
  +OrderID : INTEGER
  CustomerID : INTEGER
}
ORDER }|--|| CUSTOMER : "CustomerID"
@enduml
\`\`\`

Produce a single, fully valid PlantUML script as your output that generates this ER diagram. Your goal is to reliably convert the input flat JSON database schema into a comprehensive and visually appealing ER diagram using PlantUML's crow's foot notation, with all logical relationships accurately depicted.

The generated PlantUML script should contain only the PlantUML syntax necessary for the diagram definition and must exclude all explanatory comments.`,
      tags: ['database', 'schema', 'er-diagram'],
      category: 'Database Schema',
    },
    // --- Email Templates ---
    {
      id: 'EMAIL_PAYSLIP_NOTIFICATION',
      title: 'Payslip Notification Email',
      description: 'Email template to notify employees about new payslips',
      promptText: `Create a professional email template for notifying employees that their new payslip is available. The template should:

1. Have a clear subject line indicating this is a payslip notification
2. Include placeholders for personalization (employee name, payroll period)
3. Provide brief instructions on how to access and view the payslip
4. Include any necessary security reminders about protecting sensitive information
5. Contain appropriate professional sign-off from the HR/Payroll department
6. Use a clean, professional layout with minimal formatting (suitable for email clients)

Please provide the complete email template with HTML formatting and inline CSS.`,
      tags: ['email-template', 'payslip', 'notification', 'employee'],
      category: 'Email Templates',
    },
    {
      id: 'EMAIL_INVOICE_NOTIFICATION',
      title: 'Invoice Notification Email',
      description: 'Email template to notify customers about new invoices',
      promptText: `Create a professional email template for a company to notify customers that a new invoice has been generated. The template should:

1. Have a clear subject line that's professional and action-oriented
2. Include placeholders for personalization (customer name, invoice number, amount due, due date)
3. Provide a brief summary of the invoice details
4. Include clear payment instructions and available payment methods
5. Mention that the invoice is attached or provide instructions to access it online
6. Include a call-to-action button/link for making the payment
7. Provide contact information for billing inquiries
8. Include appropriate branding elements and professional layout
9. Include necessary legal/confidentiality text in the footer

Please provide the complete email template with HTML formatting and inline CSS.`,
      tags: ['email-template', 'invoice', 'notification', 'customer'],
      category: 'Email Templates',
    },

    {
      id: 'EMAIL_BOXED_1COLUMN_RESPONSIVE',
      title:
        'A fundamental, single-column responsive template with a boxed layout',
      description:
        'A fundamental, single-column responsive template with a boxed layout',
      promptText: `You are an expert front-end developer specializing in creating bulletproof, responsive HTML emails that are fully compatible with all major email clients, 
including Outlook (all versions), Gmail, Apple Mail, and Office 365.

Your task is to generate the complete HTML and CSS for a responsive email template. This template should be a modern interpretation of a classic, 
industry-standard email blueprint that features a **fundamental, single-column responsive template with a boxed layout**.

**Core Requirements:**

1.  **Layout:**
    *   A centered, **boxed layout** with a maximum width of 600px.  
    *   The email body background (outside the 600px box) should be a light gray (\`#f4f4f4\`).  
    *   The main content box should have a white background (\`#ffffff\`).  

2.  **Structure:**
    *   A **single-column layout** throughout.  
    *   Include sections for a preheader, a main header (for a logo), a main content area for a headline, body text, and a call-to-action button, and a footer section.  

3.  **Responsiveness:**
    *   The template must be fully responsive using **CSS media queries**.  
    *   The layout should scale fluidly to fit the screen width on mobile devices.  

**Technical Implementation Details:**

*   **Tables for Layout:** Use \`<table>\` elements for the entire structure to ensure maximum compatibility. Set \`role="presentation"\`, \`cellpadding="0"\`, \`cellspacing="0"\`, and \`border="0"\` on all layout tables.  
*   **Inline CSS:** All critical presentation styles (colors, fonts, padding, borders) must be inlined on the HTML elements to work in clients like Gmail.  
*   **\`<style>\` Block:** Use a \`<style>\` block in the \`<head>\` for:  
    *   Responsive styles inside an \`@media (max-width: 600px)\` block.  
    *   Class-based styles and link styling (\`a:hover\`, etc.) for clients that support it.  
*   **Outlook Compatibility:** Use \`<!--[if mso]> ... <![endif]-->\` conditional comments where necessary to ensure proper rendering in Outlook.  
*   **Content Placeholders:** Use clear, descriptive placeholders for all content, such as \`[LOGO_URL]\`, \`[HEADLINE_TEXT]\`, \`[MAIN_CONTENT_PARAGRAPH]\`, \`[CTA_BUTTON_LINK]\`, and \`[UNSUBSCRIBE_LINK]\`.  
*   **Accessibility:** Ensure all \`<img>\` tags have descriptive \`alt\` text.  

Provide the complete, ready-to-use HTML file in a single code block.`,
      tags: ['email-template-responsive', 'one-column'],
      category: 'Email Templates (Responsive)',
    },

    {
      id: 'EMAIL_BOXED_1COLUMN_IMAGE_RESPONSIVE',
      title:
        'A basic responsive template with a boxed layout designed to feature a prominent body image',
      description:
        'A basic responsive template with a boxed layout designed to feature a prominent body image',
      promptText: `You are an expert front-end developer specializing in creating bulletproof, responsive HTML emails that are fully compatible with all major email clients, 
including Outlook (all versions), Gmail, Apple Mail, and Office 365.

Your task is to generate the complete HTML and CSS for a responsive email template. This template should be a modern interpretation of a classic, industry-standard email blueprint that features a **basic, single-column, boxed layout with a prominent, full-width body image**.

**Core Requirements:**

1.  **Layout:**
    *   A centered, **boxed layout** with a maximum width of 600px.  
    *   The email body background (outside the 600px box) should be a light gray (\`#f4f4f4\`).  
    *   The main content box should have a white background (\`#ffffff\`).  

2.  **Structure:**
    *   A **single-column layout** throughout.  
    *   Include sections for a preheader and a main header (for a logo).  
    *   A **prominent hero image section** where the image spans the full width of the 600px container.  
    *   A main content area below the image for a headline, body text, and a call-to-action button.  
    *   A footer section.  

3.  **Responsiveness:**
    *   The template must be fully responsive using **CSS media queries**.  
    *   The hero image must scale fluidly to fit the screen width on mobile devices.  

**Technical Implementation Details:**

*   **Tables for Layout:** Use \`<table>\` elements for the entire structure to ensure maximum compatibility. Set \`role="presentation"\`, \`cellpadding="0"\`, \`cellspacing="0"\`, and \`border="0"\` on all layout tables.  
*   **Inline CSS:** All critical presentation styles (colors, fonts, padding, borders) must be inlined on the HTML elements to work in clients like Gmail.  
*   **\`<style>\` Block:** Use a \`<style>\` block in the \`<head>\` for:  
    *   Responsive styles inside an \`@media (max-width: 600px)\` block, including styles to make images fluid.  
    *   Class-based styles and link styling (\`a:hover\`, etc.) for clients that support it.  
*   **Outlook Compatibility:** Use \`<!--[if mso]> ... <![endif]-->\` conditional comments where necessary to ensure proper rendering in Outlook.  
*   **Content Placeholders:** Use clear, descriptive placeholders for all content, such as \`[LOGO_URL]\`, \`[HERO_IMAGE_URL]\`, \`[HEADLINE_TEXT]\`, \`[MAIN_CONTENT_PARAGRAPH]\`, \`[CTA_BUTTON_LINK]\`, and \`[UNSUBSCRIBE_LINK]\`.  
*   **Accessibility:** Ensure all \`<img>\` tags have descriptive \`alt\` text.  

Provide the complete, ready-to-use HTML file in a single code block.`,
      tags: ['email-template-responsive', 'one-column', 'email-image'],
      category: 'Email Templates (Responsive)',
    },

    {
      id: 'EMAIL_BOXED_2COLUMN_RESPONSIVE',
      title:
        'A responsive template with a boxed layout and a two-column structure',
      description:
        'A responsive template with a boxed layout and a two-column structure',
      promptText: `You are an expert front-end developer specializing in creating bulletproof, responsive HTML emails that are fully compatible with all major email clients, 
including Outlook (all versions), Gmail, Apple Mail, and Office 365.

Your task is to generate the complete HTML and CSS for a responsive email template. This template should be a modern interpretation of a classic, 
industry-standard email blueprint that features a **boxed layout with a two-column structure that becomes a single column on mobile devices using media queries**.

**Core Requirements:**

1.  **Layout:**
    *   A centered, **boxed layout** with a maximum width of 600px.  
    *   The email body background (outside the 600px box) should be a light gray (\`#f4f4f4\`).  
    *   The main content box should have a white background (\`#ffffff\`).

2.  **Structure:**
    *   A **two-column layout** for the main content area.  
        *   The left column should be the main content area, approximately 400px wide.  
        *   The right column should be a sidebar, approximately 200px wide.  
    *   Include sections for a preheader, a main header (for a logo), the two-column content body, and a footer.

3.  **Responsiveness:**
    *   The template must be fully responsive using **CSS media queries**.  
    *   On screens narrower than 600px, the two columns must stack vertically, with the main content appearing above the sidebar. Each stacked column should expand to fill the full width of the container.

**Technical Implementation Details:**

*   **Tables for Layout:** Use \`<table>\` elements for the entire structure to ensure maximum compatibility. Set \`role="presentation"\`, \`cellpadding="0"\`, \`cellspacing="0"\`, and \`border="0"\` on all layout tables.  
*   **Inline CSS:** All critical presentation styles (colors, fonts, padding, borders) must be inlined on the HTML elements to work in clients like Gmail.  
*   **\`<style>\` Block:** Use a \`<style>\` block in the \`<head>\` for:  
    *   Responsive styles inside an \`@media (max-width: 600px)\` block.  
    *   Class-based styles and link styling (\`a:hover\`, etc.) for clients that support it.  
*   **Outlook Compatibility:** Use \`<!--[if mso]> ... <![endif]-->\` conditional comments (ghost tables) to wrap the columns and ensure Outlook renders the two-column layout correctly without adding extra spacing.  
*   **Content Placeholders:** Use clear, descriptive placeholders for all content, such as \`[LOGO_URL]\`, \`[HEADLINE_TEXT]\`, \`[MAIN_CONTENT_PARAGRAPH]\`, \`[CTA_BUTTON_LINK]\`, and \`[UNSUBSCRIBE_LINK]\`.  
*   **Accessibility:** Ensure all \`<img>\` tags have descriptive \`alt\` text.

Provide the complete, ready-to-use HTML file in a single code block.`,
      tags: ['email-template-responsive', 'two-column'],
      category: 'Email Templates (Responsive)',
    },

    {
      id: 'EMAIL_BOXED_2COLUMN_IMAGE_RESPONSIVE',
      title:
        'A responsive two-column template with a boxed layout that includes a body image',
      description:
        'A responsive two-column template with a boxed layout that includes a body image',
      promptText: `You are an expert front-end developer specializing in creating bulletproof, responsive HTML emails that are fully compatible with all major email clients in 2025, including Outlook (all versions), Gmail, Apple Mail, and Office 365.

Your task is to generate the complete HTML and CSS for a responsive email template. This template should be a modern interpretation of a classic, industry-standard email blueprint that features a **boxed layout, a prominent body image, and a two-column content section**.

**Core Requirements:**

1.  **Layout:**
    *   A centered, **boxed layout** with a maximum width of 600px.  
    *   The email body background (outside the 600px box) should be a light gray (\`#f4f4f4\`).  
    *   The main content box should have a white background (\`#ffffff\`).  

2.  **Structure:**
    *   Include sections for a preheader and a main header (for a logo).  
    *   A **prominent hero image** section where the image spans the full width of the 600px container.  
    *   Below the image, a **two-column layout** for the main content area:  
        *   The left column should be the main content area, approximately 400px wide.  
        *   The right column should be a sidebar, approximately 200px wide.  
    *   A footer section.  

3.  **Responsiveness:**
    *   The template must be fully responsive using **CSS media queries**.  
    *   On screens narrower than 600px, the two columns must stack vertically, with the main content appearing above the sidebar. Each stacked column should fill the full width.  
    *   The hero image must scale fluidly to fit the screen width on mobile devices.  

**Technical Implementation Details:**

*   **Tables for Layout:** Use \`<table>\` elements for the entire structure to ensure maximum compatibility. Set \`role="presentation"\`, \`cellpadding="0"\`, \`cellspacing="0"\`, and \`border="0"\` on all layout tables.  
*   **Inline CSS:** All critical presentation styles (colors, fonts, padding, borders) must be inlined on the HTML elements to work in clients like Gmail.  
*   **\`<style>\` Block:** Use a \`<style>\` block in the \`<head>\` for:  
    *   Responsive styles inside an \`@media (max-width: 600px)\` block, including fluid image styles.  
    *   Class-based styles and link styling (\`a:hover\`, etc.) for clients that support them.  
*   **Outlook Compatibility:** Use \`<!--[if mso]> ... <![endif]-->\` conditional comments (ghost tables) to wrap the two-column section and ensure Outlook renders it correctly without extra spacing.  
*   **Content Placeholders:** Use clear, descriptive placeholders for all content, such as \`[LOGO_URL]\`, \`[HERO_IMAGE_URL]\`, \`[HEADLINE_TEXT]\`, \`[MAIN_CONTENT_PARAGRAPH]\`, \`[CTA_BUTTON_LINK]\`, and \`[UNSUBSCRIBE_LINK]\`.  
*   **Accessibility:** Ensure all \`<img>\` tags have descriptive \`alt\` text.  

Provide the complete, ready-to-use HTML file in a single code block.`,
      tags: ['email-template-responsive', 'two-column', 'email-image'],
      category: 'Email Templates (Responsive)',
    },

    {
      id: 'EMAIL_BOXED_3COLUMN_RESPONSIVE',
      title:
        'A responsive template with a boxed layout and a three-column structure',
      description:
        'A responsive template with a boxed layout and a three-column structure',
      promptText: `You are an expert front-end developer specializing in creating bulletproof, responsive HTML emails that are fully compatible with all major email clients, 
including Outlook (all versions), Gmail, Apple Mail, and Office 365.

Your task is to generate the complete HTML and CSS for a responsive email template. This template should be a modern interpretation of a classic, industry-standard email 
blueprint that features a **boxed layout with a three-column structure that becomes a single column on mobile devices using media queries**.

**Core Requirements:**

1.  **Layout:**
    *   A centered, **boxed layout** with a maximum width of 600px.  
    *   The email body background (outside the 600px box) should be a light gray (\`#f4f4f4\`).  
    *   The main content box should have a white background (\`#ffffff\`).

2.  **Structure:**
    *   A **three-column layout** for the main content area.  
        *   Each column should be approximately 200px wide.  
    *   Include sections for a preheader, a main header (for a logo), the three-column content body, and a footer.

3.  **Responsiveness:**
    *   The template must be fully responsive using **CSS media queries**.  
    *   On screens narrower than 600px, the three columns must stack vertically, each expanding to fill the full width of the container.

**Technical Implementation Details:**

*   **Tables for Layout:** Use \`<table>\` elements for the entire structure to ensure maximum compatibility. Set \`role="presentation"\`, \`cellpadding="0"\`, \`cellspacing="0"\`, and \`border="0"\` on all layout tables.  
*   **Inline CSS:** All critical presentation styles (colors, fonts, padding, borders) must be inlined on the HTML elements to work in clients like Gmail.  
*   **\`<style>\` Block:** Use a \`<style>\` block in the \`<head>\` for:  
    *   Responsive styles inside an \`@media (max-width: 600px)\` block.  
    *   Class-based styles and link styling (\`a:hover\`, etc.) for clients that support it.  
*   **Outlook Compatibility:** Use \`<!--[if mso]> ... <![endif]-->\` conditional comments (ghost tables) to wrap the columns and ensure Outlook renders the three-column layout correctly without adding extra spacing.  
*   **Content Placeholders:** Use clear, descriptive placeholders for all content, such as \`[LOGO_URL]\`, \`[HEADLINE_TEXT]\`, \`[COLUMN_CONTENT]\`, \`[CTA_BUTTON_LINK]\`, and \`[UNSUBSCRIBE_LINK]\`.  
*   **Accessibility:** Ensure all \`<img>\` tags have descriptive \`alt\` text.

Provide the complete, ready-to-use HTML file in a single code block.`,
      tags: ['email-template-responsive', 'three-column'],
      category: 'Email Templates (Responsive)',
    },

    // --- Template Creation/Modification ---
    {
      id: 'CREATE_SALES_REPORT_HTML',
      title: 'Create Sales Report HTML Template',
      description:
        'Generates a basic HTML template for a monthly sales report with standard sections.',
      promptText: `Create a clean, professional HTML template for a monthly sales report with sections for summary metrics, regional performance, top products, and year-over-year comparisons. Return fully self-contained HTML code with inline CSS—no partial or snippet formats.`,
      tags: ['sales', 'report', 'html'],
      category: 'Template Creation/Modification',
    },
    {
      id: 'MODIFY_EXISTING_HTML',
      title: 'Modify Existing HTML Template',
      description:
        'Applies user-specified changes to a provided HTML template.',
      promptText: `You are an HTML customization assistant. Your task is to take the **Customization instructions** provided below and apply them to the **Reference HTML template**. Generate the updated HTML code based on the instructions.

**Customization Instructions**

[...Provide your specific instructions here...]

**Reference HTML Template**

\`\`\`html
[...Paste your existing HTML template code here...]
\`\`\`

Output only the complete updated HTML template with the applied changes.`,
      tags: ['modify', 'html', 'customize'],
      category: 'Template Creation/Modification',
    },
    {
      id: 'BUILD_TEMPLATE_FROM_SCRATCH',
      title: 'Build HTML Template from Detailed Instructions',
      description:
        'Creates a custom HTML template based on detailed, step-by-step requirements provided by the user.',
      promptText: `You are tasked with creating a professional HTML template based on the following detailed design specification. Ensure the final output is fully self-contained HTML with inline CSS.

# Template Design Specification

[...Provide your detailed design specification here, covering layout, sections, styling, content structure, etc...]

Generate only the complete HTML code based on the above instructions.`,
      tags: ['create', 'html', 'detailed'],
      category: 'Template Creation/Modification',
    },
    {
      id: 'REPLICATE_DESIGN_FROM_SCREENSHOT',
      title: 'Replicate Design from Screenshot',
      description:
        'Generates HTML code attempting to match the design shown in an uploaded screenshot.',
      promptText: `Recreate the identical design as shown in the provided image as HTML. Return fully self-contained HTML code with inline CSS—no partial or snippet formats.`,
      tags: ['visual', 'replicate', 'html'],
      category: 'Template Creation/Modification',
    },

    // --- Dashboard Creation ---
    {
      id: 'DASHBOARD_BUILD_LAYOUT',
      title: 'Build Dashboard Layout with Web Components',
      description:
        'Creates an HTML dashboard template that mixes layout HTML with self-initializing <rb-*> web components for data tables, charts, and pivot tables.',
      promptText: `You are an expert at building data dashboards using HTML and ReportBurster web components. Your task is to create an HTML dashboard template that combines regular HTML layout with self-initializing web components.

# Dashboard Requirements

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE DASHBOARD HERE]
</REQUIREMENT>

# Available Web Components

The following web components are **self-initializing** — they automatically fetch their own data from the server. You only need to place them in the HTML with the correct attributes. **Do NOT add any <script> tags or JavaScript** — the components handle everything internally.

[AVAILABLE_COMPONENTS]

# Rules

${AiManagerService.DASHBOARD_HTML_RULES}
6. **Place components exactly as shown** — use the exact tag names and attributes from the "Available Web Components" section above. Do not modify attribute names or invent new ones.

Generate only the complete HTML code for the dashboard template.`,
      tags: ['dashboard', 'html', 'web-components', 'layout'],
      category: 'Dashboard Creation',
    },
    {
      id: 'DASHBOARD_BUILD_STEP_BY_STEP_INSTRUCTIONS',
      title: 'Build a Dashboard (Step-by-Step Instructions)',
      description:
        'Returns numbered step-by-step instructions covering all pieces needed to build a complete dashboard: Groovy data source script, HTML template, Tabulator/Chart/Pivot Table configuration DSLs, and Report Parameters.',
      promptText: `You are an expert at building data dashboards using ReportBurster. The user wants to create a complete, working dashboard from scratch. Your task is to provide a **numbered step-by-step guide** with all pieces needed — NOT just a single template.

# Business-First Thinking

**Before designing anything**, study the database schema carefully and reason about:

1. **What business domain is this?** (e-commerce, HR, finance, logistics, healthcare, etc.) — the table and column names will tell you.
2. **What decisions does a business person make with this data?** — a sales manager cares about revenue trends and top customers, an HR director cares about headcount and turnover, a warehouse manager cares about inventory levels and order fulfillment. Design for the specific person who would use THIS data.
3. **What are the most important metrics THIS schema can actually produce?** — only propose KPIs, charts, and tables that the actual columns support. Do not assume columns exist that are not in the schema. Do not invent metrics the data cannot back. Be pragmatic.
4. **What is the most common-sense, highest-value dashboard for this data?** — build what a business stakeholder would expect to see. No novelty for novelty's sake. The dashboard should feel obvious and inevitable given the data — "of course that's what you'd show."

# Design Principles

- **Less is more.** A clean, focused dashboard with 4–6 well-chosen components is always better than one stuffed with everything the schema could support. Only include what earns its place. If a visualization doesn't help a decision, leave it out.
- **Top-to-bottom, left-to-right priority.** Place the most important, most frequently needed information at the top. As the user scrolls down, importance decreases. Within a row, the most critical item goes on the left. KPI cards first, then the primary trend chart, then breakdowns, then detail tables at the bottom.
- **Naming matters.** Every chart title, table heading, KPI label, column header, section name, and component ID must use the most direct, expected business term for what it represents. Fewer, clearer words always beat more words. "Revenue" not "Total Revenue Amount". "Orders by Region" not "Regional Order Distribution Analysis". Choose the name a business person would already use when talking about this data.

# Dashboard Requirements

<REQUIREMENT>
Analyze my database schema and build the most useful business dashboard.

Use the schema to make domain-aware choices — not just mechanical column-type mapping:
- Identify the **core business entities** (customers, orders, products, employees, transactions, etc.) and their relationships
- Determine the **key business metrics** these entities produce (revenue, conversion rate, average order value, headcount, fulfillment rate, etc.)
- Find the **natural time dimension** for trends (order date, hire date, transaction date) — not every date column is worth trending
- Identify **meaningful categorical breakdowns** (by region, department, product category, status) — pick the ones that drive business decisions, not all of them

Prioritize what a business stakeholder would check every morning:
1. Key metrics at a glance (KPI cards with the numbers that matter most for THIS business)
2. Trends over time (the metric that best shows how the business is performing)
3. Top performers and breakdowns (the dimensions people actually slice by)
4. Detailed drill-down data (filterable data table for investigation)

Start with your best suggestion — I will refine (with your help also) from there.
</REQUIREMENT>

# Database Schema

Database vendor: [DATABASE_VENDOR]

The following JSON describes the relevant tables and columns available:

\`\`\`json
[INSERT THE JSON REPRESENTATION OF THE RELEVANT TABLE SUBSET HERE]
\`\`\`

# Instructions

Return the following numbered steps. Each step must include **complete, ready-to-use code** — no placeholders, no "add more here" comments. Every query, column reference, and table name must exist in the schema above — do not hallucinate columns or tables.

**Visual coherence across all components:** The HTML template, Tabulator tables, Charts, and Pivot Tables will render together as one dashboard. Their colors must be visually coherent — pick a unified color palette and carry it through: the CSS variables in the HTML layout, the Chart dataset backgroundColor/borderColor values, any Tabulator formatter colors, and Pivot Table renderer colors should all feel like they belong to the same dashboard. Do not pick colors in isolation per component.

---

## Step 1: Groovy Data Source Script

Write the complete Groovy script that fetches data for each dashboard component. **Use the componentId guard pattern** so each component only triggers its own query:

\`\`\`groovy
import groovy.sql.Sql

def dbSql = ctx.dbSql

def componentId = ctx.variables?.get('componentId')

// Component: salesGrid (Tabulator)
if (!componentId || componentId == 'salesGrid') {
    def data = dbSql.rows("SELECT ... FROM ...")
    ctx.reportData('salesGrid', data)
}

// Component: revenueChart (Chart)
if (!componentId || componentId == 'revenueChart') {
    def data = dbSql.rows("SELECT ... FROM ...")
    ctx.reportData('revenueChart', data)
}
\`\`\`

**Key rules:**
- When \`componentId\` is null (full dashboard load), ALL blocks execute
- When a specific \`componentId\` is passed (single component refresh), only that block runs
- Use \`ctx.dbSql\` for database access (connection is pre-configured)
- Use \`ctx.reportData('componentName', data)\` to route data to each component
- Each component name must match the \`component-id\` attribute in the HTML template

---

## Step 2: Report Parameters Configuration

**Think carefully about this step** — parameters are NOT optional plumbing, they are core to the dashboard's business value. They define how users interact with and explore the data. A dashboard without the right filters is just a static report.

Consider the business context and the database schema to determine:
- **Date ranges** — almost every business dashboard needs a time window (last 7 days, this month, custom range). Look for date/timestamp columns.
- **Key dimensions** — which categorical fields (department, region, product category, customer segment, status) would a stakeholder want to slice by?
- **Sensible defaults** — each parameter must have a default value that shows meaningful data on first load (e.g., last 30 days, "All" departments). The dashboard must be immediately useful without any user interaction.

\`\`\`groovy
import java.time.LocalDate

reportParameters {
    parameter(
        id: 'startDate',
        type: LocalDate,
        label: 'Start Date',
        defaultValue: LocalDate.now().minusDays(30)
    ) {
        constraints(required: true)
        ui(control: 'date', format: 'yyyy-MM-dd')
    }
    parameter(
        id: 'department',
        type: String,
        label: 'Department',
        defaultValue: 'All'
    ) {
        constraints(required: false)
        ui(control: 'select', options: ['All', 'Sales', 'Engineering', 'Marketing'])
    }
}
\`\`\`

The SQL queries in Step 1 must use these parameters via \`ctx.variables\` to filter the data accordingly.

---

## Step 3: HTML Dashboard Template

Write the complete HTML template using \`<rb-tabulator>\`, \`<rb-chart>\`, \`<rb-pivot-table>\`, and \`<rb-parameters>\` web components.

${AiManagerService.DASHBOARD_HTML_RULES}

Each web component needs these attributes:
- \`report-code="REPORT_CODE"\` — the report identifier (will be configured by the system)
- \`api-base-url="API_BASE_URL"\` — the API endpoint (will be configured by the system)
- \`component-id="uniqueName"\` — must match the name used in \`ctx.reportData()\` in Step 1

Example: \`<rb-tabulator report-code="REPORT_CODE" api-base-url="API_BASE_URL" component-id="salesGrid"></rb-tabulator>\`

---

## Step 4: Tabulator Configuration DSL

For each \`<rb-tabulator>\` component, provide the Groovy DSL configuration:

\`\`\`groovy
tabulator {
    columns [
        [field: 'columnName', title: 'Display Title', sorter: 'string', headerFilter: 'input'],
        [field: 'amount', title: 'Amount', sorter: 'number', formatter: 'money', formatterParams: [precision: 2]],
    ]
    options {
        pagination 'local'
        paginationSize 10
        layout 'fitColumns'
        responsiveLayout 'collapse'
    }
}
\`\`\`

**Key options:** columns (field, title, sorter, formatter, headerFilter), pagination, paginationSize, layout (fitColumns/fitData/fitDataFill), height, theme (default/simple/midnight/modern), movableRows, selectableRows, groupBy, frozenRows, responsiveLayout.

For full details: https://www.reportburster.com/docs/bi-analytics/web-components/datatables

---

## Step 5: Chart Configuration DSL

For each \`<rb-chart>\` component, provide the Groovy DSL configuration:

\`\`\`groovy
chart {
    type 'bar'
    labelField 'categoryColumn'
    series {
        dataset('Series Name') {
            valueField 'amountColumn'
            backgroundColor 'rgba(54, 162, 235, 0.5)'
            borderColor 'rgba(54, 162, 235, 1)'
        }
    }
    options {
        responsive true
        plugins {
            title { display true; text 'Chart Title' }
            legend { position 'top' }
        }
    }
}
\`\`\`

**Supported chart types:** bar, line, pie, doughnut, radar, polarArea, horizontalBar, stackedBar, area, dualYAxis.

For full details: https://www.reportburster.com/docs/bi-analytics/web-components/charts

---

## Step 6: Pivot Table Configuration DSL

For each \`<rb-pivot-table>\` component, provide the Groovy DSL configuration:

\`\`\`groovy
pivotTable {
    rows ['dimension1', 'dimension2']
    cols ['dimension3']
    vals ['measureField']
    aggregatorName 'Sum'
    rendererName 'Table'
    rowOrder 'value_z_to_a'
    colOrder 'key_a_to_z'
}
\`\`\`

**Aggregators:** Sum, Count, Average, Minimum, Maximum, Count Unique Values, List Unique Values, Integer Sum, Sum over Sum.
**Renderers:** Table, Table Barchart, Heatmap, Row Heatmap, Col Heatmap, Bar Chart, Line Chart, Area Chart, Scatter Chart.

For full details: https://www.reportburster.com/docs/bi-analytics/web-components/pivottables

---

# Reference Documentation
- Data Tables: https://www.reportburster.com/docs/bi-analytics/web-components/datatables
- Charts: https://www.reportburster.com/docs/bi-analytics/web-components/charts
- Pivot Tables: https://www.reportburster.com/docs/bi-analytics/web-components/pivottables
- Performance / Real-Time: https://www.reportburster.com/docs/bi-analytics/performance-real-time

Provide all steps with complete, production-ready code based on the user's requirements and the database schema provided.`,
      tags: ['dashboard', 'step-by-step', 'groovy', 'web-components', 'complete-guide'],
      category: 'Dashboard Creation',
    },
    // --- DSL Configuration ---
    {
      id: 'REPORT_PARAMS_DSL_CONFIGURE',
      title: 'Configure Report Parameters',
      description:
        'Generates a complete Report Parameters DSL configuration script based on user requirements.',
      promptText: `You are an expert at configuring Report Parameters using the Groovy DSL for FlowKraft ReportBurster.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE REPORT PARAMETERS HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
import java.time.LocalDate
import java.time.LocalDateTime

reportParameters {
  // Core date range parameters with constraints
  parameter(
    id:           'startDate',
    type:         LocalDate,
    label:        'Start Date',
    description:  'Report start date',
    defaultValue: LocalDate.now().minusDays(30)
  ) {
    constraints(
      required: true,
      min:      LocalDate.now().minusDays(365),
      max:      endDate
    )
    ui(
      control: 'date',
      format:  'yyyy-MM-dd'
    )
  }

  parameter(
    id:           'endDate',
    type:         LocalDate,
    label:        'End Date',
    defaultValue: LocalDate.now()
  ) {
    constraints(
      required: true,
      min:      startDate,
      max:      LocalDate.now()
    )
    ui(
      control: 'date',
      format:  'yyyy-MM-dd'
    )
  }

  parameter(
    id:    'customerId',
    type:  String,
    label: 'Customer ID'
  ) {
    constraints(
      required:  true,
      maxLength: 10,
      pattern:   '[A-Z0-9]+'
    )
  }

  parameter(
    id:    'customer',
    type:  String,
    label: 'Customer'
  ) {
    constraints(required: true)
    ui(
      control: 'select',
      options: "SELECT id, name FROM customers WHERE status = 'active'"
    )
  }

  parameter(
    id:           'maxRecords',
    type:         Integer,
    label:        'Max Records',
    defaultValue: 100
  ) {
    constraints(min: 1, max: 1000)
  }

  parameter(
    id:           'includeInactive',
    type:         Boolean,
    label:        'Include Inactive',
    defaultValue: false
  )

  parameter(
    id:           'processingTime',
    type:         LocalDateTime,
    label:        'Processing Time',
    defaultValue: LocalDateTime.now()
  ) {
    ui(
      control: 'datetime',
      format:  "yyyy-MM-dd'T'HH:mm:ss"
    )
  }
}

if (reportParametersProvided) {
  log.info("--- Report Parameter Values ---")
  log.info("startDate          : \\\${startDate ?: 'NOT_SET'}")
  log.info("endDate            : \\\${endDate   ?: 'NOT_SET'}")
  log.info("customer           : \\\${customer ?: 'NOT_SET'}")
  log.info("maxRecords         : \\\${maxRecords ?: 'NOT_SET'}")
  log.info("includeInactive    : \\\${includeInactive ?: 'false'}")
  log.info("processingTime     : \\\${processingTime ?: 'NOT_SET'}")
}
</EXAMPLE_DSL>

Generate a Report Parameters DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax and available options.

IMPORTANT — be minimalistic:
- Return ONLY the parameters the user explicitly asked for — no assumptions, no extras.
- Use the simplest type and fewest constraints that satisfy the requirement.
- Do not add parameters "just in case" or because they seem useful — if the user didn't ask for it, don't include it.

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

Return only the DSL script — no explanations.`,
      tags: ['dsl', 'report-parameters', 'configuration'],
      category: 'DSL Configuration',
    },
    {
      id: 'TABULATOR_DSL_CONFIGURE',
      title: 'Configure Tabulator Table',
      description:
        'Generates a complete Tabulator DSL configuration script based on user requirements.',
      promptText: `You are an expert at configuring Tabulator data tables using the Groovy DSL for FlowKraft ReportBurster. The DSL is a minimal wrapper over the tabulator.info API — all options map 1:1.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE TABLE HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 Tabulator Groovy DSL — minimal wrapper over tabulator.info API
 All options map 1:1 to tabulator.info — no invented concepts.
 Docs: https://tabulator.info/docs/6.3
 Data comes from ctx.reportData by default — no need to specify it.
*/

tabulator {
  layout "fitColumns"
  height "400px"
  width "100%"
  autoColumns false
  renderVertical "virtual"
  renderHorizontal "basic"
  layoutColumnsOnNewData true

  columns {
    column {
      title "Name"
      field "name"
      hozAlign "left"
      vertAlign "middle"
      headerHozAlign "center"
      width 200
      minWidth 100
      maxWidth 400
      widthGrow 1
      widthShrink 1
      visible true
      frozen false
      responsive 0
      resizable true
      sorter "string"
      sorterParams([])
      headerSort true
      headerFilter "input"
      headerFilterParams([values: ["A", "B", "C"]])
      headerFilterPlaceholder "Search..."
      formatter "plaintext"
      formatterParams([:])
      cssClass "my-class"
      tooltip true
      editor "input"
      editorParams([:])
      editable true
      validator "required"
      headerTooltip "Column description"
      headerVertical false
    }

    column { title "Age"; field "age"; hozAlign "right"; sorter "number"; formatter "number" }
    column { title "Status"; field "status"; headerFilter "list"; headerFilterParams([values: ["Active", "Pending"]]) }
    column { title "Amount"; field "amount"; formatter "money"; width 120 }
  }
}
</EXAMPLE_DSL>

Generate a Tabulator DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax.

IMPORTANT — be minimalistic:
- Tabulator's default configuration is already good. Your job is to add ONLY the minimum extra configuration needed to match the user's specific requirement — nothing more.
- Do not set options that repeat the default behavior (e.g. do not set layout, height, renderVertical, etc. unless the user specifically asked for non-default values).
- Only define columns the user asked for. Only add formatters, filters, sorters, or editors that the user explicitly needs.
- Do not add options "just in case" or for completeness.

For more details: https://www.reportburster.com/docs/bi-analytics/web-components/datatables

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

Return only the DSL script — no explanations.`,
      tags: ['dsl', 'tabulator', 'configuration', 'data-table'],
      category: 'DSL Configuration',
    },
    {
      id: 'CHART_DSL_CONFIGURE',
      title: 'Configure Chart',
      description:
        'Generates a complete Chart DSL configuration script based on user requirements.',
      promptText: `You are an expert at configuring Charts using the Groovy DSL for FlowKraft ReportBurster. The DSL is aligned with Chart.js — options pass through directly to the Chart.js configuration.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE CHART HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 Chart Groovy DSL - aligned with Chart.js
 Docs: https://www.chartjs.org/docs/latest/configuration/
 Data comes from ctx.reportData by default - no need to specify it
*/

chart {
  type 'bar'
  labelField 'region'

  series {
    series {
      field 'revenue'
      label 'Revenue'
      backgroundColor 'rgba(78, 121, 167, 0.5)'
      borderColor '#4e79a7'
      type 'bar'
      yAxisID 'y'
      xAxisID 'x'
      borderWidth 2
      fill false
      tension 0.4
      pointRadius 4
      pointStyle 'circle'
      hidden false
      order 0
    }

    series field: 'sales', label: 'Sales', backgroundColor: '#4e79a7', borderColor: '#4e79a7'
    series field: 'profit', label: 'Profit', backgroundColor: '#e15759', borderColor: '#e15759', type: 'line'
    series field: 'cost', label: 'Cost', backgroundColor: '#59a14f', borderColor: '#59a14f', fill: true, tension: 0.3
  }

  options {
    responsive true
    maintainAspectRatio true

    plugins {
      title { display true; text 'Sales by Region' }
      legend { position 'bottom' }
      tooltip { enabled true }
      datalabels { display false }
    }

    scales {
      y {
        beginAtZero true
        title { display true; text 'Value' }
      }
      x {
        title { display true; text 'Region' }
      }
    }

    animation { duration 1000 }
  }
}
</EXAMPLE_DSL>

Generate a Chart DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax.

IMPORTANT — be minimalistic:
- Chart.js default configuration is already good. Your job is to add ONLY the minimum extra configuration needed to match the user's specific requirement — nothing more.
- Do not set options that repeat the default behavior (e.g. do not set responsive, maintainAspectRatio, animation, etc. unless the user specifically asked for non-default values).
- Only define series the user asked for. Only add scales, plugins, or styling that the user explicitly needs.
- Do not add options "just in case" or for completeness.

For more details: https://www.reportburster.com/docs/bi-analytics/web-components/charts

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

Return only the DSL script — no explanations.`,
      tags: ['dsl', 'chart', 'configuration', 'chartjs'],
      category: 'DSL Configuration',
    },
    {
      id: 'PIVOT_TABLE_DSL_CONFIGURE',
      title: 'Configure Pivot Table',
      description:
        'Generates a complete Pivot Table DSL configuration script based on user requirements.',
      promptText: `You are an expert at configuring Pivot Tables using the Groovy DSL for FlowKraft ReportBurster. The DSL is aligned with the react-pivottable API.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE PIVOT TABLE HERE]
</REQUIREMENT>

<EXAMPLE_DSL>
/*
 Pivot Table Groovy DSL - aligned with react-pivottable API
 Docs: https://github.com/plotly/react-pivottable
 Data comes from ctx.reportData by default - no need to specify it
*/

pivotTable {
  rows 'region', 'country'
  cols 'year', 'quarter'
  vals 'revenue'

  // Available aggregators:
  // Count, Count Unique Values, List Unique Values, Sum, Integer Sum, Average, Median,
  // Sample Variance, Sample Standard Deviation, Minimum, Maximum, First, Last,
  // Sum over Sum, Sum as Fraction of Total, Sum as Fraction of Rows, Sum as Fraction of Columns,
  // Count as Fraction of Total, Count as Fraction of Rows, Count as Fraction of Columns
  aggregatorName 'Sum'

  // Available renderers:
  // Table, Table Heatmap, Table Col Heatmap, Table Row Heatmap, Exportable TSV
  // (Plotly renderers if available: Grouped Column Chart, Stacked Column Chart, etc.)
  rendererName 'Table'

  // Options: key_a_to_z (alphabetical), value_a_to_z (by value ascending), value_z_to_a (by value descending)
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'

  valueFilter {
    // filter 'status', exclude: ['Inactive', 'Pending']
    // filter 'region', exclude: ['Unknown']
  }

  options {
    menuLimit 500
  }
}
</EXAMPLE_DSL>

Generate a Pivot Table DSL configuration script based on the requirement above. Use the example DSL as a reference for syntax.

IMPORTANT — be minimalistic:
- The pivot table's default configuration is already good. Your job is to add ONLY the minimum extra configuration needed to match the user's specific requirement — nothing more.
- Do not set options that repeat the default behavior (e.g. do not set rowOrder, colOrder, rendererName, etc. unless the user specifically asked for non-default values).
- Only specify rows, cols, vals, and aggregator that the user explicitly needs.
- Do not add options "just in case" or for completeness.

For more details: https://www.reportburster.com/docs/bi-analytics/web-components/pivottables

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

Return only the DSL script — no explanations.`,
      tags: ['dsl', 'pivot-table', 'configuration'],
      category: 'DSL Configuration',
    },
    // --- PDF Report Generation ---
    {
      id: 'PDF_SAMPLE_A4_PAYSLIP_XSLFO',
      title: 'Generate XSL-FO FreeMarker Template for PDF Report',
      description:
        'Generates a complete XSL-FO (.xsl) FreeMarker template for Apache FOP PDF rendering, based on user requirements.',
      promptText: `Write a FreeMarker template in XSL-FO (XSL Formatting Objects) format for Apache FOP PDF rendering. Return only the complete template code — no partial snippets or explanations.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE REPORT HERE]
</REQUIREMENT>

DATA MODEL:
A companion script (Groovy or SQL) prepares the data and passes it to this template as a FreeMarker model — one Map<String, Object> per document. The Map keys are the column/field names (case-insensitive). Variables are also available by index (\${var0}, \${col0}, etc.) but prefer named columns.

Because data comes from database queries, field types vary at runtime:
- Numeric columns arrive as native Java numbers — \`?number\` will FAIL on them. Use directly or check with \`?is_number\`.
- Text columns arrive as strings.
- Date columns arrive as Java date objects — check with \`?is_date\` before formatting.
- Calculated totals may arrive as either numbers or pre-formatted strings — always be defensive.
- Any field can be null — always use \`!\` defaults (\${amount!0}, \${name!""}).

SIMPLE REPORTS (one row = one document, e.g. payslip, certificate, statement):
- All fields available directly: \${EmployeeName}, \${Salary}, etc.

MASTER-DETAIL REPORTS (e.g. invoice with line items, order with products):
- Master fields available directly: \${OrderID}, \${CustomerName}, etc.
- Detail rows in a nested list: iterate with <#list details as item> and access fields as \${item.field_name}.
- Totals/summaries are pre-computed by the script and available as direct variables (e.g. \${Subtotal}, \${GrandTotal}) — do NOT calculate in the template.

XSL-FO DOCUMENT STRUCTURE:
- Root element: \`<fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">\`
- Define a single \`<fo:simple-page-master>\` for A4 portrait (\`page-height="29.7cm"\`, \`page-width="21cm"\`).
- Page margins: \`1.5cm\` left/right, \`1cm\` top/bottom.
- All content within a single \`<fo:page-sequence>\` flowing into \`xsl-region-body\`.

STYLING RULES:
- **Fonts**: Standard fonts (Helvetica, Arial, sans-serif). Use \`font-weight="bold"\` for headers/labels. Font sizes in absolute units (e.g., \`10pt\`, \`16pt\`).
- **Spacing**: Explicit \`space-after\`, \`space-before\`, and \`padding\` in absolute units. Never rely on default spacing.
- **Tables**: Always use \`table-layout="fixed"\` with explicit \`fo:table-column\` widths.
- **Borders**: Solid borders for table cells (e.g., \`border="1pt solid #dce0e6"\`).
- **Alignment**: \`text-align="end"\` for financial amounts. \`text-align="center"\` for headers.
- **Colors**: High-contrast, print-friendly. Use light backgrounds for header/footer rows (e.g., \`background-color="#f2f4f7"\`).

FREEMARKER INTEGRATION:
- Use \${column_name} placeholders matching the actual data columns listed below.
- For dates: \`<#if myDate?is_date>\${myDate?string("MM/dd/yyyy")}<#else>\${myDate!""}</#if>\`
- For numbers needing formatting: \`<#if amount?is_number>\${amount?string(",##0.00")}<#else>\${amount!""}</#if>\`
- For nested lists: \`<#list details as item>...\${item.field_name}...</#list>\`
- For null safety: always use \${value!""} or \${value!0}
- For conditional blocks: \`<#if notes?has_content>...</#if>\`

CRITICAL: FreeMarker + Apache FOP Rules:
These rules prevent silent rendering failures. FreeMarker's default error handler dumps stack traces into the XSL-FO output without stopping, which corrupts the XML and causes FOP to silently drop content.

- **\`?number\` is ONLY for strings.** If the value is already a number at runtime, \`?number\` throws a silent error and corrupts the output. Since you cannot know the runtime type, the safe pattern is: use values directly (\`\${amount}\`) or use the type-safe check \`<#if amount?is_number>\${amount?string(",##0.00")}<#else>\${amount}</#if>\`.
- **Always use null-safe defaults.** Any value can be null at runtime. Use the \`!\` operator: \`\${amount!0}\` for numeric fields, \`\${notes!""}\` for text fields.
- **Do NOT use \`fo:block-container\` for layout positioning.** It has known rendering issues in Apache FOP with percentage widths and margins. Instead, use a plain \`fo:table\` with an empty spacer column. For right-aligned totals, use a 3-column table: 60% empty + 20% label + 20% value.
- **Do NOT do math in the template.** All calculations (totals, tax, subtotals) should be pre-computed and passed as ready-to-display values. The template should only display, never calculate.

XML VALIDITY:
- The entire output must be well-formed XML. All tags must be properly closed.

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]
`,
      tags: ['xslfo', 'fop', 'pdf', 'template', 'freemarker'],
      category: 'PDF Generation (from XSL-FO)',
    },
    {
      id: 'PDF_HTML_TEMPLATE_GENERATOR',
      title: 'Generate PDF Report Template (from HTML)',
      description:
        'Generates a complete XHTML template optimized for PDF conversion using OpenHTMLToPDF, based on user requirements and actual data columns.',
      promptText: `Generate a complete, self-contained XHTML document for conversion to a PDF report using OpenHTMLToPDF — a CSS 2.1 renderer backed by Apache PDFBox.
Return ONLY the HTML code in a single code block. The output must be ready to use without modifications.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE REPORT HERE]
</REQUIREMENT>

## DATA MODEL

A companion script (Groovy or SQL) prepares the data and passes it to this template as a FreeMarker model — one Map<String, Object> per document. The Map keys are the column/field names (case-insensitive). Variables are also available by index (\${var0}, \${col0}, etc.) but prefer named columns.

Because data comes from database queries, field types vary at runtime:
- Numeric columns arrive as native Java numbers — \`?number\` will FAIL on them. Use directly or check with \`?is_number\`.
- Text columns arrive as strings.
- Date columns arrive as Java date objects — check with \`?is_date\` before formatting.
- Calculated totals may arrive as either numbers or pre-formatted strings — always be defensive.
- Any field can be null — always use \`!\` defaults (\${amount!0}, \${name!""}).

### SIMPLE REPORTS (one row = one document, e.g. payslip, certificate, statement)
- All fields available directly: \${EmployeeName}, \${Salary}, etc.

### MASTER-DETAIL REPORTS (e.g. invoice with line items, order with products)
- Master fields available directly: \${OrderID}, \${CustomerName}, etc.
- Detail rows in a nested list: iterate with <#list details as item> and access fields as \${item.field_name}.
- Totals/summaries are pre-computed by the script and available as direct variables (e.g. \${Subtotal}, \${GrandTotal}) — do NOT calculate in the template.

## HTML→PDF TECHNICAL RULES (OpenHTMLToPDF — CSS 2.1 only, no JS, XHTML required)

1. **Valid XHTML:** All tags properly nested and closed (e.g., \`<br/>\`, \`<hr/>\`). Use \`&amp;\` for all ampersand characters — never raw \`&\`. Do not use \`&nbsp;\`.
2. **Internal CSS:** All CSS in \`<style type="text/css">\` in \`<head>\` — no external references, no \`@font-face\`.
3. **Absolute units ONLY:** All measurements (layout, fonts, margins, padding, borders) must use \`px\` or \`pt\`. **DO NOT USE** \`%\`, \`em\`, or \`rem\`.
4. **Box model:** Apply \`* { box-sizing: border-box; }\` at the start of CSS.
5. **Fixed layout:** Use \`div\` elements with fixed pixel widths. Use \`display: table\` / \`display: table-cell\` for column layouts (not floats).
6. **A4 portrait:** Use \`@page { size: A4 portrait; margin: 25mm; }\`. Adjust page size and margins as needed based on the business requirement.
7. **Print-safe fonts:** \`font-family: Arial, Helvetica, sans-serif;\` with all sizes in \`pt\`. High-contrast, solid colors only.
8. **Page breaks:** Apply \`page-break-inside: avoid;\` on main content containers. Use \`page-break-before\`/\`page-break-after\` for multi-page documents.
9. **CSS 2.1 ONLY:** No flexbox, no grid, no CSS variables (\`var()\`), no transforms, no \`calc()\`.
10. **No JavaScript** — the renderer does not execute scripts.
11. **Images:** Use absolute file paths or base64 data URIs — no remote URLs.

## FREEMARKER RULES

- Use \${column_name} placeholders matching the actual data columns listed below
- For null safety: \${value!""} for strings, \${value!0} for numbers
- For dates: <#if myDate?is_date>\${myDate?string("MM/dd/yyyy")}<#else>\${myDate!""}</#if>
- For numbers needing formatting: <#if amount?is_number>\${amount?string(",##0.00")}<#else>\${amount!""}</#if>
- For nested lists: <#list details as item><tr>...</tr></#list>
- For conditional content: <#if field?has_content>...</#if>
- NEVER use \${value?number} — values are already their native types at runtime

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

If you need help with CSS properties supported by OpenHTMLToPDF, refer to: https://github.com/danfickle/openhtmltopdf/wiki/Big-CSS-reference`,
      tags: ['pdf', 'html2pdf', 'template'],
      category: 'PDF Generation (from HTML)',
    },
    // --- Excel Report Generation ---
    {
      id: 'EXCEL_TEMPLATE_GENERATOR',
      title: 'Generate Excel Report Template',
      description:
        'Generates an HTML template specifically designed for conversion to an Excel spreadsheet, based on user requirements and technical specifications.',
      promptText: `Generate a complete, self-contained HTML document designed for conversion to an Excel spreadsheet using html-exporter — an HTML-to-Excel converter backed by Apache POI.
Return ONLY the HTML code in a single code block. The output must be ready to use without modifications.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE REPORT HERE]
</REQUIREMENT>

## DATA MODEL

A companion script (Groovy or SQL) prepares the data and passes it to this template as a FreeMarker model — one Map<String, Object> per document. The Map keys are the column/field names (case-insensitive). Variables are also available by index (\${var0}, \${col0}, etc.) but prefer named columns.

Because data comes from database queries, field types vary at runtime:
- Numeric columns arrive as native Java numbers — \`?number\` will FAIL on them. Use directly or check with \`?is_number\`.
- Text columns arrive as strings.
- Date columns arrive as Java date objects — check with \`?is_date\` before formatting.
- Calculated totals may arrive as either numbers or pre-formatted strings — always be defensive.
- Any field can be null — always use \`!\` defaults (\${amount!0}, \${name!""}).

### SIMPLE REPORTS (one row = one document, e.g. payslip, certificate, statement)
- All fields available directly: \${EmployeeName}, \${Salary}, etc.

### MASTER-DETAIL REPORTS (e.g. invoice with line items, order with products)
- Master fields available directly: \${OrderID}, \${CustomerName}, etc.
- Detail rows in a nested list: iterate with <#list details as item> and access fields as \${item.field_name}.
- Totals/summaries are pre-computed by the script and available as direct variables (e.g. \${Subtotal}, \${GrandTotal}) — do NOT calculate in the template.

## FORMAT RULES (html-exporter — HTML-to-Excel via Apache POI)

1. All CSS must be in a <style> block within <head> — no external CSS references
2. Use Excel-compatible CSS only (see technical docs below)
3. Colors: use long hex format (#ff0000 not #f00)
4. Border widths: \`thin\`, \`medium\`, or \`thick\` only
5. Use \`data-*\` attributes for Excel features (formulas, comments, freeze panes, etc.)
6. The HTML must be fully self-contained with no external dependencies

## FREEMARKER RULES

- Use \${column_name} placeholders matching the actual data columns listed below
- For dates displayed in Excel: use data-date-cell-format attribute
  <td data-date-cell-format="MM/dd/yyyy">\${myDate!""}</td>
- For numbers with Excel formatting: use data-numeric-cell-format attribute
  <td data-numeric-cell-format="##0.00">\${amount!0}</td>
- For null safety: always use \${value!""} for strings or \${value!0} for numbers
- For nested lists: <#list details as item><tr>...</tr></#list>
- For conditional content: <#if field?has_content>...</#if>
- NEVER use \${value?number} — values are already their native types at runtime

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]

---

**TECHNICAL DOCUMENTATION — Excel-Specific Reference (html-exporter / Apache POI)**

## Features

- Complete CSS styling support
- Excel formulas
- Cell comments
- Freeze panes
- Merged cells
- Multiple worksheets
- Date/time formatting
- Numeric formatting
- Text cell forcing

## CSS Support

html-exporter maps CSS styles to corresponding Excel formatting. The following CSS properties are supported:

- **Font:** \`font-family\`, \`font-size\`, \`font-weight\`, \`font-style\`, \`text-decoration\`
- **Alignment:** \`text-align\`, \`vertical-align\`
- **Colors:** \`color\`, \`background-color\`
- **Borders:** All border properties including color, style, and width

**CSS Notes:**

- Colors can be specified as literals (e.g., \`red\`, \`black\`) or hex values (must use long format: \`#ff0000\` not \`#f00\`)
- Border widths must be specified as \`thin\`, \`medium\`, or \`thick\`
- Supported border styles: \`solid\`, \`dotted\`, \`dashed\`, \`double\` (widths apply only to \`solid\` style)
- Shorthand CSS is supported (e.g., \`border: thick solid red;\`)
- Style inheritance: background colors and other properties cascade from parent elements (tables/rows) to children unless overridden
- Style precedence: inline styles override class declarations, which override global declarations

## Excel-Specific Attributes

The following data attributes allow you to access Excel-specific functionality:

| Attribute                     | Description                                                       | Example                                                                  |
| ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| \`data-group\`                  | Adds cell to named ranges for formula references                  | \`<td data-group="sales_total, region_sum">486</td>\`                      |
| \`data-group-output\`           | Replaces cell value with a formula operating on a specified range | \`<td data-group-output="sales_total">0</td>\`                             |
| \`data-cell-comment\`           | Adds a comment to a cell                                          | \`<td data-cell-comment="This is a comment">Value</td>\`                   |
| \`data-cell-comment-dimension\` | Sets the size of a comment (columns,rows)                         | \`<td data-cell-comment-dimension="4,2">Value</td>\`                      |
| \`data-freeze-pane-cell\`       | Defines the freeze pane position                                  | \`<td data-freeze-pane-cell="true">Value</td>\`                            |
| \`data-new-sheet\`              | Creates a new worksheet                                           | \`<table data-new-sheet="true">...</table>\`                               |
| \`data-sheet-name\`             | Names a worksheet                                                 | \`<table data-sheet-name="Sales Report">...</table>\`                      |
| \`data-date-cell-format\`       | Sets date/time format                                             | \`<td data-date-cell-format="dd/MM/yy HH:mm:ss">01-01-2022 13:00:00</td>\` |
| \`data-text-cell\`              | Forces cell content to be treated as text                         | \`<td data-text-cell="true">13.54</td>\`                                   |
| \`data-numeric-cell-format\`    | Sets numeric format                                               | \`<td data-numeric-cell-format="##0.00">123.45</td>\`                      |

## Examples

### Formula Support

<!-- Cell added to two different ranges for formula references -->
<td data-group="store_Dumfries_2_value, region_1_1_pg_5_value" class="numeric">
  486
</td>

<!-- Cell that contains a SUM formula referencing all cells in a specified range -->
<td data-group-output="region_1_1_pg_6_count" data-group="area_1_pg_6_count">
  32
</td>

### Cell Comments

<td data-cell-comment="An Excel Comment" data-cell-comment-dimension="4,2">
  some value
</td>

### Freeze Panes

<td data-freeze-pane-cell="true">some value</td>

### Merged Cells

<td rowspan="3" colspan="3">some value</td>

### Multiple Worksheets

<table data-sheet-name="Table 1">
  <!-- table data-->
</table>
<table data-new-sheet="true" data-sheet-name="Table 2">
  <!-- table data-->
</table>

### Date Handling

<td data-date-cell-format="dd/MM/yy HH:mm:ss">01-01-2022 13:00:00</td>

### Forcing Text Output

<td data-text-cell="true">13.54</td>

## Limitations

- When using border widths with non-solid styles, the width property is ignored
- Certain Excel features might not be available through the HTML interface

If you need help with HTML-to-Excel features supported by html-exporter, refer to: https://github.com/alanhay/html-exporter`,
      tags: ['excel', 'html', 'template', 'spreadsheet'],
      category: 'Excel Report Generation',
    },

    // --- JasperReports (.jrxml) Template Generation ---
    {
      id: 'JASPER_JRXML_TEMPLATE_GENERATOR',
      title: 'Generate JasperReports (.jrxml) Template',
      description:
        'Generates a complete .jrxml template for JasperReports, based on user requirements.',
      promptText: `Write a JasperReports 7.0+ .jrxml (Jackson-based XML format). Return only the complete .jrxml code — no partial snippets or explanations.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE DESCRIPTION OF THE REPORT HERE]
</REQUIREMENT>

DATA MODEL:
A companion script (Groovy or SQL) prepares the data. Data source is JRMapCollectionDataSource — flat rows from a Map (no JDBC).
- All fields must be declared as java.lang.Object.
- SIMPLE REPORTS (one row = one document): all data is directly available on the single row. Use the title band for the full layout — it can access fields from the first (and only) row.
- MULTI-ROW / MASTER-DETAIL REPORTS: data is pre-flattened (master fields duplicated on every child row). A companion script can add separate "virtual rows" for totals/footers with a row_type field. The .jrxml uses printWhenExpression on elements to show different layouts per row_type — all within a SINGLE detail band.

FORMAT RULES (JR 7.0.x / Jackson XML):
- Do NOT add xmlns or xsi:schemaLocation on <jasperReport> — JR7 does not use them.
- Do NOT use expressionBackcolor (unsupported in 7.0.x). For alternating row colors use two overlapping rectangles with printWhenExpression.
- Do NOT declare a REPORT_CONNECTION parameter.
- No subreports — single file only.
- Band heights must fit within pageHeight minus topMargin minus bottomMargin.
- All elements that go beyond the declared band height cause a compile-time validation error — every element must fit within its band.

CRITICAL JR 7 + JRMapCollectionDataSource RULES:
- Fields are NULL outside the primary detail band. Do NOT use summary band, columnFooter, lastPageFooter, group footer, or second detail bands for displaying field values — they will always be empty.
- Do NOT use <variable> elements (calculation="First", "Nothing", sticky patterns) to carry values into post-detail bands — they also fail with JRMapCollectionDataSource.
- Do NOT wrap conditional elements in a <frame> with printWhenExpression — fields inside the frame will be null. Instead, put each element directly in the band with its own individual printWhenExpression.
- java.lang.Object fields do NOT render as text. Always use string concatenation to force toString(): write \`"" + $F{myField}\` or \`"Label: " + $F{myField}\`, never bare \`$F{myField}\` in a textField expression.
- Only the title band and the detail band can safely access field values. Everything else sees null.

ARCHITECTURE PATTERNS:

Pattern A — SIMPLE REPORT (one row = one document, e.g., a letter, certificate, single-record form):
- Put the entire layout in the title band. All fields are available from the single data row.
- Use the detail band only if you need repeating sections.

Pattern B — MULTI-ROW REPORT with totals (e.g., invoice, order, statement):
- Title band: report header, company logo, bill-to info (fields from first row).
- Single detail band (fixed height, e.g., 24px) with row_type routing:
  1. Normal data rows (row_type == null): line items with product, qty, price, etc.
  2. Totals rows (row_type == "totals_line"): label + value right-aligned in table columns.
  3. Grand total row (row_type == "total_due"): bold label + value with colored background.
  4. Footer row (row_type == "footer"): notes, signatures, thank-you message.
- All within ONE <detail><band> — no summary, no second band, no frames.
- The script emits totals/footer as separate data rows after the line items.

Available data columns:
[INSERT COLUMN NAMES HERE]

Sample data (first rows):
[INSERT SAMPLE DATA HERE]

Script which generated the data:
[INSERT SCRIPT HERE]
`,
      tags: ['jasper', 'jrxml', 'template'],
      category: 'JasperReports (.jrxml) Generation',
    },

    // --- SQL Writing Assistance ---
    {
      id: 'SQL_FROM_NATURAL_LANGUAGE',
      title: 'Generate SQL from Natural Language',
      description:
        'Converts a plain English description of data requirements into a SQL query.',
      promptText: `You are an expert SQL Developer. Your mission is to translate a natural language question or instruction into an accurate and efficient SQL query, 
using only the provided subset of the database schema.

**INPUT:**

Natural Language Request:

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE QUESTION OR INSTRUCTION FOR THE SQL QUERY HERE]
</REQUIREMENT>

Relevant Database Schema Subset:

\`\`\`json
[INSERT THE JSON REPRESENTATION OF THE RELEVANT TABLE SUBSET HERE]
\`\`\`

This JSON object contains an array of table definitions. Each table object details its name, columns (with data types), primary keys, and foreign keys.
You MUST use only the tables and columns present in this provided schema subset. Do not infer the existence of other tables or columns.

Target Database Vendor: [DATABASE_VENDOR]

Generate SQL optimized for the specified database vendor. Use vendor-idiomatic syntax, functions, and quoting conventions (e.g., backticks for MySQL, double quotes for PostgreSQL, square brackets for SQL Server). If no vendor is specified, use standard ANSI SQL.

**YOUR TASK:**

* Analyze Request & Schema: Carefully understand the user's natural language request and examine the provided table structures, column names, data types, and relationships (primary/foreign keys) within the given schema subset.
* Formulate SQL Query: Construct a single, valid SQL query that directly addresses the user's request using the provided schema information.
* Prioritize Accuracy: Ensure the query correctly retrieves or manipulates the data as per the user's intent.
* Consider Efficiency: Where possible, write an efficient query, but correctness is paramount.
* Adhere to Schema: The query must strictly use table and column names as they appear in the provided schema subset. Do not invent or assume table/column names.
* Vendor-Idiomatic SQL: Generate a query using syntax and functions native to the Target Database Vendor specified above. Use vendor-specific features (e.g., LIMIT vs TOP vs FETCH FIRST, date functions, string functions) as appropriate. If no vendor is specified, fall back to standard ANSI SQL.

**OUTPUT REQUIREMENTS:**

* You MUST return only a single, valid SQL query string.
* Do not include any explanations, comments (unless specifically requested or critical for understanding a complex part of the query), or any text other than the SQL query itself.
* If the request is ambiguous or cannot be fulfilled with the provided schema subset, you should return an error message stating the issue concisely, 
prefixed with Error: . For example: Error: The request requires table 'X' which is not in the provided schema subset. or Error: The request is ambiguous. Please clarify...

GUIDELINES FOR SQL GENERATION:

* Understand Intent: Focus on the core intent of the user's request.
* Joins: Use appropriate JOIN clauses (INNER JOIN, LEFT JOIN, etc.) based on the relationships indicated in the schema and the nature of the request.
* Filtering: Apply WHERE clauses accurately to filter data according to the request.
* Aggregations: Use aggregate functions (COUNT, SUM, AVG, MIN, MAX) and GROUP BY clauses when the request implies summarization.
* Ordering: Use ORDER BY to sort results if specified or implied.
* Aliasing: Use table and column aliases if they improve readability, especially in complex queries or self-joins.
* Subqueries/CTEs: Use subqueries or Common Table Expressions (CTEs) if they help in structuring the query logically or are necessary to achieve the result.
* Completeness: Ensure the query addresses all aspects of the user's request.
* No Data Modification unless Explicitly Asked: Assume SELECT queries unless the request clearly asks for data modification (INSERT, UPDATE, DELETE). If a modification is requested, be very careful and precise.

**Example Scenario:**

* Natural Language Request: 

  "Show me the names of all products in the 'Electronics' category."

* Relevant Database Schema Subset:

\`\`\`json
[
  {
    "tableName": "Products",
    "columns": [
      { "name": "ProductID", "dataType": "INT", "isPrimaryKey": true },
      { "name": "ProductName", "dataType": "VARCHAR" },
      { "name": "CategoryID", "dataType": "INT", "isForeignKey": true, "references": "Categories" }
    ]
  },
  {
    "tableName": "Categories",
    "columns": [
      { "name": "CategoryID", "dataType": "INT", "isPrimaryKey": true },
      { "name": "CategoryName", "dataType": "VARCHAR" }
    ]
  }
]
\`\`\`

**Expected Output (SQL Query):**

\`\`\`sql
SELECT T1.ProductName
FROM Products T1
INNER JOIN Categories T2 ON T1.CategoryID = T2.CategoryID
WHERE T2.CategoryName = 'Electronics';
\`\`\`

**Produce only the SQL query as your output.**`,
      tags: ['natural-language', 'query', 'generation'],
      category: 'SQL Writing Assistance',
    },
    {
      id: 'SQL_QUERY_OPTIMIZATION',
      title: 'Optimize SQL Query Performance',
      description:
        'Reviews and optimizes a provided SQL query for better performance',
      promptText: `Analyze and optimize the following SQL query for improved performance:

Target Database Vendor: [DATABASE_VENDOR]

\`\`\`sql
-- Paste your SQL query here
\`\`\`

Please provide:
1. An optimized version of the query using vendor-idiomatic syntax for the Target Database Vendor specified above
2. Explanation of performance issues in the original query
3. The reasoning behind each optimization
4. Suggestions for adding appropriate indexes
5. Any vendor-specific optimization features (e.g., execution plan hints, vendor-specific index types, or query rewrite capabilities) that could help. If no vendor is specified, provide general optimization advice.`,
      tags: ['optimization', 'performance', 'analysis'],
      category: 'SQL Writing Assistance',
    },
    // --- Script Writing Assistance ---
    {
      id: 'GROOVY_SCRIPT_INPUT_SOURCE',
      title:
        'Groovy `Input Source` Script (Master-Details, Cross-Tab, KPI, etc.)',
      description:
        'Generates a Groovy script which can be used as `Input Source` in reports (Master-Details, Cross-Tab, KPIs, etc.)',
      promptText: `You are an expert Groovy Developer specializing in creating data processing scripts for a reporting tool called ReportBurster. 
Your task is to write a complete Groovy script based on the user's business requirements.

**YOUR TASK:**

Based on all the rules and examples below, write a complete Groovy script for the following business requirement. 
Provide **only** the final Groovy script in a single Markdown code block, with no other text or explanation.

<REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE QUESTION OR INSTRUCTION FOR THE SQL QUERY HERE]
</REQUIREMENT>

Target Database Vendor: [DATABASE_VENDOR]

Relevant Database Schema Subset:

\`\`\`json
[INSERT THE JSON REPRESENTATION OF THE RELEVANT TABLE SUBSET HERE]
\`\`\`

This JSON object contains an array of table definitions. Each table object details its name, columns (with data types), primary keys, and foreign keys.
You MUST use only the tables and columns present in this provided schema subset. Do not infer the existence of other tables or columns.

The SQL queries embedded in the Groovy script must use syntax and functions idiomatic to the specified database vendor (e.g., backticks for MySQL, double quotes for PostgreSQL, square brackets for SQL Server, vendor-specific date/string functions). If no vendor is specified, use standard ANSI SQL.

This script will be used as the "Input Source" for a report. It runs within a Java application and has access to a context object named \`ctx\`.
A pre-configured \`groovy.sql.Sql\` instance is available as \`ctx.dbSql\` for database queries.

**CRITICAL INSTRUCTIONS: You must follow these "Golden Rules" precisely.**

1.  **The Script's One Job: Populate \`ctx.reportData\`**
    *   The script's entire purpose is to create and assign a \`List<Map<String, Object>>\` to the \`ctx.reportData\` variable. This is the final output of the script.

2.  **Think in Rows and Columns: \`List<Map>\` is Law**
    *   The data structure must be a \`List\` of \`Map\`s.
    *   The **\`List\`** represents the entire dataset (all the rows).
    *   Each **\`Map\`** inside the list represents a single row of data.
    *   The **\`Map\`'s keys** (which must be \`String\`s) become the column names available in the report template (e.g., \`\${OrderID}\`, \`$\{CustomerName}\`, etc.). Use \`LinkedHashMap\` if column order is important.

3.  **Let the Database Do the Heavy Lifting**
    *   **DO** use SQL \`JOIN\`, \`WHERE\`, \`GROUP BY\`, and aggregate functions (\`SUM()\`, \`AVG()\`, \`COUNT()\`) to pre-process data into a clean, minimal result set directly from the database.
    *   **DON'T** pull thousands of raw rows into the script to loop through them and perform calculations that the database could have done much more efficiently.

4.  **The Script Prepares, The Template Presents**
    *   **DO** perform complex calculations, data lookups, and business logic inside the script to create the final, clean \`Map\` of data for each row. The template should be as simple as possible.
    *   **DON'T** put complex conditional logic or calculations in the report template. Prepare the data fully in the script first.

---

**EXAMPLES OF HIGH-QUALITY SCRIPTS:**

Here are examples of scripts that correctly follow these rules for different reporting scenarios.

**Example 1: Master-Detail Report (like an invoice with line items)**
*Goal: Fetch master records (invoices) and their related detail records (line items), combining them into a single data structure where details are a nested list.*

\`\`\`groovy
// Filename: scriptedReport_invoice.groovy
// ... imports ...
import java.math.BigDecimal
import java.math.RoundingMode

def dbSql = ctx.dbSql

log.info("Starting scriptedReport_invoice.groovy...")

// --- 1. Define SQL Queries ---
def masterSql = """
SELECT
    O."OrderID",
    O."OrderDate",
    O."CustomerID",
    C."CompanyName",
    O."Freight"
FROM "Orders" O
JOIN "Customers" C ON O."CustomerID" = C."CustomerID"
WHERE O."CustomerID" IN ('ALFKI', 'ANATR')  
ORDER BY O."OrderID" 
""" 

def detailSql = """
SELECT
    OD."Quantity",
    OD."UnitPrice",
    OD."Discount",
    P."ProductName"
FROM "Order Details" OD
JOIN "Products" P ON OD."ProductID" = P."ProductID"
WHERE OD."OrderID" = ?
ORDER BY P."ProductName"
"""

// --- 2. Fetch Data and Structure It ---
def allInvoicesData = [] 

try {
    log.debug("Executing master query for customers ALFKI, ANATR...")
    def masterRows = dbSql.rows(masterSql) 
    log.info("Fetched {} master order rows.", masterRows.size())

    masterRows.each { masterRow ->
        def invoiceData = new LinkedHashMap<String, Object>()
        invoiceData.putAll(masterRow)

        def orderId = masterRow.OrderID
        log.debug("Fetching details for OrderID: {}", orderId)

        def detailRows = dbSql.rows(detailSql, orderId)
        log.debug("Fetched {} detail rows for OrderID: {}", detailRows.size(), orderId)

        def detailsList = []
        detailRows.each { detailRow ->
            def detailMap = new LinkedHashMap<String, Object>()
            detailMap.putAll(detailRow)
            detailsList.add(detailMap)
        }
        invoiceData.put("details", detailsList)

        BigDecimal subtotal = BigDecimal.ZERO
        detailsList.each { detail ->
            BigDecimal price = detail.UnitPrice instanceof BigDecimal ? detail.UnitPrice : new BigDecimal(detail.UnitPrice.toString())
            BigDecimal qty = new BigDecimal(detail.Quantity.toString())
            BigDecimal discount = detail.Discount instanceof BigDecimal ? detail.Discount : new BigDecimal(detail.Discount.toString())
            BigDecimal lineTotal = price.multiply(qty).multiply(BigDecimal.ONE.subtract(discount))
            subtotal = subtotal.add(lineTotal)
        }
        BigDecimal freight = masterRow.Freight instanceof BigDecimal ? masterRow.Freight : new BigDecimal(masterRow.Freight.toString())
        BigDecimal taxRate = new BigDecimal("0.08")
        BigDecimal taxableAmount = subtotal.add(freight)
        BigDecimal tax = taxableAmount.multiply(taxRate)
        BigDecimal grandTotal = taxableAmount.add(tax)

        invoiceData.put("Subtotal", subtotal.setScale(2, RoundingMode.HALF_UP).toString())
        invoiceData.put("Tax", tax.setScale(2, RoundingMode.HALF_UP).toString())
        invoiceData.put("GrandTotal", grandTotal.setScale(2, RoundingMode.HALF_UP).toString())

        allInvoicesData.add(invoiceData)
    }

    // --- 3. Set Context Variables ---
    ctx.reportData = allInvoicesData

    if (!allInvoicesData.isEmpty()) {
        ctx.reportColumnNames = new ArrayList<>(allInvoicesData.get(0).keySet().findAll { it != 'details' })
    } else {
        ctx.reportColumnNames = []
    }
    log.info("Finished scriptedReport_invoice.groovy. Prepared data for {} invoices.", ctx.reportData.size())

} catch (Exception e) {
    log.error("Error during script execution: {}", e.getMessage(), e)
    throw e
}
\`\`\`

**Example 2: Crosstab / Pivot Report**
*Goal: Take transactional data and pivot it, turning unique values from a column (e.g., \`Country\`) into new columns in the output.*

\`\`\`groovy
// Filename: scriptedReport_categoryRegionCrosstabReport.groovy
import groovy.sql.Sql
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.LinkedHashMap
import java.util.HashSet
import java.util.TreeSet

def dbSql = ctx.dbSql 
log.info("Starting scriptedReport_categoryRegionCrosstabReport.groovy...")

def rawDataSql = """
SELECT
    C."CategoryName",
    Cust."Country",
    (OD."UnitPrice" * OD."Quantity" * (1 - OD."Discount")) AS LineSalesAmount
FROM "Categories" C
JOIN "Products" P ON C."CategoryID" = P."CategoryID"
JOIN "Order Details" OD ON P."ProductID" = OD."ProductID"
JOIN "Orders" O ON OD."OrderID" = O."OrderID"
JOIN "Customers" Cust ON O."CustomerID" = Cust."CustomerID"
WHERE Cust."Country" IS NOT NULL
"""

def salesByCategoryAndCountry = [:]
def allCountries = new HashSet<String>()
def crosstabData = []

try {
    def rawRows = dbSql.rows(rawDataSql)
    if (!rawRows.isEmpty()) {
        rawRows.each { row ->
            String category = row.CategoryName
            String country = row.Country
            BigDecimal sales = row.LineSalesAmount instanceof BigDecimal ? row.LineSalesAmount : (row.LineSalesAmount != null ? new BigDecimal(row.LineSalesAmount.toString()) : BigDecimal.ZERO)
            allCountries.add(country)
            if (!salesByCategoryAndCountry.containsKey(category)) { salesByCategoryAndCountry[category] = [:] }
            if (!salesByCategoryAndCountry[category].containsKey(country)) { salesByCategoryAndCountry[category][country] = BigDecimal.ZERO }
            salesByCategoryAndCountry[category][country] += sales
        }

        def sortedCountries = new TreeSet<>(allCountries) 
        salesByCategoryAndCountry.keySet().sort().each { categoryName ->
            def categorySales = salesByCategoryAndCountry[categoryName]
            def rowMap = new LinkedHashMap<String, Object>() 
            rowMap.put("CategoryName", categoryName)
            BigDecimal categoryTotalSales = BigDecimal.ZERO
            sortedCountries.each { country ->
                BigDecimal salesInCountry = categorySales.get(country, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP) 
                rowMap.put(country, salesInCountry) 
                categoryTotalSales += salesInCountry
            }
            rowMap.put("TotalSales", categoryTotalSales.setScale(2, RoundingMode.HALF_UP)) 
            crosstabData.add(rowMap)
        }
    }

    ctx.reportData = crosstabData
    if (!crosstabData.isEmpty()) {
        ctx.reportColumnNames = new ArrayList<>(crosstabData.get(0).keySet())
    } else {
        ctx.reportColumnNames = []
    }
    log.info("Finished scriptedReport_categoryRegionCrosstabReport.groovy. Prepared data for {} categories.", ctx.reportData.size())

} catch (Exception e) {
    log.error("FATAL Error during script execution: {}", e.message, e)
    ctx.reportData = []
    ctx.reportColumnNames = []
    throw e
}
\`\`\`

**Example 3: Aggregated Data for Charting**
*Goal: Use a single, efficient SQL query to aggregate data by a time period, preparing it for a trend chart.*

\`\`\`groovy
// Filename: scriptedReport_monthlySalesTrendReport.groovy
import groovy.sql.Sql
import java.math.BigDecimal
import java.time.format.DateTimeFormatter

def dbSql = ctx.dbSql
log.info("Starting scriptedReport_monthlySalesTrendReport.groovy...")

def monthlyDataSql = """
SELECT
    FORMATDATETIME(O."OrderDate", 'yyyy-MM') AS YearMonth,
    SUM(OD."UnitPrice" * OD."Quantity" * (1 - OD."Discount")) AS MonthlySales,
    COUNT(DISTINCT O."OrderID") AS OrderCount
FROM "Orders" O
JOIN "Order Details" OD ON O."OrderID" = OD."OrderID"
WHERE O."OrderDate" IS NOT NULL
GROUP BY FORMATDATETIME(O."OrderDate", 'yyyy-MM')
ORDER BY YearMonth ASC
"""

try {
    def aggregatedData = dbSql.rows(monthlyDataSql)
    log.info("Fetched {} aggregated monthly data points.", aggregatedData.size())
    ctx.reportData = aggregatedData
    log.info("Finished scriptedReport_monthlySalesTrendReport.groovy successfully.")
} catch (Exception e) {
    log.error("Error during script execution: {}", e.message, e)
    ctx.reportData = []
    ctx.reportColumnNames = []
    throw e
}
\`\`\`

**Example 4: Complex Calculation (KPIs)**
*Goal: For each entity (e.g., a Supplier/SupplierID), run multiple queries and perform calculations to generate a set of Key Performance Indicators (KPIs).

\`\`\`groovy
// Filename: scriptedReport_supplierScorecardReport.groovy
import groovy.sql.Sql
import java.time.temporal.ChronoUnit

log.info("Starting scriptedReport_supplierScorecardReport.groovy...")
def dbSql = ctx.dbSql
def supplierDataList = []

try {
    def suppliers = dbSql.rows("SELECT SupplierID, CompanyName FROM Suppliers ORDER BY SupplierID")
    log.info("Found {} suppliers.", suppliers.size())

    suppliers.each { supplier ->
        def supplierId = supplier.SupplierID
        def metrics = [:]
        metrics['SupplierID'] = supplierId
        metrics['CompanyName'] = supplier.CompanyName

        def productStats = dbSql.firstRow("""
            SELECT COUNT(*) AS ProductCount, AVG(UnitPrice) AS AvgUnitPrice
            FROM Products WHERE SupplierID = :supplierId
        """, [supplierId: supplierId])
        metrics['ProductCount'] = productStats?.ProductCount ?: 0
        metrics['AvgUnitPrice'] = productStats?.AvgUnitPrice ?: 0.0

        def deliveryStatsList = dbSql.rows("""
            SELECT o.OrderDate, o.RequiredDate, o.ShippedDate
            FROM Orders o JOIN "Order Details" od ON o.OrderID = od.OrderID
            JOIN Products p ON od.ProductID = p.ProductID
            WHERE p.SupplierID = :supplierId AND o.ShippedDate IS NOT NULL
        """, [supplierId: supplierId])

        def totalDeliveryDays = 0L
        def shippedOrdersCount = deliveryStatsList.size()
        def lateOrdersCount = 0

        if (shippedOrdersCount > 0) {
            deliveryStatsList.each { order ->
                def deliveryDays = dbSql.firstRow("SELECT DATEDIFF('DAY', CAST(:orderDate AS TIMESTAMP), CAST(:shippedDate AS TIMESTAMP)) AS days",
                                               [orderDate: order.OrderDate, shippedDate: order.ShippedDate]).days
                totalDeliveryDays += (deliveryDays ?: 0)
                if (order.ShippedDate != null && order.RequiredDate != null && order.ShippedDate.toLocalDateTime().isAfter(order.RequiredDate.toLocalDateTime())) {
                    lateOrdersCount++
                }
            }
            metrics['AvgDeliveryDays'] = (double) totalDeliveryDays / shippedOrdersCount
            metrics['LateDeliveryPercent'] = (double) lateOrdersCount / shippedOrdersCount
        } else {
            metrics['AvgDeliveryDays'] = null
            metrics['LateDeliveryPercent'] = null
        }
        
        def latePercent = metrics.LateDeliveryPercent
        def rating = "Average"
        if (latePercent != null) {
            if (latePercent == 0.0) rating = "Good"
            else if (latePercent > 0.5) rating = "Poor"
        } else if (shippedOrdersCount == 0) {
             rating = "N/A"
        }
        metrics['OverallRating'] = rating
        supplierDataList.add(metrics)
    }

    ctx.reportData = supplierDataList
    if (!supplierDataList.isEmpty()) {
        ctx.reportColumnNames = new ArrayList<>(supplierDataList[0].keySet())
    } else {
        ctx.reportColumnNames = []
    }
    log.info("Successfully processed {} suppliers.", suppliers.size())
} catch (Exception e) {
    log.error("Error during supplier scorecard script execution: {}", e.message, e)
    throw e
}
\`\`\`

---

**IMPORTANT: JASPERREPORTS (.jrxml) OUTPUT — ADDITIONAL RULES**

**These rules ONLY apply when the user explicitly mentions JasperReports, .jrxml, or Jasper in their request.** If nobody mentioned JasperReports — do NOT assume it is JasperReports. By default, generate a standard Groovy script following Examples 1-4 above.

When the output template is a JasperReports .jrxml (not HTML/Excel), the Groovy script MUST follow these additional rules because JasperReports \`JRMapCollectionDataSource\` cannot access fields outside the detail band (summary, footer, second bands all see NULL):

1.  **Emit totals/footer as separate virtual rows at the END of the details list.**
    After the real line-item rows, append rows with a \`row_type\` key so the .jrxml can render different layouts per row type within a single detail band:
    \`\`\`groovy
    // After all line-item rows have been added to detailsList:
    detailsList.add([row_type: "totals_line", label: "Subtotal", value: subtotalStr])
    detailsList.add([row_type: "totals_line", label: "Freight",  value: freightStr])
    detailsList.add([row_type: "totals_line", label: "Tax (8%)", value: taxStr])
    detailsList.add([row_type: "total_due",   label: "TOTAL DUE", value: "\\$\${grandTotalStr}"])
    detailsList.add([row_type: "footer", notes: masterRow.notes?.toString() ?: "",
                     contact_name: masterRow.contact_name?.toString() ?: "",
                     due_date: masterRow.due_date?.toString() ?: ""])
    \`\`\`

2.  **Pre-calculate ALL values in the script.** The .jrxml cannot do math — it only renders. Compute line totals, subtotals, tax, grand totals in Groovy and pass them as plain strings.

3.  **For line items, also pre-calculate \`line_total\`** as a string field on each detail row so the .jrxml just displays it.

4.  **Normal line-item rows should NOT have a \`row_type\` key** (or set it to null). The .jrxml uses \`$F{row_type} == null\` to identify real data rows vs. virtual rows.

These rules do NOT apply when the output is HTML, Excel, or any other non-JR template — only when the template is a .jrxml file.
`,
      tags: ['groovy', 'input-source', 'master-details', 'cross-tab', 'kpi'],
      category: 'Script Writing Assistance',
    }, {
      id: 'GROOVY_SCRIPT_ADDITIONAL_TRANSFORMATION',
      title: 'Groovy `Additional Data Transformation` Script (Java 8 Stream API)',
      description: 'Generates a Groovy script for the "Additional Data Transformation" step in ReportBurster, transforming ctx.reportData using Java 8 Stream API.',
      promptText: `You are an expert Groovy Developer specializing in data transformation for the reporting tool ReportBurster.

Your task is to write a complete Groovy script that performs **additional data transformation** on a dataset that has already been fetched and is available as a \`List<Map<String, Object>>\` in the variable \`ctx.reportData\`.

**YOUR TASK:**

Based on all the rules and examples below, write a complete Groovy script for the following business requirement.  
Provide **only** the final Groovy script in a single Markdown code block, with no other text or explanation.

<REQUIREMENT>
[USER: PASTE YOUR PLAIN ENGLISH BUSINESS REQUIREMENT HERE]
</REQUIREMENT>

This script will be used as the "Additional Data Transformation" step in ReportBurster.  
It runs within a Java application and has access to a context object named \`ctx\`.  
The input data is already available as \`ctx.reportData\`, which is a \`List<Map<String, Object>>\` (each map is a row, keys are column names).

**CRITICAL INSTRUCTIONS: You must follow these "Golden Rules" precisely.**

1.  **The Script's One Job: Transform \`ctx.reportData\`**
    *   The script's entire purpose is to take the existing \`ctx.reportData\` (a \`List<Map<String, Object>>\`), apply the required transformations, and assign the transformed list back to \`ctx.reportData\`.
    *   You may also update \`ctx.reportColumnNames\` if you add or remove columns.

2.  **Think in Rows and Columns: \`List<Map>\` is Law**
    *   The data structure must remain a \`List\` of \`Map\`s.
    *   The **\`List\`** represents the entire dataset (all the rows).
    *   Each **\`Map\`** inside the list represents a single row of data.
    *   The **\`Map\`'s keys** (which must be \`String\`s) are the column names available in the report template (e.g., \`\${OrderID}\`, \`\${CustomerName}\`, etc.). Use \`LinkedHashMap\` if column order is important.

3.  **Use Java 8 Stream API for Transformation**
    *   **DO** use Groovy's support for Java 8 Stream API (e.g., \`ctx.reportData.stream()...collect(Collectors.toList())\`) for filtering, mapping, grouping, and other transformations.
    *   **DO** use Groovy closures and idioms where appropriate, but focus on demonstrating the Java 8 Stream approach.

4.  **Transform, Don't Fetch**
    *   **DO NOT** fetch new data from the database or external sources. Only transform the data already present in \`ctx.reportData\`.
    *   **DO** perform calculations, filtering, enrichment, aggregation, or restructuring as required by the business requirement.

5.  **Prepare Data for the Template**
    *   **DO** perform all complex calculations, data lookups, and business logic inside the script to create the final, clean \`Map\` of data for each row. The template should be as simple as possible.
    *   **DON'T** put complex conditional logic or calculations in the report template. Prepare the data fully in the script first.

6.  **Logging and Error Handling**
    *   **DO** use \`log.info\`, \`log.debug\`, and \`log.error\` for important steps, especially for debugging and error handling.
    *   **DO** wrap your transformation logic in a \`try/catch\` block. On error, log the exception and rethrow or set \`ctx.reportData = []\`.

---

**EXAMPLES OF HIGH-QUALITY TRANSFORMATION SCRIPTS:**

Here are examples of scripts that correctly follow these rules for different transformation scenarios.

**Example 1: Filter Rows and Add a Calculated Column**

\`\`\`groovy
import java.util.stream.Collectors
import java.math.BigDecimal

try {
    log.info("Starting additional data transformation: filter and add TotalPrice column...")

    def transformedData = ctx.reportData.stream()
        .filter { row -> row.Status == 'Active' }
        .map { row ->
            def newRow = new LinkedHashMap<>(row)
            BigDecimal unitPrice = row.UnitPrice instanceof BigDecimal ? row.UnitPrice : new BigDecimal(row.UnitPrice.toString())
            BigDecimal quantity = row.Quantity instanceof BigDecimal ? row.Quantity : new BigDecimal(row.Quantity.toString())
            newRow.TotalPrice = unitPrice.multiply(quantity)
            return newRow
        }
        .collect(Collectors.toList())

    ctx.reportData = transformedData
    if (!transformedData.isEmpty()) {
        ctx.reportColumnNames = new ArrayList<>(transformedData.get(0).keySet())
    }
    log.info("Transformation complete. Rows after filter: {}", ctx.reportData.size())
} catch (Exception e) {
    log.error("Error during additional data transformation: {}", e.message, e)
    ctx.reportData = []
    ctx.reportColumnNames = []
    throw e
}
\`\`\`

**Example 2: Group and Aggregate Data**

\`\`\`groovy
import java.util.stream.Collectors
import java.math.BigDecimal

try {
    log.info("Starting additional data transformation: group by Department and sum Salary...")

    def grouped = ctx.reportData.stream()
        .collect(Collectors.groupingBy(
            { row -> row.Department },
            Collectors.reducing(
                null,
                { row -> row },
                { a, b ->
                    if (a == null) return b
                    if (b == null) return a
                    def sumSalary = (a.Salary ?: 0) + (b.Salary ?: 0)
                    def result = new LinkedHashMap<>(a)
                    result.Salary = sumSalary
                    return result
                }
            )
        ))

    def aggregatedData = grouped.values().stream()
        .filter { it != null }
        .collect(Collectors.toList())

    ctx.reportData = aggregatedData
    if (!aggregatedData.isEmpty()) {
        ctx.reportColumnNames = new ArrayList<>(aggregatedData.get(0).keySet())
    }
    log.info("Transformation complete. Departments: {}", ctx.reportData.size())
} catch (Exception e) {
    log.error("Error during additional data transformation: {}", e.message, e)
    ctx.reportData = []
    ctx.reportColumnNames = []
    throw e
}
\`\`\`

**Example 3: Pivot/Crosstab Transformation**

\`\`\`groovy
import java.util.stream.Collectors
import java.util.TreeSet

try {
    log.info("Starting additional data transformation: pivot by Region...")

    def allRegions = new TreeSet(ctx.reportData.collect { it.Region })
    def grouped = ctx.reportData.stream()
        .collect(Collectors.groupingBy({ row -> row.Category }))

    def pivotedData = grouped.entrySet().stream()
        .map { entry ->
            def category = entry.key
            def rows = entry.value
            def rowMap = new LinkedHashMap<String, Object>()
            rowMap.Category = category
            allRegions.each { region ->
                def sum = rows.findAll { it.Region == region }
                    .collect { it.Sales ?: 0 }
                    .sum()
                rowMap[region] = sum
            }
            return rowMap
        }
        .collect(Collectors.toList())

    ctx.reportData = pivotedData
    if (!pivotedData.isEmpty()) {
        ctx.reportColumnNames = new ArrayList<>(pivotedData.get(0).keySet())
    }
    log.info("Transformation complete. Categories: {}", ctx.reportData.size())
} catch (Exception e) {
    log.error("Error during additional data transformation: {}", e.message, e)
    ctx.reportData = []
    ctx.reportColumnNames = []
    throw e
}
\`\`\`

---

**REMEMBER:**  
- Your script must only transform the data in \`ctx.reportData\` using Java 8 Stream API and Groovy idioms.  
- Do not fetch new data or perform I/O.  
- Output only the final Groovy script in a single Markdown code block.

---`,
      tags: ['groovy', 'transformation', 'java8=stream-api'],
      category: 'Script Writing Assistance',
    },
     {
      id: 'SINGLE-MODEL-TEMPLATE-FROM-FIELDS',
      title: 'Generate Single Document Template (single-[model].php)',
      description: 'Generate a secure, user-restricted PHP template for displaying a single document of a custom Pods type. Use the provided model fields and optionally an example template.',
      promptText: `You are an experienced WordPress developer with deep knowledge of the Pods Framework API and Tailwind CSS. Your task is to generate a complete, secure PHP single template for a new custom Pods content type, adapting an existing example template.

**New Pods Content Type Definition (in Plain English or PHP Code):**  
[Describe or paste the new content type here, e.g., fields like employee, period, gross_amount, net_amount, associated_user. Include any optional access fields like allow_public_view, associated_groups, associated_roles.]

**Example Template to Adapt:**  
[Paste the full code of an existing sample template here—choose the one most similar to your new content type (e.g., single-paystub.php for pay-related documents, single-payslip.php for similar employee documents, or single-invoice.php for billing documents).]

**Instructions:**  
- Adapt the example template for the new content type.  
- Update all field names, labels, and data display to match the new type.  
- Keep the same access control logic, layout, and Tailwind CSS styling.  
- If the new type has different fields or requirements, adjust accordingly (e.g., add/remove table rows, change calculations).  
- Output the full, ready-to-use PHP code for \`single-{new-type}.php\`.  
- Ensure security, proper escaping, and WordPress/Pods best practices.`,
      tags: ['single-(content-type).php', 'webportal'],
      category: 'Web Portal / CMS',
    }, {
      id: 'MY-DOCUMENTS-LIST-TEMPLATE-FROM-FIELDS',
      title: 'Generate My Documents List Template (page-my-documents.php)',
      description: 'Generate a PHP template for listing all documents of a custom Pods type for the logged-in user, with search and pagination. Use the provided model fields and optionally an example template.',
      promptText: `You are an experienced WordPress developer with deep knowledge of the Pods Framework API and Tailwind CSS. Your task is to generate a complete, secure PHP single template for a new custom Pods content type, adapting an existing example template.

**New Pods Content Type Definition (in Plain English or PHP Code):**  
[Describe or paste the new content type here, e.g., fields like employee, period, gross_amount, net_amount, associated_user. Include any optional access fields like allow_public_view, associated_groups, associated_roles.]

**Example Template to Adapt:**  
[Paste the full code of an existing sample template here—choose the one most similar to your new content type (e.g., page-my-documents-paystubs.php for simple pay-related lists, page-my-documents-payslips.php for employee document lists with additional fields like department/job_title, or page-my-documents-invoices.php for billing lists with status and payment actions).]

**Instructions:**  
- Adapt the example template for the new content type.  
- Update all field names, labels, and data display to match the new type.  
- Keep the same access control logic, layout, and Tailwind CSS styling.  
- If the new type has different fields or requirements, adjust accordingly (e.g., add/remove table columns, change search fields, modify status logic).  
- Output the full, ready-to-use PHP code for \`page-my-documents.php\` 
- Ensure security, proper escaping, and WordPress/Pods best practices.`,
      tags: ['page-my-documents.php', 'webportal'],
      category: 'Web Portal / CMS',
    }, {
      id: 'GROOVY-REST-PUBLISH-TO-PORTAL',
      title: 'Generate Groovy Script to Publish Documents to ReportBurster Portal via REST API',
      description: 'Generate a Groovy script for ReportBurster that publishes documents to the web portal using the WordPress/Pods REST API, including authentication. The script must also check for the existence of the target WordPress user and create the user if not already present.',
      promptText: `You are an experienced Groovy developer with deep knowledge of ReportBurster, WordPress REST API, and Pods Framework integration. Your task is to generate a complete, robust Groovy script that publishes documents to the 
ReportBurster Portal via WordPress / Pods REST API, adapting an existing example script.

**New Pods Content Type Definition (in Plain English or PHP Code):**  
[Describe or paste the new content type here, e.g., fields like order_id, order_date, customer_id, customer_name, freight, line_items_json, subtotal, tax, grand_total, associated_user, document_status, was_viewed_by.]

**Example Groovy Script to Adapt:**  
[Paste the full code of an existing sample Groovy script here—choose the one most similar to your new content type (e.g., curl_paystub2portal.groovy for paystub, curl_payslip2portal.groovy for payslip, or curl_invoice2portal.groovy for invoice).]

**Instructions:**  
- Adapt the example script for the new content type and its fields.  
- Structure the script in clear, logical steps (e.g., Step 1: Check/Create User, Step 2: Prepare Document Data, Step 3: Publish Document via REST API).  
- Update all field names, labels, and data mapping to match the new type.  
- Ensure the script checks if the target WordPress user exists (by username or email) and creates the user if not already present, handling authentication as needed.  
- Use HTTP POST for publishing, handle authentication, and log the result.  
- Output the full, ready-to-use Groovy script for publishing documents to the portal.  
- Ensure the script is modular, robust, and easy to adapt for different scenarios.`,
      tags: ['curl_(content-type)2portal.groovy', 'webportal'],
      category: 'Web Portal / CMS',
    }
  ];

  // Method to retrieve all prompts
  getAllPrompts(): PromptInfo[] {
    return this.prompts;
  }

  // Method to get prompts by category
  getPromptsByCategory(category: PromptInfo['category']): PromptInfo[] {
    return this.prompts.filter((prompt) => prompt.category === category);
  }

  // Method to get a specific prompt by ID
  getPromptById(id: string): PromptInfo | undefined {
    return this.prompts.find((prompt) => prompt.id === id);
  }
}
