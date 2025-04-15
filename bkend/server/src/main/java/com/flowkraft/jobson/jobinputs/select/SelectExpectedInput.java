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

package com.flowkraft.jobson.jobinputs.select;

import static com.flowkraft.jobson.Helpers.commaSeparatedList;
import static com.flowkraft.jobson.Helpers.randomElementIn;
import static java.lang.String.format;
import static java.util.Collections.singletonList;
import static java.util.stream.Collectors.toSet;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import javax.validation.constraints.NotNull;

import javax.validation.constraints.NotEmpty;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.flowkraft.jobson.jobinputs.JobExpectedInput;
import com.flowkraft.jobson.jobinputs.JobExpectedInputId;
import com.flowkraft.jobson.utils.ValidationError;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Schema for an input that requires clients to select a single option from a set of options")
public final class SelectExpectedInput extends JobExpectedInput<SelectInput> {

    @Schema(description = "Schema of options the client must select from")
    @JsonProperty
    @NotNull
    @NotEmpty
    private List<SelectOption> options;



    /**
     * @deprecated Used by JSON deserializer
     */
    public SelectExpectedInput() {}

    public SelectExpectedInput(
            JobExpectedInputId id,
            String name,
            String description,
            List<SelectOption> options,
            Optional<SelectInput> defaultOption) {

        super(id, name, description, defaultOption);
        this.options = options;
    }


    public List<SelectOption> getOptions() {
        return options;
    }


    @Override
    public Class<SelectInput> getExpectedInputClass() {
        return SelectInput.class;
    }

    @Override
    public Optional<List<ValidationError>> validate(SelectInput input) {
        final Set<String> availableOptions =
                this.getOptions().stream().map(SelectOption::getId).collect(toSet());

        if (!availableOptions.contains(input.getValue())) {
            final String msg = format(
                    "The selected option specified (%s) is not an option available in the options list. Available options are: %s",
                    input.getValue(),
                    commaSeparatedList(availableOptions));

            return Optional.of(singletonList(ValidationError.of(msg)));
        } else return Optional.empty();
    }

    @Override
    public SelectInput generateExampleInput() {
        return new SelectInput(randomElementIn(options).getId());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;

        SelectExpectedInput that = (SelectExpectedInput) o;

        return options != null ? options.equals(that.options) : that.options == null;
    }

    @Override
    public int hashCode() {
        int result = super.hashCode();
        result = 31 * result + (options != null ? options.hashCode() : 0);
        return result;
    }
}
