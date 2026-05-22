# 推送到 GitHub 指南

## 📦 仓库信息

- **仓库名**：oozyxoo.github.io
- **访问地址**：https://oozyxoo.github.io/
- **远程仓库**：https://github.com/oozyxoo/oozyxoo.github.io.git

## ⚠️ 重要提示

GitHub 用户主页（oozyxoo.github.io）要求将网页文件放在根目录，而不是 `/frontend` 子目录。

## 📝 两个部署方案

### 方案 A：使用子目录（推荐，保持当前结构）

1. 在 GitHub 仓库创建后，配置 Pages 使用 `/frontend` 目录作为发布源
2. 这样可以保持当前项目结构不变

### 方案 B：移动文件到根目录

1. 将 `frontend/` 目录的内容移动到根目录
2. 直接推送

---

## 🚀 最简单的方式（方案 A）

**我已经配置好远程仓库，你只需要：**

1. **在 GitHub 创建 `oozyxoo.github.io` 仓库**
   - 访问：https://github.com/new
   - 仓库名输入：`oozyxoo.github.io`
   - 创建仓库（先不添加任何文件）

2. **推送代码到 GitHub**：
   ```bash
   cd e:\trae\chuangye
   git push -u origin main
   ```

3. **在 GitHub Pages 设置中**：
   - 进入仓库 Settings → Pages
   - Branch：`main`
   - Folder：选择 `/frontend`
   - 保存

---

## 📋 当前配置

- **ngrok 地址**：https://speculate-swifter-suspend.ngrok-free.dev
- **前端已配置**：使用此 ngrok 地址
- **后端运行中**：本地 Docker 容器

## 🎯 准备好推送了！

在 GitHub 创建仓库后，运行：
```bash
git push -u origin main
```
