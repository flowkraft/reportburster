package com.sourcekraft.documentburster.unit.further.other;

import static java.util.EnumSet.of;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hazlewood.connor.bottema.emailaddress.EmailAddressCriteria.ALLOW_DOT_IN_A_TEXT;
import static org.hazlewood.connor.bottema.emailaddress.EmailAddressCriteria.ALLOW_PARENS_IN_LOCALPART;
import static org.hazlewood.connor.bottema.emailaddress.EmailAddressCriteria.ALLOW_QUOTED_IDENTIFIERS;
import static org.hazlewood.connor.bottema.emailaddress.EmailAddressCriteria.ALLOW_SQUARE_BRACKETS_IN_A_TEXT;
import static org.hazlewood.connor.bottema.emailaddress.EmailAddressCriteria.RECOMMENDED;
import static org.hazlewood.connor.bottema.emailaddress.EmailAddressCriteria.RFC_COMPLIANT;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.EnumSet;

import javax.mail.internet.InternetAddress;

import org.apache.commons.lang3.StringUtils;
import org.hazlewood.connor.bottema.emailaddress.EmailAddressCriteria;
import org.hazlewood.connor.bottema.emailaddress.EmailAddressParser;
import org.hazlewood.connor.bottema.emailaddress.EmailAddressValidator;
import org.junit.Test;

import com.sourcekraft.documentburster._helpers.TestBursterFactory;
import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.engine.AbstractBurster;
import com.sourcekraft.documentburster.scripting.Scripts;
import com.sourcekraft.documentburster.common.settings.Settings;
import com.sourcekraft.documentburster.utils.Utils;
import com.sourcekraft.documentburster.variables.Variables;

public class EmailValidationTest {

	private static final String LOCAL_EMAIL_ADDRESS_PATH = "src/test/resources/input/unit/pdf/local-email-address.pdf";

