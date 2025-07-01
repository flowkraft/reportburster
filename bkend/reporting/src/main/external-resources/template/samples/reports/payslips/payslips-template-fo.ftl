<?xml version="1.0" encoding="UTF-8"?>
<fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
  <fo:layout-master-set>
    <fo:simple-page-master master-name="payslip"
                           page-height="29.7cm"
                           page-width="21cm"
                           margin-top="1cm"
                           margin-bottom="1cm"
                           margin-left="1.5cm"
                           margin-right="1.5cm">
      <fo:region-body margin-top="1cm"/>
    </fo:simple-page-master>
  </fo:layout-master-set>

  <fo:page-sequence master-reference="payslip">
    <fo:flow flow-name="xsl-region-body">

      <!-- Company Info -->
      <fo:block text-align="center" font-size="10pt" space-after="10pt">
        <fo:block font-weight="bold">Northridge Pharmaceuticals</fo:block>
        <fo:block>7649F Diamond Hts Blvd</fo:block>
        <fo:block>San Francisco</fo:block>
        <fo:block>(415) 872-9214</fo:block>
      </fo:block>

      <!-- Header -->
      <fo:block font-size="16pt" font-weight="bold" text-align="center" space-after="10pt">
        STATEMENT OF MONTHLY INCOME
      </fo:block>

      <!-- Employee Details Table -->
      <fo:table table-layout="fixed" width="100%" space-after="15pt">
        <fo:table-column column-width="25%"/>
        <fo:table-column column-width="75%"/>
        <fo:table-body>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block font-weight="bold">Employee Name</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>${col0}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block font-weight="bold">Employee ID</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>${col1}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block font-weight="bold">Social Security #</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>${col2}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block font-weight="bold">Pay Period</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block><#if col3?is_date>${col3?string("MM/dd/yy")}<#else>${col3}</#if></fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block font-weight="bold">Department</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>${col4}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block font-weight="bold">Position/Grade</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>${col5}</fo:block></fo:table-cell>
          </fo:table-row>
        </fo:table-body>
      </fo:table>

      <!-- Earnings and Deductions Table -->
      <fo:table table-layout="fixed" width="100%" space-after="10pt">
        <fo:table-column column-width="35%"/>
        <fo:table-column column-width="15%"/>
        <fo:table-column column-width="35%"/>
        <fo:table-column column-width="15%"/>
        <fo:table-header>
          <fo:table-row background-color="#f2f2f2" font-weight="bold">
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>EARNINGS</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>AMOUNT</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>TAXES/DEDUCTIONS</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>AMOUNT</fo:block></fo:table-cell>
          </fo:table-row>
        </fo:table-header>
        <fo:table-footer>
          <fo:table-row background-color="#f2f2f2" font-weight="bold">
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Total Earnings</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col14}</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Total Deductions</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col15}</fo:block></fo:table-cell>
          </fo:table-row>
        </fo:table-footer>
        <fo:table-body>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Basic Salary</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col6}</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Federal Tax</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col7}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Bonuses</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col8}</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Social Security Tax</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col9}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block></fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block></fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Medicare Tax</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col10}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block></fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block></fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>State Tax</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col11}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block></fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block></fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Medical</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col12}</fo:block></fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block></fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block></fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black"><fo:block>Dental</fo:block></fo:table-cell>
            <fo:table-cell padding="5pt" border="1pt solid black" text-align="end"><fo:block>${col13}</fo:block></fo:table-cell>
          </fo:table-row>
        </fo:table-body>
      </fo:table>

      <!-- Net Pay -->
      <fo:block-container width="50%" left="50%">
          <fo:block text-align="end" font-weight="bold" background-color="#f2f2f2" padding="5pt">
              Net Pay: ${col16}
          </fo:block>
      </fo:block-container>

      <!-- Signatures -->
      <fo:block space-before="40pt">
        <fo:table table-layout="fixed" width="100%">
          <fo:table-column column-width="50%"/>
          <fo:table-column column-width="50%"/>
          <fo:table-body>
            <fo:table-row>
              <fo:table-cell padding="5pt">
                <fo:block border-top="1pt solid black" text-align="center" padding-top="5pt">Employee signature:</fo:block>
              </fo:table-cell>
              <fo:table-cell padding="5pt">
                <fo:block border-top="1pt solid black" text-align="center" padding-top="5pt">Director:</fo:block>
              </fo:table-cell>
            </fo:table-row>
          </fo:table-body>
        </fo:table>
      </fo:block>

    </fo:flow>
  </fo:page-sequence>
  </fo:root>