const gulp = require("gulp");

class TemplateNamespace {
  constructor(templates) {
    this.templates = templates;
  }

  getTemplate(templateName, params = {}) {
    const template = this.templates[templateName];
    if (!template) return null;
    return template(params);
  }
}

// Common template generator function
const generateSimilarFeatureTemplate = (
  type,
  { existingFeature, newFeature, existingPath, newPath },
) => {
  const templates = {
    backend: `
        Similar with the existing ${existingFeature}, implement ${newFeature} with:

        Backend requirements:
        1. Modify existing files:
           - src/main/java/com/reportburster/service/${existingPath}Service.java
             * Add new service methods
             * Integrate with existing validation
           - src/main/java/com/reportburster/config/SecurityConfig.java
             * Configure new endpoints security
           - src/main/resources/application.properties
             * Add new configuration settings

        2. Create new files (using existing as examples):
           - src/main/java/com/reportburster/controller/${newPath}Controller.java
             (similar to src/main/java/com/reportburster/controller/${existingPath}Controller.java)
           - src/main/java/com/reportburster/service/${newPath}Service.java
             (similar to src/main/java/com/reportburster/service/${existingPath}Service.java)
           - src/main/java/com/reportburster/dto/${newPath}Request.java
             (similar to src/main/java/com/reportburster/dto/${existingPath}Request.java)

        Testing requirements:
        1. Modify existing tests:
           - src/test/java/com/reportburster/service/${existingPath}ServiceTest.java

        2. Create new tests (using existing as examples):
           - src/test/java/com/reportburster/controller/${newPath}ControllerTest.java
             (similar to src/test/java/com/reportburster/controller/${existingPath}ControllerTest.java)
           - src/test/java/com/reportburster/service/${newPath}ServiceTest.java
             (similar to src/test/java/com/reportburster/service/${existingPath}ServiceTest.java)

        Consider:
        - API versioning
        - Request validation
        - Error handling
        - Transaction management
        - Security constraints
        - Performance optimization`,

    frontend: `
        Similar with the existing ${existingFeature}, implement ${newFeature} with:

        Frontend requirements:
        1. Modify existing files:
           - src/app/${existingPath}/${existingPath}.service.ts
             * Add new methods
           - src/app/shared/constants.ts
             * Add new constants
           - src/app/shared/types.ts
             * Add new interfaces

        2. Create new files (using existing as examples):
           - src/app/${newPath}/${newPath}.component.ts
             (similar to src/app/${existingPath}/${existingPath}.component.ts)
           - src/app/${newPath}/${newPath}.component.html
             (similar to src/app/${existingPath}/${existingPath}.component.html)
           - src/app/${newPath}/${newPath}.component.scss
             (similar to src/app/${existingPath}/${existingPath}.component.scss)
           - src/app/${newPath}/${newPath}.service.ts
             (similar to src/app/${existingPath}/${existingPath}.service.ts)

        Testing requirements:
        1. Modify existing tests:
           - src/app/${existingPath}/${existingPath}.service.spec.ts

        2. Create new tests (using existing as examples):
           - src/app/${newPath}/${newPath}.component.spec.ts
             (similar to src/app/${existingPath}/${existingPath}.component.spec.ts)
           - src/app/${newPath}/${newPath}.service.spec.ts
             (similar to src/app/${existingPath}/${existingPath}.service.spec.ts)

        Consider:
        - Component state management
        - Form validation
        - Error handling
        - Loading states
        - Accessibility
        - Responsive design`,

    end2end: `
        Similar with the existing ${existingFeature}, implement ${newFeature} with:

        Backend requirements:
        1. Modify existing files:
           - src/main/java/com/reportburster/service/AuthService.java
             * Add ${newPath} functionality
             * Integrate with existing validation
           - src/main/java/com/reportburster/config/SecurityConfig.java
             * Configure new endpoints security
           - src/main/resources/application.properties
             * Add new settings

        2. Create new files (using existing as examples):
           - src/main/java/com/reportburster/controller/${newPath}Controller.java
             (similar to src/main/java/com/reportburster/controller/${existingPath}Controller.java)
           - src/main/java/com/reportburster/service/${newPath}Service.java
             (similar to src/main/java/com/reportburster/service/${existingPath}Service.java)
           - src/main/java/com/reportburster/dto/${newPath}Request.java
             (similar to src/main/java/com/reportburster/dto/${existingPath}Request.java)

        Frontend requirements:
        1. Modify existing files:
           - src/app/auth/auth.service.ts
             * Add new methods
           - src/app/shared/constants.ts
             * Add new endpoints

        2. Create new files (using existing as examples):
           - src/app/${newPath}/${newPath}.component.ts
             (similar to src/app/${existingPath}/${existingPath}.component.ts)
           - src/app/${newPath}/${newPath}.component.html
             (similar to src/app/${existingPath}/${existingPath}.component.html)
           - src/app/${newPath}/${newPath}.service.ts
             (similar to src/app/${existingPath}/${existingPath}.service.ts)

        Testing requirements:
        1. Backend tests:
           - src/test/java/com/reportburster/controller/${newPath}ControllerTest.java
           - src/test/java/com/reportburster/service/${newPath}ServiceTest.java
        
        2. Frontend tests:
           - src/app/${newPath}/${newPath}.component.spec.ts
           - src/app/${newPath}/${newPath}.service.spec.ts

        Consider:
        - Security best practices
        - Error handling
        - User feedback
        - Accessibility
        - Documentation
        - Testing coverage`,

    asbl: `
        Similar with the existing ${existingFeature}, implement ${newFeature} with:

        Assembly/Packaging requirements:
        1. Modify existing files:
           - src/asbl/pom.xml
             * Add new dependencies
             * Update build configuration
           - src/asbl/assembly/${existingPath}-assembly.xml
             * Add new assembly descriptors
           - src/asbl/scripts/windows/${existingPath}.bat
             * Update environment variables
           - src/asbl/scripts/linux/${existingPath}.sh
             * Update shell scripts

        2. Create new files (using existing as examples):
           - src/asbl/assembly/${newPath}-assembly.xml
             (similar to src/asbl/assembly/${existingPath}-assembly.xml)
           - src/asbl/scripts/windows/${newPath}.bat
             (similar to src/asbl/scripts/windows/${existingPath}.bat)
           - src/asbl/scripts/linux/${newPath}.sh
             (similar to src/asbl/scripts/linux/${existingPath}.sh)
           - src/asbl/config/${newPath}.properties
             (similar to src/asbl/config/${existingPath}.properties)

        Testing requirements:
        1. Modify existing tests:
           - src/asbl/test/assembly/${existingPath}Test.java
             * Update assembly verification tests
           - src/asbl/test/scripts/ScriptTest.java
             * Add new script validation

        2. Create new tests:
           - src/asbl/test/assembly/${newPath}Test.java
             (similar to src/asbl/test/assembly/${existingPath}Test.java)

        Consider:
        - Cross-platform compatibility
        - Resource packaging
        - File permissions
        - Installation paths
        - Upgrade scenarios
        - Rollback procedures`,

    e2e: `
        Similar with the existing ${existingFeature}, implement ${newFeature} with:

        Playwright E2E Test requirements:
        1. Modify existing files:
           - e2e/test-data/${existingPath}.json
             * Add new test data
           - e2e/page-objects/${existingPath}.page.ts
             * Update page object methods
           - e2e/fixtures/${existingPath}.fixture.ts
             * Add new test fixtures

        2. Create new files (using existing as examples):
           - e2e/tests/${newPath}.spec.ts
             (similar to e2e/tests/${existingPath}.spec.ts)
           - e2e/page-objects/${newPath}.page.ts
             (similar to e2e/page-objects/${existingPath}.page.ts)
           - e2e/fixtures/${newPath}.fixture.ts
             (similar to e2e/fixtures/${existingPath}.fixture.ts)
           - e2e/test-data/${newPath}.json
             (similar to e2e/test-data/${existingPath}.json)

        Test scenarios:
        1. Happy path flows
        2. Error handling
        3. Edge cases
        4. Visual regression tests

        Consider:
        - Cross-browser testing
        - Mobile responsiveness
        - Network conditions
        - Screenshot comparisons
        - Performance metrics
        - CI/CD integration`,

    robot: `
        Similar with the existing ${existingFeature}, implement ${newFeature} with:

        Robot Framework UAT requirements:
        1. Modify existing files:
           - robot/resources/${existingPath}_keywords.robot
             * Add new keywords
           - robot/variables/${existingPath}_variables.robot
             * Update test variables
           - robot/config/environments.robot
             * Add new environment configs

        2. Create new files (using existing as examples):
           - robot/tests/${newPath}.robot
             (similar to robot/tests/${existingPath}.robot)
           - robot/resources/${newPath}_keywords.robot
             (similar to robot/resources/${existingPath}_keywords.robot)
           - robot/variables/${newPath}_variables.robot
             (similar to robot/variables/${existingPath}_variables.robot)
           - robot/test-data/${newPath}.json
             (similar to robot/test-data/${existingPath}.json)

        Test scenarios:
        1. Business acceptance criteria
        2. User journey flows
        3. System integration checks
        4. Data validation tests

        Consider:
        - Test tags and metadata
        - Custom libraries
        - Test documentation
        - Report generation
        - Jenkins integration
        - Parallel execution`,
  };

  return templates[type];
};

