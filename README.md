# 校园任务互助平台

## 🏗️ 架构说明

```
GitHub Pages (前端) → ngrok → Docker (后端)
```

- **前端**：部署在 GitHub Pages
- **后端**：本地 Docker 容器运行
- **公网访问**：通过 ngrok 暴露后端服务

## 🚀 部署步骤

### 第一步：启动本地服务

```bash
# 1. 进入项目目录
cd e:\trae\chuangye

# 2. 启动完整架构（后端 + ngrok）
docker compose up -d --build
```

### 第二步：获取 ngrok 公网地址

打开浏览器访问：**http://localhost:4040**

在这个页面找到你的公网地址，格式类似：
`https://xxxx-xx-xx-xx-xx.ngrok-free.app`

### 第三步：配置前端 API 地址

打开文件：`frontend/app.js`

修改第 3 行，将 `API_BASE_URL` 改为你的 ngrok 地址：

```javascript
const API_BASE_URL = 'https://你的ngrok地址.ngrok-free.app/api';
```

### 第四步：部署前端到 GitHub Pages

1. 在 GitHub 创建一个新仓库
2. 将项目推送到 GitHub
3. 在仓库 **Settings** → **Pages** 中：
   - Source 选择 Deploy from a branch
   - Branch 选择你的主分支
   - Folder 选择 `/frontend`
4. 保存等待部署完成

访问地址：`https://你的用户名.github.io/仓库名/`

## 📋 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重启服务
docker compose restart
```

## 📝 注意事项

1. **ngrok 地址变化**：每次重启 Docker，ngrok 地址会变，需要更新前端配置
2. **数据持久化**：数据保存在 `backend/data/` 目录，容器删除不影响
3. **GitHub Pages 延迟**：推送代码后需要 1-5 分钟部署
4. **ngrok 免费版**：有连接数和带宽限制

## 📂 项目结构

```
chuangye/
├── backend/
│   ├── data/          # 数据文件
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── app.js         # 需配置 API 地址
│   └── style.css
└── docker-compose.yml
```
