/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package com.flowkraft.jobson.jobs.management;

import com.flowkraft.jobson.jobs.JobId;
import com.flowkraft.jobson.specs.JobOutputId;
import com.flowkraft.jobson.utils.BinaryData;

public final class PersistOutputArgs {

    private final JobId jobId;
    private final JobOutputId outputId;
    private final BinaryData data;

    public PersistOutputArgs(JobId jobId, JobOutputId outputId, BinaryData data) {
        this.jobId = jobId;
        this.outputId = outputId;
        this.data = data;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        PersistOutputArgs that = (PersistOutputArgs) o;

        if (jobId != null ? !jobId.equals(that.jobId) : that.jobId != null) return false;
        if (outputId != null ? !outputId.equals(that.outputId) : that.outputId != null) return false;
        return data != null ? data.equals(that.data) : that.data == null;
    }

    @Override
    public int hashCode() {
        int result = jobId != null ? jobId.hashCode() : 0;
        result = 31 * result + (outputId != null ? outputId.hashCode() : 0);
        result = 31 * result + (data != null ? data.hashCode() : 0);
        return result;
    }
}
