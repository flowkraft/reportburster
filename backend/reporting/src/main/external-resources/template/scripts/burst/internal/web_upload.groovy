def curlOptions =  message.uploadCommand

def ant = new AntBuilder()

/*
 *    The command executed by curl will be logged in
 *    the logs/DocumentBurster.log file
 */
log.info("Executing command: curl.exe ${curlOptions}")

/*
 *
 *    1. http://groovy.codehaus.org/Executing+External+Processes+From+Groovy
 *    2. cURL is printing its logging operations to the logs/cURL.log file
 *
 */
ant.exec(
	append: "true",
	failonerror: "true",
	failifexecutionfails: "true",
	output:"logs/cURL.log",
	executable: 'tools/curl/win/curl.exe') {
				arg(line:"${curlOptions}")
	}