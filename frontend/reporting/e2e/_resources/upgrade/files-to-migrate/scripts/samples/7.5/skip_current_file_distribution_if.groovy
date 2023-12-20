/*
 *
 * 1. This script can be used to implement more advanced conditional
 *    report delivery scenarios.
 *
 * 2. While the current script is a sample on how to skip the
 *    report distribution for reports > 20 MB (this is a configurable
 *    threshold since MS Exchange will bounce back for reports
 *    which are so big), similarly it is possible to skip the distribution
 *    based on any custom business situation which your organization
 *    might have.
 *
 * 3. "ctx.skipCurrentFileDistribution = true" is the line of code which
 *    is enabling DocumentBurster to skip the distribution
 *    for the current report.
 *
 * 4. The script must be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 5. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 * 6. How to customize the script to achieve other conditional
 *    report delivery scenarios
 *		
 *        6.1. Replace the "if (currentFileSize >= FILE_SIZE_THRESHOLD)"
 *        with any custom condition which is appropriate for your
 *        scenario.
 *    
 *        6.2. Beside the "ctx.skipCurrentFileDistribution = true"
 *        the rest of the code which is found in the IF block is just copying
 *        to quarantine the offending report (>20MB threshold). 
 *		
 *        Optionally you might want to change the code from within the IF block
 *        with something else which is better fitting your needs.
 *
 */
 
import com.sourcekraft.documentburster.utils.Utils

import org.apache.commons.io.FileUtils
import org.apache.commons.io.FilenameUtils

//configurable FILE_SIZE_THRESHOLD
final def FILE_SIZE_THRESHOLD = 20

def currentFile = new File(ctx.extractFilePath)

//get the size (in MEGABYTE) of the current report
def currentFileSize = Utils.getFileSize(currentFile.length(), 
                                        Utils.FileSizeUnit.MEGABYTE);

//if the report is bigger than the defined threshold
if (currentFileSize > FILE_SIZE_THRESHOLD) {
		
    //skip the distribution
    ctx.skipCurrentFileDistribution = true
	
    //start - copy the report to quarantine
    File quarantineDir = new File(ctx.quarantineFolder);
		
    if (!quarantineDir.exists())
        FileUtils.forceMkdir(quarantineDir);
		
    File quarantineFile = new File(ctx.quarantineFolder + "/" + 
                                   FilenameUtils.getName(ctx.extractFilePath));

    if (!quarantineFile.exists())
        FileUtils.copyFile(new File(ctx.extractFilePath), quarantineFile);
		
    ctx.numberOfQuarantinedFiles++;
    //end - copy the report to quarantine
		
    log.warn("The following file was skipped for distribution since its size - "+ 
             currentFileSize + " MB - is bigger than the " + 
             FILE_SIZE_THRESHOLD + " MB file size threshold")
    
    log.warn("Associated burst token for the skipped file: " + 
             ctx.token +", file path: '") + ctx.extractFilePath + "'"
    
    log.warn("The file was quarantined")
		
}