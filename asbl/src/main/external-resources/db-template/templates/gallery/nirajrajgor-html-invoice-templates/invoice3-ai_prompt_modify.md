You are an HTML customization assistant. Your task is to take the **Customization instructions** provided below and apply them to the **Reference HTML template**. Generate the updated HTML code based on the instructions.

**Customization Instructions**

1. Change the title in the head element from "Invoice3" to "Professional Services Invoice"
2. Update the company name from "ACME Design Co." to "Quantum Creative Solutions"
3. Change the invoice description from "Web design for Airbnb homepage" to "Brand Identity Development for TechForward Inc."
4. Update the invoice number from "#378928" to "#QCS-2024-156"
5. Change the invoice date from "Sep 6th, 2017" to "May 22, 2024"
6. Change the banner background color from "#9575CD" (purple) to "#34A853" (green)
7. Update the service items:
   - First item: Change "Web Design and UI" to "Brand Strategy Development" with description "Research, positioning, and brand guidelines" and price "$3500"
   - Second item: Change "Website Maintenance" to "Logo and Visual Identity" with description "Logo design, color palette, typography and usage guidelines" and price "$4000" (remove "Recurring Price" note)
8. Update the totals: subtotal to "$7500", discount to "-$500", and total due to "$7000"
9. Change the client information from "Airbnb Co." to "TechForward Inc." with address "350 Innovation Drive, Suite 400, Palo Alto, CA 94301, United States, contact@techforward.com"
10. Update the company information to "Quantum Creative Solutions" with address "75 Design Avenue, Portland, OR 97204, United States, projects@quantumcreative.com"
11. Modify the note text to "Payment due within 30 days. Please include the invoice number in your payment reference."
12. Change the payment button background color from "#2196F3" (blue) to "#34A853" (green to match the banner) and text from "PAY NOW" to "MAKE PAYMENT"

