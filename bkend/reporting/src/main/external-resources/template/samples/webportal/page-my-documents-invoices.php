<?php
/**
 * My Invoices (Invoices list)
 * Plain PHP (WordPress, Pods Framework, Tailwind CSS)
 * Features:
 *  - Requires login.
 *  - Lists invoices user may view.
 *  - Ownership via Pods User Relationship field: associated_user (if present).
 *  - Pagination (?page=N) & search (?q=term) on customer name, order id, or date.
 *  - Visual status hints (Unpaid, Paid, Viewed).
 *  - "Pay Invoice" button for unpaid/viewed invoices (non-admins only).
 *  - Admins see "Unpaid" for unpaid and "Viewed" for viewed. Admins never see "Pay Invoice".
 *  - Paid invoices: grand total is strikethrough for strong visual hint.
 */

if ( ! defined('ABSPATH') ) { exit; }
if ( ! is_user_logged_in() ) { auth_redirect(); exit; }

$current_user     = wp_get_current_user();
$current_user_id  = (int) $current_user->ID;
$user_roles       = (array) $current_user->roles;
$is_admin         = current_user_can('administrator');

$post_type        = 'invoice';
$ownership_field  = 'associated_user'; // Pods User Relationship field name
$per_page         = 15;
$page_param       = 'page';
$search_param     = 'q';

$paged        = max( 1, (int) ( $_GET[$page_param] ?? 1 ) );
$search_term  = isset($_GET[$search_param]) ? sanitize_text_field( wp_unslash( $_GET[$search_param] ) ) : '';
$offset       = ( $paged - 1 ) * $per_page;

$invoices_rows   = [];
$invoices_found  = false;
$total_found     = 0;
$total_pages     = 1;
$filtered_notice = '';

/**
 * Detect ownership field existence via Pods schema (not meta scan).
 */
$ownership_field_exists = false;
if ( function_exists('pods_api') ) {
    $schema = pods_api()->load_pod( [ 'name' => $post_type ] );
    if ( isset( $schema['fields'][ $ownership_field ] ) ) {
        $ownership_field_exists = true;
    }
}

/**
 * Query only if Pods active and user role allowed.
 */
if ( function_exists('pods') ) {

    $where = [];

    if ( $ownership_field_exists ) {
        if ( ! $is_admin ) {
            $where[] = "{$ownership_field}.ID = {$current_user_id}";
            $filtered_notice = '(Filtered to your invoices)';
        } else {
            $filtered_notice = '(Admin – unfiltered)';
        }
    } else {
        if ( ! $is_admin ) {
            // Hide list from non-admins until ownership field defined
            $where[] = "ID = 0";
            $filtered_notice = '(Ownership field missing)';
        } else {
            $filtered_notice = '(Admin – ownership field missing, list unfiltered)';
        }
    }

    if ( $search_term !== '' ) {
        $like   = '%' . esc_sql( $search_term ) . '%';
        $where[] = "( customer_name LIKE '{$like}' OR order_id LIKE '{$like}' OR order_date LIKE '{$like}' )";
    }

    $params = [
        'limit'   => $per_page,
        'offset'  => $offset,
        'orderby' => 'post_date DESC',
    ];
    if ( $where ) {
        $params['where'] = implode( ' AND ', $where );
    }

    $pod = pods( $post_type, $params );

    if ( $pod ) {
        $total_found    = (int) $pod->total();
        $invoices_found = $total_found > 0;
        $total_pages    = max( 1, (int) ceil( $total_found / $per_page ) );

        if ( $invoices_found ) {
            while ( $pod->fetch() ) {
                $pid           = (int) $pod->id();
                $order_id      = (string) $pod->display( 'order_id' );
                $order_date    = (string) $pod->display( 'order_date' );
                $customer_name = (string) $pod->display( 'customer_name' );
                $grand_total   = (float) $pod->field( 'grand_total' );
                $status        = $pod->field( 'document_status' );
                $status_code   = '';
                $status_label  = '';
                $status_color  = '';
                if (is_array($status)) {
                    $status_code = isset($status['slug']) ? strtoupper($status['slug']) : strtoupper($status['name']);
                } else {
                    $status_code = strtoupper((string)$status);
                }

                // --- Was viewed logic (use was_viewed_by field) ---
                $was_viewed_by = (string) $pod->field('was_viewed_by');
                $was_viewed = (strpos($was_viewed_by, 'viewed_by_associated_user') !== false);

                switch ($status_code) {
                    case 'UN':
                    case 'UNPAID':
                        $status_label = $is_admin ? 'Unpaid' : 'Unpaid';
                        $status_color = 'bg-gray-100 text-gray-800 border border-gray-300';
                        break;
                    case 'PA':
                    case 'PAID':
                        $status_label = 'Paid';
                        $status_color = 'bg-gray-100 text-gray-800 border border-gray-300';
                        break;
                    default:
                        $status_label = ucfirst(strtolower($status_code));
                        $status_color = 'bg-gray-100 text-gray-800 border border-gray-300';
                        break;
                }
                $invoices_rows[] = [
                    'order_id'      => esc_html( $order_id ),
                    'order_date'    => esc_html( $order_date ),
                    'customer_name' => esc_html( $customer_name ),
                    'grand_total'   => $grand_total ? '$' . number_format( $grand_total, 2 ) : '',
                    'status_code'   => $status_code,
                    'status_label'  => $status_label,
                    'status_color'  => $status_color,
                    'link'          => esc_url( get_permalink( $pid ) ),
                    'was_viewed'    => $was_viewed,
                ];
            }
        }
    }
}

