# Handoff

## 当前状态

仓库已经完成 v0.1.0 的工程骨架和 5 个首批插件的第一版实现：

- `@hub/shared`：messaging / storage / 基础 UI。
- `_template`：可构建的新插件模板。
- `dark-mode-lite`：activeTab 动态注入 CSS。
- `tab-stash`：popup ↔ background 标签收纳。
- `volume-booster`：activeTab 注入 + Web Audio gain。
- `quick-translate`：activeTab 注入 + background 翻译请求。
- `focus-lock`：DNR 拦截 + options + blocked page。

`pnpm build`、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm validate:manifests` 已通过。

## 下一步

1. 用 Chrome / Firefox 分别加载产物做手工验收。
2. 验证 Quick Translate 的 Google endpoint 在真实网络环境可用。
3. 补齐真实插件图标、商店截图和 listing 文案。
4. 为 `@hub/shared` 增加单元测试。
5. 在 GitHub 配置 Chrome / Firefox 发布 secrets。
6. 首次发布建议只打 tag 生成 GitHub Release，再人工确认商店提交。

## 注意事项

- Firefox 构建已强制 `manifestVersion: 3`。
- runtime 注入型 content script 使用 `matches: []`，避免 WXT 自动生成 `<all_urls>` host permission。
- 所有插件图标当前是占位 PNG，上架前必须替换。
- `scripts/validate-manifests.ts` 需要手动加入新插件目录名。
