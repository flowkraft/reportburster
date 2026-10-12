// Dashboard Demo 25, Segment vs Everyone (low-code): the same dashboard as
// 25-dd-segment-vs-all.recipe.ts, built with less code (plan-dashboard-demos-low-code.md, TODO 7 and
// 8). Against the original: the filter through the form; the average order everywhere on the Visual
// tab and both return rates from the dd-delivery cube, not SQL; charts by the pickers.
import type { Recipe } from '../../helpers/dashboard-demos/recipe';

export const recipe: Recipe = {
  id: 'dd-segment-vs-all-low-code',
  nn: 25,
  title: 'Segment vs Everyone (low-code)',
  steps: [
    {
      kind: 'filters',
      via: 'form',
      params: [
        {
          id: 'country',
          type: 'String',
          label: 'Country',
          defaultValue: 'Poland',
          constraints: { required: true },
          uiHints: {
            control: 'select',
            options: 'SELECT g.country AS value, g.country AS label FROM dash_demo.orders o JOIN dash_demo.geo_cities g ON g.city_id = o.city_id GROUP BY g.country HAVING count(*) >= 400 ORDER BY label',
          },
        },
      ],
      shot: {
        title: 'The dashboard\'s filters',
        caption: 'Open **Filters** and add each filter in the form (Country): its label, id, type, control, default and options.',
      },
    },
    {
      kind: 'addElement',
      element: 'text',
      key: 'w-dd25-text-title',
      grid: { x: 0, y: 0, w: 12, h: 1 },
      text: `## Segment vs Everyone

Poland is a smaller basket and a faster market: 1,944.91 an order against 2,756.55 everywhere, returns no different at 5.93% against 5.97%, but quarterly revenue at 208.67 against the company's 139.44 since the start of 2024. It buys more Smart Home, 12.2% of its revenue against 10.58%, and a little more on the app, 21.37% of its orders against 20.55% - the assortment difference is real, the channel difference is under a point.

Every tile on this page is a pair: the country on the left, the whole company beside it, so the second number in each pair does not move when the filter does. The index starts both lines at 100 in their own first quarter and is **quarterly, not monthly** - Japan places about 15 orders a month, which draws a jagged line, and about 70 a quarter, which draws a readable one. The select offers **only countries with at least 400 orders**, so the comparison is like for like; the smaller countries are in every other demo. Returns and the channel mix count every order placed, the basket and the category shares what was sold.`,
      shot: { title: 'Add a text', caption: 'From **Elements**, add a text and write its words.' },
    },
    {
      kind: 'pickTable',
      key: 'w-dd25-kpi-aov-here',
      table: 'dash_demo.orders',
      grid: { x: 0, y: 1, w: 3, h: 3 },
      shot: {
        title: 'Start a widget on orders',
        caption: 'In the schema browser, pick **orders**: any table will do, the query below replaces it.',
      },
    },
    {
      kind: 'sql',
      sql: `SELECT round(avg(o.total_amount), 2) AS aov_here
FROM dash_demo.orders o
JOIN dash_demo.geo_cities g ON g.city_id = o.city_id
WHERE o.status <> 'cancelled'
  AND g.country = \${country}`,
      shot: {
        title: 'The query for aov here',
        caption: 'Open Finetune → SQL and paste the query. It needs more than the Visual tab offers, so this one is SQL: copy it.',
      },
    },
    {
      kind: 'visualizeAs',
      widget: 'number',
      shot: { title: 'Show aov here as number', caption: 'Under **Visualize as**, choose **number**.' },
    },
    {
      kind: 'displayConfig',
      widget: 'number',
      config: { numberField: 'aov_here', numberLabel: 'Average order here', numberFormat: 'currency' },
      shot: {
        title: 'Set up aov here',
        caption: 'On the **Display** tab, set the number\'s fields, label and format.',
      },
    },
    {
      kind: 'pickTable',
      key: 'w-dd25-kpi-aov-everywhere',
      table: 'dash_demo.orders',
      grid: { x: 3, y: 1, w: 3, h: 3 },
      shot: {
        title: 'Pick the orders table',
        caption: 'In the schema browser, pick **orders**.',
      },
    },
    {
      kind: 'visualQuery',
      query: {
        filters: [{ column: 'status', operator: 'not_equals', value: 'cancelled' }],
        summarize: [{ aggregation: 'AVG', field: 'total_amount' }],
      },
      shot: {
        title: 'Build the query for average order everywhere',
        caption: 'Fill the Visual tab: not cancelled; **Average of total_amount**.',
      },
    },
    {
      kind: 'visualizeAs',
      widget: 'number',
      shot: {
        title: 'Show aov everywhere as number',
        caption: 'Under **Visualize as**, choose **number**.',
      },
    },
    {
      kind: 'displayConfig',
      widget: 'number',
      config: {
        numberField: 'total_amount_avg',
        numberLabel: 'Average order everywhere',
        numberFormat: 'currency',
      },
      shot: {
        title: 'Set up aov everywhere',
        caption: 'On the **Display** tab, set the number\'s fields, label and format.',
      },
    },
    {
      kind: 'pickCube',
      key: 'w-dd25-kpi-return-rate-here',
      cubeId: 'dd-delivery',
      grid: { x: 6, y: 1, w: 3, h: 3 },
      shot: {
        title: 'Pick the dd-delivery cube',
        caption: 'In the schema browser, pick the cube **dd-delivery**.',
      },
    },
    {
      kind: 'cubeFields',
      cube: {
        dimensions: [],
        measures: ['ReturnRatePct'],
        bindings: [{ param: 'country', member: 'Country', operator: 'equals' }],
      },
      shot: { title: 'Tick the fields of return rate here', caption: 'Tick **ReturnRatePct**.' },
    },
    {
      kind: 'visualizeAs',
      widget: 'number',
      shot: {
        title: 'Show return rate here as number',
        caption: 'Under **Visualize as**, choose **number**.',
      },
    },
    {
      kind: 'displayConfig',
      widget: 'number',
      config: {
        numberField: 'ReturnRatePct',
        numberLabel: 'Return rate here',
        numberFormat: 'percent',
      },
      shot: {
        title: 'Set up return rate here',
        caption: 'On the **Display** tab, set the number\'s fields, label and format.',
      },
    },
    {
      kind: 'pickCube',
      key: 'w-dd25-kpi-return-rate-everywhere',
      cubeId: 'dd-delivery',
      grid: { x: 9, y: 1, w: 3, h: 3 },
      shot: {
        title: 'Pick the dd-delivery cube',
        caption: 'In the schema browser, pick the cube **dd-delivery**.',
      },
    },
    {
      kind: 'cubeFields',
      cube: { dimensions: [], measures: ['ReturnRatePct'] },
      shot: {
        title: 'Tick the fields of return rate everywhere',
        caption: 'Tick **ReturnRatePct**.',
      },
    },
    {
      kind: 'visualizeAs',
      widget: 'number',
      shot: {
        title: 'Show return rate everywhere as number',
        caption: 'Under **Visualize as**, choose **number**.',
      },
    },
    {
      kind: 'displayConfig',
      widget: 'number',
      config: {
        numberField: 'ReturnRatePct',
        numberLabel: 'Return rate everywhere',
        numberFormat: 'percent',
      },
      shot: {
        title: 'Set up return rate everywhere',
        caption: 'On the **Display** tab, set the number\'s fields, label and format.',
      },
    },
    {
      kind: 'pickTable',
      key: 'w-dd25-chart-category-share-here-vs-everyone',
      table: 'dash_demo.order_lines',
      grid: { x: 0, y: 4, w: 12, h: 4 },
      shot: {
        title: 'Start a widget on order_lines',
        caption: 'In the schema browser, pick **order_lines**: any table will do, the query below replaces it.',
      },
    },
    {
      kind: 'sql',
      sql: `WITH per_category AS (
  SELECT pr.category AS category,
         sum(CASE WHEN g.country = \${country} THEN l.line_amount ELSE 0 END) AS here,
         sum(l.line_amount) AS everywhere
  FROM dash_demo.order_lines l
  JOIN dash_demo.orders o ON o.order_id = l.order_id
  JOIN dash_demo.geo_cities g ON g.city_id = o.city_id
  JOIN dash_demo.products pr ON pr.product_id = l.product_id
  WHERE o.status <> 'cancelled'
  GROUP BY pr.category
)
SELECT c.category AS category,
       round(100.0 * c.here / sum(c.here) OVER (), 2) AS share_here_pct,
       round(100.0 * c.everywhere / sum(c.everywhere) OVER (), 2) AS share_everywhere_pct
FROM per_category c
ORDER BY share_here_pct DESC`,
      shot: {
        title: 'The query for category share here vs everyone',
        caption: 'Open Finetune → SQL and paste the query. It needs more than the Visual tab offers, so this one is SQL: copy it.',
      },
    },
    {
      kind: 'visualizeAs',
      widget: 'chart',
      shot: {
        title: 'Show category share here vs everyone as chart',
        caption: 'Under **Visualize as**, choose **chart**.',
      },
    },
    {
      kind: 'displayConfig',
      widget: 'chart',
      config: {
        dslConfig: {
          type: 'bar',
          data: {
            labelField: 'category',
            datasets: [
              { field: 'share_here_pct', label: 'Here, % of revenue' },
              { field: 'share_everywhere_pct', label: 'Everywhere, % of revenue' },
            ],
          },
          options: { plugins: { title: { display: true, text: 'Category share: here vs everyone' } } },
        },
      },
      shot: {
        title: 'Set up category share here vs everyone',
        caption: 'On the **Display** tab, set the chart\'s type, axes, title and legend with the pickers.',
      },
    },
    {
      kind: 'pickTable',
      key: 'w-dd25-chart-quarterly-index',
      table: 'dash_demo.orders',
      grid: { x: 0, y: 8, w: 8, h: 4 },
      shot: {
        title: 'Start a widget on orders',
        caption: 'In the schema browser, pick **orders**: any table will do, the query below replaces it.',
      },
    },
    {
      kind: 'sql',
      sql: `WITH per_quarter AS (
  SELECT date_trunc('quarter', o.order_ts)::DATE AS quarter,
         sum(CASE WHEN g.country = \${country} THEN o.total_amount ELSE 0 END) AS here,
         sum(o.total_amount) AS everywhere
  FROM dash_demo.orders o
  JOIN dash_demo.geo_cities g ON g.city_id = o.city_id
  WHERE o.status <> 'cancelled'
  GROUP BY quarter
)
SELECT q.quarter AS quarter,
       round(100.0 * q.here / first_value(q.here) OVER (ORDER BY q.quarter), 2) AS index_here,
       round(100.0 * q.everywhere / first_value(q.everywhere) OVER (ORDER BY q.quarter), 2) AS index_everywhere
FROM per_quarter q
ORDER BY q.quarter`,
      shot: {
        title: 'The query for quarterly index',
        caption: 'Open Finetune → SQL and paste the query. It needs more than the Visual tab offers, so this one is SQL: copy it.',
      },
    },
    {
      kind: 'visualizeAs',
      widget: 'chart',
      shot: {
        title: 'Show quarterly index as chart',
        caption: 'Under **Visualize as**, choose **chart**.',
      },
    },
    {
      kind: 'displayConfig',
      widget: 'chart',
      config: {
        dslConfig: {
          type: 'line',
          data: {
            labelField: 'quarter',
            datasets: [
              { field: 'index_here', label: 'Here' },
              { field: 'index_everywhere', label: 'Everywhere' },
            ],
          },
          options: {
            plugins: {
              title: {
                display: true,
                text: 'Quarterly revenue index, here vs everyone, first quarter = 100',
              },
            },
          },
        },
      },
      shot: {
        title: 'Set up quarterly index',
        caption: 'On the **Display** tab, set the chart\'s type, axes, title and legend with the pickers.',
      },
    },
    {
      kind: 'pickTable',
      key: 'w-dd25-chart-channel-mix-here',
      table: 'dash_demo.orders',
      grid: { x: 8, y: 8, w: 4, h: 4 },
      shot: {
        title: 'Start a widget on orders',
        caption: 'In the schema browser, pick **orders**: any table will do, the query below replaces it.',
      },
    },
    {
      kind: 'sql',
      sql: `SELECT o.channel AS channel,
       round(100.0 * count(*) / sum(count(*)) OVER (), 2) AS share_pct
FROM dash_demo.orders o
JOIN dash_demo.geo_cities g ON g.city_id = o.city_id
WHERE true
  AND g.country = \${country}
GROUP BY o.channel
ORDER BY share_pct DESC`,
      shot: {
        title: 'The query for channel mix here',
        caption: 'Open Finetune → SQL and paste the query. It needs more than the Visual tab offers, so this one is SQL: copy it.',
      },
    },
    {
      kind: 'visualizeAs',
      widget: 'chart',
      shot: {
        title: 'Show channel mix here as chart',
        caption: 'Under **Visualize as**, choose **chart**.',
      },
    },
    {
      kind: 'displayConfig',
      widget: 'chart',
      config: {
        dslConfig: {
          type: 'pie',
          data: { labelField: 'channel', datasets: [{ field: 'share_pct', label: '% of orders' }] },
          options: { plugins: { title: { display: true, text: 'Channel mix here' } } },
        },
      },
      shot: {
        title: 'Set up channel mix here',
        caption: 'On the **Display** tab, set the chart\'s type, axes, title and legend with the pickers.',
      },
    },
    {
      kind: 'layout',
      grids: [
        { x: 0, y: 0, w: 12, h: 1 },
        { x: 0, y: 1, w: 3, h: 3 },
        { x: 3, y: 1, w: 3, h: 3 },
        { x: 6, y: 1, w: 3, h: 3 },
        { x: 9, y: 1, w: 3, h: 3 },
        { x: 0, y: 4, w: 12, h: 4 },
        { x: 0, y: 8, w: 8, h: 4 },
        { x: 8, y: 8, w: 4, h: 4 },
      ],
      shot: { title: 'Arrange the dashboard', caption: 'Drag and resize each tile to its place.' },
    },
    {
      kind: 'publish',
      shot: {
        title: 'Publish',
        caption: 'Press **Publish** and confirm. The dashboard has its own page.',
      },
    },
  ],
};

export default recipe;
