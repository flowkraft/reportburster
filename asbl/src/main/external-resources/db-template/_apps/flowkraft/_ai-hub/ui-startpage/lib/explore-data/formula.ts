// The one-line formula a computed column may be written as (#8).
//
// The Compute step's other form is one arithmetic step picked from two
// dropdowns (`computed-columns.ts`). A formula is the same thing typed: chained
// arithmetic with brackets, a condition, a bin, the days between two dates, a
// rounding, text joined together - the computed columns a business user asks
// for and that one step cannot say.
//
// Nothing the user types reaches the SQL as SQL. The text is read here into a
// tree, and the tree is written out by `formulaSql`: a column name must be one
// of the table's columns and goes in quoted as an identifier, a number goes in
// as a decimal literal, a text goes in through the vendor layer's own literal
// escaping (`sqlLiteral`), and a function or an operator is one of the lists
// below or the formula does not parse. A formula that does not parse leaves
// the computed column out of the query, the way an empty filter value box does,
// and the Compute step says why under the box.
//
// The SQL is ANSI wherever ANSI has a form (CASE, ROUND, FLOOR, ABS, COALESCE,
// the comparisons). The three things it has none for - the days between two
// dates, a value read as text, and joining texts - come from the vendor layer
// (`daysBetweenExpr`, `textExpr`, `concatExpr` in `sql-dialects.ts`), and a
// division from `decimalDivision`, as the one-step column's does.

import {
  concatExpr,
  dateExpr,
  daysBetweenExpr,
  decimalDivision,
  quoteIdent,
  sqlLiteral,
  textExpr,
  type SqlDialect,
  type SqlLiteralKind,
} from "./sql-dialects";

/** What a formula, or a part of it, gives: a number, a text, a date, or a
 *  condition (true or false). A computed column itself is a number or a text. */
export type FormulaType = "number" | "text" | "date" | "boolean";

/** One node of a read formula. */
export type FormulaNode =
  | { kind: "number"; value: number }
  | { kind: "text"; value: string }
  | { kind: "column"; name: string; type: FormulaType }
  | { kind: "neg"; arg: FormulaNode }
  | { kind: "not"; arg: FormulaNode }
  | { kind: "binary"; op: string; left: FormulaNode; right: FormulaNode }
  | { kind: "call"; fn: string; args: FormulaNode[] };

/** One function a formula may call, as the help under the box lists it. */
export interface FormulaFunctionDef {
  name: string;
  usage: string;
  help: string;
}

/** The functions a formula may call - the list the help shows and the parser accepts. */
export const FORMULA_FUNCTIONS: FormulaFunctionDef[] = [
  { name: "IF", usage: "IF(condition, then, else)", help: "one value or the other" },
  { name: "CASE", usage: "CASE(condition1, value1, condition2, value2, ..., else)", help: "the value of the first condition that holds" },
  { name: "ROUND", usage: "ROUND(number, decimals)", help: "rounded; decimals may be left out (0)" },
  { name: "BIN", usage: "BIN(number, width)", help: "the start of the band the number falls in: BIN(age, 10) is 0, 10, 20..." },
  { name: "DAYS", usage: "DAYS(start, end)", help: "the whole days from one date to the other" },
  { name: "TODAY", usage: "TODAY()", help: "the data's today" },
  { name: "CONCAT", usage: "CONCAT(text, text, ...)", help: "texts joined; a number is written as text" },
  { name: "ABS", usage: "ABS(number)", help: "without its sign" },
  { name: "COALESCE", usage: "COALESCE(value, fallback, ...)", help: "the first value that is not empty" },
];

const FUNCTION_NAMES = new Set(FORMULA_FUNCTIONS.map((f) => f.name));

/** The comparisons a condition may use; `!=` is read as `<>`, the ANSI form. */
const COMPARISONS = ["=", "<>", "!=", "<", "<=", ">", ">="];

/** What the parser hands back: the tree and what it gives, or why it could not be read. */
export type FormulaParse =
  | { ok: true; node: FormulaNode; type: FormulaType }
  | { ok: false; error: string };

/** What the parser needs to know about the table: the kind of each column it may name.
 *  Absent means the columns are not known yet, and any name is taken as a column of any kind. */
export type FormulaColumns = ReadonlyMap<string, SqlLiteralKind> | null | undefined;

type Token =
  | { t: "num"; v: number; at: number }
  | { t: "str"; v: string; at: number }
  | { t: "id"; v: string; at: number }
  | { t: "op"; v: string; at: number }
  | { t: "end"; at: number };

