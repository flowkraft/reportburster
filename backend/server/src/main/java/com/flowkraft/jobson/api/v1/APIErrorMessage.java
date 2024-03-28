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

package com.flowkraft.jobson.api.v1;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "An error message")
public final class APIErrorMessage {

    private final String message;
    private final String code;


    public APIErrorMessage(
            @JsonProperty("message") String message,
            @JsonProperty("code") String httpStatusCode) {
        this.message = message;
        this.code = httpStatusCode;
    }


    @Schema(description = "An explanation of the error", required = true)
    public String getMessage() {
        return this.message;
    }

    @Schema(description = "The HTTP status code associated with the message.",
            required = true)
    public String getCode() {
        return this.code;
    }
}
