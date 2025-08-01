You are an HTML customization assistant. Your task is to take the **Customization instructions** provided below and apply them to the **Reference HTML template**. Generate the updated HTML code based on the instructions.

**Customization Instructions**

1. Change the title in the head element from "Invoice Template" to "Professional Services Invoice"
2. Update the client company name from "Google Inc." to "TechNova Solutions"
3. Change the client address to "425 Innovation Drive, Suite 300, Silicon Valley, CA 94025, USA"
4. Update the reference description to "Full-stack Web Application Development & Deployment"
5. Change the invoice date from "06 September 2017" to "May 15, 2024"
6. Update the company name from "Acme LLP" to "Zenith Digital Consulting"
7. Change the company address to "100 Business Boulevard, Suite 500, Austin, TX 78701, USA"
8. Update the invoice number from "BJI 009872" to "ZDC-2024-0127"
9. Replace the line items with:
   - 1 "Project requirements analysis" for "$2000"
   - 1 "Frontend development" for "$4500"
   - 1 "Backend API integration" for "$6000"
10. Update the total amount to "$12500" to reflect the new line items
11. Modify the terms to:

- "Payment due within 15 days of invoice date"
- "Late payments subject to 2% monthly fee"

12. Change the bottom bar color from "#323149" to "#2a7d8c"
13. Update the contact information in the footer to display "zenithdigital.com", "info@zenithdigital.com", and "+1 (512) 555-9876"

