const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { initDatabase, loadData, saveData } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const PLATFORM_FEE_RATE = 0.08;

// 金额精度处理 - 确保保留2位小数
const formatAmount = (amount) => {
  return Math.round(parseFloat(amount) * 100) / 100;
};

// 根据信用分获取最大可接单数和可发布服务数
const getLimitsByCreditScore = (creditScore) => {
  const score = creditScore || 100;
  if (score < 30) {
    return { maxAcceptTasks: 0, maxPublishServices: 0 };
  } else if (score >= 30 && score <= 59) {
    return { maxAcceptTasks: 1, maxPublishServices: 1 };
  } else if (score >= 60 && score <= 79) {
    return { maxAcceptTasks: 2, maxPublishServices: 2 };
  } else if (score >= 80 && score <= 94) {
    return { maxAcceptTasks: 3, maxPublishServices: 3 };
  } else {
    return { maxAcceptTasks: 5, maxPublishServices: 5 };
  }
};

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDatabase();

app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: '校园任务互助平台 API 服务运行正常',
    version: '1.0.0'
  });
});

// 配置
app.get('/api/config/colors', (req, res) => {
  const config = loadData('config');
  res.json({ success: true, data: config });
});

app.put('/api/admin/colors', (req, res) => {
  const config = loadData('config');
  const newConfig = { ...config, ...req.body };
  saveData('config', newConfig);
  res.json({ success: true, message: '配色更新成功', data: newConfig });
});

// 任务
app.get('/api/tasks', (req, res) => {
  const tasks = loadData('tasks');
  const users = loadData('users');
  const { status, keyword, sortBy } = req.query;
  
  let filteredTasks = tasks;
  
  if (status) {
    filteredTasks = filteredTasks.filter(t => t.status === status);
  }
  
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filteredTasks = filteredTasks.filter(t => 
      t.title.toLowerCase().includes(lowerKeyword) || 
      t.description.toLowerCase().includes(lowerKeyword)
    );
  }
  
  if (sortBy === 'newest') {
    filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'reward') {
    filteredTasks.sort((a, b) => b.reward - a.reward);
  } else if (sortBy === 'oldest') {
    filteredTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  
  const tasksWithUserInfo = filteredTasks.map(task => {
    const publisher = users.find(u => u.id === task.publisherId);
    const acceptor = task.acceptorId ? users.find(u => u.id === task.acceptorId) : null;
    return {
      ...task,
      publisherNickname: publisher ? publisher.nickname : '未知用户',
      publisherCreditScore: publisher ? (publisher.creditScore || 100) : 100,
      acceptorNickname: acceptor ? acceptor.nickname : null
    };
  });
  
  res.json({ success: true, data: tasksWithUserInfo });
});

app.get('/api/tasks/:id', (req, res) => {
  const tasks = loadData('tasks');
  const task = tasks.find(t => t.id === req.params.id);
  if (task) {
    res.json({ success: true, data: task });
  } else {
    res.status(404).json({ success: false, message: '任务不存在' });
  }
});

app.post('/api/tasks', (req, res) => {
  const { title, description, reward, creatorId } = req.body;
  if (!title || !description || !reward || !creatorId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }
  
  const formattedReward = formatAmount(reward);
  
  if (formattedReward <= 0) {
    return res.status(400).json({ success: false, message: '奖励金额必须大于0' });
  }
  
  if (title.length > 100) {
    return res.status(400).json({ success: false, message: '标题不能超过100字符' });
  }
  
  if (description.length > 1000) {
    return res.status(400).json({ success: false, message: '描述不能超过1000字符' });
  }
  
  const users = loadData('users');
  const publisherIndex = users.findIndex(u => u.id === creatorId);
  if (publisherIndex === -1) {
    return res.status(400).json({ success: false, message: '发布者不存在' });
  }
  
  const publisher = users[publisherIndex];
  
  // 检查信用分
  if ((publisher.creditScore || 100) < 30) {
    return res.status(400).json({ success: false, message: '您的信用分过低，无法发布任务' });
  }
  
  if ((publisher.balance || 0) < formattedReward) {
    return res.status(400).json({ success: false, message: '余额不足，请先充值' });
  }
  
  // 发布任务时直接扣除金额
  users[publisherIndex] = {
    ...publisher,
    balance: formatAmount((publisher.balance || 0) - formattedReward),
    updatedAt: new Date().toISOString()
  };
  
  const tasks = loadData('tasks');
  const newTask = { id: uuidv4(), title, description, reward: formattedReward, publisherId: creatorId, status: 'open', createdAt: new Date().toISOString() };
  tasks.push(newTask);
  saveData('users', users);
  saveData('tasks', tasks);
  res.json({ success: true, message: '任务发布成功', data: newTask });
});

