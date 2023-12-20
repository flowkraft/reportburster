<ul>

	<#assign url><@spring.url relativeUrl="${servletPath}/files"/></#assign>

	<li><a href="${url}">Submit Burst Jobs</a></li>
    
    <#assign url><@spring.url relativeUrl="${servletPath}/scheduled"/></#assign>

	<li><a href="${url}">Schedule Burst Jobs</a></li>	

</ul>
