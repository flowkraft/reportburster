package com.flowkraft.bkend

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

// Ready-to-use examples (cron jobs, helpers, data pipelines) are in the src-examples/ folder.
// See src-examples/README.md for how to activate and customize them.

@SpringBootApplication
class BkendApplication {

	static void main(String[] args) {
		SpringApplication.run(BkendApplication, args)
	}

}
