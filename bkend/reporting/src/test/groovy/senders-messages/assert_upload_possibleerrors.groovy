import com.sourcekraft.documentburster.unit.further.validateexceptionhandling.UploadAllPossibleExceptionsTest

if (message.ctx.testName.toLowerCase().contains("uploadpossibleerrorstest")) 
	UploadAllPossibleExceptionsTest.throwPossibleErrors(message)
else  
	UploadAllPossibleExceptionsTest.assertUploadMessage(message)
