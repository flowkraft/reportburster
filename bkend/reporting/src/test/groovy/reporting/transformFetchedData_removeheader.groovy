// Simply drop the first (header) row and leave the rest untouched
if (ctx.reportData != null && ctx.reportData.size() > 1) {
    // remove header
    ctx.reportData = new ArrayList<>(ctx.reportData.subList(1, ctx.reportData.size()))
}