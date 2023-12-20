import com.sourcekraft.batch.common.Consts;
import org.apache.commons.io.IOUtils;

System.out.println("------------START burst.groovy---------------")

assert parameters!=null;
assert manager!=null;

assert parameters.getString(Consts.JOB_NAME) == 'burst'

def polledFileStoreId = parameters.getString("storeId")

def ant = new AntBuilder ( )

File burst1 = new File('./target/test-classes/testData/output/burst1.pdf')

def polledFileInputStream = manager.getStoredFile(new Integer(polledFileStoreId))

def OutputStream outputStream

if (burst1.exists()) {
	println("-------------burst1.exists------------")
	outputStream = new FileOutputStream('./target/test-classes/testData/output/burst2.pdf');
}
else {
	println("---------burst1.not.exists------------")
	outputStream = new FileOutputStream('./target/test-classes/testData/output/burst1.pdf');
	ant.copy ( file : './src/test/resources/testData/poll/burst.pdf' , tofile : './target/test-classes/testData/poll/burst.pdf')
}

IOUtils.copy(polledFileInputStream,outputStream)
outputStream.close()

File burst2 = new File('./target/test-classes/testData/output/burst2.pdf')

if ((burst1.exists()) && (burst2.exists())) {
	println "------------at the end - before ant.delete server.pid------------"
	ant.delete ( file : './target/test-classes/testData/temp/server.pid')
}

System.out.println("------------END burst.groovy---------------")
