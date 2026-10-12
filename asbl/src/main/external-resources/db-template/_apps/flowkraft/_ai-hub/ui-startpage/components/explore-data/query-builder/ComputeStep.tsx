"use client";

// lucide-react removed
import type { ColumnSchema } from "@/lib/explore-data/types";
import { ARITHMETIC_OPS, isFormulaColumn, type ComputedColumn } from "@/lib/explore-data/computed-columns";
import { FORMULA_FUNCTIONS, parseFormula } from "@/lib/explore-data/formula";
import { columnKindsOf } from "@/lib/explore-data/sql-builder";

/** The option that means "not a column, a number I type". It can never collide
 *  with a column name: the parentheses are not part of any identifier a
 *  database hands back in a column list. */
const A_NUMBER = "(a number)";

interface ComputeStepProps {
  /** The numeric columns of the table - the only ones arithmetic means anything
   *  on. A computed column is not offered as an operand of another one: one step
   *  is the whole of this step (F6). */
  columns: ColumnSchema[];
  /** Every column of the table: a formula (#8) may name any of them - a date for DAYS,
   *  a text for CONCAT or a condition - and not only the numbers one step works on. */
  allColumns?: ColumnSchema[];
  computed: ComputedColumn[];
  onChange: (computed: ComputedColumn[]) => void;
}

/** The functions a formula may call, one per line, for the help beside the box. */
const FORMULA_HELP = [
  "Columns by name ([two words] in brackets), numbers, 'texts';",
  "+ - * / ( ), = <> < <= > >=, AND, OR, NOT;",
  ...FORMULA_FUNCTIONS.map((f) => `${f.usage}: ${f.help}`),
].join("\n");

export function ComputeStep({ columns, allColumns, computed, onChange }: ComputeStepProps) {
  const names = new Set(columns.map((c) => c.columnName));
  const firstColumn = columns[0]?.columnName || "";
  const formulaColumns = columnKindsOf(allColumns ?? columns);

  const addComputed = () => {
    onChange([...computed, { name: "", left: firstColumn, operator: "*", right: firstColumn }]);
  };

  /** A formula row (#8): the name, and one line of formula. */
  const addFormula = () => {
    onChange([...computed, { name: "", left: "", operator: "", right: "", formula: "" }]);
  };

  const updateComputed = (i: number, patch: Partial<ComputedColumn>) => {
    onChange(computed.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const removeComputed = (i: number) => {
    onChange(computed.filter((_, idx) => idx !== i));
  };

  /** One side of the step: a column picker, plus a number box when the side is
   *  a number. Which one it is follows from the value itself - anything that is
   *  not one of the table's columns is a number the user is typing - so there is
   *  no second piece of state that could disagree with what goes into the SQL. */
  const operand = (i: number, side: "left" | "right", value: string) => {
    const isColumn = names.has(value);
    const suffix = side === "left" ? "Left" : "Right";
    return (
      <>
        <select
          id={`selectComputed${suffix}-${i}`}
          value={isColumn ? value : A_NUMBER}
          onChange={(e) =>
            updateComputed(i, { [side]: e.target.value === A_NUMBER ? "" : e.target.value } as Partial<ComputedColumn>)
          }
          className="text-xs bg-base-100 border border-base-300 rounded px-1.5 py-1 text-base-content min-w-0 flex-1"
        >
          {columns.map((c) => (
            <option key={c.columnName} value={c.columnName}>{c.columnName}</option>
          ))}
          <option value={A_NUMBER}>a number</option>
        </select>
        {!isColumn && (
          <input
            id={`inputComputed${suffix}-${i}`}
            type="number"
            step="any"
            value={value}
            placeholder="0"
            onChange={(e) => updateComputed(i, { [side]: e.target.value } as Partial<ComputedColumn>)}
            className="w-20 text-xs bg-base-100 border border-base-300 rounded px-1.5 py-1 text-base-content"
          />
        )}
      </>
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-emerald-500 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008ZM8.25 15h.008v.008H8.25V15Zm0 2.25h.008v.008H8.25v-.008ZM11.25 15h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008ZM14.25 15h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008ZM6 6.75h12v3H6v-3ZM4.5 4.5h15a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5V6a1.5 1.5 0 0 1 1.5-1.5Z" /></svg>
        <span className="text-xs text-base-content/60">Compute</span>
        {columns.length > 0 && (
          <button id="btnAddComputed" onClick={addComputed} title="One step: a column and a number, or two columns" className="p-0.5 rounded hover:bg-base-200 text-base-content/60 hover:text-base-content">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </button>
        )}
        <button id="btnAddFormula" onClick={addFormula} title={FORMULA_HELP} className="text-xs text-base-content/60 hover:text-base-content underline">
          + formula
        </button>
      </div>

      {computed.map((c, i) => isFormulaColumn(c) ? (() => {
        const read = c.formula!.trim() ? parseFormula(c.formula!, formulaColumns) : null;
        return (
          <div key={i} className="ml-6 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <input
                id={`inputComputedName-${i}`}
                type="text"
                value={c.name}
                placeholder="new column"
                onChange={(e) => updateComputed(i, { name: e.target.value })}
                className="w-28 text-xs bg-base-100 border border-base-300 rounded px-1.5 py-1 text-base-content"
              />
              <span className="text-xs text-base-content/60">=</span>
              <input
                id={`inputComputedFormula-${i}`}
                type="text"
                value={c.formula}
                placeholder="IF(status = 'returned', total_amount, 0)"
                title={FORMULA_HELP}
                spellCheck={false}
                onChange={(e) => updateComputed(i, { formula: e.target.value })}
                className="flex-1 min-w-0 text-xs font-mono bg-base-100 border border-base-300 rounded px-1.5 py-1 text-base-content"
              />
              <button id={`btnRemoveComputed-${i}`} onClick={() => removeComputed(i)} className="p-0.5 rounded hover:bg-error/10 text-base-content/60 hover:text-error">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Why a formula is not in the query yet, in words; nothing while it reads. */}
            {read && !read.ok && (
              <div id={`computedFormulaError-${i}`} className="text-[11px] text-error ml-[7.5rem]">{read.error}</div>
            )}
          </div>
        );
      })() : (
        <div key={i} className="flex items-center gap-1.5 ml-6 flex-wrap">
          <input
            id={`inputComputedName-${i}`}
            type="text"
            value={c.name}
            placeholder="new column"
            onChange={(e) => updateComputed(i, { name: e.target.value })}
            className="w-28 text-xs bg-base-100 border border-base-300 rounded px-1.5 py-1 text-base-content"
          />
          <span className="text-xs text-base-content/60">=</span>
          {operand(i, "left", c.left)}
          <select
            id={`selectComputedOp-${i}`}
            value={c.operator}
            onChange={(e) => updateComputed(i, { operator: e.target.value })}
            className="text-xs bg-base-100 border border-base-300 rounded px-1.5 py-1 text-base-content w-14"
          >
            {ARITHMETIC_OPS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
          {operand(i, "right", c.right)}
          <button id={`btnRemoveComputed-${i}`} onClick={() => removeComputed(i)} className="p-0.5 rounded hover:bg-error/10 text-base-content/60 hover:text-error">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