class FormulaError extends Error {}

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+(\.\d*)?|\.\d+)/.exec(text.slice(i));
      if (!m) throw new FormulaError(`"${c}" at ${i + 1} is not a number`);
      out.push({ t: "num", v: Number(m[0]), at: i });
      i += m[0].length;
      continue;
    }
    if (c === "'" || c === '"') {
      // A text in either quote; the quote itself is written twice inside it.
      let j = i + 1;
      let v = "";
      for (;;) {
        if (j >= text.length) throw new FormulaError(`the text that starts at ${i + 1} is not closed with ${c}`);
        if (text[j] === c) {
          if (text[j + 1] === c) { v += c; j += 2; continue; }
          break;
        }
        v += text[j++];
      }
      out.push({ t: "str", v, at: i });
      i = j + 1;
      continue;
    }
    if (c === "[") {
      // A column whose name is not one word: [order date].
      const j = text.indexOf("]", i + 1);
      if (j < 0) throw new FormulaError(`the column name that starts at ${i + 1} is not closed with ]`);
      out.push({ t: "id", v: text.slice(i + 1, j), at: i });
      i = j + 1;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(i))!;
      out.push({ t: "id", v: m[0], at: i });
      i += m[0].length;
      continue;
    }
    const two = text.slice(i, i + 2);
    if (["<=", ">=", "<>", "!="].includes(two)) { out.push({ t: "op", v: two, at: i }); i += 2; continue; }
    if ("+-*/(),=<>".includes(c)) { out.push({ t: "op", v: c, at: i }); i++; continue; }
    throw new FormulaError(`"${c}" at ${i + 1} is not part of a formula`);
  }
  out.push({ t: "end", at: text.length });
  return out;
}

/**
 * Read a formula. Precedence, loosest first: OR, AND, NOT, the comparisons,
 * + and -, * and /, a sign. Function and keyword names are read in any case;
 * a column name is matched exactly first, then regardless of case.
 */
export function parseFormula(text: string, columns: FormulaColumns): FormulaParse {
  try {
    if (!String(text ?? "").trim()) return { ok: false, error: "the formula is empty" };
    const tokens = tokenize(text);
    let pos = 0;
    const peek = () => tokens[pos];
    const isOp = (v: string) => { const k = peek(); return k.t === "op" && k.v === v; };
    const isWord = (w: string) => { const k = peek(); return k.t === "id" && k.v.toUpperCase() === w; };
    const expect = (v: string) => {
      if (!isOp(v)) throw new FormulaError(`"${v}" expected at ${peek().at + 1}`);
      pos++;
    };

    const columnOf = (name: string): { name: string; type: FormulaType } => {
      if (!columns) return { name, type: "number" };
      let found = columns.has(name) ? name : undefined;
      if (!found) for (const n of columns.keys()) if (n.toLowerCase() === name.toLowerCase()) { found = n; break; }
      if (!found) throw new FormulaError(`there is no column "${name}"`);
      const kind = columns.get(found);
      const type: FormulaType = kind === "number" ? "number"
        : kind === "date" || kind === "timestamp" ? "date"
        : kind === "boolean" ? "boolean" : "text";
      return { name: found, type };
    };

    const parseOr = (): FormulaNode => {
      let left = parseAnd();
      while (isWord("OR")) { pos++; left = { kind: "binary", op: "OR", left, right: parseAnd() }; }
      return left;
    };
    const parseAnd = (): FormulaNode => {
      let left = parseNot();
      while (isWord("AND")) { pos++; left = { kind: "binary", op: "AND", left, right: parseNot() }; }
      return left;
    };
    const parseNot = (): FormulaNode => {
      if (isWord("NOT")) { pos++; return { kind: "not", arg: parseNot() }; }
      return parseComparison();
    };
    const parseComparison = (): FormulaNode => {
      const left = parseSum();
      const k = peek();
      if (k.t === "op" && COMPARISONS.includes(k.v)) {
        pos++;
        return { kind: "binary", op: k.v === "!=" ? "<>" : k.v, left, right: parseSum() };
      }
      return left;
    };
    const parseSum = (): FormulaNode => {
      let left = parseProduct();
      while (isOp("+") || isOp("-")) {
        const op = (peek() as { v: string }).v; pos++;
        left = { kind: "binary", op, left, right: parseProduct() };
      }
      return left;
    };
    const parseProduct = (): FormulaNode => {
      let left = parseUnary();
      while (isOp("*") || isOp("/")) {
        const op = (peek() as { v: string }).v; pos++;
        left = { kind: "binary", op, left, right: parseUnary() };
      }
      return left;
    };
    const parseUnary = (): FormulaNode => {
      if (isOp("-")) { pos++; return { kind: "neg", arg: parseUnary() }; }
      if (isOp("+")) { pos++; return parseUnary(); }
      return parseAtom();
    };
    const parseAtom = (): FormulaNode => {
      const k = peek();
      if (k.t === "num") { pos++; return { kind: "number", value: k.v }; }
      if (k.t === "str") { pos++; return { kind: "text", value: k.v }; }
      if (k.t === "op" && k.v === "(") {
        pos++;
        const inner = parseOr();
        expect(")");
        return inner;
      }
      if (k.t === "id") {
        pos++;
        const next = peek();
        if (next.t === "op" && next.v === "(") {
          const fn = k.v.toUpperCase();
          if (!FUNCTION_NAMES.has(fn)) throw new FormulaError(`there is no function ${k.v}()`);
          pos++;
          const args: FormulaNode[] = [];
          if (!isOp(")")) {
            args.push(parseOr());
            while (isOp(",")) { pos++; args.push(parseOr()); }
          }
          expect(")");
          return { kind: "call", fn, args };
        }
        const col = columnOf(k.v);
        return { kind: "column", name: col.name, type: col.type };
      }
      if (k.t === "end") throw new FormulaError("the formula ends too soon");
      throw new FormulaError(`"${(k as { v: string }).v}" at ${k.at + 1} is not expected there`);
    };

    const node = parseOr();
    if (peek().t !== "end") throw new FormulaError(`"${(peek() as { v?: string }).v ?? ""}" at ${peek().at + 1} is left over`);
    const type = typeOf(node);
    if (type === "boolean") {
      throw new FormulaError("a condition alone is true or false, not a column: write IF(condition, 1, 0)");
    }
    if (type === "date") {
      throw new FormulaError("a formula gives a number or a text: DAYS(start, end) turns dates into a number");
    }
    return { ok: true, node, type };
  } catch (e) {
    if (e instanceof FormulaError) return { ok: false, error: e.message };
    throw e;
  }
}