/**
 * Simple pagination
 */
function my_invoices_paginate( int $current, int $total, string $param = 'page' ): void {
    if ( $total < 2 ) return;
    echo '<nav class="flex justify-center mt-4 space-x-2 text-sm">';
    for ( $i = 1; $i <= $total; $i++ ) {
        $url = esc_url( add_query_arg( $param, $i ) );
        if ( $i === $current ) {
            echo '<span class="px-3 py-1 rounded bg-blue-600 text-white font-semibold">'.$i.'</span>';
        } else {
            echo '<a href="'.$url.'" class="px-3 py-1 rounded bg-gray-100 hover:bg-blue-100 text-blue-700">'.$i.'</a>';
        }
    }
    echo '</nav>';
}

// Load theme header (includes Tailwind and other assets)
get_header();
?>

<div class="max-w-4xl mx-auto py-8">
  <h1 class="text-2xl font-bold mb-2">My Invoices</h1>
  <p class="text-sm text-gray-600 mb-4">
    Invoices you are authorized to view.
    <?php if ( $filtered_notice ) : ?>
      <span class="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2 text-xs"><?php echo esc_html( $filtered_notice ); ?></span>
    <?php endif; ?>
    <?php if ( $search_term !== '' ) : ?>
      <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2 text-xs">Search: “<?php echo esc_html( $search_term ); ?>”</span>
    <?php endif; ?>
  </p>

  <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold mb-0">Invoices
        <?php if ( $invoices_found ): ?>
          <span class="ml-2 text-xs text-gray-500">(<?php echo (int) $total_found; ?> total)</span>
        <?php endif; ?>
      </h2>
      <form method="get" class="flex gap-2 items-center">
        <input
          type="text"
          name="<?php echo esc_attr( $search_param ); ?>"
          value="<?php echo esc_attr( $search_term ); ?>"
          placeholder="Search customer, order id, or date..."
          class="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button type="submit" class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Search</button>
        <?php if ( $search_term !== '' ): ?>
          <a href="<?php echo esc_url( remove_query_arg( $search_param ) ); ?>" class="ml-2 text-blue-600 hover:underline text-xs">Reset</a>
        <?php endif; ?>
      </form>
    </div>

    <?php if ( $invoices_found ): ?>
      <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-200 rounded-lg">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-4 py-2 text-center text-xs font-semibold text-gray-700" style="width:60px;">View</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Order ID</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Customer</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700">Total</th>
              <th class="px-4 py-2 text-center text-xs font-semibold text-gray-700" style="width:120px;">Status / Action</th>
            </tr>
          </thead>
          <tbody>
          <?php foreach ( $invoices_rows as $row ): ?>
            <tr class="border-b last:border-b-0 hover:bg-gray-50">
              <td class="px-4 py-2 text-center">
                <a href="<?php echo $row['link']; ?>" class="text-blue-600 hover:underline font-semibold text-xs">
                  View
                </a>
              </td>
              <td class="px-4 py-2"><?php echo $row['order_id']; ?></td>
              <td class="px-4 py-2"><?php echo $row['order_date']; ?></td>
              <td class="px-4 py-2"><?php echo $row['customer_name']; ?></td>
              <td class="px-4 py-2 text-right">
                <?php if ($row['status_code'] === 'PA' || $row['status_code'] === 'PAID'): ?>
                  <span style="text-decoration: line-through; color: #888;"><?php echo $row['grand_total']; ?></span>
                <?php else: ?>
                  <?php echo $row['grand_total']; ?>
                <?php endif; ?>
              </td>
              <td class="px-4 py-2 text-center">
                <?php
                // Show "Paid" for paid, "Unpaid" for admin on unpaid, "Viewed" for admin if was_viewed, "Pay Invoice" for non-admin on unpaid or viewed
                if ($row['status_code'] === 'PA' || $row['status_code'] === 'PAID'): ?>
                  <span class="inline-flex items-center px-4 py-1 border border-gray-300 bg-gray-200 text-gray-800 rounded font-semibold text-xs shadow"
                        style="min-width:80px;text-align:center;">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>&nbsp;Paid&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                <?php elseif ($is_admin && $row['was_viewed'] && ($row['status_code'] === 'UN' || $row['status_code'] === 'UNPAID')): ?>
                  <span class="inline-flex items-center px-4 py-1 border border-gray-300 bg-gray-200 text-gray-800 rounded font-semibold text-xs shadow"
                        style="min-width:80px;text-align:center;">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Viewed
                  </span>
                <?php elseif (!$is_admin && ($row['status_code'] === 'UN' || $row['status_code'] === 'UNPAID' || $row['was_viewed'])): ?>
                  <a href="#"
                     class="inline-block px-4 py-1 rounded bg-blue-600 text-white font-semibold text-xs shadow hover:bg-blue-700 transition"
                     style="min-width:80px;text-align:center;">
                    Pay Invoice
                  </a>
                <?php elseif ($is_admin && ($row['status_code'] === 'UN' || $row['status_code'] === 'UNPAID')): ?>
                  <span class="inline-block px-4 py-1 rounded bg-gray-200 text-gray-800 font-semibold text-xs border border-gray-300 shadow"
                        style="min-width:80px;text-align:center;">
                    &nbsp;&nbsp;Unpaid&nbsp;&nbsp;&nbsp;&nbsp;
                  </span>
                <?php else: ?>
                  <span class="inline-block px-4 py-1 rounded bg-gray-200 text-gray-700 font-semibold text-xs"
                        style="min-width:80px;text-align:center;">
                    <?php echo esc_html($row['status_label']); ?>
                  </span>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php my_invoices_paginate( $paged, $total_pages, $page_param ); ?>
    <?php else: ?>
      <div class="py-6 text-center text-gray-500 italic">
        <?php if ( $search_term !== '' ): ?>
          No invoices match “<?php echo esc_html( $search_term ); ?>”.
        <?php elseif ( ! $is_admin ): ?>
          No invoices available for your role.
        <?php else: ?>
          No invoices found.
        <?php endif; ?>
      </div>
    <?php endif; ?>
  </div>
</div>

<?php
// Load theme footer (includes scripts and closes HTML)
get_footer();
?>