package com.sourcekraft.batch.common.job;

import java.io.File;
import java.io.InputStream;
import java.io.StringReader;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.Queue;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.converter.DefaultJobParametersConverter;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

import com.sourcekraft.batch.common.Consts;
import com.sourcekraft.batch.domain.filestore.internal.JdbcFileStoreDao;
import com.sourcekraft.batch.domain.queue.JobQueue;
import com.sourcekraft.batch.domain.queue.internal.JdbcQueueDao;

public class Manager implements ApplicationContextAware {

    private JdbcQueueDao queue;
    private JdbcFileStoreDao store;

    private ApplicationContext applicationContext;

    private JobLauncher jobLauncher;
    private DefaultJobParametersConverter jobParametersConverter;

    private String jobBean;

    public void setJobBean(String jobBean) {
        this.jobBean = jobBean;
    }

    public void setQueue(JdbcQueueDao queue) {
        this.queue = queue;
    }

    public void setStore(JdbcFileStoreDao store) {
        this.store = store;
    }

    public void setJobLauncher(JobLauncher jobLauncher) {
        this.jobLauncher = jobLauncher;
    }

    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    public void setJobParametersConverter(DefaultJobParametersConverter jobParametersConverter) {
        this.jobParametersConverter = jobParametersConverter;
    }

    public Number storeFileAndReturnId(File file) throws Exception {
        return store.storeFileAndReturnId(file);
    }

    public InputStream getStoredFile(Number id) {
        return store.getStoredFile(id);
    }

    public int removeStoredFile(Number id) {
        return store.removeStoredFile(id);
    }

    public void postJobsToQueue(List<JobQueue> jobs) {
        for (JobQueue job : jobs) {
            postJobToQueue(job);
        }
    }

    public void postJobToQueue(JobQueue job) {

        job.setCreatetime(new Date());

        if ((job.getStatus() == null) || (job.getStatus().length() == 0))
            job.setStatus(Consts.READY);

        queue.saveJob(job);

    }

    public void handle() throws Exception {

        Queue<JobQueue> jobs = queue.select();

        for (JobQueue jobQueue : jobs) {

            String jobName = jobQueue.getName();
            Properties args = new Properties();

            args.load(new StringReader(jobQueue.getArgs()));
            args.put(Consts.JOB_NAME, jobName);

            // this is only to create a separate job instance
            // and avoid getting JobInstanceAlreadyCompleteException
            args.put(Consts.CURRENT_TIME, Long.toString(System.currentTimeMillis()));

            Job job = (Job) applicationContext.getBean(jobBean);

            JobParameters parameters = jobParametersConverter.getJobParameters(args);

            JobExecution execution = null;

            try {
                execution = jobLauncher.run(job, parameters);
            } catch (Exception e) {
                throw e;
            } finally {
                if (execution != null)
                    queue.update(jobQueue.getId(), execution.getJobId(), execution.getId());
            }

        }
    }

}