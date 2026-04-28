package com.flowkraft.ai.prompts;

import java.util.List;

public final class ReplicateDesignFromScreenshot {

    private ReplicateDesignFromScreenshot() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "REPLICATE_DESIGN_FROM_SCREENSHOT",
            "Replicate Design from Screenshot",
            "Generates HTML code attempting to match the design shown in an uploaded screenshot.",
            List.of("visual", "replicate", "html"),
            "Template Creation/Modification",
            "Recreate the identical design as shown in the provided image as HTML. Return fully self-contained HTML code with inline CSS—no partial or snippet formats."
        );
    }
}
