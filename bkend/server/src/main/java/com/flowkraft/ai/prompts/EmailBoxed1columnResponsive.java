package com.flowkraft.ai.prompts;

import java.util.List;

public final class EmailBoxed1columnResponsive {

    private EmailBoxed1columnResponsive() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "EMAIL_BOXED_1COLUMN_RESPONSIVE",
            "A fundamental, single-column responsive template with a boxed layout",
            "A fundamental, single-column responsive template with a boxed layout",
            List.of("email-template-responsive", "one-column"),
            "Email Templates (Responsive)",
            """
You are an expert front-end developer specializing in creating bulletproof, responsive HTML emails that are fully compatible with all major email clients, \
including Outlook (all versions), Gmail, Apple Mail, and Office 365.

Your task is to generate the complete HTML and CSS for a responsive email template. This template should be a modern interpretation of a classic, \
industry-standard email blueprint that features a **fundamental, single-column responsive template with a boxed layout**.

**Core Requirements:**

1.  **Layout:**
    *   A centered, **boxed layout** with a maximum width of 600px.
    *   The email body background (outside the 600px box) should be a light gray (`#f4f4f4`).
    *   The main content box should have a white background (`#ffffff`).

2.  **Structure:**
    *   A **single-column layout** throughout.
    *   Include sections for a preheader, a main header (for a logo), a main content area for a headline, body text, and a call-to-action button, and a footer section.

3.  **Responsiveness:**
    *   The template must be fully responsive using **CSS media queries**.
    *   The layout should scale fluidly to fit the screen width on mobile devices.

**Technical Implementation Details:**

*   **Tables for Layout:** Use `<table>` elements for the entire structure to ensure maximum compatibility. Set `role="presentation"`, `cellpadding="0"`, `cellspacing="0"`, and `border="0"` on all layout tables.
*   **Inline CSS:** All critical presentation styles (colors, fonts, padding, borders) must be inlined on the HTML elements to work in clients like Gmail.
*   **`<style>` Block:** Use a `<style>` block in the `<head>` for:
    *   Responsive styles inside an `@media (max-width: 600px)` block.
    *   Class-based styles and link styling (`a:hover`, etc.) for clients that support it.
*   **Outlook Compatibility:** Use `<!--[if mso]> ... <![endif]-->` conditional comments where necessary to ensure proper rendering in Outlook.
*   **Content Placeholders:** Use clear, descriptive placeholders for all content, such as `[LOGO_URL]`, `[HEADLINE_TEXT]`, `[MAIN_CONTENT_PARAGRAPH]`, `[CTA_BUTTON_LINK]`, and `[UNSUBSCRIBE_LINK]`.
*   **Accessibility:** Ensure all `<img>` tags have descriptive `alt` text.

Provide the complete, ready-to-use HTML file in a single code block."""
        );
    }
}
