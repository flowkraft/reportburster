import groovy.util.AntBuilder

import java.util.Calendar
import java.util.concurrent.TimeUnit
import java.util.Timer
import java.util.TimerTask

def timer = new Timer()

//TimeUnit.DAYS
//TimeUnit.HOURS
//TimeUnit.SECONDS
timer.schedule(new TimerTask() {
    void run() {
        // If the current time is not within the first five minutes after midnight (00:00 to 00:04), 
        // the function will return immediately and stop executing the rest of the code.

        // Uncomment the following lines if you want the task to only run at midnight
        /*
        def now = Calendar.instance
        if (!(now.get(Calendar.HOUR_OF_DAY) == 0 && now.get(Calendar.MINUTE) < 5)) {
            return
        }
        */

        // Uncomment the following lines if you need the below code to be executed

        // def ant = new AntBuilder()

        // copy all files (indicated by the "**/*.*" pattern) from the 
        // "input-files/scheduled" directory to the "poll" directory

        // ant.copy(todir: "poll") {
        //     fileset(dir: "input-files/scheduled") {
        //         include(name: "**/*.*")
        //     }
        // }

        // delete all files (indicated by the "**/*.*" pattern) from the 
        // "input-files/scheduled" directory

        // ant.delete {
        //     fileset(dir: "input-files/scheduled") {
        //         include(name: "**/*.*")
        //     }
        // }
    }
}, 0, TimeUnit.MINUTES.toMillis(1))