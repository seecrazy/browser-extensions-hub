# ADR 0007: Iteration 2 Scope

## 状态

Accepted

## 背景

第一版已经能构建，但发布、测试、体验和商店准备仍不完整。

## 决策

第二阶段一次性补齐 release artifact flow、单插件校验、共享包测试、消息契约、插件 lib 模块、基础 UX 增强、CI 安全、Renovate、仓库流程文档和商店资料骨架。

## 后果

- 不引入 React/Vue。
- 不申请 broad host permissions。
- 不做账号和遥测。
- Google Translate 仍为默认 provider，但封装在 provider 抽象后面。
