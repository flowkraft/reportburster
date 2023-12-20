<#import "/spring.ftl" as spring />
<div id="configuration">
	
	<#if Session.SPRING_SECURITY_LAST_EXCEPTION?? && Session.SPRING_SECURITY_LAST_EXCEPTION.message?has_content>
		<div class="error"> 
			<p>
				<strong>${Session.SPRING_SECURITY_LAST_EXCEPTION.message}</strong>
			</p>
		</div>	
	</#if>
	
	<form action="j_spring_security_check" name="f" method="post">
		<table>
			<tr>
			 	<td>User</td>
			 	<td><input type="text" name="j_username" value=""></td>
			</tr>
			<tr>
			 	<td>Password</td>
			 	<td><input type="password" name="j_password" value=""></td>
			</tr>
			<tr>
			 	<td><input type="submit" name="Submit" value="Login"></td>
			 	<td><input type="reset" name="Reset" value="Reset"></td>
			</tr>
			<tr>
				<td colspan="2">&nbsp;</td>
			</tr>
			<tr>
				<td colspan="2"><a href="https://www.pdfburst.com/docs/html/userguide/chapter.server.html#d0e4866" target="_blank">Need Help to Login?</a></td>
			</tr>
		</table>
	</form>
	
</div><!-- configuration -->