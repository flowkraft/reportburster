**ReportBurster Development Principles**

1.  **Embrace the Twelve-Factor App Methodology:** Adhere to the principles of the Twelve-Factor App methodology to ensure a robust and scalable application.

2.  **Dependency Management:**
    *   Minimize unnecessary dependencies.
    *   Avoid redundant dependencies that provide similar functionalities.
    *   Regularly review `pom.xml` and `package.json` files to identify and eliminate duplicate libraries.

3.  **Electron Code Minimization:**
    *   Get Electron-specific code to the absolute minimum.
    *   Before implementing Electron-specific features, question their necessity.
    *   Consider alternative implementations using Spring Boot or other server-side technologies.

4.  **Domain-Driven Design (DDD) - Naming Conventions:**
    *   Employ clear, semantic, and functionally meaningful names for all elements, including Java classes, functions, API endpoints, and Angular components.
    *   Strive for a consistent and coherent naming scheme across the entire application stack (frontend to backend), reflecting the functional purpose of each element.

5.  **Domain-Driven Design (DDD) - Package and Module Structure:**
    *   Organize Java packages and Angular modules/folders effectively.
    *   Use descriptive and well-defined names for packages and modules to reflect their contents.

6.  **Domain-Driven Design (DDD) - API Design:**
    *   Design APIs with a balanced approach.
    *   Avoid creating an excessive number of APIs for trivial tasks.
    *   Also, avoid "god-like" APIs that handle too many responsibilities.
    *   Aim for an appropriate level of granularity in API design.

7.  **Code Complexity and Structure:**
    *   Maintain an appropriate level of code complexity.
    *   Organize code into meaningful packages and classes.
    *   Ensure that functions have a well-defined purpose and are neither too granular nor overly complex.

8.  **Component-based webapp (lego-like):**
    *  Build the webapp as a set of meaningful, functionally independent components that are easy to start, test, and validate in isolation (component-driven development).
    *  Provide small fixtures/stubs and clear inputs/outputs for each component, keep UI and behavior self-contained, and expose simple integration points.
    *  Design components so they are easy to test with tools like Storybook — this is about following a few simple principles (isolation, fixtures, mocks, clear APIs), not about the specific Storybook tool.
    *  State guidance: prefer component-local state or well-scoped stores per functional area rather than one large global JSON for the whole UI. If a global state is used, structure it as separate areas mapped to components so each component can operate and be tested independently.

9.  **Frontend - Bootstrap Code Isolation:**
    *   Isolate Bootstrap-related code as much as possible.
    *   If isolation is not entirely feasible, write the code in a way that facilitates easy migration, upgrade, or replacement.
    *   Employ patterns that simplify searching, replacing, and grepping.

10.  **Frontend - AdminLTE Code Isolation:**
    *   Isolate AdminLTE-related code as much as possible.
    *   If isolation is not entirely feasible, write the code in a way that facilitates easy migration, upgrade, or replacement.
    *   Employ patterns that simplify searching, replacing, and grepping.

11.  **E2E / UAT runtime and optimisation:**
    *  The full E2E suite (100+ Playwright tests) takes many hours to complete; Robot Framework UATs also take considerable time (less than E2E but still significant).
    *  The same E2E set runs against both the Electron packaged app and the Web App and is long in both contexts.
    *  This runtime is mainly due to many comprehensive use-cases being exercised (which is desirable), but there is value in investigating and reducing unnecessary duplication.
    *  Practical guidance: identify duplicated flows across tests and consolidate them, group or tag tests to run focused subsets during development, evaluate parallel execution and headless runners, minimize expensive external calls with stubs/mocks, and optimize waits/timeouts and shared setup to reduce overall execution time while preserving coverage for releases.