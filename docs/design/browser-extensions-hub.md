# Browser Extensions Hub 设计文档

## 1. 目标与非目标

### 目标

- 提供 `pnpm workspaces + WXT + TypeScript` 的多插件 Monorepo。
- 所有插件强制 Manifest V3，构建产物自包含。
- 插件独立开发、独立构建、独立发版。
- 共享包只沉淀跨插件通用能力，不绑定具体插件业务。
- CI 基于 WXT 生成后的真实 manifest 做合规检查。
- tag 驱动发布，tag 格式为 `<plugin-name>@<version>`。
- Chrome 与 Firefox 发布流程隔离，产物与失败原因互不影响。

### 非目标

- 不做通用浏览器插件运行时框架。
- 不做跨插件运行时通信或跨插件账号系统。
- 不在 v0 实现远程配置、账号、云同步、遥测。
- 不追求复刻 Dark Reader、OneTab、沉浸式翻译、BlockSite 的完整能力。
- `@hub/shared` 不强行提供 React / Vue 组件层；首批 UI 全部使用 vanilla TS + CSS。

## 2. 总体架构

```text
browser-extensions-hub/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── eslint.config.js
├── tsconfig.base.json
├── docs/
│   ├── adr/
│   ├── design/
│   └── roadmap.md
├── packages/
│   ├── shared/
│   ├── eslint-config/
│   └── tsconfig/
├── extensions/
│   ├── _template/
│   ├── dark-mode-lite/
│   ├── tab-stash/
│   ├── volume-booster/
│   ├── quick-translate/
│   └── focus-lock/
├── scripts/
│   ├── validate-manifests.ts
│   └── validate-release-tag.ts
└── .github/workflows/
    ├── ci.yml
    └── release.yml
```

### 技术选型

| 层       | 选择             | 原因                                                  |
| -------- | ---------------- | ----------------------------------------------------- |
| 包管理   | pnpm             | workspace 协议、硬链接、monorepo 依赖隔离             |
| 构建     | WXT              | 约定式入口生成 MV3 manifest，支持 Chrome / Firefox    |
| 语言     | TypeScript       | 类型化消息、类型化 storage、降低跨入口回归            |
| 构建编排 | pnpm -r          | v0 全量构建；Turborepo 作为规模变大后的可选方案       |
| UI       | vanilla TS + CSS | 首批插件规模小，避免引入框架和运行时体积              |
| 校验     | 自研脚本         | 校验 WXT 产物 manifest、tag 与 package version 一致性 |

版本约束：

- Node：`22.12.0`
- pnpm：`9.15.9`
- WXT：`0.20.0`
- TypeScript：`5.6.3`

这些版本在根目录、CI 和扩展 package 中保持一致。升级 WXT 属于破坏性变更，必须先跑全部扩展构建。

## 3. 工作区与依赖

### pnpm workspace

```yaml
packages:
  - "packages/*"
  - "extensions/*"
```

### package 命名

| 位置                         | package name           | 发布 tag                |
| ---------------------------- | ---------------------- | ----------------------- |
| `extensions/dark-mode-lite`  | `@hub/dark-mode-lite`  | `dark-mode-lite@0.1.0`  |
| `extensions/tab-stash`       | `@hub/tab-stash`       | `tab-stash@0.1.0`       |
| `extensions/volume-booster`  | `@hub/volume-booster`  | `volume-booster@0.1.0`  |
| `extensions/quick-translate` | `@hub/quick-translate` | `quick-translate@0.1.0` |
| `extensions/focus-lock`      | `@hub/focus-lock`      | `focus-lock@0.1.0`      |

tag 中的插件名等于目录名，不包含 `@hub/` scope。

### `workspace:*` 语义

`@hub/shared` 通过 `workspace:*` 被插件引用。WXT 在构建时把 shared 源码 bundle 进扩展产物，最终 zip / xpi 不依赖外部 registry。`workspace:*` 是本地依赖协议，不是插件商店发布机制。