app.put('/api/tasks/:id', (req, res) => {
  let tasks = loadData('tasks');
  let users = loadData('users');
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    const { title, description, reward, userId } = req.body;
    
    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: '只能修改可接单状态的任务' });
    }
    
    // 只有发布者或管理员可以更新
    if (task.publisherId !== userId) {
      const user = users.find(u => u.id === userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限更新此任务' });
      }
    }
    
    // 如果修改了奖励金额，需要处理余额
    if (reward !== undefined && formatAmount(reward) !== task.reward) {
      const formattedNewReward = formatAmount(reward);
      const publisherIndex = users.findIndex(u => u.id === task.publisherId);
      if (publisherIndex !== -1) {
        const publisher = users[publisherIndex];
        const rewardDiff = formattedNewReward - task.reward;
        
        if (rewardDiff > 0) {
          // 增加奖励，需要扣除更多余额
          if ((publisher.balance || 0) < rewardDiff) {
            return res.status(400).json({ success: false, message: '余额不足以增加奖励金额' });
          }
          users[publisherIndex] = {
            ...publisher,
            balance: formatAmount((publisher.balance || 0) - rewardDiff),
            updatedAt: new Date().toISOString()
          };
        } else if (rewardDiff < 0) {
          // 减少奖励，退回部分余额
          users[publisherIndex] = {
            ...publisher,
            balance: formatAmount((publisher.balance || 0) - rewardDiff),
            updatedAt: new Date().toISOString()
          };
        }
        saveData('users', users);
      }
    }
    
    tasks[taskIndex] = {
      ...task,
      title: title || task.title,
      description: description || task.description,
      reward: reward !== undefined ? formatAmount(reward) : task.reward,
      updatedAt: new Date().toISOString()
    };
    saveData('tasks', tasks);
    res.json({ success: true, message: '任务更新成功', data: tasks[taskIndex] });
  } else {
    res.status(404).json({ success: false, message: '任务不存在' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  let tasks = loadData('tasks');
  let users = loadData('users');
  const task = tasks.find(t => t.id === req.params.id);
  if (task) {
    const { userId } = req.body;
    
    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: '只能删除可接单状态的任务' });
    }
    
    // 只有发布者或管理员可以删除
    if (task.publisherId !== userId) {
      const user = users.find(u => u.id === userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限删除此任务' });
      }
    }
    
    // 退回金额给发布者
    const publisherIndex = users.findIndex(u => u.id === task.publisherId);
    if (publisherIndex !== -1) {
      const publisher = users[publisherIndex];
      users[publisherIndex] = {
        ...publisher,
        balance: formatAmount((publisher.balance || 0) + task.reward),
        updatedAt: new Date().toISOString()
      };
      saveData('users', users);
    }
    
    tasks = tasks.filter(t => t.id !== req.params.id);
    saveData('tasks', tasks);
    res.json({ success: true, message: '任务删除成功' });
  } else {
    res.status(404).json({ success: false, message: '任务不存在' });
  }
});

app.post('/api/tasks/:id/accept', (req, res) => {
  const tasks = loadData('tasks');
  const users = loadData('users');
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    const { acceptorId } = req.body;
    
    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: '任务已被接单或已完成' });
    }
    
    if (task.publisherId === acceptorId) {
      return res.status(400).json({ success: false, message: '不能接自己发布的任务' });
    }
    
    const acceptor = users.find(u => u.id === acceptorId);
    if (!acceptor) {
      return res.status(400).json({ success: false, message: '接单人不存在' });
    }
    
    // 检查信用分
    const creditScore = acceptor.creditScore || 100;
    if (creditScore < 30) {
      return res.status(400).json({ success: false, message: '您的信用分过低，无法接单' });
    }
    
    // 检查可接单数限制
    const limits = getLimitsByCreditScore(creditScore);
    const currentActiveTasks = tasks.filter(t => 
      t.acceptorId === acceptorId && t.status === 'in_progress'
    ).length;
    if (currentActiveTasks >= limits.maxAcceptTasks) {
      return res.status(400).json({ 
        success: false, 
        message: `您当前信用分可接${limits.maxAcceptTasks}单，已达到上限，请先完成现有任务` });
    }
    
    tasks[taskIndex] = {
      ...task,
      status: 'in_progress',
      acceptorId,
      acceptedAt: new Date().toISOString()
    };
    saveData('tasks', tasks);
    res.json({ success: true, message: '任务接单成功', data: tasks[taskIndex] });
  } else {
    res.status(404).json({ success: false, message: '任务不存在' });
  }
});

