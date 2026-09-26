# Vendored parsers

`code-graph.mjs` parses code with tree-sitter compiled to WebAssembly, so it needs only Node — no Go, Python, or TypeScript toolchain. These files are copied unmodified from npm.

| File | Package | Version | License |
| --- | --- | --- | --- |
| `web-tree-sitter.js`, `web-tree-sitter.wasm` | `web-tree-sitter` | 0.27.0 | MIT |
| `tree-sitter-go.wasm` | `tree-sitter-go` | 0.25.0 | MIT |
| `tree-sitter-javascript.wasm` | `tree-sitter-javascript` | 0.25.0 | MIT |
| `tree-sitter-typescript.wasm`, `tree-sitter-tsx.wasm` | `tree-sitter-typescript` | 0.23.2 | MIT |
| `tree-sitter-python.wasm` | `tree-sitter-python` | 0.25.0 | MIT |

## Update

```
npm install --ignore-scripts web-tree-sitter tree-sitter-go tree-sitter-javascript tree-sitter-typescript tree-sitter-python
cp node_modules/web-tree-sitter/web-tree-sitter.{js,wasm} <this dir>/
cp node_modules/tree-sitter-*/tree-sitter-*.wasm <this dir>/    # typescript ships two: typescript and tsx
node --test tests/code-graph.test.mjs
```

A grammar must use an ABI the runtime supports (`Language.abiVersion`); an unsupported one fails to load and the tests fail. A grammar update can rename node types; the tests catch it, and the fix goes in the queries in `../extract.mjs`.

## Add a language

1. Copy its `tree-sitter-<lang>.wasm` here and add a row above.
2. Add an entry to `LANGUAGES` in `../extract.mjs`: extensions, grammar file, and queries for definitions, calls, and imports.
3. Teach `makeResolver` in `../code-graph.mjs` how the language's imports map to files.
4. Add a fixture under `tests/fixtures/code-graph/` and a test.
