'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, CouponPayload } from '@/app/services/coupon';
import { ApiResponse } from '@/app/types';

interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string;
  discount: number;
  minSpend: number;
  points: number;
  validFrom: string;
  validTo: string;
}

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount: '',
    minSpend: '',
    points: '',
    validFrom: '',
    validTo: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role?.name !== 'ADMIN')) {
      router.push('/auth/login');
      return;
    }
    if (user?.role?.name === 'ADMIN') {
      fetchCoupons();
    }
  }, [user, authLoading, router]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await getCoupons();
      if (res.success && res.data) {
        setCoupons(res.data as Coupon[]);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这张优惠券吗？')) return;
    try {
      const res = await deleteCoupon(id);
      if (res.success) {
        setCoupons(coupons.filter(c => c.id !== id));
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败');
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discount: coupon.discount.toString(),
        minSpend: coupon.minSpend ? coupon.minSpend.toString() : '',
        points: coupon.points ? coupon.points.toString() : '0',
        validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
        validTo: new Date(coupon.validTo).toISOString().split('T')[0],
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        discount: '',
        points: '',
        minSpend: '',
        validFrom: '',
        validTo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discount: parseFloat(formData.discount),
        points: formData.points ? parseInt(formData.points) : 0,
        minSpend: formData.minSpend ? parseFloat(formData.minSpend) : 0
      } as CouponPayload;

      if (editingCoupon) {
        const res = await updateCoupon(editingCoupon.id, payload);
        if (res.success && res.data) {
          setCoupons(coupons.map(c => c.id === editingCoupon.id ? (res.data as unknown as Coupon) : c));
          setIsModalOpen(false);
        } else {
          alert(res.message);
        }
      } else {
        const res = await createCoupon(payload);
        if (res.success && res.data) {
          setCoupons([(res.data as unknown as Coupon), ...coupons]);
          setIsModalOpen(false);
        } else {
          alert(res.message);
        }
      }
    } catch (error) {
      console.error('Operation failed:', error);
      alert('操作失败');
    }
  };

  if (loading || authLoading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">优惠券管理</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新增优惠券
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">代码</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">所需积分</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">折扣</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coupon.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coupon.points || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coupon.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {coupon.discount}元 (满{coupon.minSpend}可用)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validTo).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(coupon)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingCoupon ? '编辑优惠券' : '新增优惠券'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">优惠券代码</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">名称</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">折扣金额</label>
                  <input
                    type="number"
                    required
                    value={formData.discount}
                    onChange={e => setFormData({...formData, discount: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">最低消费</label>
                  <input
                    type="number"
                    value={formData.minSpend}
                    onChange={e => setFormData({...formData, minSpend: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <label className="block text-sm font-medium text-gray-700">兑换所需积分</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={e => setFormData({...formData, points: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="h-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">开始时间</label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={e => setFormData({...formData, validFrom: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">结束时间</label>
                  <input
                    type="date"
                    required
                    value={formData.validTo}
                    onChange={e => setFormData({...formData, validTo: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
