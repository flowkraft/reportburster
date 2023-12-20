package com.sourcekraft.documentburster.engine;

import com.sourcekraft.documentburster.engine.csv.CsvReporter;
import com.sourcekraft.documentburster.engine.excel.PoiExcelBurster;
import com.sourcekraft.documentburster.engine.pdf.PdfBurster;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BursterFactory {

    private static Logger log = LoggerFactory.getLogger(BursterFactory.class);

    public static AbstractBurster create(String filePath, String configurationFilePath) {

        String extension = FilenameUtils.getExtension(filePath);

        log.debug("extension = " + extension);

        if (extension.equalsIgnoreCase("pdf"))
            return new PdfBurster(configurationFilePath);
        else if (extension.equalsIgnoreCase("csv"))
            return new CsvReporter(configurationFilePath);
        else
            return new PoiExcelBurster(configurationFilePath);

    }
}
