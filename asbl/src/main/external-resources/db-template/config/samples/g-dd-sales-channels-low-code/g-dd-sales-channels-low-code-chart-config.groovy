chart('chart_dd04-chart-revenue-mix-by-channel') {
  type 'pie'
  data {
    labelField 'channel'
    datasets {
      dataset {
        field 'total_amount_sum'
        label 'Revenue'
      }
    }
  }
  options {
    plugins {
      title {
        display true
        text 'Revenue mix by channel'
      }
    }
  }
}


chart('chart_dd04-chart-average-order-value-per-channel') {
  type 'bar'
  data {
    datasets {
      dataset {
        field 'total_amount_avg'
        label 'Average order'
      }
    }
    labelField 'channel'
  }
  options {
    plugins {
      title {
        display true
        text 'Average order value per channel'
      }
    }
  }
}


chart('chart_dd04-chart-channel-share-per-month') {
  type 'area'
  data {
    labelField 'month'
    datasets {
      dataset {
        field 'share_pct'
        label 'Share of orders %'
      }
    }
    seriesField 'channel'
  }
  options {
    plugins {
      title {
        display true
        text 'Channel share of orders per month'
      }
    }
  }
}
