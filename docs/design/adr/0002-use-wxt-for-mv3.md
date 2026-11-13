# ADR 0002: 使用 WXT 生成 MV3

## 状态

Accepted

## 背景

手写多个 manifest 重复成本高，且容易在 Chrome / Firefox 之间漂移。

## 决策

所有插件使用 WXT 约定式 entrypoints 生成 Manifest V3。

## 理由

- 自动映射 background、popup、options、content script。
- 支持 Chrome 和 Firefox 双构建。
- 降低新插件模板成本。
- 构建产物是校验和发布的唯一来源。

## 后果

- manifest 校验必须检查 `.output` 中的最终 manifest。
- WXT 版本必须固定。
- 升级 WXT 必须触发全量构建。