## 4. `@hub/shared`

`@hub/shared` 只包含与具体插件业务无关的通用能力。

### 模块边界

| 模块        | 职责                                   | 不做的事                           |
| ----------- | -------------------------------------- | ---------------------------------- |
| `messaging` | 封装 runtime message 协议、错误结构    | 不做跨插件通信，不做加密           |
| `storage`   | 封装 namespace、默认值、局部更新、订阅 | 不做远程同步，不存储敏感明文       |
| `ui`        | 提供最小 vanilla CSS 和基础 UI 工具    | 不依赖 React / Vue，不提供复杂组件 |

### messaging 协议

所有跨入口消息必须是 discriminated union：

```ts
type Message =
  | { type: "DARK_MODE_GET_STATE" }
  | { type: "DARK_MODE_APPLY"; payload: DarkModeState };
```

禁止以下松散格式：

```ts
// 禁止
{ type: string, [key: string]: unknown }
```

shared messaging 提供统一响应：

```ts
type MessageResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

错误码约定：

| code                  | 场景               |
| --------------------- | ------------------ |
| `UNSUPPORTED_MESSAGE` | 收到未注册 message |
| `INVALID_PAYLOAD`     | payload 不符合约定 |
| `HANDLER_ERROR`       | handler 抛出异常   |
| `TAB_NOT_INJECTABLE`  | 当前 tab 不能注入  |
| `MEDIA_NOT_SUPPORTED` | 媒体元素无法增强   |
| `TRANSLATION_FAILED`  | 翻译请求失败       |
| `FOCUS_LOCK_LOCKED`   | 解锁失败           |

### storage

storage 统一使用 namespace，避免多插件或多个 feature 互相覆盖。

```ts
const storage = createNamespacedStorage<DarkModeSettings>("dark-mode-lite.settings", {
  enabled: false,
  strength: 70,
});
```

规则：

- 用户偏好默认 `chrome.storage.local`。
- 不在 v0 使用 `chrome.storage.sync`，避免 quota 与多端冲突。
- 每个 namespace 记录 `schemaVersion`。
- 升级 schema 必须写迁移函数，不允许直接读取旧字段后不迁移。
- 密码、token 等敏感数据不进入日志。

### ui

首批 UI 采用扩展页面自己的 HTML + TypeScript。shared UI 只提供：

- 统一 CSS token；
- 按钮、输入框、卡片、行布局样式；
- 少量 DOM helper。

不提供框架组件，避免 popup / options 体积膨胀。

## 5. WXT 入口约定

| 文件路径                         | Manifest 映射                        |
| -------------------------------- | ------------------------------------ |
| `entrypoints/background.ts`      | `background.service_worker`          |
| `entrypoints/popup/index.html`   | `action.default_popup`               |
| `entrypoints/options/index.html` | `options_ui`                         |
| `entrypoints/blocked/index.html` | 独立扩展页面 `/blocked.html`         |
| `entrypoints/<name>.content.ts`  | content script 或 runtime 可注入脚本 |

需要用户显式激活的插件不默认申请 `<all_urls>`。`dark-mode-lite`、`volume-booster`、`quick-translate` 的 content script 使用 runtime 注入，由 popup 在当前 tab 上通过 `activeTab + scripting` 注入。

每个插件 package 必须有：

```json
{
  "scripts": {
    "prepare": "wxt prepare",
    "dev": "wxt",
    "build": "wxt build",
    "build:chrome": "wxt build -b chrome",
    "build:firefox": "wxt build -b firefox",
    "typecheck": "tsc --noEmit"
  }
}
```

## 6. 权限策略

### 白名单

允许按需使用：

- `storage`
- `activeTab`
- `scripting`
- `tabs`
- `alarms`
- `declarativeNetRequest`
- `declarativeNetRequestWithHostAccess`

### 禁止默认申请

除非有明确验收理由并通过 PR review：

- `<all_urls>`
- `webRequestBlocking`
- `cookies`
- `history`
- `bookmarks`
- `downloads`
- `debugger`
- `management`
- `nativeMessaging`

### host permissions

`quick-translate` 只允许翻译服务 host permission：

```text
https://translate.googleapis.com/*
```

不得申请 `<all_urls>` 或任意可翻译站点 host permission。

## 7. 插件设计

### 7.1 Dark Mode Lite

#### 定位

轻量暗色模式，用户点击 popup 后对当前 tab 生效，不申请 broad host permissions。

#### 权限

```text
activeTab
scripting
storage
```

#### 状态

```ts
type DarkModeSettings = {
  schemaVersion: 1;
  enabled: boolean;
  strength: number; // 0 - 100
};
```

#### 用户流程

1. 用户打开 popup。
2. popup 注入当前 tab 的 content script。
3. popup 读取当前状态。
4. 用户切换开关或调整强度。
5. content script 立即应用 CSS filter。
6. 状态保存在 `chrome.storage.local`。

#### 技术方案

- content script 在 `documentElement` 上注入 `<style>`。
- 使用 `filter: invert(1) hue-rotate(180deg)`。
- 对 `img`、`video`、`canvas` 做反向补偿。
- 通过 CSS variable 控制强度。
- 关闭时移除样式，不修改页面原始 DOM。

#### 边界

| 场景                             | 行为                     |
| -------------------------------- | ------------------------ |
| Chrome Web Store / Chrome 设置页 | 禁用注入                 |
| 受限 URL                         | 显示不支持提示           |
| 页面已刷新                       | popup 重新打开后重新注入 |
| iframe                           | 只处理主 frame           |

### 7.2 Tab Stash

#### 定位

一键收纳当前窗口标签页，后续单项或整组恢复。

#### 权限

```text
tabs
storage
```

#### 状态

```ts
type StashedTab = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  pinned: boolean;
};

