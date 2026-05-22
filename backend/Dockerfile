FROM node:18-alpine

WORKDIR /app

# 复制 package 文件并安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 确保 data 目录存在
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
