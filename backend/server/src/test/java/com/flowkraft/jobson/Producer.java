package com.flowkraft.jobson;

import java.util.concurrent.Callable;

public interface Producer<T> extends Callable<T> {
	@Override
	T call();
}