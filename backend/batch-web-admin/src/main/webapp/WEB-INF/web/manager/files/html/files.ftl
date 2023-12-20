<#import "/spring.ftl" as spring />
<div id="configuration">
	<h2>Burst and distribute PDF and Excel report files</h2>
	<#if date??>
		<@spring.bind path="date" />
		<@spring.showErrors separator="<br/>" classOrStyle="error" /><br/>
	</#if>
	
	<p>
		Browse for a PDF or Excel report file and press the button marked <b>Burst</b>.
		Once the report file is uploaded it will be picked up and burst by the server. 
	</p>
    
    <p/>
	
    <#assign url><@spring.url relativeUrl="${servletPath}/files"/></#assign>
	<form id="registerFileForm" action="${url}" method="POST" enctype="multipart/form-data" encoding="multipart/form-data">
		<table>
			<tr><td colspan="2"><div style="display:none"><label for="filePath">Server Path</label><input id="path" type="text" name="path" /></div></td></tr>
			<tr><td><label for="file">PDF/Excel report file</label></td><td><input id="file" type="file" name="file"/></td></tr>
			<tr><td colspan="2"><input id="uploadFile" type="submit" value="Burst" name="uploadFile" /></td></tr>
			<!-- Spring JS does not support multipart forms so no Ajax here -->
		</table>
	</form>
	
	<#if uploaded??>
	<p>Uploaded file: ${uploaded}</p>
	</#if>
	<br/><br/>
		
	<#if files?? && files?size!=0>
		<br/>
		<#assign files_url><@spring.url relativeUrl="${servletPath}/files"/></#assign>
		<h2>Uploaded Files</h2>
		<table title="Uploaded Files" class="bordered-table">
			<tr>
				<th>Local</th>
				<th>Path</th>
				<th>Filename</th>
			</tr>
			<#list files as file>
				<#if file_index % 2 == 0>
					<#assign rowClass="name-sublevel1-even" />
				<#else>
					<#assign rowClass="name-sublevel1-odd" />
				</#if>
				<#if file.local>
					<#assign filePath><a href="${files_url}/${file.path}">files://${file.path?html}</a></#assign>
				<#else>
					<#assign filePath>files://${file.path?html}</#assign>
				</#if>
				<tr class="${rowClass}">
					<td>${file.local?string}</td>
					<td>${filePath}</td>
					<td>${file.fileName}</td>
				</tr>
			</#list>
		</table>
		<#if startFile??>
			<ul class="controlLinks">
				<li>Rows: ${startFile}-${endFile} of ${totalFiles}</li> 
				<#if nextFile??><li><a href="${files_url}?startFile=${nextFile}&pageSize=${pageSize!20}">Next</a></li></#if>
				<#if previousFile??><li><a href="${files_url}?startFile=${previousFile}&pageSize=${pageSize!20}">Previous</a></li></#if>
				<!-- TODO: enable pageSize editing -->
				<li>Page Size: ${pageSize!20}</li>
			</ul>
		</#if>
		
	<#else>
		<p>There are no files to display.</p>
	</#if>
</div><!-- configuration -->