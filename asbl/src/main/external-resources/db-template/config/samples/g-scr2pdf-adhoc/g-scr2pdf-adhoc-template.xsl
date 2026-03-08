<?xml version="1.0" encoding="UTF-8"?>
<fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
  <fo:layout-master-set>
    <fo:simple-page-master master-name="A4"
      page-height="29.7cm"
      page-width="21cm"
      margin-top="1cm"
      margin-bottom="1cm"
      margin-left="1.5cm"
      margin-right="1.5cm">
      <fo:region-body/>
    </fo:simple-page-master>
  </fo:layout-master-set>
  <fo:page-sequence master-reference="A4">
    <fo:flow flow-name="xsl-region-body">

      <fo:block font-size="16pt" font-weight="bold" text-align="center" space-after="15pt">
        Employee Profile (Ad-hoc)
      </fo:block>

      <fo:table table-layout="fixed" width="100%" font-size="10pt">
        <fo:table-column column-width="6cm"/>
        <fo:table-column column-width="6cm"/>
        <fo:table-column column-width="6cm"/>
        <fo:table-body>
          <fo:table-row background-color="#f2f2f2">
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block font-weight="bold" text-align="center">Employee ID</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block font-weight="bold" text-align="center">First Name</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block font-weight="bold" text-align="center">Last Name</fo:block>
            </fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block text-align="center">${EmployeeID!}</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block>${FirstName!}</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block>${LastName!}</fo:block>
            </fo:table-cell>
          </fo:table-row>
        </fo:table-body>
      </fo:table>

    </fo:flow>
  </fo:page-sequence>
</fo:root>
