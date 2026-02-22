export default {
  darkmode: true,
  pages: [
    'pages/home/index',
    'pages/hotelList/index',
    'pages/hotelDetail/index',
    'pages/hotelMap/index',
    'pages/orderDetail/index',
    'pages/orderList/index',
    'pages/favoriteList/index',
    'pages/login/index',
    'pages/register/index',
    'pages/mine/index',
    'pages/reviewList/index',
    'pages/submitReview/index',
    'pages/Coupon/index',
    'pages/myCoupons/index'
  ],
  window: {
    navigationBarBackgroundColor: '#1677ff',
    navigationBarTitleText: '酒店预订小程序',
    navigationBarTextStyle: 'white',
    backgroundTextStyle: 'light'
  },
  tabBar: {
    color: '#999',        // 未选中文字颜色
    selectedColor: '#1677ff', // 选中文字颜色（主色调）
    backgroundColor: '#fff',  // TabBar背景色
    borderStyle: 'black',     // 上边框（分隔页面和TabBar）
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/hotelList/index',
        text: '酒店',
        iconPath: 'assets/tabbar/hotel.png',
        selectedIconPath: 'assets/tabbar/hotel-active.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-active.png'
      }
    ]
  },
  networkTimeout: {
    request: 10000,
    connectSocket: 10000
  },
  permission: {
    'scope.userLocation': {
      desc: '获取您的位置信息，用于显示酒店与您的距离及地图导航'
    }
  },
  requiredPrivateInfos: ['getLocation', 'chooseLocation'],
  debug: false
}