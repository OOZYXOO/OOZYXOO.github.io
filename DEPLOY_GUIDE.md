# GitHub Pages 部署指南

## ✅ 已完成的准备工作

- ✅ Git 仓库已初始化
- ✅ 前端已配置 ngrok 地址
- ✅ 首次提交已完成

## 📝 接下来需要完成部署：

### 步骤 1：在 GitHub 创建新仓库

1. 登录 GitHub 账户

### 步骤 2：添加远程仓库并推送

```bash
# 替换下面的 <你的GitHub用户名> 和 <仓库名>
git remote add origin https://github.com/<你的GitHub用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 步骤 3：配置 GitHub Pages

1. 打开你的 GitHub 仓库页面
2. 点击 **Settings** （设置）
3. 点击左侧菜单的 **Pages**
4. 在 **Build and deployment** 下：
   - **Source**: Deploy from a branch
   - **Branch**: `main` （或 master）
   - **Folder**: `/frontend`
   - 点击 **Save**

### 步骤 4：等待部署完成

GitHub Pages 部署通常需要 1-5 分钟，完成后会显示你的访问地址，类似：
`https://<你的用户名>.github.io/<仓库名>/

## 📋 当前配置

- **ngrok 地址**：https://speculate-swifter-suspend.ngrok-free.dev
- **后端地址**：http://localhost:3000
- **本地前端**：打开 `frontend/index.html`

## ⚠️ 重要提示

1. ngrok 地址重启后会变化，需要更新 `frontend/app.js` 并重新推送代码
2. 确保本地 Docker 服务一直在运行
3. 不要提交前记得先更新 API 地址

---

## 👏 部署完成后就可以通过 GitHub Pages 访问了！
