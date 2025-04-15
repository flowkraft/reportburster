/*
 *
 * 1. This script should be used as a sample 
 *    for copying/uploading each individual output burst file
 *    by using the Apache Commons VFS library.
 *    Commons VFS provides a single API for accessing various different 
 *    file systems. It presents a uniform view of the files from various
 *    different sources, such as the files on local disk, on an HTTP server, 
 *    or inside a Zip archive.
 * 
 *    http://commons.apache.org/vfs/index.html
 * 
 * 2. Commons VFS currently supports the following file systems:
 *    http://commons.apache.org/vfs/filesystems.html
 * 
 * 3. This script is demonstrating the use of the V-Copy
 *    Commons VFS Ant task.
 * 
 *    http://commons.apache.org/vfs/anttasks.html#V-Copy
 *
 * 4. The script should be executed during the endExtractDocument
 *    report bursting lifecycle phase.
 *
 * 5. Please copy and paste the content of this sample script
 *    into the existing scripts/burst/endExtractDocument.groovy
 *    script.
 *
 */
 
import com.smartwish.documentburster.variables.Variables

/*
 *
 *    By default the script is getting the destination folder from the content
 *    of $var0$ user variable
 *
 */
 
//e.g. destDir = "file:///C:/test"
def destDir = ctx.variables.getUserVariables(ctx.token).get("var0")

ant = new AntBuilder()

ant.sequential{
	
    taskdef(name:"vfs_copy", classname:"org.apache.commons.vfs.tasks.CopyTask")
	
    vfs_copy(src: ctx.extractFilePath,
        destdir: "$destDir",
        overwrite:'true')
}