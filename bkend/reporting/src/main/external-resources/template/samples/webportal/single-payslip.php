<?php
/**
 * Secure single payslip template for Pods "payslip" content type.
 *  
 * Plain PHP (WordPress, Pods Framework, Tailwind CSS)
 *
 * Features:
 *  - Requires login.
 *  - Ownership via Pods User Relationship field: associated_user (if present).
 *
 * OPTIONAL Pods fields you may add (all boolean/relationships can be left empty):
 *  - allow_public_view     (Boolean)            If true: anyone with URL can view (no auth required).
 *  - associated_user       (User Relationship)  Exact WP User owner.
 *  - associated_groups      (Pick / Multi-Select) One or more WP group slugs allowed (e.g. it, hr).
 *  - associated_roles       (Pick / Multi-Select) One or more WP role slugs allowed (e.g. employee, customer).
 *
 * Logic (in order):
 *  1. If allow_public_view = true => bypass all other checks.
 *  2. Otherwise user must be logged in.
 *  3. If associated_user set => only that user (or admin) allowed.
 *  4. Else if associated_groups set => user must be in at least one matching group.
 *  5. Else if associated_roles set => user must have at least one matching role.
 *  6. Else fallback: require logged-in user (already enforced).
 */
if ( ! defined('ABSPATH') ) { exit; }

$pod = function_exists('pods') ? pods( get_post_type(), get_the_ID() ) : null;
if ( ! $pod ) {
    wp_die('Document data unavailable.');
}

$doc_type = get_post_type();

// --- 1. Public flag (uncomment after creating the field) ---
$allow_public_view = false;
/*
$allow_public_view = (bool) $pod->field('allow_public_view');
*/

// --- 2. Require login unless public ---
if ( ! $allow_public_view && ! is_user_logged_in() ) {
    auth_redirect(); // redirects & exits
    exit;
}

$current_user = wp_get_current_user();
$is_admin     = current_user_can('administrator');

// Collect intended access controls (may be empty if fields not defined)
$associated_user_id  = 0;
/*
$associated_user_id = (int) $pod->field('associated_user.ID');
*/
$associated_groups_ids = [];
/*
$associated_groups_ids = (array) $pod->field('associated_groups'); // adjust depending on Pods storage
*/
$associated_roles = [];
/*
$raw_roles = $pod->field('associated_roles');
$associated_roles = is_array($raw_roles) ? $raw_roles : ( $raw_roles ? [ $raw_roles ] : [] );
*/

// --- 3–5. Conditional enforcement (skip if public or admin) ---
if ( ! $allow_public_view && ! $is_admin ) {

    // 3. Exact user ownership
    if ( $associated_user_id ) {
        if ( get_current_user_id() !== $associated_user_id ) {
            wp_die('Not authorized (owner mismatch).');
        }
    }
    // 4. Group membership (placeholder – implement your own check)
    elseif ( $associated_groups_ids ) {
        /*
        // Example placeholder:
        $user_group_ids = []; // TODO: fetch groups for current user.
        if ( ! array_intersect( $associated_groups_ids, $user_group_ids ) ) {
            wp_die('Not authorized (group mismatch).');
        }
        */
    }
    // 5. Role-based access
    elseif ( $associated_roles ) {
        $user_roles = (array) $current_user->roles;
        if ( ! array_intersect( $associated_roles, $user_roles ) ) {
            wp_die('Not authorized (role mismatch).');
        }
    }
    // 6. Else: already logged in so allowed.
}

// ---------------- DATA FIELDS (fetch from payslip pod) ----------------
$employee              = esc_html( (string) $pod->display('employee') );
$employee_id           = esc_html( (string) $pod->display('employee_id') );
$social_security       = esc_html( (string) $pod->display('social_security_number') );
$period                = esc_html( (string) $pod->display('period') );
$department            = esc_html( (string) $pod->display('department') );
$job_title             = esc_html( (string) $pod->display('job_title') );
$basic_salary          = number_format( (float) $pod->field('basic_salary'), 2 );
$federal_tax           = number_format( (float) $pod->field('federal_tax'), 2 );
$bonuses               = number_format( (float) $pod->field('bonuses'), 2 );
$social_security_tax   = number_format( (float) $pod->field('social_security_tax'), 2 );
$medicare_tax          = number_format( (float) $pod->field('medicare_tax'), 2 );
$state_tax             = number_format( (float) $pod->field('state_tax'), 2 );
$medical               = number_format( (float) $pod->field('medical'), 2 );
$dental                = number_format( (float) $pod->field('dental'), 2 );
$total_earnings        = number_format( (float) $pod->field('total_earnings'), 2 );
$total_deductions      = number_format( (float) $pod->field('total_deductions'), 2 );
$net_pay               = number_format( (float) $pod->field('net_pay'), 2 );

// Load theme header (includes Tailwind and other assets)
get_header();
?>

