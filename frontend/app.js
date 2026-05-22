const API_BASE_URL = 'https://speculate-swifter-suspend.ngrok-free.dev/api';

const Auth = {
  getUser() {
    const user = localStorage.getItem('campus_user');
    return user ? JSON.parse(user) : null;
  },
  setUser(user) {
    localStorage.setItem('campus_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('campus_user');
  },
  isLoggedIn() {
    return !!this.getUser();
  },
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  }
};

const Modal = {
  listeners: [],
  on(callback) {
    this.listeners.push(callback);
  },
  emit(config) {
    this.listeners.forEach(fn => fn(config));
  },
  alert(message) {
    return new Promise(resolve => {
      this.emit({
        type: 'alert',
        message,
        onOk: resolve
      });
    });
  },
  confirm(message) {
    return new Promise((resolve) => {
      this.emit({
        type: 'confirm',
        message,
        onOk: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const { createApp, ref, computed, onMounted, watch } = Vue;
const { createRouter, createWebHashHistory, useRouter, useRoute } = VueRouter;

// 金额格式化函数
const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '0.00';
  return parseFloat(amount).toFixed(2);
};

const LoginPage = {
  template: `
    <div class="container">
      <div class="card" style="margin-top: 60px;">
        <h2 style="text-align: center; margin-bottom: 24px;">登录</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input type="text" class="form-input" v-model="form.username" placeholder="请输入用户名">
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input type="password" class="form-input" v-model="form.password" placeholder="请输入密码">
          </div>
          <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        <p style="text-align: center; margin-top: 16px; color: var(--text-secondary);">
          还没有账号？<button @click="goToRegister" style="border: none; background: none; color: var(--primary-color); cursor: pointer; font-weight: 600;">立即注册</button>
        </p>
      </div>
    </div>
  `,
  setup() {
    const router = useRouter();
    const form = ref({ username: '', password: '' });
    const loading = ref(false);

    const handleLogin = async () => {
      if (!form.value.username || !form.value.password) {
        await Modal.alert('请填写用户名和密码');
        return;
      }
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form.value)
        });
        const data = await res.json();
        if (data.success) {
          Auth.setUser(data.data);
          await Modal.alert('登录成功');
          router.push('/');
        } else {
          await Modal.alert(data.message || '登录失败');
        }
      } catch (e) {
        await Modal.alert('网络错误，请确保后端服务已启动');
      } finally {
        loading.value = false;
      }
    };

    const goToRegister = () => router.push('/register');

    return { form, loading, handleLogin, goToRegister };
  }
};

const RegisterPage = {
  template: `
    <div class="container">
      <div class="card" style="margin-top: 60px;">
        <h2 style="text-align: center; margin-bottom: 24px;">注册</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input type="text" class="form-input" v-model="form.username" placeholder="请输入用户名">
          </div>
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input type="text" class="form-input" v-model="form.nickname" placeholder="请输入昵称">
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input type="password" class="form-input" v-model="form.password" placeholder="请输入密码">
          </div>
          <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
        <p style="text-align: center; margin-top: 16px; color: var(--text-secondary);">
          已有账号？<button @click="goToLogin" style="border: none; background: none; color: var(--primary-color); cursor: pointer; font-weight: 600;">立即登录</button>
        </p>
      </div>
    </div>
  `,
  setup() {
    const router = useRouter();
    const form = ref({ username: '', nickname: '', password: '' });
    const loading = ref(false);

    const handleRegister = async () => {
      if (!form.value.username || !form.value.password) {
        await Modal.alert('请填写用户名和密码');
        return;
      }
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form.value)
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('注册成功，请登录');
          router.push('/login');
        } else {
          await Modal.alert(data.message || '注册失败');
        }
      } catch (e) {
        await Modal.alert('网络错误');
      } finally {
        loading.value = false;
      }
    };

    const goToLogin = () => router.push('/login');

    return { form, loading, handleRegister, goToLogin };
  }
};

