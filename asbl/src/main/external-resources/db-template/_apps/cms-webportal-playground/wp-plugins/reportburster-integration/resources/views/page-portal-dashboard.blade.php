<?php
@php
// Security check - only allow access to logged-in users
if (!is_user_logged_in()) {
    auth_redirect();
    exit;
}

// Get the current user and determine their role
$current_user = wp_get_current_user();
$current_user_id = $current_user->ID;
$is_employee = in_array('employee', $current_user->roles);
$is_admin = current_user_can('administrator');

// Initialize variables for both content types
$payslips_found = false;
$payslips_rows = [];

// Only query payslips if the user is an employee
if ($is_employee || $is_admin) {
    // Query payslips associated with the current user
    $params = array(
        'limit' => -1,
        'where' => "associated_employee.ID = {$current_user_id}",
        'orderby' => 'pay_period DESC'
    );

    $payslips = pods('payslip', $params);
    $payslips_found = $payslips->total() > 0;

    // Format data for the BladewindUI table component
    if ($payslips_found) {
        while ($payslips->fetch()) {
            // Use pods_url() for Advanced Content Types
            $permalink = pods_url($payslips->pod, $payslips->id());
            
            $payslips_rows[] = [
                'id' => $payslips->id(),
                'pay_period' => $payslips->display('pay_period'),
                'department' => $payslips->display('department'),
                'position' => $payslips->display('position_grade'),
                'earnings' => '$' . number_format($payslips->field('total_earnings'), 2),
                'net_pay' => '$' . number_format($payslips->field('net_pay'), 2),
                'actions' => '<a href="' . $permalink . '" class="text-blue-600 hover:text-blue-900">View</a>'
            ];
        }
    }
}

// Initialize variables for invoices (would be populated similarly for customers)
$invoices_found = false;
$invoices_rows = [];

// Only query invoices if user is NOT an employee (i.e., is a customer)
// This is just a placeholder - you'll need to implement your actual invoice query logic
if (!$is_employee || $is_admin) {
    // Query invoices associated with the current user
    // This is a placeholder - implement your actual invoice query logic here
    /*
    $params = array(
        'limit' => -1,
        'where' => "associated_customer.ID = {$current_user_id}",
        'orderby' => 'invoice_date DESC'
    );

    $invoices = pods('invoice', $params);
    $invoices_found = $invoices->total() > 0;

    if ($invoices_found) {
        while ($invoices->fetch()) {
            $permalink = pods_url($invoices->pod, $invoices->id());
            
            $invoices_rows[] = [
                'id' => $invoices->id(),
                'invoice_number' => $invoices->display('invoice_number'),
                'date' => $invoices->display('invoice_date'),
                'amount' => '$' . number_format($invoices->field('grand_total'), 2),
                'status' => $invoices->display('status'),
                'actions' => '<a href="' . $permalink . '" class="text-blue-600 hover:text-blue-900">View</a>'
            ];
        }
    }
    */
}
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Portal Dashboard | {{ get_bloginfo('name') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h1 class="text-2xl font-bold text-gray-900">My Dashboard</h1>
                <p class="mt-1 text-sm text-gray-500">
                    Welcome, {{ $current_user->display_name }}. View your account information below.
                </p>
            </div>

            @if($is_employee || $is_admin)
                <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h2 class="text-xl font-semibold text-gray-800">My Payslips</h2>
                </div>
                
                @if($payslips_found)
                    <div class="flex flex-col">
                        <div class="overflow-x-auto">
                            <div class="py-2 align-middle inline-block min-w-full">
                                <x-bladewind::table
                                    striped="true"
                                    compact="true"
                                    searchable="true"
                                    search_placeholder="Search payslips..."
                                    :data="$payslips_rows"
                                    :headers="[
                                        'Pay Period' => 'pay_period',
                                        'Department' => 'department',
                                        'Position/Grade' => 'position',
                                        'Total Earnings' => 'earnings',
                                        'Net Pay' => 'net_pay',
                                        'Actions' => 'actions'
                                    ]"
                                />
                            </div>
                        </div>
                    </div>
                @else
                    <div class="text-center py-12">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">No payslips found</h3>
                        <p class="mt-1 text-sm text-gray-500">
                            You don't have any payslips available yet.
                        </p>
                    </div>
                @endif
            @endif

            {{-- This section would display invoices for customers --}}
            @if(!$is_employee || $is_admin)
                {{-- 
                <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h2 class="text-xl font-semibold text-gray-800">My Invoices</h2>
                </div>
                
                @if($invoices_found)
                    <div class="flex flex-col">
                        <div class="overflow-x-auto">
                            <div class="py-2 align-middle inline-block min-w-full">
                                <x-bladewind::table
                                    striped="true"
                                    compact="true"
                                    searchable="true"
                                    search_placeholder="Search invoices..."
                                    :data="$invoices_rows"
                                    :headers="[
                                        'Invoice #' => 'invoice_number',
                                        'Date' => 'date',
                                        'Amount' => 'amount',
                                        'Status' => 'status',
                                        'Actions' => 'actions'
                                    ]"
                                />
                            </div>
                        </div>
                    </div>
                @else
                    <div class="text-center py-12">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
                        <p class="mt-1 text-sm text-gray-500">
                            You don't have any invoices available yet.
                        </p>
                    </div>
                @endif
                --}}
            @endif

            @if(!$is_employee && !$is_admin && !$invoices_found)
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No data found</h3>
                    <p class="mt-1 text-sm text-gray-500">
                        Your dashboard is currently empty.
                    </p>
                </div>
            @endif
        </div>
    </div>
</body>
</html>