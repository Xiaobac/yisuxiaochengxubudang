import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Textarea, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useTheme } from '../../utils/useTheme';
import { post } from '../../services/request';
import './index.css';

const AiChatWidget = () => {
  const { cssVars } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'msg_0', role: 'assistant', content: '您好！我是您的旅行助手。请问您想去哪里旅行，或者对酒店有什么要求？' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastMsgId, setLastMsgId] = useState('msg_0');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHidden, setIsHidden] = useState(false);
  const [hideSide, setHideSide] = useState(null); // 'left' 或 'right'

  const hideTimerRef = useRef(null);
  const dragState = useRef({ 
    dragging: false, 
    startX: 0, 
    startY: 0, 
    startPosX: 0, 
    startPosY: 0, 
    moved: false,
    wasHidden: false, // 记录触摸开始时按钮是否隐藏
  });
  const screenRef = useRef({ w: 375, h: 667 });

  // 常量定义
  const BTN_SIZE = 54;           // 按钮高度固定
  const NORMAL_WIDTH = 54;       // 正常宽度（圆形）
  const HIDDEN_WIDTH = 5;       // 隐藏后宽度（细条）
  const EDGE_THRESHOLD = 20;     // 距离边缘多少像素触发隐藏准备
  const HIDE_DELAY = 3000;       // 3秒

  // 初始化屏幕尺寸和默认位置
  useEffect(() => {
  // 使用 getSystemInfoSync 获取窗口信息（兼容旧版 Taro）
  const info = Taro.getSystemInfoSync();
  // 注意：返回的对象中宽度/高度字段为 windowWidth / windowHeight
  const { windowWidth, windowHeight } = info;
  screenRef.current = { w: windowWidth, h: windowHeight };
  setPos({ x: windowWidth - BTN_SIZE - 16, y: windowHeight - BTN_SIZE - 100 });
}, []);

  // 检查并启动隐藏定时器
  const checkAndStartHideTimer = () => {
    // 正在拖拽或已经隐藏时不启动
    if (dragState.current.dragging || isHidden) return;

    const { w } = screenRef.current;
    const { x } = pos;
    const nearLeft = x <= EDGE_THRESHOLD;
    const nearRight = x >= w - NORMAL_WIDTH - EDGE_THRESHOLD;

    // 清除之前的定时器
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (nearLeft || nearRight) {
      const side = nearLeft ? 'left' : 'right';
      hideTimerRef.current = setTimeout(() => {
        // 隐藏到对应边缘，使用隐藏后的宽度计算位置
        setPos(prev => ({
          ...prev,
          x: side === 'left' ? 0 : w - HIDDEN_WIDTH,
        }));
        setIsHidden(true);
        setHideSide(side);
        hideTimerRef.current = null;
      }, HIDE_DELAY);
    }
  };

  // 位置变化时触发检查
  useEffect(() => {
    checkAndStartHideTimer();
  }, [pos, isHidden]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e) => {
    // 记录触摸开始时是否为隐藏状态（用于触摸结束时判断是否打开窗口）
    dragState.current.wasHidden = isHidden;

    // 如果当前是隐藏状态，立即恢复并调整位置
    if (isHidden) {
      const { w } = screenRef.current;
      let newX = pos.x;
      if (hideSide === 'right') {
        newX = w - NORMAL_WIDTH; // 恢复后右边缘贴边
      } else if (hideSide === 'left') {
        newX = 0; // 左边缘本来就是0
      }
      setPos(prev => ({ ...prev, x: newX }));
      setIsHidden(false);
      setHideSide(null);
    }

    // 清除任何待执行的定时器（用户开始触摸，取消隐藏）
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const touch = e.touches[0];
    dragState.current = {
      ...dragState.current,
      dragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: pos.x, // 注意：如果上面恢复了位置，这里应该使用新位置，但 setPos 是异步，所以直接使用当前的 pos 可能还是旧值
      startPosY: pos.y,
      moved: false,
    };
    // 由于 setPos 是异步，直接使用 pos 可能不对，需要手动计算新位置或者使用乐观更新
    // 简单起见，我们在恢复时同步计算 newX 并用它作为 startPosX
    if (dragState.current.wasHidden) {
      const { w } = screenRef.current;
      const newX = hideSide === 'right' ? w - NORMAL_WIDTH : 0;
      dragState.current.startPosX = newX;
      dragState.current.startPosY = pos.y; // Y 不变
    }
  };

  const handleTouchMove = (e) => {
    if (!dragState.current.dragging) return;

    // 只要有移动，就取消隐藏定时器
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const touch = e.touches[0];
    const dx = touch.clientX - dragState.current.startX;
    const dy = touch.clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragState.current.moved = true;
    }
    const { w, h } = screenRef.current;
    const newX = Math.min(Math.max(0, dragState.current.startPosX + dx), w - NORMAL_WIDTH);
    const newY = Math.min(Math.max(0, dragState.current.startPosY + dy), h - BTN_SIZE);
    setPos({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    // 只有非隐藏状态下且没有移动才打开聊天窗口
    if (!dragState.current.moved && !dragState.current.wasHidden) {
      setIsOpen(true);
    }
    dragState.current.dragging = false;
    // 松手后重新检查是否需要启动隐藏定时器
    checkAndStartHideTimer();
  };

  useEffect(() => {
    if (messages.length > 0) {
      setLastMsgId(`msg_${messages.length - 1}`);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      id: `msg_${messages.length}`,
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await post('/ai/recommend', {
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      });

      const assistantMsg = {
        id: `msg_${messages.length + 1}`,
        role: 'assistant',
        content: data.content || '我收到您的消息了！'
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: '抱歉，服务暂时不可用，请稍后再试。'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='ai-assistant-wrapper' style={cssVars}>
      {/* 可拖拽悬浮按钮 */}
      <View
        className='ai-float-btn'
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: isHidden ? `${HIDDEN_WIDTH}px` : `${NORMAL_WIDTH}px`,
          height: `${BTN_SIZE}px`,
          borderRadius: isHidden
            ? hideSide === 'left'
              ? '0 8px 8px 0'
              : '8px 0 0 8px'
            : '50%',
          transition: 'width 0.3s, border-radius 0.3s',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!isHidden && (
  <Image
    src={require('../../assets/robot.png')}
    className='ai-btn-icon'
    mode='aspectFit'
  />
)}
      </View>

      {/* 聊天主窗口 */}
      {isOpen && (
        <View className='ai-chat-window'>
          <View className='chat-header'>
            <View className='header-left'>
              <Text className='header-title'>AI 旅行助手</Text>
            </View>
            <View className='header-close' onClick={() => setIsOpen(false)}>×</View>
          </View>

          <ScrollView
            className='chat-scroll-view'
            scrollY
            scrollIntoView={lastMsgId}
            scrollWithAnimation
          >
            {messages.map((item, index) => (
              <View
                key={item.id}
                id={`msg_${index}`}
                className={`message-row ${item.role === 'user' ? 'user-row' : 'bot-row'}`}
              >
                <View className='message-bubble'>
                  <Text className='message-text'>{item.content}</Text>
                </View>
              </View>
            ))}
            {loading && (
              <View className='message-row bot-row'>
                <View className='message-bubble loading-bubble'>
                  <View className='dot-flashing'></View>
                </View>
              </View>
            )}
          </ScrollView>

          <View className='chat-input-bar'>
            <Textarea
              className='chat-input'
              value={input}
              onInput={e => setInput(e.detail.value)}
              placeholder='我想去上海预订酒店...'
              autoHeight
              fixed
              cursorSpacing={20}
            />
            <Button
              className='chat-send-btn'
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              发送
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default AiChatWidget;