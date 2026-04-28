package com.flowkraft.ai.prompts;

import java.util.List;

public final class EmailBoxed2columnImageResponsive {

    private EmailBoxed2columnImageResponsive() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "EMAIL_BOXED_2COLUMN_IMAGE_RESPONSIVE",
            "A responsive two-column template with a boxed layout that includes a body image",
            "A responsive two-column template with a boxed layout that includes a body image",
            List.of("email-template-responsive", "two-column", "email-image"),
            "Email Templates (Responsive)",
            """
You are an expert front-end developer specializing in creating bulletproof, responsive HTML emails that are fully compatible with all major email clients in 2025, including Outlook (all versions), Gmail, Apple Mail, and Office 365.

Your task is to generate the complete HTML and CSS for a responsive email template. This template should be a modern interpretation of a classic, industry-standard email blueprint that features a **boxed layout, a prominent body image, and a two-column content section**.

**Core Requirements:**

1.  **Layout:**
    *   A centered, **boxed layout** with a maximum width of 600px.
    *   The email body background (outside the 600px box) should be a light gray (`#f4f4f4`).
    *   The main content box should have a white background (`#ffffff`).

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

*   **Tables for Layout:** Use `<table>` elements for the entire structure to ensure maximum compatibility. Set `role="presentation"`, `cellpadding="0"`, `cellspacing="0"`, and `border="0"` on all layout tables.
*   **Inline CSS:** All critical presentation styles (colors, fonts, padding, borders) must be inlined on the HTML elements to work in clients like Gmail.
*   **`<style>` Block:** Use a `<style>` block in the `<head>` for:
    *   Responsive styles inside an `@media (max-width: 600px)` block, including fluid image styles.
    *   Class-based styles and link styling (`a:hover`, etc.) for clients that support them.
*   **Outlook Compatibility:** Use `<!--[if mso]> ... <![endif]-->` conditional comments (ghost tables) to wrap the two-column section and ensure Outlook renders it correctly without extra spacing.
*   **Content Placeholders:** Use clear, descriptive placeholders for all content, such as `[LOGO_URL]`, `[HERO_IMAGE_URL]`, `[HEADLINE_TEXT]`, `[MAIN_CONTENT_PARAGRAPH]`, `[CTA_BUTTON_LINK]`, and `[UNSUBSCRIBE_LINK]`.
*   **Accessibility:** Ensure all `<img>` tags have descriptive `alt` text.

Provide the complete, ready-to-use HTML file in a single code block."""
        );
    }
}
