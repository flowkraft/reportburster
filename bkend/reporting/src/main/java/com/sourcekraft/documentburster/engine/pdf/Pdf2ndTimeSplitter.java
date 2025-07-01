package com.sourcekraft.documentburster.engine.pdf;

import org.apache.commons.lang3.SerializationUtils;

import com.sourcekraft.documentburster.context.BurstingContext;
import com.sourcekraft.documentburster.utils.Utils;

public class Pdf2ndTimeSplitter extends PdfBurster {

	private PdfBurster parentBurster;

	protected void executeController() throws Exception {

		this.scripting = parentBurster.getScripting();
		this.ctx.settings = SerializationUtils.clone(parentBurster.getCtx().settings);
		this.ctx.settings.setOutputFolder(parentBurster.getCtx().outputFolder + "/" + parentBurster.getCtx().token);
		super.executeController();

	}

	protected boolean shouldSendFiles() {

		return false;

	}

	protected void checkForCustomConfigFile() throws Exception {
	}

	protected void backupFile() throws Exception {

	}

	protected void executeBurstingLifeCycleScript(String scriptFileName, BurstingContext context) throws Exception {
	}

	protected void writeStatsFile() throws Exception {
	}

	protected void checkLicense() throws Exception {

		licenseLimit = Integer.MAX_VALUE;

	}

	protected void extractOutputBurstDocument() throws Exception {

		super.extractOutputBurstDocument();
		this.parentBurster.getCtx().extractedFilePathsAfterSplitting2ndTime.put(ctx.token, ctx.extractedFilePath);

	}

	public Pdf2ndTimeSplitter(PdfBurster parentBurster) {
		super(parentBurster.getCtx().configurationFilePath + "/" + Utils.SPLIT_2ND_TIME);
		this.parentBurster = parentBurster;
		this.parentBurster.getCtx().extractedFilePathsAfterSplitting2ndTime.clear();
	}

}
