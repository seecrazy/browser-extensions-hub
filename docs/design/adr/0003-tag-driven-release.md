# ADR 0003: tag 驱动单插件发布

## 状态

Accepted

## 背景

多个插件需要独立发版，不应该互相阻塞。

## 决策

使用 `<plugin-name>@<version>` tag 触发 release workflow。

## 理由

- 一个 tag 只表示一个插件版本。
- release workflow 可以明确构建目标。
- 避免一次提交触发全部插件发布。

## 后果

- tag 必须通过脚本校验与 `package.json.version` 一致。
- 共享包更新后，插件如需重新发布，仍必须提升插件版本。