const TasksPage = {
  template: `
    <div class="container">
      <div class="filter-bar" style="margin-top: 16px;">
        <button class="filter-btn" :class="{ active: currentFilter === 'all' }" @click="currentFilter = 'all'">全部</button>
        <button class="filter-btn" :class="{ active: currentFilter === 'open' }" @click="currentFilter = 'open'">可接单</button>
        <button class="filter-btn" :class="{ active: currentFilter === 'in_progress' }" @click="currentFilter = 'in_progress'">进行中</button>
        <button class="filter-btn" :class="{ active: currentFilter === 'completed' }" @click="currentFilter = 'completed'">已完成</button>
      </div>

      <div v-if="loading">
        <div class="loading-spinner"></div>
      </div>
      <div v-else-if="filteredTasks.length === 0">
        <div class="empty-state">
          <div class="empty-state-icon">暂无</div>
          <div class="empty-state-text">暂无任务</div>
        </div>
      </div>
      <div v-else>
        <div v-for="task in filteredTasks" :key="task.id" class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <h3 style="font-size: 16px; font-weight: 700; line-height: 1.4; flex: 1;">{{ task.title }}</h3>
            <span class="status-badge" :class="'status-' + task.status">{{ getTaskStatusText(task.status) }}</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.7; margin-bottom: 10px;">{{ task.description }}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 18px; font-weight: 700; color: var(--primary-color);">¥{{ formatMoney(task.reward) }}</span>
            <span style="font-size: 12px; color: var(--text-secondary);">{{ formatDate(task.createdAt) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: var(--text-secondary);">发布者: {{ task.publisherNickname }}</span>
            <span :style="{ 
              fontSize: '13px', 
              fontWeight: '600',
              color: getCreditScoreColor(task.publisherCreditScore) 
            }">信用分: {{ task.publisherCreditScore || 100 }}</span>
          </div>
          <button v-if="task.status === 'open' && task.publisherId !== user.id" class="btn btn-primary btn-full" style="margin-top: 12px;" @click="acceptTask(task.id)">
            立即接单
          </button>
          <div v-else-if="task.status === 'open' && task.publisherId === user.id" style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 8px 0; margin-top: 8px;">
            这是您发布的任务
          </div>
        </div>
      </div>
    </div>
    <button class="fab" @click="showPublishModal = true">+</button>
    <button class="refresh-btn" @click="loadTasks">
      <div class="refresh-icon"></div>
    </button>

    <div class="modal-overlay" v-if="showPublishModal" @click.self="showPublishModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">发布任务</div>
          <button class="close-btn" @click="showPublishModal = false">&times;</button>
        </div>
        <form @submit.prevent="publishTask">
          <div class="form-group">
            <label class="form-label">任务标题</label>
            <input type="text" class="form-input" v-model="publishForm.title" placeholder="请输入任务标题">
          </div>
          <div class="form-group">
            <label class="form-label">任务描述</label>
            <textarea class="form-textarea" v-model="publishForm.description" placeholder="请描述任务详情"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">报酬金额</label>
            <input type="number" class="form-input" v-model="publishForm.reward" placeholder="请输入报酬金额">
          </div>
          <button type="submit" class="btn btn-primary btn-full" :disabled="publishing">
            {{ publishing ? '发布中...' : '发布任务' }}
          </button>
        </form>
      </div>
    </div>
  `,
  setup() {
    const user = ref(Auth.getUser());
    const tasks = ref([]);
    const loading = ref(true);
    const currentFilter = ref('all');
    const showPublishModal = ref(false);
    const publishing = ref(false);
    const publishForm = ref({ title: '', description: '', reward: '' });

    const filteredTasks = computed(() => {
      if (currentFilter.value === 'all') return tasks.value;
      return tasks.value.filter(t => t.status === currentFilter.value);
    });

    const getTaskStatusText = (status) => ({
      open: '可接单',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }[status] || status);
    
    const getCreditScoreColor = (score) => {
      const s = score || 100;
      if (s >= 80) return '#07c160'; // 绿色
      if (s >= 60) return '#faad14'; // 黄色
      if (s >= 40) return '#ff7d00'; // 橙色
      return '#ff4d4f'; // 红色
    };

    const loadTasks = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/tasks`);
        const data = await res.json();
        if (data.success) {
          tasks.value = data.data;
        }
      } catch (e) {
        console.error('加载任务失败', e);
      } finally {
        loading.value = false;
      }
    };

    const acceptTask = async (taskId) => {
      const result = await Modal.confirm('确定要接单吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acceptorId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('接单成功！');
          loadTasks();
        } else {
          await Modal.alert(data.message || '接单失败');
        }
      } catch (e) {
        await Modal.alert('接单失败');
      }
    };

    const refreshUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.value.id}`);
        const data = await res.json();
        if (data.success) {
          const updatedUser = { ...Auth.getUser(), ...data.data };
          Auth.setUser(updatedUser);
          user.value = updatedUser;
        }
      } catch (e) {
        console.error('刷新用户数据失败', e);
      }
    };

    const publishTask = async () => {
      if (!publishForm.value.title || !publishForm.value.description || !publishForm.value.reward) {
        await Modal.alert('请填写完整信息');
        return;
      }
      if (publishForm.value.title.length > 100) {
        await Modal.alert('标题不能超过100字符');
        return;
      }
      if (publishForm.value.description.length > 1000) {
        await Modal.alert('描述不能超过1000字符');
        return;
      }
      if (publishForm.value.reward <= 0) {
        await Modal.alert('奖励金额必须大于0');
        return;
      }
      publishing.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...publishForm.value, creatorId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('发布成功！');
          showPublishModal.value = false;
          publishForm.value = { title: '', description: '', reward: '' };
          loadTasks();
          refreshUser();
        } else {
          await Modal.alert(data.message || '发布失败');
        }
      } catch (e) {
        await Modal.alert('发布失败');
      } finally {
        publishing.value = false;
      }
    };

    onMounted(() => loadTasks());

    return {
      user, tasks, loading, currentFilter, filteredTasks, showPublishModal,
      publishing, publishForm, getTaskStatusText, getCreditScoreColor, loadTasks, acceptTask, publishTask, refreshUser, formatDate, formatMoney
    };
  }
};

const ServicesPage = {
  template: `
    <div class="container">
      <div v-if="loading" style="margin-top: 16px;">
        <div class="loading-spinner"></div>
      </div>
      <div v-else-if="services.length === 0">
        <div class="empty-state">
          <div class="empty-state-icon">暂无</div>
          <div class="empty-state-text">暂无服务</div>
        </div>
      </div>
      <div v-else>
        <div v-for="service in services" :key="service.id" class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <h3 style="font-size: 16px; font-weight: 700; line-height: 1.4; flex: 1;">{{ service.title }}</h3>
            <span class="status-badge" :class="'status-' + service.status">
              {{ service.status === 'active' ? '在售' : '下架' }}
            </span>
          </div>
          <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.7; margin-bottom: 10px;">{{ service.description }}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 18px; font-weight: 700; color: var(--primary-color);">¥{{ formatMoney(service.price) }}<span style="font-size: 13px; font-weight: 500;">/次</span></span>
            <span style="font-size: 12px; color: var(--text-secondary);">{{ formatDate(service.createdAt) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: var(--text-secondary);">服务提供者: {{ service.providerNickname }}</span>
            <span :style="{ 
              fontSize: '13px', 
              fontWeight: '600',
              color: getCreditScoreColor(service.providerCreditScore) 
            }">信用分: {{ service.providerCreditScore || 100 }}</span>
          </div>
          <button v-if="service.status === 'active' && service.providerId !== user.id" class="btn btn-primary btn-full" style="margin-top: 12px;" @click="orderService(service.id)">
            立即下单
          </button>
          <div v-else-if="service.status === 'active' && service.providerId === user.id" style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 8px 0; margin-top: 8px;">
            这是您发布的服务
          </div>
        </div>
      </div>
    </div>
    <button class="fab" @click="showPublishModal = true">+</button>
    <button class="refresh-btn" @click="loadServices">
      <div class="refresh-icon"></div>
    </button>

    <div class="modal-overlay" v-if="showPublishModal" @click.self="showPublishModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">发布服务</div>
          <button class="close-btn" @click="showPublishModal = false">&times;</button>
        </div>
        <div class="fee-notice">
          <span style="display: inline-flex; align-items: center; gap: 6px;">
            <span style="width: 14px; height: 14px; background: #faad14; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);"></span>
            平台收取 8% 服务费，请合理定价
          </span>
        </div>
        <form @submit.prevent="publishService">
          <div class="form-group">
            <label class="form-label">服务标题</label>
            <input type="text" class="form-input" v-model="publishForm.title" placeholder="请输入服务标题">
          </div>
          <div class="form-group">
            <label class="form-label">服务描述</label>
            <textarea class="form-textarea" v-model="publishForm.description" placeholder="请描述服务详情"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">服务价格</label>
            <input type="number" class="form-input" v-model="publishForm.price" placeholder="请输入服务价格">
          </div>
          <button type="submit" class="btn btn-primary btn-full" :disabled="publishing">
            {{ publishing ? '发布中...' : '发布服务' }}
          </button>
        </form>
      </div>
    </div>
  `,
  setup() {
    const user = ref(Auth.getUser());
    const services = ref([]);
    const loading = ref(true);
    const showPublishModal = ref(false);
    const publishing = ref(false);
    const publishForm = ref({ title: '', description: '', price: '' });
    
    const getCreditScoreColor = (score) => {
      const s = score || 100;
      if (s >= 80) return '#07c160'; // 绿色
      if (s >= 60) return '#faad14'; // 黄色
      if (s >= 40) return '#ff7d00'; // 橙色
      return '#ff4d4f'; // 红色
    };

    const loadServices = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/services`);
        const data = await res.json();
        if (data.success) {
          services.value = data.data;
        }
      } catch (e) {
        console.error('加载服务失败', e);
      } finally {
        loading.value = false;
      }
    };

    const orderService = async (serviceId) => {
      const result = await Modal.confirm('确定要下单吗？平台将收取 8% 服务费。');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/services/${serviceId}/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('下单成功！');
          loadServices();
        } else {
          await Modal.alert(data.message || '下单失败');
        }
      } catch (e) {
        await Modal.alert('下单失败');
      }
    };

    const refreshUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.value.id}`);
        const data = await res.json();
        if (data.success) {
          const updatedUser = { ...Auth.getUser(), ...data.data };
          Auth.setUser(updatedUser);
          user.value = updatedUser;
        }
      } catch (e) {
        console.error('刷新用户数据失败', e);
      }
    };

    const publishService = async () => {
      if (!publishForm.value.title || !publishForm.value.description || !publishForm.value.price) {
        await Modal.alert('请填写完整信息');
        return;
      }
      if (publishForm.value.title.length > 100) {
        await Modal.alert('标题不能超过100字符');
        return;
      }
      if (publishForm.value.description.length > 1000) {
        await Modal.alert('描述不能超过1000字符');
        return;
      }
      if (publishForm.value.price <= 0) {
        await Modal.alert('服务价格必须大于0');
        return;
      }
      publishing.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...publishForm.value, creatorId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('发布成功！');
          showPublishModal.value = false;
          publishForm.value = { title: '', description: '', price: '' };
          loadServices();
        } else {
          await Modal.alert(data.message || '发布失败');
        }
      } catch (e) {
        await Modal.alert('发布失败');
      } finally {
        publishing.value = false;
      }
    };

    onMounted(() => loadServices());

    return { user, services, loading, showPublishModal, publishing, publishForm, getCreditScoreColor, loadServices, orderService, publishService, refreshUser, formatDate, formatMoney };
  }
};