app.post('/api/tasks/:id/complete', (req, res) => {
  const tasks = loadData('tasks');
  const users = loadData('users');
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    const { userId } = req.body;
    
    if (task.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: '任务未进行中' });
    }
    
    // 只有发布者可以完成任务
    if (task.publisherId !== userId) {
      return res.status(403).json({ success: false, message: '只有任务发布者可以完成任务' });
    }
    
    const acceptorIndex = users.findIndex(u => u.id === task.acceptorId);
    
    if (acceptorIndex !== -1) {
      const platformFee = formatAmount(task.reward * PLATFORM_FEE_RATE);
      const acceptorIncome = formatAmount(task.reward - platformFee);
      
      // 给接单者增加信用分和金额
      users[acceptorIndex] = {
        ...users[acceptorIndex],
        balance: formatAmount((users[acceptorIndex].balance || 0) + acceptorIncome),
        creditScore: Math.min(100, (users[acceptorIndex].creditScore || 100) + 1),
        updatedAt: new Date().toISOString()
      };
      
      saveData('users', users);
    }
    
    tasks[taskIndex] = {
      ...task,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    saveData('tasks', tasks);
    res.json({ success: true, message: '任务完成', data: tasks[taskIndex] });
  } else {
    res.status(404).json({ success: false, message: '任务不存在' });
  }
});

app.post('/api/tasks/:id/cancel', (req, res) => {
  const tasks = loadData('tasks');
  let users = loadData('users');
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    const { userId } = req.body;
    
    if (task.status === 'completed') {
      return res.status(400).json({ success: false, message: '已完成任务无法取消' });
    }
    
    // 只有发布者可以取消任务
    if (task.publisherId !== userId) {
      return res.status(403).json({ success: false, message: '只有任务发布者可以取消任务' });
    }
    
    // 如果任务已经被接单，取消任务会影响发布者的信用分
    if (task.status === 'in_progress') {
      const publisherIndex = users.findIndex(u => u.id === task.publisherId);
      if (publisherIndex !== -1) {
        const publisher = users[publisherIndex];
        users[publisherIndex] = {
          ...publisher,
          creditScore: Math.max(0, (publisher.creditScore || 100) - 5),
          updatedAt: new Date().toISOString()
        };
      }
    }
    
    // 退回金额给发布者
    const publisherIndex = users.findIndex(u => u.id === task.publisherId);
    if (publisherIndex !== -1) {
      const publisher = users[publisherIndex];
      users[publisherIndex] = {
        ...publisher,
        balance: formatAmount((publisher.balance || 0) + task.reward),
        updatedAt: new Date().toISOString()
      };
      saveData('users', users);
    }
    
    tasks[taskIndex] = {
      ...task,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };
    saveData('tasks', tasks);
    res.json({ success: true, message: '任务已取消', data: tasks[taskIndex] });
  } else {
    res.status(404).json({ success: false, message: '任务不存在' });
  }
});

app.get('/api/users/:id/tasks', (req, res) => {
  const tasks = loadData('tasks');
  const userId = req.params.id;
  const myPublishedTasks = tasks.filter(t => t.publisherId === userId);
  const myAcceptedTasks = tasks.filter(t => t.acceptorId === userId);
  res.json({ success: true, data: { published: myPublishedTasks, accepted: myAcceptedTasks } });
});

// 服务
app.get('/api/services', (req, res) => {
  const services = loadData('services');
  const users = loadData('users');
  const { status, keyword, sortBy } = req.query;
  
  let filteredServices = services;
  
  if (status) {
    filteredServices = filteredServices.filter(s => s.status === status);
  }
  
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filteredServices = filteredServices.filter(s => 
      s.title.toLowerCase().includes(lowerKeyword) || 
      s.description.toLowerCase().includes(lowerKeyword)
    );
  }
  
  if (sortBy === 'newest') {
    filteredServices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'price-low') {
    filteredServices.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredServices.sort((a, b) => b.price - a.price);
  }
  
  const servicesWithUserInfo = filteredServices.map(service => {
    const provider = users.find(u => u.id === service.providerId);
    return {
      ...service,
      providerNickname: provider ? provider.nickname : '未知用户',
      providerCreditScore: provider ? (provider.creditScore || 100) : 100
    };
  });
  
  res.json({ success: true, data: servicesWithUserInfo });
});

app.get('/api/services/:id', (req, res) => {
  const services = loadData('services');
  const service = services.find(s => s.id === req.params.id);
  if (service) {
    res.json({ success: true, data: service });
  } else {
    res.status(404).json({ success: false, message: '服务不存在' });
  }
});

app.post('/api/services', (req, res) => {
  const { title, description, price, creatorId } = req.body;
  if (!title || !description || !price || !creatorId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }
  
  const formattedPrice = formatAmount(price);
  
  if (formattedPrice <= 0) {
    return res.status(400).json({ success: false, message: '服务价格必须大于0' });
  }
  
  if (title.length > 100) {
    return res.status(400).json({ success: false, message: '标题不能超过100字符' });
  }
  
  if (description.length > 1000) {
    return res.status(400).json({ success: false, message: '描述不能超过1000字符' });
  }
  
  const users = loadData('users');
  const provider = users.find(u => u.id === creatorId);
  if (!provider) {
    return res.status(400).json({ success: false, message: '服务提供者不存在' });
  }
  
  // 检查信用分
  const creditScore = provider.creditScore || 100;
  if (creditScore < 30) {
    return res.status(400).json({ success: false, message: '您的信用分过低，无法发布服务' });
  }
  
  // 检查可发布服务数量限制
  const limits = getLimitsByCreditScore(creditScore);
  const services = loadData('services');
  const currentActiveServices = services.filter(s => 
    s.providerId === creatorId && s.status === 'active'
  ).length;
  if (currentActiveServices >= limits.maxPublishServices) {
    return res.status(400).json({ 
      success: false, 
      message: `您当前信用分可发布${limits.maxPublishServices}个服务，已达到上限，请先下架部分服务` });
  }
  
  const newService = { id: uuidv4(), title, description, price: formattedPrice, providerId: creatorId, status: 'active', createdAt: new Date().toISOString() };
  services.push(newService);
  saveData('services', services);
  res.json({ success: true, message: '服务发布成功', data: newService });
});

