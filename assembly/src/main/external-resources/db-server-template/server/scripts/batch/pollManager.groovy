import java.io.File;
import com.sourcekraft.batch.domain.queue.JobQueue;
import org.apache.commons.io.FilenameUtils;

def polledFilePath = evt.getPath().getAbsolutePath()
def fileName = FilenameUtils.getName(polledFilePath)
def extension =  FilenameUtils.getExtension(polledFilePath)

def storeId = manager.storeFileAndReturnId(new File(polledFilePath))

JobQueue job = new JobQueue()
job.setName("burst")
job.setType(extension)
job.setArgs("f="+fileName+"\nstoreId="+storeId)

manager.postJobToQueue(job)
