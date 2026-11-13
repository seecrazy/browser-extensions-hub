# ADR 0001: 使用 pnpm workspaces

## 状态

Accepted

## 背景

仓库将包含多个独立可发布插件和共享包，需要可靠处理本地依赖、workspace 协议和依赖提升。

## 决策

使用 pnpm workspaces 作为唯一包管理器。

## 理由

- `workspace:*` 语义清晰。
- 依赖隔离比 npm / yarn 更适合多插件仓库。
- pnpm filter 可以按 package 精确执行任务。
- WXT 构建 shared 源码后，扩展产物自包含。

## 后果

- CI 必须使用固定 pnpm 版本。
- 本地开发必须先运行 `pnpm install`。
- 不允许绕过 workspace 直接使用相对路径引用 shared。
