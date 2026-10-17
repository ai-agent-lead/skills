// Parses one source file with tree-sitter (WASM) into plain data: definitions,
// call sites, references, imports, and entry-point labels. No types — names only.

import path from 'path';
import { fileURLToPath } from 'url';
import { Parser, Language, Query } from './vendor/web-tree-sitter.js';

const VENDOR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'vendor');

const JS_DEFS = `
(function_declaration name: (identifier) @name) @def.function
(generator_function_declaration name: (identifier) @name) @def.function
(class_declaration name: (_) @name) @def.class
(method_definition name: (_) @name) @def.method
(variable_declarator name: (identifier) @name value: [(arrow_function) (function_expression)]) @def.function
`;
const TS_DEFS = `${JS_DEFS}
(abstract_class_declaration name: (type_identifier) @name) @def.class
(interface_declaration name: (type_identifier) @name) @def.interface
(type_alias_declaration name: (type_identifier) @name) @def.type
(method_signature name: (_) @name) @def.method
(function_signature name: (identifier) @name) @def.function
`;
const JS_CALLS = `
(call_expression function: (identifier) @name) @call
(call_expression function: (member_expression object: (_) @qualifier property: (_) @name)) @call
(new_expression constructor: (identifier) @name) @call
(new_expression constructor: (member_expression object: (_) @qualifier property: (_) @name)) @call
`;
const JSX_REFS = `
(jsx_opening_element name: (identifier) @name) @ref
(jsx_self_closing_element name: (identifier) @name) @ref
`;
const JS_IMPORTS = `
(import_statement source: (string (string_fragment) @path)) @import
(export_statement source: (string (string_fragment) @path)) @reexport
(variable_declarator name: (_) @binding value: (call_expression function: (identifier) @fn arguments: (arguments . (string (string_fragment) @path)))) @require
`;

export const LANGUAGES = {
  go: {
    family: 'go',
    exts: ['.go'],
    grammar: 'tree-sitter-go.wasm',
    defs: `
(function_declaration name: (identifier) @name) @def.function
(method_declaration name: (field_identifier) @name) @def.method
(type_spec name: (type_identifier) @name) @def.type
(method_elem name: (field_identifier) @name) @def.method
`,
    calls: `
(call_expression function: (identifier) @name) @call
(call_expression function: (selector_expression operand: (_) @qualifier field: (field_identifier) @name)) @call
(composite_literal type: (type_identifier) @name) @ref
(composite_literal type: (qualified_type package: (package_identifier) @qualifier name: (type_identifier) @name)) @ref
`,
    imports: `
(package_clause (package_identifier) @package)
(import_spec name: (_)? @alias path: (_) @path) @import
`,
    strings: ['interpreted_string_literal', 'raw_string_literal'],
    isTest: (file) => file.endsWith('_test.go'),
  },
  javascript: { family: 'js', exts: ['.js', '.mjs', '.cjs', '.jsx'], grammar: 'tree-sitter-javascript.wasm', defs: JS_DEFS, calls: JS_CALLS + JSX_REFS, imports: JS_IMPORTS },
  typescript: { family: 'js', exts: ['.ts', '.mts', '.cts'], grammar: 'tree-sitter-typescript.wasm', defs: TS_DEFS, calls: JS_CALLS, imports: JS_IMPORTS },
  tsx: { family: 'js', exts: ['.tsx'], grammar: 'tree-sitter-tsx.wasm', defs: TS_DEFS, calls: JS_CALLS + JSX_REFS, imports: JS_IMPORTS },
  python: {
    family: 'py',
    exts: ['.py'],
    grammar: 'tree-sitter-python.wasm',
    defs: `
(function_definition name: (identifier) @name) @def.function
(class_definition name: (identifier) @name) @def.class
`,
    calls: `
(call function: (identifier) @name) @call
(call function: (attribute object: (_) @qualifier attribute: (identifier) @name)) @call
`,
    imports: `
(import_statement) @import_py
(import_from_statement) @from_py
`,
    strings: ['string'],
    isTest: (file) => /(^|\/)(test_[^/]*|[^/]*_test)\.py$/.test(file),
  },
};
for (const lang of [LANGUAGES.javascript, LANGUAGES.typescript, LANGUAGES.tsx]) {
  lang.strings = ['string', 'template_string'];
  lang.isTest = (file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) || /(^|\/)__tests__\//.test(file);
}

