package com.flowkraft.jobson.websockets.v1;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.flowkraft.jobson.Helpers;
import com.flowkraft.jobson.jobs.JobManagerEvents;

import io.reactivex.Observable;

@Component
public class JobEventSocket extends ObservableSocket<String> {

	@Autowired
	private JobManagerEvents jobManagerEvents;

	// @Autowired
	// private SimpMessageSendingOperations messagingTemplate;

	public JobEventSocket() {
		super("job events");
	}

	public void subscribeEvents() {

		Observable<String> events = this.jobManagerEvents.allJobStatusChanges().map(Helpers::toJSON);
		super.subscribeEvents(events);

	}

	@Override
	protected void onMessage(String messageData) {
		if (this.session == null)
			return;

		try {
			//session.sendMessage(null);
			// messagingTemplate.convertAndSend("/topic/logs", messageData);
		} catch (Exception ex) {
			log.error("Could not send stderr to " + session.getRemoteAddress().toString() + ": " + ex.getMessage());
		}
	}

}
