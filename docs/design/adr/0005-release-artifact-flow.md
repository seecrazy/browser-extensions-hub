# ADR 0005: Release Artifact Flow

## 状态

Accepted

## 背景

GitHub Actions 的每个 job 是独立 runner。`build` job 生成的 zip 不能被 `publish` job 直接访问。此前 Firefox 还从 `.output` 签名，导致 GitHub Release 可能使用未签名产物。

## 决策

所有发布产物由 build job 打包并 upload。publish job 只消费 download 后的 artifact。Firefox 签名产物单独 upload，GitHub Release 使用签名 xpi。发布 CLI 固定版本。

## 后果

- 产物来源清晰。
- signing 不再依赖 `.output` 目录。
- 缺少 store secret 时 publish job 可以跳过，不影响 GitHub Release。