app.put('/api/services/:id', (req, res) => {
  const services = loadData('services');
  const serviceIndex = services.findIndex(s => s.id === req.params.id);
  if (serviceIndex !== -1) {
    const service = services[serviceIndex];
    const { title, description, price, status, userId } = req.body;
    
    // 只有服务提供者或管理员可以更新
    if (service.providerId !== userId) {
      const users = loadData('users');
      const user = users.find(u => u.id === userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限更新此服务' });
      }
    }
    
    // 如果要下架，检查是否有进行中的订单
    if (status === 'inactive' && service.status === 'active') {
      const orders = loadData('orders');
      const hasActiveOrders = orders.some(o => 
        o.serviceId === service.id && 
        (o.status === 'pending' || o.status === 'processing')
      );
      if (hasActiveOrders) {
        return res.status(400).json({ 
          success: false, 
          message: '该服务有进行中的订单，请先处理完订单后再下架' 
        });
      }
    }
    
    services[serviceIndex] = { 
      ...service, 
      title: title || service.title,
      description: description || service.description,
      price: price !== undefined ? formatAmount(price) : service.price,
      status: status || service.status,
      updatedAt: new Date().toISOString() 
    };
    saveData('services', services);
    res.json({ success: true, message: '服务更新成功', data: services[serviceIndex] });
  } else {
    res.status(404).json({ success: false, message: '服务不存在' });
  }
});

app.delete('/api/services/:id', (req, res) => {
  let services = loadData('services');
  const service = services.find(s => s.id === req.params.id);
  if (service) {
    const { userId } = req.body;
    
    // 只有服务提供者或管理员可以删除
    if (service.providerId !== userId) {
      const users = loadData('users');
      const user = users.find(u => u.id === userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限删除此服务' });
      }
    }
    
    // 检查是否有进行中的订单
    const orders = loadData('orders');
    const hasActiveOrders = orders.some(o => 
      o.serviceId === service.id && 
      (o.status === 'pending' || o.status === 'processing')
    );
    
    if (hasActiveOrders) {
      return res.status(400).json({ success: false, message: '该服务有进行中的订单，无法删除，请先下架服务' });
    }
    
    services = services.filter(s => s.id !== req.params.id);
    saveData('services', services);
    res.json({ success: true, message: '服务删除成功' });
  } else {
    res.status(404).json({ success: false, message: '服务不存在' });
  }
});

// 订单
app.get('/api/orders', (req, res) => {
  const orders = loadData('orders');
  const status = req.query.status;
  const filteredOrders = status ? orders.filter(o => o.status === status) : orders;
  res.json({ success: true, data: filteredOrders });
});

app.get('/api/orders/:id', (req, res) => {
  const orders = loadData('orders');
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    res.json({ success: true, data: order });
  } else {
    res.status(404).json({ success: false, message: '订单不存在' });
  }
});

app.post('/api/services/:id/order', (req, res) => {
  const services = loadData('services');
  const orders = loadData('orders');
  const users = loadData('users');
  
  const service = services.find(s => s.id === req.params.id);
  if (service) {
    const { customerId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ success: false, message: '缺少客户ID' });
    }
    
    if (service.providerId === customerId) {
      return res.status(400).json({ success: false, message: '不能购买自己的服务' });
    }
    
    if (service.status !== 'active') {
      return res.status(400).json({ success: false, message: '该服务已下架' });
    }
    
    const customerIndex = users.findIndex(u => u.id === customerId);
    if (customerIndex === -1) {
      return res.status(400).json({ success: false, message: '客户不存在' });
    }
    
    const customer = users[customerIndex];
    
    // 检查信用分
    if ((customer.creditScore || 100) < 30) {
      return res.status(400).json({ success: false, message: '您的信用分过低，无法下单' });
    }
    
    if ((customer.balance || 0) < service.price) {
      return res.status(400).json({ success: false, message: '余额不足，请先充值' });
    }
    
    // 下单时直接扣除金额
    users[customerIndex] = {
      ...customer,
      balance: formatAmount((customer.balance || 0) - service.price),
      updatedAt: new Date().toISOString()
    };
    
    const newOrder = {
      id: uuidv4(),
      serviceId: service.id,
      serviceTitle: service.title,
      customerId,
      providerId: service.providerId,
      price: service.price,
      platformFee: formatAmount(service.price * PLATFORM_FEE_RATE),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    saveData('users', users);
    saveData('orders', orders);
    res.json({ success: true, message: '下单成功', data: newOrder });
  } else {
    res.status(404).json({ success: false, message: '服务不存在' });
  }
});

