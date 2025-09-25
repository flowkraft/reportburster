<?php
/**
 * Generic secure single document template (works also for invoices etc.)
 *
 * OPTIONAL Pods fields you may add (all boolean/relationships can be left empty):
 *  - allow_public_view     (Boolean)            If true: anyone with URL can view (no auth required).
 *  - associated_user       (User Relationship)  Exact WP User owner.
 *  - associated_group      (Relationship)       Group / team / department (implement your own membership check).
 *  - associated_role       (Pick / Multi-Select) One or more WP role slugs allowed (e.g. employee, customer).
 *
 * Logic (in order):
 *  1. If allow_public_view = true => bypass all other checks.
 *  2. Otherwise user must be logged in.
 *  3. If associated_user set => only that user (or admin) allowed.
 *  4. Else if associated_group set => user must be in that group (placeholder hook).
 *  5. Else if associated_role set => user must have at least one matching role.
 *  6. Else fallback: require logged-in user (already enforced).
 *
 * You can reuse this file for other doc types by copying & renaming to single-invoice.php etc.
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
$associated_group_ids = [];
/*
$associated_group_ids = (array) $pod->field('associated_group'); // adjust depending on Pods storage
*/
$associated_roles = [];
/*
$raw_roles = $pod->field('associated_role');
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
    elseif ( $associated_group_ids ) {
        /*
        // Example placeholder:
        $user_group_ids = []; // TODO: fetch groups for current user.
        if ( ! array_intersect( $associated_group_ids, $user_group_ids ) ) {
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

// ---------------- DATA FIELDS (only those that currently exist) ----------------
$employee    = esc_html( (string) $pod->display('employee') );
$period      = esc_html( (string) $pod->display('period') );
$grossAmount = number_format( (float) $pod->field('gross_amount'), 2 );
$netAmount   = number_format( (float) $pod->field('net_amount'), 2 );

// Load theme header (includes Tailwind and other assets)
get_header();
?>

<div class="max-w-xl mx-auto bg-white font-sans text-gray-900 p-6">
  <h1 class="text-2xl font-bold mb-2"><?php echo esc_html( get_the_title() ); ?></h1>
  <?php if ( $allow_public_view ): ?>
    <div class="text-xs text-gray-500 mb-4">Public document (no login required).</div>
  <?php endif; ?>
  <table class="w-full border border-gray-300 rounded-lg mt-6">
    <tbody>
      <tr class="border-b border-gray-200">
        <td class="py-2 px-4 font-medium">Employee</td>
        <td class="py-2 px-4"><?php echo $employee; ?></td>
      </tr>
      <tr class="border-b border-gray-200">
        <td class="py-2 px-4 font-medium">Period</td>
        <td class="py-2 px-4"><?php echo $period; ?></td>
      </tr>
      <tr class="border-b border-gray-200">
        <td class="py-2 px-4 font-medium">Gross Amount</td>
        <td class="py-2 px-4 text-right">$<?php echo $grossAmount; ?></td>
      </tr>
      <tr>
        <td class="py-2 px-4 font-medium">Net Amount</td>
        <td class="py-2 px-4 text-right">$<?php echo $netAmount; ?></td>
      </tr>
    </tbody>
  </table>

  <div class="mt-8 font-bold text-right bg-gray-100 p-4 rounded-lg text-lg">
    Net Pay: $<?php echo $netAmount; ?>
  </div>

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