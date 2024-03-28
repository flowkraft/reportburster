package com.flowkraft.jobson.websockets.v1;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Component;

import com.flowkraft.jobson.jobs.JobId;
import com.flowkraft.jobson.jobs.JobManagerEvents;

import io.reactivex.Observable;

@Component
public class StderrUpdateSocket extends ObservableSocket<byte[]> {

	@Autowired
	private JobManagerEvents jobManagerEvents;

	// @Autowired
	// private SimpMessageSendingOperations messagingTemplate;

	public StderrUpdateSocket() {
		super("stderr updates");
	}

	@SubscribeMapping("/v1/jobs/{jobId}/stderr/updates")
	public void subscribeEvents(@DestinationVariable String jobId) {

		Observable<byte[]> events = this.jobManagerEvents.stderrUpdates(new JobId(jobId)).orElse(null);

		super.subscribeEvents(events);

	}
	
	@Override
    protected void onMessage(byte[] messageData) throws IOException {
        try {
            if (this.session == null) return;
        	//session.sendMessage(null);
    		
            //messagingTemplate.convertAndSend("/topic/logs", ByteBuffer.wrap(messageData));
      	} catch (Exception ex) {
            log.error("Could not send stdio to " + session.getRemoteAddress().toString() +
                    ": " + ex.getMessage());
        }
    }
}