app.post('/api/orders/:id/accept', (req, res) => {
  const orders = loadData('orders');
  const users = loadData('users');
  const orderIndex = orders.findIndex(o => o.id === req.params.id);
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    const { userId } = req.body;
    
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '订单状态不允许接受' });
    }
    
    // 只有服务提供者可以接受订单
    if (order.providerId !== userId) {
      return res.status(403).json({ success: false, message: '只有服务提供者可以接受订单' });
    }
    
    // 检查信用分
    const provider = users.find(u => u.id === userId);
    if (provider && (provider.creditScore || 100) < 30) {
      return res.status(400).json({ success: false, message: '您的信用分过低，无法接受订单' });
    }
    
    orders[orderIndex] = {
      ...order,
      status: 'processing',
      acceptedAt: new Date().toISOString()
    };
    saveData('orders', orders);
    res.json({ success: true, message: '已接受订单', data: orders[orderIndex] });
  } else {
    res.status(404).json({ success: false, message: '订单不存在' });
  }
});

app.post('/api/orders/:id/complete', (req, res) => {
  const orders = loadData('orders');
  const users = loadData('users');
  const orderIndex = orders.findIndex(o => o.id === req.params.id);
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    const { userId } = req.body;
    
    if (order.status !== 'processing') {
      return res.status(400).json({ success: false, message: '订单未进行中' });
    }
    
    // 只有客户可以完成订单
    if (order.customerId !== userId) {
      return res.status(403).json({ success: false, message: '只有客户可以完成订单' });
    }
    
    const providerIndex = users.findIndex(u => u.id === order.providerId);
    
    if (providerIndex !== -1) {
      const providerIncome = formatAmount(order.price - order.platformFee);
      
      // 给服务提供者增加信用分和金额
      users[providerIndex] = {
        ...users[providerIndex],
        balance: formatAmount((users[providerIndex].balance || 0) + providerIncome),
        creditScore: Math.min(100, (users[providerIndex].creditScore || 100) + 1),
        updatedAt: new Date().toISOString()
      };
      
      saveData('users', users);
    }
    
    orders[orderIndex] = {
      ...order,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    saveData('orders', orders);
    res.json({ success: true, message: '订单已完成', data: orders[orderIndex] });
  } else {
    res.status(404).json({ success: false, message: '订单不存在' });
  }
});

app.post('/api/orders/:id/cancel', (req, res) => {
  const orders = loadData('orders');
  let users = loadData('users');
  const orderIndex = orders.findIndex(o => o.id === req.params.id);
  if (orderIndex !== -1) {
    const order = orders[orderIndex];
    const { userId } = req.body;
    
    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: '已完成订单无法取消' });
    }
    
    // 只有客户可以取消订单
    if (order.customerId !== userId) {
      return res.status(403).json({ success: false, message: '只有客户可以取消订单' });
    }
    
    // 如果订单已经被接受，取消订单会影响客户的信用分
    if (order.status === 'processing') {
      const customerIndex = users.findIndex(u => u.id === order.customerId);
      if (customerIndex !== -1) {
        const customer = users[customerIndex];
        users[customerIndex] = {
          ...customer,
          creditScore: Math.max(0, (customer.creditScore || 100) - 5),
          updatedAt: new Date().toISOString()
        };
      }
    }
    
    // 退回金额给客户
    const customerIndex = users.findIndex(u => u.id === order.customerId);
    if (customerIndex !== -1) {
      const customer = users[customerIndex];
      users[customerIndex] = {
        ...customer,
        balance: formatAmount((customer.balance || 0) + order.price),
        updatedAt: new Date().toISOString()
      };
      saveData('users', users);
    }
    
    orders[orderIndex] = {
      ...order,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };
    saveData('orders', orders);
    res.json({ success: true, message: '订单已取消', data: orders[orderIndex] });
  } else {
    res.status(404).json({ success: false, message: '订单不存在' });
  }
});

app.get('/api/users/:id/orders', (req, res) => {
  const orders = loadData('orders');
  const userId = req.params.id;
  const myOrders = orders.filter(o => o.customerId === userId);
  const myReceivedOrders = orders.filter(o => o.providerId === userId);
  res.json({ success: true, data: { my: myOrders, received: myReceivedOrders } });
});

