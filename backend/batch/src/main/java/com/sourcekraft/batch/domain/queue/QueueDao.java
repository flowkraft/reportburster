package com.sourcekraft.batch.domain.queue;

import java.util.Queue;

public interface QueueDao {

    Queue<JobQueue> select();

    void saveJob(JobQueue job);

    int update(long id, long jobInstanceId, long jobExecutionId);

}