type StashGroup = {
  schemaVersion: 1;
  id: string;
  createdAt: number;
  tabs: StashedTab[];
};

type TabStashSettings = {
  schemaVersion: 1;
  includePinned: boolean;
};
```

#### 用户流程

1. popup 点击“收纳全部”。
2. popup 发送 `TAB_STASH_STASH_WINDOW`。
3. background 读取当前窗口 tabs。
4. 根据 `includePinned` 过滤 pinned tabs。
5. 写入 `chrome.storage.local`。
6. 关闭对应 tabs。
7. popup 渲染收纳组。
8. 用户点击单项恢复，或整组恢复。

#### 边界

| 场景                      | 行为                |
| ------------------------- | ------------------- |
| 当前窗口只有插件 popup 页 | 提示没有可收纳 tabs |
| Chrome 内置页             | 不收纳              |
| 恢复 URL 被浏览器拦截     | 保留 stash 记录     |
| storage 写入失败          | 不关闭 tabs         |

### 7.3 Volume Booster

#### 定位

为当前 tab 的媒体元素提供最高 300% 音量增强。

#### 权限

```text
activeTab
scripting
storage
```

#### 状态

```ts
type VolumeSettings = {
  schemaVersion: 1;
  level: number; // 0 - 300，表示百分比
};
```

#### 技术方案

`HTMLMediaElement.volume` 标准范围是 `0 - 1`。超过 100% 必须使用 Web Audio：

```text
MediaElementAudioSourceNode -> GainNode -> destination
```

规则：

- popup 注入 content script。
- popup 通过 `VOLUME_GET` 查询媒体状态。
- popup 调整音量时发送 `VOLUME_SET`。
- 同一元素只创建一次 `MediaElementAudioSourceNode`。
- `AudioContext` suspended 时尝试 resume。
- 用户未与页面交互时，可能无法立即生效，popup 显示提示。

#### 边界

| 场景                  | 行为                                              |
| --------------------- | ------------------------------------------------- |
| 页面没有媒体元素      | 显示未找到媒体                                    |
| 跨域媒体且未开启 CORS | 不创建 Web Audio graph，避免静音；只允许 0 - 100% |
| 多个媒体元素          | 统一设置同一 gain                                 |
| iframe 内媒体         | 不处理，只处理主 frame                            |

### 7.4 Quick Translate

#### 定位

用户先在 popup 激活当前 tab，然后划词即译，不做整页翻译。

#### 权限

```text
activeTab
scripting
storage
```

host permissions：

```text
https://translate.googleapis.com/*
```

#### 状态

```ts
type TranslateSettings = {
  schemaVersion: 1;
  targetLanguage: string;
};
```

#### 用户流程

1. 用户打开 popup。
2. popup 点击“在本页启用划词翻译”。
3. popup 注入 content script。
4. 用户选中文字。
5. content script 显示气泡。
6. 气泡请求 background 翻译。
7. background 请求翻译服务并回传结果。
8. content script 渲染译文。

#### 技术方案

- content script 用 `mouseup` / `selectionchange` 识别选区。
- 气泡挂在 Shadow DOM，避免污染页面样式。
- 译文只用 `textContent` 渲染，不使用 innerHTML。
- background 统一调用翻译 API。
- 默认服务为 Google Translate 公共 endpoint。
- 最大请求文本长度为 1000 字符。

#### 边界

| 场景                    | 行为                             |
| ----------------------- | -------------------------------- |
| 选区为空                | 不显示气泡                       |
| 选区在 input / textarea | 不显示气泡                       |
| 文本超过 1000 字符      | 截断并提示                       |
| 翻译失败                | 气泡显示失败                     |
| 请求失败或限流          | 不重试复杂逻辑，提示用户稍后再试 |

### 7.5 Focus Lock

#### 定位

阻止黑名单站点，解锁需要密码或冷却时间。

#### 权限

```text
declarativeNetRequest
storage
```

#### 状态

```ts
type FocusLockSettings = {
  schemaVersion: 1;
  domains: string[];
  passwordHash?: string;
  passwordSalt?: string;
  unlockUntil?: number;
  failedAttempts?: number;
  lockoutUntil?: number;
};
```

#### 用户流程

1. 用户在 options 添加域名。
2. options 校验域名格式。
3. background 同步 dynamic DNR rule。
4. 用户访问黑名单域名。
5. DNR 将 main frame redirect 到 `/blocked.html`。
6. blocked page 显示提示和解锁表单。
7. 未设置密码时，只能等待 60 秒冷却。
8. 已设置密码时，输入密码可解锁 5 分钟。

#### DNR 设计

使用单条 dynamic rule，降低规则数量：

```ts
{
  id: 1,
  priority: 1,
  action: {
    type: "redirect",
    redirect: { extensionPath: "/blocked.html" }
  },
  condition: {
    requestDomains: domains,
    resourceTypes: ["main_frame"]
  }
}
```

更新策略：

- domains 变化时删除旧 rule，再写入新 rule。
- 空列表只删除 rule，不添加 rule。
- `browser.storage.onChanged` 触发同步。
- `onStartup` / `onInstalled` 重新同步。

#### 密码安全

- 密码不落盘。
- 使用 PBKDF2 + random salt。
- 默认迭代次数 `100000`。
- 只保存 hash 和 salt。
- 连续失败 5 次锁定 5 分钟。
- 不提供找回密码。

#### 边界

| 场景                   | 行为                                        |
| ---------------------- | ------------------------------------------- |
| domain 非法            | options 提示错误，不写入                    |
| user-entered subdomain | `requestDomains` 会覆盖子域名               |
| 解锁成功               | background 写入 `unlockUntil`，5 分钟后过期 |
| DNR 权限异常           | 不写入 storage，避免状态与规则不一致        |

## 8. 数据与状态模型

所有插件 storage key 都使用 namespace。

| 插件            | key                        | area  |
| --------------- | -------------------------- | ----- |
| dark-mode-lite  | `dark-mode-lite.settings`  | local |
| tab-stash       | `tab-stash.groups`         | local |
| tab-stash       | `tab-stash.settings`       | local |
| volume-booster  | `volume-booster.settings`  | local |
| quick-translate | `quick-translate.settings` | local |
| focus-lock      | `focus-lock.settings`      | local |

### 错误处理

- 所有 handler 必须返回 `MessageResponse`。
- 所有 async 操作捕获错误，不向页面抛出未处理 rejection。
- UI 状态显示错误，不只 console.error。
- storage 写入失败必须阻止后续破坏性动作，例如 Tab Stash 不能先关闭 tabs。

## 9. MV3 Service Worker 约束

- 事件监听器必须在 background 顶层同步注册。
- 不依赖 service worker 常驻内存。
- 定时逻辑使用 `chrome.alarms`，不使用 `setTimeout`。
- 长状态进入 `chrome.storage`。
- handler 收到消息后重新读取必要状态。

## 10. 构建与校验

### 本地命令

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm validate:manifests
```

