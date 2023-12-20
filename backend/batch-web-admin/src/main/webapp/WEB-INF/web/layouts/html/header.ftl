<#import "/spring.ftl" as spring />

<#assign home_url><@spring.url relativeUrl="/"/></#assign>

<#assign company_url><@spring.messageText code="company.url" text=companyUrl!"http://www.pdfburst.com/"/></#assign>

<#assign company_name><@spring.messageText code="company.name" text=companyName!"SourceKraft Systems"/></#assign>

<div id="header">

	<div id="name-and-company">

		<div id='site-name'>

			<a href=${home_url} title="Site Name" rel="home">

				<@spring.messageText code="site.name" text=siteName!"<em>DocumentBurster Server</em>"/>

			</a>

		</div>

	</div> <!-- /name-and-company -->

</div> <!-- /header -->



