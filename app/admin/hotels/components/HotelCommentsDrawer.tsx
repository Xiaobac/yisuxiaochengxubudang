import { Drawer, Avatar, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { Comment } from '@/app/types';

interface HotelCommentsDrawerProps {
  visible: boolean;
  comments: Comment[];
  loading: boolean;
  onClose: () => void;
  onDelete: (commentId: number) => Promise<void>;
}

export function HotelCommentsDrawer({
  visible,
  comments,
  loading,
  onClose,
  onDelete
}: HotelCommentsDrawerProps) {
  return (
    <Drawer
      title="酒店评论"
      placement="right"
      size={500}
      onClose={onClose}
      open={visible}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无评论</div>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((item) => (
            <div key={item.id} className="border-b last:border-0 pb-4 flex gap-3">
              <Avatar>{item.user.name?.[0] || 'U'}</Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{item.user.name || '匿名用户'}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                      {item.score && <span className="ml-2 text-yellow-500">{item.score.toFixed(1)}分</span>}
                    </div>
                  </div>
                  <Popconfirm
                    title="确定删除这条评论吗？"
                    onConfirm={() => onDelete(item.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </div>
                <div className="mt-2 text-gray-600">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