### 单插件开发

```bash
pnpm --filter @hub/dark-mode-lite dev
```

### 构建产物

```text
extensions/<plugin>/dist/chrome-mv3/
extensions/<plugin>/dist/firefox-mv3/
```

## 11. CI

PR CI 执行：

1. `pnpm install`
2. `pnpm build`
3. `pnpm typecheck`
4. `pnpm lint`
5. `pnpm test`
6. `pnpm validate:manifests`

`_template` 永远参与构建。v0 使用 `pnpm -r` 全量构建；插件数量增加后再评估 Turborepo 按依赖图过滤和缓存。

## 12. Release

### tag 规范

```text
<plugin-name>@<semver>
```

示例：

```text
dark-mode-lite@0.1.0
focus-lock@0.1.2
```

### release 校验

release workflow 第一步运行：

```bash
pnpm validate:release-tag "$GITHUB_REF_NAME"
```

检查：

1. tag 符合格式；
2. 插件目录存在；
3. `@hub/<plugin>` 存在；
4. tag version 等于 `package.json.version`。

### release job

```text
validate -> build-chrome / build-firefox -> publish-chrome / publish-firefox -> github-release
```

Chrome 与 Firefox 发布互相隔离。缺少 secret 时跳过对应 publish，不影响 artifact 上传。

