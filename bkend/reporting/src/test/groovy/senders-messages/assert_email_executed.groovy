import com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailTest
import com.sourcekraft.documentburster.unit.further.validateexceptionhandling.EmailAllPossibleExceptionsTest

if (message.ctx.testName.toLowerCase().contains("emailpossibleerrorstest")) 
	EmailAllPossibleExceptionsTest.throwPossibleErrors(message)
else  
	EmailTest.assertEmailMessage(message)
