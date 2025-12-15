<?php

namespace ReportBurster_Portal\Http\Controllers\Dashboard;

use ReportBurster_Portal\Http\Controllers\Controller;

if (!defined('ABSPATH')) {
  exit();
}

class DashboardController extends Controller
{
  public function index()
  {

    $books = [
      [
        'title' => 'The Great Gatsby',
        'author' => 'F. Scott Fitzgerald',
        'year' => 1925
      ],
      [
        'title' => 'To Kill a Mockingbird',
        'author' => 'Harper Lee',
        'year' => 1960
      ],
      [
        'title' => '1984',
        'author' => 'George Orwell',
        'year' => 1949
      ],
      [
        'title' => 'The Catcher in the Rye',
        'author' => 'J.D. Salinger',
        'year' => 1951
      ],
      [
        'title' => 'The Hobbit',
        'author' => 'J.R.R. Tolkien',
        'year' => 1937
      ],
    ];

    return ReportBurster_Portal()
      ->view('dashboard.index', ['books' => $books])
      ->withAdminStyle('prism')
      ->withAdminScript('prism')
      ->withAdminStyle('reportburster-portal-common');
  }
}
