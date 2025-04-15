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

package com.flowkraft.jobson.commands.users;

import static java.lang.String.format;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.flowkraft.jobson.api.v1.UserId;
import com.flowkraft.jobson.commands.BaseCommand;
import com.flowkraft.jobson.dao.users.FileSystemUserDAO;

import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

@Command(name = "add", description = "create a new user with a random password. Assumes basic auth.")
@Component
public class UserAddCommand extends BaseCommand {

	@Autowired
	FileSystemUserDAO dao;

	@Parameters(arity = "1", description = "username")
	private String userName;

	@Option(names = { "--password" }, description = "the user's password (default: ${DEFAULT-VALUE})")
	private String userPassword = "default";

	@Override
	public void run() {
		//System.out.println("UsersCommand -> UserAddCommand -> run -> userName = " + userName + ", userPassword = "
		//		+ userPassword + ", AppConfig = " + appConfig.toString());

		final UserId login = new UserId(userName);

		final boolean userExists = dao.getUserCredentialsById(login).isPresent();

		if (!userExists) {
			addNewUser(userPassword, dao, login);
		} else {
			System.err.println(
					format("user '%s' already exists, you can set this user's password with `passwd`.", login));
			System.exit(1);
		}

	}

	private void addNewUser(String password, FileSystemUserDAO dao, UserId login) {

		final boolean userAdded = true;

		// final boolean userAdded = dao.addNewUser(login, Constants.BASIC_AUTH_NAME,
		// BasicAuthenticator.createAuthField(password));

		if (userAdded) {
			System.exit(0);
		} else {
			System.err.println("encountered an error adding a new user (this shouldn't happen)");
			System.exit(1);
		}
	}
}
