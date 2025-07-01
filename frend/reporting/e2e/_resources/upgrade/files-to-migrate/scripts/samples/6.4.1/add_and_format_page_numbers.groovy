/*
 *
 * 1. This script should be used for applying page numbers to
 *    the output burst files. 
 *    
 *    The script can: 
 * 		
 *      1.1 - Place new numbers for pages of output burst reports
 *      which are not initially numbered.
 *      1.2 - Replace and fix the numbers for pages of burst reports
 *      for which the existing page numbering becomes incorrect 
 *      after the report is split.
 *
 * 2. The text, the font and the location of the page numbering
 *    label can be customized by doing small changes to this script. 
 *
 *    Please check the inline code comments for further details.
 * 
 * 3. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 4. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 */

import java.io.FileOutputStream;
import java.awt.Color;

import org.apache.commons.io.FilenameUtils;
import com.lowagie.text.Element;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfStamper;
import com.lowagie.text.pdf.PdfGState;

/*
 *    Font of the label. Default value is BaseFont.HELVETICA
 *    
 *    Other possible values are:
 *      
 *      BaseFont.COURIER
 *      BaseFont.COURIER_BOLD
 *      BaseFont.COURIER_BOLDOBLIQUE
 *      BaseFont.COURIER_OBLIQUE
 *      BaseFont.HELVETICA
 *      BaseFont.HELVETICA_BOLD
 *      BaseFont.HELVETICA_BOLDOBLIQUE
 *      BaseFont.HELVETICA_OBLIQUE
 *      BaseFont.SYMBOL
 *      BaseFont.TIMES_BOLD
 *      BaseFont.TIMES_BOLDITALIC
 *      BaseFont.TIMES_ITALIC
 *      BaseFont.TIMES_ROMAN
 *      BaseFont.ZAPFDINGBATS
 * 
 */
BaseFont bf = BaseFont.createFont(BaseFont.HELVETICA, 
				BaseFont.WINANSI, BaseFont.EMBEDDED);

def numberedFilePath = ctx.outputFolder + 
                       FilenameUtils.getBaseName(ctx.extractFilePath) +
                       "_numbered.pdf"

PdfReader reader = new PdfReader(ctx.extractFilePath);

//get the number of pages
int n = reader.getNumberOfPages();

PdfStamper stamp = new PdfStamper(reader, 
                       new FileOutputStream(numberedFilePath));

PdfContentByte over;

PdfGState gs = new PdfGState();

//100% opacity
gs.setFillOpacity(1.0f);
	    
//current page index
int i = 0;

while (i < n) {

    i++;

    over = stamp.getOverContent(i);
	
    //draw an "opaque" and white rectangle
    //which is used to hide the old/wrong page numbering
    over.setGState(gs);
    over.setColorFill(Color.WHITE);
    
    //the default label location is at the bottom left-corner
    //of the page
    
    //x, y, width, height 
    over.rectangle(30, 30, 60, 20);
    
    over.fill();
    
    over.beginText();
	
    //Default text color is black
    
    //other possible color values
    //http://download.oracle.com/javase/1.4.2/docs/api/java/awt/Color.html
    
    over.setColorFill(Color.BLACK);
    
    //the default size of the font is 12
    over.setFontAndSize(bf, 12);
    
    //the default label location is at the bottom left-corner
    //of the page
    
    //x, y 
    over.setTextMatrix(30, 30);
    
    //label text
    over.showText("Page $i of $n");
    
    over.endText();
	
}

stamp.close();

def ant = new AntBuilder()

//replace the original burst report
//with the numbered one
ant.delete(file:ctx.extractFilePath)
ant.move(file:"$numberedFilePath", tofile:ctx.extractFilePath)