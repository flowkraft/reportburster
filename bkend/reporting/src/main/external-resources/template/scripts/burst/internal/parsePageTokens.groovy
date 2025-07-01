import java.io.File

import org.apache.commons.lang3.StringUtils
import com.sourcekraft.documentburster.utils.Utils

//normal processing
if ((new File (ctx.configurationFilePath)).exists() && !ctx.configurationFilePath.contains (Utils.SPLIT_2ND_TIME)) {
	ctx.currentPageTokens = StringUtils.substringsBetween(ctx.currentPageText, ctx.settings.getStartBurstTokenDelimiter(),
		ctx.settings.getEndBurstTokenDelimiter())
}
//Pdf2ndTimeSplitter processing
else if (!(new File (ctx.configurationFilePath)).exists() && ctx.configurationFilePath.contains (Utils.SPLIT_2ND_TIME)) {
	ctx.currentPageTokens = StringUtils.substringsBetween(ctx.currentPageText, ctx.settings.getStartBurstTokenDelimiter2nd(),
		ctx.settings.getEndBurstTokenDelimiter2nd())
}