package com.flowkraft.ai.prompts;

import java.util.List;

public final class EmailPayslipNotification {

    private EmailPayslipNotification() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "EMAIL_PAYSLIP_NOTIFICATION",
            "Payslip Notification Email",
            "Email template to notify employees about new payslips",
            List.of("email-template", "payslip", "notification", "employee"),
            "Email Templates",
            """
Create a professional email template for notifying employees that their new payslip is available. The template should:

1. Have a clear subject line indicating this is a payslip notification
2. Include placeholders for personalization (employee name, payroll period)
3. Provide brief instructions on how to access and view the payslip
4. Include any necessary security reminders about protecting sensitive information
5. Contain appropriate professional sign-off from the HR/Payroll department
6. Use a clean, professional layout with minimal formatting (suitable for email clients)

Please provide the complete email template with HTML formatting and inline CSS."""
        );
    }
}
