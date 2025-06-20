import java.util.List
import java.util.ArrayList

import org.apache.commons.lang3.StringUtils

import org.apache.http.NameValuePair
import org.apache.http.message.BasicNameValuePair

import com.twilio.sdk.TwilioRestClient
import com.twilio.sdk.resource.factory.MessageFactory
import com.twilio.sdk.resource.instance.Message

def from = message.fromTelephoneNumber
def to = message.toTelephoneNumber

//if (StringUtils.isNotBlank(from) && StringUtils.isNotBlank(to))
//{
	
def SID = message.twilio.accountsid
def TOKEN = message.twilio.authtoken
def text = message.text

def client = new TwilioRestClient(SID, TOKEN) 
		 
def params = new ArrayList<NameValuePair>()

params.add(new BasicNameValuePair("From", from)) 
params.add(new BasicNameValuePair("To", to))

params.add(new BasicNameValuePair("Body", text))
		 
def messageFactory = client.getAccount().getMessageFactory()
def message = messageFactory.create(params)

//}
//else
//     log.info("SMS not sent for burst token: " + message.token + " since fromTelephoneNumber and/or toTelephoneNumber are blank.")