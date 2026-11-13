# Browser Extensions Hub

一个基于 `pnpm workspaces + WXT + TypeScript` 的浏览器插件 Monorepo，面向 Manifest V3。当前仓库包含 1 个模板和 5 个首批插件，每个插件都可以独立构建、独立验收和独立发版。

## 核心原则

- **MV3 优先**：所有插件强制 Manifest V3。
- **权限最小化**：不默认申请 broad host permissions；页面级能力优先通过 `activeTab + scripting` 动态注入。
- **插件独立**：插件之间互不依赖；共享能力只进入 `@hub/shared`。
- **产物为准**：manifest 校验检查 WXT 构建后的真实产物，而不是源码声明。
- **本地优先**：没有账号、云同步和遥测。

## 产品状态

当前为 **v0.1.0 开发骨架**。

| 插件            | 目录                         | 核心入口                                  | 核心能力                         |
| --------------- | ---------------------------- | ----------------------------------------- | -------------------------------- |
| Template        | `extensions/_template`       | popup, background                         | 新插件模板                       |
| Dark Mode Lite  | `extensions/dark-mode-lite`  | popup, runtime content script             | 当前 tab CSS 暗色模式和强度调节  |
| Tab Stash       | `extensions/tab-stash`       | popup, background, options                | 标签页收纳、单项恢复、整组恢复   |
| Volume Booster  | `extensions/volume-booster`  | popup, runtime content script             | 当前 tab 媒体音量增强，最高 300% |
| Quick Translate | `extensions/quick-translate` | popup, background, runtime content script | 划词翻译气泡                     |
| Focus Lock      | `extensions/focus-lock`      | background, options, blocked page         | 本地黑名单、密码/冷却解锁        |

### 权限矩阵

| 插件            | permissions                                  | host permissions                     |
| --------------- | -------------------------------------------- | ------------------------------------ |
| Dark Mode Lite  | `activeTab`, `scripting`, `storage`          | 无                                   |
| Tab Stash       | `tabs`, `storage`                            | 无                                   |
| Volume Booster  | `activeTab`, `scripting`, `storage`          | 无                                   |
| Quick Translate | `activeTab`, `scripting`, `storage`          | `https://translate.googleapis.com/*` |
| Focus Lock      | `declarativeNetRequest`, `storage`, `alarms` | 无                                   |

尚未完成：真实浏览器手工验收、商店 listing 文案、截图、隐私政策页面、正式图标和真实商店提交。

## 快速开始

要求：

- Node.js `22.12.0`
- pnpm `9.15.9`

推荐使用 Corepack：

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm build
```

开发单个插件：

```bash
pnpm dev:dark-mode-lite
pnpm dev:tab-stash
pnpm dev:volume-booster
pnpm dev:quick-translate
pnpm dev:focus-lock
```

## 构建与验证

`pnpm build` 会同时构建 Chrome MV3 和 Firefox MV3：

```bash
pnpm build
```

也可以只构建一个目标：

```bash
pnpm build:chrome
pnpm build:firefox
```

提交前建议完整执行：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm validate:manifests
```

`pnpm validate:manifests` 会检查 `.output` 中生成的真实 manifest，包括：

- `manifest_version` 必须是 3；
- Firefox 必须有 `browser_specific_settings.gecko.id`；
- Chrome 的 background 如存在，必须使用 service worker；
- 禁止默认使用 broad host permissions；
- 禁止未批准的高风险 permissions；
- 禁止注册 `<all_urls>` content script。

发布 tag 可以单独校验：

```bash
pnpm validate:release-tag dark-mode-lite@0.1.0
```

## 本地加载

### Chrome / Edge / Brave

1. 打开 `chrome://extensions`。
2. 打开 Developer mode。
3. 选择 **Load unpacked**。
4. 加载对应插件的 `extensions/<plugin>/.output/chrome-mv3`。

### Firefox

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 选择 **Load Temporary Add-on**。
3. 选择对应插件的 `extensions/<plugin>/.output/firefox-mv3/manifest.json`。

临时加载在浏览器重启后失效；正式验证应走 AMO 签名或 unlisted/self-distributed 流程。

## 构建产物

```text
extensions/<plugin>/.output/chrome-mv3/
extensions/<plugin>/.output/firefox-mv3/
```

当前 `public/icon/*.png` 是占位图标，上架前必须替换成真实尺寸和视觉质量的图标。

## 插件实现说明

### Dark Mode Lite

- 只在用户从 popup 激活后注入当前 tab。
- 使用 CSS `filter: invert(1) hue-rotate(180deg)`，并对图片、视频、canvas、SVG、iframe 做反向补偿。
- 强度通过 CSS variable 控制。
- 受限页面或无 tab id 时会在 popup 显示错误。

### Tab Stash

- popup 发送消息给 background。
- background 先读取当前窗口 tabs，过滤浏览器内置页面，再写入 `chrome.storage.local`。
- 只有 storage 写入成功后才关闭 tabs，避免数据丢失。
- 支持单项恢复、整组恢复和删除收纳组。

### Volume Booster

- 标准媒体 `volume` 范围是 `0-1`；超过 100% 使用 Web Audio `GainNode`。
- 对没有 CORS 的跨域媒体不会创建 Web Audio graph，避免音频静音；该元素只能调节到 100%。
- `AudioContext` 可能因自动播放策略 suspended，插件会在页面交互时尝试 resume。

