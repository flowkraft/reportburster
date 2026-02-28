/*
 * CFO Dashboard - Chart Configurations
 * Models the CFO Analytics Dashboard (Northwind Traders) with named chart components.
 */

// Revenue Trend — line chart with actual revenue vs target, 6 months
chart('revenueTrend') {
  type 'line'
  labelField 'Month'
  series {
    series {
      field 'Revenue'
      label 'Revenue'
      borderColor '#3b82f6'
      backgroundColor 'rgba(59, 130, 246, 0.1)'
      fill true
      tension 0.4
      borderWidth 2
      pointRadius 4
    }
    series {
      field 'Target'
      label 'Target'
      borderColor '#ef4444'
      borderDash([5, 5])
      borderWidth 2
      fill false
      tension 0.4
      pointRadius 3
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Revenue Trend' }
      legend { position 'bottom' }
    }
    scales {
      y { beginAtZero false; title { display true; text 'Amount ($)' } }
    }
  }
}

// Revenue by Category — doughnut chart showing revenue distribution
chart('revenueByCategory') {
  type 'doughnut'
  labelField 'Category'
  series {
    series {
      field 'Revenue'
      label 'Revenue ($)'
      backgroundColor(['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'])
      borderWidth 2
    }
  }
  options {
    responsive true
    cutout '60%'
    plugins {
      title { display true; text 'Revenue by Category' }
      legend { position 'right' }
    }
  }
}

// Accounts Receivable Aging — vertical bar chart with color-coded aging buckets
chart('arAging') {
  type 'bar'
  labelField 'Bucket'
  series {
    series {
      field 'Amount'
      label 'Outstanding ($)'
      backgroundColor(['#22c55e', '#eab308', '#f97316', '#ef4444'])
      borderWidth 1
    }
  }
  options {
    responsive true
    plugins {
      title { display true; text 'Accounts Receivable Aging' }
      legend { display false }
    }
    scales {
      y { beginAtZero true; title { display true; text 'Amount ($)' } }
    }
  }
}

// Revenue by Country — horizontal bar chart showing top 5 countries
chart('revenueByCountry') {
  type 'bar'
  labelField 'Country'
  series {
    series {
      field 'Revenue'
      label 'Revenue ($)'
      backgroundColor(['#ec4899', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'])
      borderWidth 1
    }
  }
  options {
    indexAxis 'y'
    responsive true
    plugins {
      title { display true; text 'Revenue by Country' }
      legend { display false }
    }
    scales {
      x { beginAtZero true; title { display true; text 'Revenue ($)' } }
    }
  }
}
