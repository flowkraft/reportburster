/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.sender;

import java.io.File;

import org.apache.commons.io.FileUtils;

import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.scripting.Scripts;
import com.sourcekraft.documentburster.sender.model.SmsMessage;
import com.sourcekraft.documentburster.common.settings.model.SmsSettings;
import com.sourcekraft.documentburster.utils.Utils;

public class SmsSender extends AbstractSender {

    public SmsSender(boolean execute, BurstingContext ctx) {
		super(execute, ctx);
	}

	public static enum SmsType {
        SMS, TWILIO
    }

    SmsType type;

    public void setType(SmsType type) {
        this.type = type;
    }

    protected void doSend() throws Exception {

        SmsSettings smsSettings = ctx.settings.getSmsSettings();

        SmsMessage message = new SmsMessage();

        message.token = ctx.token;

        message.fromTelephoneNumber =
                Utils.getStringFromTemplate(smsSettings.fromtelephonenumber, ctx.variables, ctx.token);
        message.toTelephoneNumber =
                Utils.getStringFromTemplate(smsSettings.totelephonenumber, ctx.variables, ctx.token);
        message.text = Utils.getStringFromTemplate(smsSettings.text, ctx.variables, ctx.token);

        String typeStr = "sms_twilio";

        switch (type) {
        case TWILIO:

            message.twilio.accountsid =
                    Utils.getStringFromTemplate(smsSettings.twilio.accountsid, ctx.variables, ctx.token);
            message.twilio.authtoken =
                    Utils.getStringFromTemplate(smsSettings.twilio.authtoken, ctx.variables, ctx.token);
            ctx.scripts.sms = Scripts.TWILIO;
            typeStr = "twilio";
            break;
        default:
            typeStr = "default";
            break;
        }

        log.info("Sending SMS message '" + message + " through " + typeStr);

        if (ctx.isQARunningMode)
            FileUtils.writeStringToFile(new File(ctx.outputFolder + "/quality-assurance/" + ctx.token + "_sms_"
                    + typeStr + ".txt"), message.toString(), "UTF-8");

        if (execute)
            scripting.executeSenderScript(ctx.scripts.sms, message);

        log.info("SMS message '" + message + "' sent successfully.");

    }

}
