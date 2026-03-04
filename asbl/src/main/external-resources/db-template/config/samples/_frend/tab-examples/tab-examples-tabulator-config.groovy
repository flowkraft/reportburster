/*
 * Tabulator Examples Showcase
 *
 * This Groovy DSL is a thin pass-through wrapper over Tabulator (https://tabulator.info/).
 * Any configuration that Tabulator supports works here in the most direct/intuitive way possible.
 * Use these examples together with the Tabulator docs for the full picture.
 *
 * ⚠️  IMPORTANT — These examples use named blocks as a SHOWCASE CONVENIENCE only
 *
 * ALL examples use tabulator('name') { ... } because they are packed into a
 * SINGLE report file so they can all be previewed in one place. The names keep
 * each example's config and data separate within this one showcase report.
 *
 * In real-world usage, the typical case is ONE tabulator per report.
 * Use the UNNAMED syntax — this is the default and correct starting point:
 *
 *   tabulator {           ← no name, no quotes, no parentheses
 *     layout "fitColumns"
 *     columns {
 *       column { title "Name"; field "name" }
 *       column { title "Revenue"; field "revenue"; formatter "money" }
 *     }
 *   }
 *
 * And in the data script: ctx.reportData(rows)  ← no name argument
 *
 * Use named blocks (tabulator('myId') { ... }) ONLY when a single report
 * needs multiple tabulators, charts, or pivot tables together — the
 * "Multi-Component Reports" aggregator pattern described at:
 * https://www.reportburster.com/docs/bi-analytics/dashboards#multi-component-reports
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

// Virtual DOM - Vertical: Tabulator renders its table using a Virtual DOM,
// this means that it only renders the rows you see in the table (plus a few
// above and below the current view).
tabulator('virtualDomVertical') {
  height "311px"
  columns {
    column {
      title "ID"
      field "id"
    }
    column {
      title "Name"
      field "name"
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
    }
  }
}

// Virtual DOM - Horizontal: For tables with large numbers of columns you can
// use the virtualDomHoz option to enable the horizontal Virtual DOM which will
// improve table rendering performance.
// Note: tabulator.info generates 100 explicit columns via JS loop;
// autoColumns true achieves the same result from the data fields.
// The docs website mock uses explicit columns for proper horizontal virtual scrolling.
tabulator('virtualDomHorizontal') {
  height "311px"
  renderHorizontal "virtual"
  autoColumns true
}

// Fit To Data: Tables will automatically resize columns to fit the data.
tabulator('fitToData') {
  height "311px"
  columns {
    column {
      title "Name"
      field "name"
    }
    column {
      title "Progress"
      field "progress"
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
    }
  }
}

// Fit To Data and Fill: By setting the layout option to fitDataFill, the table
// will resize the columns to fit their data, and ensure that rows take up the
// full width.
tabulator('fitToDataAndFill') {
  height "311px"
  layout "fitDataFill"
  columns {
    column {
      title "Name"
      field "name"
    }
    column {
      title "Progress"
      field "progress"
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
    }
    column {
      title "Favourite Color"
      field "col"
    }
  }
}

// Fit To Data and Stretch Last Column: By setting the layout option to
// fitDataStretch, the table will resize the columns to fit their data, and
// stretch the final column to fill remaining width.
tabulator('fitToDataAndStretchLastColumn') {
  height "311px"
  layout "fitDataStretch"
  columns {
    column {
      title "Name"
      field "name"
    }
    column {
      title "Progress"
      field "progress"
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
    }
    column {
      title "Favourite Color"
      field "col"
    }
  }
}

// Fit Table and Columns to Data: Tables will automatically resize container
// and columns to fit the data.
tabulator('fitTableAndColumnsToData') {
  height "311px"
  layout "fitDataTable"
  columns {
    column {
      title "Name"
      field "name"
    }
    column {
      title "Progress"
      field "progress"
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
  }
}

// Fit To Width: By setting the layout option to fitColumns, the table will
// resize columns so that they fit perfectly inside the width of the container.
tabulator('fitToWidth') {
  height "311px"
  layout "fitColumns"
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
      widthGrow 2
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
    }
    column {
      title "Favourite Color"
      field "col"
      widthGrow 3
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
      widthGrow 2
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
    }
  }
}

// Responsive Layout: By setting the responsiveLayout option to 'hide', the
// table will automatically hide/show columns to prevent exceeding container
// width.
tabulator('responsiveLayout') {
  height "311px"
  responsiveLayout "hide"
  columns {
    column {
      title "Name"
      field "name"
      width 200
      responsive 0
    }
    column {
      title "Progress"
      field "progress"
      hozAlign "right"
      sorter "number"
      width 150
    }
    column {
      title "Gender"
      field "gender"
      width 150
      responsive 2
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      width 150
    }
    column {
      title "Favourite Color"
      field "col"
      width 150
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
      width 150
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      width 150
    }
  }
}

// Responsive Layout Collapsed List: By setting the responsiveLayout option to
// 'collapse', the table will automatically collapse columns that don't fit on
// the table into a list.
tabulator('responsiveLayoutCollapsedList') {
  height "311px"
  layout "fitDataFill"
  responsiveLayout "collapse"
  rowHeader([formatter: "responsiveCollapse", width: 30, minWidth: 30, hozAlign: "center", resizable: false, headerSort: false])
  columns {
    column {
      title "Name"
      field "name"
      width 200
      responsive 0
    }
    column {
      title "Progress"
      field "progress"
      hozAlign "right"
      sorter "number"
      width 150
    }
    column {
      title "Gender"
      field "gender"
      width 150
      responsive 2
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      width 150
    }
    column {
      title "Favourite Color"
      field "col"
      width 150
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
      width 150
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      width 150
    }
  }
}


// Automatic Column Generation: Tabulator can automatically work out the columns
// structure of simple tables by examining the data in the first row.
tabulator('automaticColumnGeneration') {
  autoColumns true
}

// Resizable Columns: By including the Resize Columns module in your table all
// columns will automatically become resizable.
tabulator('resizableColumns') {
  height "311px"
  layout "fitColumns"
  resizableColumnFit true
  columns {
    column {
      title "Name"
      field "name"
      width 200
      resizable true
    }
    column {
      title "Progress"
      field "progress"
      resizable true
    }
    column {
      title "Gender"
      field "gender"
      resizable true
    }
    column {
      title "Rating"
      field "rating"
      resizable true
    }
    column {
      title "Favourite Color"
      field "col"
      resizable true
    }
  }
}

// Resize Guides: When using guides, when you drag the edge of a column or row,
// a guide is shown that helps you see how big the element will be.
tabulator('resizeGuides') {
  height "311px"
  resizableRows true
  resizableRowGuide true
  resizableColumnGuide true
  columnDefaults([resizable: true])
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
    }
    column {
      title "Favourite Color"
      field "col"
    }
  }
}

// Column Groups: By creating groups in the column definition array, you can
// create multi line headers with groups of columns.
tabulator('columnGroups') {
  columnHeaderVertAlign "bottom"
  columns {
    column {
      title "Name"
      field "name"
      width 160
    }
    column {
      title "Work Info"
      columns([[title: "Progress", field: "progress", hozAlign: "right", sorter: "number", width: 100], [title: "Rating", field: "rating", hozAlign: "center", width: 80], [title: "Driver", field: "car", hozAlign: "center", width: 80]])
    }
    column {
      title "Personal Info"
      columns([[title: "Gender", field: "gender", width: 90], [title: "Favourite Color", field: "col", width: 140], [title: "Date Of Birth", field: "dob", hozAlign: "center", sorter: "date", width: 130]])
    }
  }
}

// Vertical Column Headers: If you are trying to fit a lot of narrow columns on
// your table, you can use the headerVertical property to change text orientation
// to vertical.
tabulator('verticalColumnHeaders') {
  height "311px"
  columns {
    column {
      title "Name"
      field "name"
      headerSort false
      headerVertical true
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
      hozAlign "left"
      formatter "progress"
      editable true
      headerSort false
      headerVertical true
    }
    column {
      title "Gender"
      field "gender"
      headerSort false
      headerVertical true
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      headerSort false
      headerVertical true
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
      headerSort false
      headerVertical true
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      headerSort false
      headerVertical true
    }
  }
}

// Row Header: In addition to the column headers, it is possible to add row
// headers to the table using the rowHeader option.
tabulator('rowHeader') {
  height "311px"
  rowHeader([formatter: "rownum", headerSort: false, hozAlign: "center", resizable: false, frozen: true])
  columns {
    column {
      title "Name"
      field "name"
      headerSort false
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
      hozAlign "left"
      formatter "progress"
      editable true
      headerSort false
    }
    column {
      title "Gender"
      field "gender"
      headerSort false
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      headerSort false
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
      headerSort false
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      headerSort false
    }
  }
}

// Frozen Columns: You can use the frozen property in a columns definition
// object to freeze that column in place during horizontal scrolling.
tabulator('frozenColumns') {
  height "311px"
  columns {
    column {
      title "Name"
      field "name"
      width 250
      frozen true
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
      hozAlign "left"
      formatter "progress"
      width 200
      editable true
    }
    column {
      title "Gender"
      field "gender"
      width 150
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      hozAlign "center"
      width 200
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      width 150
    }
  }
}

// Frozen Rows: You can use the frozenRows option in the table constructor to
// specify the number of rows you want to freeze at the top.
tabulator('frozenRows') {
  height "311px"
  frozenRows 1
  columns {
    column {
      title "Name"
      field "name"
      width 250
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
      hozAlign "left"
      formatter "progress"
      width 200
      editable true
    }
    column {
      title "Gender"
      field "gender"
      width 150
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      hozAlign "center"
      width 200
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      width 150
    }
  }
}


// Nested Data Trees: You can enable tree structures on nested data by setting
// the dataTree option to true in the table constructor.
tabulator('nestedDataTrees') {
  height "311px"
  dataTree true
  dataTreeStartExpanded true
  columns {
    column {
      title "Name"
      field "name"
      width 200
      responsive 0
    }
    column {
      title "Location"
      field "location"
      width 150
    }
    column {
      title "Gender"
      field "gender"
      width 150
      responsive 2
    }
    column {
      title "Favourite Color"
      field "col"
      width 150
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
      width 150
    }
  }
}


// Formatters: Tabulator allows you to format your data in a wide variety of
// ways, so your tables can display information in a more graphical and clear
// layout.
// Note: tabulator.info uses JS callbacks (rowFormatter, inline formatter
// functions, cellClick, printIcon) — those cannot be expressed in DSL config.
tabulator('formatters') {
  height "311px"
  layout "fitColumns"
  // JS-only: rowFormatter callback (highlights rows where col == "blue")
  // JS-only: first column uses formatter:rownum with hozAlign center, width 40
  // JS-only: second column uses a custom printIcon formatter function with cellClick callback
  columns {
    column {
      title "Name"
      field "name"
      width 150
      // JS-only: inline formatter function that highlights names containing "o"
    }
    column {
      title "Progress"
      field "progress"
      formatter "progress"
      formatterParams([color: ["#00dd00", "orange", "rgb(255,0,0)"]])
      sorter "number"
      width 100
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      formatterParams([stars: 6])
      hozAlign "center"
      width 120
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      width 50
    }
    column {
      title "Col"
      field "col"
      formatter "color"
      width 50
    }
    column {
      title "Line Wraping"
      field "lorem"
      formatter "textarea"
    }
    // JS-only: last column uses formatter:"buttonCross" with width 30, hozAlign center
  }
}


// Persistent Configuration: Tabulator can store a variety of table setup options
// so that each time a user comes back to the page, the table is laid out just
// as they left it.
tabulator('persistentConfiguration') {
  height "311px"
  persistence([sort: true, filter: true, columns: true])
  persistenceID "examplePerststance"
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      width 100
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      width 80
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
    }
  }
}


// Column Calculations: Column calculations can be used to add a row of
// calculated values to the top or bottom of your table to display summary
// information.
tabulator('columnCalculations') {
  movableColumns true
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      width 100
      sorter "number"
      bottomCalc "avg"
      bottomCalcParams([precision: 3])
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      width 80
      bottomCalc "avg"
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      topCalc "count"
    }
  }
}


// No Column Headers: By setting the headerVisible option to false you can hide
// the column headers and present the table as a simple list.
tabulator('noColumnHeaders') {
  height "311px"
  headerVisible false
  columns {
    column {
      title "Name"
      field "name"
      width 250
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
      hozAlign "left"
      formatter "progress"
      width 200
      editable true
    }
    column {
      title "Gender"
      field "gender"
      width 150
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      hozAlign "center"
      width 200
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      width 150
    }
  }
}

// RTL Text Direction: Tabulator supports both 'Right to Left' and 'Left To
// Right' text directions.
tabulator('rtlTextDirection') {
  height "311px"
  textDirection "rtl"
  columns {
    column {
      title "Name"
      field "name"
      width 250
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
      hozAlign "left"
      formatter "progress"
      width 200
      editable true
    }
    column {
      title "Gender"
      field "gender"
      width 150
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      hozAlign "center"
      width 200
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      width 150
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════════

// Editable Data: Using the editable setting on each column, you can make a
// user editable table.
tabulator('editableData') {
  height "311px"
  columns {
    column {
      title "Name"
      field "name"
      width 150
      editor "input"
    }
    column {
      title "Location"
      field "location"
      width 130
      editor "list"
      editorParams([autocomplete: "true", allowEmpty: true, listOnEmpty: true, valuesLookup: true])
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
      hozAlign "left"
      formatter "progress"
      width 140
      editor true
    }
    column {
      title "Gender"
      field "gender"
      editor "list"
      editorParams([values: [male: "Male", female: "Female", unknown: "Unknown"]])
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      hozAlign "center"
      width 100
      editor true
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
      width 140
      // JS-only: editor is a custom dateEditor function using luxon for date parsing
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      editor true
      formatter "tickCross"
    }
  }
}

// Validate User Input: You can set validators on columns to ensure that any
// user input into your editable cells matches your requirements.
tabulator('validateUserInput') {
  height "311px"
  layout "fitColumns"
  columns {
    column {
      title "Name"
      field "name"
      width 150
      editor "input"
      validator "required"
    }
    column {
      title "Progress"
      field "progress"
      sorter "number"
      hozAlign "left"
      editor true
      validator(["min:0", "max:100", "numeric"])
    }
    column {
      title "Gender"
      field "gender"
      editor "input"
      validator(["required", "in:male|female"])
    }
    column {
      title "Rating"
      field "rating"
      editor "input"
      hozAlign "center"
      width 100
      validator(["min:0", "max:5", "integer"])
    }
    column {
      title "Favourite Color"
      field "col"
      editor "input"
      validator(["minLength:3", "maxLength:10", "string"])
    }
  }
}


// Filter Data In Header: By setting the headerFilter parameter for a column you
// can add column based filtering directly into your table.
// Note: tabulator.info uses JS functions (minMaxFilterEditor, minMaxFilterFunction,
// headerFilterEmptyCheck) for Progress and Driver columns — those cannot be
// represented in Groovy DSL config.
tabulator('filterDataInHeader') {
  height "311px"
  layout "fitColumns"
  columns {
    column {
      title "Name"
      field "name"
      width 150
      headerFilter "input"
    }
    column {
      title "Progress"
      field "progress"
      width 150
      formatter "progress"
      sorter "number"
      // tabulator.info: headerFilter:minMaxFilterEditor (custom JS function)
      // headerFilterFunc:minMaxFilterFunction (custom JS function)
      // headerFilterLiveFilter:false
      // Simplified to built-in "number" filter since JS functions can't be in DSL
      headerFilter "number"
    }
    column {
      title "Gender"
      field "gender"
      editor "list"
      editorParams([values: [male: "Male", female: "Female"], clearable: true])
      headerFilter true
      headerFilterParams([values: [male: "Male", female: "Female", "": ""], clearable: true])
    }
    column {
      title "Rating"
      field "rating"
      editor "star"
      hozAlign "center"
      width 100
      headerFilter "number"
      headerFilterPlaceholder "at least..."
      headerFilterFunc ">="
    }
    column {
      title "Favourite Color"
      field "col"
      editor "input"
      headerFilter "list"
      headerFilterParams([valuesLookup: true, clearable: true])
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
      headerFilter "input"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
      headerFilter "tickCross"
      headerFilterParams([tristate: true])
      // tabulator.info: headerFilterEmptyCheck:function(value){return value === null}
      // JS function — can't be in DSL
    }
  }
}


// Sorters: By default Tabulator will attempt to guess which sorter should be
// applied to a column based on the data contained.
tabulator('sorters') {
  height "311px"
  layout "fitColumns"
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      hozAlign "right"
      headerSortTristate true
    }
    column {
      title "Gender"
      field "gender"
      sorter "string"
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      width 100
    }
    column {
      title "Favourite Color"
      field "col"
      // JS-only: sorter is a custom function using localeCompare
    }
    column {
      title "Date Of Birth"
      field "dob"
      sorter "date"
      hozAlign "center"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      sorter "boolean"
    }
  }
}


// Grouping Data: You can group rows together using the groupBy option. To group
// by a field, set this option to the name of the field.
tabulator('groupingData') {
  height "311px"
  layout "fitColumns"
  movableRows true
  groupBy "gender"
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      formatter "progress"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      hozAlign "center"
      width 100
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
    }
  }
}


// Pagination: Tabulator allows you to paginate your data. Simply set the
// pagination property to true.
tabulator('pagination') {
  layout "fitColumns"
  pagination "local"
  paginationSize 6
  paginationSizeSelector([3, 6, 8, 10])
  movableColumns true
  paginationCounter "rows"
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      formatter "progress"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      hozAlign "center"
      width 100
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTION
// ═══════════════════════════════════════════════════════════════════════════════

// Selectable Rows: Using the selectableRows option, you can allow users to
// select rows in the table via a number of different routes.
tabulator('selectableRows') {
  height "311px"
  selectableRows true
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      width 100
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
      width 100
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      width 80
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      width 100
    }
  }
}

// Selectable Rows With Tickbox: By using the rowSelection formatter in the row
// header, you can create a table with rows selectable using a tickbox.
// JS-only: cellClick callback on rowHeader for toggleSelect.
tabulator('selectableRowsWithTickbox') {
  height "311px"
  rowHeader([headerSort: false, resizable: false, frozen: true, headerHozAlign: "center", hozAlign: "center", formatter: "rowSelection", titleFormatter: "rowSelection"])
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      width 100
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
      width 100
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      width 80
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      width 100
    }
  }
}

// Selectable Cell Range: Using the selectableRange option, you can allow users
// to select a range of cells in the table.
tabulator('selectableCellRange') {
  height "311px"
  selectableRange true
  selectableRangeColumns true
  selectableRangeRows true
  rowHeader([resizable: false, frozen: true, hozAlign: "center", formatter: "rownum", cssClass: "range-header-col"])
  columnDefaults([headerSort: false, resizable: "header"])
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      width 100
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
      width 100
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      width 80
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      width 100
    }
  }
}

// Selectable Cell Range with Clipboard: By using the selectableRange option,
// along with the clipboard, and edit modules you can create a table that allows
// for bulk copying and pasting.
tabulator('selectableCellRangeWithClipboard') {
  height "311px"
  selectableRange 1
  selectableRangeColumns true
  selectableRangeRows true
  selectableRangeClearCells true
  editTriggerEvent "dblclick"
  clipboard true
  clipboardCopyStyled false
  clipboardCopyConfig([rowHeaders: false, columnHeaders: false])
  clipboardCopyRowRange "range"
  clipboardPasteParser "range"
  clipboardPasteAction "range"
  rowHeader([resizable: false, frozen: true, width: 40, hozAlign: "center", formatter: "rownum", cssClass: "range-header-col", editor: false])
  columnDefaults([headerSort: false, headerHozAlign: "center", editor: "input", resizable: "header", width: 100])
  columns {
    column {
      title "Name"
      field "name"
      width 200
    }
    column {
      title "Progress"
      field "progress"
      width 100
      hozAlign "right"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
      width 100
    }
    column {
      title "Rating"
      field "rating"
      hozAlign "center"
      width 80
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      width 100
    }
  }
}

// Movable Rows: Using the movableRows property you can allow the user to move
// rows around the table by clicking and dragging.
tabulator('movableRows') {
  height "311px"
  movableRows true
  rowHeader([headerSort: false, resizable: false, minWidth: 30, width: 30, rowHandle: true, formatter: "handle"])
  columns {
    column {
      title "Name"
      field "name"
      width 150
    }
    column {
      title "Progress"
      field "progress"
      formatter "progress"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      formatterParams([stars: 6])
      hozAlign "center"
      width 120
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
    }
  }
}

// Movable Rows With Row Groups: By using the groupValues property to define a
// series of groups, you can create a table that allows users to drag rows
// between groups.
tabulator('movableRowsWithGroups') {
  height "311px"
  movableRows true
  rowHeader([headerSort: false, resizable: false, minWidth: 30, width: 30, rowHandle: true, formatter: "handle"])
  groupBy "col"
  groupValues([["green", "blue", "purple"]])
  columns {
    column {
      title "Name"
      field "name"
      width 150
    }
    column {
      title "Progress"
      field "progress"
      formatter "progress"
      sorter "number"
    }
    column {
      title "Gender"
      field "gender"
    }
    column {
      title "Rating"
      field "rating"
      formatter "star"
      formatterParams([stars: 6])
      hozAlign "center"
      width 120
    }
    column {
      title "Favourite Color"
      field "col"
    }
    column {
      title "Date Of Birth"
      field "dob"
      hozAlign "center"
      sorter "date"
    }
    column {
      title "Driver"
      field "car"
      hozAlign "center"
      formatter "tickCross"
    }
  }
}


