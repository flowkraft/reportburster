log.info("beforeTemplateProcessing_lifespan.groovy token: {}", ctx.token);
                
// Add a special test variable that will be visible in the template
ctx.variables.setUserVariable(ctx.token, "var10", "Yes")

// Modify Country variable to be uppercase for testing
if (ctx.variables.getUserVariables(ctx.token).containsKey("var2")) {
    String country = ctx.variables.getUserVariables(ctx.token).get("var2").toString()
    ctx.variables.setUserVariable(ctx.token, "var2", country.toUpperCase())
}