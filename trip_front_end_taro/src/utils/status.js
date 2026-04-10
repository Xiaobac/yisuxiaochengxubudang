/**
 * 订单状态映射工具
 */

const STATUS_TEXT_MAP = {
  pending: '待确认',
  confirmed: '已确认',
  checked_in: '已入住',
  checked_out: '已退房',
  completed: '已完成',
  cancelled: '已取消',
};

export const getStatusText = (status) => STATUS_TEXT_MAP[status] || status;

/**
 * 获取状态颜色（需要传入 tokens 以支持主题）
 */
export const getStatusColor = (status, tokens) => {
  const colorMap = {
    pending: tokens['--color-warning'],
    confirmed: tokens['--color-success'],
    cancelled: tokens['--color-text-tertiary'],
    completed: tokens['--color-info'],
    checked_in: tokens['--color-success'],
    checked_out: tokens['--color-text-tertiary'],
  };
  return colorMap[status] || tokens['--color-text-secondary'];
};
