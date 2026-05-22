# GitHub 推送完整指南

## 📋 当前状态

- ✅ Git 仓库已准备好
- ✅ 远程仓库已配置：https://github.com/oozyxoo/oozyxoo.github.io.git
- ⚠️ 远程仓库已有内容，需要强制推送

---

## 🔐 方法 1：手动操作（推荐，最简单）

### 1️⃣ 检查你的 GitHub 访问权限

确保你已经登录 GitHub，并且有仓库权限。

### 2️⃣ 强制推送代码

在你的终端运行：

```bash
cd e:\trae\chuangye
git push --force origin main
```

---

## 🔐 方法 2：如果需要认证（如果上面失败）

### 选项 A：使用个人访问令牌 (PAT)

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Classic"
3. 选择 repo 权限
4. 生成并复制 Token

然后推送时用：
```bash
git push https://<你的Token>@github.com/oozyxoo/oozyxoo.github.io.git
```

### 选项 B：使用 GitHub CLI

```bash
gh auth login
# 按提示操作，登录成功后
git push -f origin main
```

---

## 📝 推送成功后的步骤

1. **配置 GitHub Pages**：
   - 打开：https://github.com/oozyxoo/oozyxoo.github.io/settings/pages
   - Source：Deploy from a branch
   - Branch：`main`，Folder：选择 `/frontend`
   - 保存

2. **等待部署**：1-5 分钟

3. **访问网站**：https://oozyxoo.github.io/

---

## 📋 当前配置

- **ngrok 地址**：https://speculate-swifter-suspend.ngrok-free.dev
- **后端**：Docker 运行中
