<?php
@php
// Security Check: Ensure user is logged in
if (!is_user_logged_in()) {
    auth_redirect(); // Redirect to login page
    exit;
}

// Check if the user has the 'employee' role
$current_user = wp_get_current_user();
$is_employee = in_array('employee', $current_user->roles);

if (!$is_employee && !current_user_can('administrator')) {
    wp_redirect(home_url());
    wp_die('Access denied. Only employees can view payslips.');
    exit;
}

$pod = pods('payslip', get_the_ID());

// Double security check: Only allow access if the payslip belongs to the current user
$associated_employee_id = $pod->field('associated_employee.ID');
if ($current_user->ID != $associated_employee_id && !current_user_can('administrator')) {
    wp_redirect(home_url());
    wp_die('You are not authorized to view this payslip.');
    exit;
}
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ get_the_title() }} | {{ get_bloginfo('name') }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
        }
        .company-info {
            text-align: center;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table, th, td {
            border: 1px solid black;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
        td.amount {
            text-align: right;
        }
        .section-header {
            font-weight: bold;
            background-color: #f2f2f2;
        }
        .totals {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .net-pay {
            background-color: #f2f2f2;
            text-align: right;
            font-weight: bold;
            margin-top: 20px;
            padding: 8px;
        }
        .signature {
            border-top: 1px solid black;
            width: 30%;
            margin-top: 40px;
            padding-top: 5px;
            text-align: center;
            display: inline-block;
        }
        .dashboard-link {
            margin-top: 30px;
            text-align: center;
        }
        .dashboard-link a {
            display: inline-block;
            padding: 10px 15px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
        .dashboard-link a:hover {
            background-color: #45a049;
        }
        @media print {
            .dashboard-link {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="company-info">
        <p>Northridge Pharmaceuticals</p>
        <p>7649F Diamond Hts Blvd</p>
        <p>San Francisco</p>
        <p>(415) 872-9214</p>
    </div>
    <br />
    <div class="header">STATEMENT OF MONTHLY INCOME</div>
    <br />
    <table>
        <tbody>
            <tr>
                <td>Employee Name</td>
                <td>{{ $pod->display('name') }}</td>
            </tr>
            <tr>
                <td>Employee ID</td>
                <td>{{ $pod->display('employee_id') }}</td>
            </tr>
            <tr>
                <td>Social Security #</td>
                <td>{{ $pod->display('social_security_no') }}</td>
            </tr>
            <tr>
                <td>Pay Period</td>
                <td>{{ $pod->display('pay_period') }}</td>
            </tr>
            <tr>
                <td>Department</td>
                <td>{{ $pod->display('department') }}</td>
            </tr>
            <tr>
                <td>Position/Grade</td>
                <td>{{ $pod->display('position_grade') }}</td>
            </tr>
        </tbody>
    </table>
    <br /><br />
    <table>
        <thead>
            <tr class="section-header">
                <td>EARNINGS</td>
                <td class="amount">AMOUNT</td>
                <td>TAXES/DEDUCTIONS</td>
                <td class="amount">AMOUNT</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Basic Salary</td>
                <td class="amount">${{ number_format($pod->field('basic_salary'), 2) }}</td>
                <td>Federal Tax</td>
                <td class="amount">${{ number_format($pod->field('federal_tax'), 2) }}</td>
            </tr>
            <tr>
                <td>Bonuses</td>
                <td class="amount">${{ number_format($pod->field('bonuses'), 2) }}</td>
                <td>Social Security Tax</td>
                <td class="amount">${{ number_format($pod->field('social_security_tax'), 2) }}</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>Medicaid Tax</td>
                <td class="amount">${{ number_format($pod->field('medicaid_tax'), 2) }}</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>State Tax</td>
                <td class="amount">${{ number_format($pod->field('state_tax'), 2) }}</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>Medical Insurance (Private)</td>
                <td class="amount">${{ number_format($pod->field('medical_insurance_private'), 2) }}</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>Dental Insurance</td>
                <td class="amount">${{ number_format($pod->field('dental_insurance'), 2) }}</td>
            </tr>
        </tbody>
        <tfoot>
            <tr class="totals">
                <td>Total Earnings</td>
                <td class="amount">${{ number_format($pod->field('total_earnings'), 2) }}</td>
                <td>Total Deductions</td>
                <td class="amount">${{ number_format($pod->field('total_deductions'), 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="net-pay">Net Pay: ${{ number_format($pod->field('net_pay'), 2) }}</div>

    <div class="signature">Employee signature:</div>
    <div class="signature">Director:</div>

    <div class="dashboard-link">
        <a href="{{ get_permalink(get_page_by_path('portal-dashboard')) }}">Back to Dashboard</a>
        <a href="javascript:window.print();" style="margin-left: 10px; background-color: #2196F3;">Print Payslip</a>
    </div>
</body>
</html>