**Reference HTML Template**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice Template</title>
    <style>
      /* Base styles */
      body {
        font-family: "Montserrat", Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        box-sizing: border-box;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        margin-right: -15px;
        margin-left: -15px;
      }
      .col-xs-12 {
        width: 100%;
        padding: 0 15px;
        box-sizing: border-box;
      }
      .col-sm-6,
      .col-sm-3,
      .col-sm-4,
      .col-sm-9 {
        padding: 0 15px;
        box-sizing: border-box;
      }
      @media (min-width: 768px) {
        .col-sm-3 {
          width: 25%;
        }
        .col-sm-4 {
          width: 33.33%;
        }
        .col-sm-6 {
          width: 50%;
        }
        .col-sm-9 {
          width: 75%;
        }
      }
      @media (min-width: 992px) {
        .col-md-3 {
          width: 25%;
        }
        .col-md-8 {
          width: 66.66%;
        }
        .col-md-offset-1 {
          margin-left: 8.33%;
        }
      }
      .clearfix {
        clear: both;
        display: table;
        content: "";
      }
      .text-left {
        text-align: left;
      }
      .text-center {
        text-align: center;
      }
      .text-right {
        text-align: right;
      }
      .pull-right {
        float: right;
      }
      .img-responsive {
        max-width: 100%;
        height: auto;
        display: block;
      }

      /* Invoice styles */
      .invoice-wrapper {
        margin: 20px auto;
        max-width: 700px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
        background-color: #fff;
      }
      .invoice-top {
        background-color: #fafafa;
        padding: 40px 60px;
      }
      .invoice-top-left {
        margin-top: 60px;
      }
      .invoice-top-left h2,
      .invoice-top-left h6 {
        line-height: 1.5;
      }
      .invoice-top-left h4 {
        margin-top: 30px;
      }
      .invoice-top-left h5 {
        line-height: 1.4;
        font-weight: 400;
      }
      .client-company-name {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 0;
      }
      .client-address {
        font-size: 14px;
        margin-top: 5px;
        color: rgba(0, 0, 0, 0.75);
      }
      .invoice-top-right h2,
      .invoice-top-right h6 {
        text-align: right;
        line-height: 1.5;
      }
      .invoice-top-right h5 {
        line-height: 1.4;
        font-weight: 400;
        text-align: right;
        margin-top: 0;
      }
      .our-company-name {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 0;
      }
      .our-address {
        font-size: 13px;
        margin-top: 0;
        color: rgba(0, 0, 0, 0.75);
      }
      .logo-wrapper {
        overflow: auto;
      }
      .logo {
        max-height: 80px;
        margin-bottom: 20px;
      }
      .invoice-bottom {
        background-color: #ffffff;
        padding: 40px 60px;
        position: relative;
      }
      .title {
        font-size: 30px;
        font-weight: 600;
        margin-bottom: 30px;
      }
      .invoice-bottom-left h4 {
        font-weight: 400;
      }
      .terms {
        font-size: 14px;
        margin-top: 40px;
      }
      .divider {
        margin-top: 50px;
        margin-bottom: 5px;
        border: 0;
        border-top: 1px solid #eee;
      }
      .bottom-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 26px;
        background-color: #323149;
      }

      /* Table styles */
      .table {
        width: 100%;
        max-width: 100%;
        margin-bottom: 20px;
        border-collapse: collapse;
      }
      .table th,
      .table td {
        padding: 8px;
        line-height: 1.42857143;
        vertical-align: top;
        text-align: left;
      }
      .table thead th {
        vertical-align: bottom;
        border-bottom: 2px solid #ddd;
        font-weight: 600;
      }
      .table tbody tr td {
        border-bottom: 1px solid #f3f3f3;
      }
      .table tbody tr:last-child td {
        border-bottom: none;
      }
    </style>
  </head>
  <body>
    <section class="back">
      <div class="container">
        <div class="row">
          <div class="col-xs-12">
            <div class="invoice-wrapper">
              <div class="invoice-top">
                <div class="row">
                  <div class="col-sm-6">
                    <div class="invoice-top-left">
                      <h2 class="client-company-name">Google Inc.</h2>
                      <h6 class="client-address">
                        31 Lake Floyd Circle, <br />Delaware, AC 987869
                        <br />United States
                      </h6>
                      <h4>Reference</h4>
                      <h5>
                        UX Design &amp; Development for <br />
                        Android App.
                      </h5>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="invoice-top-right">
                      <h2 class="our-company-name">Acme LLP</h2>
                      <h6 class="our-address">
                        477 Blackwell Street, <br />Dry Creek, Alaska
                        <br />United States
                      </h6>
                      <div class="logo-wrapper">
                        <img
                          src="./acme.png"
                          class="img-responsive pull-right logo"
                        />
                      </div>
                      <h5>06 September 2017</h5>
                    </div>
                  </div>
                </div>
              </div>
              <div class="invoice-bottom">
                <div class="row">
                  <div class="col-xs-12">
                    <h2 class="title">Invoice</h2>
                  </div>
                  <div class="clearfix"></div>

                  <div class="col-sm-3 col-md-3">
                    <div class="invoice-bottom-left">
                      <h5>Invoice No.</h5>
                      <h4>BJI 009872</h4>
                    </div>
                  </div>
                  <div class="col-md-offset-1 col-md-8 col-sm-9">
                    <div class="invoice-bottom-right">
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Qty</th>
                            <th>Description</th>
                            <th>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td>Initial research</td>
                            <td>$1000</td>
                          </tr>
                          <tr>
                            <td>1</td>
                            <td>UX design</td>
                            <td>$3500</td>
                          </tr>
                          <tr>
                            <td>1</td>
                            <td>Web app development</td>
                            <td>$5000</td>
                          </tr>
                          <tr style="height: 40px;"></tr>
                        </tbody>
                        <thead>
                          <tr>
                            <th>Total</th>
                            <th></th>
                            <th>$9500</th>
                          </tr>
                        </thead>
                      </table>
                      <h4 class="terms">Terms</h4>
                      <ul>
                        <li>Invoice to be paid in advance.</li>
                        <li>Make payment in 2,3 business days.</li>
                      </ul>
                    </div>
                  </div>
                  <div class="clearfix"></div>
                  <div class="col-xs-12">
                    <hr class="divider" />
                  </div>
                  <div class="col-sm-4">
                    <h6 class="text-left">acme.com</h6>
                  </div>
                  <div class="col-sm-4">
                    <h6 class="text-center">contact@acme.com</h6>
                  </div>
                  <div class="col-sm-4">
                    <h6 class="text-right">+91 8097678988</h6>
                  </div>
                </div>
                <div class="bottom-bar"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </body>
</html>
```

Output only the complete updated HTML template with the applied changes.