### Chrome

所需 secrets：

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

第一阶段默认 upload draft，不自动 publish。

### Firefox

所需 secrets：

```text
AMO_JWT_ISSUER
AMO_JWT_SECRET
```

Firefox manifest 必须包含 `browser_specific_settings.gecko.id`。

## 13. 新插件工作流

1. 复制 `extensions/_template` 到 `extensions/<plugin>`。
2. 修改 `package.json` 的 `name` 和 version。
3. 修改 `wxt.config.ts` 名称、权限、Firefox gecko id。
4. 实现入口和状态模型。
5. 在 `scripts/validate-manifests.ts` 的插件清单中加入新插件。
6. 提交 PR。
7. 发布时打 `<plugin>@<version>` tag。

## 14. 验收清单

### 架构

- [ ] `pnpm install` 成功。
- [ ] 全部插件可以构建 Chrome MV3。
- [ ] 全部插件可以构建 Firefox MV3。
- [ ] `@hub/shared` 通过 workspace 协议被插件使用。
- [ ] WXT 产物 manifest 均为 `manifest_version: 3`。

### 插件

- [ ] Dark Mode Lite 只在当前 tab 生效。
- [ ] Tab Stash storage 写入失败时不会关闭 tabs。
- [ ] Volume Booster 支持 0 - 300%。
- [ ] Volume Booster 对非 CORS 跨域媒体不产生静音回归。
- [ ] Quick Translate 不申请 broad host permissions。
- [ ] Quick Translate 气泡使用 Shadow DOM。
- [ ] Focus Lock 使用 DNR 拦截黑名单域名。
- [ ] Focus Lock 密码只保存 hash 和 salt。

