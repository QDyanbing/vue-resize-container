# PR 最佳实践

面向所有向 `vue-resize-container` 提交 Pull Request 的贡献者，遵循以下约定可以保证分支安全、版本可追溯、发布高效。

## 1. 分支与提交流程
- 默认分支为 `master`，已启用分支保护，请勿直接在该分支上提交或 force-push。
- 每次修改都基于最新 `master` 新建分支，命名推荐：`feature/<topic>`、`fix/<issue>`、`docs/<scope>`。
- 提交前运行 `pnpm lint`、`pnpm build`，确保 CI 可以通过；必要时补充/更新文档与测试。

## 2. Changesets 与版本记录
- 所有用户可见的改动都必须运行一次 `pnpm changeset`：
  1. 按提示选择语义版本（patch/minor/major），尽量让影响范围与选择一致；
  2. 写一句简洁描述，说明变化对象与效果；
  3. 将生成的 `.changeset/*.md` 与代码一并提交。
- 文档或示例改动若不会影响发布包，可选择 `patch` 并说明“docs only”。只有完全内部的维护工作（例如 CI 配置）才可在维护者确认下跳过 changeset。

## 3. PR 内容要求
- 控制 PR 范围，避免同时修改多个互不关联的功能。
- 在描述中写清：
  - 背景 & 动机；
  - 主要改动点；
  - 验证方式（如命令、截图）。
- 若修改 UI/交互，请附带 Demo 链接或截图；若涉及 bug 修复，最好提供复现方式。

## 4. Review 与合并
- CI 全绿后再申请 Review，默认至少 1 个审批。
- 审核意见处理完毕后以追加 commit 或 `git commit --amend`（若 PR 内还未 review）方式更新。
- 禁止在 PR 中运行发布脚本，发布由维护者在 `master` 合入后统一执行。

## 5. 发布配合
- 当 `master` 合入多个 PR 后，维护者会按照《发布管理流程》执行：
  1. 新建 `release/vX.Y.Z` 分支；
  2. 运行 `pnpm release:version` 聚合 changelog；
  3. 通过 release PR 合并；
  4. 在最新 `master` 上执行 `pnpm release`（内部串行构建、发布 npm、推送 tag、可追加 `pnpm docs:deploy`）。
- 贡献者无需介入发布命令，只需确保 PR 中的 changeset 与文档说明准确即可。

## 6. 沟通渠道
- 有疑问请直接在 PR/Issue 讨论，或通过仓库 README 中的联系方式找维护者。
- 发现流程改进点，可提交 Issue 或 PR 更新本文档。

遵循以上约定可以让 `vue-resize-container` 的迭代与发布保持一致、可追溯，非常感谢你的贡献！

