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

package com.flowkraft.jobson.controllers;

import static com.flowkraft.jobson.TestHelpers.assertHasKeyWithValue;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

import org.junit.jupiter.api.Test;

import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.api.APIRootResponse;

public final class RootControllerTest {

    @Test
    public void testGetReturnsAResponse() {
        final RootController resource = new RootController();
        final APIRootResponse response = resource.get();

        assertThat(response).isNotNull();
    }

    @Test
    public void testGetResponseContainsALinkToTheV1Root() {
        final RootController resource = new RootController();
        final APIRootResponse response = resource.get();

        assertHasKeyWithValue(
                response.getLinks(),
                "v1",
                Constants.HTTP_V1_ROOT);
    }
}
