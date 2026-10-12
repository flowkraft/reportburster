chart('chart_dd15-chart-waterfall-mrr-movement') {
  type 'waterfall'
  data {
    labelField 'movement'
    datasets {
      dataset {
        field 'mrr_delta'
        label 'MRR movement'
      }
    }
  }
  options {
    plugins {
      title {
        display true
        text 'MRR movement over the last 12 months'
      }
    }
  }
}


chart('chart_dd15-chart-churn-reasons') {
  type 'bar'
  data {
    datasets {
      dataset {
        field 'subscription_id_count'
        label 'Subscribers'
      }
    }
    labelField 'cancel_reason'
  }
  options {
    plugins {
      title {
        display true
        text 'Churn reasons'
      }
      legend {
        display false
      }
    }
  }
}


chart('chart_dd15-chart-mrr-by-plan') {
  type 'area'
  data {
    labelField 'month'
    datasets {
      dataset {
        field 'mrr'
        label 'MRR'
      }
    }
    seriesField 'plan'
  }
  options {
    plugins {
      title {
        display true
        text 'MRR by plan'
      }
    }
  }
}