**Reference HTML Template**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice3</title>
    <style>
      body {
        font-family: "Montserrat", sans-serif;
        margin: 0;
        padding: 0;
        background: #f5f5f5;
        line-height: 1.42857143;
      }

      .container {
        width: 100%;
        max-width: 1170px;
        margin: 0 auto;
        padding: 0 15px;
        box-sizing: border-box;
      }

      .row {
        margin: 0 -15px;
        display: flex;
        flex-wrap: wrap;
      }

      .row:after {
        content: "";
        display: table;
        clear: both;
      }

      [class*="col-"] {
        float: left;
        padding: 0 15px;
        box-sizing: border-box;
      }

      .col-xs-12 {
        width: 100%;
      }
      .col-xs-8 {
        width: 66.66666667%;
      }
      .col-xs-4 {
        width: 33.33333333%;
      }

      @media (min-width: 768px) {
        .col-sm-10 {
          width: 83.33333333%;
        }
        .col-sm-9 {
          width: 75%;
        }
        .col-sm-8 {
          width: 66.66666667%;
        }
        .col-sm-6 {
          width: 50%;
        }
        .col-sm-4 {
          width: 33.33333333%;
        }
        .col-sm-3 {
          width: 25%;
        }
        .col-sm-2 {
          width: 16.66666667%;
        }
      }

      @media (min-width: 992px) {
        .col-md-5 {
          width: 41.66666667%;
        }
        .col-md-3 {
          width: 25%;
        }
        .col-md-offset-1 {
          margin-left: 8.33333333%;
        }
      }

      .bg-color {
        background: #9575cd;
        position: absolute;
        height: 330px;
        top: 0;
        left: 0;
        right: 0;
      }

      .invoice-wrapper {
        margin: 100px auto 30px;
        max-width: 700px;
        background: #fff;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
        position: relative;
      }

      .invoice-top {
        background: #f5f5f5;
        padding: 40px;
        height: 230px;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
      }

      .invoice-top-left {
        float: left;
        width: 50%;
      }

      .invoice-top-left .logo {
        width: 190px;
        height: auto;
        margin-bottom: 20px;
        display: block;
      }

      .invoice-top-left h1 {
        font-size: 24px;
        letter-spacing: 1.5px;
        margin: 0;
        line-height: 1.2;
        font-weight: 500;
      }

      .invoice-top-left h5 {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.3);
        margin: 10px 0 0;
        font-weight: normal;
      }

      .invoice-top-right {
        float: right;
        width: 40%;
        text-align: right;
      }

      .invoice-top-right h4 {
        font-size: 20px;
        margin: 0;
        font-weight: 500;
      }

      .invoice-top-right h6 {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.3);
        margin: 15px 0 0;
        font-weight: normal;
      }

      .invoice-top-right h3 {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.3);
        margin: 15px 0 0;
        font-weight: normal;
      }

      .invoice-top-right .amount {
        color: rgba(0, 200, 83, 0.95);
        font-size: 16px;
        margin: 40px 0 0;
        font-weight: 500;
      }

      .invoice-bottom {
        background: #fff;
        padding: 30px 40px;
      }

      .service-title {
        font-size: 18px;
        margin: 0 0 5px;
        font-weight: 500;
      }

      .service-subtitle {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.7);
        margin: 0;
        font-weight: 400;
      }

      .service-price {
        font-size: 16px;
        color: rgba(0, 200, 83, 0.55);
        margin: 15px 0 0;
        text-align: right;
        display: block;
      }

      .price-info {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.3);
        margin: 5px 0 0;
        text-align: right;
        display: block;
      }

      hr {
        margin: 20px 0;
        border: 0;
        border-top: 1px solid #eee;
      }

      .totals-row {
        margin-top: 25px;
      }

      .totals-row > div {
        padding-right: 0;
      }

      .sub-total,
      .discount,
      .total-due {
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.4);
        font-size: 13px;
        text-align: right;
        margin: 0;
      }

      .sub-total-price,
      .discount-price,
      .total-due-price {
        font-size: 16px;
        color: #333;
        text-align: right;
        margin: 5px 0 15px;
      }

      .total-due-price {
        color: rgba(0, 200, 83, 0.95);
        font-size: 18px;
      }

      .footer {
        background: #fafafa;
        padding: 40px;
        display: flex;
        flex-direction: column;
        gap: 30px;
      }

      .footer-section {
        max-width: 250px;
      }

      .footer h6 {
        color: rgba(0, 0, 0, 0.3);
        font-size: 15px;
        margin: 0 0 15px;
        font-weight: normal;
        text-transform: uppercase;
      }

      .footer h2 {
        font-size: 16px;
        color: #222;
        margin: 0 0 10px;
        font-weight: 500;
      }

      .footer h4 {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.4);
        line-height: 1.65;
        margin: 0;
        font-weight: 400;
      }

      .note {
        max-width: 250px;
      }

      .note p {
        color: rgba(0, 0, 0, 0.4);
        margin: 20px 0 0;
        font-size: 13px;
        line-height: 1.6;
      }

      .payment {
        background: #2196f3;
        padding: 15px;
        text-align: center;
      }

      .payment h3 {
        margin: 0;
        font-size: 20px;
        letter-spacing: 1.5px;
      }

      .payment h3 a {
        color: #fff;
        text-decoration: none;
      }

      .img-responsive {
        max-width: 100%;
        height: auto;
      }
    </style>
  </head>
  <body>
    <section class="invoice">
      <div class="bg-color"></div>
      <div class="container">
        <div class="row">
          <div class="col-xs-12">
            <div class="invoice-wrapper">
              <div class="invoice-top">
                <div class="invoice-top-left">
                  <img src="acme.png" class="logo img-responsive" />
                  <h1>ACME Design Co.</h1>
                  <h5>Web design for Airbnb homepage</h5>
                </div>
                <div class="invoice-top-right">
                  <h4>INVOICE</h4>
                  <h6>#378928</h6>
                  <h3>Sep 6th, 2017</h3>
                  <h2 class="amount">$5000</h2>
                </div>
              </div>

              <div class="invoice-bottom">
                <div class="row">
                  <div class="col-sm-8">
                    <h2 class="service-title">Web Design and UI</h2>
                    <h5 class="service-subtitle">
                      UI design in Photoshop for development.
                    </h5>
                  </div>
                  <div class="col-sm-4">
                    <h3 class="service-price">$2500</h3>
                  </div>
                </div>
                <hr />
                <div class="row">
                  <div class="col-sm-8">
                    <h2 class="service-title">Website Maintenance</h2>
                    <h5 class="service-subtitle">
                      Long term maintenance of website and bug fixes.
                    </h5>
                  </div>
                  <div class="col-sm-4">
                    <h3 class="service-price">$2500</h3>
                    <h6 class="price-info">Recurring Price</h6>
                  </div>
                </div>
                <hr />
                <div class="row totals-row">
                  <div class="col-sm-10 col-xs-8">
                    <h4 class="sub-total">SUB TOTAL</h4>
                  </div>
                  <div class="col-sm-2 col-xs-4">
                    <h3 class="sub-total-price">$5000</h3>
                  </div>
                  <div class="col-sm-10 col-xs-8">
                    <h4 class="discount">DISCOUNT</h4>
                  </div>
                  <div class="col-sm-2 col-xs-4">
                    <h3 class="discount-price">-$250</h3>
                  </div>
                  <div class="col-sm-9 col-xs-8">
                    <h3 class="total-due">TOTAL DUE</h3>
                  </div>
                  <div class="col-sm-3 col-xs-4">
                    <h3 class="total-due-price">$4750</h3>
                  </div>
                </div>
              </div>

              <div class="footer">
                <div class="footer-section">
                  <h6>TO</h6>
                  <h2>Airbnb Co.</h2>
                  <h4>
                    189 Fight Street<br />
                    Las Vegas, LV 878<br />
                    United States<br />
                    contact@airbnb.co
                  </h4>
                </div>

                <div class="footer-section">
                  <h6>FROM</h6>
                  <h2>Acme Design Co.</h2>
                  <h4>
                    189 Fight Street<br />
                    Las Vegas, LV 878<br />
                    United States<br />
                    contact@airbnb.co
                  </h4>
                </div>

                <div class="note">
                  <h6>NOTE</h6>
                  <p>
                    A special note regarding invoice can be written here, as
                    this is tiny place to notify the client.
                  </p>
                </div>
              </div>

              <div class="payment">
                <div class="row">
                  <div class="col-xs-12">
                    <h3><a href="#">PAY NOW</a></h3>
                  </div>
                </div>
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
