import org.apache.commons.io.FilenameUtils
import org.apache.commons.io.FileUtils
import org.apache.commons.lang3.RandomStringUtils
import org.apache.commons.lang3.StringUtils

def archiveFileList  

def outputFolder = ctx.outputFolder+"/"

for (path in ctx.attachments)
{
	
	def attachmentFile = new File (path)
	if (!attachmentFile.exists())
		throw new FileNotFoundException (path)
	
	def fileName = FilenameUtils.getName(path)
	def fileFolder = FilenameUtils.getFullPath(path)

	def fileNameInList
	
	if (!FilenameUtils.equalsNormalizedOnSystem(outputFolder, fileFolder))
	{
		
		def base = FilenameUtils.getBaseName(fileName)
		def ext = FilenameUtils.getExtension(fileName)
		
		fileNameInList = base + "_"+RandomStringUtils.randomNumeric(9)+"."+ext
		
		FileUtils.copyFile(new File(path), new File(outputFolder + fileNameInList))
	}
	else
		fileNameInList = fileName
		
	if (StringUtils.isEmpty(archiveFileList))
		archiveFileList = fileNameInList
	else
		archiveFileList = archiveFileList +","+ fileNameInList
		
}

def ant = new AntBuilder()

if (!StringUtils.isEmpty(archiveFileList))
	ant.zip(destfile: ctx.archiveFilePath, 
        basedir: ctx.outputFolder,
        includes: archiveFileList)