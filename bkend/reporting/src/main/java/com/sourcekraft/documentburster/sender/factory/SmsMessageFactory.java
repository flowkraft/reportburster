package com.sourcekraft.documentburster.sender.factory;

import com.sourcekraft.documentburster.sender.model.SmsMessage;

public class SmsMessageFactory {

    public SmsMessage createCheckSmsMessage(String from, String to) {

        SmsMessage msg = new SmsMessage();

        msg.fromTelephoneNumber = from;
        msg.toTelephoneNumber = to;
        msg.text = "It worked. You are now ready to send your messages.";

        return msg;
    }
}