const ForumPage = {
  template: `
    <div class="container">
      <div v-if="loading" style="margin-top: 16px;">
        <div class="loading-spinner"></div>
      </div>
      <div v-else-if="posts.length === 0">
        <div class="empty-state">
          <div class="empty-state-icon">暂无</div>
          <div class="empty-state-text">暂无帖子，快来发布第一条吧！</div>
        </div>
      </div>
      <div v-else>
        <div v-for="post in posts" :key="post.id" class="card">
          <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">{{ post.title }}</h3>
          <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.7; margin-bottom: 12px;">{{ post.content }}</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button class="filter-btn" @click="likePost(post.id)">
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 14px; height: 14px; background: #ff4d4f; clip-path: polygon(50% 20%, 100% 0%, 100% 60%, 50% 100%, 0% 60%, 0% 0%);"></span>
                {{ post.likes }}
              </span>
            </button>
            <span style="font-size: 12px; color: var(--text-secondary);">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
    <button class="fab" @click="showPublishModal = true">+</button>
    <button class="refresh-btn" @click="loadPosts">
      <div class="refresh-icon"></div>
    </button>

    <div class="modal-overlay" v-if="showPublishModal" @click.self="showPublishModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">发布新帖子</div>
          <button class="close-btn" @click="showPublishModal = false">&times;</button>
        </div>
        <form @submit.prevent="publishPost">
          <div class="form-group">
            <label class="form-label">帖子标题</label>
            <input type="text" class="form-input" v-model="publishForm.title" placeholder="请输入帖子标题">
          </div>
          <div class="form-group">
            <label class="form-label">帖子内容</label>
            <textarea class="form-textarea" v-model="publishForm.content" placeholder="请输入帖子内容" style="min-height: 140px;"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full" :disabled="publishing">
            {{ publishing ? '发布中...' : '发布' }}
          </button>
        </form>
      </div>
    </div>
  `,
  setup() {
    const user = ref(Auth.getUser());
    const posts = ref([]);
    const loading = ref(true);
    const showPublishModal = ref(false);
    const publishing = ref(false);
    const publishForm = ref({ title: '', content: '' });

    const loadPosts = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/forum`);
        const data = await res.json();
        if (data.success) {
          posts.value = data.data;
        }
      } catch (e) {
        console.error('加载帖子失败', e);
      } finally {
        loading.value = false;
      }
    };

    const likePost = async (postId) => {
      try {
        const res = await fetch(`${API_BASE_URL}/forum/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          loadPosts();
        } else {
          await Modal.alert(data.message || '点赞失败');
        }
      } catch (e) {
        console.error('点赞失败', e);
      }
    };

    const refreshUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.value.id}`);
        const data = await res.json();
        if (data.success) {
          const updatedUser = { ...Auth.getUser(), ...data.data };
          Auth.setUser(updatedUser);
          user.value = updatedUser;
        }
      } catch (e) {
        console.error('刷新用户数据失败', e);
      }
    };

    const publishPost = async () => {
      if (!publishForm.value.title.trim() || !publishForm.value.content.trim()) {
        await Modal.alert('请填写标题和内容');
        return;
      }
      if (publishForm.value.title.length > 100) {
        await Modal.alert('标题不能超过100字符');
        return;
      }
      if (publishForm.value.content.length > 2000) {
        await Modal.alert('内容不能超过2000字符');
        return;
      }
      publishing.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/forum`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: publishForm.value.title,
            content: publishForm.value.content,
            authorId: user.value.id
          })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('发布成功');
          publishForm.value = { title: '', content: '' };
          showPublishModal.value = false;
          loadPosts();
        } else {
          await Modal.alert(data.message || '发布失败');
        }
      } catch (e) {
        await Modal.alert('发布失败，请检查网络');
      } finally {
        publishing.value = false;
      }
    };

    onMounted(() => loadPosts());

    return { posts, loading, showPublishModal, publishing, publishForm, loadPosts, likePost, publishPost, refreshUser, formatDate };
  }
};

