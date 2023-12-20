package com.sourcekraft.batch.ext;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.batch.core.JobParameter;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;

public class SimpleTasklet implements Tasklet {

    protected RepeatStatus execute(JobParameters parameters) throws Exception {
        return RepeatStatus.FINISHED;
    }

    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {

        Map<String, Object> parameters = chunkContext.getStepContext().getJobParameters();
        Map<String, JobParameter> params = new HashMap<String, JobParameter>();

        for (Map.Entry<String, Object> entry : parameters.entrySet()) {
            Object paramValue = entry.getValue();
            if (paramValue instanceof Long)
                params.put(entry.getKey(), new JobParameter((Long) paramValue));
            else if (paramValue instanceof Date)
                params.put(entry.getKey(), new JobParameter((Date) paramValue));
            else if (paramValue instanceof String)
                params.put(entry.getKey(), new JobParameter((String) paramValue));
            else if (paramValue instanceof Double)
                params.put(entry.getKey(), new JobParameter((Double) paramValue));

        }

        return execute(new JobParameters(params));

    }
}
