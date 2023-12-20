package com.sourcekraft.batch.domain.queue;

import java.util.Date;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class JobQueue implements Comparable<JobQueue> {

    private long id;

    private String status = null;

    private String targettedinstance = null;

    private long jobinstanceid;

    private String name;

    private String type = null;

    private String args = null;

    private String additionalinfo = null;

    private int priority = 0;

    private String tags = null;

    private String producer = null;

    private Date createtime = null;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTargettedinstance() {
        return targettedinstance;
    }

    public void setTargettedinstance(String targettedInstance) {
        this.targettedinstance = targettedInstance;
    }

    public long getJobinstanceid() {
        return jobinstanceid;
    }

    public void setJobinstanceid(long jobInstanceId) {
        this.jobinstanceid = jobInstanceId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getArgs() {
        return args;
    }

    public void setArgs(String args) {
        this.args = args;
    }

    public String getAdditionalinfo() {
        return additionalinfo;
    }

    public void setAdditionalinfo(String additionalInfo) {
        this.additionalinfo = additionalInfo;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public String getProducer() {
        return producer;
    }

    public void setProducer(String producer) {
        this.producer = producer;
    }

    public Date getCreatetime() {
        return new Date(this.createtime.getTime());
    }

    public void setCreatetime(Date time) {
        this.createtime = new Date(time.getTime());
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.MULTI_LINE_STYLE);
    }

    public int compareTo(JobQueue o) {
        return this.priority - o.priority;
    }
}
