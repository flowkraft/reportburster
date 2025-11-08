## **ReportBurster Development Principles**

1. **Solve the real request — prioritize delivering the intended outcome.**  
    * Ensure the offered solution (often code) truly solves the user's original need, not just the surface symptom.  
    * Ask: "Does this genuinely fulfill the request in the spirit it was asked?"  
    * Prefer pragmatic completeness: choose a clear, correct fix over a tiny patch that leaves follow-up work.

2. **Above all, simplicity and pragmatism trump everything.**  
    * Prefer the most straightforward, to‑the‑point solution that gets the job done.  
    * Follow the KISS principle — *Keep It Simple, Stupid*. Simplicity improves readability, changeability and long‑term safety.  
    * Favor clarity over cleverness — readable code is maintainable code.  
    * Change only what is strictly required; avoid touching unrelated lines or files.  
    * Decision rule: prefer the simplest change that fully solves the request; if simplicity cannot deliver the intended outcome, expand scope pragmatically and document the rationale and tests showing completeness.  
    * Before finishing, ask: "could this be done even simpler?"

3. **Everyday Development Practices:**  
    * **Code hygiene:** Keep PRs small and focused; include tests and clear change descriptions.  
    * **Static analysis:** Use SpotBugs/ErrorProne, ESLint/Prettier, PHPStan to catch issues early.  
    * **Dead code elimination:** Remove unused folders, files and code regularly.  
    * **SOLID:** Aim for Single Responsibility, Open/Closed, Liskov, Interface Segregation and Dependency Inversion where they make designs clearer.  
    * **Incremental refactoring:** Make small, targeted changes to minimize collateral impact.  
    * **Balance DRY and YAGNI:** Extract clear, well‑named abstractions when they reduce maintenance cost; otherwise prefer readable duplication to premature or confusing generalisation.  
    * **Understandability as a habit:** Write code others can easily read and reason about.

4. **Code Complexity and Structure:**  
    * Keep complexity appropriate and intent‑revealing; organize code into meaningful packages, modules and classes.  
    * Ensure functions and components have a clear purpose and are not overly tangled.  
    * Favor understandable, expressive and modular code. Use the C4 model to communicate structure across levels.

5. **Domain-Driven Design (DDD) — Naming, Packages & API design:**  
    * Use clear, semantic names and package/module boundaries that reflect domain responsibilities.  
    * Design APIs with balanced granularity; avoid trivial endpoints and monolithic god‑APIs. Version breaking changes clearly.  
    * Naming and structure are essential to clarity — choose names that reveal intent.

6. **Dependency Management:**  
    * Minimize and review dependencies regularly; remove redundant libraries.  
    * Keep major frameworks reasonably current (~2 years preferred); plan upgrades for large framework deps to avoid downstream drift.  
    * Regularly review pom.xml and package.json files to reduce attack surface and maintenance cost.

7. **Component-based webapp (lego-like):**  
    * Build the UI as independent components with clear inputs/outputs and small fixtures/stubs for testing.  
    * Prefer component-local state or well-scoped stores; partition global state by area when necessary.  
    * Well-scoped components reduce coupling and enable isolated testing (e.g., Storybook).

8. **Frontend — Bootstrap & AdminLTE Code Isolation:**  
    * Isolate framework-specific code so upgrades or replacements are low friction.  
    * When full isolation isn't feasible, structure code to simplify searching and replacing.

9. **Electron Code Minimization:**  
    * Keep Electron-specific code minimal. Reevaluate Electron-only features and prefer web/server solutions where practical.  
    * Minimizing Electron code reduces complexity and eases migration (e.g., to Tauri or pure web).

10. **Continuous Delivery (Dave Farley) — key practical principles**  
    * Small, releasable changes: break work into tiny increments and keep PRs small.  
    * Fast, automated feedback: run unit, integration and fast E2E in CI and gate merges on green.  
    * Keep mainline healthy: prefer trunk-based development and feature toggles over long-lived branches.

11. **Embrace the Twelve-Factor App Methodology:**  
    * Apply the Twelve-Factor principles for portability, clear config separation and repeatable deploys (codebase, dependencies, config, backing services, build/release/run, processes, port binding, concurrency, disposability, dev/prod parity, logs, admin processes).

12. **Testing & Quality Gates (operational guidance):**  
    * Gate merges with unit tests, static analysis and fast integration checks.  
    * Use Playwright for primary business E2E flows; reserve Robot Framework for a minimal UAT smoke set that verifies packaged app runtime.  
    * Keep test data deterministic with fixtures/factories and isolated test databases.

13. **E2E / UAT runtime and optimisation:**  
    * Reduce duplication, tag/group tests for focused runs, parallelize where safe, and stub expensive external calls.  
    * Keep long suites for nightly/pre-release and fast subsets for development. Quarantine known flakies and capture traces/screenshots/videos on failure.  
    * Prefer stable selectors and explicit synchronization; avoid pervasive arbitrary sleeps.

14. **Release readiness:**  
    * Include DB migrations with rollback steps and performance notes.  
    * Add basic monitoring for new services and document any feature flags required for the release.  
    * Provide a short release checklist with acceptance tests and rollback criteria.

15. **Security essentials:**  
    * Validate inputs at system boundaries (OWASP), encrypt sensitive data at rest, limit PII logging and enforce least privilege.  
    * Mask or scrub test data to remove production PII.  
    * Review third‑party deps for vulnerabilities and apply security fixes promptly.

IMPORTANT: These principles are ordered to reflect practical development flow: start with core philosophy and daily coding fundamentals, progress through structure and domain concerns, then address methodologies, quality, release and security practices.