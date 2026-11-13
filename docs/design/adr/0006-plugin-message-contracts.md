# ADR 0006: Plugin Message Contracts

## 状态

Accepted

## 背景

字符串消息与松散 payload 类型容易在 popup、background、content script 之间漂移。

## 决策

每个插件定义本地 message contract。`@hub/shared` 提供 contract-aware sender 和 listener helper。消息名、payload 和 response 必须来自同一类型定义。

## 后果

- 消息协议重构更安全。
- 新增消息必须在 contract 中声明。
- shared 不需要了解插件业务。
