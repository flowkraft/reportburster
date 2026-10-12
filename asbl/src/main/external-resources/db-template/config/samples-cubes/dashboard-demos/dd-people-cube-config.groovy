// ═══════════════════════════════════════════════════════════════════════════
// Demo People — who works here, who left, and what they are paid
// ═══════════════════════════════════════════════════════════════════════════
//
// What it holds: one row per employee, current or former, with the department
// they are in and the city they work in.
//
// Grain: one employee. Employees counts everybody who ever worked here in the
// data; Headcount counts the ones still here (no termination date), Leavers the
// ones who left. Average Salary is the yearly base salary of the people still
// here: a former employee's last salary is not what anybody is paid today.
//
// Joins, both many_to_one, so no measure is multiplied: dash_demo.departments
// on department_id and dash_demo.geo_cities on city_id. The generator writes
// them as LEFT joins.
//
// Leaver Rate is a measure of measures (type 'number'): the leavers as a share
// of everybody, so it follows the split - by department it is that department's
// own. Monthly pay (dash_demo.payroll_lines) is another grain, one row per
// person per month, and is not mixed in here.
//
// What it can answer: how many people each department has, which department
// loses the most people, how many joined or left in a year, what each level is
// paid, by hire or leave month, quarter or year.
//
// Data: dash_demo.employees (260 people hired between 2014-03-17 and
// 2026-08-04): 209 still here, 51 left; the people still here earn 45,873.21 a
// year on average.
// ═══════════════════════════════════════════════════════════════════════════

cube {
  sql_table 'dash_demo.employees'
  title 'Demo People'
  description 'Headcount, leavers and salaries, by department, level, job title, country and hire or leave month'
  currency 'EUR'

  join {
    name 'dash_demo.departments'
    title 'Departments'
    description 'The department the employee is in'
    sql '${CUBE}.department_id = dash_demo.departments.department_id'
    relationship 'many_to_one'
  }
  join {
    name 'dash_demo.geo_cities'
    title 'Cities'
    description 'The city the employee works in, and the country it is in'
    sql '${CUBE}.city_id = dash_demo.geo_cities.city_id'
    relationship 'many_to_one'
  }

  dimension {
    name 'EmployeeId'
    title 'Employee'
    description 'The employee number'
    sql '${CUBE}.employee_id'
    type 'number'
    primary_key true
  }
  dimension {
    name 'Name'
    title 'Name'
    description 'The employee'
    sql '${CUBE}.name'
    type 'string'
  }
  dimension {
    name 'HiredAt'
    title 'Hired'
    description 'When the employee joined. Group it by month, quarter or year'
    sql '${CUBE}.hire_date'
    type 'time'
  }
  dimension {
    name 'LeftAt'
    title 'Left'
    description 'When the employee left. Empty for the people still here'
    sql '${CUBE}.termination_date'
    type 'time'
  }
  dimension {
    name 'Department'
    title 'Department'
    description 'Sales, Marketing, Engineering, Finance, HR, Customer Support, Warehouse or Management'
    sql 'dash_demo.departments.name'
    type 'string'
  }
  dimension {
    name 'JobTitle'
    title 'Job Title'
    description 'What the employee does'
    sql '${CUBE}.job_title'
    type 'string'
  }
  dimension {
    name 'Level'
    title 'Level'
    description 'The pay level, from L1 to L6'
    sql '${CUBE}.level'
    type 'string'
  }
  dimension {
    name 'EmploymentType'
    title 'Employment Type'
    description 'full_time or part_time'
    sql '${CUBE}.employment_type'
    type 'string'
  }
  dimension {
    name 'LeaveReason'
    title 'Leave Reason'
    description 'Why the employee left: resignation, dismissal, retirement or end_of_contract'
    sql '${CUBE}.termination_reason'
    type 'string'
  }
  dimension {
    name 'Country'
    title 'Country'
    description 'The country the employee works in'
    sql 'dash_demo.geo_cities.country'
    type 'string'
  }

  measure {
    name 'Employees'
    title 'Employees'
    description 'Everybody in the answer, the people still here and the ones who left'
    type 'count'
  }
  measure {
    name 'Headcount'
    title 'Headcount'
    description 'The people still here. PICK THIS WHEN: the question is how many people work here now'
    type 'count'
    filters {
      filter sql: '${CUBE}.termination_date IS NULL'
    }
  }
  measure {
    name 'Leavers'
    title 'Leavers'
    description 'The people who left'
    type 'count'
    filters {
      filter sql: '${CUBE}.termination_date IS NOT NULL'
    }
  }
  measure {
    name 'LeaverRatePct'
    title 'Leaver Rate'
    description 'The leavers as a share of everybody in the answer, a fraction from 0.0 to 1.0 shown as a percentage. PICK THIS WHEN: comparing departments of different sizes'
    sql '1.0 * ${Leavers} / NULLIF(${Employees}, 0)'
    type 'number'
    format 'percent'
  }
  measure {
    name 'AvgSalary'
    title 'Average Salary'
    description 'The yearly base salary of the people still here, on average'
    sql '${CUBE}.base_salary_annual'
    type 'avg'
    format 'currency'
    filters {
      filter sql: '${CUBE}.termination_date IS NULL'
    }
  }

  segment {
    name 'still_here'
    title 'Still here'
    description 'The people who have not left'
    sql '${CUBE}.termination_date IS NULL'
  }
}
