const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 验证必填字段
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }

    // 验证角色
    if (!['merchant', 'admin'].includes(role)) {
      return res.status(400).json({ message: '角色必须是 merchant 或 admin' });
    }

    // 检查用户名是否已存在
    if (store.users.getByUsername(username)) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    if (store.users.getByEmail(email)) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = store.users.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: '注册成功',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ message: '请输入用户名和密码' });
    }

    // 查找用户
    const user = store.users.getByUsername(username);
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 返回 token 和用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: '登录成功',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = store.users.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
