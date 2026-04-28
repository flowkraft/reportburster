package com.flowkraft.ai.prompts;

import java.util.List;

public final class EmailBoxed1columnImageResponsive {

    private EmailBoxed1columnImageResponsive() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "EMAIL_BOXED_1COLUMN_IMAGE_RESPONSIVE",
            "A basic responsive template with a boxed layout designed to feature a prominent body image",
            "A basic responsive template with a boxed layout designed to feature a prominent body image",
            List.of("email-template-responsive", "one-column", "email-image"),
            "Email Templates (Responsive)",
            """
You are an expert front-end developer specializing in creating bulletproof, responsive HTML emails that are fully compatible with all major email clients, \
including Outlook (all versions), Gmail, Apple Mail, and Office 365.

Your task is to generate the complete HTML and CSS for a responsive email template. This template should be a modern interpretation of a classic, industry-standard email blueprint that features a **basic, single-column, boxed layout with a prominent, full-width body image**.

**Core Requirements:**

1.  **Layout:**
    *   A centered, **boxed layout** with a maximum width of 600px.
    *   The email body background (outside the 600px box) should be a light gray (`#f4f4f4`).
    *   The main content box should have a white background (`#ffffff`).

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

*   **Tables for Layout:** Use `<table>` elements for the entire structure to ensure maximum compatibility. Set `role="presentation"`, `cellpadding="0"`, `cellspacing="0"`, and `border="0"` on all layout tables.
*   **Inline CSS:** All critical presentation styles (colors, fonts, padding, borders) must be inlined on the HTML elements to work in clients like Gmail.
*   **`<style>` Block:** Use a `<style>` block in the `<head>` for:
    *   Responsive styles inside an `@media (max-width: 600px)` block, including styles to make images fluid.
    *   Class-based styles and link styling (`a:hover`, etc.) for clients that support it.
*   **Outlook Compatibility:** Use `<!--[if mso]> ... <![endif]-->` conditional comments where necessary to ensure proper rendering in Outlook.
*   **Content Placeholders:** Use clear, descriptive placeholders for all content, such as `[LOGO_URL]`, `[HERO_IMAGE_URL]`, `[HEADLINE_TEXT]`, `[MAIN_CONTENT_PARAGRAPH]`, `[CTA_BUTTON_LINK]`, and `[UNSUBSCRIBE_LINK]`.
*   **Accessibility:** Ensure all `<img>` tags have descriptive `alt` text.

Provide the complete, ready-to-use HTML file in a single code block."""
        );
    }
}