### 发布

- [ ] tag 与 package version 不一致时 release 失败。
- [ ] Chrome zip 文件名包含插件名和版本。
- [ ] Firefox xpi 文件名包含插件名和版本。
- [ ] GitHub Release 附带 Chrome zip 和 Firefox xpi。

---

# Iteration 2 设计结论

本节记录第二阶段的全量补强方案。实现以下内容后，本节即为当前设计事实。

## 1. 发布产物模型

发布流水线不再让 publish job 直接访问 build job 的 runner 文件系统。`build` job 负责生成并上传：

- Chrome zip：`<plugin>-<version>-chrome-mv3.zip`
- Firefox zip：`<plugin>-<version>-firefox-mv3.zip`
- Firefox source archive：`<plugin>-<version>-firefox-source.zip`
- `SHA256SUMS`

`publish-chrome` 和 `publish-firefox` 必须先 `download-artifact`。Firefox 从下载后的 staging 目录签名，不直接签名 `.output`。GitHub Release 附带构建产物、签名 xpi 和校验和。

发布 CLI 固定版本，不使用 `npx --yes`。

## 2. 单插件校验

`scripts/validate-manifests.ts` 支持参数：

```bash
node scripts/validate-manifests.ts --plugin dark-mode-lite --browser firefox
```

不传参数时校验全部插件。校验包括 manifest、入口文件、icons、host permissions、content scripts、MV3、Firefox gecko id，以及 package manifest 一致性。

## 3. 类型安全消息契约

每个插件在 `lib/messages.ts` 定义自己的消息契约：

```ts
export const darkModeMessages = defineMessageContract({
  DARK_MODE_GET_SITE_STATE: {
    payload: undefined,
    response: {} as DarkModeSiteState,
  },
});
```

`@hub/shared/messaging` 提供：

- `createMessageSender(contract)`
- `createTabMessageSender(contract)`
- `onContractMessage(contract, handlers)`

插件 UI、background、content script 只能通过同一 contract 通信。

## 4. 插件内部模块

每个插件新增 `lib/`：

- `types.ts`
- `settings.ts`
- `messages.ts`
- 纯逻辑模块

`entrypoints/` 只负责装配浏览器 API 与 UI，避免 popup / content / background 重复定义同一份业务类型。

## 5. 插件体验目标

### Dark Mode Lite

- 使用 per-site 状态。
- popup 读取并修改当前 origin。
- 保存上次启用状态和强度。
- content script 重新注入时恢复当前站点状态。

### Volume Booster

- per-site 音量记忆。
- 使用 `MutationObserver` 处理动态媒体。
- 返回媒体数量、unsupported 数量、AudioContext 状态。
- 非 CORS 媒体最高 100%，UI 明确提示。

### Quick Translate

- provider 抽象，当前默认 Google Translate。
- background 翻译请求带超时。
- content script 对选区事件 debounce。
- 对同一 target + text 结果做内存缓存。
- 气泡自动翻转，避免屏幕底部溢出。
- 支持 copy 按钮。
- 检查 RTL 语言方向。

### Tab Stash

- 支持命名 group。
- popup 支持搜索。
- options 支持导入 / 导出。
- storage 成功后才关闭 tabs。
- 恢复失败时保留原始 group。

### Focus Lock

- 黑名单 per-domain 解锁。
- blocked page 显示被拦截域名。
- options 支持导入 / 导出黑名单。
- 支持删除密码，删除仍要求当前密码。
- DNR 规则同步失败不影响存储状态，但状态返回 error。

## 6. 质量与 CI

- 引入 Vitest，测试 shared messaging/storage 和插件纯逻辑。
- CI 增加 format check、audit、web-ext lint。
- CI 设置最小 permissions 和 concurrency。
- GitHub Actions 使用 commit SHA pin。
- 删除未使用的 Turbo 配置，当前编排保持 `pnpm -r`。
- 新增 Renovate、CONTRIBUTING、SECURITY、PR template 和 issue templates。

