/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package com.flowkraft.jobson.websockets.v1;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import io.reactivex.Observable;
import io.reactivex.disposables.Disposable;

public abstract class ObservableSocket<T> implements WebSocketHandler {

	protected final Logger log;
	private Disposable eventsSubscription;

	protected WebSocketSession session;

	public ObservableSocket(String name) {
		this.log = LoggerFactory.getLogger(ObservableSocket.class.getName() + "(" + name + ")");
	}

	protected void subscribeEvents(Observable<T> events) {

		this.eventsSubscription = events.subscribe(this::onMessage, this::onObservableError, this::onObservableClosed);

	}

	protected abstract void onMessage(T messageData) throws IOException;

	@Override
	public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws IOException {
	}

	@Override
	public boolean supportsPartialMessages() {
		return false;
	}

	private void onObservableError(Throwable ex) throws IOException {
		log.debug("Closing websocket because an error was thrown by the observable. Error: " + ex);
		this.session.close(CloseStatus.SERVER_ERROR);
	}

	private void onObservableClosed() throws IOException {
		log.debug("Closing websocket because observable closed");
		this.session.close(CloseStatus.NORMAL);
	}

	public void afterConnectionEstablished(WebSocketSession session) {
		log.debug("Opening websocket");
		this.session = session;
	}

	public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws IOException {
		log.debug("Closing websocket");
		this.eventsSubscription.dispose();
		session.close(closeStatus);
	}

	public void handleTransportError(WebSocketSession session, Throwable exception) {
		log.debug(exception.getMessage());
		this.eventsSubscription.dispose();
	}
}