export const EXTENSIONS = new Map(Object.entries(LANGUAGES).flatMap(([name, l]) => l.exts.map((e) => [e, name])));

const ROUTE = /^((GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+)?\/[\w/{}:.*-]*$/i;
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const CONTAINERS = new Set(['class_declaration', 'abstract_class_declaration', 'class', 'interface_declaration', 'class_definition', 'type_spec']);

let ready;
const loaded = new Map();

async function language(name) {
  if (!ready) ready = Parser.init();
  await ready;
  if (!loaded.has(name)) {
    const spec = LANGUAGES[name];
    const lang = await Language.load(path.join(VENDOR, spec.grammar));
    const parser = new Parser();
    parser.setLanguage(lang);
    loaded.set(name, {
      parser,
      defs: new Query(lang, spec.defs),
      calls: new Query(lang, spec.calls),
      imports: new Query(lang, spec.imports),
    });
  }
  return loaded.get(name);
}

const unquote = (s) => s.replace(/^[`'"]|[`'"]$/g, '');
const line = (node) => node.startPosition.row + 1;

function containerOf(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (CONTAINERS.has(p.type)) return p.childForFieldName('name')?.text ?? null;
  }
  return null;
}

function stringArgs(argsNode, spec) {
  return (argsNode?.namedChildren ?? []).filter((c) => spec.strings.includes(c.type)).map((c) => unquote(c.text));
}

// Identifiers passed as arguments: handlers, callbacks, dependencies.
function refArgs(argsNode) {
  const out = [];
  for (const c of argsNode?.namedChildren ?? []) {
    const inner = c.type === 'keyword_argument' ? c.childForFieldName('value') : c;
    if (!inner) continue;
    if (inner.type === 'identifier') out.push({ name: inner.text, qualifier: null });
    else if (['selector_expression', 'member_expression', 'attribute'].includes(inner.type)) {
      const name = inner.childForFieldName('field') ?? inner.childForFieldName('property') ?? inner.childForFieldName('attribute');
      const qualifier = inner.childForFieldName('operand') ?? inner.childForFieldName('object');
      if (name && qualifier) out.push({ name: name.text, qualifier: qualifier.text });
    }
  }
  return out;
}

function entryOf(def, node, spec, file) {
  if (spec.family === 'go') {
    if (def.kind === 'function' && def.name === 'main') return 'main';
    const params = node.childForFieldName('parameters')?.text ?? '';
    if (/http\.ResponseWriter|\*gin\.Context|echo\.Context|\*fiber\.Ctx/.test(params)) return 'HTTP handler';
  }
  if (spec.family === 'py') {
    const decorated = node.parent?.type === 'decorated_definition' ? node.parent : null;
    for (const d of decorated?.namedChildren.filter((c) => c.type === 'decorator') ?? []) {
      const text = d.text;
      const route = text.match(/\.(route|get|post|put|patch|delete|api_route|websocket)\(\s*["']([^"']+)["']/);
      if (route) return `route ${route[1] === 'route' ? '' : `${route[1].toUpperCase()} `}${route[2]}`;
      if (/\b(task|shared_task|job|scheduled_job)\b/.test(text)) return 'job';
      if (/\b(command|group)\(/.test(text)) return 'CLI command';
    }
  }
  if (spec.family === 'js' && HTTP_METHODS.has(def.name) && /(^|\/)route\.[cm]?[jt]sx?$/.test(file)) return `route ${def.name}`;
  return null;
}

function isTestDef(def, spec, file) {
  if (!spec.isTest(file)) return false;
  if (spec.family === 'go') return /^(Test|Benchmark|Fuzz|Example)/.test(def.name);
  if (spec.family === 'py') return /^test/i.test(def.name) || /^Test/.test(def.container ?? '');
  return true;
}

function parseImportClause(clause) {
  const bindings = [];
  if (!clause) return bindings;
  const text = clause.replace(/^type\s+/, '');
  const ns = text.match(/\*\s+as\s+(\w+)/);
  if (ns) bindings.push({ imported: '*', local: ns[1] });
  const def = text.match(/^\s*(\w+)\s*(,|$)/);
  if (def) bindings.push({ imported: 'default', local: def[1] });
  const named = text.match(/\{([^}]*)\}/);
  for (const part of named ? named[1].split(',') : []) {
    const m = part.trim().replace(/^type\s+/, '').match(/^(\w+)(?:\s+as\s+(\w+))?$/);
    if (m) bindings.push({ imported: m[1], local: m[2] ?? m[1] });
  }
  return bindings;
}

function pythonImports(node) {
  const out = [];
  if (node.type === 'import_statement') {
    for (const n of node.childrenForFieldName('name')) {
      if (n.type === 'aliased_import') out.push({ spec: n.childForFieldName('name').text, bindings: [{ imported: '*', local: n.childForFieldName('alias').text }], line: line(node) });
      else out.push({ spec: n.text, bindings: [{ imported: '*', local: n.text }], line: line(node) });
    }
    return out;
  }
  const spec = node.childForFieldName('module_name')?.text ?? '';
  const bindings = node.childrenForFieldName('name').map((n) => (n.type === 'aliased_import'
    ? { imported: n.childForFieldName('name').text, local: n.childForFieldName('alias').text }
    : { imported: n.text, local: n.text }));
  if (node.namedChildren.some((c) => c.type === 'wildcard_import')) bindings.push({ imported: '*all', local: '*' });
  out.push({ spec, bindings, line: line(node) });
  return out;
}

/**
 * Parses source text into { lang, package, defs, calls, imports, topLevelEntry }.
 * Each call is { name, qualifier, line, in, kind: 'call'|'ref', route? } where `in`
 * indexes into defs (-1 = top level). Throws only if the grammar fails to load.
 * @param {string} file repo-relative path; its extension picks the language
 * @param {string} source
 */
export async function extract(file, source) {
  const name = EXTENSIONS.get(path.extname(file));
  if (!name) return null;
  const spec = LANGUAGES[name];
  const { parser, defs: defQuery, calls: callQuery, imports: importQuery } = await language(name);
  const tree = parser.parse(source);
  const root = tree.rootNode;

  const defs = [];
  const defNodes = [];
  for (const m of defQuery.matches(root)) {
    const nameNode = m.captures.find((c) => c.name === 'name')?.node;
    const defCap = m.captures.find((c) => c.name.startsWith('def.'));
    if (!nameNode || !defCap) continue;
    const node = defCap.node;
    let kind = defCap.name.slice(4);
    let container = containerOf(node);
    if (spec.family === 'go' && node.type === 'type_spec') kind = node.childForFieldName('type')?.type === 'interface_type' ? 'interface' : 'type';
    if (spec.family === 'go' && node.type === 'method_declaration') {
      container = node.childForFieldName('receiver')?.text.match(/\*?\s*([A-Za-z_]\w*)(?:\[[^\]]*\])?\s*\)$/)?.[1] ?? null;
    }
    if (spec.family !== 'go' && kind === 'function' && container && CONTAINERS.has(node.parent?.type)) kind = 'method';
    if (spec.family === 'py' && kind === 'function' && container) kind = 'method';
    const def = { name: nameNode.text, kind, container, line: line(node), end: node.endPosition.row + 1, start: node.startIndex, stop: node.endIndex };
    const exportNode = [node.parent, node.parent?.parent].find((n) => n?.type === 'export_statement');
    def.exported = spec.family === 'go' ? /^[A-Z]/.test(def.name) : spec.family === 'py' ? !def.name.startsWith('_') : Boolean(exportNode);
    def.exportDefault = Boolean(exportNode && /^export\s+default\b/.test(exportNode.text));
    def.entry = entryOf(def, node, spec, file);
    def.test = isTestDef(def, spec, file);
    defs.push(def);
    defNodes.push(node);
  }

  const enclosing = (index) => {
    let best = -1;
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      if (d.start <= index && index < d.stop && (best === -1 || d.stop - d.start < defs[best].stop - defs[best].start)) best = i;
    }
    return best;
  };

  const calls = [];
  for (const m of callQuery.matches(root)) {
    const nameNode = m.captures.find((c) => c.name === 'name')?.node;
    const top = m.captures.find((c) => c.name === 'call' || c.name === 'ref');
    if (!nameNode || !top) continue;
    const qualifier = m.captures.find((c) => c.name === 'qualifier')?.node.text ?? null;
    const at = enclosing(top.node.startIndex);
    calls.push({ name: nameNode.text, qualifier, line: line(top.node), in: at, kind: top.name });
    if (top.name !== 'call') continue;
    const args = top.node.childForFieldName('arguments');
    const strings = stringArgs(args, spec);
    const route = strings.find((s) => ROUTE.test(s));
    const method = nameNode.text.toUpperCase();
    for (const ref of refArgs(args)) {
      calls.push({ ...ref, line: line(top.node), in: at, kind: 'ref', route: route ? `${HTTP_METHODS.has(method) && !/^[A-Z]+\s/.test(route) ? `${method} ` : ''}${route}` : undefined });
    }
  }

  let pkg = null;
  const imports = [];
  for (const m of importQuery.matches(root)) {
    const cap = (n) => m.captures.find((c) => c.name === n)?.node;
    if (cap('package')) {
      pkg = cap('package').text;
      continue;
    }
    if (cap('import_py') || cap('from_py')) {
      imports.push(...pythonImports(cap('import_py') ?? cap('from_py')));
      continue;
    }
    const pathNode = cap('path');
    if (!pathNode) continue;
    const specText = unquote(pathNode.text);
    if (spec.family === 'go') {
      const alias = cap('alias')?.text;
      imports.push({ spec: specText, bindings: [{ imported: '*', local: alias ?? specText.split('/').pop() }], line: line(pathNode) });
    } else if (cap('require')) {
      if (cap('fn')?.text !== 'require') continue;
      const binding = cap('binding').text;
      const bindings = binding.startsWith('{') ? parseImportClause(binding.replace(/:\s*/g, ' as ')) : [{ imported: '*', local: binding }];
      imports.push({ spec: specText, bindings, line: line(pathNode) });
    } else if (cap('reexport')) {
      const clause = cap('reexport').namedChildren.find((c) => c.type === 'export_clause')?.text;
      imports.push({ spec: specText, bindings: clause ? parseImportClause(clause) : [{ imported: '*all', local: '*' }], line: line(pathNode), reexport: true });
    } else {
      const clause = cap('import').namedChildren.find((c) => c.type === 'import_clause')?.text;
      imports.push({ spec: specText, bindings: parseImportClause(clause), line: line(pathNode) });
    }
  }

  const topLevelEntry = spec.family === 'py' && /^if\s+__name__\s*==\s*["']__main__["']/m.test(source) ? 'script' : null;
  tree.delete();
  for (const d of defs) {
    delete d.start;
    delete d.stop;
  }
  return { lang: name, family: spec.family, package: pkg, defs, calls, imports, topLevelEntry, test: spec.isTest(file) };
}
