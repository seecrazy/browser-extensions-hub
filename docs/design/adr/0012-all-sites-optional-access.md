# ADR 0012: Optional all-sites access for Quick Translate

## Status

Superseded by [ADR 0013](./0013-revert-quick-translate.md)

## Context

Quick Translate supports one-tab and per-site access. Some users want it available everywhere without granting each origin separately. Browsers do not allow an extension to automatically open a permission prompt from a content script without a user gesture in an extension surface.

## Decision

Add an explicit **Enable on all sites** mode backed by optional host permissions:

```text
http://*/*
https://*/*
```

No permission is granted until the user clicks the control in the popup. Users can disable all-site access later, or disable Quick Translate on individual origins. The popup remains the consent surface; the plugin does not attempt automatic permission prompts.

## Consequences

- All-sites access is explicit and revocable.
- Individual origins can remain disabled even when all-site access is enabled.
- No default broad host permission is present at install time.
