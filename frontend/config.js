// API 配置文件
// 使用前请根据需要选择合适的配置

// ==========================================
// 方式一：本地开发（使用 localhost）
// ==========================================
const LOCAL_API_URL = 'http://localhost:3000/api';

// ==========================================
// 方式二：ngrok 公网（用于 GitHub Pages）
// ==========================================
// 将下面的地址替换为你的 ngrok 地址
const NGROK_API_URL = 'https://替换为你的ngrok地址.ngrok-free.app/api';

// ==========================================
// 选择当前使用的 API 地址
// ==========================================
// 本地开发时使用：LOCAL_API_URL
// GitHub Pages 部署时使用：NGROK_API_URL
const API_BASE_URL = LOCAL_API_URL;

console.log('当前 API 地址:', API_BASE_URL);
