package com.flowkraft.iam.federation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.flowkraft.common.AppPaths;
import com.flowkraft.iam.IamDatabase;
import com.flowkraft.iam.IamRepository;
import com.flowkraft.iam.IamService;
import com.flowkraft.iam.IamUserDetailsService;
import com.flowkraft.iam.Role;
import com.flowkraft.iam.model.AppUser;
import com.flowkraft.iam.model.Tenant;
import com.flowkraft.license.LicenseService;
import com.flowkraft.license.model.LicenseDetails;

/**
 * What happens to a federated user once the identity provider has said yes.
 *
 * <p>An identity provider — LDAP, Active Directory, OIDC — can only answer "who is this". Everything
 * below is the other half: where that person lands in DataPallas and what they are allowed to do, which
 * no directory schema or ID token can express. These rules are shared by every protocol on purpose, so
 * that a customer moving from LDAP to Entra ID does not get different behaviour from the same groups.
 */
class FederatedUserProvisionerTest {

	private static final String TEST_ROOT = "./target/test-output/federated-provisioner-test";
	private static final String DEFAULT_ROLE = "JOB_OPERATOR";

	private String previousPortableDir;
	private Path root;

	private IamDatabase database;
	private IamRepository repository;
	private IamService iamService;
	private FederatedUserProvisioner provisioner;

	/** The group→role mapping under test; empty unless a test puts something in it. */
	private Map<String, String> groupRoleMap;

	@BeforeEach
	void setUp() throws Exception {
		root = new File(TEST_ROOT).getCanonicalFile().toPath();
		FileUtils.deleteQuietly(root.toFile());
		Files.createDirectories(root);

		previousPortableDir = AppPaths.PORTABLE_EXECUTABLE_DIR_PATH;
		AppPaths.PORTABLE_EXECUTABLE_DIR_PATH = root.toString();

		database = new IamDatabase();
		database.init();
		repository = new IamRepository(database);

		iamService = new IamService(repository, new BCryptPasswordEncoder(), new LicenseService() {
			@Override
			public LicenseDetails loadLicenseFile() {
				return new LicenseDetails();
			}
		});
		iamService.bootstrap();

		groupRoleMap = new LinkedHashMap<>();
		provisioner = new FederatedUserProvisioner(repository);
	}

	@AfterEach
	void tearDown() {
		if (database != null)
			database.close();
		AppPaths.PORTABLE_EXECUTABLE_DIR_PATH = previousPortableDir;
		FileUtils.deleteQuietly(root.toFile());
	}

	@Test
	void aFirstTimeFederatedUserGetsALocalRecordAndTheDefaultRole() {

		provision("jane.smith");

		AppUser user = repository.findUserByUsername("jane.smith").orElseThrow();
		long tenantId = repository.findTenantByCode(Tenant.DEFAULT_CODE).orElseThrow().id();

		assertEquals(Role.JOB_OPERATOR, repository.findRole(user.id(), tenantId).orElseThrow());
	}

	/**
	 * The local record must never carry a password. It exists to hold a membership; a password on it
	 * would be a second way in that bypasses the identity provider entirely.
	 */
	@Test
	void theLocalRecordHasNoPassword() {

		provision("jane.smith");

		assertNull(repository.findUserByUsername("jane.smith").orElseThrow().passwordHash());
	}

	/** And it is not a platform administrator just because an identity provider vouched for it. */
	@Test
	void aFederatedUserIsNotAPlatformAdministrator() {

		provision("jane.smith");

		assertTrue(!repository.findUserByUsername("jane.smith").orElseThrow().platformAdmin());
	}

	@Test
	void signingInRepeatedlyDoesNotDuplicateTheUser() {

		provision("jane.smith");
		provision("jane.smith");
		provision("jane.smith");

		// The default admin from bootstrap, plus jane — nothing else.
		assertEquals(2, repository.countUsers());
	}

	// ============================================================
	// group → role mapping
	// ============================================================

	@Test
	void aMappedGroupDecidesTheRole() {

		groupRoleMap.put("DataPallas-Admins", "ADMIN");

		provision("jane.smith", "ROLE_DataPallas-Admins");

		assertEquals(Role.ADMIN, roleOf("jane.smith"));
	}

	/**
	 * Configuration should be able to name the group exactly as the provider does. LDAP arrives with
	 * Spring's ROLE_ prefix already attached; an OIDC {@code groups} claim does not.
	 */
	@Test
	void theGroupMatchesWithOrWithoutSpringsRolePrefix() {

		groupRoleMap.put("DataPallas-Authors", "REPORT_AUTHOR");

		provision("with-prefix", "ROLE_DataPallas-Authors");
		provision("without-prefix", "DataPallas-Authors");

		assertEquals(Role.REPORT_AUTHOR, roleOf("with-prefix"));
		assertEquals(Role.REPORT_AUTHOR, roleOf("without-prefix"));
	}

	/**
	 * Someone in several mapped groups gets the strongest. Taking whichever the provider listed first
	 * would make their access depend on result ordering.
	 */
	@Test
	void theStrongestMatchingGroupWins() {

		groupRoleMap.put("DataPallas-Viewers", "JOB_OPERATOR");
		groupRoleMap.put("DataPallas-Admins", "ADMIN");

		provision("jane.smith", "ROLE_DataPallas-Viewers", "ROLE_DataPallas-Admins");
		assertEquals(Role.ADMIN, roleOf("jane.smith"));

		// And the same regardless of the order the provider returned them in.
		provision("john.doe", "ROLE_DataPallas-Admins", "ROLE_DataPallas-Viewers");
		assertEquals(Role.ADMIN, roleOf("john.doe"));
	}