	@Test
	public final void allowLocalEmailAddressesFalseFailJobTrue() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailTest-allowLocalEmailAddressesFalseFailJobTrue") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.getEmailRfc2822Validator().allowdomainliterals = false;
				ctx.settings.setFailJobIfAnyDistributionFails(true);

			};
		};

		try {
			burster.burst(LOCAL_EMAIL_ADDRESS_PATH, false, StringUtils.EMPTY, -1);
			fail("It should not come here!!!");
		} catch (IllegalArgumentException e) {
			assertTrue(e.getMessage().contains("documentburster@win2003srv"));
		} finally {
			assertEquals(2, burster.getCtx().numberOfExtractedFiles);
			assertEquals(1, burster.getCtx().numberOfDistributedFiles);
			assertEquals(0, burster.getCtx().numberOfSkippedFiles);
			assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);
		}
	};

	@Test
	public final void allowLocalEmailAddressesTrueFailJobTrue() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailTest-allowLocalEmailAddressesTrueFailJobTrue") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.getEmailRfc2822Validator().allowdomainliterals = true;
				ctx.settings.setFailJobIfAnyDistributionFails(true);

			};
		};

		burster.burst(LOCAL_EMAIL_ADDRESS_PATH, false, StringUtils.EMPTY, -1);

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(3, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);

	};

	@Test
	public final void allowLocalEmailAddressesFalseFailJobFalse() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailTest-allowLocalEmailAddressesFalseFailJobFalse") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.getEmailRfc2822Validator().allowdomainliterals = false;

				ctx.settings.setFailJobIfAnyDistributionFails(false);

			};
		};

		burster.burst(LOCAL_EMAIL_ADDRESS_PATH, false, StringUtils.EMPTY, -1);

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(2, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(1, burster.getCtx().numberOfQuarantinedFiles);

	};

	@Test
	public final void allowLocalEmailAddressesTrueFailJobFalse() throws Exception {

		AbstractBurster burster = new TestBursterFactory.PdfBurster(StringUtils.EMPTY,
				"EmailTest-allowLocalEmailAddressesTrueFailJobFalse") {
			protected void executeController() throws Exception {

				super.executeController();

				super.setUpMockEmail();

				ctx.settings.getEmailRfc2822Validator().allowdomainliterals = true;
				ctx.settings.setFailJobIfAnyDistributionFails(false);

			};
		};

		burster.burst(LOCAL_EMAIL_ADDRESS_PATH, false, StringUtils.EMPTY, -1);

		assertEquals(3, burster.getCtx().numberOfExtractedFiles);
		assertEquals(3, burster.getCtx().numberOfDistributedFiles);
		assertEquals(0, burster.getCtx().numberOfSkippedFiles);
		assertEquals(0, burster.getCtx().numberOfQuarantinedFiles);
	};

	@Test
	public void allowDomainLiterals() throws Exception {

		// these email address validations should normally fail
		assertFalse(EmailAddressValidator.isValid("admin@mailserver1"));
		assertFalse(EmailAddressValidator.isValid("documentburster@sharepoint"));

		// but with a configuration they could be allowed
		assertTrue(EmailAddressValidator.isValid("admin@mailserver1",
				EnumSet.of(EmailAddressCriteria.ALLOW_DOMAIN_LITERALS)));
		assertTrue(EmailAddressValidator.isValid("documentburster@sharepoint",
				EnumSet.of(EmailAddressCriteria.ALLOW_DOMAIN_LITERALS)));

		BurstingContext ctx = new BurstingContext();
		ctx.token = "token1";
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		// by default this address should not be allowed
		try {
			Utils.isValidEmailAddress("documentburster@sharepoint", ctx);
			fail("It should not come here!!!");
		} catch (IllegalArgumentException ex) {
			assertTrue("Exception is expected", ex.toString().contains("Invalid email address"));
		}

		// if people choose to allow local email addresses then such email addresses
		// should be allowed
		ctx.settings.getEmailRfc2822Validator().allowdomainliterals = true;
		assertTrue(Utils.isValidEmailAddress("documentburster@sharepoint", ctx));

	}

	@Test
	public void allowQuotedIdentifiers() throws Exception {

		// these email address validations should normally fail
		assertFalse(EmailAddressValidator.isValid("\"John Smith\" <john.smith@somewhere.com>",
				EnumSet.noneOf(EmailAddressCriteria.class)));

		// but with a configuration they could be allowed
		assertTrue(EmailAddressValidator.isValid("\"John Smith\" <john.smith@somewhere.com>",
				EnumSet.of(EmailAddressCriteria.ALLOW_QUOTED_IDENTIFIERS)));

		BurstingContext ctx = new BurstingContext();
		ctx.token = "token1";
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		// by default .allowquotedidentifiers = true so this address should be allowed
		Utils.isValidEmailAddress("\"John Smith\" <john.smith@somewhere.com>", ctx);

		try {

			// if people choose to disallow local email addresses then such email addresses
			// should not be allowed
			ctx.settings.getEmailRfc2822Validator().allowquotedidentifiers = false;
			assertTrue(Utils.isValidEmailAddress("\"John Smith\" <john.smith@somewhere.com>", ctx));
			fail("It should not come here!!!");
		} catch (IllegalArgumentException ex) {
			assertTrue("Exception is expected", ex.toString().contains("Invalid email address"));
		}

	}

	@Test
	public void allowDotInaText() throws Exception {

		BurstingContext ctx = new BurstingContext();
		ctx.token = "token1";
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		// by default this address should not be allowed
		try {
			Utils.isValidEmailAddress("Kayaks.org <kayaks@kayaks.org>", ctx);
			fail("It should not come here!!!");
		} catch (IllegalArgumentException ex) {
			assertTrue("Exception is expected", ex.toString().contains("Invalid email address"));
		}

		// if people choose to allow local email addresses then such email addresses
		// should be allowed
		ctx.settings.getEmailRfc2822Validator().allowdotinatext = true;
		assertTrue(Utils.isValidEmailAddress("Kayaks.org <kayaks@kayaks.org>", ctx));

	}

	@Test
	public void allowSquareBracketsInaText() throws Exception {

		// these email address validations should normally fail
		assertFalse(EmailAddressValidator.isValid("[Kayaks] <kayaks@kayaks.org>"));

		// but with a configuration they could be allowed
		assertTrue(EmailAddressValidator.isValid("[Kayaks] <kayaks@kayaks.org>",
				EnumSet.of(ALLOW_SQUARE_BRACKETS_IN_A_TEXT, ALLOW_QUOTED_IDENTIFIERS)));

		BurstingContext ctx = new BurstingContext();
		ctx.token = "token1";
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		// by default this address should not be allowed
		try {
			Utils.isValidEmailAddress("[Kayaks] <kayaks@kayaks.org>", ctx);
			fail("It should not come here!!!");
		} catch (IllegalArgumentException ex) {
			assertTrue("Exception is expected", ex.toString().contains("Invalid email address"));
		}

		// if people choose to allow local email addresses then such email addresses
		// should be allowed
		ctx.settings.getEmailRfc2822Validator().allowsquarebracketsinatext = true;
		assertTrue(Utils.isValidEmailAddress("[Kayaks] <kayaks@kayaks.org>", ctx));

	}

	@Test
	public void allowParensInLocalPart() throws Exception {

		// this should pass because isValid is using EmailAddressCriteria.RECOMMENDED
		// behind the scene and this contains allowParensInLocalPart as true
		assertTrue(EmailAddressValidator.isValid("\"bob(hi)smith\"@test.com"));

		// but with a configuration they could be allowed
		assertTrue(EmailAddressValidator.isValid("\"bob(hi)smith\"@test.com",
				EnumSet.of(ALLOW_PARENS_IN_LOCALPART, ALLOW_QUOTED_IDENTIFIERS)));

		BurstingContext ctx = new BurstingContext();
		ctx.token = "token1";
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		// this should pass because isValid is using EmailAddressCriteria.RECOMMENDED
		// behind the scene and this contains allowParensInLocalPart as true
		Utils.isValidEmailAddress("\"bob(hi)smith\"@test.com", ctx);

		// if people choose to allow local email addresses then such email addresses
		// should be allowed
		ctx.settings.getEmailRfc2822Validator().allowparensinlocalpart = true;
		assertTrue(Utils.isValidEmailAddress("\"bob(hi)smith\"@test.com", ctx));

	}

	@Test
	public void theseStrangeEmailAddressesShouldBeAllowed() throws Exception {

		String strangeEmailAddresses = "ANTHONY.T.GEORGE-2@somecompany.com;JAMES.W.WEST-2@somecompany.com;"
				+ "MARGARET-PARKER.H.ALES@somecompany.com;MISHELLE.JONES-CASWALL@somecompany.com";

		BurstingContext ctx = new BurstingContext();
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		assertTrue("strangeEmailAddresses should pass Email validation",
				Utils.isValidEmailAddress(strangeEmailAddresses, ctx));

	}

	@Test
	public void dashInsideEmailAddressShouldWork() throws Exception {

		BurstingContext ctx = new BurstingContext();
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		String dashEmailAddress = "MISHELLE@some-company.com";

		assertTrue("dashEmailAddress should pass Email validation", Utils.isValidEmailAddress(dashEmailAddress, ctx));

		dashEmailAddress = "john.GEORGE@south-california-duck.com";

		assertTrue("dashInsideEmailAddressShouldWork should pass Email validation",
				Utils.isValidEmailAddress(dashEmailAddress, ctx));

	}

	@Test(expected = IllegalArgumentException.class)
	public void questionMarkInsideEmailAddressShouldFail() throws Exception {

		BurstingContext ctx = new BurstingContext();
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		Utils.isValidEmailAddress("MISHELLE@some?company.com", ctx);
	}

	@Test
	public void emptyListOfEmailAddresses() throws Exception {

		String emptyListOfEmailAddresses = StringUtils.EMPTY;

		BurstingContext ctx = new BurstingContext();
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		assertFalse("emptyListOfEmailAddresses should not pass email validation",
				Utils.isValidEmailAddress(emptyListOfEmailAddresses, ctx));

	}

	@Test(expected = IllegalArgumentException.class)
	public void oneEmptyEmailInAdressesList() throws Exception {

		String oneEmptyEmailInAdressesList = "ANTHONY.T.GEORGE-2@somecompany.com;JAMES.W.WEST-2@somecompany.com;"
				+ StringUtils.EMPTY + ";john@gmail.com";

		BurstingContext ctx = new BurstingContext();
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		assertFalse("oneEmptyEmailInAdressesList should not pass email validation",
				Utils.isValidEmailAddress(oneEmptyEmailInAdressesList, ctx));

	}

	@Test
	public void skipValidationFor() throws Exception {

		String oneInvalidEmailInAdressesList = "ANTHONY.T.GEORGE-2@somecompany.com;JAMES.W.WEST-2@somecompany.com;"
				+ "MISHELLE@some?company.com" + ";john@gmail.com";

		BurstingContext ctx = new BurstingContext();
		ctx.configurationFilePath = "src/main/external-resources/template/config/burst/settings.xml";

		ctx.settings = new Settings(ctx.configurationFilePath);
		ctx.settings.loadSettings();

		ctx.scripts = new Scripts();
		ctx.variables = new Variables("fileName", "en", "en", 10);

		ctx.settings
				.getEmailRfc2822Validator().skipvalidationfor = "email1@company1.com, mishelle@some?company.com,email2@company2.com";

		// validation should pass since the invalid MISHELLE@some?company.com is
		// configured to be skipped from validation
		assertTrue("oneEmptyEmailInAdressesList should not pass email validation",
				Utils.isValidEmailAddress(oneInvalidEmailInAdressesList, ctx));

	}

	// copy pasted from
	// https://github.com/bbottema/email-rfc2822-validator/blob/master/src/test/java/demo/TestClass.java

	/**
	 * quick test some email addresses
	 * <p>
	 * lists taken from: http://stackoverflow.com/a/297494/441662 and
	 * http://haacked.com/archive/2007/08/21/i-knew-how-to-validate-an-email-address-until-i.aspx/
	 */
	@Test
	public void emailRfc2822Addresses() {
		_assertEmail("me@example.com", true);
		_assertEmail("a.nonymous@example.com", true);
		_assertEmail("name+tag@example.com", true);
		_assertEmail("!#$%&'+-/=.?^`{|}~@[1.0.0.127]", true);
		_assertEmail("!#$%&'+-/=.?^`{|}~@[IPv6:0123:4567:89AB:CDEF:0123:4567:89AB:CDEF]", true);
		_assertEmail("me(this is a comment)@example.com", true); // comments are discouraged but not prohibited by
																	// RFC2822.
		_assertEmail("me.example@com", true);
		_assertEmail("309d4696df38ff12c023600e3bc2bd4b@fakedomain.com", true);
		_assertEmail("ewiuhdghiufduhdvjhbajbkerwukhgjhvxbhvbsejskuadukfhgskjebf@gmail.net", true);

		_assertEmail("NotAnEmail", false);
		_assertEmail("me@", false);
		_assertEmail("@example.com", false);
		_assertEmail(".me@example.com", false);
		_assertEmail("me@example..com", false);
		_assertEmail("me\\@example.com", false);

		_assertEmail("\"�o�\" <notifications@example.com>", false);
		assertThat(EmailAddressParser.getAddressParts("\"�o�\" <notifications@example.com>", RFC_COMPLIANT, false))
				.isNullOrEmpty();
		String emailaddress = "\"�o�\" <notifications@example.com>".replaceAll("[^\\x00-\\x7F]", "");
		assertThat(EmailAddressParser.getAddressParts(emailaddress, RFC_COMPLIANT, false)).isNotEmpty();
	}

	@Test
	public void emailRfc2822AddressGithub18() {
		String email = "?UTF-8?Q?Gesellschaft_fC3BCr_Freiheitsrechte_e2EV=2E? <info@freiheitsrechte.org>";
		EnumSet<EmailAddressCriteria> criteria = of(ALLOW_SQUARE_BRACKETS_IN_A_TEXT, ALLOW_QUOTED_IDENTIFIERS);
		assertThat(EmailAddressValidator.isValid(email, criteria)).isTrue();
	}

	@Test
	public void emailRfc2822TestIt() {
		InternetAddress address = EmailAddressParser.getInternetAddress("\"Bob\" <bob@hi.com>", RECOMMENDED,
				/* cfws */ true);
		assertThat(address.getPersonal()).isEqualTo("Bob");
		assertThat(address.getAddress()).isEqualTo("bob@hi.com");
	}

	@Test
	public void emailRfc2822AllowDotInaText() throws Exception {
		// this email address validation should normally fail
		assertFalse(EmailAddressValidator.isValid("Kayaks.org <kayaks@kayaks.org>"));

		// but with a configuration they could be allowed
		assertTrue(EmailAddressValidator.isValid("Kayaks.org <kayaks@kayaks.org>",
				EnumSet.of(ALLOW_DOT_IN_A_TEXT, ALLOW_QUOTED_IDENTIFIERS)));

	}

	@Test
	public void emailRfc2822AllowSquareBracketsInaText() throws Exception {
		// this email address validation should normally fail
		assertFalse(EmailAddressValidator.isValid("[Kayaks] <kayaks@kayaks.org>"));

		// but with a configuration they could be allowed
		assertTrue(EmailAddressValidator.isValid("[Kayaks] <kayaks@kayaks.org>",
				EnumSet.of(ALLOW_SQUARE_BRACKETS_IN_A_TEXT, ALLOW_QUOTED_IDENTIFIERS)));

	}

	@Test
	public void emailRfc2822AllowParensInLocalPart() throws Exception {
		// this should pass because isValid is using EmailAddressCriteria.RECOMMENDED
		// behind the scene
		assertTrue(EmailAddressValidator.isValid("\"bob(hi)smith\"@test.com"));

		// but with a configuration they could be allowed
		assertTrue(EmailAddressValidator.isValid("\"bob(hi)smith\"@test.com",
				EnumSet.of(ALLOW_PARENS_IN_LOCALPART, ALLOW_QUOTED_IDENTIFIERS)));
	}

	@Test
	public void emailRfc2822AllowQuotedIdentifiers() throws Exception {
		// this email address validation should normally fail
		assertFalse(EmailAddressValidator.isValid("\"John Smith\" <john.smith@somewhere.com>",
				EnumSet.noneOf(EmailAddressCriteria.class)));

		// but with a configuration they could be allowed
		assertTrue(EmailAddressValidator.isValid("\"John Smith\" <john.smith@somewhere.com>",
				EnumSet.of(ALLOW_QUOTED_IDENTIFIERS)));
	}

	// copy pasted from
	// https://gist.github.com/cjaoude/fd9910626629b53c4d25

	@Test
	public void testListofValidEmailAddresses() {

		_assertEmail("email@example.com", true);
		_assertEmail("firstname.lastname@example.com", true);
		_assertEmail("email@subdomain.example.com", true);
		_assertEmail("firstname+lastname@example.com", true);
		_assertEmail("email@123.123.123.123", true);
		_assertEmail("email@[123.123.123.123]", true);
		_assertEmail("\"email\"@example.com", true);
		_assertEmail("1234567890@example.com", true);
		_assertEmail("email@example-one.com", true);
		_assertEmail("_______@example.com", true);
		_assertEmail("email@example.name", true);
		_assertEmail("email@example.museum", true);
		_assertEmail("email@example.co.jp", true);
		_assertEmail("firstname-lastname@example.com", true);
		_assertEmail("firstname_lastname@example.com", true);

	}

	@Test
	public void testListofInvalidEmailAddresses() {

		_assertEmail("Joe Smith <email@example.com>", true);

		_assertEmail("plainaddress", false);
		_assertEmail("#@%^%#$@#$@#.com", false);
		_assertEmail("@example.com", false);
		_assertEmail("email.example.com", false);
		_assertEmail("email@example@example.com", false);
		_assertEmail(".email@example.com", false);
		_assertEmail("email.@example.com", false);

		// I know that email-rfc2822-validator allows this kind of addresses
		// assertEmail("email@example.com (Joe Smith)", false);

		// with the RFC_COMPLIANT configuration email-rfc2822-validator will allow this
		// address but it can be configured, if needed, to reject it also
		// assertEmail("email@example", false);

		// email-rfc2822-validator allows this
		// assertEmail("email@-example.com", false);

		// email-rfc2822-validator allows this (and I believe this is good)
		// assertEmail("email@example.web", false);

		// email-rfc2822-validator allows this (it might be possible to configure to
		// reject it also)
		// assertEmail("email@111.222.333.44444", false);

		_assertEmail("email@example..com", false);
		_assertEmail("Abc..123@example.com", false);

	}

	private static void _assertEmail(String emailaddress, boolean expected) {
		assertThat(EmailAddressValidator.isValid(emailaddress, RFC_COMPLIANT))
				.as("assert %s is a valid address", emailaddress).isEqualTo(expected);
	}
};