package com.flowkraft.ai.prompts;

import java.util.List;

public final class BuildTemplateFromScratch {

    private BuildTemplateFromScratch() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "BUILD_TEMPLATE_FROM_SCRATCH",
            "Build HTML Template from Detailed Instructions",
            "Creates a custom HTML template based on detailed, step-by-step requirements provided by the user.",
            List.of("create", "html", "detailed"),
            "Template Creation/Modification",
            """
You are tasked with creating a professional HTML template based on the following detailed design specification. Ensure the final output is fully self-contained HTML with inline CSS.

# Template Design Specification

[...Provide your detailed design specification here, covering layout, sections, styling, content structure, etc...]

Generate only the complete HTML code based on the above instructions."""
        );
    }
}
