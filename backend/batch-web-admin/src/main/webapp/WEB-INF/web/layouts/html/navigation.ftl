<#assign home_url><@spring.url relativeUrl="/"/></#assign>

<#assign company_url><@spring.messageText code="company.url" text=companyUrl!"http://www.pdfburst.com/"/></#assign>

<#assign company_name><@spring.messageText code="company.name" text=companyName!"DocumentBurster"/></#assign>

<div id="primary-navigation">

	<div id="primary-left">

		<ul>

			<#list menuManager.menus as menu>

			<#assign menu_url><@spring.url relativeUrl="${menu.url}"/></#assign>

			<li><a href="${menu_url}">${menu.label}</a></li>

			</#list>

		</ul>

	</div>

	<div id="primary-right">

		<ul>

			<li><a href="${company_url}" target="_blank">${company_name}</a></li>
			<li><a href="/burst/j_spring_security_logout"><strong>LOGOUT</strong></a></li>
		
		</ul>

	</div>

</div><!-- /primary-navigation -->
