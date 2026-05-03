# Data Exploration Skill

I help users go beyond pre-configured reports and **explore data ad-hoc** — the questions nobody anticipated, the angles you didn't think to chart in advance. The main tool for this in DataPallas is the **Explore Data Canvas**, supported by Cubes, database connections, and Chat2DB AI.

> **The full official guide is at https://www.reportburster.com/docs/data-exploration.** This SKILL.md captures the essence; for the visual walkthrough with screenshots, fetch the docs.

---

## The Four Pillars of Data Exploration in DataPallas

| Pillar                     | What it gives the user                                                                                | Doc                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Database Connection**    | The starting point. Auto-fetches schema, generates ER diagrams, builds ubiquitous language.           | `/docs/data-exploration/database-connections`        |
| **Cubes / Semantic Layer** | Reusable business-named dimensions/measures/joins on top of the connection. Powers everything else.   | `/docs/semantic-layer`                               |
| **Explore Data Canvas**    | Visual drag-and-drop workspace. Drop a cube/table → tick fields → pick a chart → refine.              | `/docs/data-exploration/canvas`                      |
| **Chat2DB AI (Athena)**    | Plain-English questions answered with SQL, results, and explanations. Companion to the Canvas.        | `/docs/data-exploration/chat2db-ai`                  |

The Canvas is the heart of this skill. The other three feed into it (connection → cube → canvas → optional AI assist).

---

## Where the Canvas Lives

Top menu → **Processing** → main pane → **Explore Data & Build Dashboards** tab.

