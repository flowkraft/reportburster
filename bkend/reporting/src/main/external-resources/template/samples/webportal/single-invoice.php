<?php
/**
 * Secure single invoice template for Pods "invoice" content type.
 * 
 * Plain PHP (WordPress, Pods Framework, Tailwind CSS)
 * Features:
 *  - Requires login.
 *  - Ownership via Pods User Relationship field: associated_user (if present).
 *  - Visual status hints (Unpaid, Paid, Viewed).
 *  - "Pay Invoice" button for unpaid/viewed invoices (non-admins only).
 *  - Admins see "Unpaid" for unpaid and "Viewed" for viewed. Admins never see "Pay Invoice".
 *  - Paid invoices: grand total is strikethrough for strong visual hint.
 *
 * OPTIONAL Pods fields you may add (all boolean/relationships can be left empty):
 *  - allow_public_view     (Boolean)            If true: anyone with URL can view (no auth required).
 *  - associated_user       (User Relationship)  Exact WP User owner.
 *  - associated_groups     (Pick / Multi-Select) One or more WP group slugs allowed (e.g. it, hr).
 *  - associated_roles      (Pick / Multi-Select) One or more WP role slugs allowed (e.g. employee, customer).
 *  - document_status       (Dropdown) One of UN|Unpaid and PA|Paid.
 *  - was_viewed_by         (Text) not_viewed or viewed_by_associated_user or viewed_by_<user_id>.
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

// ---------------- DATA FIELDS (fetch from invoice pod) ----------------
$order_id      = esc_html( (string) $pod->display('order_id') );
$order_date    = esc_html( (string) $pod->display('order_date') );
$customer_id   = esc_html( (string) $pod->display('customer_id') );
$customer_name = esc_html( (string) $pod->display('customer_name') );
$freight       = number_format( (float) $pod->field('freight'), 2 );
$subtotal      = number_format( (float) $pod->field('subtotal'), 2 );
$tax           = number_format( (float) $pod->field('tax'), 2 );
$grand_total   = number_format( (float) $pod->field('grand_total'), 2 );

// Invoice Status logic (codes: UN|Unpaid, PA|Paid)
$document_status = '';
$status_label = '';
$status_color = '';
$status = $pod->field('document_status');
if (is_array($status)) {
    $document_status = isset($status['name']) ? $status['name'] : '';
    $document_status_code = isset($status['slug']) ? strtoupper($status['slug']) : strtoupper($document_status);
} else {
    $document_status = (string)$status;
    $document_status_code = strtoupper($document_status);
}
switch ($document_status_code) {
    case 'UN':
    case 'UNPAID':
        $status_label = 'Unpaid';
        $status_color = 'bg-gray-100 text-gray-800 border-gray-300';
        break;
    case 'PA':
    case 'PAID':
        $status_label = 'Paid';
        $status_color = 'bg-gray-100 text-gray-800 border-gray-300';
        break;
    default:
        $status_label = ucfirst($document_status);
        $status_color = 'bg-gray-100 text-gray-800 border-gray-300';
        break;
}

// --- Was viewed logic (use was_viewed_by field) ---
$was_viewed_by = (string) $pod->field('was_viewed_by');
$was_viewed = (strpos($was_viewed_by, 'viewed_by_associated_user') !== false);

// Parse line items JSON
$line_items_json = $pod->field('line_items_json');
$line_items = [];
if ($line_items_json) {
    $decoded = json_decode($line_items_json, true);
    if (is_array($decoded)) {
        $line_items = $decoded;
    }
}

// Load theme header (includes Tailwind and other assets)
get_header();
?>

<div class="max-w-3xl mx-auto bg-white font-sans text-gray-900 p-8 rounded-lg shadow-lg my-10">
  <!-- Company Info -->
  <div class="text-center mb-6">
    <div class="text-white bg-blue-900 py-2 rounded-t-lg font-semibold text-lg tracking-wide">Northridge Pharmaceuticals</div>
    <div class="bg-blue-900 text-white py-1">7649F Diamond Hts Blvd</div>
    <div class="bg-blue-900 text-white py-1">San Francisco</div>
    <div class="bg-blue-900 text-white py-1 rounded-b-lg">(415) 872-9214</div>
  </div>

  <!-- Invoice Header -->
  <div class="flex flex-col sm:flex-row sm:justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-blue-900 mb-1">Invoice <?php echo $order_id; ?></h1>
      <div class="text-gray-600 text-sm">Date: <?php echo $order_date; ?></div>
    </div>
    <div class="mt-2 sm:mt-0 flex items-center gap-2">
      <?php if ($document_status_code === 'UN' || $document_status_code === 'UNPAID'): ?>
        <span class="inline-block px-4 py-1 border rounded <?php echo $status_color; ?> font-semibold text-base">
          <?php echo esc_html($status_label); ?>
        </span>
      <?php elseif ($document_status_code === 'PA' || $document_status_code === 'PAID'): ?>
        <span class="inline-block px-4 py-1 border rounded <?php echo $status_color; ?> font-semibold text-base">
          <?php echo esc_html($status_label); ?>
        </span>
      <?php endif; ?>
      <?php
        // Show "Viewed" (eye icon) only for admins if was_viewed is true
        if ($is_admin && $was_viewed): ?>
        <span class="inline-flex items-center px-3 py-1 border border-gray-300 bg-gray-100 text-gray-700 rounded font-semibold text-base ml-2">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Viewed
        </span>
      <?php endif; ?>
    </div>
  </div>

  <!-- Customer Info -->
  <div class="mb-6">
    <div class="text-lg font-semibold text-gray-800">Billed To:</div>
    <div class="ml-2 text-gray-700">
      <div><span class="font-medium">Customer:</span> <?php echo $customer_id; ?> (<?php echo $customer_name; ?>)</div>
    </div>
  </div>

  <!-- Line Items Table -->
  <h2 class="text-lg font-bold text-blue-900 mb-2">Details</h2>
  <div class="overflow-x-auto">
    <table class="min-w-full border border-gray-200 rounded-lg mb-6">
      <thead>
        <tr class="bg-gray-50">
          <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
          <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700">Quantity</th>
          <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700">Unit Price</th>
          <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700">Discount</th>
          <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700">Line Total</th>
        </tr>
      </thead>
      <tbody>
        <?php
        $calculated_subtotal = 0.0;
        foreach ($line_items as $item):
            $product = isset($item['product_name']) ? esc_html($item['product_name']) : '';
            $qty = isset($item['quantity']) ? (float)$item['quantity'] : 0;
            $unit_price = isset($item['unit_price']) ? (float)$item['unit_price'] : 0;
            $discount = isset($item['discount']) ? (float)$item['discount'] : 0;
            $line_total = ($qty * $unit_price) - $discount;
            $calculated_subtotal += $line_total;
        ?>
        <tr class="border-b last:border-b-0 hover:bg-gray-50">
          <td class="px-4 py-2"><?php echo $product; ?></td>
          <td class="px-4 py-2 text-right"><?php echo $qty; ?></td>
          <td class="px-4 py-2 text-right">$<?php echo number_format($unit_price, 2); ?></td>
          <td class="px-4 py-2 text-right">
            <?php echo $discount ? '$' . number_format($discount, 2) : '-'; ?>
          </td>
          <td class="px-4 py-2 text-right">$<?php echo number_format($line_total, 2); ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
      <tfoot>
        <tr class="bg-gray-100 font-semibold">
          <td colspan="4" class="text-right px-4 py-2">Subtotal:</td>
          <td class="text-right px-4 py-2">$<?php echo $subtotal; ?></td>
        </tr>
        <tr>
          <td colspan="4" class="text-right px-4 py-2">Freight:</td>
          <td class="text-right px-4 py-2">$<?php echo $freight; ?></td>
        </tr>
        <tr>
          <td colspan="4" class="text-right px-4 py-2">Tax:</td>
          <td class="text-right px-4 py-2">$<?php echo $tax; ?></td>
        </tr>
        <tr class="bg-blue-50 font-bold">
          <td colspan="4" class="text-right px-4 py-2">Grand Total:</td>
          <td class="text-right px-4 py-2">
            <?php if ($document_status_code === 'PA' || $document_status_code === 'PAID'): ?>
              <span style="text-decoration: line-through; color: #888;">$<?php echo $grand_total; ?></span>
            <?php else: ?>
              $<?php echo $grand_total; ?>
            <?php endif; ?>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Pay Invoice Button (for Unpaid or Viewed, only for non-admins) -->
  <?php if (
    !$is_admin &&
    (
      $document_status_code === 'UN' ||
      $document_status_code === 'UNPAID' ||
      $was_viewed
    )
  ): ?>
    <div class="flex justify-end mt-8">
      <a href="#"
         class="inline-block px-8 py-3 rounded bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition"
         style="letter-spacing:0.5px;">
        Pay Invoice
      </a>
    </div>
  <?php endif; ?>

  <!-- Actions -->
  <div class="mt-10 flex justify-center gap-4 print:hidden">
    <?php
      $account_page_id = (int) get_option('reportburster_account_page_id');
      $back_url = $account_page_id
        ? get_permalink($account_page_id)
        : ( get_permalink( get_page_by_path('my-documents') ) ?: home_url() );
    ?>
    <a href="<?php echo esc_url( $back_url ); ?>"
       class="inline-block px-5 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 transition">
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