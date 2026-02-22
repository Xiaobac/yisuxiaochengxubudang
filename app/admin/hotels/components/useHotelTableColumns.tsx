import { Button, Popconfirm, Space, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  EyeOutlined,
  CommentOutlined,
  PoweroffOutlined,
  StopOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { Hotel } from '@/app/types';

interface UseHotelTableColumnsProps {
  onView: (hotel: Hotel) => void;
  onViewComments: (hotelId: number) => void;
  onStatusChange: (hotelId: number, status: string) => Promise<void>;
}

export function useHotelTableColumns({
  onView,
  onViewComments,
  onStatusChange
}: UseHotelTableColumnsProps): TableColumnsType<Hotel> {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '酒店名称',
      dataIndex: 'nameZh',
      key: 'nameZh',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-400 text-xs">{record.nameEn}</div>
        </div>
      ),
    },
    {
      title: '城市',
      key: 'location',
      render: (_, record) => record.location?.name || '未知',
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      render: (score) => score ? `${score.toFixed(1)}分` : '暂无评分',
    },
    {
      title: '商户',
      key: 'merchant',
      render: (_, record) => record.merchant?.name || record.merchant?.email || '未知',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'published' ? 'success' :
          status === 'pending' ? 'processing' :
          status === 'rejected' ? 'error' :
          'default';
        const text =
          status === 'published' ? '已发布' :
          status === 'pending' ? '待审核' :
          status === 'rejected' ? '已拒绝' :
          '已下线';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} type="link" onClick={() => onView(record)}>查看</Button>
          <Button icon={<CommentOutlined />} type="link" onClick={() => onViewComments(record.id)}>评论</Button>
          {record.status === 'published' && (
            <>
              <Popconfirm
                title="确定要强制下线该酒店吗？"
                description="下线后用户将无法检索到该酒店"
                onConfirm={() => onStatusChange(record.id, 'offline')}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<PoweroffOutlined />}>
                  下线
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定要驳回该酒店吗？"
                description="酒店状态将变为已拒绝，商户需重新提交"
                onConfirm={() => onStatusChange(record.id, 'rejected')}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<StopOutlined />}>
                  驳回
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'offline' && (
            <Popconfirm
              title="确定要恢复该酒店上线吗？"
              onConfirm={() => onStatusChange(record.id, 'published')}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" style={{color: 'green'}} icon={<CheckOutlined />}>
                上线
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
}