## 7. 商店资料

每个插件在 `docs/listings/<plugin>/` 维护：

- `chrome.md`
- `firefox.md`
- `privacy.md`
- `permissions.md`
- `screenshots.md`

## 8. Icons and Firefox baseline

Iteration 2 replaces 1×1 placeholders with deterministic flat PNG icons generated by `scripts/generate-icons.py`. The script is committed so icon sets can be regenerated consistently. Firefox `strict_min_version` is `142.0` because `browser_specific_settings.gecko.data_collection_permissions` requires Firefox 140+ and Firefox Android requires 142+.

## 9. Store documentation

Store copy is source-controlled under `docs/listings/<plugin>/`. Each plugin has Chrome and Firefox listing drafts, permission justifications, privacy summaries, and screenshot requirements. This is required before any real store submission.

---

# Iteration 3 设计结论：第二批插件

本节描述第二批 5 个插件的最终设计。实现后，本节即为当前事实。

## 1. New Tab Dashboard

- 使用 WXT `newtab` 入口生成 `chrome_url_overrides.newtab`。
- 权限只使用 `storage`。
- 不申请 `search` / `settings`，不修改默认搜索引擎。
- 第一版不提供搜索框，避免把第三方搜索 URL 写死进插件。
- 功能：时间、待办列表、快捷方式。
- 所有数据保存在 `chrome.storage.local`。
- 不联网、不展示广告、不收集数据。

## 2. Privacy Cleaner

- 权限使用 `activeTab`、`browsingData`、`storage`。
- 不申请 `tabs`，因此第一版不做“关闭标签页自动清理”。
- popup 用户点击后读取 active tab origin，并按 origin 清理：
  - cookies；
  - localStorage；
  - IndexedDB；
  - cache 可由用户选择。
- options 页配置默认清理数据类型。
- 清理动作必须由用户显式点击触发。
- 不读取页面内容，不发起远程请求。

## 3. Reading Progress

- 权限使用 `activeTab`、`scripting`、`storage`。
- content script 使用 runtime 注入。
- 每个站点保存开关、颜色、高度、位置。
- scroll 处理使用 `requestAnimationFrame` 节流。
- 进度条高度默认 3px，支持 top / bottom。
- 不发送网络请求。

## 4. Clipboard History Lite

- 权限使用 `activeTab`、`scripting`、`storage`、`clipboardWrite`。
- 不申请 `clipboardRead`。
- 用户在 popup 点击“Enable on this tab”后注入 content script。
- content script 只监听显式 `copy` 事件。
- 不监听 `input`、`keydown` 或隐藏字段。
- 只保存 selection / copy event 中用户主动复制的文本。
- 最多保留 50 条，全部存储在本地。
- popup 支持搜索、单条复制、删除、清空。

## 5. Screenshot Annotator

- 权限使用 `activeTab`、`storage`、`clipboardWrite`。
- popup 用户点击截图后调用 `tabs.captureVisibleTab`。
- 截图 data URL 存入 `chrome.storage.session`，仅本浏览器会话可见。
- 打开 `/annotate.html` 本地页面。
- annotate 页支持矩形、箭头、文字标注。
- 支持撤销、复制到剪贴板、下载 PNG。
- 不上传截图。

## 6. 合规边界

- New Tab Dashboard 不修改搜索设置。
- Privacy Cleaner 只执行用户显式触发的按 origin 清理。
- Clipboard History 不读取剪贴板 API，也不读取输入框；只处理显式 copy 事件。
- Screenshot Annotator 仅用户手势触发，数据不离开设备。
- 所有插件保持 `data_collection_permissions.required = ["none"]`。

---

# Iteration 4 设计结论：稳定化与发布准备

本节记录 Iteration 4 的实现结论。

## 1. Storage 写队列

`createNamespacedStorage` 对同一个 namespace 的 patch/reset 使用串行写队列，避免多个 popup、content script、background 同时读取旧 state 导致丢更新。读取不排队，写入按调用顺序排队。

