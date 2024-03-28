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
import picocli.CommandLine.Parameters;

@Command(name = "passwd", description = "set a user's password")
@Component
public class PasswdCommand extends BaseCommand {

	@Autowired
	FileSystemUserDAO dao;

	@Parameters(arity = "1", description = "username")
	private String userName;

	@Override
	public void run() {
		//System.out.println("UsersCommand -> PasswdCommand -> run -> userName = " + userName + ", AppConfig = "
		//		+ appConfig.toString());

		final UserId login = new UserId(userName);

		final boolean userExists = dao.getUserCredentialsById(login).isPresent();

		if (userExists) {
			System.err.println(format("Changing password for %s.", login));
			System.err.print("Enter new Jobson password: ");
			System.err.flush();
			final String pw = new String(System.console().readPassword());
			System.err.print("Retype new Jobson password: ");
			System.err.flush();
			final String retry = new String(System.console().readPassword());

			if (pw.equals(retry)) {
				// dao.updateUserAuth(login, Constants.BASIC_AUTH_NAME,
				// BasicAuthenticator.createAuthField(pw));
			} else {
				System.err.println("Sorry, passwords do not match");
				System.err.println("password unchanged");
				System.exit(1);
			}
		} else {
			System.err.println(format("user '%s' does not exist", login));
			System.exit(1);
		}
	}
}