const ProfilePage = {
  template: `
    <div class="container">
      <div class="card" style="margin-top: 16px;">
        <div class="user-info">
          <div class="user-avatar">{{ (user.nickname || user.username).charAt(0).toUpperCase() }}</div>
          <div class="user-details">
            <div class="user-header">
              <div class="user-info-left">
                <div class="user-name">{{ user.nickname || user.username }}</div>
                <div class="user-username">@{{ user.username }}</div>
              </div>
              <span v-if="user.role === 'admin'" class="user-role-badge admin-badge">管理员</span>
              <span v-else class="user-role-badge">普通用户</span>
            </div>
          </div>
        </div>
        <div class="user-content">
          <div class="user-stats">
            <div class="user-stat">
              <div class="user-stat-value">¥{{ formatMoney(user.balance) }}</div>
              <div class="user-stat-label">账户余额</div>
            </div>
            <div class="user-stat">
              <div class="user-stat-value" style="color: #faad14;">{{ user.creditScore || 100 }}</div>
              <div class="user-stat-label">信用分</div>
            </div>
            <div class="user-stat">
              <div class="user-stat-value" style="color: #52c41a;">
                {{ user.currentActiveTasks || 0 }} / {{ user.limits?.maxAcceptTasks || 5 }}
              </div>
              <div class="user-stat-label">进行中的任务</div>
            </div>
            <div class="user-stat">
              <div class="user-stat-value" style="color: #13c2c2;">
                {{ user.currentActiveServices || 0 }} / {{ user.limits?.maxPublishServices || 5 }}
              </div>
              <div class="user-stat-label">已发布的服务</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn btn-secondary" style="flex: 1;" @click="showPasswordModal = true">修改密码</button>
            <button class="btn btn-danger" style="flex: 1;" @click="handleLogout">退出登录</button>
          </div>
        </div>
      </div>

      <div class="card admin-card" v-if="user.role === 'admin'">
        <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 4px;">管理后台</h3>
        <p style="font-size: 13px; opacity: 0.9; margin-bottom: 0;">管理平台用户、任务、订单和设置</p>
        <button class="btn btn-full admin-btn" @click="goToAdmin">
          进入管理后台 →
        </button>
      </div>

      <div class="tab-nav">
        <button class="tab-btn" :class="{ active: mainTab === 'tasks' }" @click="mainTab = 'tasks'">我的任务</button>
        <button class="tab-btn" :class="{ active: mainTab === 'orders' }" @click="mainTab = 'orders'">我的订单</button>
      </div>

      <div v-if="mainTab === 'tasks'">
        <div class="sub-tabs" style="margin-top: 16px;">
          <button class="sub-tab-btn" :class="{ active: taskTab === 'published' }" @click="taskTab = 'published'">我发布的</button>
          <button class="sub-tab-btn" :class="{ active: taskTab === 'accepted' }" @click="taskTab = 'accepted'">我接单的</button>
        </div>

        <div v-if="tasksLoading">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="currentTasks.length === 0">
          <div class="empty-state">
            <div class="empty-state-icon">暂无</div>
            <div class="empty-state-text">暂无任务</div>
          </div>
        </div>
        <div v-else>
          <div v-for="task in currentTasks" :key="task.id" class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div style="font-size: 16px; font-weight: 700; flex: 1;">{{ task.title }}</div>
              <span class="status-badge" :class="'status-' + task.status">{{ getTaskStatusText(task.status) }}</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.7; margin-bottom: 10px;">{{ task.description }}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 700; color: var(--primary-color);">¥{{ formatMoney(task.reward) }}</span>
              <span style="font-size: 12px; color: var(--text-secondary);">{{ formatDate(task.createdAt) }}</span>
            </div>
            <div class="action-btns" v-if="canShowTaskActions(task)">
              <button v-if="task.status === 'open' && taskTab === 'published'" class="btn btn-danger btn-full" @click="cancelTask(task.id)">取消任务</button>
              <button v-if="task.status === 'in_progress' && taskTab === 'published'" class="btn btn-primary btn-full" @click="completeTask(task.id)">确认完成</button>
              <button v-if="task.status === 'in_progress' && taskTab === 'accepted'" class="btn btn-primary btn-full" @click="completeTask(task.id)">完成任务</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="mainTab === 'orders'">
        <div class="sub-tabs" style="margin-top: 16px;">
          <button class="sub-tab-btn" :class="{ active: orderTab === 'my' }" @click="orderTab = 'my'">我下的单</button>
          <button class="sub-tab-btn" :class="{ active: orderTab === 'received' }" @click="orderTab = 'received'">我收到的</button>
        </div>

        <div v-if="ordersLoading">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="currentOrders.length === 0">
          <div class="empty-state">
            <div class="empty-state-icon">暂无</div>
            <div class="empty-state-text">暂无订单</div>
          </div>
        </div>
        <div v-else>
          <div v-for="order in currentOrders" :key="order.id" class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div style="font-size: 16px; font-weight: 700; flex: 1;">{{ order.serviceTitle }}</div>
              <span class="status-badge" :class="'status-' + order.status">{{ getOrderStatusText(order.status) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 18px; font-weight: 700; color: var(--primary-color);">¥{{ formatMoney(order.price) }}</span>
              <span style="font-size: 13px; color: var(--text-secondary);">平台费: ¥{{ formatMoney(order.platformFee) }}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">{{ formatDate(order.createdAt) }}</div>
            <div class="action-btns" v-if="canShowOrderActions(order)">
              <button v-if="order.status === 'pending' && orderTab === 'received'" class="btn btn-primary btn-full" @click="acceptOrder(order.id)">接受订单</button>
              <button v-if="order.status === 'pending' && orderTab === 'my'" class="btn btn-danger btn-full" @click="cancelOrder(order.id)">取消订单</button>
              <button v-if="order.status === 'processing' && orderTab === 'received'" class="btn btn-primary btn-full" @click="completeOrder(order.id)">完成订单</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button class="refresh-btn" @click="loadAllData">
      <div class="refresh-icon"></div>
    </button>
    
    <div class="modal-overlay" v-if="showPasswordModal" @click.self="showPasswordModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">修改密码</div>
          <button class="close-btn" @click="showPasswordModal = false">&times;</button>
        </div>
        <div class="form-group">
          <label class="form-label">当前密码</label>
          <input type="password" class="form-input" v-model="passwordForm.current" placeholder="请输入当前密码">
        </div>
        <div class="form-group">
          <label class="form-label">新密码</label>
          <input type="password" class="form-input" v-model="passwordForm.new" placeholder="请输入新密码（至少6位）">
        </div>
        <div class="form-group">
          <label class="form-label">确认新密码</label>
          <input type="password" class="form-input" v-model="passwordForm.confirm" placeholder="请再次输入新密码">
        </div>
        <button class="btn btn-primary btn-full" @click="handleChangePassword" :disabled="passwordChanging">
          {{ passwordChanging ? '修改中...' : '确认修改' }}
        </button>
      </div>
    </div>
  `,
  setup() {
    const router = useRouter();
    const user = ref(Auth.getUser());
    const mainTab = ref('tasks');
    const taskTab = ref('published');
    const orderTab = ref('my');
    const tasksLoading = ref(true);
    const ordersLoading = ref(true);
    const tasksData = ref({ published: [], accepted: [] });
    const ordersData = ref({ my: [], received: [] });
    const showPasswordModal = ref(false);
    const passwordForm = ref({ current: '', new: '', confirm: '' });
    const passwordChanging = ref(false);

    const currentTasks = computed(() => {
      return taskTab.value === 'published' ? tasksData.value.published : tasksData.value.accepted;
    });

    const currentOrders = computed(() => {
      return orderTab.value === 'my' ? ordersData.value.my : ordersData.value.received;
    });

    const getTaskStatusText = (status) => ({
      open: '可接单',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }[status] || status);

    const getOrderStatusText = (status) => ({
      pending: '待接受',
      processing: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }[status] || status);

    const canShowTaskActions = (task) => task.status !== 'completed' && task.status !== 'cancelled';
    const canShowOrderActions = (order) => order.status !== 'completed' && order.status !== 'cancelled';

    const loadTasks = async () => {
      tasksLoading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.value.id}/tasks`);
        const data = await res.json();
        if (data.success) {
          tasksData.value = data.data;
        }
      } catch (e) {
        console.error('加载任务失败', e);
      } finally {
        tasksLoading.value = false;
      }
    };

    const loadOrders = async () => {
      ordersLoading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.value.id}/orders`);
        const data = await res.json();
        if (data.success) {
          ordersData.value = data.data;
        }
      } catch (e) {
        console.error('加载订单失败', e);
      } finally {
        ordersLoading.value = false;
      }
    };

    const refreshUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.value.id}`);
        const data = await res.json();
        if (data.success) {
          const updatedUser = { ...Auth.getUser(), ...data.data };
          Auth.setUser(updatedUser);
          user.value = updatedUser;
        }
      } catch (e) {
        console.error('刷新用户数据失败', e);
      }
    };
    
    const handleChangePassword = async () => {
      if (!passwordForm.value.current || !passwordForm.value.new || !passwordForm.value.confirm) {
        await Modal.alert('请填写完整信息');
        return;
      }
      if (passwordForm.value.new.length < 6) {
        await Modal.alert('新密码长度不能少于6位');
        return;
      }
      if (passwordForm.value.new !== passwordForm.value.confirm) {
        await Modal.alert('两次输入的新密码不一致');
        return;
      }
      passwordChanging.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.value.id}/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            currentPassword: passwordForm.value.current, 
            newPassword: passwordForm.value.new,
            userId: user.value.id 
          })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('密码修改成功！');
          passwordForm.value = { current: '', new: '', confirm: '' };
          showPasswordModal.value = false;
        } else {
          await Modal.alert(data.message || '密码修改失败');
        }
      } catch (e) {
        await Modal.alert('密码修改失败');
      } finally {
        passwordChanging.value = false;
      }
    };

    const loadAllData = () => {
      loadTasks();
      loadOrders();
    };

    const cancelTask = async (taskId) => {
      const result = await Modal.confirm('确定要取消这个任务吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('任务已取消');
          loadTasks();
          refreshUser();
        } else {
          await Modal.alert(data.message || '取消失败');
        }
      } catch (e) {
        await Modal.alert('取消失败');
      }
    };

    const completeTask = async (taskId) => {
      const result = await Modal.confirm('确定任务已完成了吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('任务已完成');
          loadTasks();
          refreshUser();
        } else {
          await Modal.alert(data.message || '操作失败');
        }
      } catch (e) {
        await Modal.alert('操作失败');
      }
    };

    const acceptOrder = async (orderId) => {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('已接受订单');
          loadOrders();
        } else {
          await Modal.alert(data.message || '操作失败');
        }
      } catch (e) {
        await Modal.alert('操作失败');
      }
    };

    const cancelOrder = async (orderId) => {
      const result = await Modal.confirm('确定要取消这个订单吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('订单已取消');
          loadOrders();
          refreshUser();
        } else {
          await Modal.alert(data.message || '取消失败');
        }
      } catch (e) {
        await Modal.alert('取消失败');
      }
    };

    const completeOrder = async (orderId) => {
      const result = await Modal.confirm('确定订单已完成了吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('订单已完成');
          loadOrders();
          refreshUser();
        } else {
          await Modal.alert(data.message || '操作失败');
        }
      } catch (e) {
        await Modal.alert('操作失败');
      }
    };

    const goToAdmin = () => router.push('/admin');

    const handleLogout = async () => {
      const result = await Modal.confirm('确定要退出登录吗？');
      if (result) {
        Auth.logout();
        router.push('/login');
      }
    };

    onMounted(() => loadAllData());

    return {
      user, mainTab, taskTab, orderTab, tasksLoading, ordersLoading, currentTasks, currentOrders,
      getTaskStatusText, getOrderStatusText, canShowTaskActions, canShowOrderActions,
      loadTasks, loadOrders, loadAllData, cancelTask, completeTask, acceptOrder, cancelOrder,
      completeOrder, goToAdmin, handleLogout, showPasswordModal, passwordForm, passwordChanging, handleChangePassword, refreshUser, formatDate, formatMoney
    };
  }
};

const AdminPage = {
  template: `
    <div class="container">
      <div class="tab-nav">
        <button class="tab-btn" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'; loadDashboard()">数据概览</button>
        <button class="tab-btn" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'; loadUsers()">用户管理</button>
        <button class="tab-btn" :class="{ active: activeTab === 'tasks' }" @click="activeTab = 'tasks'; loadTasks()">任务管理</button>
        <button class="tab-btn" :class="{ active: activeTab === 'services' }" @click="activeTab = 'services'; loadServices()">服务管理</button>
        <button class="tab-btn" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'; loadOrders()">订单管理</button>
        <button class="tab-btn" :class="{ active: activeTab === 'forum' }" @click="activeTab = 'forum'; loadForum()">论坛管理</button>
        <button class="tab-btn" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'; loadSettings()">系统设置</button>
      </div>

      <div v-if="activeTab === 'dashboard'">
        <div class="card" style="margin-top: 16px;">
          <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 16px;">平台数据统计</h3>
          <div v-if="loading">
            <div class="loading-spinner"></div>
          </div>
          <div v-else>
            <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">概览数据</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ stats.userCount }}</div>
                <div class="stat-label">用户总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.taskCount }}</div>
                <div class="stat-label">任务总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.serviceCount }}</div>
                <div class="stat-label">服务总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.orderCount }}</div>
                <div class="stat-label">订单总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.postCount }}</div>
                <div class="stat-label">帖子总数</div>
              </div>
            </div>
            <h4 style="font-size: 15px; font-weight: 600; margin: 16px 0 12px;">今日新增</h4>
            <div class="stats-grid" v-if="stats.todayCount">
              <div class="stat-card">
                <div class="stat-value">{{ stats.todayCount.tasks }}</div>
                <div class="stat-label">今日任务</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.todayCount.services }}</div>
                <div class="stat-label">今日服务</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.todayCount.orders }}</div>
                <div class="stat-label">今日订单</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.todayCount.posts }}</div>
                <div class="stat-label">今日帖子</div>
              </div>
            </div>
            <h4 style="font-size: 15px; font-weight: 600; margin: 16px 0 12px;">任务状态</h4>
            <div class="stats-grid" v-if="stats.taskByStatus">
              <div class="stat-card">
                <div class="stat-value">{{ stats.taskByStatus.open }}</div>
                <div class="stat-label">待接单</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.taskByStatus.in_progress }}</div>
                <div class="stat-label">进行中</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.taskByStatus.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.taskByStatus.cancelled }}</div>
                <div class="stat-label">已取消</div>
              </div>
            </div>
            <h4 style="font-size: 15px; font-weight: 600; margin: 16px 0 12px;">订单状态</h4>
            <div class="stats-grid" v-if="stats.orderByStatus">
              <div class="stat-card">
                <div class="stat-value">{{ stats.orderByStatus.pending }}</div>
                <div class="stat-label">待接单</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.orderByStatus.processing }}</div>
                <div class="stat-label">进行中</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.orderByStatus.completed }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.orderByStatus.cancelled }}</div>
                <div class="stat-label">已取消</div>
              </div>
            </div>
            <h4 style="font-size: 15px; font-weight: 600; margin: 16px 0 12px;">财务数据</h4>
            <div class="stats-grid" v-if="stats.financial">
              <div class="stat-card">
                <div class="stat-value">¥{{ formatMoney(stats.financial.totalUserBalance) }}</div>
                <div class="stat-label">用户总余额</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">¥{{ formatMoney(stats.financial.totalTaskReward) }}</div>
                <div class="stat-label">总任务奖金</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">¥{{ formatMoney(stats.financial.totalOrderAmount) }}</div>
                <div class="stat-label">总订单金额</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">¥{{ formatMoney(stats.financial.totalPlatformFee) }}</div>
                <div class="stat-label">平台收入</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'users'">
        <div v-if="loading" style="margin-top: 16px;">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="users.length === 0">
          <div class="empty-state">
            <div class="empty-state-icon">暂无</div>
            <div class="empty-state-text">暂无用户</div>
          </div>
        </div>
        <div v-else>
          <div v-for="user in users" :key="user.id" class="card">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;">
                {{ (user.nickname || user.username).charAt(0).toUpperCase() }}
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div>
                    <div style="font-weight: 700; font-size: 15px;">{{ user.nickname || user.username }}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">@{{ user.username }}</div>
                  </div>
                  <span class="status-badge" :class="user.role === 'admin' ? 'status-pending' : 'status-open'">
                    {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary);">
                  <span>余额: ¥{{ formatMoney(user.balance) }}</span>
                  <span>信用分: {{ user.creditScore || 100 }}</span>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                  <button class="btn btn-primary btn-sm" @click="openRechargeModal(user)">充值</button>
                  <button v-if="user.role !== 'admin'" class="btn btn-danger btn-sm" @click="deleteUser(user.id)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'tasks'">
        <div v-if="loading" style="margin-top: 16px;">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="tasks.length === 0">
          <div class="empty-state">
            <div class="empty-state-icon">暂无</div>
            <div class="empty-state-text">暂无任务</div>
          </div>
        </div>
        <div v-else>
          <div v-for="task in tasks" :key="task.id" class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <h3 style="font-size: 16px; font-weight: 700; line-height: 1.4; flex: 1; margin: 0;">{{ task.title }}</h3>
              <span class="status-badge" :class="'status-' + task.status">{{ getTaskStatusText(task.status) }}</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.7; margin-bottom: 10px;">{{ task.description }}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 700; color: var(--primary-color);">¥{{ formatMoney(task.reward) }}</span>
              <span style="font-size: 12px; color: var(--text-secondary);">{{ formatDate(task.createdAt) }}</span>
            </div>
            <button v-if="task.status === 'open'" class="btn btn-danger btn-sm" style="margin-top: 10px;" @click="deleteTask(task.id)">删除任务</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'services'">
        <div v-if="loading" style="margin-top: 16px;">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="services.length === 0">
          <div class="empty-state">
            <div class="empty-state-icon">暂无</div>
            <div class="empty-state-text">暂无服务</div>
          </div>
        </div>
        <div v-else>
          <div v-for="service in services" :key="service.id" class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <h3 style="font-size: 16px; font-weight: 700; line-height: 1.4; flex: 1; margin: 0;">{{ service.title }}</h3>
              <span class="status-badge" :class="'status-' + service.status">{{ getServiceStatusText(service.status) }}</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.7; margin-bottom: 10px;">{{ service.description }}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 700; color: var(--primary-color);">¥{{ formatMoney(service.price) }}/次</span>
              <span style="font-size: 12px; color: var(--text-secondary);">{{ formatDate(service.createdAt) }}</span>
            </div>
            <button class="btn btn-danger btn-sm" style="margin-top: 10px;" @click="deleteService(service.id)">删除服务</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'orders'">
        <div v-if="loading" style="margin-top: 16px;">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="orders.length === 0">
          <div class="empty-state">
            <div class="empty-state-icon">暂无</div>
            <div class="empty-state-text">暂无订单</div>
          </div>
        </div>
        <div v-else>
          <div v-for="order in orders" :key="order.id" class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <h3 style="font-size: 16px; font-weight: 700; line-height: 1.4; flex: 1; margin: 0;">{{ order.serviceTitle }}</h3>
              <span class="status-badge" :class="'status-' + order.status">{{ getOrderStatusText(order.status) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 700; color: var(--primary-color);">¥{{ formatMoney(order.price) }}</span>
              <span style="font-size: 13px; color: var(--text-secondary);">平台费: ¥{{ formatMoney(order.platformFee) }}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">{{ formatDate(order.createdAt) }}</div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'forum'">
        <div v-if="loading" style="margin-top: 16px;">
          <div class="loading-spinner"></div>
        </div>
        <div v-else-if="posts.length === 0">
          <div class="empty-state">
            <div class="empty-state-icon">暂无</div>
            <div class="empty-state-text">暂无帖子</div>
          </div>
        </div>
        <div v-else>
          <div v-for="post in posts" :key="post.id" class="card">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">{{ post.title }}</h3>
            <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.7; margin-bottom: 10px;">{{ post.content }}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-secondary);">
                <span style="width: 14px; height: 14px; background: #ff4d4f; clip-path: polygon(50% 20%, 100% 0%, 100% 60%, 50% 100%, 0% 60%, 0% 0%);"></span>
                {{ post.likes }}
              </span>
              <span style="font-size: 12px; color: var(--text-secondary);">{{ formatDate(post.createdAt) }}</span>
            </div>
            <button class="btn btn-danger btn-sm" style="margin-top: 10px;" @click="deletePost(post.id)">删除帖子</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'settings'">
        <div class="card" style="margin-top: 16px;">
          <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 16px;">配色设置</h3>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <span style="width: 80px; font-size: 14px; font-weight: 500;">主色调</span>
            <input type="color" style="width: 60px; height: 40px; border-radius: 6px; border: 1px solid var(--border-color);" v-model="settings.primaryColor">
            <span style="font-size: 13px; color: var(--text-secondary);">{{ settings.primaryColor }}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <span style="width: 80px; font-size: 14px; font-weight: 500;">背景色</span>
            <input type="color" style="width: 60px; height: 40px; border-radius: 6px; border: 1px solid var(--border-color);" v-model="settings.backgroundColor">
            <span style="font-size: 13px; color: var(--text-secondary);">{{ settings.backgroundColor }}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
            <span style="width: 80px; font-size: 14px; font-weight: 500;">文字色</span>
            <input type="color" style="width: 60px; height: 40px; border-radius: 6px; border: 1px solid var(--border-color);" v-model="settings.textColor">
            <span style="font-size: 13px; color: var(--text-secondary);">{{ settings.textColor }}</span>
          </div>
          <button class="btn btn-primary btn-full" @click="saveSettings" :disabled="saving">
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
          <p style="font-size: 12px; color: var(--text-secondary); margin-top: 12px;">保存后刷新页面即可生效</p>
        </div>
      </div>
    </div>
    
    <div class="modal-overlay" v-if="showRechargeModal" @click.self="showRechargeModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">充值</div>
          <button class="close-btn" @click="showRechargeModal = false">&times;</button>
        </div>
        <div style="margin-bottom: 16px;">
          <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 6px;">用户</div>
          <div style="font-weight: 600; font-size: 16px;">{{ rechargeUser?.nickname || rechargeUser?.username }}</div>
          <div style="font-size: 13px; color: var(--text-secondary);">当前余额: ¥{{ formatMoney(rechargeUser?.balance) }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">充值金额</label>
          <input type="number" class="form-input" v-model="rechargeAmount" placeholder="请输入充值金额（1-10000）" min="1" max="10000">
        </div>
        <button class="btn btn-primary btn-full" @click="handleRecharge" :disabled="recharging">
          {{ recharging ? '充值中...' : '确认充值' }}
        </button>
      </div>
    </div>
  `,
  setup() {
    const user = ref(Auth.getUser());
    const activeTab = ref('dashboard');
    const loading = ref(false);
    const saving = ref(false);
    const users = ref([]);
    const tasks = ref([]);
    const services = ref([]);
    const orders = ref([]);
    const posts = ref([]);
    const stats = ref({
      userCount: 0, taskCount: 0, serviceCount: 0, orderCount: 0, postCount: 0,
      completedTasks: 0, completedOrders: 0, totalPlatformFee: 0
    });
    const settings = ref({
      primaryColor: '#07C160', backgroundColor: '#F5F5F5', textColor: '#1A1A1A'
    });
    const showRechargeModal = ref(false);
    const rechargeUser = ref(null);
    const rechargeAmount = ref('');
    const recharging = ref(false);

    const getTaskStatusText = (status) => ({
      open: '可接单', in_progress: '进行中', completed: '已完成', cancelled: '已取消'
    }[status] || status);

    const getServiceStatusText = (status) => ({
      active: '正常', inactive: '下架'
    }[status] || status);

    const getOrderStatusText = (status) => ({
      pending: '待接单', processing: '进行中', completed: '已完成', cancelled: '已取消'
    }[status] || status);

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    };

    const loadDashboard = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/stats`);
        const data = await res.json();
        if (data.success) stats.value = data.data;
      } catch (e) { console.error('加载统计失败', e); }
      finally { loading.value = false; }
    };

    const loadUsers = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/users`);
        const data = await res.json();
        if (data.success) users.value = data.data;
      } catch (e) { console.error('加载用户失败', e); }
      finally { loading.value = false; }
    };

    const loadTasks = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/tasks`);
        const data = await res.json();
        if (data.success) tasks.value = data.data;
      } catch (e) { console.error('加载任务失败', e); }
      finally { loading.value = false; }
    };

    const loadServices = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/services`);
        const data = await res.json();
        if (data.success) services.value = data.data;
      } catch (e) { console.error('加载服务失败', e); }
      finally { loading.value = false; }
    };

    const loadOrders = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/orders`);
        const data = await res.json();
        if (data.success) orders.value = data.data;
      } catch (e) { console.error('加载订单失败', e); }
      finally { loading.value = false; }
    };

    const loadForum = async () => {
      loading.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/forum`);
        const data = await res.json();
        if (data.success) posts.value = data.data;
      } catch (e) { console.error('加载论坛失败', e); }
      finally { loading.value = false; }
    };

    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/config/colors`);
        const data = await res.json();
        if (data.success) settings.value = data.data;
      } catch (e) { console.error('加载设置失败', e); }
    };

    const saveSettings = async () => {
      saving.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/colors`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings.value)
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('保存成功，请刷新页面查看效果');
          applyColors(settings.value);
        }
      } catch (e) { await Modal.alert('保存失败'); }
      finally { saving.value = false; }
    };

    const openRechargeModal = (user) => {
      rechargeUser.value = user;
      rechargeAmount.value = '';
      showRechargeModal.value = true;
    };

    const handleRecharge = async () => {
      const amount = parseFloat(rechargeAmount.value);
      
      if (!amount || amount <= 0) {
        await Modal.alert('请输入有效的充值金额');
        return;
      }
      
      if (amount < 1) {
        await Modal.alert('单次充值金额不能少于1元');
        return;
      }
      
      if (amount > 10000) {
        await Modal.alert('单次充值金额不能超过10000元');
        return;
      }
      
      if (!rechargeUser.value) {
        await Modal.alert('用户信息错误，请重试');
        return;
      }
      
      const result = await Modal.confirm(`确定要给 ${rechargeUser.value.nickname || rechargeUser.value.username} 充值 ¥${amount} 吗？`);
      if (!result) {
        return;
      }
      
      recharging.value = true;
      try {
        const res = await fetch(`${API_BASE_URL}/users/${rechargeUser.value.id}/recharge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('充值成功！');
          showRechargeModal.value = false;
          rechargeUser.value = null;
          rechargeAmount.value = '';
          loadUsers();
        } else {
          await Modal.alert(data.message || '充值失败');
        }
      } catch (e) {
        await Modal.alert('充值失败，请检查网络连接');
      } finally {
        recharging.value = false;
      }
    };

    const deleteUser = async (id) => {
      const result = await Modal.confirm('确定要删除这个用户吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('删除成功');
          loadUsers();
        } else await Modal.alert(data.message || '删除失败');
      } catch (e) { await Modal.alert('删除失败'); }
    };

    const deleteTask = async (id) => {
      const result = await Modal.confirm('确定要删除这个任务吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('删除成功');
          loadTasks();
        } else await Modal.alert(data.message || '删除失败');
      } catch (e) { await Modal.alert('删除失败'); }
    };

    const deleteService = async (id) => {
      const result = await Modal.confirm('确定要删除这个服务吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/services/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('删除成功');
          loadServices();
        } else await Modal.alert(data.message || '删除失败');
      } catch (e) { await Modal.alert('删除失败'); }
    };

    const deletePost = async (id) => {
      const result = await Modal.confirm('确定要删除这个帖子吗？');
      if (!result) return;
      try {
        const res = await fetch(`${API_BASE_URL}/forum/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.value.id })
        });
        const data = await res.json();
        if (data.success) {
          await Modal.alert('删除成功');
          loadForum();
        } else await Modal.alert(data.message || '删除失败');
      } catch (e) { await Modal.alert('删除失败'); }
    };

    onMounted(() => loadDashboard());

    return {
      user, activeTab, loading, saving, users, tasks, services, orders, posts, stats, settings,
      showRechargeModal, rechargeUser, rechargeAmount, recharging,
      getTaskStatusText, getServiceStatusText, getOrderStatusText,
      loadDashboard, loadUsers, loadTasks, loadServices, loadOrders, loadForum, loadSettings,
      saveSettings, openRechargeModal, handleRecharge,
      deleteUser, deleteTask, deleteService, deletePost, formatDate, formatMoney
    };
  }
};

const App = {
  template: `
    <div>
      <div class="nav" v-if="isLoggedIn && !isLoginPage">
        <button class="nav-item" :class="{ active: currentRoute === '/tasks' || currentRoute === '/' }" @click="goTo('/tasks')">任务大厅</button>
        <button class="nav-item" :class="{ active: currentRoute === '/services' }" @click="goTo('/services')">服务市场</button>
        <button class="nav-item" :class="{ active: currentRoute === '/forum' }" @click="goTo('/forum')">校园论坛</button>
        <button class="nav-item" :class="{ active: currentRoute === '/profile' }" @click="goTo('/profile')">个人中心</button>
      </div>

      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" />
        </transition>
      </router-view>

      <div class="modal-overlay" v-if="showModal" @click.self="handleModalCancel">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">{{ modalTitle }}</div>
            <button class="close-btn" @click="handleModalCancel" v-if="showCloseBtn">&times;</button>
          </div>
          <div class="modal-body" style="text-align: center; padding: 20px 0;">
            {{ modalMessage }}
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="handleModalCancel" v-if="modalType === 'confirm'">取消</button>
            <button class="btn btn-primary" @click="handleModalOk">确定</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    // 使用响应式变量存储用户登录状态，解决导航栏不显示的问题
    const isLoggedInRef = ref(Auth.isLoggedIn());
    const isLoggedIn = computed(() => isLoggedInRef.value);
    const currentRoute = computed(() => route.path);

    const isLoginPage = computed(() => route.path === '/login' || route.path === '/register');

    const goTo = (path) => router.push(path);

    const showModal = ref(false);
    const modalType = ref('alert');
    const modalTitle = ref('提示');
    const modalMessage = ref('');
    let modalCallbacks = { onOk: null, onCancel: null };

    const showCloseBtn = computed(() => modalType.value === 'alert');

    const handleModalOk = () => {
      if (modalCallbacks.onOk) modalCallbacks.onOk();
      showModal.value = false;
    };

    const handleModalCancel = () => {
      if (modalCallbacks.onCancel) modalCallbacks.onCancel();
      showModal.value = false;
    };

    // 监听路由变化，更新登录状态
    watch(() => route.path, () => {
      isLoggedInRef.value = Auth.isLoggedIn();
    }, { immediate: true });

    onMounted(() => {
      Modal.on((config) => {
        modalType.value = config.type;
        modalTitle.value = config.type === 'confirm' ? '确认' : '提示';
        modalMessage.value = config.message;
        modalCallbacks.onOk = config.onOk;
        modalCallbacks.onCancel = config.onCancel;
        showModal.value = true;
      });
    });

    return { isLoggedIn, currentRoute, isLoginPage, goTo,
             showModal, modalType, modalTitle, modalMessage, showCloseBtn,
             handleModalOk, handleModalCancel };
  }
};

const routes = [
  { path: '/', component: TasksPage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/tasks', component: TasksPage },
  { path: '/services', component: ServicesPage },
  { path: '/forum', component: ForumPage },
  { path: '/profile', component: ProfilePage },
  { path: '/admin', component: AdminPage }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const isLoggedIn = Auth.isLoggedIn();
  const publicPages = ['/login', '/register'];
  
  if (!publicPages.includes(to.path) && !isLoggedIn) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    next('/');
  } else if (to.path === '/admin' && !Auth.isAdmin()) {
    await Modal.alert('无权限访问');
    next('/');
  } else {
    next();
  }
});

const applyColors = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/config/colors`);
    const data = await res.json();
    if (data.success) {
      const colors = data.data;
      const root = document.documentElement;
      if (colors.primaryColor) root.style.setProperty('--primary-color', colors.primaryColor);
      if (colors.backgroundColor) root.style.setProperty('--background-color', colors.backgroundColor);
      if (colors.textColor) root.style.setProperty('--text-color', colors.textColor);
    }
  } catch (e) {
    console.error('加载配色失败');
  }
};

applyColors();

const app = createApp(App);
app.use(router);
app.mount('#app');
