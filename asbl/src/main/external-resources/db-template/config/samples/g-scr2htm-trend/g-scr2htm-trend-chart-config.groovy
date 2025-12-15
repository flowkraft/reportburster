/*
 * Monthly Sales Trend Chart
 * Dual Y-axis: Sales (left) and Order Count (right)
 */
chart {
  type 'bar'
  
  // X-axis labels from YearMonth column
  labelField 'YearMonth'
  
  series {
    // Monthly Sales - left Y axis (large values)
    series {
      field 'MonthlySales'
      label 'Monthly Sales ($)'
      backgroundColor 'rgba(78, 121, 167, 0.7)'
      borderColor '#4e79a7'
      borderWidth 1
      yAxisID 'y'
      order 1
    }
    
    // Order Count - right Y axis (small values), shown as line for clarity
    series {
      field 'OrderCount'
      label 'Order Count'
      type 'line'
      backgroundColor 'rgba(225, 87, 89, 0.2)'
      borderColor '#e15759'
      borderWidth 3
      pointRadius 5
      pointStyle 'circle'
      tension 0.3
      fill false
      yAxisID 'y1'
      order 0
    }
  }
  
  options {
    responsive true
    maintainAspectRatio true
    
    plugins {
      title { 
        display true
        text 'Monthly Sales Trend'
        font { size 16 }
      }
      legend { position 'bottom' }
      tooltip { 
        enabled true
        mode 'index'
        intersect false
      }
    }
    
    interaction {
      mode 'index'
      intersect false
    }
    
    scales {
      // Left Y-axis for Sales (large values)
      y {
        type 'linear'
        position 'left'
        beginAtZero true
        title { 
          display true
          text 'Sales ($)'
          color '#4e79a7'
        }
        ticks {
          color '#4e79a7'
        }
        grid {
          drawOnChartArea true
        }
      }
      
      // Right Y-axis for Order Count (small values)
      y1 {
        type 'linear'
        position 'right'
        beginAtZero true
        title { 
          display true
          text 'Order Count'
          color '#e15759'
        }
        ticks {
          color '#e15759'
        }
        grid {
          drawOnChartArea false
        }
      }
      
      x {
        title { 
          display true
          text 'Month'
        }
      }
    }
    
    animation { duration 1000 }
  }
}
