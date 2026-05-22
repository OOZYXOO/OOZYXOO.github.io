# 校园任务互助平台部署指南

## 架构概述
- **前端**：部署到 GitHub Pages（静态页面）
- **后端**：运行在本地 Docker 容器中
- **公网暴露**：使用 ngrok 将本地后端暴露到公网

## 使用说明

### 1. 环境准备

#### 1.1 Docker
确保已安装 Docker 和 Docker Compose

#### 1.2 ngrok（可选但推荐）
1. 访问 https://ngrok.com/ 注册账号
2. 获取你的 authtoken

### 2. 配置并启动服务

#### 2.1 配置 ngrok（可选）
```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，填入你的 ngrok authtoken
NGROK_AUTHTOKEN=你的token
```

#### 2.2 启动服务

**仅启动后端（本地开发用）：**
```bash
docker compose up -d --build
```

**启动后端 + ngrok（公网访问用）：**
```bash
docker compose --profile ngrok up -d --build
```

### 3. 获取 ngrok 公网地址

#### 方式一：通过 ngrok 管理界面
访问：http://localhost:4040

#### 方式二：通过 API 查询
```bash
curl http://localhost:4040/api/tunnels
```

公网地址格式类似：`https://xxxx-xx-xx-xx-xx.ngrok-free.app`

### 4. 配置前端 API 地址

编辑 `frontend/app.js`，修改第一行：

**本地开发时：**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**GitHub Pages 部署时：**
```javascript
const API_BASE_URL = 'https://你的ngrok地址.ngrok-free.app/api';
```

### 5. 部署前端到 GitHub Pages

#### 5.1 创建 GitHub 仓库
1. 在 GitHub 上创建一个新仓库
2. 将项目推送到 GitHub

#### 5.2 配置 GitHub Pages
1. 进入仓库的 **Settings**
2. 找到 **Pages** 选项
3. 在 **Build and deployment** 下：
   - **Source** 选择 Deploy from a branch
   - **Branch** 选择 main 或 master 分支
   - **Folder** 选择 `/frontend`（如果没有，先在仓库设置中配置）

#### 5.3 推送代码
```bash
git add frontend/
git commit -m "部署前端到 GitHub Pages"
git push
```

#### 5.4 访问你的网站
GitHub Pages 地址格式：
`https://你的用户名.github.io/仓库名/`

## 常用 Docker 命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
docker compose logs -f backend
docker compose logs -f ngrok

# 停止服务
docker compose down

# 重启服务
docker compose restart
```

## 开发工作流

### 本地开发时
1. 启动后端：`docker compose up -d`
2. 前端使用 localhost:3000
3. 直接打开 frontend/index.html 测试

### 发布到 GitHub Pages 时
1. 启动完整服务：`docker compose --profile ngrok up -d`
2. 获取 ngrok 公网地址
3. 修改前端 API_BASE_URL 为 ngrok 地址
4. 提交并推送代码到 GitHub
5. 等待 GitHub Pages 部署完成

## 注意事项

1. **ngrok 免费版限制**：
   - 每次重启地址会变化
   - 带宽和连接数有限制
   - 定期需要重新配置

2. **数据持久化**：
   - 所有数据保存在 `backend/data/` 目录
   - 容器删除数据不会丢失
   - 定期备份该目录

3. **GitHub Pages 更新延迟**：
   - 每次推送后，GitHub Pages 需要 1-5 分钟部署
   - 可能需要清除浏览器缓存

4. **CORS 配置**：
   - 后端已配置允许所有来源访问
   - 包括本地文件和 GitHub Pages