## 2. Shared runtime injection

`@hub/shared/injection` 提供：

```ts
injectRuntimeContentScript({
  file: "/content-scripts/example.js",
});
```

它统一处理：

- active/current window tab 查询；
- tab id 校验；
- `browser.scripting.executeScript`；
- 错误归一化；
- 返回 tabId / url / origin。

popup 不再重复实现注入逻辑。

## 3. Shared popup status

`@hub/shared/ui` 提供 `createStatusView(element)`，返回：

```ts
{
  set(message, isError?)
}
```

所有插件 popup/options 使用同一状态显示规则。

## 4. UX 一致性

- 不再使用 `alert()`、`confirm()`、`prompt()`。
- New Tab Dashboard 的 shortcut 错误改为行内错误。
- Tab Stash rename/restore 确认使用 inline UI。
- Screenshot Annotator text 使用 floating input。

## 5. 插件行为增强

### Clipboard History Lite

- settings 增加 `enabledOrigins`, `disabledOrigins`, `expiresAtDays`。
- content script 保存前检查当前 origin 是否禁用。
- popup 可 disable/enable 当前 origin。
- 渲染前移除过期项。
- 仍不申请 `clipboardRead`。

### Privacy Cleaner

- cleanup response 增加 selected types。
- popup 展示清理的 origin 和数据类型。
- 不新增清理历史。

### Reading Progress

- site settings 增加 `offsetTop` 和 `offsetBottom`。
- top/bottom bar 根据偏移放置。
- popup 提供 offset 滑块。

### Screenshot Annotator

- 增加 brush 工具。
- 支持 Esc 取消当前 drag。
- 支持 Ctrl/Cmd+Z undo。
- annotate 页加载截图后立即删除 `chrome.storage.session` 中的截图。
- 不改变 permissions。

## 6. Store readiness

`scripts/validate-store-readiness.ts` 校验：

- manifest 必填字段；
- icons；
- Firefox gecko id / data collection；
- Chrome background；
- popup/options/newtab/annotate 文件；
- listing 和 privacy/permission 文档；
- screenshots checklist；-禁止 placeholder 字样。

## 7. 手工 QA

`docs/qa/<plugin>.md` 为每个插件提供可执行 checklist，作为发布 gate。

## 8. CI / release

- 所有 CI job 增加 timeout。
- Vitest 增加 coverage 支持。
- CodeQL 扫描 TypeScript。
- release build 后执行 artifact smoke check。
- E2E 用 `pnpm test:e2e` 独立触发，常规 `pnpm test` 不下载浏览器。

## 9. 文档

每个插件目录新增 `PLUGIN.md`，README 只保留项目级 overview。QA checklist 在 `docs/qa/<plugin>.md`。

---

# Iteration 5 设计结论：Quick Translate per-site access

## 目标

Quick Translate 支持“当前 tab 一次性启用”和“当前 site 持续启用”两种模式，不引入默认 broad host permission。

## 用户流程

1. 用户打开 popup。
2. 点击 **Enable on this tab**：只使用 `activeTab`，当前 tab 注入，导航后失效。
3. 点击 **Always on this site**：
   - popup 请求当前 origin 的 optional host permission；
   - 用户批准后写入 `enabledOrigins`；
   - background 注册只匹配该 origin 的 content script；
   - 后续导航自动注入。
4. 点击 **Disable on this site**：移除 permission 和 registered content script，并更新 storage。

## 数据模型

```ts
type TranslateSettings = {
  schemaVersion: 1;
  provider: "google";
  targetLanguage: string;
  timeoutMs: number;
  enabledOrigins: string[];
};
```

## 权限

- 静态：`activeTab`, `scripting`, `storage`, `https://translate.googleapis.com/*`。
- Optional：`http://*/*`, `https://*/*`。
- 无默认 page access；只有用户逐 site 授权后才生效。