// 论坛
app.get('/api/forum', (req, res) => {
  const posts = loadData('posts');
  const users = loadData('users');
  
  const postsWithUserInfo = posts.map(post => {
    const author = users.find(u => u.id === post.authorId);
    return {
      ...post,
      authorNickname: author ? author.nickname : '未知用户'
    };
  });
  
  res.json({ success: true, data: postsWithUserInfo });
});

app.get('/api/forum/:id', (req, res) => {
  const posts = loadData('posts');
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    res.json({ success: true, data: post });
  } else {
    res.status(404).json({ success: false, message: '帖子不存在' });
  }
});

app.post('/api/forum', (req, res) => {
  const { title, content, authorId } = req.body;
  if (!title || !content || !authorId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }
  
  if (title.length > 100) {
    return res.status(400).json({ success: false, message: '标题不能超过100字符' });
  }
  
  if (content.length > 2000) {
    return res.status(400).json({ success: false, message: '内容不能超过2000字符' });
  }
  
  const users = loadData('users');
  const author = users.find(u => u.id === authorId);
  if (!author) {
    return res.status(400).json({ success: false, message: '作者不存在' });
  }
  
  const posts = loadData('posts');
  const newPost = { id: uuidv4(), title, content, authorId, likes: 0, createdAt: new Date().toISOString() };
  posts.push(newPost);
  saveData('posts', posts);
  res.json({ success: true, message: '发帖成功', data: newPost });
});

app.delete('/api/forum/:id', (req, res) => {
  let posts = loadData('posts');
  const { userId } = req.body;
  const postIndex = posts.findIndex(p => p.id === req.params.id);
  
  if (postIndex !== -1) {
    const post = posts[postIndex];
    
    if (userId && userId !== post.authorId) {
      const users = loadData('users');
      const user = users.find(u => u.id === userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限删除此帖子' });
      }
    }
    
    posts = posts.filter(p => p.id !== req.params.id);
    saveData('posts', posts);
    res.json({ success: true, message: '帖子删除成功' });
  } else {
    res.status(404).json({ success: false, message: '帖子不存在' });
  }
});

app.post('/api/forum/:id/like', (req, res) => {
  const posts = loadData('posts');
  const { userId } = req.body;
  const postIndex = posts.findIndex(p => p.id === req.params.id);
  if (postIndex !== -1) {
    const post = posts[postIndex];
    // 检查是否已经点赞过
    const likedBy = post.likedBy || [];
    if (likedBy.includes(userId)) {
      return res.status(400).json({ success: false, message: '您已经点赞过了' });
    }
    
    posts[postIndex] = {
      ...post,
      likes: post.likes + 1,
      likedBy: [...likedBy, userId]
    };
    saveData('posts', posts);
    res.json({ success: true, data: posts[postIndex] });
  } else {
    res.status(404).json({ success: false, message: '帖子不存在' });
  }
});

// 用户
app.get('/api/users', (req, res) => {
  const users = loadData('users');
  const usersWithoutPassword = users.map(u => {
    const { password, ...rest } = u;
    return rest;
  });
  res.json({ success: true, data: usersWithoutPassword });
});

app.get('/api/users/:id', (req, res) => {
  const users = loadData('users');
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    const tasks = loadData('tasks');
    const services = loadData('services');
    
    // 获取用户当前进行中的任务数（已接的）
    const currentActiveTasks = tasks.filter(t => 
      t.acceptorId === user.id && t.status === 'in_progress'
    ).length;
    
    // 获取用户当前已发布的活跃服务数
    const currentActiveServices = services.filter(s => 
      s.providerId === user.id && s.status === 'active'
    ).length;
    
    const limits = getLimitsByCreditScore(user.creditScore);
    
    const { password, ...userWithoutPassword } = user;
    res.json({ 
      success: true, 
      data: {
        ...userWithoutPassword,
        limits,
        currentActiveTasks,
        currentActiveServices
      } 
    });
  } else {
    res.status(404).json({ success: false, message: '用户不存在' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const users = loadData('users');
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex !== -1) {
    const { nickname, balance, creditScore, role, userId } = req.body;
    
    // 检查权限：只有本人或管理员可以更新
    if (userId !== req.params.id) {
      const currentUser = users.find(u => u.id === userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ success: false, message: '无权限更新此用户' });
      }
    }
    
    const updatedUser = {
      ...users[userIndex],
      nickname: nickname !== undefined ? nickname : users[userIndex].nickname,
      updatedAt: new Date().toISOString()
    };
    
    // 只有管理员可以修改余额、信用分和角色
    const currentUser = users.find(u => u.id === userId);
    if (currentUser && currentUser.role === 'admin') {
      if (balance !== undefined) updatedUser.balance = balance;
      if (creditScore !== undefined) updatedUser.creditScore = Math.max(0, Math.min(100, creditScore)); // 限制信用分范围
      if (role !== undefined) updatedUser.role = role;
    }
    
    users[userIndex] = updatedUser;
    saveData('users', users);
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ success: true, message: '用户更新成功', data: userWithoutPassword });
  } else {
    res.status(404).json({ success: false, message: '用户不存在' });
  }
});

