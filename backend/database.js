const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  tasks: path.join(DATA_DIR, 'tasks.json'),
  services: path.join(DATA_DIR, 'services.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  posts: path.join(DATA_DIR, 'posts.json'),
  config: path.join(DATA_DIR, 'config.json')
};

// 初始化数据目录和默认数据
const DEFAULT_DATA = {
  users: [
    { id: '1', username: 'admin', password: 'admin123', role: 'admin', nickname: '管理员', balance: 0, creditScore: 100 },
    { id: '2', username: 'student1', password: '123456', role: 'user', nickname: '张同学', balance: 1000, creditScore: 95 },
    { id: '3', username: 'student2', password: '123456', role: 'user', nickname: '李同学', balance: 500, creditScore: 90 }
  ],
  tasks: [
    { id: '1', title: '帮忙取快递', description: '快递在菜鸟驿站，取件码1234', reward: 10, publisherId: '2', status: 'open', createdAt: new Date().toISOString() },
    { id: '2', title: '帮忙代写作业', description: '高数作业，明天要交', reward: 50, publisherId: '3', status: 'open', createdAt: new Date().toISOString() }
  ],
  services: [
    { id: '1', title: '专业代取快递', description: '全天可接单，效率高', price: 8, providerId: '2', status: 'active', createdAt: new Date().toISOString() },
    { id: '2', title: '高数辅导', description: '高数90+，可答疑可讲题', price: 30, providerId: '3', status: 'active', createdAt: new Date().toISOString() }
  ],
  orders: [
    { id: '1', serviceId: '1', serviceTitle: '专业代取快递', customerId: '3', providerId: '2', price: 8, status: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString() }
  ],
  posts: [
    { id: '1', title: '有人一起学习吗？', content: '图书馆三楼自习，约吗？', authorId: '2', likes: 5, createdAt: new Date().toISOString() },
    { id: '2', title: '二手书转让', content: '考研资料低价出', authorId: '3', likes: 10, createdAt: new Date().toISOString() }
  ],
  config: {
    primaryColor: '#07C160',
    backgroundColor: '#F5F5F5',
    textColor: '#1A1A1A'
  }
};

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 加载数据
function loadData(type) {
  const filePath = DB_FILES[type];
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`加载 ${type} 数据失败，使用默认数据:`, error.message);
      return DEFAULT_DATA[type];
    }
  }
  return DEFAULT_DATA[type];
}

// 保存数据
function saveData(type, data) {
  const filePath = DB_FILES[type];
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// 初始化所有数据文件
function initDatabase() {
  Object.keys(DB_FILES).forEach(type => {
    if (!fs.existsSync(DB_FILES[type])) {
      saveData(type, DEFAULT_DATA[type]);
    }
  });
  console.log('数据库初始化完成');
}

module.exports = {
  initDatabase,
  loadData,
  saveData
};
