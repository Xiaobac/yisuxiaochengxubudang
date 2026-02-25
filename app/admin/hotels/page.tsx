'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, App, Form } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getHotels } from '@/app/services/hotel';
import { getCommentsByHotelId, deleteComment } from '@/app/services/comment';
import { updateHotelStatus } from '@/app/services/review';
import { getLocations } from '@/app/services/admin';
import type { Hotel, Location, Comment } from '@/app/types';
import { HotelDetailsDrawer } from './components/HotelDetailsDrawer';
import { HotelCommentsDrawer } from './components/HotelCommentsDrawer';
import { useHotelTableColumns } from './components/useHotelTableColumns';

export default function HotelManagementPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  // Drawer states
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  // Comments states
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const { message } = App.useApp();

  useEffect(() => {
    fetchLocations();
    fetchHotels(1, 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await getLocations();
      setLocations(res.data || []);
    } catch (error) {
      console.error('Fetch locations error:', error);
    }
  };

  const fetchHotels = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const params: any = {
        page: page,
        limit: pageSize
      };

      if (searchText) params.keyword = searchText;
      if (selectedLocation) params.locationId = selectedLocation;
      if (selectedStatus) params.status = selectedStatus;

      const res = await getHotels(params);
      if (res.success) {
        setHotels(res.data || []);
        setPagination(prev => ({
           ...prev,
           current: page,
           pageSize: pageSize,
           total: res.total || 0
        }));
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error);
      message.error('获取酒店列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchHotels(1, pagination.pageSize);
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedLocation(undefined);
    setSelectedStatus(undefined);
    fetchHotels(1, pagination.pageSize);
  };

  const handleTableChange = (newPagination: any) => {
      fetchHotels(newPagination.current, newPagination.pageSize);
  };

  const handleView = (record: Hotel) => {
    setSelectedHotel(record);
    setDrawerVisible(true);
  };

  const handleViewComments = async (hotelId: number) => {
    setCommentsVisible(true);
    setCommentsLoading(true);
    try {
      const res = await getCommentsByHotelId(hotelId);
      if (res.success && res.data) {
        setComments(res.data);
      } else {
        message.error(res.message || '获取评论失败');
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
      message.error('获取评论失败');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const res = await deleteComment(commentId);
      if (res.success) {
        message.success('删除评论成功');
        setComments(comments.filter(c => c.id !== commentId));
      } else {
        message.error(res.message || '删除评论失败');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      message.error('删除评论失败');
    }
  };

  const handleStatusChange = async (hotelId: number, newStatus: string) => {
    try {
      await updateHotelStatus(hotelId, newStatus);
      message.success('状态更新成功');
      fetchHotels();
    } catch (error: any) {
      console.error('状态更新失败:', error);
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const columns = useHotelTableColumns({
    onView: handleView,
    onViewComments: handleViewComments,
    onStatusChange: handleStatusChange
  });

  return (
    <div>
      <div style={{ marginBottom: 16 }} className="p-4 bg-white rounded-lg shadow-sm">
        <Form layout="inline">
            <Form.Item label="搜索">
                <Input
                    placeholder="酒店名称/地址"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 200 }}
                />
            </Form.Item>
            <Form.Item label="城市">
                <Select
                    allowClear
                    placeholder="选择城市"
                    style={{ width: 150 }}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    options={locations.map(loc => ({ label: loc.name, value: loc.id }))}
                    popupStyle={{ background: '#fff' }}
                />
            </Form.Item>
            <Form.Item label="状态">
                <Select
                    allowClear
                    placeholder="状态"
                    style={{ width: 120 }}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={[
                        { label: '已发布', value: 'published' },
                        { label: '待审核', value: 'pending' },
                        { label: '已下线', value: 'offline' },
                        { label: '已拒绝', value: 'rejected' },
                    ]}
                    popupStyle={{ background: '#fff' }}
                />
            </Form.Item>
            <Form.Item>
                <Space>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                </Space>
            </Form.Item>
        </Form>
      </div>

      <Table
        columns={columns}
        dataSource={hotels}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <HotelDetailsDrawer
        visible={drawerVisible}
        hotel={selectedHotel}
        onClose={() => setDrawerVisible(false)}
      />

      <HotelCommentsDrawer
        visible={commentsVisible}
        comments={comments}
        loading={commentsLoading}
        onClose={() => setCommentsVisible(false)}
        onDelete={handleDeleteComment}
      />
    </div>
  );
}
