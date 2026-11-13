import { describe, expect, it } from "vitest";
import {
  collectDuplicateUrls,
  createGroup,
  filterStashableTabs,
  isStashableUrl,
  normalizeImportedGroups,
  searchGroups,
} from "../types";

describe("tab stash", () => {
  it("filters browser pages and pinned tabs", () => {
    const tabs = [
      { id: 1, title: "Docs", url: "https://example.com", pinned: false },
      { id: 2, title: "Pinned", url: "https://pinned.example", pinned: true },
      { id: 3, title: "Settings", url: "chrome://settings", pinned: false },
    ];

    expect(filterStashableTabs(tabs, { schemaVersion: 1, includePinned: false })).toHaveLength(1);
    expect(filterStashableTabs(tabs, { schemaVersion: 1, includePinned: true })).toHaveLength(2);
    expect(isStashableUrl("about:blank")).toBe(false);
  });

  it("creates stable tab ids within a group", () => {
    const group = createGroup({
      label: "Research",
      tabs: [
        { title: "One", url: "https://one.example", pinned: false },
        { title: "Two", url: "https://two.example", pinned: false },
      ],
    });

    expect(group.label).toBe("Research");
    expect(group.tabs.map((tab) => tab.id)).toEqual([`${group.id}-0`, `${group.id}-1`]);
  });

  it("searches labels and tab metadata", () => {
    const group = createGroup({
      label: "Research",
      tabs: [{ title: "Rust docs", url: "https://rust.example", pinned: false }],
    });

    expect(searchGroups([group], "rust")).toHaveLength(1);
    expect(searchGroups([group], "research")).toHaveLength(1);
    expect(searchGroups([group], "missing")).toHaveLength(0);
  });

  it("detects duplicate urls and normalizes imports", () => {
    const group = createGroup({
      tabs: [{ title: "One", url: "https://one.example", pinned: false }],
    });

    expect(collectDuplicateUrls([group], ["https://one.example", "https://new.example"])).toEqual([
      "https://one.example",
    ]);
    expect(
      normalizeImportedGroups([
        {
          label: "Imported",
          tabs: [
            { url: "https://ok.example", title: "OK" },
            { url: "chrome://settings", title: "Bad" },
          ],
        },
      ]),
    ).toHaveLength(1);
  });
});
