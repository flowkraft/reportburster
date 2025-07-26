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
  | 'PDF Generation (from HTML)'
  | 'PDF Generation (from XSL-FO)'
  | 'SQL Writing Assistance'
  | 'Script Writing Assistance'
  | 'Vanna.AI';
}

@Injectable({
  providedIn: 'root',
})
export class AiManagerService {
  constructor() { }

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

    // --- PDF Report Generation ---
    {
      id: 'PDF_SAMPLE_A4_PAYSLIP_XSLFO',
      title: 'Sample of an A4 `Payslip` PDF Report (generated from XSL-FO)',
      description:
        'Sample of an A4 `Payslip` PDF Report (generated from XSL-FO)',
      promptText: `Create a clean, professional FreeMarker template in XSL-FO (XSL Formatting Objects) format for a payslip report. 
The template should be designed for processing with Apache FOP and must generate a single-page PDF document.

The generated XSL-FO template must fulfill the following requirements:

1.  **Document Structure & Page Layout**:
    *   The root element must be \`<fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">\`.
    *   Define a single \`<fo:simple-page-master>\` for a standard A4 portrait page (\`page-height="29.7cm"\`, \`page-width="21cm"\`).
    *   Set page margins to \`1.5cm\` on the left and right, and \`1cm\` on the top and bottom.
    *   The entire content must be within a single \`<fo:page-sequence>\` and flow into the \`xsl-region-body\`.

2.  **Content Sections**:
    The payslip must be clearly organized into the following sections using \`fo:block\` and \`fo:table\` elements:
    *   **Company Information**: Centered block at the top for the company name (bold), address, and phone number.
    *   **Report Header**: A clear, centered title, such as "STATEMENT OF MONTHLY INCOME," in a larger, bold font.
    *   **Employee Details**: A two-column table with a fixed layout (\`table-layout="fixed"\`) to display:
        *   Employee Name
        *   Employee ID
        *   Social Security #
        *   Pay Period
        *   Department
        *   Position/Grade
    *   **Earnings & Deductions**: A single, four-column table with a fixed layout to display earnings and deductions side-by-side.
        *   **Header**: The table must have a header row with the titles: "EARNINGS", "AMOUNT", "TAXES/DEDUCTIONS", "AMOUNT".
        *   **Body**: List individual items like "Basic Salary" and "Bonuses" under Earnings, and "Federal Tax," "Social Security Tax," etc., under Taxes/Deductions. Use empty cells on the left to align with the longer list of deductions on the right.
        *   **Footer**: The table must have a footer row summarizing "Total Earnings" and "Total Deductions".
    *   **Net Pay Summary**: A block or container showing the final "Net Pay". This should be right-aligned on the page.
    *   **Signatures**: A two-column table at the bottom with top borders to create signature lines for the "Employee" and "Director".

3.  **Styling and Formatting (XSL-FO Properties)**:
    *   **Fonts**: Use standard fonts. Specify \`font-weight="bold"\` for headers and labels. Use \`font-size\` with absolute units (e.g., \`10pt\`, \`16pt\`).
    *   **Spacing**: Use \`space-after\`, \`space-before\`, and \`padding\` properties with absolute units (e.g., \`10pt\`, \`5pt\`) to ensure consistent spacing. Do not rely on default spacing.
    *   **Borders**: Use solid black 1pt borders for all table cells (\`border="1pt solid black"\`).
    *   **Alignment**: Use \`text-align\` property for text alignment (\`center\`, \`end\`). Financial amounts should be right-aligned (\`text-align="end"\`).
    *   **Colors**: Use high-contrast, print-friendly colors. The header and footer rows of the main table should have a light gray background (e.g., \`background-color="#f2f2f2"\`).

4.  **FreeMarker Integration**:
    *   Use FreeMarker placeholders \`\${colN}\` (e.g., \`\${col0}\`, \`\${col1}\`, etc.) for all dynamic data fields.
    *   Include a conditional check for the "Pay Period" field to format it as a date if possible: \`<#if col3?is_date>\${col3?string("MM/dd/yy")}<#else>\${col3}</#if>\`.

5.  **XML Validity**:
    *   Ensure the entire output is a well-formed XML document. All tags must be properly closed.

**Return a single, complete, and self-contained XSL-FO FreeMarker template (\`.ftl\`) that strictly adheres to all the things mentioned above.`,
      tags: ['payslip', 'sample-xslfo2pdf'],
      category: 'PDF Generation (from XSL-FO)',
    },
    {
      id: 'PDF_COMBINED_PAYSLIP_EXAMPLE',
      title: 'Combined Example: PDF Payslip',
      description:
        'A comprehensive prompt combining multiple PDF requirements to generate a payslip template.',
      promptText: `**Create a clean, professional template for a payslip report with the following sections,
which are commonly included in such documents.

The generated HTML must fulfill the following requirements to ensure it is optimized for
PDF conversion:**

1. **Layout and Dimensions**:
   - Fixed-width layout: Use absolute pixel values (\`px\`) for all layout dimensions.
   Relative units like \`%\`, \`em\`, or \`rem\` must not be used.
   - Explicit dimensions: Specify fixed dimensions for all containers, elements,
   and components—no relative or undefined measurements.
   - Ensure the main areas of the report are well aligned, creating a visually
   appealing and structured final design.

2. **Sections**:
   - **Header**:
     - Company name, logo, address, and contact information.
     - Payslip title (e.g., "Employee Payslip") and date of issuance.
   - **Employee Details**:
     - Employee's full name.
     - Employee ID or payroll number.
     - Department and job designation.
   - **Earnings**:
     - Basic salary.
     - Allowances (e.g., housing, transport).
     - Bonuses or incentives.
     - Overtime pay (if applicable).
   - **Deductions**:
     - Tax deductions (e.g., income tax).
     - Social security contributions.
     - Insurance premiums.
     - Other deductions (e.g., loan repayment).
   - **Summary**:
     - Gross pay (total earnings before deductions).
     - Total deductions.
     - Net pay (final amount paid to the employee after deductions).
   - **Footer**:
     - Bank details (e.g., account number for payment).
     - Employer's contact details for payroll queries.
     - Any disclaimers or notes (e.g., "This payslip is for reference only").

3. **Spacing**:
   - Apply explicit margin and padding values to every element for consistent spacing.
   Default or unspecified spacing is not allowed.

4. **Visual and Print-Optimized Design**:
   - Print-optimized colors: Avoid subtle gradients and ensure all colors have high
   contrast for clarity. Use solid colors wherever possible.
   - Font consistency: Define consistent fonts with appropriate font-family fallbacks
   throughout the document. Avoid unsupported font variations in PDF rendering.

5. **HTML Standards**:
   - Set \`box-sizing: border-box\` for all elements for predictable alignment and dimensions.
   - Close all HTML tags properly, including self-closing tags like \`<br>\` and \`<img>\`.
   - Replace the \`&\` character with \`&amp;\` to ensure valid HTML code.
   - Avoid using \`&nbsp;\`; replace it with alternative spacing methods.

6. **Measurements**:
   - Use absolute units (e.g., \`px\`, \`pt\`) for all measurements such as width, height,
   and font size.

7. **Page Format**:
   - Format the document for A4 portrait orientation with standard margins.
   - Ensure the output PDF consolidates all content into a single page, maintaining
   the integrity and readability of the payslip.

**Return fully self-contained HTML code with inline CSS—no partial or snippet formats—and
ensure the design aligns with both the requirements of the payslip template and
PDF conversion rules.**`,
      tags: ['payslip', 'comprehensive', 'sample-html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_SAMPLE_A4_ORDER_SUMMARY',
      title: 'Sample of an A4 `Order Summary` PDF Report (generated from HTML)',
      description:
        'Sample of an A4 `Order Summary` PDF Report (generated from HTML)',
      promptText: `**Role:** You are an expert web developer specializing in creating pixel-perfect HTML templates for generating professional PDF documents.

**Objective:** Generate a complete, self-contained HTML template with embedded CSS to render a professional A4-sized **Order Summary**. This template will be used by 
a Java-based rendering engine to convert the XHTML into a PDF, so it must adhere to strict formatting rules for print output.

**Data Placeholders:**
The template must use two types of placeholders:

1.  **Dynamic Data Placeholders (for template engine):** These will be populated at runtime. Use the exact \`\${FieldName}\` syntax.
    *   \`\${OrderID}\`
    *   \`\${OrderDate}\`
    *   \`\${RequiredDate}\`
    *   \`\${ShippedDate}\`
    *   \`\${CustomerName}\`
    *   \`\${EmployeeName}\`
    *   \`\${TotalAmount}\`

2.  **Static Configuration Placeholders (for manual replacement):** These are meant to be replaced with hardcoded values directly in the template file. Use the exact \`[[...]]\` syntax.
    *   \`[[PUT_YOUR_COMPANY_NAME_HERE]]\`
    *   \`[[PUT_YOUR_COMPANY_ADDRESS_HERE]]\`
    *   \`[[PUT_YOUR_COMPANY_CONTACT_INFO_HERE]]\`

**Layout Requirements:**
1.  **Header:**
    *   Top-left: Your company details (\`[[PUT_YOUR_COMPANY_NAME_HERE]]\`, \`[[PUT_YOUR_COMPANY_ADDRESS_HERE]]\`, \`[[PUT_YOUR_COMPANY_CONTACT_INFO_HERE]]\`).
    *   Top-right: A large "ORDER SUMMARY" title, followed by Order # (\`\${OrderID}\`), Order Date (\`\${OrderDate}\`), Required Date (\`\${RequiredDate}\`), and Shipped Date (\`\${ShippedDate}\`).
2.  **Customer Information:**
    *   A section below the header for "BILL TO" containing only the customer's name (\`\${CustomerName}\`).
3.  **Total Amount Section:**
    *   Create a clean and prominent section in the main body.
    *   It should feature a single, clear line item: "Order Total".
    *   Align the "Order Total" label to the left and the \`\${TotalAmount}\` value to the right. Make the total amount large and bold.
4.  **Footer:**
    *   A section at the bottom of the page for any notes, a "Thank you for your business!" message, and the sales representative's name (\`\${EmployeeName}\`).

**CRITICAL Technical & Styling Constraints:**
You must follow these rules precisely to ensure proper PDF rendering.

1.  **Well-Formed XHTML:** The entire output must be valid XHTML. All tags must be properly nested and closed (e.g., \`<br/>\`, \`<hr/>\`).
2.  **Character Encoding:** Use \`&amp;\` for all ampersand characters. Do not use the raw \`&\` character.
3.  **Internal CSS:** All CSS must be placed within a \`<style type="text/css">\` tag in the \`<head>\` section.
4.  **A4 Page Setup:** Use the \`@page\` CSS rule to define the document size as A4 portrait and set margins (e.g., \`size: A4 portrait; margin: 25mm;\`).
5.  **Absolute Units ONLY:** All measurements for layout, fonts, margins, padding, and borders **must** be in absolute units (\`px\` or \`pt\`). **DO NOT USE** relative units like \`%\`, \`em\`, or \`rem\`.
6.  **Box Model:** Apply \`* { box-sizing: border-box; }\` at the beginning of your CSS for predictable layout calculations.
7.  **Fixed Layout:** Use \`div\` elements with fixed pixel widths for the main layout structure. Use \`display: table;\` and \`display: table-cell;\` for creating columns instead of floats to ensure robust alignment.
8.  **Font Specification:** Use a common, print-safe font stack like \`font-family: Arial, Helvetica, sans-serif;\`. Define all font sizes in \`pt\`.
9.  **Color:** Use high-contrast, solid colors (e.g., \`#000000\` for text).
10. **Spacing:** Do not use \`&nbsp;\` for spacing. Define all spacing explicitly using \`margin\` and \`padding\` with absolute \`px\` or \`pt\` values.
11. **Page Break Control:** Apply \`page-break-inside: avoid;\` to the main content containers.

Please provide the complete, single HTML file as the final output, ready for rendering.`,
      tags: ['format-a4-portrait', 'order-summary', 'sample-html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_CORE_OPTIMIZATION',
      title: 'Core PDF Optimization Instructions',
      description:
        'Base instructions to ensure HTML is optimized for PDF conversion (fixed layout, absolute units, etc.).',
      promptText: `Generate HTML optimized for PDF conversion with the following requirements:

- Fixed-Width Layout: All layout dimensions must be specified using absolute pixel values (\`px\`). Do not use percentages, responsive units (e.g., \`%\`, \`em\`, or \`rem\`), or any other relative measurement units.
- Consistent Spacing: Apply explicit margin and padding values for every HTML element to ensure consistent spacing throughout the layout. Avoid using default or unspecified spacing.
- Explicit Dimensions: Define fixed dimensions (in pixel values) for all containers, elements, and components. No container should have undefined or relative dimensions.
- Strategic Page Breaks: Use CSS \`page-break-before\`, \`page-break-after\`, and \`page-break-inside\` properties strategically to control where page breaks occur in the PDF output.
- Print-Optimized Colors: Avoid subtle gradients and ensure all colors have sufficient contrast for print clarity. Use solid colors whenever possible.
- Font Consistency: Use consistent fonts throughout the document, and define appropriate font-family fallbacks. Avoid font variations that might not be supported in PDF rendering.
- Proper Box-Sizing: Set \`box-sizing: border-box\` for all elements to ensure predictable element dimensions and alignment in the layout.
- Close All HTML Tags: All HTML tags must be properly closed, including self-closing tags like \`<br>\` and \`<img>\`. Do not leave any tag unclosed or partially closed.
- Use \`&amp;\` Instead of \`&\`: Replace every instance of the raw \`&\` character with the encoded entity \`&amp;\`. The raw \`&\` character must never appear in the HTML code.
- Avoid Using \`&nbsp;\`: Do not use the non-breaking space entity \`&nbsp;\`. Replace it with alternative spacing methods if needed.
- Absolute Measurements Only: All measurements (e.g., width, height, font-size) must use absolute units such as \`px\` or \`pt\`. Relative units like \`%\`, \`em\`, or \`rem\` are strictly prohibited.`,
      tags: ['optimization', 'layout', 'core', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PAGE_SIZE_A4_PORTRAIT',
      title: 'Set PDF Page Size: A4 Portrait',
      description:
        'Instructs the AI to format the document as A4 portrait with standard margins.',
      promptText: `Format the document as A4 portrait with standard margins.`,
      tags: ['format-a4-portrait', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PAGE_SIZE_US_LETTER',
      title: 'Set PDF Page Size: US Letter',
      description:
        'Instructs the AI to format the document as US Letter size with standard margins.',
      promptText: `Format the document as US Letter size with standard margins.`,
      tags: ['format-letter-us-size', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_MARGINS_NARROW',
      title: 'Set PDF Margins: Narrow',
      description:
        'Instructs the AI to apply narrow margins (1.5cm) to maximize content area.',
      promptText: `Apply narrow margins (1.5cm) to maximize content area.`,
      tags: ['margins', 'narrow', 'layout', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_MARGINS_WIDE',
      title: 'Set PDF Margins: Wide',
      description:
        'Instructs the AI to apply wide margins (3cm) for a more formal appearance.',
      promptText: `Apply wide margins (3cm) for a more formal document appearance.`,
      tags: ['margins', 'wide', 'formal', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PAGE_NUMBERING_BOTTOM_CENTER_X_OF_Y',
      title: 'Add Page Numbering: Bottom Center (X of Y)',
      description:
        'Adds page numbering at the bottom center showing "Page X of Y".',
      promptText: `Add page numbering at the bottom center of each page showing "Page X of Y".`,
      tags: ['numbering', 'pagination', 'footer', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PAGE_NUMBERING_BOTTOM_RIGHT_CURRENT',
      title: 'Add Page Numbering: Bottom Right (Current Page)',
      description:
        'Adds page numbering at the bottom right showing only the current page number.',
      promptText: `Add page numbering at the bottom right corner showing only the current page number.`,
      tags: ['numbering', 'pagination', 'footer', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PAGE_NUMBERING_START_SECOND_PAGE',
      title: 'Start Page Numbering from Second Page',
      description:
        'Starts page numbering from the second page, leaving the first page unnumbered.',
      promptText: `Start page numbering from the second page, leaving the first page without a number.`,
      tags: ['numbering', 'pagination', 'multi-page', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PAGE_NUMBERING_SECTION_PREFIX',
      title: 'Add Page Numbering: With Section Prefix',
      description:
        'Adds page numbering with a section prefix (e.g., "Section 1, Page 2").',
      promptText: `Add page numbering with section prefix, like "Section 1, Page 2".`,
      tags: ['numbering', 'sections', 'organization', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_HEADER_CONSISTENT_LOGO_TITLE',
      title: 'Add Header: Consistent Logo & Title',
      description:
        'Adds a consistent header on each page with company logo and document title.',
      promptText: `Add a consistent header on each page containing the company logo and document title.`,
      tags: ['header', 'branding', 'consistency', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_FOOTER_CONSISTENT_CONTACT_COPYRIGHT',
      title: 'Add Footer: Consistent Contact & Copyright',
      description:
        'Includes a footer on each page with contact information and copyright notice.',
      promptText: `Include a footer on each page with contact information and copyright notice.`,
      tags: ['footer', 'legal', 'contact', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_HEADER_DIFFERENT_FIRST_PAGE',
      title: 'Set Header: Different First Page',
      description:
        'Applies a different header on the first page compared to subsequent pages.',
      promptText: `Apply a different header on the first page than on subsequent pages.`,
      tags: ['header', 'first-page', 'styling', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_HEADER_TITLE_FOOTER_DATE',
      title: 'Set Header/Footer: Title & Date',
      description:
        'Includes the document title in the header and the date in the footer.',
      promptText: `Include the document title in the header and the date in the footer.`,
      tags: ['header', 'footer', 'metadata', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_HEADER_TOC',
      title: 'Add Header: Table of Contents',
      description:
        'Includes a table of contents in the header for navigation (requires specific implementation).',
      promptText: `Include a table of contents in the header for easy navigation.`,
      tags: ['toc', 'navigation', 'header', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_WATERMARK',
      title: 'Add Watermark',
      description: 'Includes a watermark in the background of each page.',
      promptText: `Include a watermark in the background of each page.`,
      tags: ['watermark', 'security', 'background', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_FOOTER_DISCLAIMER',
      title: 'Add Footer: Disclaimer',
      description: 'Includes a disclaimer in the footer of each page.',
      promptText: `Include a disclaimer in the footer of each page.`,
      tags: ['footer', 'legal', 'disclaimer', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_HEADER_DATE_FOOTER_PAGENUM',
      title: 'Set Header/Footer: Date & Page Numbers',
      description:
        'Includes the document date in the header and page numbers in the footer.',
      promptText: `Include the document date in the header and page numbers in the footer.`,
      tags: ['header', 'footer', 'metadata', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_MULTIPAGE_BREAK_HANDLING',
      title: 'Handle Multi-Page: Page Breaks',
      description:
        'Ensures proper page break handling, keeping related content together.',
      promptText: `Ensure proper page break handling for a multi-page document, keeping related content together.`,
      tags: ['page-breaks', 'multi-page', 'content', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_MULTIPAGE_TABLE_HEADERS',
      title: 'Handle Multi-Page: Repeat Table Headers',
      description:
        'Repeats table headers on each new page for tables spanning multiple pages.',
      promptText: `For tables that span multiple pages, repeat the table headers on each new page.`,
      tags: ['tables', 'headers', 'multi-page', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_MULTIPAGE_WIDOWS_ORPHANS',
      title: 'Handle Multi-Page: Prevent Widows/Orphans',
      description:
        'Prevents single lines of a paragraph at the start or end of pages.',
      promptText: `Prevent widows and orphans (single lines at start/end of pages) throughout the document.`,
      tags: ['typography', 'readability', 'formatting', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_MULTIPAGE_SECTIONS',
      title: 'Handle Multi-Page: Sections',
      description:
        'Sets up sections with different formatting, each starting on a new page.',
      promptText: `Set up sections with different formatting, each starting on a new page.`,
      tags: ['sections', 'organization', 'formatting', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_TABLE_PAGINATION_HEADERS',
      title: 'Handle Tables: Pagination & Headers',
      description:
        'Creates tables that paginate correctly across pages with repeating headers.',
      promptText: `Create tables that properly paginate across multiple pages with repeating headers.`,
      tags: ['tables', 'pagination', 'headers', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_TABLE_FINANCIAL_FORMATTING',
      title: 'Handle Tables: Financial Formatting',
      description:
        'Formats financial tables with right-aligned currency values.',
      promptText: `Format financial tables with right-aligned monetary values and proper currency symbols.`,
      tags: ['financial', 'tables', 'currency', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_TABLE_ALTERNATING_ROWS',
      title: 'Handle Tables: Alternating Row Colors',
      description:
        'Designs data tables with alternating row colors suitable for printing.',
      promptText: `Design data tables with alternating row colors that print properly.`,
      tags: ['tables', 'visual', 'readability', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_TABLE_FIXED_COLUMNS',
      title: 'Handle Tables: Fixed-Width Columns',
      description:
        'Uses fixed-width columns for tables to maintain alignment across pages.',
      promptText: `Use fixed-width columns for tables to maintain alignment across pages.`,
      tags: ['tables', 'alignment', 'layout', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_TABLE_BORDERS_PADDING',
      title: 'Handle Tables: Borders & Padding',
      description:
        'Ensures tables have proper borders and padding for readability.',
      promptText: `Ensure tables have proper borders and padding for readability.`,
      tags: ['tables', 'borders', 'spacing', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_TABLE_CSS_STYLING',
      title: 'Handle Tables: Use CSS for Styling',
      description: 'Uses CSS for table styling instead of HTML attributes.',
      promptText: `Use CSS for table styling instead of relying on HTML attributes.`,
      tags: ['tables', 'css', 'styling', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_HIDE_SCREEN_ELEMENTS',
      title: 'Print Styling: Hide Screen Elements',
      description:
        'Hides elements meant only for screen display when printing to PDF.',
      promptText: `Hide screen-only elements when printing to PDF.`,
      tags: ['printing', 'visibility', 'optimization', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_ADJUST_LAYOUT',
      title: 'Print Styling: Adjust Layout/Visibility',
      description:
        'Uses print-specific styles to adjust layout and visibility for PDF output.',
      promptText: `Use print-specific styles to adjust layout and visibility of elements.`,
      tags: ['printing', 'layout', 'visibility', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_EMBED_IMAGES',
      title: 'Print Styling: Embed Images',
      description:
        'Ensures all images are embedded in the document for proper printing.',
      promptText: `Ensure all images are embedded in the document for proper printing.`,
      tags: ['images', 'embedding', 'printing', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_HIGH_RES_IMAGES',
      title: 'Print Styling: High-Resolution Images',
      description: 'Uses high-resolution images for better print quality.',
      promptText: `Use high-resolution images for better print quality.`,
      tags: ['images', 'resolution', 'quality', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_AVOID_BACKGROUNDS',
      title: 'Print Styling: Avoid Backgrounds',
      description:
        'Avoids background images or colors that may not print well.',
      promptText: `Avoid using background images or colors that may not print well.`,
      tags: ['backgrounds', 'printing', 'optimization', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_STYLE_LINKS',
      title: 'Print Styling: Style Hyperlinks',
      description: 'Ensures hyperlinks are styled appropriately for print.',
      promptText: `Ensure all hyperlinks are styled appropriately for print.`,
      tags: ['hyperlinks', 'styling', 'printing', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_MEDIA_QUERIES',
      title: 'Print Styling: Use Media Queries',
      description:
        'Uses CSS media queries (@media print) to apply print-specific styles.',
      promptText: `Use CSS media queries to apply print-specific styles.`,
      tags: ['media-queries', 'css', 'printing', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_LINK_LAYOUT',
      title: 'Print Styling: Ensure Link Layout',
      description:
        'Ensures hyperlinks appear properly without disrupting the layout.',
      promptText: `Ensure all hyperlinks appear properly in the PDF without disrupting the layout.`,
      tags: ['hyperlinks', 'layout', 'printing', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_PRINT_BACKGROUNDS_CORRECTLY',
      title: 'Print Styling: Print Backgrounds Correctly',
      description: 'Makes sure background colors and images print correctly.',
      promptText: `Make sure background colors and images print correctly in the PDF.`,
      tags: ['backgrounds', 'colors', 'printing', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_FONT_WEBSAFE_EMBED',
      title: 'Font Handling: Web-Safe or Embed',
      description:
        'Uses only web-safe fonts or embeds custom fonts for consistent rendering.',
      promptText: `Use only web-safe fonts or embed custom fonts properly to ensure consistent rendering.`,
      tags: ['fonts', 'embedding', 'consistency', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_FONT_OPTIMIZE_TEXT',
      title: 'Font Handling: Optimize Text',
      description:
        'Optimizes text with proper line heights and character spacing for PDF.',
      promptText: `Optimize text for PDF output with proper line heights and character spacing.`,
      tags: ['typography', 'spacing', 'readability', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_FONT_SIZE_READABILITY',
      title: 'Font Handling: Ensure Readability',
      description:
        'Ensures proper font sizing (min 10pt body text) for print readability.',
      promptText: `Ensure proper font sizing for headability in print format (minimum 10pt for body text).`,
      tags: ['fonts', 'size', 'readability', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    {
      id: 'PDF_METADATA',
      title: 'Include PDF Metadata',
      description:
        'Includes document metadata (title, author, subject) for PDF cataloging.',
      promptText: `Include proper document metadata (title, author, subject) for PDF cataloging.`,
      tags: ['metadata', 'seo', 'cataloging', 'html2pdf'],
      category: 'PDF Generation (from HTML)',
    },
    // --- Excel Report Generation ---
    {
      id: 'EXCEL_TEMPLATE_GENERATOR',
      title: 'Generate Excel Report Template',
      description:
        'Generates an HTML template specifically designed for conversion to an Excel spreadsheet, based on user requirements and technical specifications.',
      promptText: `# Excel "HTML-based" Report Template Generator

## Report Requirements

### Overview

_Describe your report purpose, e.g., "Create a monthly employee payslip that clearly shows earnings and deductions"._

### Structure and Layout

List the main sections your report needs, e.g.:

- Company header with name and address
- Employee information section
- Earnings and deductions table
- Summary totals and net pay
- Signature area

### Visual Design

#### Color Scheme:

- **Main color**: [e.g., dark blue] for headers
- **Accent color**: [e.g., light blue] for subtotals

#### Typography:

- **Font family**: [e.g., Arial, sans-serif]
- **Text size preferences**: [e.g., regular 11pt for data, bold 12pt for headings]

### Content Requirements

Specify the data fields needed, using ReportBurster variable format where applicable:

#### Employee Information:

- Employee Name: \${col0}
- Employee ID: \${col1}
- Social Security #: \${col2}
- Department: \${col4}
- Position/Grade: \${col5}

#### Earnings and Deductions:

- Basic Salary: \${col6}
- Tax Deductions: \${col7}
- Net Pay: \${col16}

## Generate HTML that produces an Excel report based on the requirements above and the technical specifications below.

Your response must include:

1. Complete HTML code with all required elements - do not provide partial code snippets
2. All CSS styles must be included inline within the document head - no external CSS file references
3. The HTML code should be fully self-contained and ready to use without any additional dependencies
4. Include all necessary data attributes for Excel export functionality as specified in the technical documentation
5. Ensure the code follows best practices for Excel export compatibility

Please provide the entire HTML document in a single code block.

---

**TECHNICAL DOCUMENTATION - DO NOT MODIFY BELOW THIS LINE**

# ReportBurster Excel Exporter

ReportBurster transforms CSS styled HTML into Excel spreadsheets with robust formatting and features.

## Overview

ReportBurster allows you to generate professional Excel spreadsheets from HTML content, maintaining styling, formulas, and other Excel-specific features.
The main advantage is the ability to use familiar HTML/CSS for report generation, combined with a good templating engine for producing high-quality Excel output.

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

ReportBurster maps CSS styles to corresponding Excel formatting. The following CSS properties are supported:

- **Font:** \`font-family\`, \`font-size\`, \`font-weight\`, \`font-style\`, \`text-decoration\`
- **Alignment:** \`text-align\`, \`vertical-align\`
- **Colors:** \`color\`, \`background-color\`
- **Borders:** All border properties including color, style, and width

**CSS Notes:**

- Colors can be specified as literals (e.g., \`red\`, \`black\`) or hex values (must use long format: \`#ff0000\` not \`#f00\`)
- Border widths must be specified as \`thin\`, \`medium\`, or \`thick\`
- Supported border styles: \`solid\`, \`dotted\`, \`dashed\`, \`double\` (widths apply only to \`solid\` style)

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
- Certain Excel features might not be available through the HTML interface`,
      tags: ['excel', 'template', 'conversion'],
      category: 'Excel Report Generation',
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

<BUSINESS_REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE QUESTION OR INSTRUCTION FOR THE SQL QUERY HERE]
</BUSINESS_REQUIREMENT>

Relevant Database Schema Subset:

\`\`\`json
[INSERT THE JSON REPRESENTATION OF THE RELEVANT TABLE SUBSET HERE]
\`\`\`

This JSON object contains an array of table definitions. Each table object details its name, columns (with data types), primary keys, and foreign keys. 
You MUST use only the tables and columns present in this provided schema subset. Do not infer the existence of other tables or columns.

**YOUR TASK:**

* Analyze Request & Schema: Carefully understand the user's natural language request and examine the provided table structures, column names, data types, and relationships (primary/foreign keys) within the given schema subset.
* Formulate SQL Query: Construct a single, valid SQL query that directly addresses the user's request using the provided schema information.
* Prioritize Accuracy: Ensure the query correctly retrieves or manipulates the data as per the user's intent.
* Consider Efficiency: Where possible, write an efficient query, but correctness is paramount.
* Adhere to Schema: The query must strictly use table and column names as they appear in the provided schema subset. Do not invent or assume table/column names.
* Standard SQL: Generate a query using standard SQL syntax that is generally compatible with common relational database systems (e.g., PostgreSQL, MySQL, SQL Server, Oracle). 
If the request implies a specific SQL dialect feature not universally available, make a reasonable judgment or use a common alternative.

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

\`\`\`sql
-- Paste your SQL query here
\`\`\`

Please provide:
1. An optimized version of the query
2. Explanation of performance issues in the original query
3. The reasoning behind each optimization
4. Suggestions for adding appropriate indexes`,
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

<BUSINESS_REQUIREMENT>
[INSERT USER'S NATURAL LANGUAGE QUESTION OR INSTRUCTION FOR THE SQL QUERY HERE]
</BUSINESS_REQUIREMENT>

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

<BUSINESS_REQUIREMENT>
[USER: PASTE YOUR PLAIN ENGLISH BUSINESS REQUIREMENT HERE]
</BUSINESS_REQUIREMENT>

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
    // --- Vanna.AI ---
    {
      id: 'VANNA-AI-TRAINING-PLAN',
      title: 'Generate Vanna.AI Training Plan',
      description:
        'Generates a comprehensive Python script for a Vanna.AI training plan based on provided database context.',
      promptText: `You are an expert Vanna.AI consultant. Your primary goal is to generate a comprehensive, effective, and well-structured Vanna.AI Training Plan based on the provided database context. The output must be a single, clean, and ready-to-use Python script that can be easily executed in a Jupyter Notebook.

Adhere strictly to Vanna.AI's documented best practices to ensure the highest possible accuracy for the resulting RAG model.

**Vanna.AI Core Principles to Follow:**
1.  **Primacy of Training Data:** The quality of the training data is the single most important factor for accuracy.
2.  **Value of Question-SQL Pairs:** Prioritize generating high-quality, descriptive questions for every SQL query. This provides invaluable context.
3.  **Specificity over Generality:** You MUST NOT use \`SELECT * FROM table\`. All SQL statements, whether from existing reports or AI-generated, must explicitly list the column names (e.g., \`SELECT id, name, email FROM my_table\`). This is non-negotiable.
4.  **Bite-Sized Chunks:** Break down all provided information (DDL, documentation, etc.) into logical, bite-sized chunks. Each piece of information should be a separate \`train()\` call within the plan.
5.  **Comprehensive Context:** Leverage all available information (Schema, Domain Groupings, ER Diagrams, Ubiquitous Language, existing SQL) to create a rich, interconnected context.

**Your Task:**
Generate a Python script that defines a \`TrainingPlan\` object. Populate this plan by processing the database information provided in the placeholders below. If a placeholder is empty or not provided, simply omit that section from the training plan.

**Input Database Context:**

*   **Database Type:** \`[Specify Database Type, e.g., PostgreSQL, SQL Server, MySQL]\`
*   **Plain DB Schema (JSON):**
    \`\`\`json
    [VANNA TRAINING DB SCHEMA]
    \`\`\`
*   **Domain-Grouped Schema (Plain Text):**
    \`\`\`text
    [VANNA TRAINING DOMAIN GROUPED SCHEMA]
    \`\`\`
*   **ER Diagram (PlantUML):**
    \`\`\`plantuml
    [VANNA TRAINING ER DIAGRAM]
    \`\`\`
*   **Ubiquitous Language (Markdown):**
    \`\`\`markdown
    [VANNA TRAINING UBIQUITOUS LANGUAGE]
    \`\`\`
*   **Existing SQL Queries (Optional):**
    \`\`\`sql
    [VANNA TRAINING EXISTING SQL QUERIES]
    \`\`\`

---

**LLM INSTRUCTION: BEGIN Vanna.AI Training Plan Generation**

Based on the context and rules above, generate the Python \`TrainingPlan\` now.

**Python Script Structure Requirements:**
*   The script must be structured for easy use in a Jupyter Notebook. Use comments like \`# %%\` to delineate logical cells that a user can run step-by-step.
*   At the very beginning of the script, include a commented-out code block for resetting the training data. This block must have clear comments explaining to the user when they should (e.g., starting fresh, major schema changes) and should not (e.g., incrementally adding new data) uncomment and run it.
*   Add comments before each major step (e.g., "Step 1: Add DDL Statements", "Step 2: Add Documentation") to guide the user.

**Methodology:**

1.  **DDL Statements (from JSON Schema):** The \`Plain DB Schema\` is provided as JSON. Parse this JSON. For each table object, generate a synthetic \`CREATE TABLE\` DDL statement. Include all columns with their data types. Add this synthetic DDL statement to the plan using \`plan.add_ddl(ddl=...)\`.

2.  **Documentation - Ubiquitous Language:** For the \`Ubiquitous Language\` markdown, break it down into logical paragraphs or sections. For each chunk, add a \`plan.add_documentation(documentation=...)\` entry.

3.  **Documentation - Domain-Grouped Schema:** The \`Domain-Grouped Schema\` is provided as pre-processed plain text. Add each line (e.g., "The 'Sales' domain includes tables: Orders, Customers") as a separate documentation entry using \`plan.add_documentation(documentation=...)\`.

4.  **Documentation - ER Diagram:** If \`ER Diagram\` PlantUML is provided, add it as a single documentation entry. Add a comment explaining that this text describes the entity relationships in PlantUML format. Use \`plan.add_documentation(documentation=...)\`.

5.  **Question-SQL Pairs from Existing Queries:** If \`Existing SQL Queries\` are provided, perform the following for each query:
    *   Add the original query using \`plan.add_sql(sql=...)\`.
    *   Generate 3-5 high-quality, natural language questions that a business user might ask to get the result of that specific SQL query.
    *   For each generated question, create a \`plan.add_question_sql(question=..., sql=...)\` entry.

6.  **AI-Generated Question-SQL Pairs (Critical Task):** This is the most important step. You must **proactively generate a new, diverse set of 10-15 high-quality Question-SQL pairs from scratch.**
    *   **Analyze** all the provided context: the schema, the domains, the ubiquitous language, and the ER diagram.
    *   **Synthesize** what a business user would want to know from this database. Think about common business questions: "What are the top 5 ...?", "Show me the total ... by month.", "Who are the customers that ...?", "List all products in the ... category."
    *   **Formulate** SQL queries that answer these business questions. The queries should be realistic, using joins, aggregations, and filtering where appropriate. **You MUST NOT use \`SELECT *\`.**
    *   For each SQL query you create, write a clear, corresponding natural language question.
    *   Add each of these newly generated pairs to the plan using \`plan.add_question_sql(question=..., sql=...)\`.

The final output must be a single Python code block, starting with the necessary imports and following all structuring and methodological rules. Do not include any text or explanation outside of the Python code block.`,
      tags: ['vanna', 'ai', 'training', 'rag', 'python'],
      category: 'Vanna.AI',
    },
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
