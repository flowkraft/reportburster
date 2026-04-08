/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.utils;

import java.io.Serializable;
import java.lang.reflect.Field;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class DumpToString implements Serializable {

	private static final long serialVersionUID = -7339133617732968922L;

	/** Fields containing these substrings will be masked in toString() output. */
	private static final String[] SENSITIVE_FIELD_NAMES = {
			"password", "passwd", "secret", "token", "authtoken", "apikey"
	};

	@Override
	public String toString() {
		return new ReflectionToStringBuilder(this, ToStringStyle.MULTI_LINE_STYLE) {
			@Override
			protected boolean accept(Field field) {
				return super.accept(field);
			}

			@Override
			protected Object getValue(Field field) throws IllegalAccessException {
				String fieldName = field.getName().toLowerCase();
				for (String sensitive : SENSITIVE_FIELD_NAMES) {
					if (fieldName.contains(sensitive)) {
						return "******";
					}
				}
				return super.getValue(field);
			}
		}.toString();
	}
}
