import java.io.FileOutputStream;
import java.awt.Color;

import org.apache.commons.io.FilenameUtils;
import com.lowagie.text.Element;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfStamper;
import com.lowagie.text.pdf.PdfGState;

BaseFont bf = BaseFont.createFont(BaseFont.HELVETICA_OBLIQUE, 
				BaseFont.WINANSI, BaseFont.EMBEDDED);

def tempFilePath = "./temp/" + 
                       FilenameUtils.getBaseName(ctx.extractedFilePath) +
                       "_tmp.pdf"

PdfReader reader = new PdfReader(ctx.extractedFilePath);

//get the number of pages
int n = reader.getNumberOfPages();

PdfStamper stamp = new PdfStamper(reader, 
                       new FileOutputStream(tempFilePath));

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
    over.rectangle(10, 10, 60, 20);
    
    over.fill();
    
    over.beginText();
	
    //http://download.oracle.com/javase/1.4.2/docs/api/java/awt/Color.html
    over.setColorFill(Color.GRAY);
    
    //the default size of the font is 12
    over.setFontAndSize(bf, 6);
    
    //the default label location is at the bottom left-corner
    //of the page
    //x, y 
    over.setTextMatrix(10, 10);
    
    //label text
    over.showText("Sent by ReportBurster - https://reportburster.com/g/rb/br");
    
    over.endText();
	
}

stamp.close();

def ant = new AntBuilder()

//replace the original burst report
//with the numbered one
ant.delete(file:ctx.extractedFilePath)
ant.move(file:"$tempFilePath", tofile:ctx.extractedFilePath)