### Quick Translate

- 用户先在 popup 中点击 **Enable on this tab**，插件才注入当前 tab。
- content script 使用 Shadow DOM 渲染气泡，避免污染页面样式。
- 翻译请求由 background 发起，避免 content script 直接处理 CORS。
- 当前使用 Google Translate 公共 endpoint；文本上限 1000 字符。

### Focus Lock

- 使用 `declarativeNetRequest` 动态规则把黑名单 main frame 请求 redirect 到 `/blocked.html`。
- 黑名单保存在 `chrome.storage.local`。
- 解锁支持两种模式：
  - 未设置密码时，等待 60 秒冷却；
  - 已设置密码时，输入密码解锁 5 分钟。
- 密码使用 PBKDF2 / SHA-256 处理，只保存 hash 和 salt；连续失败会进入 5 分钟 lockout。

## 架构

- 包管理：pnpm workspaces。
- 扩展构建：WXT。
- 构建编排：`pnpm -r`；Turborepo 保留为后续可选方案。
- UI：vanilla TypeScript + CSS，不引入 React / Vue。
- MV3：所有插件强制 Manifest V3。
- 权限：默认禁止 broad host permissions；页面级能力优先使用 `activeTab + scripting` 动态注入。

共享包：

```text
packages/shared/src/
├── messaging.ts
├── storage.ts
└── ui/
```

插件通过 `"@hub/shared": "workspace:*"` 引用。WXT 构建时会把 shared 源码打进最终产物，扩展 zip / xpi 不依赖 npm registry。

### 目录概览

```text
browser-extensions-hub/
├── extensions/
│   ├── _template/
│   ├── dark-mode-lite/
│   ├── tab-stash/
│   ├── volume-booster/
│   ├── quick-translate/
│   └── focus-lock/
├── packages/
│   ├── shared/
│   ├── eslint-config/
│   └── tsconfig/
├── scripts/
│   ├── validate-manifests.ts
│   └── validate-release-tag.ts
├── docs/
│   ├── design/
│   └── roadmap.md
└── .github/workflows/
    ├── ci.yml
    └── release.yml
```

## 新增插件

```bash
cp -R extensions/_template extensions/my-plugin
```

然后：

1. 修改 `extensions/my-plugin/package.json` 的 `name` 为 `@hub/my-plugin`。
2. 修改 `wxt.config.ts` 的名称、描述、权限和 Firefox gecko id。
3. 在 `scripts/validate-manifests.ts` 的插件清单中加入 `my-plugin`。
4. 运行 `pnpm install`。
5. 使用 `pnpm --filter @hub/my-plugin dev` 开发。
6. 提交 PR 前，确保 `pnpm build`、`pnpm typecheck`、`pnpm lint`、`pnpm test` 和 `pnpm validate:manifests` 通过。

## 发布

发布 tag 格式：

```text
<plugin-name>@<version>
```

示例：

```bash
git tag dark-mode-lite@0.1.0
git push origin dark-mode-lite@0.1.0
```

也可以先本地校验：

```bash
pnpm validate:release-tag dark-mode-lite@0.1.0
```

Release workflow 会：

1. 校验 tag、目录、package name 和 `package.json.version`；
2. 构建 Chrome MV3 和 Firefox MV3；
3. 打 zip / xpi artifact；
4. 配置了 secret 时上传 Chrome draft 或签名 Firefox；
5. 创建 GitHub Release。

### 发布 secrets

Chrome：

```text
CHROME_CLIENT_ID
CHROME_CLIENT_SECRET
CHROME_REFRESH_TOKEN
DARK_MODE_LITE_CHROME_EXTENSION_ID
TAB_STASH_CHROME_EXTENSION_ID
VOLUME_BOOSTER_CHROME_EXTENSION_ID
QUICK_TRANSLATE_CHROME_EXTENSION_ID
FOCUS_LOCK_CHROME_EXTENSION_ID
```

Firefox：

```text
AMO_JWT_ISSUER
AMO_JWT_SECRET
```

缺少插件对应的 Chrome extension id 或 Firefox AMO secret 时，对应 publish job 会跳过，不影响 GitHub Release artifact。

### 上架前仍需完成

- 替换占位图标；
- 生成商店截图；
- 编写 Chrome Web Store 和 AMO listing；
- 准备隐私政策页面；
- 对 Firefox 构建确认是否需要 source archive；
- 在真实浏览器中完成手工验收。

## 文档

- 设计文档：[`docs/design/browser-extensions-hub.md`](docs/design/browser-extensions-hub.md)
- 架构决策：[`docs/design/adr`](docs/design/adr)
- Roadmap：[`docs/roadmap.md`](docs/roadmap.md)
- 交接说明：[`HANDOFF.md`](HANDOFF.md)

## 安全与隐私

- 不上传用户浏览数据。
- 不做账号系统。
- Focus Lock 的密码只保存 PBKDF2 hash 和 salt。
- Quick Translate 只会向 `https://translate.googleapis.com/*` 发送用户选中的文本。
- Dark Mode Lite、Volume Booster、Quick Translate 使用 `activeTab` 动态注入，不默认申请 `<all_urls>`。
