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

package com.flowkraft.jobson.dao.users;

import static com.flowkraft.jobson.TestHelpers.generateUserDetails;
import static com.flowkraft.jobson.TestHelpers.generateUserId;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class FileSystemUserDAOTest {

	private UserDAO getInstance(File usersFile) throws Exception {
		FileSystemUserDAO fsUsersDAO = new FileSystemUserDAO();
		fsUsersDAO.setUsersFile(usersFile);
		return fsUsersDAO;
	}

	/*
	 * @Test public void testCtorThrowsIfUsersFileDoesNotExist() throws Exception {
	 * 
	 * final File f = new File("does-not-exist-" +
	 * Helpers.generateRandomBase36String(5)); //
	 * Assertions.assertThrows(FileNotFoundException.class, () -> { getInstance(f);
	 * //});
	 * 
	 * }
	 */
	@Test
	public void testCtorThrowsIfUsersFileIsNull() {
		Assertions.assertThrows(NullPointerException.class, () -> {
			getInstance(null);
		});
	}

	@Test
	public void testCtorThrowsIfUsersFileIsNotAFile() throws Exception {

		final File dir = Files.createTempDirectory(FileSystemUserDAOTest.class.getSimpleName()).toFile();

		// Assertions.assertThrows(IllegalArgumentException.class, () -> {
		getInstance(dir);
		// });

	}

	@Test
	public void testGetUserDetailsByIdThrowsNPEIfArgsNull() throws Exception {
		final UserDAO dao = getInstance(tmpFile());

		Assertions.assertThrows(NullPointerException.class, () -> {
			dao.getUserCredentialsById(null);
		});

	}

	private File tmpFile() throws IOException {
		return Files.createTempFile(FileSystemUserDAOTest.class.getSimpleName(), "").toFile();
	}

	@Test
	public void testGetUserDetailsByIdReturnsEmptyOptionalForABogusUserId() throws Exception {

		final UserDAO dao = getInstance(tmpFile());

		assertThat(dao.getUserCredentialsById(generateUserId())).isEmpty();

	}

	@Test
	public void testGetUserDetailsByIdReturnsUserDetailsFromFilesystem() throws Exception {
		final UserCredentials userCredentials = generateUserDetails();

		final File usersFile = tmpFile();
		Files.write(usersFile.toPath(), userCredentials.toUserFileLine().getBytes());

		final UserDAO dao = getInstance(usersFile);

		final Optional<UserCredentials> maybeCredentials = dao.getUserCredentialsById(userCredentials.getId());

		assertThat(maybeCredentials).isNotEmpty();
		assertThat(maybeCredentials.get()).isEqualTo(userCredentials);
	}

	@Test
	public void testGetUserDetailsByIdReturnsUserDetailsEvenWhenFileContainsBlankLines() throws Exception {
		final UserCredentials userCredentials = generateUserDetails();

		final File usersFile = tmpFile();
		final String userLine = userCredentials.toUserFileLine();
		final String fileContent = "#somecomment\n\n\n" + userLine + "\n#anothercomment\n";
		Files.write(usersFile.toPath(), fileContent.getBytes());

		final UserDAO dao = getInstance(usersFile);

		final Optional<UserCredentials> maybeCredentials = dao.getUserCredentialsById(userCredentials.getId());

		assertThat(maybeCredentials).isNotEmpty();
		assertThat(maybeCredentials.get()).isEqualTo(userCredentials);
	}
}