/** What a node gives, checked: an operator or a function handed the wrong kind is refused here, with words. */
function typeOf(node: FormulaNode): FormulaType {
  const want = (n: FormulaNode, t: FormulaType, what: string): void => {
    const got = typeOf(n);
    if (got !== t) throw new FormulaError(`${what} needs ${t === "boolean" ? "a condition" : `a ${t}`}, not a ${got === "boolean" ? "condition" : got}`);
  };
  const same = (nodes: FormulaNode[], what: string): FormulaType => {
    const types = nodes.map(typeOf);
    if (types.some((t) => t !== types[0])) throw new FormulaError(`${what} must all be numbers, or all texts`);
    return types[0];
  };
  switch (node.kind) {
    case "number": return "number";
    case "text": return "text";
    case "column": return node.type;
    case "neg": want(node.arg, "number", "a minus sign"); return "number";
    case "not": want(node.arg, "boolean", "NOT"); return "boolean";
    case "binary": {
      if (node.op === "AND" || node.op === "OR") {
        want(node.left, "boolean", node.op); want(node.right, "boolean", node.op); return "boolean";
      }
      if (COMPARISONS.includes(node.op)) {
        const l = typeOf(node.left), r = typeOf(node.right);
        // A date is compared with a date, or with a text that is one: order_date >= '2026-01-01'.
        const dateAndText = (l === "date" && node.right.kind === "text") || (r === "date" && node.left.kind === "text");
        if (l !== r && !dateAndText) throw new FormulaError(`a ${l} cannot be compared with a ${r}`);
        if (l === "boolean") throw new FormulaError("a condition cannot be compared; use AND, OR, NOT");
        return "boolean";
      }
      if (node.op === "+" && (typeOf(node.left) === "text" || typeOf(node.right) === "text")) {
        throw new FormulaError("+ adds numbers; CONCAT(a, b) joins texts");
      }
      want(node.left, "number", node.op); want(node.right, "number", node.op);
      return "number";
    }
    case "call": {
      const n = node.args.length;
      const arity = (min: number, max: number) => {
        if (n < min || n > max) {
          const usage = FORMULA_FUNCTIONS.find((f) => f.name === node.fn)!.usage;
          throw new FormulaError(`${node.fn} takes ${min === max ? min : `${min} to ${max === Infinity ? "any number of" : max}`} values: ${usage}`);
        }
      };
      switch (node.fn) {
        case "IF":
          arity(3, 3); want(node.args[0], "boolean", "the first value of IF");
          return same(node.args.slice(1), "the two values of IF");
        case "CASE": {
          arity(2, Infinity);
          const values: FormulaNode[] = [];
          for (let i = 0; i + 1 < n; i += 2) { want(node.args[i], "boolean", `value ${i + 1} of CASE`); values.push(node.args[i + 1]); }
          if (n % 2 === 1) values.push(node.args[n - 1]);
          return same(values, "the values of CASE");
        }
        case "ROUND":
          arity(1, 2); want(node.args[0], "number", "ROUND");
          if (n === 2 && !(node.args[1].kind === "number" && Number.isInteger(node.args[1].value) && node.args[1].value <= 10)) {
            throw new FormulaError("the decimals of ROUND are a whole number from 0 to 10");
          }
          return "number";
        case "BIN":
          arity(2, 2); want(node.args[0], "number", "BIN");
          if (!(node.args[1].kind === "number" && node.args[1].value > 0)) throw new FormulaError("the width of BIN is a number above 0");
          return "number";
        case "DAYS":
          arity(2, 2); want(node.args[0], "date", "DAYS"); want(node.args[1], "date", "DAYS");
          return "number";
        case "TODAY": arity(0, 0); return "date";
        case "CONCAT":
          arity(2, Infinity);
          for (const a of node.args) if (typeOf(a) === "boolean") throw new FormulaError("CONCAT joins values, not conditions");
          return "text";
        case "ABS": arity(1, 1); want(node.args[0], "number", "ABS"); return "number";
        case "COALESCE": arity(2, Infinity); return same(node.args, "the values of COALESCE");
      }
      throw new FormulaError(`there is no function ${node.fn}()`);
    }
  }
}

