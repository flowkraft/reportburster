package com.flowkraft.ai.prompts;

import java.util.List;

public final class DbSchemaErDiagramPlantuml {

    private DbSchemaErDiagramPlantuml() {}

    public static PromptDefinition create() {
        return new PromptDefinition(
            "DB-SCHEMA-ER-DIAGRAM-PLANTUML",
            "Generate ER Diagram",
            "Converts a flat database schema into a comprehensive Entity-Relationship diagram using Chen Notation in PlantUML format.",
            List.of("database", "schema", "er-diagram"),
            "Database Schema",
            """
You are an expert Database Modeler and Visual Designer specializing in Entity-Relationship (ER) diagrams using PlantUML. Your mission is to transform a given flat JSON database schema into a complete, high quality ER diagram expressed in PlantUML syntax. This diagram must accurately represent every table, column, primary key, and foreign key as provided in the input JSON, using the stylistic conventions of PlantUML's crow's foot notation.

**INPUT:**

```json
[INSERT YOUR DATABASE SCHEMA HERE]
```

The above JSON object represents a MINIMAL "schema map" view of the database. Each table object contains ONLY:
- `tableName` — the table name.
- `tableType` — TABLE or VIEW.
- `primaryKeyColumns` — an array of primary-key column names.
- `foreignKeys` — an array of foreign-key definitions.

**A general list of columns is intentionally NOT provided.** This is a schema-map view used to draw a clean PK/FK-only ER diagram for database architects. Do NOT hallucinate or invent any columns that aren't in the input. Each entity block in your output must list ONLY:
1. The primary-key columns from `primaryKeyColumns` (prefixed with `+`), and
2. The foreign-key columns referenced in `foreignKeys` (plain, no prefix).

Do NOT add type annotations — types are not provided. Write `+CustomerID`, not `+CustomerID : INTEGER`.

**YOUR TASK:**

1. **Analyze the Schema:**
   - Examine each table's `primaryKeyColumns` and `foreignKeys` arrays.
   - Identify all relationships from the **explicit foreign key definitions** in each table's `foreignKeys` array.
   - **If the `foreignKeys` array is empty or incomplete for some tables, you MUST use your expertise as a Database Modeler to infer logical relationships from the table names and primary-key names.** Base these inferences on common naming conventions (e.g. an Orders table with a `CustomerID` PK/FK column implies a link to Customers.CustomerID). Ensure every logical relationship is captured.

2. **Translate to an ER Diagram Using PlantUML Crow's Foot Notation:**
   - For each table, create an entity using PlantUML's ERD syntax. Entity blocks must list:
     - **Every column from `primaryKeyColumns`** prefixed with `+` (e.g. `+CustomerID`).
     - **Every column from `foreignKeys[].fkColumnName`** as a plain attribute (no prefix).
     - **NOTHING ELSE** — no name, email, address, phone, status, etc.
   - **Do NOT add type annotations** — types are not provided. Write `+CustomerID`, not `+CustomerID : INTEGER`.
   - **CRITICAL — multi-FK tables:** if a table has multiple FKs (e.g. `Products` with both `CategoryID` and `SupplierID`), you MUST list ALL of them inside the entity block. Never deduplicate FK columns just because they appear in relationship line labels — both must be present inside the entity body AND on the relationship line.
   - Represent relationships using PlantUML's crow's foot notation (e.g., `OrderDetails }|--|| Orders : "OrderID"`). Ensure these relationships accurately reflect both explicit and inferred foreign keys.
   - Use `@startuml` and `@enduml` delimiters.
   - **CRITICAL — no invention:** Do not invent or hallucinate any columns. If a table has PK=CustomerID and no FKs, the entity block contains ONLY `+CustomerID`.

3. **Output Requirements:**
   - The output must be a single, self-contained PlantUML script that, when processed by a PlantUML renderer, displays the complete ER diagram.
   - The generated PlantUML script should contain only the PlantUML syntax necessary for the diagram definition and must exclude all explanatory comments.

**Example:**

```plantuml
@startuml
entity CUSTOMER {
  +CustomerID
}
entity CATEGORY {
  +CategoryID
}
entity SUPPLIER {
  +SupplierID
}
entity PRODUCT {
  +ProductID
  CategoryID
  SupplierID
}
entity ORDER {
  +OrderID
  CustomerID
}
entity ORDER_DETAILS {
  +OrderID
  +ProductID
}
ORDER }|--|| CUSTOMER : "CustomerID"
PRODUCT }|--|| CATEGORY : "CategoryID"
PRODUCT }|--|| SUPPLIER : "SupplierID"
ORDER_DETAILS }|--|| ORDER : "OrderID"
ORDER_DETAILS }|--|| PRODUCT : "ProductID"
@enduml
```

Notice how each entity block contains ONLY primary-key and foreign-key columns — no name, email, address, phone, or other attributes. **Notice also how `PRODUCT` lists BOTH `CategoryID` and `SupplierID` — every FK column must appear inside the owning entity block, even when there are multiple FKs.** This is the intended PK/FK-only schema-map view.

Produce a single, fully valid PlantUML script as your output that generates this ER diagram. Your goal is to reliably convert the input flat JSON database schema into a comprehensive and visually appealing ER diagram using PlantUML's crow's foot notation, with all logical relationships accurately depicted.

The generated PlantUML script should contain only the PlantUML syntax necessary for the diagram definition and must exclude all explanatory comments."""
        );
    }
}
