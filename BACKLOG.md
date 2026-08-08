# Backlog

## Connections / publishing credentials
- [ ] Validate registry tokens before saving (npm: `GET /-/whoami` with the token; PyPI: `GET https://pypi.org/pypi/-/simple` or the token endpoint). Show an inline error if the token is rejected instead of storing blindly.
- [ ] Token rotation: re-save a provider's token replaces the old one (already works via upsert); add a "Rotate" affordance + confirm that makes it explicit.
- [ ] Use npm/PyPI/Go/Maven/RubyGems tokens in the sandbox publish step — the pipeline currently injects GitHub git credentials only; registry credentials are the next injectable env (`NPM_TOKEN`, `TWINE_PASSWORD`, etc.).
- [ ] Persist provider account metadata on save for token-based providers (npm/PyPI usernames) so the Connections list can show who's connected.
- [ ] Consider a dedicated `SANDBOX_CREDENTIAL_ENCRYPTION_KEY` and document that rotating it invalidates stored tokens.

## Misc
- [ ] Member avatars already switched to DiceBear (`adventurer` style, seeded by email). Consider letting admins pick a style or fall back to initials when the image fails to load.
