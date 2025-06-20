if (ctx.inputDocumentFilePath.contains("Invoices-Oct.pdf"))
{
	ctx.settings.setConfigurationFilePath("src/test/resources/config/settings-custom.xml")
	ctx.settings.loadSettings();
}
else if (ctx.inputDocumentFilePath.contains("Invoices-Nov.pdf"))
{
	ctx.settings.setConfigurationFilePath("src/main/external-resources/template/config/burst/settings.xml")
	
	ctx.settings.loadSettings();
	
	ctx.settings.setBurstFileName("\$var1\$-\$var0\$.\$input_document_extension\$")

	ctx.settings.setOutputFolder("./target/test-output/output/\$input_document_name\$/\$now; format=\"yyyy.MM.dd_HH.mm.ss\"\$");
	ctx.settings.setBackupFolder("./target/test-output/backup/\$input_document_name\$/\$now; format=\"yyyy.MM.dd_HH.mm.ss\"\$");
	ctx.settings.setQuarantineFolder("./target/test-output/quarantine/\$input_document_name\$/\$now; format=\"yyyy.MM.dd_HH.mm.ss\"\$");
	
	ctx.settings.setLogsArchivesFolder("./target/test-output/logs/archives/\$input_document_name\$/\$now; format=\"yyyy.MM.dd_HH.mm.ss\"\$");
	
}