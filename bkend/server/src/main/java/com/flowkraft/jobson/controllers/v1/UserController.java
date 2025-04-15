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

import static com.flowkraft.jobson.Constants.HTTP_USERS_PATH;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.jobson.api.v1.APIUserDetails;
import com.flowkraft.jobson.api.v1.UserId;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.info.Info;

@OpenAPIDefinition(info = @Info(description = "Operations related to users"))
@RestController
@RequestMapping(HTTP_USERS_PATH)
public final class UserController {
	@GetMapping(value = "/current")
	@Operation(summary = "Get the current user", description = "Returns the current user that Jobson believes is calling the API. This entrypoint *always* returns "
			+ "*something*. If authentication is disabled (e.g. guest auth is enabled) then the client's ID is"
			+ " handled as the guest username (usually, 'guest'). All other auth types have an associated username "
			+ "that jobson will extract and return via this entrypoint")
	public APIUserDetails fetchCurrentUserDetails() {

		// return new APIUserDetails(new UserId(context.getUserPrincipal().getName()));
		return new APIUserDetails(new UserId("virgil"));

	}
}
