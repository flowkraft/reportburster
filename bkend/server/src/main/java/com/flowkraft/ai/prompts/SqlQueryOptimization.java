package com.flowkraft.ai.prompts;

import java.util.List;

public final class SqlQueryOptimization {

    private SqlQueryOptimization() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "SQL_QUERY_OPTIMIZATION",
            "Optimize SQL Query Performance",
            "Reviews and optimizes a provided SQL query for better performance",
            List.of("optimization", "performance", "analysis"),
            "SQL Writing Assistance",
            """
Analyze and optimize the following SQL query for improved performance:

Target Database Vendor: [DATABASE_VENDOR]

```sql
-- Paste your SQL query here
```

Please provide:
1. An optimized version of the query using vendor-idiomatic syntax for the Target Database Vendor specified above
2. Explanation of performance issues in the original query
3. The reasoning behind each optimization
4. Suggestions for adding appropriate indexes
5. Any vendor-specific optimization features (e.g., execution plan hints, vendor-specific index types, or query rewrite capabilities) that could help. If no vendor is specified, provide general optimization advice."""
        );
    }
}
