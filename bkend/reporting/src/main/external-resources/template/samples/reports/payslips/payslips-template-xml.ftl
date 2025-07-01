<?xml version="1.0" encoding="UTF-8"?>
<Payslip id="${col1}">
  <Employee>
    <Name>${col0}</Name>
    <ID>${col1}</ID>
    <SocialSecurity>${col2}</SocialSecurity>
  </Employee>
  <PayPeriod>
    <#if col3?is_date>
      ${col3?string("MM/dd/yy")}
    <#else>
      ${col3}
    </#if>
  </PayPeriod>
  <Department>${col4}</Department>
  <Position>${col5}</Position>
  <Earnings>
    <BasicSalary>${col6}</BasicSalary>
    <Bonuses>${col8}</Bonuses>
  </Earnings>
  <Deductions>
    <FederalTax>${col7}</FederalTax>
    <SocialSecurityTax>${col9}</SocialSecurityTax>
    <MedicareTax>${col10}</MedicareTax>
    <StateTax>${col11}</StateTax>
    <Medical>${col12}</Medical>
    <Dental>${col13}</Dental>
  </Deductions>
  <Totals>
    <TotalEarnings>${col14}</TotalEarnings>
    <TotalDeductions>${col15}</TotalDeductions>
  </Totals>
  <NetPay>${col16}</NetPay>
</Payslip>