	/**
	 * Removing someone from the admins group at the identity provider must take their rights away here
	 * too, without an administrator having to mirror the change by hand.
	 */
	@Test
	void losingAGroupDowngradesOnTheNextSignIn() {

		groupRoleMap.put("DataPallas-Admins", "ADMIN");
		groupRoleMap.put("DataPallas-Viewers", "JOB_OPERATOR");

		provision("jane.smith", "ROLE_DataPallas-Admins");
		assertEquals(Role.ADMIN, roleOf("jane.smith"));

		provision("jane.smith", "ROLE_DataPallas-Viewers");
		assertEquals(Role.JOB_OPERATOR, roleOf("jane.smith"));
	}

	/** With no group mapped, a role set by hand in DataPallas is left alone. */
	@Test
	void aManuallySetRoleSurvivesWhenNoGroupMatches() {

		provision("jane.smith");
		long tenantId = repository.findTenantByCode(Tenant.DEFAULT_CODE).orElseThrow().id();
		long userId = repository.findUserByUsername("jane.smith").orElseThrow().id();
		repository.upsertMembership(userId, tenantId, Role.REPORT_AUTHOR);

		provision("jane.smith");

		assertEquals(Role.REPORT_AUTHOR, roleOf("jane.smith"), "an unmapped sign-in must not reset the role");
	}

	/** A provider group must not be able to hand out platform-wide rights. */
	@Test
	void aGroupCannotGrantPlatformAdmin() {

		groupRoleMap.put("Domain-Admins", "PLATFORM_ADMIN");

		provision("jane.smith", "ROLE_Domain-Admins");

		assertEquals(Role.JOB_OPERATOR, roleOf("jane.smith"));
	}

	/** A typo in configuration must fail safe, not grant more than intended. */
	@Test
	void anUnknownRoleInConfigurationFallsBackToViewer() {

		groupRoleMap.put("DataPallas-Admins", "SUPERUSER");

		provision("jane.smith", "ROLE_DataPallas-Admins");

		assertEquals(Role.JOB_OPERATOR, roleOf("jane.smith"));
	}

	@Test
	void aBlankUsernameIsIgnored() {

		provision("  ");
		provision(null);

		assertEquals(1, repository.countUsers(), "only the bootstrap admin should exist");
	}

	/**
	 * A configured tenant that does not exist must not silently drop the user into DEFAULT with rights
	 * there — but it must also not crash the login. Falling back to DEFAULT is the documented behaviour;
	 * this pins it so it cannot change by accident.
	 */
	@Test
	void anUnknownConfiguredTenantFallsBackToDefault() {

		provisioner.provision("jane.smith", List.of(), groupRoleMap, DEFAULT_ROLE, "no-such-tenant");

		assertEquals(Role.JOB_OPERATOR, roleOf("jane.smith"));
	}

	// ============================================================
	// disabled accounts
	// ============================================================

	/**
	 * The Users screen says a disabled person "will no longer be able to sign in". An identity provider
	 * vouching for them changes nothing about that: somebody an administrator has switched off gets no
	 * session, and their record is left as it was, so Enable puts them back with the role they had.
	 */
	@Test
	void aDisabledFederatedUserIsRefusedAtSignIn() {

		FederatedIdentityBridge bridge = new FederatedIdentityBridge(iamService,
				new IamUserDetailsService(iamService), provisioner);
		groupRoleMap.put("DataPallas-Admins", "ADMIN");

		assertFalse(bridge.adopt("jane.smith", List.of(), groupRoleMap, DEFAULT_ROLE, Tenant.DEFAULT_CODE).isEmpty(),
				"an active person is let in");

		iamService.disableUser("jane.smith");

		assertTrue(bridge.adopt("jane.smith", List.of("ROLE_DataPallas-Admins"), groupRoleMap, DEFAULT_ROLE,
				Tenant.DEFAULT_CODE).isEmpty(), "a disabled person gets no session");
		assertEquals(Role.JOB_OPERATOR, roleOf("jane.smith"), "and the attempt must not change their role");

		iamService.enableUser("jane.smith");

		assertFalse(bridge.adopt("jane.smith", List.of(), groupRoleMap, DEFAULT_ROLE, Tenant.DEFAULT_CODE).isEmpty(),
				"Enable lets them back in");
	}

	/**
	 * Directory sign-in (LDAP, Active Directory) is a password login, so the local provider is asked
	 * first, and a disabled account stops it there. That only works while the record a federated user
	 * is given on first sign-in reads as disabled to the local provider, which is what this pins.
	 */
	@Test
	void aDisabledFederatedUserIsStoppedByTheLocalProviderBeforeTheDirectoryIsAsked() {

		provision("jane.smith");
		iamService.disableUser("jane.smith");

		DaoAuthenticationProvider local = new DaoAuthenticationProvider();
		local.setUserDetailsService(new IamUserDetailsService(iamService));
		local.setPasswordEncoder(new BCryptPasswordEncoder());

		assertThrows(DisabledException.class,
				() -> local.authenticate(new UsernamePasswordAuthenticationToken("jane.smith", "whatever")));
	}

	// ============================================================
	// helpers
	// ============================================================

	private void provision(String username, String... groups) {
		provisioner.provision(username, List.of(groups), groupRoleMap, DEFAULT_ROLE, Tenant.DEFAULT_CODE);
	}

	private Role roleOf(String username) {
		long tenantId = repository.findTenantByCode(Tenant.DEFAULT_CODE).orElseThrow().id();
		long userId = repository.findUserByUsername(username).orElseThrow().id();
		return repository.findRole(userId, tenantId).orElseThrow();
	}
}
