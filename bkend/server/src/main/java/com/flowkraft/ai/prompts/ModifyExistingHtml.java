package com.flowkraft.ai.prompts;

import java.util.List;

public final class ModifyExistingHtml {

    private ModifyExistingHtml() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "MODIFY_EXISTING_HTML",
            "Modify Existing HTML Template",
            "Applies user-specified changes to a provided HTML template.",
            List.of("modify", "html", "customize"),
            "Template Creation/Modification",
            """
You are an HTML customization assistant. Your task is to take the **Customization instructions** provided below and apply them to the **Reference HTML template**. Generate the updated HTML code based on the instructions.

**Customization Instructions**

[...Provide your specific instructions here...]

**Reference HTML Template**

```html
[...Paste your existing HTML template code here...]
```

Output only the complete updated HTML template with the applied changes."""
        );
    }
}
