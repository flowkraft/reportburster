// Import your web component Svelte files
import RbTabulator from "./RbTabulator.wc.svelte";
import RbChart from "./RbChart.wc.svelte";
import RbPivotTable from "./RbPivotTable.wc.svelte";
import RbParameters from "./RbParameters.wc.svelte";
import RbReport from "./RbReport.wc.svelte";

// Export them so they can be imported elsewhere if desired
export { RbTabulator, RbChart, RbPivotTable, RbParameters, RbReport };

// rb-dashboard is a semantic alias for rb-report
const RbReportClass = customElements.get('rb-report');
if (RbReportClass && !customElements.get('rb-dashboard')) {
  customElements.define('rb-dashboard', class extends RbReportClass {});
}
