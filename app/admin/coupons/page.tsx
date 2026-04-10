'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Popconfirm,
  App,
  Empty,
  Tag,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAdminAuth } from '@/app/hooks/useAuth';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/app/services/coupon';
import type { Coupon } from '@/app/types';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { user, loading: authLoading } = useAdminAuth();

  useEffect(() => {
    if (user) {
      fetchCoupons();
    }
  }, [user]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await getCoupons();
      if (res.success && res.data) {
        setCoupons(res.data as Coupon[]);
      }
    } catch {
      message.error('获取优惠券列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCoupon(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Coupon) => {
    setEditingCoupon(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      discount: record.discount,
      minSpend: record.minSpend,
      points: record.points || 0,
      dateRange: [dayjs(record.validFrom), dayjs(record.validTo)],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteCoupon(id);
      if (res.success) {
        message.success('删除成功');
        setCoupons(coupons.filter(c => c.id !== id));
      } else {
        message.error(res.error || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        code: values.code,
        name: values.name,
        description: values.description || '',
        discount: values.discount,
        minSpend: values.minSpend || 0,
        points: values.points || 0,
        validFrom: values.dateRange[0].format('YYYY-MM-DD'),
        validTo: values.dateRange[1].format('YYYY-MM-DD'),
      };

      if (editingCoupon) {
        const res = await updateCoupon(editingCoupon.id, payload);
        if (res.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchCoupons();
        } else {
          message.error(res.error || '更新失败');
        }
      } else {
        const res = await createCoupon(payload);
        if (res.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchCoupons();
        } else {
          message.error(res.error || '创建失败');
        }
      }
    } catch {
      // form validation
    }
  };

  const columns: TableColumnsType<Coupon> = [
    {
      title: '优惠券代码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '折扣',
      key: 'discount',
      render: (_: unknown, record: Coupon) => (
        <span>
          减{record.discount}元
          {record.minSpend > 0 && <span style={{ color: '#999', marginLeft: 4 }}>（满{record.minSpend}可用）</span>}
        </span>
      ),
    },
    {
      title: '兑换积分',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => points || 0,
    },
    {
      title: '有效期',
      key: 'validity',
      render: (_: unknown, record: Coupon) => (
        <span>
          {dayjs(record.validFrom).format('YYYY-MM-DD')} ~ {dayjs(record.validTo).format('YYYY-MM-DD')}
        </span>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: Coupon) => {
        const now = dayjs();
        const isExpired = now.isAfter(dayjs(record.validTo));
        const isNotStarted = now.isBefore(dayjs(record.validFrom));
        if (isExpired) return <Tag color="default">已过期</Tag>;
        if (isNotStarted) return <Tag color="orange">未开始</Tag>;
        return <Tag color="green">生效中</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Coupon) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该优惠券？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (authLoading) {
    return <div style={{ textAlign: 'center', padding: '100px 0' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>优惠券管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增优惠券
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={coupons}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="暂无优惠券" /> }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCoupon ? '编辑优惠券' : '新增优惠券'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        forceRender
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="优惠券代码"
            name="code"
            rules={[{ required: true, message: '请输入优惠券代码' }]}
          >
            <Input placeholder="请输入优惠券代码" />
          </Form.Item>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入优惠券名称" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea placeholder="请输入描述" rows={2} />
          </Form.Item>
          <Space size="large">
            <Form.Item
              label="折扣金额（元）"
              name="discount"
              rules={[{ required: true, message: '请输入折扣金额' }]}
            >
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item label="最低消费（元）" name="minSpend">
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
          </Space>
          <Form.Item label="兑换所需积分" name="points">
            <InputNumber min={0} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item
            label="有效期"
            name="dateRange"
            rules={[{ required: true, message: '请选择有效期' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
