package com.flowkraft.ai.prompts;

import java.util.List;

/**
 * Immutable value type for a single AI prompt template.
 * The list endpoint strips promptText for bandwidth; the detail endpoint returns everything.
 */
public record PromptDefinition(
        String id,
        String title,
        String description,
        List<String> tags,
        String category,
        String promptText) {
}
