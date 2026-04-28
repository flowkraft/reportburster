<%@ page import="flowkraft.frend.RbUtils" %>
<div class="example-card" id="example-${id}">
    <h6 class="example-title">${title}</h6>
    <p class="example-desc">${desc}</p>
    <rb-pivot-table
        id="rb-${id}"
        report-id="piv-examples"
        component-id="${id}"
        api-base-url="${RbUtils.apiBaseUrl}"
        api-key="${RbUtils.apiKey}"
    ></rb-pivot-table>
</div>
