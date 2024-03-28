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

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response to a request for job summaries")
public final class APIJobDetailsCollection {

    @Schema(description = "The entries returned")
    @JsonProperty
    private List<APIJobDetails> entries;

    @Schema(description = "Links to related resources and actions")
    @JsonProperty
    private Map<String, APIRestLink> _links;


    /**
     * @deprecated Used by JSON deserializer
     */
    public APIJobDetailsCollection() {}

    public APIJobDetailsCollection(
            List<APIJobDetails> entries,
            Map<String, APIRestLink> _links) {
        this.entries = entries;
        this._links = _links;
    }


    public List<APIJobDetails> getEntries() {
        return entries;
    }

    @JsonIgnore
    public Map<String, APIRestLink> getLinks() {
        return _links;
    }
}
