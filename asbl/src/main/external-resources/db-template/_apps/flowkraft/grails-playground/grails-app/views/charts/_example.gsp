<%@ page import="flowkraft.frend.RbUtils" %>
<div class="example-card" id="example-${id}">
    <h6 class="example-title">${title}</h6>
    <p class="example-desc">${desc}</p>
    <rb-chart
        id="rb-${id}"
        report-code="charts-examples"
        component-id="${id}"
        api-base-url="${RbUtils.apiBaseUrl}"
        api-key="${RbUtils.apiKey}"
    ></rb-chart>
</div>
