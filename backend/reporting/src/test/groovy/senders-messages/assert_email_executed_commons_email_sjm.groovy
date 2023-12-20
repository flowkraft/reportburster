import com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailTest
import com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailWithApacheCommonsEmailOrWithSimpleJavaMailTest

if (!message.sjm.active)
	EmailTest.assertEmailMessage(message)
else	
	EmailWithApacheCommonsEmailOrWithSimpleJavaMailTest.assertEmailMessageWithSimpleJavaMail(message)
