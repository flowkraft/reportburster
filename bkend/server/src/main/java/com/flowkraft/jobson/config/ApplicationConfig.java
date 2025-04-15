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

package com.flowkraft.jobson.config;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import lombok.Data;

@Configuration
@ConfigurationProperties
@PropertySource(value = "${config.protocol}:${config.file}", factory = YamlPropertySourceFactory.class)
@Data
public class ApplicationConfig {

	@NotNull
	@Valid
	private SpecsConfig specs;

	@NotNull
	@Valid
	private JobsConfig jobs;

	@NotNull
	@Valid
	private WorkingDirsConfig workingDirs;

	@NotNull
	@Valid
	private UsersConfig users;

	@Valid
	private ExecutionConfig execution = new ExecutionConfig();
	
	public static boolean serveWeb = true;
	
}
