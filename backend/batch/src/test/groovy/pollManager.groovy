import java.io.File;
import com.sourcekraft.batch.domain.queue.JobQueue

System.out.println("------------START Poll Manager--------")

assert evt!=null;
assert manager!=null;

def polledFilePath = evt.getPath().getAbsolutePath()

if (polledFilePath.endsWith(".pdf")){
	
	System.out.println("------------Poll Manager .pdf----------")
	System.out.println(polledFilePath)
	
	def storeId = manager.storeFileAndReturnId(new File(polledFilePath))
	
	JobQueue job = new JobQueue()
	job.setName("burst")
	job.setType("pdf")
	job.setArgs("f="+polledFilePath+"\nstoreId="+storeId)
	
	manager.postJobToQueue(job)

}

System.out.println("------------END Poll Manager--------")