app.post('/api/users/:id/recharge', (req, res) => {
  const users = loadData('users');
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex !== -1) {
    const { amount, userId } = req.body;
    
    // 检查权限：只有管理员可以充值
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以充值' });
    }
    
    // 检查金额是否存在且是有效数字
    if (amount === undefined || amount === null || isNaN(amount)) {
      return res.status(400).json({ success: false, message: '请输入有效的充值金额' });
    }
    
    const formattedAmount = formatAmount(amount);
    
    // 检查金额是否大于0
    if (formattedAmount <= 0) {
      return res.status(400).json({ success: false, message: '充值金额必须大于0' });
    }
    
    // 最小充值金额
    if (formattedAmount < 1) {
      return res.status(400).json({ success: false, message: '单次充值金额不能少于1元' });
    }
    
    // 限制单次充值金额，防止异常充值
    if (formattedAmount > 10000) {
      return res.status(400).json({ success: false, message: '单次充值金额不能超过10000元' });
    }
    
    users[userIndex] = {
      ...users[userIndex],
      balance: formatAmount((users[userIndex].balance || 0) + formattedAmount),
      updatedAt: new Date().toISOString()
    };
    saveData('users', users);
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ success: true, message: '充值成功', data: userWithoutPassword });
  } else {
    res.status(404).json({ success: false, message: '用户不存在' });
  }
});

app.post('/api/users/:id/change-password', (req, res) => {
  const users = loadData('users');
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex !== -1) {
    const { currentPassword, newPassword, userId } = req.body;
    
    // 只有本人可以修改密码
    if (userId !== req.params.id) {
      return res.status(403).json({ success: false, message: '无权限修改密码' });
    }
    
    // 验证当前密码
    if (users[userIndex].password !== currentPassword) {
      return res.status(400).json({ success: false, message: '当前密码错误' });
    }
    
    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于6位' });
    }
    
    users[userIndex] = {
      ...users[userIndex],
      password: newPassword,
      updatedAt: new Date().toISOString()
    };
    saveData('users', users);
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ success: true, message: '密码修改成功', data: userWithoutPassword });
  } else {
    res.status(404).json({ success: false, message: '用户不存在' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const users = loadData('users');
  const user = users.find(u => u.username === req.body.username && u.password === req.body.password);
  if (user) {
    const tasks = loadData('tasks');
    const services = loadData('services');
    
    // 获取用户当前进行中的任务数（已接的）
    const currentActiveTasks = tasks.filter(t => 
      t.acceptorId === user.id && t.status === 'in_progress'
    ).length;
    
    // 获取用户当前已发布的活跃服务数
    const currentActiveServices = services.filter(s => 
      s.providerId === user.id && s.status === 'active'
    ).length;
    
    const limits = getLimitsByCreditScore(user.creditScore);
    
    const { password, ...userWithoutPassword } = user;
    res.json({ 
      success: true, 
      data: {
        ...userWithoutPassword,
        limits,
        currentActiveTasks,
        currentActiveServices
      } 
    });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const users = loadData('users');
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码为必填项' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: '用户名已存在' });
  }
  const newUser = { id: uuidv4(), username, password, nickname: nickname || username, role: 'user', balance: 0, creditScore: 100, createdAt: new Date().toISOString() };
  users.push(newUser);
  saveData('users', users);
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ success: true, message: '注册成功', data: userWithoutPassword });
});

// 管理员功能
app.get('/api/admin/users', (req, res) => {
  const users = loadData('users');
  const usersWithoutPassword = users.map(u => {
    const { password, ...rest } = u;
    return rest;
  });
  res.json({ success: true, data: usersWithoutPassword });
});

app.post('/api/admin/users', (req, res) => {
  const users = loadData('users');
  const { username, password, nickname, role, balance, creditScore } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码为必填项' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: '用户名已存在' });
  }
  const newUser = { 
    id: uuidv4(), 
    username, 
    password, 
    nickname: nickname || username, 
    role: role || 'user', 
    balance: balance !== undefined ? formatAmount(balance) : 0, 
    creditScore: creditScore !== undefined ? creditScore : 100, 
    createdAt: new Date().toISOString() 
  };
  users.push(newUser);
  saveData('users', users);
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ success: true, message: '用户添加成功', data: userWithoutPassword });
});

