<?php
/**
 * My Documents (Payslips list)
 * Plain PHP.
 * Features:
 *  - Requires login.
 *  - Lists payslips user may view.
 *  - Ownership via Pods User Relationship field: associated_user (if present).
 *  - Pagination (?page=N) & search (?q=term) on title or period.
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
            $filtered_notice = '(Filtered to your documents)';
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
        $where[] = "( post_title LIKE '{$like}' OR period LIKE '{$like}' )";
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
                $pid    = (int) $pod->id();
                $title  = get_the_title( $pid );
                $period = (string) $pod->display( 'period' );
                $grossV = (float) $pod->field( 'gross_amount' );
                $netV   = (float) $pod->field( 'net_amount' );

                $payslips_rows[] = [
                    'title'  => esc_html( $title ),
                    'period' => esc_html( $period ),
                    'gross'  => $grossV ? '$' . number_format( $grossV, 2 ) : '',
                    'net'    => $netV   ? '$' . number_format( $netV, 2 )   : '',
                    'date'   => esc_html( get_the_date( 'Y-m-d', $pid ) ),
                    'link'   => esc_url( get_permalink( $pid ) ),
                ];
            }
        }
    }
}

/**
 * Simple pagination
 */
function my_docs_paginate( int $current, int $total, string $param = 'page' ): void {
    if ( $total < 2 ) return;
    echo '<nav class="md-pagination">';
    for ( $i = 1; $i <= $total; $i++ ) {
        $url = esc_url( add_query_arg( $param, $i ) );
        if ( $i === $current ) {
            echo '<span class="current">'.$i.'</span>';
        } else {
            echo '<a href="'.$url.'">'.$i.'</a>';
        }
    }
    echo '</nav>';
}
?><!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title><?php echo esc_html( get_bloginfo('name') ); ?> – My Documents</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: Arial, sans-serif; margin:0; background:#f6f7f9; padding:24px;}
    h1 { margin-top:0; }
    .card { background:#fff; border:1px solid #ddd; border-radius:6px; padding:18px; margin-bottom:28px;}
    table { width:100%; border-collapse:collapse; }
    th,td { padding:8px 6px; border-bottom:1px solid #eee; font-size:14px; text-align:left;}
    th { background:#fafafa; font-weight:600; }
    tr:last-child td { border-bottom:none; }
    .empty { padding:10px; font-style:italic; color:#555; }
    .meta-note { font-size:12px; color:#666; margin:8px 0 8px; }
    a { color:#0366d6; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .top-bar { margin-bottom:22px; }
    .top-bar a.logout { color:#b91c1c; margin-left:12px; }
    form.search { margin:0 0 14px; }
    form.search input[type=text]{ padding:6px 8px; border:1px solid #ccc; border-radius:4px; width:220px;}
    form.search button { padding:6px 10px; border:1px solid #0366d6; background:#0366d6; color:#fff; border-radius:4px; cursor:pointer;}
    nav.md-pagination { margin-top:14px; font-size:13px;}
    nav.md-pagination a, nav.md-pagination span { margin:0 4px; text-decoration:none; }
    nav.md-pagination span.current { font-weight:bold; }
    .badge { display:inline-block; background:#eef; color:#224; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:6px; }
    .count { font-size:11px; color:#444; margin-left:6px; }
  </style>
</head>
<body>
  <div class="top-bar">
    Logged in as <strong><?php echo esc_html( $current_user->display_name ); ?></strong>
    <a class="logout" href="<?php echo esc_url( wp_logout_url( home_url() ) ); ?>">Logout</a>
  </div>

  <h1>My Documents</h1>
  <p class="meta-note">
    Payslips you are authorized to view.
    <?php if ( $filtered_notice ) : ?>
      <span class="badge"><?php echo esc_html( $filtered_notice ); ?></span>
    <?php endif; ?>
    <?php if ( $search_term !== '' ) : ?>
      <span class="badge">Search: “<?php echo esc_html( $search_term ); ?>”</span>
    <?php endif; ?>
  </p>

  <div class="card">
    <h2 style="margin-top:0;">Payslips
      <?php if ( $payslips_found ): ?>
        <span class="count"><?php echo (int) $total_found; ?> total</span>
      <?php endif; ?>
    </h2>

    <form method="get" class="search">
      <input type="text"
             name="<?php echo esc_attr( $search_param ); ?>"
             value="<?php echo esc_attr( $search_term ); ?>"
             placeholder="Search title or period..." />
      <button type="submit">Search</button>
      <?php if ( $search_term !== '' ): ?>
        <a href="<?php echo esc_url( remove_query_arg( $search_param ) ); ?>" style="margin-left:6px;">Reset</a>
      <?php endif; ?>
    </form>

    <?php if ( $payslips_found ): ?>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Period</th>
            <th>Gross</th>
            <th>Net</th>
            <th>Date</th>
            <th style="width:60px;">View</th>
          </tr>
        </thead>
        <tbody>
        <?php foreach ( $payslips_rows as $row ): ?>
          <tr>
            <td><?php echo $row['title']; ?></td>
            <td><?php echo $row['period']; ?></td>
            <td><?php echo $row['gross']; ?></td>
            <td><?php echo $row['net']; ?></td>
            <td><?php echo $row['date']; ?></td>
            <td><a href="<?php echo $row['link']; ?>">View</a></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
      <?php my_docs_paginate( $paged, $total_pages, $page_param ); ?>
    <?php else: ?>
      <div class="empty">
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
</body>
</html>