<div class="max-w-2xl mx-auto bg-white font-sans text-gray-900 p-6 rounded-lg shadow-lg my-8">
  <!-- Company Info -->
  <div class="text-center mb-6">
    <div class="text-white bg-blue-900 py-2 rounded-t-lg font-semibold text-lg tracking-wide">Northridge Pharmaceuticals</div>
    <div class="bg-blue-800 text-white py-1">7649F Diamond Hts Blvd</div>
    <div class="bg-blue-800 text-white py-1">San Francisco</div>
    <div class="bg-blue-800 text-white py-1 rounded-b-lg">(415) 872-9214</div>
  </div>

  <!-- Payslip Header -->
  <div class="text-center text-2xl font-bold text-blue-900 mb-6">STATEMENT OF MONTHLY INCOME</div>

  <!-- Employee Details -->
  <table class="w-full mb-6 border border-gray-300 rounded-lg overflow-hidden">
    <tbody>
      <tr class="bg-blue-50">
        <td class="font-medium py-2 px-4">Employee Name</td>
        <td class="py-2 px-4"><?php echo $employee; ?></td>
        <td class="font-medium py-2 px-4">Department</td>
        <td class="py-2 px-4"><?php echo $department; ?></td>
      </tr>
      <tr class="bg-blue-50">
        <td class="font-medium py-2 px-4">Employee ID</td>
        <td class="py-2 px-4"><?php echo $employee_id; ?></td>
        <td class="font-medium py-2 px-4">Position/Grade</td>
        <td class="py-2 px-4"><?php echo $job_title; ?></td>
      </tr>
      <tr class="bg-blue-50">
        <td class="font-medium py-2 px-4">Social Security #</td>
        <td class="py-2 px-4"><?php echo $social_security; ?></td>
        <td class="font-medium py-2 px-4">Pay Period</td>
        <td class="py-2 px-4"><?php echo $period; ?></td>
      </tr>
    </tbody>
  </table>

  <!-- Earnings and Deductions -->
  <table class="w-full border border-gray-300 rounded-lg mb-6">
    <thead>
      <tr class="bg-blue-700 text-white">
        <th class="py-2 px-4 font-semibold">EARNINGS</th>
        <th class="py-2 px-4 font-semibold text-right">AMOUNT</th>
        <th class="py-2 px-4 font-semibold">TAXES/DEDUCTIONS</th>
        <th class="py-2 px-4 font-semibold text-right">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="bg-green-50 py-2 px-4">Basic Salary</td>
        <td class="bg-green-50 py-2 px-4 text-right">$<?php echo $basic_salary; ?></td>
        <td class="bg-red-50 py-2 px-4">Federal Tax</td>
        <td class="bg-red-50 py-2 px-4 text-right">$<?php echo $federal_tax; ?></td>
      </tr>
      <tr>
        <td class="bg-green-50 py-2 px-4">Bonuses</td>
        <td class="bg-green-50 py-2 px-4 text-right">$<?php echo $bonuses; ?></td>
        <td class="bg-red-50 py-2 px-4">Social Security Tax</td>
        <td class="bg-red-50 py-2 px-4 text-right">$<?php echo $social_security_tax; ?></td>
      </tr>
      <tr>
        <td class="bg-green-50 py-2 px-4"></td>
        <td class="bg-green-50 py-2 px-4"></td>
        <td class="bg-red-50 py-2 px-4">Medicare Tax</td>
        <td class="bg-red-50 py-2 px-4 text-right">$<?php echo $medicare_tax; ?></td>
      </tr>
      <tr>
        <td class="bg-green-50 py-2 px-4"></td>
        <td class="bg-green-50 py-2 px-4"></td>
        <td class="bg-red-50 py-2 px-4">State Tax</td>
        <td class="bg-red-50 py-2 px-4 text-right">$<?php echo $state_tax; ?></td>
      </tr>
      <tr>
        <td class="bg-green-50 py-2 px-4"></td>
        <td class="bg-green-50 py-2 px-4"></td>
        <td class="bg-red-50 py-2 px-4">Medical</td>
        <td class="bg-red-50 py-2 px-4 text-right">$<?php echo $medical; ?></td>
      </tr>
      <tr>
        <td class="bg-green-50 py-2 px-4"></td>
        <td class="bg-green-50 py-2 px-4"></td>
        <td class="bg-red-50 py-2 px-4">Dental</td>
        <td class="bg-red-50 py-2 px-4 text-right">$<?php echo $dental; ?></td>
      </tr>
      <!-- Totals -->
      <tr class="bg-blue-100 font-semibold">
        <td>Total Earnings</td>
        <td class="text-right">$<?php echo $total_earnings; ?></td>
        <td>Total Deductions</td>
        <td class="text-right">$<?php echo $total_deductions; ?></td>
      </tr>
      <!-- Net Pay -->
      <tr>
        <td colspan="2"></td>
        <td class="bg-green-700 text-white font-bold text-right">Net Pay</td>
        <td class="bg-green-700 text-white font-bold text-right">$<?php echo $net_pay; ?></td>
      </tr>
    </tbody>
  </table>

  <!-- Signatures -->
  <div class="flex justify-between mt-10 text-gray-600 text-sm">
    <div class="border-t border-blue-900 pt-2 w-1/3 text-center">Employee signature:</div>
    <div class="border-t border-blue-900 pt-2 w-1/3 text-center">Director:</div>
    <div class="w-1/3"></div>
  </div>

  <!-- Actions -->
  <div class="mt-10 flex justify-center gap-4 print:hidden">
    <?php
      $account_page_id = (int) get_option('reportburster_account_page_id');
      $back_url = $account_page_id
        ? get_permalink($account_page_id)
        : ( get_permalink( get_page_by_path('my-documents') ) ?: home_url() );
    ?>
    <a href="<?php echo esc_url( $back_url ); ?>"
       class="inline-block px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition">
      Back to Documents
    </a>
    <a class="inline-block px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
       href="javascript:window.print();">
      Print
    </a>
  </div>
</div>

<?php
// Load theme footer (includes scripts and closes HTML)
get_footer();
?>