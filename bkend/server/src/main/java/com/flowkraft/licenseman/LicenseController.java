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

package com.flowkraft.licenseman;

import java.sql.Timestamp;

import jakarta.validation.constraints.NotNull;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flowkraft.licenseman.model.LicenseDetails;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping(value = "/license", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
public final class LicenseController {

	@Autowired
	LicenseService licenseService;

	@GetMapping("/")
	public Mono<LicenseDetails> loadLicenseFile() throws Exception {

		//System.out.println("/license - loadLicense - Time: " + new Timestamp(System.currentTimeMillis()));

		return Mono.just(licenseService.loadLicenseFile());

	}

	@PutMapping("/")
	public Mono<ResponseEntity<Void>> saveLicenseFile(@RequestBody @NotNull LicenseDetails licenseDetails)
			throws Exception {

		//System.out.println("licenseDetails.key = " + licenseDetails.key);
		licenseService.saveLicenseFile(licenseDetails);

		return Mono.just(new ResponseEntity<Void>(HttpStatus.OK));

	}

	@PutMapping("/activate")
	public void activateLicense() throws Exception {

		licenseService.activateLicense();

	}

	@PutMapping("/check")
	public void checkLicense() throws Exception {

		licenseService.checkLicense();

	}

	@PutMapping("/deactivate")
	public void deActivateLicense() throws Exception {

		licenseService.deActivateLicense();

	}

	@PutMapping("/about")
	public Mono<AboutInfo> about() throws Exception {

		
		LicenseDetails licenseInfo = this.licenseService.loadLicenseFile();

		AboutInfo aboutProductInfo;
		try {

			aboutProductInfo = licenseService.getLatestVersionAndChangeLogInformation();

			licenseInfo.latestversion = aboutProductInfo.latestversion;
			licenseInfo.changelog = aboutProductInfo.changelog;

		} finally {
			licenseService.saveLicenseFile(licenseInfo);
		}

		//System.out.println(aboutProductInfo.latestversion);
		
		return Mono.just(aboutProductInfo);

	}

}
