package com.sourcekraft.documentburster.common.reportparameters;

import java.util.Date;
import java.util.Map;

public class ParameterValidator {

	public void validate(ReportParameter parameter, Object value, Map<String, Object> context)
			throws ValidationException {
		if (parameter.constraints == null)
			return;

		if (parameter.constraints.containsKey("required") && (boolean) parameter.constraints.get("required")
				&& value == null) {
			throw new ValidationException(parameter.id + " is required");
		}

		switch (parameter.type.toLowerCase()) {
		case "date":
			validateDate(parameter, (Date) value, context);
			break;
		case "string":
			validateString(parameter, (String) value);
			break;
		case "integer":
			validateNumber(parameter, (Number) value);
			break;
		case "boolean":
			// No specific validation needed
			break;
		}
	}

	private void validateDate(ReportParameter parameter, Date value, Map<String, Object> context)
			throws ValidationException {
		Date min = resolveDateConstraint(parameter.constraints.get("min"), context);
		Date max = resolveDateConstraint(parameter.constraints.get("max"), context);

		if (min != null && value.before(min)) {
			throw new ValidationException(parameter.id + " must be after " + min);
		}
		if (max != null && value.after(max)) {
			throw new ValidationException(parameter.id + " must be before " + max);
		}
	}

	private void validateString(ReportParameter parameter, String value) throws ValidationException {
		if (parameter.constraints.containsKey("maxLength")
				&& value.length() > (int) parameter.constraints.get("maxLength")) {
			throw new ValidationException(parameter.id + " exceeds maximum length");
		}

		if (parameter.constraints.containsKey("pattern")
				&& !value.matches((String) parameter.constraints.get("pattern"))) {
			throw new ValidationException(parameter.id + " doesn't match pattern");
		}
	}

	private void validateNumber(ReportParameter parameter, Number value) throws ValidationException {
		if (parameter.constraints.containsKey("min")
				&& value.doubleValue() < ((Number) parameter.constraints.get("min")).doubleValue()) {
			throw new ValidationException(parameter.id + " is below minimum");
		}

		if (parameter.constraints.containsKey("max")
				&& value.doubleValue() > ((Number) parameter.constraints.get("max")).doubleValue()) {
			throw new ValidationException(parameter.id + " exceeds maximum");
		}
	}

	private Date resolveDateConstraint(Object constraint, Map<String, Object> context) {
		if (constraint instanceof Date) {
			return (Date) constraint;
		}
		if (constraint instanceof String) {
			return (Date) context.get(constraint);
		}
		return null;
	}
}
