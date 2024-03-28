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

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.jobson.Constants;
import com.flowkraft.jobson.api.APIRootResponse;
import com.flowkraft.jobson.api.v1.APIRestLink;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import static com.flowkraft.jobson.Constants.HTTP_ROOT;

@OpenAPIDefinition(
    info = @Info(description = "Top-level resource, which lists sub-resources"))
@RestController
@RequestMapping(HTTP_ROOT)
public final class RootController {

    @GetMapping
    public APIRootResponse get() {
        final Map<String, APIRestLink> links = new HashMap<>();
        links.put("v1", new APIRestLink(URI.create(Constants.HTTP_V1_ROOT)));
        return new APIRootResponse(links);
    }
}