app.put('/api/admin/users/:id', (req, res) => {
  const users = loadData('users');
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...req.body, updatedAt: new Date().toISOString() };
    saveData('users', users);
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ success: true, message: '用户更新成功', data: userWithoutPassword });
  } else {
    res.status(404).json({ success: false, message: '用户不存在' });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  let users = loadData('users');
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: '无法删除管理员账户' });
    }
    
    // 处理用户相关的数据
    let tasks = loadData('tasks');
    let services = loadData('services');
    let orders = loadData('orders');
    let posts = loadData('posts');
    
    // 1. 处理任务 - 取消该用户发布的进行中的任务，退回金额
    tasks = tasks.map(task => {
      if (task.publisherId === user.id && task.status !== 'completed' && task.status !== 'cancelled') {
        // 退回任务金额给发布者（但用户要被删除了，这里我们先不处理金额，直接标记任务取消）
        return { ...task, status: 'cancelled', cancelledAt: new Date().toISOString() };
      }
      // 如果用户是接单者，任务回到可接单状态
      if (task.acceptorId === user.id && task.status === 'in_progress') {
        return { ...task, status: 'open', acceptorId: null, acceptedAt: null };
      }
      return task;
    });
    
    // 2. 处理服务 - 下架该用户的服务
    services = services.map(service => {
      if (service.providerId === user.id) {
        return { ...service, status: 'inactive', updatedAt: new Date().toISOString() };
      }
      return service;
    });
    
    // 3. 处理订单 - 取消进行中的订单
    orders = orders.map(order => {
      if ((order.customerId === user.id || order.providerId === user.id) && 
          order.status !== 'completed' && order.status !== 'cancelled') {
        // 如果是客户，退回金额
        if (order.customerId === user.id) {
          const customerIndex = users.findIndex(u => u.id === user.id);
          if (customerIndex !== -1) {
            const customer = users[customerIndex];
            users[customerIndex] = {
              ...customer,
              balance: formatAmount((customer.balance || 0) + order.price),
              updatedAt: new Date().toISOString()
            };
          }
        }
        return { ...order, status: 'cancelled', cancelledAt: new Date().toISOString() };
      }
      return order;
    });
    
    // 4. 处理帖子 - 删除用户的帖子
    posts = posts.filter(post => post.authorId !== user.id);
    
    // 保存所有数据
    saveData('tasks', tasks);
    saveData('services', services);
    saveData('orders', orders);
    saveData('posts', posts);
    
    // 最后删除用户
    users = users.filter(u => u.id !== req.params.id);
    saveData('users', users);
    
    res.json({ success: true, message: '用户删除成功' });
  } else {
    res.status(404).json({ success: false, message: '用户不存在' });
  }
});

app.get('/api/admin/tasks', (req, res) => {
  const tasks = loadData('tasks');
  res.json({ success: true, data: tasks });
});

app.get('/api/admin/services', (req, res) => {
  const services = loadData('services');
  res.json({ success: true, data: services });
});

app.get('/api/admin/orders', (req, res) => {
  const orders = loadData('orders');
  res.json({ success: true, data: orders });
});

app.get('/api/admin/forum', (req, res) => {
  const posts = loadData('posts');
  res.json({ success: true, data: posts });
});

app.get('/api/admin/stats', (req, res) => {
  const users = loadData('users');
  const tasks = loadData('tasks');
  const services = loadData('services');
  const orders = loadData('orders');
  const posts = loadData('posts');
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const todayTasks = tasks.filter(t => new Date(t.createdAt) >= today);
  const todayServices = services.filter(s => new Date(s.createdAt) >= today);
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const todayPosts = posts.filter(p => new Date(p.createdAt) >= today);
  
  const openTasks = tasks.filter(t => t.status === 'open');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const cancelledTasks = tasks.filter(t => t.status === 'cancelled');
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const processingOrders = orders.filter(o => o.status === 'processing');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  
  const activeServices = services.filter(s => s.status === 'active');
  const inactiveServices = services.filter(s => s.status === 'inactive');
  
  const totalUserBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalTaskReward = completedTasks.reduce((sum, t) => sum + t.reward, 0);
  const totalOrderAmount = completedOrders.reduce((sum, o) => sum + o.price, 0);
  const totalPlatformFee = completedOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
  
  const stats = {
    userCount: users.length,
    taskCount: tasks.length,
    serviceCount: services.length,
    orderCount: orders.length,
    postCount: posts.length,
    
    todayCount: {
      tasks: todayTasks.length,
      services: todayServices.length,
      orders: todayOrders.length,
      posts: todayPosts.length
    },
    
    taskByStatus: {
      open: openTasks.length,
      inProgress: inProgressTasks.length,
      completed: completedTasks.length,
      cancelled: cancelledTasks.length
    },
    
    orderByStatus: {
      pending: pendingOrders.length,
      processing: processingOrders.length,
      completed: completedOrders.length,
      cancelled: cancelledOrders.length
    },
    
    serviceByStatus: {
      active: activeServices.length,
      inactive: inactiveServices.length
    },
    
    financial: {
      totalUserBalance,
      totalTaskReward,
      totalOrderAmount,
      totalPlatformFee
    }
  };
  res.json({ success: true, data: stats });
});

app.get('/api/platform/fee', (req, res) => {
  res.json({ success: true, data: { rate: PLATFORM_FEE_RATE, description: '平台收取 8% 服务费' } });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API 不存在' });
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  校园任务互助平台 API 服务`);
  console.log(`  本地访问地址: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
