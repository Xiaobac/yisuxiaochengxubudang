import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import MerchantLayout from '../components/Layout/MerchantLayout';
import AdminLayout from '../components/Layout/AdminLayout';
import HotelManagement from '../pages/Merchant/HotelManagement';
import ReviewSystem from '../pages/Admin/ReviewSystem';

// 路由守卫：检查是否登录
const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  // 商户端路由
  {
    path: '/merchant',
    element: (
      <PrivateRoute requiredRole="merchant">
        <MerchantLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/merchant/hotels" replace />,
      },
      {
        path: 'hotels',
        element: <HotelManagement />,
      },
    ],
  },
  // 管理员端路由
  {
    path: '/admin',
    element: (
      <PrivateRoute requiredRole="admin">
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/review" replace />,
      },
      {
        path: 'review',
        element: <ReviewSystem />,
      },
    ],
  },
  // 404 页面
  {
    path: '*',
    element: <div>404 - Page Not Found</div>,
  },
]);

export default router;
