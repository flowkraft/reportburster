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

import java.time.temporal.ChronoUnit;

import org.apache.commons.lang3.StringUtils;
//import org.perf4j.aop.Profiled;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.scripting.Scripting;
import com.sourcekraft.documentburster.utils.Utils;

import net.jodah.failsafe.ExecutionContext;
import net.jodah.failsafe.Failsafe;
import net.jodah.failsafe.RetryPolicy;
import net.jodah.failsafe.function.ContextualRunnable;

public abstract class AbstractSender {

	protected Logger log = LoggerFactory.getLogger(AbstractSender.class);

	// protected String testName;
	protected boolean execute = true;

	private boolean quarantined = false;
	private boolean sent = false;

	private int numberOfAttachments = 0;

	protected Scripting scripting;

	protected BurstingContext ctx;

	public AbstractSender(boolean execute, BurstingContext ctx) {
		this.execute = execute;
		this.ctx = ctx;
	}

	public void setScripting(Scripting scripting) {
		this.scripting = scripting;
	}

	// public BurstingContext getBurstingContext() {
	// return ctx;
	// }

	protected void quarantine() throws Exception {

		// ctx.extractedFilePath could be null, i.e., when doing
		// email-only-with-no-attachments scenarios
		if (StringUtils.isNotBlank(ctx.extractedFilePath)) {
			Utils.copyFileToQuarantine(ctx.quarantineFolder, ctx.extractedFilePath);
			ctx.numberOfQuarantinedFiles += 1;

			quarantined = true;

			scripting.executeBurstingLifeCycleScript(ctx.scripts.quarantineDocument, ctx);
		}
	}

	// @Profiled
	public void send() throws Exception {

		log.debug("send()");

		_processAttachments();

		try {

			scripting.executeBurstingLifeCycleScript(ctx.scripts.startDistributeDocument, ctx);

			if (ctx.settings.isEnableRetryPolicy())
				_doSendAndRetryIfAnyError();
			else
				doSend();

			scripting.executeBurstingLifeCycleScript(ctx.scripts.endDistributeDocument, ctx);

			ctx.numberOfMessagesSent += 1;

			ctx.numberOfDistributedFiles += numberOfAttachments;

		} catch (Exception e) /* sending errors */ {

			if (ctx.settings.isQuarantineFiles())
				// ctx.extractedFilePath could be null, i.e., when doing
				// email-only-with-no-attachments scenarios
				if (StringUtils.isNotBlank(ctx.extractedFilePath))
					quarantine();

			ctx.setLastException(e);
			scripting.executeBurstingLifeCycleScript(ctx.scripts.distributeReportErrorHandling, ctx);

		}
	}

	public boolean isQuarantined() {
		return quarantined;
	}

	public boolean isSent() {
		return sent;
	}

	private void _processAttachments() {

		if (ctx.attachments.size() > 0) {
			if (ctx.settings.isArchiveAttachments())
				numberOfAttachments = 1;
			else
				numberOfAttachments = ctx.attachments.size();
		}

	}

	private void _doSendAndRetryIfAnyError() throws Exception {

		RetryPolicy<Object> retryPolicy = new RetryPolicy<>()
				.handle(Exception.class).withBackoff(ctx.settings.getRetryPolicy().delay,
						ctx.settings.getRetryPolicy().maxdelay, ChronoUnit.SECONDS)
				.withMaxRetries(ctx.settings.getRetryPolicy().maxretries);

		Failsafe.with(retryPolicy).run(new ContextualRunnable() {
			public void run(ExecutionContext executionContext) throws Exception {

				log.info("SendAndRetryIfAnyError - Send attempt #" + executionContext.getAttemptCount());

				doSend();

			}
		});

	}

	protected abstract void doSend() throws Exception;
}
