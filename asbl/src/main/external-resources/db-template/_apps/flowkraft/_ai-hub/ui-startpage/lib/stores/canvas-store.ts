import { create } from "zustand";

// --- Types ---

export type WidgetType = "chart" | "tabulator" | "pivot" | "kpi" | "text" | "divider" | "filter-pane";

export type DataSourceMode = "visual" | "ai-sql" | "sql" | "script";

export interface VisualQuery {
  table: string;
  filters: { column: string; operator: string; value: string; valueTo?: string }[];
  summarize: { aggregation: string; field: string }[];
  groupBy: string[];
  sort: { column: string; direction: "ASC" | "DESC" }[];
  limit: number;
}

export interface DataSource {
  mode: DataSourceMode;
  visualQuery?: VisualQuery;
  sql?: string;
  script?: string;
  generatedSql?: string;
}

export interface WidgetDisplayConfig {
  [key: string]: unknown;
}

export interface Widget {
  id: string;
  type: WidgetType;
  gridPosition: { x: number; y: number; w: number; h: number };
  dataSource: DataSource | null;
  displayConfig: WidgetDisplayConfig;
}

export interface DashboardFilter {
  id: string;
  paramName: string;
  type: "dropdown" | "date" | "daterange" | "text" | "number";
  label: string;
  defaultValue: string;
  linkedWidgetIds: string[];
}

export interface CanvasState {
  id: string;
  name: string;
  description: string;
  connectionId: string | null;
  widgets: Widget[];
  filters: DashboardFilter[];
  filterValues: Record<string, string>;
  filterVersion: number;
  selectedWidgetId: string | null;
  editMode: boolean;
  // Associative exploration (activates when ≥1 filter-pane widget exists)
  exploreSelections: ExploreSelection[];
  exploreFieldStates: FieldStates;
  exploreVersion: number; // bumped on selection change — widgets watch this
}

// --- Default state for a new canvas ---

const DEFAULT_STATE: CanvasState = {
  id: "",
  name: "Untitled Canvas",
  description: "",
  connectionId: null,
  widgets: [],
  filters: [],
  filterValues: {},
  filterVersion: 0,
  selectedWidgetId: null,
  editMode: true,
  exploreSelections: [],
  exploreFieldStates: {},
  exploreVersion: 0,
};

// --- Widget defaults ---

const WIDGET_DEFAULTS: Record<WidgetType, { w: number; h: number }> = {
  chart: { w: 6, h: 4 },
  tabulator: { w: 12, h: 4 },
  pivot: { w: 12, h: 5 },
  kpi: { w: 3, h: 2 },
  text: { w: 6, h: 2 },
  divider: { w: 12, h: 1 },
  "filter-pane": { w: 3, h: 4 },
};

// --- Associative exploration types ---

export interface ExploreSelection {
  field: string;
  value: string;
}

export interface FieldStates {
  [field: string]: { associated: string[]; excluded: string[] };
}

// --- Store ---

