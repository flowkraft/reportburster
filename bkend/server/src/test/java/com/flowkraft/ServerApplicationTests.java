package com.flowkraft;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import com.flowkraft.jobson.systemtests.SystemTestHelpers;

@SpringBootTest
class ServerApplicationTests {

	static {

		System.setProperty("config.protocol", "file");
		System.setProperty("config.file", SystemTestHelpers.createStandardRule());

	}
	
	@Test
	void contextLoads() {
	}

}
