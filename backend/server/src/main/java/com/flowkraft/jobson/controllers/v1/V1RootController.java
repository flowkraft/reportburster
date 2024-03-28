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

package com.flowkraft.jobson.controllers.v1;

import static com.flowkraft.jobson.Constants.HTTP_JOBS_PATH;
import static com.flowkraft.jobson.Constants.HTTP_SPECS_PATH;
import static com.flowkraft.jobson.Constants.HTTP_USERS_PATH;
import static com.flowkraft.jobson.Constants.HTTP_V1_ROOT;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.jobson.api.v1.APIRestLink;
import com.flowkraft.jobson.api.v1.APIV1RootResponse;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;

@OpenAPIDefinition(
    info = @Info(description = "Top-level resource for v1 API, which exposes sub-resources (jobs, specs, etc.)"))
@RestController
@RequestMapping(HTTP_V1_ROOT)
public final class V1RootController {

    @GetMapping
    public APIV1RootResponse get() {
        Map<String, APIRestLink> links = new HashMap<>();
        try {
            links.put("jobs", new APIRestLink(new URI(HTTP_JOBS_PATH)));
            links.put("current-user", new APIRestLink(new URI(HTTP_USERS_PATH + "/current")));
            links.put("specs", new APIRestLink(new URI(HTTP_SPECS_PATH)));
            return new APIV1RootResponse(links);
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
    }
}
