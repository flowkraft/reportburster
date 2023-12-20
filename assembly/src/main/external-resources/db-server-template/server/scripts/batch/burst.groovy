import org.apache.commons.io.FileUtils

import com.sourcekraft.documentburster.utils.Utils

def inputFileStoreId=parameters.getString("storeId")

def fileName=Utils.getRandomFileName(parameters.getString("f"))

def inputFileInputStream=manager.getStoredFile(Long.valueOf(inputFileStoreId))
manager.removeStoredFile(Long.valueOf(inputFileStoreId))

def tempFilePath="./temp/"+fileName

File inputFile=new File(tempFilePath)
FileUtils.copyInputStreamToFile(inputFileInputStream,inputFile)

def ant=new AntBuilder()

try{

    ant.exec(
        executable:'documentburster.bat'
    ){arg(line:"-f ${tempFilePath}")}

}finally{

    FileUtils.deleteQuietly(inputFile)

}