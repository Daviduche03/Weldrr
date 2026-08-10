---
name: sdk-builder
description: Use when generating an SDK from an API spec. Guides the agent through scaffolding, implementing clients, and reporting completion to Weldrr via the report_sdk_complete tool.
---

# SDK Builder

You are generating a production-grade SDK from an API specification.

## Inputs
- **`docs.md` (read first):** if present, it is the curated API map from Weldrr discovery — every **public** endpoint, its request body, and responses. Orient yourself with it before writing code.
- **`spec.json` (source of truth):** the raw parsed spec. Consult it for exact schemas, enums, constraints, and auth details that `docs.md` may omit. Always cross-check against it before finalizing.
- If neither exists, locate the spec with `Glob`/`Grep` (commonly `spec.yaml`, `spec.json`, `openapi.yaml`, or the `spec` directory) before starting.
- The workspace is already scaffolded from a language template. Inspect the existing structure and conventions (package manager, linting, test runner, `.gitignore`) before writing code.

## Scope — public API surface only
- Build SDK methods **only** for the endpoints listed in `docs.md`.
- If `docs.md` contains an "Internal endpoints (excluded)" section, those endpoints are intentionally out of scope — do **not** generate SDK methods for them, even if you can see them in the codebase. The internal surface (dashboard routers, admin routes, internal-JWT/service endpoints, webhook receivers) is not part of the customer SDK.

## Steps
1. Read the spec and map out the endpoints, schemas, auth schemes, and SDK surface.
2. **Work entirely inside `/workspace`** — including any temporary/verify files. Do not write to `/tmp` or other paths outside the workspace; opencode will block it and the build will hang. Keep scratch files under `/workspace` and remove them before committing.
3. Review the template's conventions and dependencies; install any additional runtime dependencies you need.
3. Implement:
   - HTTP client wrapper / request handling consistent with the template.
   - Typed models for the spec's schemas.
   - Typed methods for every operation, with documented parameters and return types.
   - Error handling and authentication flows described by the spec.
4. Run the template's test suite (`npm test`, `pytest`, etc.) and make it pass. If no tests exist, add a smoke test that instantiates the client.
5. Ensure formatting/linting passes (`npm run lint`, etc.).

## Publish to a package registry
If a registry token is present, publish the package to the public registry so users can install it. The token is injected into the environment as described below.

- **npm (TypeScript/JavaScript):** a `.npmrc` with `//registry.npmjs.org/:_authToken=...` is already written in the workspace root. Before publishing:
  - Ensure `package.json` has `name`, `version` (set to `$WELDRR_ARTIFACT_VERSION`), `description`, a `repository`, a `files` list (or `main`/`types`/`exports` pointing at `dist`), and `types` pointing at the built declarations.
  - Build first (`npm run build`, `tsc`, etc.) so `dist/` exists.
  - Then `npm publish`. If the package name/version already exists on the registry, you may bump the version and retry once; otherwise note it in the summary.
- **PyPI (Python):** a `~/.pypirc` is already written with an API-token credential (`username = __token__`). Ensure `pyproject.toml` has a valid `name`, `version`, `description`, and `[build-system]`. Build the distribution, then upload:
  - `python -m build` (or `pip install build && python -m build`)
  - `twine upload dist/*`
- If no registry token is present, skip publishing and rely on the git push only.

## Completion
When the SDK is finished:

1. **Set the package version** to `$WELDRR_ARTIFACT_VERSION` (env, if set) in the manifest (e.g. `package.json` / `pyproject.toml`).
2. `git add -A` and commit your work with a clear message (e.g. `chore: generated TypeScript SDK v1.0.0`).
3. If a git remote `origin` is configured (it will be for GitHub-connected projects):
   - `git push -u origin HEAD` — credentials are pre-configured. If the push fails, retry once, then continue regardless and note it in the summary.
   - Create a **version tag**: `git tag "v$WELDRR_ARTIFACT_VERSION"` (if set) and `git push origin "v$WELDRR_ARTIFACT_VERSION"`.
4. **Publish** the package to npm/PyPI as described above (if a token is present). Note the published package name and version in the summary.
5. **MUST** call the `report_sdk_complete` tool with:
   - `status`: `"finished"` (or `"failed"` if you hit an unrecoverable blocker)
   - `summary`: a one-line description of what was built (include the version, e.g. `TypeScript SDK v1.0.0 for PayGrid`, and the published npm/PyPI package name if published)
   - `artifactUrl`: the origin remote URL (e.g. `https://github.com/{owner}/{repo}`) if the push succeeded

Only call `report_sdk_complete` when you are genuinely done — do not call it after every step.