interface CanvasActions {
  loadCanvas: (canvas: CanvasState) => void;
  resetCanvas: () => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setConnectionId: (connectionId: string | null) => void;
  addWidget: (type: WidgetType) => string;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, position: { x: number; y: number; w: number; h: number }) => void;
  updateWidgetDataSource: (id: string, dataSource: DataSource) => void;
  updateWidgetDisplayConfig: (id: string, config: WidgetDisplayConfig) => void;
  selectWidget: (id: string | null) => void;
  setEditMode: (editMode: boolean) => void;
  updateLayout: (layouts: { i: string; x: number; y: number; w: number; h: number }[]) => void;
  addFilter: (filter: DashboardFilter) => void;
  removeFilter: (id: string) => void;
  updateFilter: (id: string, patch: Partial<DashboardFilter>) => void;
  setFilterValue: (paramName: string, value: string) => void;
  // Associative exploration
  toggleExploreSelection: (field: string, value: string) => void;
  clearExploreSelections: () => void;
  setExploreFieldStates: (states: FieldStates) => void;
  isExploreActive: () => boolean; // true when ≥1 filter-pane widget exists
  getSerializableState: () => Omit<CanvasState, "selectedWidgetId" | "editMode" | "filterValues" | "filterVersion" | "exploreSelections" | "exploreFieldStates" | "exploreVersion">;
}

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  ...DEFAULT_STATE,

  loadCanvas: (canvas) => set({ ...canvas, selectedWidgetId: null, editMode: true }),

  resetCanvas: () => set({ ...DEFAULT_STATE }),

  setName: (name) => set({ name }),

  setDescription: (description) => set({ description }),

  setConnectionId: (connectionId) => set({ connectionId }),

  addWidget: (type) => {
    const id = `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const defaults = WIDGET_DEFAULTS[type];
    const widgets = get().widgets;

    // Find the lowest available y position
    let maxY = 0;
    for (const w of widgets) {
      const bottom = w.gridPosition.y + w.gridPosition.h;
      if (bottom > maxY) maxY = bottom;
    }

    const widget: Widget = {
      id,
      type,
      gridPosition: { x: 0, y: maxY, ...defaults },
      dataSource: null,
      displayConfig: {},
    };

    set({ widgets: [...widgets, widget], selectedWidgetId: id });
    return id;
  },

  removeWidget: (id) => {
    const state = get();
    set({
      widgets: state.widgets.filter((w) => w.id !== id),
      selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
    });
  },

  updateWidgetPosition: (id, position) => {
    set({
      widgets: get().widgets.map((w) => (w.id === id ? { ...w, gridPosition: position } : w)),
    });
  },

  updateWidgetDataSource: (id, dataSource) => {
    set({
      widgets: get().widgets.map((w) => (w.id === id ? { ...w, dataSource } : w)),
    });
  },

  updateWidgetDisplayConfig: (id, config) => {
    set({
      widgets: get().widgets.map((w) => (w.id === id ? { ...w, displayConfig: config } : w)),
    });
  },

  selectWidget: (id) => set({ selectedWidgetId: id }),

  setEditMode: (editMode) => set({ editMode }),

  updateLayout: (layouts) => {
    set({
      widgets: get().widgets.map((w) => {
        const layout = layouts.find((l) => l.i === w.id);
        if (layout) {
          return { ...w, gridPosition: { x: layout.x, y: layout.y, w: layout.w, h: layout.h } };
        }
        return w;
      }),
    });
  },

  addFilter: (filter) => {
    set({ filters: [...get().filters, filter] });
  },

  removeFilter: (id) => {
    const state = get();
    const removed = state.filters.find((f) => f.id === id);
    const newFilterValues = { ...state.filterValues };
    if (removed) delete newFilterValues[removed.paramName];
    set({ filters: state.filters.filter((f) => f.id !== id), filterValues: newFilterValues, filterVersion: state.filterVersion + 1 });
  },

  updateFilter: (id, patch) => {
    set({ filters: get().filters.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  },

  setFilterValue: (paramName, value) => {
    const state = get();
    set({
      filterValues: { ...state.filterValues, [paramName]: value },
      filterVersion: state.filterVersion + 1,
    });
  },

  toggleExploreSelection: (field, value) => {
    const state = get();
    const exists = state.exploreSelections.find((s) => s.field === field && s.value === value);
    const next = exists
      ? state.exploreSelections.filter((s) => !(s.field === field && s.value === value))
      : [...state.exploreSelections, { field, value }];
    set({ exploreSelections: next, exploreVersion: state.exploreVersion + 1 });
  },

  clearExploreSelections: () => {
    set({ exploreSelections: [], exploreFieldStates: {}, exploreVersion: get().exploreVersion + 1 });
  },

  setExploreFieldStates: (states) => {
    set({ exploreFieldStates: states });
  },

  isExploreActive: () => {
    return get().widgets.some((w) => w.type === "filter-pane");
  },

  getSerializableState: () => {
    const { selectedWidgetId, editMode, filterValues, filterVersion, exploreSelections, exploreFieldStates, exploreVersion, ...rest } = get();
    // Strip store actions — only keep data properties
    const { loadCanvas, resetCanvas, setName, setDescription, setConnectionId, addWidget, removeWidget, updateWidgetPosition, updateWidgetDataSource, updateWidgetDisplayConfig, selectWidget, setEditMode, updateLayout, addFilter, removeFilter, updateFilter, setFilterValue, toggleExploreSelection, clearExploreSelections, setExploreFieldStates, isExploreActive, getSerializableState, ...state } = rest as CanvasState & CanvasActions;
    return state;
  },
}));
