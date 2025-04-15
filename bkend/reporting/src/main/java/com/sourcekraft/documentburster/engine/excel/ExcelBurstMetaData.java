package com.sourcekraft.documentburster.engine.excel;

import com.sourcekraft.documentburster.common.utils.DumpToString;

public class ExcelBurstMetaData extends DumpToString {

    /**
	 * 
	 */
	private static final long serialVersionUID = 6666345605498189145L;
	
	private String burstMethod = "distinct-sheets";
    private int burstSheetIndex = -1;
    private int burstColumnIndex = -1;

    public String getBurstMethod() {
        return burstMethod;
    }

    public void setBurstMethod(String burstMethod) {
        this.burstMethod = burstMethod;
    }

    public int getBurstSheetIndex() {
        return burstSheetIndex;
    }

    public void setBurstSheetIndex(int burstSheetIndex) {
        this.burstSheetIndex = burstSheetIndex;
    }

    public int getBurstColumnIndex() {
        return burstColumnIndex;
    }

    public void setBurstColumnIndex(int burstColumnIndex) {
        this.burstColumnIndex = burstColumnIndex;
    }

}
