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

package com.flowkraft.jobson.scripting.functions;

import com.flowkraft.jobson.TestHelpers;
import com.flowkraft.jobson.jobinputs.stringarray.StringArrayInput;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class JoinFunctionTest {
	@Test
	public void testWhenCalledWithADelimiterAndAnArrayOfStringReturnsAStringJoinedByTheDelimiter() {
		final JoinFunction joinFunction = new JoinFunction();
		final String delimiter = ",";
		final List<String> items = generateTestData();
		final Object ret = joinFunction.call(delimiter, new StringArrayInput(items));

		assertThat(ret.getClass()).isEqualTo(String.class);
		assertThat(ret).isEqualTo(String.join(delimiter, items));
	}

	private List<String> generateTestData() {
		return TestHelpers.generateListContainingNElements(10, TestHelpers::generateAlphanumStr);
	}

	@Test
	public void testWhenCalledWithInvalidTypesThrowsException() {
		final JoinFunction joinFunction = new JoinFunction();

		// These should throw
		Assertions.assertThrows(RuntimeException.class, () -> {
			joinFunction.call(new Object(), new Object());
		});

		Assertions.assertThrows(RuntimeException.class, () -> {
			joinFunction.call(",", new Object());
		});

		Assertions.assertThrows(RuntimeException.class, () -> {
			joinFunction.call(new Object(), generateTestData());
		});

	}

	@Test
	public void testThrowsWhenCalledWithInvalidNumberOfArguments() {
		final JoinFunction joinFunction = new JoinFunction();

		Assertions.assertThrows(RuntimeException.class, () -> {
			joinFunction.call(",");
		});

		Assertions.assertThrows(RuntimeException.class, () -> {
			joinFunction.call(",", generateTestData(), new Object());
		});

	}
}