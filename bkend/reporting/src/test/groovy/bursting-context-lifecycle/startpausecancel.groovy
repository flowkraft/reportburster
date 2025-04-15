if (ctx.token.equals('kyle.butford@northridgehealth.org')) {

    if (ctx.additionalInformation.command.equals("cancel")) {
        File cancelFile = new File(ctx.additionalInformation.cancelFilePath);
        cancelFile.createNewFile();
    } else if (ctx.additionalInformation.command.equals("pause")) {
        File pauseFile = new File(ctx.additionalInformation.pauseFilePath);
        pauseFile.createNewFile();
    }

}