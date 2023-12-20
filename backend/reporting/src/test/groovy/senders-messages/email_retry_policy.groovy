import com.sourcekraft.documentburster.unit.further.startpausecancelretrypolicy.RetryPolicyTest
import com.sourcekraft.documentburster.unit.documentation.userguide.distribute.EmailTest
	
if (message.token.equals('kyle.butford@northridgehealth.org')) { 
	
	if (message.ctx.additionalInformation == null) 
	
		RetryPolicyTest.throwRandomPossibleEmailException(message);	
	
	else if (message.ctx.additionalInformation.numberOfFailures < message.ctx.additionalInformation.requestedNumberOfFailures) { 
	
		message.ctx.additionalInformation.numberOfFailures++;
		RetryPolicyTest.throwRandomPossibleEmailException(message);

	}
}
else
	EmailTest.assertEmailMessage(message);