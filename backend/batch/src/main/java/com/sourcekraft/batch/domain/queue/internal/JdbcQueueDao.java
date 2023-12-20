package com.sourcekraft.batch.domain.queue.internal;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.PriorityQueue;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcDaoSupport;

import com.sourcekraft.batch.domain.queue.JobQueue;
import com.sourcekraft.batch.domain.queue.QueueDao;

public class JdbcQueueDao extends NamedParameterJdbcDaoSupport implements QueueDao {

    private static final String INSERT_JOB =

            "INSERT INTO BATCH_JOB_QUEUE (STATUS, TARGETTED_INSTANCE, JOB_NAME,"
                    + " JOB_TYPE, JOB_PARAMS, ADDITIONAL_INFO, PRIORITY, TAGS, PRODUCER, CREATE_TIME) "
                    + "VALUES(:status,:targettedinstance,:name,:type,:args,:additionalinfo,:priority,:tags,:producer,:createtime)";

    private static final String UPDATE_JOB =
            "UPDATE BATCH_JOB_QUEUE SET STATUS='LAUNCHED',JOB_INSTANCE_ID=?, JOB_EXECUTION_ID=? WHERE ID=?";

    private String select = null;
    private Object[] selectArgs = null;

    public Object[] getSelectArgs() {
        return Arrays.copyOf(this.selectArgs, this.selectArgs.length);
    }

    public void setSelectArgs(Object[] selectArgs) {
        this.selectArgs = Arrays.copyOf(selectArgs, selectArgs.length);
    }

    public String getSelect() {
        return select;
    }

    public void setSelect(String select) {
        this.select = select;
    }

    public void saveJob(JobQueue job) {

        getNamedParameterJdbcTemplate().update(INSERT_JOB, new BeanPropertySqlParameterSource(job));

    }

    public PriorityQueue<JobQueue> select() {

        return new PriorityQueue<JobQueue>(getJdbcTemplate().query(select, new RowMapper<JobQueue>() {
            public JobQueue mapRow(ResultSet rs, int rowNum) throws SQLException {

                JobQueue job = new JobQueue();

                job.setId(rs.getLong("ID"));
                job.setStatus(rs.getString("STATUS"));
                job.setTargettedinstance(rs.getString("TARGETTED_INSTANCE"));
                job.setJobinstanceid(rs.getLong("JOB_INSTANCE_ID"));
                job.setName(rs.getString("JOB_NAME"));
                job.setType(rs.getString("JOB_TYPE"));
                job.setArgs(rs.getString("JOB_PARAMS"));

                Object additionalinfo = rs.getClob("ADDITIONAL_INFO");
                if (additionalinfo != null)
                    job.setAdditionalinfo(additionalinfo.toString());

                job.setPriority(rs.getInt("PRIORITY"));
                job.setTags(rs.getString("TAGS"));
                job.setProducer(rs.getString("PRODUCER"));
                job.setCreatetime(rs.getTimestamp("CREATE_TIME"));

                return job;
            }
        }, selectArgs));

    }

    public int update(long id, long jobInstanceId, long jobExecutionId) {
        return getJdbcTemplate().update(UPDATE_JOB, new Object[]{jobInstanceId, jobExecutionId, id});

    }
}
