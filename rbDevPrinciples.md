**ReportBurster Development Principles**

1.  **Above all, simplicity and pragmatism trump everything.**  
    *  Prefer the most straightforward, to‑the‑point solution that gets the job done.  
    *  Change only what is strictly required for the task; avoid touching unrelated lines or files.  
    *  Before finishing, ask: "could this be done even simpler?"

2.  **Continuous Delivery (Dave Farley) — key practical principles**  
    *  Small, releasable changes: make changes minimal and independently deployable so releases become routine.  
       - What to do: break work into tiny increments, keep PRs small.  
       - Why: reduces risk, simplifies rollback and speeds feedback.  
    *  Fast, automated feedback (build, test, deploy): automate the pipeline end-to-end so every change gets immediate verification.  
       - What to do: run unit, integration, and fast E2E checks in CI; gate merges on green pipelines; deploy to staging automatically.  
       - Why: catches regressions early and keeps confidence high for frequent releases.  
    *  Keep the mainline healthy; use feature toggles not long-lived branches: prefer trunk-based development with toggles to decouple deployment from feature release.  
       - What to do: merge frequently to main/trunk, use short-lived branches only when unavoidable, protect main with fast CI gates, and use feature flags for incomplete work.  
       - Why: reduces merge pain, prevents drift, and enables safe incremental rollout.

3.  **Embrace the Twelve-Factor App Methodology:**  
    *  Follow Twelve-Factor principles to ensure apps are portable, configurable, and scalable.  
    *  This supports repeatable deploys, clear config separation, and simpler operational practices.

4.  **Dependency Management:**  
    *  Minimize unnecessary dependencies.  
    *  Avoid redundant libraries that duplicate functionality.  
    *  Regularly review all `pom.xml` files and `package.json` to remove duplicates and reduce attack surface and maintenance cost.

5.  **Code Complexity and Structure:**  
    *  Keep code complexity appropriate and intent-revealing.  
    *  Organize code into meaningful packages, modules and classes.  
    *  Ensure functions and components have a well-defined purpose and are not overly granular or tangled.

6.  **Domain-Driven Design (DDD) — Naming, Packages & API design:**  
    *  Naming: use clear, semantic, functionally meaningful names across Java, APIs and frontend artifacts.  
    *  Package/module structure: organize packages and Angular modules to reflect domain boundaries and responsibilities.  
    *  API design: prefer balanced granularity — avoid tiny trivial endpoints and avoid monolith/god-like APIs. Design clear contracts and version breaking changes.

7.  **Component-based webapp (lego-like):**  
    *  Build the UI as meaningful, independent components that are easy to start, test and validate in isolation.  
    *  Provide small fixtures/stubs and clear inputs/outputs; keep UI behavior self-contained and expose simple integration points.  
    *  Prefer component-local state or well-scoped stores per functional area; if a global state is used, partition it per area.
    *  If done well, this reduces coupling, improves maintainability, and enables easy isolated testing of components using tools like Storybook (or similar).

8.  **Frontend - Bootstrap & AdminLTE Code Isolation:**  
    *  Isolate Bootstrap- and AdminLTE-related code so upgrades or replacements are low friction.  
    *  When full isolation isn't feasible, structure code to simplify searching, replacing and grepping.
    *  If done well, this reduces coupling, improves maintainability, and enables near‑effortless upgrades (e.g. Bootstrap 3 → Bootstrap 5) or migration to alternative CSS frameworks such as Tailwind CSS (with DaisyUI) or ShadCN UI.

9.  **Electron Code Minimization:**  
    *  Keep Electron-specific code to an absolute minimum.  
    *  (Re)question the necessity of each Electron-only features and prefer server-side or web implementations (Spring Boot, APIs) where practical.
    *  If done well, this reduces complexity and improves maintainability — and enables near-effortless migration to alternative desktop frameworks (for example, Tauri) or pure web deployments when a different approach is preferable.

10. **E2E / UAT runtime and optimisation:**  
    *  The full E2E suite (100+ Playwright tests) and Robot Framework UATs can take many hours; aim to reduce unnecessary duplication while keeping coverage.  
    *  Practical guidance: identify duplicated flows and consolidate, tag/group tests for focused runs, evaluate parallel execution/headless runners, stub expensive external calls, and optimize waits/timeouts and shared setup.  
    *  Keep long, comprehensive suites for pre-release/nightly pipelines and provide fast focused subsets for development.

11. **Testing & Quality Gates (operational guidance):**  
    *  Gate merges with unit tests, static analysis and fast integration checks.  
    *  Use Playwright for critical cross-browser E2E flows and Robot Framework for business UAT scenarios.  
    *  Keep test data deterministic with fixtures/factories and isolated test databases.

12. **Operational readiness & releases:**  
    *  For each release include DB migrations with rollback notes, performance implications, required feature flags and monitoring dashboards/alerts.  
    *  Define SLOs for new services and create dashboards/alerts prior to production rollout.

13. **Practical development hygiene:**  
    *  Keep PRs small and focused; include tests and a short description of the change and its impact.  
    *  Use static analysis tools (SpotBugs/ErrorProne, ESLint/Prettier, PHPStan where applicable).  
    *  Prefer incremental refactors that minimize collateral changes.

14. **Security & data handling:**  
    *  Validate and sanitize inputs at every boundary; follow OWASP basics.  
    *  Minimize logging of PII, encrypt sensitive data at rest, and apply least-privilege access controls.  
    *  Ensure UAT datasets are scrubbed/masked and do not contain production PII.

IMPORTANT: These principles are ordered so that implementing items near the top (simplicity, CD practices, Twelve-Factor, dependency discipline) will deliver large leverage and make the subsequent, more specific goals (component isolation, test optimisation, E2E flows) easier to achieve with minimal extra work.