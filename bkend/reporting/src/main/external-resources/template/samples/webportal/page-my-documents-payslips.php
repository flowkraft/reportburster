<?php
/**
 * My Payslips (Payslips list)
 * Plain PHP (WordPress, Pods Framework, Tailwind CSS)
 * Features:
 *  - Requires login.
 *  - Lists payslips user may view.
 *  - Ownership via Pods User Relationship field: associated_user (if present).
 *  - Pagination (?page=N) & search (?q=term) on employee name, period, or department.
 *  - Graceful when ownership field not yet defined.
 */

if ( ! defined('ABSPATH') ) { exit; }
if ( ! is_user_logged_in() ) { auth_redirect(); exit; }

$current_user     = wp_get_current_user();
$current_user_id  = (int) $current_user->ID;
$user_roles       = (array) $current_user->roles;
$is_admin         = current_user_can('administrator');
$is_employee      = in_array('employee', $user_roles, true);

$post_type        = 'payslip';
$ownership_field  = 'associated_user'; // Pods User Relationship field name
$per_page         = 15;
$page_param       = 'page';
$search_param     = 'q';

$paged        = max( 1, (int) ( $_GET[$page_param] ?? 1 ) );
$search_term  = isset($_GET[$search_param]) ? sanitize_text_field( wp_unslash( $_GET[$search_param] ) ) : '';
$offset       = ( $paged - 1 ) * $per_page;

$payslips_rows   = [];
$payslips_found  = false;
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
if ( function_exists('pods') && ( $is_employee || $is_admin ) ) {

    $where = [];

    if ( $ownership_field_exists ) {
        if ( ! $is_admin ) {
            $where[] = "{$ownership_field}.ID = {$current_user_id}";
            $filtered_notice = '(Filtered to your payslips)';
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
        $where[] = "( employee LIKE '{$like}' OR period LIKE '{$like}' OR department LIKE '{$like}' )";
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
        $payslips_found = $total_found > 0;
        $total_pages    = max( 1, (int) ceil( $total_found / $per_page ) );

        if ( $payslips_found ) {
            while ( $pod->fetch() ) {
                $pid         = (int) $pod->id();
                $title       = get_the_title( $pid );
                $employee    = (string) $pod->display( 'employee' );
                $period      = (string) $pod->display( 'period' );
                $department  = (string) $pod->display( 'department' );
                $job_title   = (string) $pod->display( 'job_title' );
                $basic_salary = (float) $pod->field( 'basic_salary' );
                $net_pay     = (float) $pod->field( 'net_pay' );
                $date        = get_the_date( 'Y-m-d', $pid );

                $payslips_rows[] = [
                    'title'      => esc_html( $title ),
                    'employee'   => esc_html( $employee ),
                    'period'     => esc_html( $period ),
                    'department' => esc_html( $department ),
                    'job_title'  => esc_html( $job_title ),
                    'basic_salary' => $basic_salary ? '$' . number_format( $basic_salary, 2 ) : '',
                    'net_pay'    => $net_pay ? '$' . number_format( $net_pay, 2 ) : '',
                    'date'       => esc_html( $date ),
                    'link'       => esc_url( get_permalink( $pid ) ),
                ];
            }
        }
    }
}

/**
 * Simple pagination
 */
function my_payslips_paginate( int $current, int $total, string $param = 'page' ): void {
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

<div class="max-w-3xl mx-auto py-8">
  <h1 class="text-2xl font-bold mb-2">My Payslips</h1>
  <p class="text-sm text-gray-600 mb-4">
    Payslips you are authorized to view.
    <?php if ( $filtered_notice ) : ?>
      <span class="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2 text-xs"><?php echo esc_html( $filtered_notice ); ?></span>
    <?php endif; ?>
    <?php if ( $search_term !== '' ) : ?>
      <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2 text-xs">Search: “<?php echo esc_html( $search_term ); ?>”</span>
    <?php endif; ?>
  </p>

  <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold mb-0">Payslips
        <?php if ( $payslips_found ): ?>
          <span class="ml-2 text-xs text-gray-500">(<?php echo (int) $total_found; ?> total)</span>
        <?php endif; ?>
      </h2>
      <form method="get" class="flex gap-2 items-center">
        <input
          type="text"
          name="<?php echo esc_attr( $search_param ); ?>"
          value="<?php echo esc_attr( $search_term ); ?>"
          placeholder="Search employee, period, or department..."
          class="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button type="submit" class="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Search</button>
        <?php if ( $search_term !== '' ): ?>
          <a href="<?php echo esc_url( remove_query_arg( $search_param ) ); ?>" class="ml-2 text-blue-600 hover:underline text-xs">Reset</a>
        <?php endif; ?>
      </form>
    </div>

    <?php if ( $payslips_found ): ?>
      <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-200 rounded-lg">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Employee</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Period</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Department</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Job Title</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700">Basic Salary</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-700">Net Pay</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
              <th class="px-4 py-2 text-center text-xs font-semibold text-gray-700" style="width:60px;">View</th>
            </tr>
          </thead>
          <tbody>
          <?php foreach ( $payslips_rows as $row ): ?>
            <tr class="border-b last:border-b-0 hover:bg-gray-50">
              <td class="px-4 py-2"><?php echo $row['employee']; ?></td>
              <td class="px-4 py-2"><?php echo $row['period']; ?></td>
              <td class="px-4 py-2"><?php echo $row['department']; ?></td>
              <td class="px-4 py-2"><?php echo $row['job_title']; ?></td>
              <td class="px-4 py-2 text-right"><?php echo $row['basic_salary']; ?></td>
              <td class="px-4 py-2 text-right"><?php echo $row['net_pay']; ?></td>
              <td class="px-4 py-2"><?php echo $row['date']; ?></td>
              <td class="px-4 py-2 text-center">
                <a href="<?php echo $row['link']; ?>" class="text-blue-600 hover:underline">View</a>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php my_payslips_paginate( $paged, $total_pages, $page_param ); ?>
    <?php else: ?>
      <div class="py-6 text-center text-gray-500 italic">
        <?php if ( $search_term !== '' ): ?>
          No payslips match “<?php echo esc_html( $search_term ); ?>”.
        <?php elseif ( ! $is_employee && ! $is_admin ): ?>
          No payslips available for your role.
        <?php else: ?>
          No payslips found.
        <?php endif; ?>
      </div>
    <?php endif; ?>
  </div>
</div>

<?php
// Load theme footer (includes scripts and closes HTML)
get_footer();
?>