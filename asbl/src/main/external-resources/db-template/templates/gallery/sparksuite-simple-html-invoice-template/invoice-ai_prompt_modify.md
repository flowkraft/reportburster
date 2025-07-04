You are an HTML customization assistant. Your task is to take the **Customization instructions** provided below and apply them to the **Reference HTML template**. Generate the updated HTML code based on the instructions.

**Customization Instructions**

1. Change the title in the head element from "A simple, clean, and responsive HTML invoice template" to "Professional Services Invoice"
2. Update the invoice number from "123" to "INV-2024-056"
3. Change the created date from "January 1, 2023" to "May 25, 2024"
4. Update the due date from "February 1, 2023" to "June 25, 2024"
5. Change the company information from "Sparksuite, Inc." to "Horizon Consulting LLC" with address "789 Business Avenue, Suite 300, Seattle, WA 98101"
6. Update the client information from "Acme Corp., John Doe" to "Global Innovations Inc., Sarah Johnson" with email "sarah.j@globalinnovations.com"
7. Change the payment method from "Check" to "Bank Transfer" and the check number from "1000" to "Reference: GLOB2024"
8. Update the line items:
   - Change "Website design" at "$300.00" to "Strategic Business Consultation" at "$1,200.00"
   - Change "Hosting (3 months)" at "$75.00" to "Market Analysis Report" at "$850.00"
   - Change "Domain name (1 year)" at "$10.00" to "Implementation Planning" at "$650.00"
9. Update the total amount from "$385.00" to "$2,700.00" to reflect the new line items
10. Change the heading background color from "#eee" to a light blue color "#e6f2ff"

**Reference HTML Template**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title>A simple, clean, and responsive HTML invoice template</title>

    <!-- Favicon -->
    <link rel="icon" href="./images/favicon.png" type="image/x-icon" />

    <!-- Invoice styling -->
    <style>
      body {
        font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif;
        text-align: center;
        color: #777;
      }

      body h1 {
        font-weight: 300;
        margin-bottom: 0px;
        padding-bottom: 0px;
        color: #000;
      }

      body h3 {
        font-weight: 300;
        margin-top: 10px;
        margin-bottom: 20px;
        font-style: italic;
        color: #555;
      }

      body a {
        color: #06f;
      }

      .invoice-box {
        max-width: 800px;
        margin: auto;
        padding: 30px;
        border: 1px solid #eee;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        font-size: 16px;
        line-height: 24px;
        font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif;
        color: #555;
      }

      .invoice-box table {
        width: 100%;
        line-height: inherit;
        text-align: left;
        border-collapse: collapse;
      }

      .invoice-box table td {
        padding: 5px;
        vertical-align: top;
      }

      .invoice-box table tr td:nth-child(2) {
        text-align: right;
      }

      .invoice-box table tr.top table td {
        padding-bottom: 20px;
      }

      .invoice-box table tr.top table td.title {
        font-size: 45px;
        line-height: 45px;
        color: #333;
      }

      .invoice-box table tr.information table td {
        padding-bottom: 40px;
      }

      .invoice-box table tr.heading td {
        background: #eee;
        border-bottom: 1px solid #ddd;
        font-weight: bold;
      }

      .invoice-box table tr.details td {
        padding-bottom: 20px;
      }

      .invoice-box table tr.item td {
        border-bottom: 1px solid #eee;
      }

      .invoice-box table tr.item.last td {
        border-bottom: none;
      }

      .invoice-box table tr.total td:nth-child(2) {
        border-top: 2px solid #eee;
        font-weight: bold;
      }

      @media only screen and (max-width: 600px) {
        .invoice-box table tr.top table td {
          width: 100%;
          display: block;
          text-align: center;
        }

        .invoice-box table tr.information table td {
          width: 100%;
          display: block;
          text-align: center;
        }
      }
    </style>
  </head>

  <body>
    <div class="invoice-box">
      <table>
        <tr class="top">
          <td colspan="2">
            <table>
              <tr>
                <td class="title">
                  <img src="logo.png" alt="Company logo" style="width: 100%; max-width: 300px" />
                </td>

                <td>
                  Invoice #: 123<br />
                  Created: January 1, 2023<br />
                  Due: February 1, 2023
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr class="information">
          <td colspan="2">
            <table>
              <tr>
                <td>
                  Sparksuite, Inc.<br />
                  12345 Sunny Road<br />
                  Sunnyville, TX 12345
                </td>

                <td>
                  Acme Corp.<br />
                  John Doe<br />
                  john@example.com
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr class="heading">
          <td>Payment Method</td>

          <td>Check #</td>
        </tr>

        <tr class="details">
          <td>Check</td>

          <td>1000</td>
        </tr>

        <tr class="heading">
          <td>Item</td>

          <td>Price</td>
        </tr>

        <tr class="item">
          <td>Website design</td>

          <td>$300.00</td>
        </tr>

        <tr class="item">
          <td>Hosting (3 months)</td>

          <td>$75.00</td>
        </tr>

        <tr class="item last">
          <td>Domain name (1 year)</td>

          <td>$10.00</td>
        </tr>

        <tr class="total">
          <td></td>

          <td>Total: $385.00</td>
        </tr>
      </table>
    </div>
  </body>
</html>
```

Output only the complete updated HTML template with the applied changes.
