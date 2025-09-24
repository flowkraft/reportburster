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
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title><?php echo esc_html( get_the_title() ); ?> | <?php echo esc_html( get_bloginfo('name') ); ?></title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: Arial, sans-serif; margin:0; padding:20px;}
    h1 { margin:0 0 10px; }
    table { width:100%; border-collapse:collapse; margin-top:20px;}
    th,td { border:1px solid #000; padding:8px; text-align:left;}
    td.amount { text-align:right; }
    .net-pay { margin-top:25px; font-weight:bold; text-align:right; background:#f2f2f2; padding:10px;}
    .meta { font-size:12px; color:#666; margin-bottom:10px;}
    .actions { margin-top:30px; text-align:center;}
    .actions a { display:inline-block; padding:10px 15px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:4px; }
    .actions a.print { background:#2196F3; margin-left:10px;}
    .actions a:hover { opacity:.9; }
    @media print { .actions { display:none; } }
  </style>
</head>
<body>
  <h1><?php echo esc_html( get_the_title() ); ?></h1>
  <?php if ( $allow_public_view ): ?>
    <div class="meta">Public document (no login required).</div>
  <?php endif; ?>
  <table>
    <tbody>
      <tr><td>Employee</td><td><?php echo $employee; ?></td></tr>
      <tr><td>Period</td><td><?php echo $period; ?></td></tr>
      <tr><td>Gross Amount</td><td class="amount">$<?php echo $grossAmount; ?></td></tr>
      <tr><td>Net Amount</td><td class="amount">$<?php echo $netAmount; ?></td></tr>
    </tbody>
  </table>

  <div class="net-pay">Net Pay: $<?php echo $netAmount; ?></div>

  <div class="actions">
    <?php
      $account_page_id = (int) get_option('reportburster_account_page_id');
      $back_url = $account_page_id
        ? get_permalink($account_page_id)
        : ( get_permalink( get_page_by_path('my-documents') ) ?: home_url() );
    ?>
    <a href="<?php echo esc_url( $back_url ); ?>">Back to Documents</a>
    <a class="print" href="javascript:window.print();">Print</a>
  </div>
</body>
</html>