/** What writing a formula's SQL needs to know. */
export interface FormulaSqlContext {
  dialect: SqlDialect;
  /** The data's today, `yyyy-mm-dd`, which TODAY() is (`useDataToday`). */
  today: string;
}

/** The SQL of a read formula. Every part of it is in brackets, so it can stand in a SELECT, a WHERE or a SUM unchanged. */
export function formulaSql(node: FormulaNode, ctx: FormulaSqlContext): string {
  const d = ctx.dialect;
  const sql = (n: FormulaNode): string => formulaSql(n, ctx);
  switch (node.kind) {
    case "number": return numberLiteral(node.value);
    case "text": return sqlLiteral(node.value, "string", d);
    // A date column is read through `dateExpr`, so SQLite's epoch milliseconds are a date too.
    case "column":
      if (node.type === "date") return dateExpr(node.name, d);
      // A Boolean column is a condition, written as one: four of the nine have no boolean type.
      if (node.type === "boolean") return `(${quoteIdent(node.name, d)} = ${sqlLiteral(true, "boolean", d)})`;
      return quoteIdent(node.name, d);
    case "neg": return `(-${sql(node.arg)})`;
    case "not": return `(NOT ${sql(node.arg)})`;
    case "binary": {
      if (node.op === "/") return decimalDivision(sql(node.left), sql(node.right), d);
      if (COMPARISONS.includes(node.op)) {
        // A text beside a date is that date: written as the vendor's date literal.
        const side = (n: FormulaNode, other: FormulaNode): string =>
          n.kind === "text" && typeOf(other) === "date" ? sqlLiteral(n.value, "date", d) : sql(n);
        return `(${side(node.left, node.right)} ${node.op} ${side(node.right, node.left)})`;
      }
      return `(${sql(node.left)} ${node.op} ${sql(node.right)})`;
    }
    case "call": {
      const a = node.args;
      switch (node.fn) {
        case "IF": return `(CASE WHEN ${sql(a[0])} THEN ${sql(a[1])} ELSE ${sql(a[2])} END)`;
        case "CASE": {
          const whens: string[] = [];
          for (let i = 0; i + 1 < a.length; i += 2) whens.push(`WHEN ${sql(a[i])} THEN ${sql(a[i + 1])}`);
          const otherwise = a.length % 2 === 1 ? ` ELSE ${sql(a[a.length - 1])}` : "";
          return `(CASE ${whens.join(" ")}${otherwise} END)`;
        }
        // The value is cast to DECIMAL first: PostgreSQL has no ROUND of a double and a number of places.
        case "ROUND": return `ROUND(CAST(${sql(a[0])} AS DECIMAL(31,4)), ${a.length > 1 ? sql(a[1]) : "0"})`;
        // The same band `numericBinExpr` writes for a binned group-by column.
        case "BIN": return `(FLOOR(CAST(${sql(a[0])} AS DECIMAL(31,4)) / ${sql(a[1])}) * ${sql(a[1])})`;
        case "DAYS": return daysBetweenExpr(sql(a[0]), sql(a[1]), d);
        case "TODAY": return sqlLiteral(ctx.today, "date", d);
        case "CONCAT":
          return concatExpr(a.map((x) => (typeOf(x) === "text" ? sql(x) : textExpr(sql(x), d))), d);
        case "ABS": return `ABS(${sql(a[0])})`;
        case "COALESCE": return `COALESCE(${a.map(sql).join(", ")})`;
      }
    }
  }
  throw new Error(`formulaSql: nothing to write for ${JSON.stringify(node)}`);
}

/** A number as the formula has it: the digits typed, never an exponent. */
function numberLiteral(value: number): string {
  if (!Number.isFinite(value)) throw new FormulaError("a number is too large");
  const text = String(value);
  return /e/i.test(text) ? value.toFixed(20).replace(/0+$/, "").replace(/\.$/, "") : text;
}
