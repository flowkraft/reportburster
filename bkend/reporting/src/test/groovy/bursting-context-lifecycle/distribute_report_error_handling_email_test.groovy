def failJobIfAnyDistributionFails = ctx.settings.isFailJobIfAnyDistributionFails()

if (!failJobIfAnyDistributionFails)
{
    log.error("Error happened. Associated burst token: " + 
        ctx.token +", file path: '" + ctx.extractedFilePath + "'. " +
        "Processing will continue since 'failJobIfAnyDistributionFails' " +
        "configuration is 'false'.",ctx.getLastException())
}else
    throw ctx.getLastException()