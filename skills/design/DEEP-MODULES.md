# Deep Modules

From John Ousterhout's *A Philosophy of Software Design*.

> The principle is language-agnostic. Examples below use TypeScript for readability — translate naturally to Python (`requests`-style), Go (struct + methods), Rust (trait + impl), Kotlin / Java (interface + class), etc. The shape "small interface, deep implementation" matters; the syntax doesn't.

## The idea

A module's value is **functionality minus interface complexity**. Deep modules give you a lot of functionality behind a simple interface. Shallow modules give you little functionality and force the caller to deal with the complexity anyway.

## Shallow vs deep

```
SHALLOW (avoid)              DEEP (prefer)

┌───────────────────────┐    ┌──────────────┐
│  open, read, seek,    │    │   readFile   │
│  close, lock, unlock, │    └──────┬───────┘
│  flush, ...           │           │
├───────────────────────┤    ┌──────┴───────┐
│  thin pass-through    │    │ open, read,  │
└───────────────────────┘    │ close, retry,│
                             │ buffer, ...  │
                             └──────────────┘
```

The shallow version makes the *caller* manage file lifecycles. The deep version handles it internally and exposes one method.

## Concrete example

**Shallow** — caller does most of the work:

```ts
class HttpClient {
  buildUrl(base: string, path: string, params: object): string;
  buildHeaders(auth: string, contentType: string): object;
  serialize(body: any): string;
  parse(response: string): any;
  send(method: string, url: string, headers: object, body: string): Promise<string>;
}
```

The caller:

```ts
const url = client.buildUrl(BASE, "/users", { id: 123 });
const headers = client.buildHeaders(token, "application/json");
const body = client.serialize({ name: "Alice" });
const raw = await client.send("POST", url, headers, body);
const result = client.parse(raw);
```

**Deep** — interface hides the orchestration:

```ts
class HttpClient {
  request<T>(method: string, path: string, options?: RequestOptions): Promise<T>;
}
```

The caller:

```ts
const result = await client.request("POST", "/users", {
  query: { id: 123 },
  body: { name: "Alice" },
});
```

Same functionality. The deep version moved complexity from every caller into one place.

## Questions to ask when designing

- Can I merge two methods into one?
- Can a parameter become an internal detail?
- Does the caller need this option, or am I exposing it because it was easy?
- If I removed this method, what would break — and could the remaining methods cover it?

## Warning signs of shallow modules

- Methods that are one or two lines of pass-through.
- Callers who always call methods in the same sequence (that sequence belongs inside the module).
- Many methods with very similar names (`getUserById`, `getUserByEmail`, `getUserByName`) — consider one `getUser(query)`.
- Configuration options that no caller actually varies.
