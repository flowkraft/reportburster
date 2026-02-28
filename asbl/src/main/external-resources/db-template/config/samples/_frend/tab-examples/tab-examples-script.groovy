/*
 * Tabulator Examples - Sample Data Generator
 *
 * This script provides IN-MEMORY SAMPLE DATA for the 45 tabulator examples.
 * Each named dataset is crafted to properly demonstrate the specific
 * tabulator feature it accompanies. Data shape, volume, and values
 * are chosen to make the example visually meaningful.
 *
 * In real-world reports, this script would typically fetch data from:
 *   - A database (or multiple databases)
 *   - REST APIs or web services
 *   - CSV/Excel files or other data sources
 * The inline data here is just for demonstration purposes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Performance: componentId guardrail
//
// When served inside a dashboard, each visualization component triggers a
// separate HTTP request with ?componentId=<id>.  Without the guard below,
// every request would execute ALL data-fetching blocks — producing N × M
// database calls (N components × M queries).  The guard ensures only the
// block matching the requested componentId runs.
// ─────────────────────────────────────────────────────────────────────────────
def componentId = ctx.variables?.get('componentId')

log.info("Starting tab-examples data generation... componentId=${componentId ?: '(all)'}")

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED BASE DATASETS
// These are lightweight in-memory arrays reused by many examples.
// They stay outside the guards because creating them is trivial.
// In a real script with database queries, each query would be inside its guard.
// ═══════════════════════════════════════════════════════════════════════════════

// Core 5 — reused across many examples
def fillData = [
    [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
    [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
    [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true],
    [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17', car: false],
    [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22', car: true]
].collect { new LinkedHashMap(it) }

// Core 5 + 1
def resizeGuidesData = [
    [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
    [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
    [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true],
    [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17', car: false],
    [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22', car: true],
    [name: 'Dmitri Novak', progress: 52, gender: 'male', rating: 4, col: 'purple', dob: '1988-07-09', car: true]
].collect { new LinkedHashMap(it) }

// Extended 7
def fitToWidthData = [
    [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
    [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
    [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true],
    [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17', car: false],
    [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22', car: true],
    [name: 'Dmitri Novak', progress: 52, gender: 'male', rating: 4, col: 'purple', dob: '1988-07-09', car: true],
    [name: 'Suki Hayashi', progress: 76, gender: 'female', rating: 3, col: 'cyan', dob: '1995-01-18', car: false]
].collect { new LinkedHashMap(it) }

// Small 3 — first 3 of fillData
def smallTableData = [
    [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
    [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
    [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true]
].collect { new LinkedHashMap(it) }

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT (23 examples)
// ═══════════════════════════════════════════════════════════════════════════════

// #1 Virtual DOM — Vertical — 200 rows, deterministic
if (!componentId || componentId == 'virtualDomVertical') {
    def virtualDomNames = [
        'Nora Keane', 'Marco Vidal', 'Priya Sharma', 'Leo Tanaka', 'Clara Jensen',
        'Dmitri Novak', 'Suki Hayashi', 'Amara Osei', 'Rhys Keller', 'Isla Fernandez',
        'Tomás Reyes', 'Nina Petrova', 'Kai Lindgren', 'Mina Zhao', 'Ezra Bloom',
        'Yara Hadid', 'Finn Callahan', 'Zuri Mbeki', 'Owen Sinclair', 'Lena Kowalski'
    ]
    def virtualDomGenders = ['male', 'female']
    def virtualDomColors = ['teal', 'orange', 'green', 'blue', 'red', 'purple', 'cyan', 'pink', 'brown', 'yellow']
    def virtualDomVerticalData = (0..199).collect { i ->
        new LinkedHashMap([
            id: i + 1,
            name: virtualDomNames[i % virtualDomNames.size()],
            progress: (i * 7 + 13) % 101,
            gender: virtualDomGenders[i % 2],
            rating: 1 + (i % 5),
            col: virtualDomColors[i % virtualDomColors.size()],
            dob: "${1960 + (i % 50)}-${String.format('%02d', 1 + (i % 12))}-${String.format('%02d', 1 + (i % 28))}"
        ])
    }
    ctx.reportData('virtualDomVertical', virtualDomVerticalData)
}

// #2 Virtual DOM — Horizontal — 10 rows × 100 columns
if (!componentId || componentId == 'virtualDomHorizontal') {
    def virtualDomHorizontalData = (1..10).collect {
        def row = new LinkedHashMap()
        for (int c = 1; c <= 100; c++) {
            row.put("a${c}" as String, Math.round(Math.random() * 1000) / 1000.0)
        }
        row
    }
    ctx.reportData('virtualDomHorizontal', virtualDomHorizontalData)
}

// #3 Fit to Data
if (!componentId || componentId == 'fitToData') {
    ctx.reportData('fitToData', fillData)
}

// #4 Fit to Data and Fill
if (!componentId || componentId == 'fitToDataAndFill') {
    ctx.reportData('fitToDataAndFill', fillData)
}

// #5 Fit to Data and Stretch Last Column
if (!componentId || componentId == 'fitToDataAndStretchLastColumn') {
    ctx.reportData('fitToDataAndStretchLastColumn', fillData)
}

// #6 Fit Table and Columns to Data
if (!componentId || componentId == 'fitTableAndColumnsToData') {
    ctx.reportData('fitTableAndColumnsToData', fillData)
}

// #7 Fit to Width
if (!componentId || componentId == 'fitToWidth') {
    ctx.reportData('fitToWidth', fitToWidthData)
}

// #8 Responsive Layout
if (!componentId || componentId == 'responsiveLayout') {
    ctx.reportData('responsiveLayout', fitToWidthData)
}

// #9 Responsive Layout — Collapsed List
if (!componentId || componentId == 'responsiveLayoutCollapsedList') {
    ctx.reportData('responsiveLayoutCollapsedList', fillData)
}

// #10 Automatic Column Generation — autoColumns true (NO car field)
if (!componentId || componentId == 'automaticColumnGeneration') {
    def autoColumnsData = [
        [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14'],
        [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28'],
        [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03'],
        [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17'],
        [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22']
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('automaticColumnGeneration', autoColumnsData)
}

// #11 Resizable Columns
if (!componentId || componentId == 'resizableColumns') {
    ctx.reportData('resizableColumns', fillData)
}

// #12 Resize Guides
if (!componentId || componentId == 'resizeGuides') {
    ctx.reportData('resizeGuides', resizeGuidesData)
}

// #13 Column Groups
if (!componentId || componentId == 'columnGroups') {
    def columnGroupsData = [
        [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
        [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
        [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true],
        [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17', car: false],
        [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22', car: true]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('columnGroups', columnGroupsData)
}

// #14 Vertical Column Headers
if (!componentId || componentId == 'verticalColumnHeaders') {
    ctx.reportData('verticalColumnHeaders', fillData)
}

// #15 Row Header
if (!componentId || componentId == 'rowHeader') {
    ctx.reportData('rowHeader', resizeGuidesData)
}

// #16 Pinned Columns
if (!componentId || componentId == 'frozenColumns') {
    ctx.reportData('frozenColumns', fitToWidthData)
}

// #17 Frozen Rows — 13 rows: 1 frozen totals row + 12 data rows
if (!componentId || componentId == 'frozenRows') {
    def frozenRowsData = [
        [name: '*** TOTALS ***', progress: 50, gender: '', rating: 3, dob: '', car: false],
        [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, dob: '1991-06-14', car: true],
        [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, dob: '1984-02-28', car: false],
        [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, dob: '1997-11-03', car: true],
        [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, dob: '1978-09-17', car: false],
        [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, dob: '2003-04-22', car: true],
        [name: 'Dmitri Novak', progress: 52, gender: 'male', rating: 4, dob: '1988-07-09', car: true],
        [name: 'Suki Hayashi', progress: 76, gender: 'female', rating: 3, dob: '1995-01-18', car: false],
        [name: 'Amara Osei', progress: 83, gender: 'female', rating: 5, dob: '2001-08-25', car: false],
        [name: 'Rhys Keller', progress: 29, gender: 'male', rating: 1, dob: '1993-03-06', car: true],
        [name: 'Isla Fernandez', progress: 61, gender: 'female', rating: 3, dob: '2006-10-12', car: false],
        [name: 'Tomás Reyes', progress: 72, gender: 'male', rating: 2, dob: '1970-05-30', car: true],
        [name: 'Nina Petrova', progress: 95, gender: 'female', rating: 4, dob: '1980-12-01', car: false]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('frozenRows', frozenRowsData)
}

// #18 Tree View — hierarchical data with _children
if (!componentId || componentId == 'nestedDataTrees') {
    def treeData = [
        new LinkedHashMap([name: 'Nora Keane', location: 'Ireland', gender: 'female', col: 'teal', dob: '1991-06-14', _children: [
            new LinkedHashMap([name: 'Marco Vidal', location: 'Spain', gender: 'male', col: 'orange', dob: '1984-02-28']),
            new LinkedHashMap([name: 'Priya Sharma', location: 'India', gender: 'female', col: 'green', dob: '1997-11-03']),
            new LinkedHashMap([name: 'Leo Tanaka', location: 'Japan', gender: 'male', col: 'blue', dob: '1978-09-17', _children: [
                new LinkedHashMap([name: 'Clara Jensen', location: 'Denmark', gender: 'female', col: 'red', dob: '2003-04-22']),
                new LinkedHashMap([name: 'Dmitri Novak', location: 'Czech Republic', gender: 'male', col: 'purple', dob: '1988-07-09'])
            ]])
        ]]),
        new LinkedHashMap([name: 'Suki Hayashi', location: 'Japan', gender: 'female', col: 'cyan', dob: '1995-01-18', _children: [
            new LinkedHashMap([name: 'Amara Osei', location: 'Ghana', gender: 'female', col: 'pink', dob: '2001-08-25']),
            new LinkedHashMap([name: 'Rhys Keller', location: 'Switzerland', gender: 'male', col: 'brown', dob: '1993-03-06'])
        ]]),
        new LinkedHashMap([name: 'Isla Fernandez', location: 'Argentina', gender: 'female', col: 'yellow', dob: '2006-10-12'])
    ]
    ctx.reportData('nestedDataTrees', treeData)
}

// #19 Formatters — 7 rows with English business sentences
if (!componentId || componentId == 'formatters') {
    def formattersData = [
        [name: 'Nora Keane', progress: 18, rating: 3, car: true, col: 'teal', lorem: 'Data tables power modern business intelligence dashboards.'],
        [name: 'Marco Vidal', progress: 67, rating: 1, car: false, col: 'orange', lorem: 'Real-time updates keep stakeholders aligned on key metrics.'],
        [name: 'Priya Sharma', progress: 44, rating: 4, car: true, col: 'green', lorem: 'Automated report distribution saves hours of manual effort.'],
        [name: 'Leo Tanaka', progress: 89, rating: 2, car: false, col: 'blue', lorem: 'Configurable layouts adapt to different screen sizes seamlessly.'],
        [name: 'Clara Jensen', progress: 31, rating: 5, car: true, col: 'red', lorem: 'Scheduled jobs ensure reports reach recipients on time.'],
        [name: 'Dmitri Novak', progress: 52, rating: 4, car: true, col: 'purple', lorem: 'Interactive filters let users drill into the data they need.'],
        [name: 'Suki Hayashi', progress: 76, rating: 3, car: false, col: 'cyan', lorem: 'Export options cover PDF, Excel, CSV, and HTML formats.']
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('formatters', formattersData)
}

// #20 Saved Layout
if (!componentId || componentId == 'persistentConfiguration') {
    ctx.reportData('persistentConfiguration', resizeGuidesData)
}

// #21 Column Calculations
if (!componentId || componentId == 'columnCalculations') {
    def columnCalcData = [
        [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
        [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
        [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true],
        [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17', car: false],
        [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22', car: true]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('columnCalculations', columnCalcData)
}

// #22 No Column Headers
if (!componentId || componentId == 'noColumnHeaders') {
    ctx.reportData('noColumnHeaders', resizeGuidesData)
}

// #23 RTL Text Direction — Arabic names
if (!componentId || componentId == 'rtlTextDirection') {
    def rtlData = [
        [name: 'طارق نصر', progress: 41, gender: 'male', rating: 3, dob: '1987-05-18', car: true],
        [name: 'ليلى حمدان', progress: 23, gender: 'female', rating: 5, dob: '1999-10-02', car: false],
        [name: 'عمر فارس', progress: 58, gender: 'male', rating: 2, dob: '1974-08-21', car: true],
        [name: 'نور خليل', progress: 14, gender: 'female', rating: 4, dob: '2007-03-15', car: false],
        [name: 'سامي رشيد', progress: 70, gender: 'male', rating: 1, dob: '1966-12-07', car: true]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('rtlTextDirection', rtlData)
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA (8 examples)
// ═══════════════════════════════════════════════════════════════════════════════


// #26 Inline Editing — 5 rows with location field
if (!componentId || componentId == 'editableData') {
    def editableData = [
        [name: 'Nora Keane', location: 'Ireland', progress: 18, gender: 'female', rating: 3, dob: '1991-06-14', car: true],
        [name: 'Marco Vidal', location: 'Spain', progress: 67, gender: 'male', rating: 1, dob: '1984-02-28', car: false],
        [name: 'Priya Sharma', location: 'India', progress: 44, gender: 'female', rating: 4, dob: '1997-11-03', car: true],
        [name: 'Leo Tanaka', location: 'Japan', progress: 89, gender: 'male', rating: 2, dob: '1978-09-17', car: false],
        [name: 'Clara Jensen', location: 'Denmark', progress: 31, gender: 'female', rating: 5, dob: '2003-04-22', car: true]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('editableData', editableData)
}

// #27 Validate User Input — 5 rows, no dob/car
if (!componentId || componentId == 'validateUserInput') {
    def validateData = [
        [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal'],
        [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange'],
        [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green'],
        [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue'],
        [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red']
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('validateUserInput', validateData)
}

// #28 Filter Data in Header — 10 rows
if (!componentId || componentId == 'filterDataInHeader') {
    def filterData = [
        [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
        [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
        [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true],
        [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17', car: false],
        [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22', car: true],
        [name: 'Dmitri Novak', progress: 52, gender: 'male', rating: 4, col: 'purple', dob: '1988-07-09', car: true],
        [name: 'Suki Hayashi', progress: 76, gender: 'female', rating: 3, col: 'cyan', dob: '1995-01-18', car: false],
        [name: 'Amara Osei', progress: 83, gender: 'female', rating: 5, col: 'pink', dob: '2001-08-25', car: false],
        [name: 'Rhys Keller', progress: 29, gender: 'male', rating: 1, col: 'brown', dob: '1993-03-06', car: true],
        [name: 'Isla Fernandez', progress: 61, gender: 'female', rating: 3, col: 'yellow', dob: '2006-10-12', car: false]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('filterDataInHeader', filterData)
}

// #29 Sorters — 8 rows, deliberately unordered to showcase sorting
if (!componentId || componentId == 'sorters') {
    def sortersData = [
        [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17', car: false],
        [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
        [name: 'Amara Osei', progress: 83, gender: 'female', rating: 5, col: 'pink', dob: '2001-08-25', car: false],
        [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true],
        [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
        [name: 'Rhys Keller', progress: 29, gender: 'male', rating: 1, col: 'brown', dob: '1993-03-06', car: true],
        [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22', car: true],
        [name: 'Dmitri Novak', progress: 52, gender: 'male', rating: 4, col: 'purple', dob: '1988-07-09', car: true]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('sorters', sortersData)
}

// #30 Grouping Data — 10 rows
if (!componentId || componentId == 'groupingData') {
    def groupingData = [
        [name: 'Nora Keane', progress: 18, gender: 'female', rating: 3, col: 'teal', dob: '1991-06-14', car: true],
        [name: 'Marco Vidal', progress: 67, gender: 'male', rating: 1, col: 'orange', dob: '1984-02-28', car: false],
        [name: 'Priya Sharma', progress: 44, gender: 'female', rating: 4, col: 'green', dob: '1997-11-03', car: true],
        [name: 'Leo Tanaka', progress: 89, gender: 'male', rating: 2, col: 'blue', dob: '1978-09-17', car: false],
        [name: 'Clara Jensen', progress: 31, gender: 'female', rating: 5, col: 'red', dob: '2003-04-22', car: true],
        [name: 'Dmitri Novak', progress: 52, gender: 'male', rating: 4, col: 'purple', dob: '1988-07-09', car: true],
        [name: 'Suki Hayashi', progress: 76, gender: 'female', rating: 3, col: 'cyan', dob: '1995-01-18', car: false],
        [name: 'Amara Osei', progress: 83, gender: 'female', rating: 5, col: 'pink', dob: '2001-08-25', car: false],
        [name: 'Rhys Keller', progress: 29, gender: 'male', rating: 1, col: 'brown', dob: '1993-03-06', car: true],
        [name: 'Isla Fernandez', progress: 61, gender: 'female', rating: 3, col: 'yellow', dob: '2006-10-12', car: false]
    ].collect { new LinkedHashMap(it) }
    ctx.reportData('groupingData', groupingData)
}

// #31 Pagination — 50 rows, deterministic
if (!componentId || componentId == 'pagination') {
    def paginationNames = [
        'Nora Keane', 'Marco Vidal', 'Priya Sharma', 'Leo Tanaka', 'Clara Jensen',
        'Dmitri Novak', 'Suki Hayashi', 'Amara Osei', 'Rhys Keller', 'Isla Fernandez',
        'Tomás Reyes', 'Nina Petrova', 'Kai Lindgren', 'Mina Zhao', 'Ezra Bloom',
        'Yara Hadid', 'Finn Callahan', 'Zuri Mbeki', 'Owen Sinclair', 'Lena Kowalski',
        'Dante Moretti', 'Reva Joshi', 'Kieran Byrne', 'Mei-Lin Chow', 'Anika Strand'
    ]
    def paginationColors = ['teal', 'orange', 'green', 'blue', 'red', 'purple', 'cyan', 'pink', 'brown', 'yellow']
    def paginationGenders = ['male', 'female']
    def paginationData = (0..49).collect { i ->
        new LinkedHashMap([
            name: paginationNames[i % paginationNames.size()],
            progress: (i * 7 + 3) % 101,
            gender: paginationGenders[i % 2],
            rating: 1 + (i % 5),
            col: paginationColors[i % paginationColors.size()],
            dob: "${1970 + (i % 40)}-${String.format('%02d', 1 + (i % 12))}-${String.format('%02d', 1 + (i % 28))}",
            car: i % 3 != 0
        ])
    }
    ctx.reportData('pagination', paginationData)
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTION (13 examples)
// ═══════════════════════════════════════════════════════════════════════════════

// #32 Selectable Rows
if (!componentId || componentId == 'selectableRows') {
    ctx.reportData('selectableRows', fillData)
}

// #33 Selectable Rows With Tickbox
if (!componentId || componentId == 'selectableRowsWithTickbox') {
    ctx.reportData('selectableRowsWithTickbox', smallTableData)
}

// #34 Selectable Cell Range
if (!componentId || componentId == 'selectableCellRange') {
    ctx.reportData('selectableCellRange', fillData)
}

// #35 Selectable Cell Range with Clipboard
if (!componentId || componentId == 'selectableCellRangeWithClipboard') {
    ctx.reportData('selectableCellRangeWithClipboard', smallTableData)
}

// #39 Movable Rows
if (!componentId || componentId == 'movableRows') {
    ctx.reportData('movableRows', resizeGuidesData)
}

// #40 Movable Rows With Groups
if (!componentId || componentId == 'movableRowsWithGroups') {
    ctx.reportData('movableRowsWithGroups', resizeGuidesData)
}

log.info("Finished tab-examples data generation — componentId=${componentId ?: '(all)'}.")
