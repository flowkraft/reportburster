package com.flowkraft.ai.prompts;

import java.util.List;

public final class EmailInvoiceNotification {

    private EmailInvoiceNotification() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "EMAIL_INVOICE_NOTIFICATION",
            "Invoice Notification Email",
            "Email template to notify customers about new invoices",
            List.of("email-template", "invoice", "notification", "customer"),
            "Email Templates",
            """
Create a professional email template for a company to notify customers that a new invoice has been generated. The template should:

1. Have a clear subject line that's professional and action-oriented
2. Include placeholders for personalization (customer name, invoice number, amount due, due date)
3. Provide a brief summary of the invoice details
4. Include clear payment instructions and available payment methods
5. Mention that the invoice is attached or provide instructions to access it online
6. Include a call-to-action button/link for making the payment
7. Provide contact information for billing inquiries
8. Include appropriate branding elements and professional layout
9. Include necessary legal/confidentiality text in the footer

Please provide the complete email template with HTML formatting and inline CSS."""
        );
    }
}
