import groovy.ant.AntBuilder

import java.io.FileOutputStream;
import java.awt.Color;

import org.apache.commons.io.FilenameUtils;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfAction;
import com.lowagie.text.pdf.PdfAnnotation;
import com.lowagie.text.pdf.PdfBorderArray;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfStamper;
import com.lowagie.text.pdf.PdfGState;

// Determine URL suffix based on burst vs generated report
def outputType = null
try { outputType = ctx.settings.getReportTemplate()?.outputtype } catch (Exception e) {}
def urlSuffix = (outputType != null && outputType != "output.none") ? "gr" : "br"
def url = "https://datapallas.com/g/rb/" + urlSuffix

BaseFont bfRegular = BaseFont.createFont(BaseFont.HELVETICA,
        BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD,
        BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);

def tempFilePath = "./temp/" +
        FilenameUtils.getBaseName(ctx.extractedFilePath) +
        "_tmp.pdf"

try {
    PdfReader reader = new PdfReader(ctx.extractedFilePath);

    int n = reader.getNumberOfPages();

    PdfStamper stamp = new PdfStamper(reader,
            new FileOutputStream(tempFilePath));

    PdfGState gs = new PdfGState();
    gs.setFillOpacity(1.0f);

    String labelPrefix = "Built by ";
    String labelBold = "DataPallas";

    float fontSize = 7.5f;
    float prefixWidth = bfRegular.getWidthPoint(labelPrefix, fontSize);
    float boldWidth = bfBold.getWidthPoint(labelBold, fontSize);
    float textWidth = prefixWidth + boldWidth;

    float paddingH = 10f;
    float paddingV = 4f;
    float badgeWidth = textWidth + 2 * paddingH;
    float badgeHeight = fontSize + 2 * paddingV;
    float cornerRadius = badgeHeight / 2;

    float badgeX = 10f;
    float badgeY = 10f;

    int i = 0;

    while (i < n) {
        i++;

        PdfContentByte over = stamp.getOverContent(i);

        over.setGState(gs);

        // Draw navy pill-shaped badge (#000033)
        over.setColorFill(new Color(0x00, 0x00, 0x33));
        over.roundRectangle(badgeX, badgeY, badgeWidth, badgeHeight, cornerRadius);
        over.fill();

        // Draw white text
        float textX = badgeX + paddingH;
        float textY = badgeY + paddingV;

        over.beginText();
        over.setColorFill(Color.WHITE);

        over.setFontAndSize(bfRegular, fontSize);
        over.setTextMatrix(textX, textY);
        over.showText(labelPrefix);

        over.setFontAndSize(bfBold, fontSize);
        over.setTextMatrix((float)(textX + prefixWidth), textY);
        over.showText(labelBold);

        over.endText();

        // Add clickable hyperlink annotation over the badge
        PdfAnnotation link = PdfAnnotation.createLink(stamp.getWriter(),
                new Rectangle(badgeX, badgeY, (float)(badgeX + badgeWidth), (float)(badgeY + badgeHeight)),
                PdfAnnotation.HIGHLIGHT_NONE,
                new PdfAction(url));
        link.setBorder(new PdfBorderArray(0, 0, 0));
        stamp.addAnnotation(link, i);
    }

    stamp.close();

    def ant = new AntBuilder()

    // Replace the original file with the stamped one
    ant.delete(file: ctx.extractedFilePath)
    ant.move(file: "$tempFilePath", tofile: ctx.extractedFilePath)

} finally {
    def tempFile = new File(tempFilePath)
    if (tempFile.exists()) {
        tempFile.delete()
    }
}