// Template namespaces for different domains
const promptTemplates = {
  asbl: new TemplateNamespace({
    similarFeature: ({ existingFeature, newFeature }) =>
      generateSimilarFeatureTemplate("asbl", {
        existingFeature,
        newFeature,
        existingPath: "desktop",
        newPath: "server",
      }),
    createService: ({ serviceName, functionality }) => `
            Create a new service for ${serviceName} with the following functionality:
            
            Requirements:
            ${functionality}
            
            Please include:
            - Service class definition
            - Required dependencies
            - Core methods
            - Error handling
            - Basic documentation
        `,
    updateLogic: ({ component, requirement }) => `
            Update the business logic for ${component} to implement:
            
            New Requirements:
            ${requirement}
            
            Consider:
            - Backward compatibility
            - Error scenarios
            - Performance impact
        `,
  }),

  bkend: new TemplateNamespace({
    similarFeature: ({ existingFeature, newFeature }) =>
      generateSimilarFeatureTemplate("backend", {
        existingFeature,
        newFeature,
        existingPath: "Auth",
        newPath: "User",
      }),
    createEndpoint: ({ endpointPath, method, params }) => `
            Create a new API endpoint:
            Path: ${endpointPath}
            Method: ${method}
            
            Parameters:
            ${params}
            
            Include:
            - Request/Response DTOs
            - Validation rules
            - Error responses
            - OpenAPI documentation
        `,
  }),

  frend: new TemplateNamespace({
    similarFeature: ({ existingFeature, newFeature }) =>
      generateSimilarFeatureTemplate("frontend", {
        existingFeature,
        newFeature,
        existingPath: "auth",
        newPath: "user",
      }),
    createComponent: ({ componentName, features, props }) => `
            Create a new Angular component: ${componentName}
            
            Features:
            ${features}
            
            Props Interface:
            ${props}
            
            Include:
            - TypeScript types
            - Styling approach
            - Unit test structure
            - Documentation
        `,
  }),

  end2end: new TemplateNamespace({
    similarFeature: ({ existingFeature, newFeature }) =>
      generateSimilarFeatureTemplate("end2end", {
        existingFeature,
        newFeature,
        existingPath: "auth",
        newPath: "user",
      }),
  }),

  e2e: new TemplateNamespace({
    similarFeature: ({ existingFeature, newFeature }) =>
      generateSimilarFeatureTemplate("e2e", {
        existingFeature,
        newFeature,
        existingPath: "login",
        newPath: "user-profile",
      }),
  }),

  robot: new TemplateNamespace({
    similarFeature: ({ existingFeature, newFeature }) =>
      generateSimilarFeatureTemplate("robot", {
        existingFeature,
        newFeature,
        existingPath: "login",
        newPath: "user-profile",
      }),
  }),
};

// Helper function to get a template from any namespace
function getPromptTemplate(namespace, templateName, params = {}) {
  const namespaceObj = promptTemplates[namespace];
  if (!namespaceObj) {
    throw new Error(`Namespace '${namespace}' not found`);
  }
  const template = namespaceObj.getTemplate(templateName, params);
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found in namespace '${namespace}'`,
    );
  }
  return template;
}

// Gulp tasks
gulp.task("aider:get-template", async (done) => {
  try {
    const result = getPromptTemplate(
      process.env.NAMESPACE,
      process.env.TEMPLATE,
      JSON.parse(process.env.PARAMS || "{}"),
    );
    console.log(result);
    done();
  } catch (error) {
    done(error);
  }
});

gulp.task("aider:list-templates", (done) => {
  Object.entries(promptTemplates).forEach(([namespace, templates]) => {
    console.log(`\n${namespace} templates:`);
    Object.keys(templates.templates).forEach((templateName) => {
      console.log(`  - ${templateName}`);
    });
  });
  done();
});

gulp.task("aider", gulp.series("aider:list-templates"));

module.exports = {
  promptTemplates,
  getPromptTemplate,
};
