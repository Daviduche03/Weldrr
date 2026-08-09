---
name: docs-builder
description: Use when generating documentation for an API. Guides the agent through producing reference docs and reporting completion to Weldrr via the report_sdk_complete tool.
---

# Docs Builder

You are generating comprehensive API documentation from an API specification.

## Inputs
- **`docs.md` (read first):** if present, it is the curated API map from Weldrr discovery — every endpoint, its request body, and responses. Use it as the outline for the reference docs.
- **`sdk.md` (if present):** describes the SDKs Weldrr generated for this API — languages, install/import commands, and repo URLs. Use it to write the SDK documentation pages.
- **`spec.json` (source of truth):** the raw parsed spec. Consult it for exact schemas, enums, constraints, and auth details that `docs.md` may omit. Always cross-check against it.
- If neither exists, locate the spec with `Glob`/`Grep` (commonly `spec.yaml`, `spec.json`, `openapi.yaml`, or the `spec` directory) before starting.
- The workspace is already scaffolded from a documentation template (e.g. a static site or docs framework). Inspect its structure and conventions first.

## Steps
1. Read the spec and map out every endpoint, schema, and authentication scheme.
2. Review the template's structure (navigation, page layout, code examples).
3. **Work entirely inside `/workspace`** — including any temporary/verify files. Do not write to `/tmp` or other paths outside the workspace; opencode will block it and the build will hang. Use `/workspace` (e.g. `/workspace/verify.mjs`) for scratch files and delete them before committing.
4. Produce docs covering:
   - Getting started / quickstart with real request examples.
   - Authentication guide matching the spec's auth schemes.
   - A reference page for every endpoint: params, request bodies, response shapes, errors.
   - Schema/type reference generated from the spec definitions.
4. **Write the SDK docs** — the API has generated SDKs (see `sdk.md`), and users need to know how to use them. Create a page per language under `src/docs/` (e.g. `sdk-typescript.mdx`, `sdk-python.mdx`) and link them from the nav/index. Each SDK page must include:
   - **Installation** — the exact install/import command for the package (from `sdk.md`).
   - **Quickstart** — instantiate the client with the base URL + auth, then make one real call.
   - **Client setup** — how to configure auth (API key / bearer), base URL, and any timeouts/retries.
   - **Usage examples** — for the main resources from `docs.md`, show typed method calls (e.g. `client.customers.list()`, `client.invoices.create({...})`).
   - If an SDK repo is published, link to it.
5. **Write the playground data** to `src/data/endpoints.json` (the API Playground page reads it). Shape:
   ```json
   {
     "baseUrl": "https://api.example.com",
     "proxyUrl": "https://hot-wasp.outray.app/api/proxy",
     "endpoints": [
       {
         "method": "GET",
         "path": "/api/v1/customers",
         "summary": "List customers",
         "operationId": "listCustomers",
         "params": [{ "name": "pageSize", "in": "query", "type": "number", "required": false }],
         "requestBody": { "contentType": "application/json", "schema": "{ name }" },
         "responses": [{ "status": "200", "schema": "Customer[]" }],
         "auth": "customers.read"
       }
     ]
   }
   ```
   - Include every **public** endpoint (same scope as the docs — exclude the internal endpoints).
   - `params.in` is `"path"` (path segments like `:id`) or `"query"`. Use `null` for `requestBody` when there is none.
   - `proxyUrl` is optional: a server-side relay the playground falls back to when the browser blocks a direct request (CORS). Point it at the project's Weldrr proxy (the `PUBLIC_URL`/`appUrl` of Weldrr's backend + `/api/proxy`). Omit it if unsure.
6. Verify the docs build with the template's build command.
7. Ensure all example snippets are accurate against the spec.

## Completion
When the documentation site is finished:

1. `git add -A` and commit your work with a clear message (e.g. `docs: generated API docs v1.0.0`).
2. If a git remote `origin` is configured (it will be for GitHub-connected projects):
   - `git push -u origin HEAD` — credentials are pre-configured. If the push fails, retry once, then continue regardless and note it in the summary.
   - Create a **version tag**: `git tag "v$WELDRR_ARTIFACT_VERSION"` (if set) and `git push origin "v$WELDRR_ARTIFACT_VERSION"`.
3. **MUST** call the `report_sdk_complete` tool with:
   - `status`: `"finished"` (or `"failed"` if you hit an unrecoverable blocker)
   - `summary`: a one-line description of what was generated (include the version, e.g. `API docs v1.0.0`)
   - `artifactUrl`: the origin remote URL (e.g. `https://github.com/{owner}/{repo}`) if the push succeeded

Only call `report_sdk_complete` when you are genuinely done — do not call it after every step.
