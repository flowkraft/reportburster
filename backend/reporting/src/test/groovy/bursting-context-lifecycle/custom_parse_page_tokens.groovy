import org.apache.commons.lang3.StringUtils

ctx.currentPageTokens = StringUtils.substringsBetween(ctx.currentPageText, ctx.settings.getStartBurstTokenDelimiter(),
	ctx.settings.getEndBurstTokenDelimiter())

if (ctx.currentPageTokens == null || ctx.currentPageTokens.length == 0)
  ctx.currentPageTokens = ["invalid-burst-token"]