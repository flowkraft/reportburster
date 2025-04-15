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
public class StdoutUpdateSocket extends ObservableSocket<byte[]> {

	@Autowired
	private JobManagerEvents jobManagerEvents;

	// @Autowired
	// private SimpMessageSendingOperations messagingTemplate;

	public StdoutUpdateSocket() {
		super("stdout updates");
	}

	@Override
	protected void onMessage(byte[] messageData) throws IOException {
		try {
			if (this.session == null)
				return;
			//session.sendMessage(null);
    		
			//messagingTemplate.convertAndSend("/topic/logs", ByteBuffer.wrap(messageData));
		} catch (Exception ex) {
			log.error("Could not send stdio to " + session.getRemoteAddress().toString() + ": " + ex.getMessage());
		}
	}

	@SubscribeMapping("/v1/jobs/{jobId}/stdout/updates")
	public void subscribeEvents(@DestinationVariable String jobId) {

		Observable<byte[]> events = this.jobManagerEvents.stdoutUpdates(new JobId(jobId)).orElse(null);

		super.subscribeEvents(events);

	}
}