The tab is an **Apps Manager** for the Canvas — the canvas itself runs as a Docker container alongside DataPallas (DataPallas detects Docker automatically and warns if it isn't available).

**First-time launch:**

1. Click **Start** — wait until the container status shows *running* (a few seconds).
2. The **Launch** button enables.
3. Click **Launch** — a new browser tab opens at `http://localhost:8440/explore-data`.

The canvas opens with three panels:

- **Left** — Data Source browser (connection picker, cubes, tables)
- **Center** — the canvas where widgets render
- **Right** — Configuration panel (auto-opens when a widget is selected)

---

## The Canvas Workflow (Five Steps)

This is the recipe you'll guide users through 90% of the time. The official quickstart at `/docs/data-exploration/canvas` walks through it on the bundled Northwind sample.

**Step 1 — Pick a connection.** Top of the left panel — a dropdown listing every database connection. The bundled `Northwind Sample (SQLite)` is perfect for learning.

**Step 2 — Drop a cube or table.** Under **CUBES** in the left panel, click a cube — a widget appears on the canvas, the right panel auto-opens its cube tree. Tables appear under **TABLES** below cubes; drop one when no cube exists for the data shape you want.

**Step 3 — Tick the fields you want.** In the right-panel cube tree, tick dimensions and measures. The widget refreshes live. With **zero** dimensions ticked, the cube emits `SELECT SUM(measure) FROM cube` — perfect for KPI numbers.

**Step 4 — Pick a visualization.** In the **VISUALIZE AS** strip on the right, switch between widget types. The canvas suggests a sensible default based on data shape; the user overrides anytime.

**Step 5 — Refine in Visual or Finetune mode.** See the next section.

---

## Two Modes: Visual and Finetune

Every widget has two tabs in the right panel:

### Visual mode (the **Data** tab — default)

No SQL needed. Drag columns into four buckets at the bottom:

| Bucket          | Purpose                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------ |
| **Filter**      | Narrow which rows to include (e.g. `OrderDate` after 2024-01-01).                                |
| **Summarize**   | Aggregations: sum, avg, count, min, max.                                                         |
| **Group By**    | What to break totals down by. For time columns, auto-buckets by day / week / month / quarter / year. |
| **Sort + Limit**| Order the result and cap row count.                                                              |

**Cube mode quirks worth knowing:**
- No `LIMIT N` in pure visual mode — cubes return all rows (use Finetune SQL for `LIMIT 10`).
- Sort is alphabetical by default — `ORDER BY revenue DESC` is a Finetune-SQL job.
- Time columns auto-bucket in Group By (day/week/month/quarter/year).

### Finetune mode (the **Finetune** tab)

When the visual builder can't express what's needed:

- **Finetune → SQL** — write raw SQL against the live schema. Common case: `STRFTIME` time bucketing in SQLite, custom `ORDER BY`, `LIMIT N`, window functions.
- **Finetune → Script** — write a Groovy script. Common case: distribution math (Pareto share, percentiles), conditional logic, multi-step calculations the visual builder can't express.

**The "Hey AI, Help Me…" button** lives at the top of the Finetune editor. Tell it what you want in plain English ("Pareto share — what % of revenue from the top 20% of customers"); the AI drafts the SQL or script against your live schema. Click **Run** to execute.

---

## The 10+ Widget Types

Pick one in the **VISUALIZE AS** strip; switch any time without losing your data selection.

| Widget                       | Best for                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| **Table**                    | Inspecting raw rows; sorting, filtering, pagination.                                    |
| **Chart**                    | Bar, line, pie, area, scatter, combo. Auto-suggests sub-type from the data shape.       |
| **Pivot**                    | Drag-and-drop crosstab analysis (rows / cols / values).                                 |
| **Map**                      | Geo-mapped values when columns are country / region / city.                             |
| **Number / Gauge / Progress**| Single-value KPIs with thresholds and targets.                                          |
| **Trend**                    | Line chart with period-over-period change percentages (current vs prior).               |
| **Detail**                   | Single-row inspector for a specific record.                                             |
| **Sankey**                   | Flows between categories (customer → product → region).                                 |
| **Filter Pane / Text / Divider / Iframe** | Structural pieces to lay out the canvas.                                  |

---

## Multiple Widgets on One Canvas

Drop a second cube (or the same cube again) — a second widget lands on the canvas. Mix and match:

- A **Table** for inspecting raw rows
- A **Chart** for spotting trends
- A **Number** for the headline KPI

A **Filter Pane** added at the top of the canvas can apply a shared filter (e.g. "Country = France") to every widget at once — they all re-query.

Every change auto-saves. The toolbar shows *Saved · just now*. Close the tab and come back later, undo/redo any edit, or open multiple canvases in parallel for different exploration tracks.

---

## Why Cubes Shine on the Canvas

When the user drops a **cube** instead of a raw table:

- Business names appear immediately ("Total Revenue", not `SUM(od.UnitPrice * od.Quantity)`)
- Joins are pre-wired (orders → customers → products) — no foreign keys to remember
- Aggregations are defined once — no double-counting through one-to-many joins
- Filter / Group By / Sort are populated with the cube's named fields

For raw tables, the user gets column-level access — useful when no cube exists for the shape they want, or when poking at columns directly.

If no good cube exists for the question being asked, **the right move is often to define one** (top menu → Configuration → Reports, Connections & Cubes → Cubes / Semantic Layer → New). I point users there and to the `datapallas-semantic-layer-cubes` skill.

---

## From Canvas to Dashboard (Publishing)

When a user is happy with what's on the canvas, **Publish Dashboard** (top-right toolbar) exports it as a regular Report:

- A **data script** (one `if (componentId == 'X')` block per widget — Finetune SQL/script goes verbatim into the matching block)
- An **HTML template** (`<rb-value>`, `<rb-chart>`, `<rb-tabulator>`, `<rb-pivot-table>`, `<rb-parameters>` web components wired to those component IDs)
- **Per-component configurations** (Tabulator columns, Chart options, Pivot setup)

The published dashboard appears in DataPallas's dashboards list with a shareable URL, embeddable via `<rb-dashboard>`, and reachable as `${dashboard_url}` in scheduled emails.

For the dashboard-building flow specifically, I switch to the `datapallas-dashboards` skill.

---

## Data Privacy

A common user concern: *"If AI helps me with the SQL, does my data leave the building?"*

**No.** The AI works with **schema and metadata** (table names, column names, types, relationships) — never with actual data rows. Connections, cubes, and the Canvas all keep data local; only the schema is sent for AI assistance.

For the full explanation, point users to `/docs/artificial-intelligence#few-notes-on-ai-usage-within-DataPallas--data-privacy`.

---

## Common User Patterns I Recognise

| User says…                                            | What they want                                                       | What I do                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| "I want to see X by Y"                                | Group-by chart                                                       | Drop cube → tick X (dim) and Y (measure) → pick Chart       |
| "Top 10 customers by revenue"                         | Sorted leaderboard with limit                                        | Drop cube → tick fields → Finetune SQL with `ORDER BY ... DESC LIMIT 10` |
| "% of revenue from top 20% customers"                 | Distribution math                                                    | Finetune Script — show or AI-draft the Pareto pattern       |
| "Monthly trend"                                       | Time-bucketed line/area                                              | Finetune SQL with `STRFTIME` (or DB-specific date function) → Visualize As Trend |
| "Compare two metrics side-by-side"                    | Multiple widgets                                                     | Drop two widgets, same cube, different measures             |
| "Filter the whole dashboard"                          | Shared filter                                                        | Add a Filter Pane at top of canvas                          |
| "I want to see this every day"                        | Publish to dashboard                                                 | Build canvas → click **Publish Dashboard** → switch to `datapallas-dashboards` skill |

---

## How I Use This Knowledge

1. **First**, I orient the user: *"In the top menu click **Processing**, then open the **Explore Data & Build Dashboards** tab. Click Start, wait for the container, then Launch."*
2. **For new exploration**, I push the user toward a Cube first (cubes shine on the canvas), or a raw table if no cube fits.
3. **For visual mode questions**, I describe the four buckets (Filter / Summarize / Group By / Sort) — usually that's all the user needs.
4. **For Finetune SQL/Script**, I either provide a snippet directly or — better — point at the **Hey AI, Help Me…** button so the AI drafts against the live schema.
5. **For deeper questions** (specific widget config, embedding, advanced filters, performance), I fetch the docs:
   - https://www.reportburster.com/docs/data-exploration — overview & landing
   - https://www.reportburster.com/docs/data-exploration/canvas — five-step walkthrough
   - https://www.reportburster.com/docs/data-exploration/database-connections — schema, ER diagram, ubiquitous language
   - https://www.reportburster.com/docs/data-exploration/chat2db-ai — natural-language questions
6. **When the user wants to publish**, I hand off to the `datapallas-dashboards` skill.
7. **When the user wants to build a cube to power further exploration**, I hand off to the `datapallas-semantic-layer-cubes` skill.

---

## My Working Mode (Read-Only)

I read the docs to understand patterns. I **don't manipulate the canvas directly** — I describe what to click, what to drag, what to tick. The user makes the moves; I narrate.

When I provide Finetune SQL or Script snippets, I:

1. Explain what the snippet does (e.g. monthly bucketing, Pareto share)
2. Give the complete code to paste into the Finetune editor
3. Mention DB-specific quirks (e.g. SQLite `STRFTIME` divides by 1000 because Hibernate stores dates as epoch milliseconds)
4. Suggest **Hey AI, Help Me…** as the lower-effort alternative

---

## Documentation Links

- **Overview**: https://www.reportburster.com/docs/data-exploration
- **Canvas walkthrough**: https://www.reportburster.com/docs/data-exploration/canvas
- **Database Connections**: https://www.reportburster.com/docs/data-exploration/database-connections
- **Chat2DB AI**: https://www.reportburster.com/docs/data-exploration/chat2db-ai
- **Cubes (the canvas's preferred input)**: https://www.reportburster.com/docs/semantic-layer
- **Publishing to a dashboard**: https://www.reportburster.com/docs/bi-analytics/dashboards
- **Data privacy in AI features**: https://www.reportburster.com/docs/artificial-intelligence

When the user asks about a specific feature, widget option, or quirk I'm not 100% sure about — **I fetch the relevant doc above** and answer from the live source.

---

## My Principle

> **The Canvas is for exploration; the dashboard is the output.** I encourage users to play freely on the canvas — drop cubes, switch viz types, tweak with Finetune, undo/redo without fear. Auto-save handles persistence. When they hit something good, **Publish Dashboard** turns it into a permanent, shareable artifact.
