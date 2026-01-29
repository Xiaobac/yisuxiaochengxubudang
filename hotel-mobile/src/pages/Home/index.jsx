import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchBar,
  Swiper,
  Button,
  DatePicker,
  Selector,
  Tag,
  Space,
  Input,
  Modal,
} from 'antd-mobile';
import { EnvironmentOutline, CalendarOutline } from 'antd-mobile-icons';
import dayjs from 'dayjs';
import './index.css';

function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState('上海');
  const [keyword, setKeyword] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(dayjs().add(1, 'day').toDate());
  const [starRating, setStarRating] = useState([]);
  const [priceRange, setPriceRange] = useState([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('checkIn'); // 'checkIn' or 'checkOut'
  const [customPriceVisible, setCustomPriceVisible] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  // 城市列表
  const cities = ['上海', '北京', '杭州', '成都', '广州', '深圳', '南京', '苏州'];

  // Banner 数据
  const banners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      hotelId: 1,
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      hotelId: 2,
    },
  ];

  // 星级选项
  const starOptions = [
    { label: '三星', value: 3 },
    { label: '四星', value: 4 },
    { label: '五星', value: 5 },
  ];

  // 价格区间
  const priceOptions = [
    { label: '¥0-200', value: '0-200' },
    { label: '¥200-500', value: '200-500' },
    { label: '¥500-1000', value: '500-1000' },
    { label: '¥1000+', value: '1000+' },
    { label: '自定义', value: 'custom' },
  ];

  const handlePriceChange = (val) => {
    if (val.includes('custom')) {
      setCustomPriceVisible(true);
      setPriceRange(val.filter(v => v !== 'custom'));
    } else {
      setPriceRange(val);
    }
  };

  const handleCustomPriceConfirm = () => {
    if (minPrice || maxPrice) {
      const customRange = `${minPrice || '0'}-${maxPrice || '∞'}`;
      setPriceRange([...priceRange.filter(p => !p.includes('-') && p !== '1000+'), customRange]);
    }
    setCustomPriceVisible(false);
  };

  // 快捷标签
  const quickTags = ['亲子', '豪华', '免费停车场', '游泳池', '健身房', 'WiFi'];

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
    setCityPickerVisible(false);
  };

  const handleSearch = () => {
    const params = {
      city,
      keyword,
      starRating: starRating.join(','),
      priceRange: priceRange.join(','),
    };
    navigate('/list', { state: params });
  };

  const handleBannerClick = (hotelId) => {
    navigate(`/detail/${hotelId}`);
  };

  return (
    <div className="home-page">
      {/* 顶部 Banner */}
      <div className="banner-section">
        <Swiper
          autoplay
          loop
          indicatorProps={{
            color: 'white',
          }}
        >
          {banners.map((banner) => (
            <Swiper.Item key={banner.id}>
              <div
                className="banner-item"
                onClick={() => handleBannerClick(banner.hotelId)}
              >
                <img src={banner.image} alt="hotel" />
              </div>
            </Swiper.Item>
          ))}
        </Swiper>
      </div>

      {/* 核心查询区域 */}
      <div className="search-section">
        {/* 城市选择 */}
        <div className="search-item">
          <div className="search-label">
            <EnvironmentOutline />
            <span>目的地</span>
          </div>
          <div
            className="search-value clickable"
            onClick={() => setCityPickerVisible(true)}
          >
            {city}
          </div>
        </div>

        {/* 城市选择弹窗 */}
        <Modal
          visible={cityPickerVisible}
          onClose={() => setCityPickerVisible(false)}
          title="选择目的地"
          content={
            <div style={{ padding: '12px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {cities.map((cityItem) => (
                  <div
                    key={cityItem}
                    onClick={() => handleCitySelect(cityItem)}
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      backgroundColor: city === cityItem ? '#1677ff' : '#f5f5f5',
                      color: city === cityItem ? '#fff' : '#333',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: city === cityItem ? '600' : '400',
                    }}
                  >
                    {cityItem}
                  </div>
                ))}
              </div>
            </div>
          }
          actions={[
            {
              key: 'close',
              text: '关闭',
              onClick: () => setCityPickerVisible(false),
            },
          ]}
        />

        {/* 关键字搜索 */}
        <div className="search-item">
          <SearchBar
            placeholder="搜索酒店名称"
            value={keyword}
            onChange={setKeyword}
          />
        </div>

        {/* 日期选择 */}
        <div
          className="search-item date-picker"
          onClick={() => {
            setDateType('checkIn');
            setDatePickerVisible(true);
          }}
        >
          <div className="date-item">
            <div className="date-label">
              <CalendarOutline />
              <span>入住</span>
            </div>
            <div className="date-value">{dayjs(checkInDate).format('MM月DD日')}</div>
          </div>
          <div className="date-divider">{dayjs(checkOutDate).diff(dayjs(checkInDate), 'day')}晚</div>
          <div
            className="date-item"
            onClick={(e) => {
              e.stopPropagation();
              setDateType('checkOut');
              setDatePickerVisible(true);
            }}
          >
            <div className="date-label">
              <CalendarOutline />
              <span>离店</span>
            </div>
            <div className="date-value">{dayjs(checkOutDate).format('MM月DD日')}</div>
          </div>
        </div>

        {/* 日期选择器 */}
        <DatePicker
          visible={datePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          value={dateType === 'checkIn' ? checkInDate : checkOutDate}
          onConfirm={(val) => {
            if (dateType === 'checkIn') {
              setCheckInDate(val);
              // 如果入住日期晚于离店日期,自动调整离店日期
              if (dayjs(val).isAfter(checkOutDate)) {
                setCheckOutDate(dayjs(val).add(1, 'day').toDate());
              }
            } else {
              setCheckOutDate(val);
            }
          }}
          min={dateType === 'checkIn' ? new Date() : checkInDate}
        >
          {(value) => dayjs(value).format('YYYY-MM-DD')}
        </DatePicker>

        {/* 星级筛选 */}
        <div className="search-item">
          <div className="filter-label">星级</div>
          <Selector
            options={starOptions}
            value={starRating}
            onChange={setStarRating}
            multiple
          />
        </div>

        {/* 价格区间 */}
        <div className="search-item">
          <div className="filter-label">价格区间</div>
          <Selector
            options={priceOptions}
            value={priceRange}
            onChange={handlePriceChange}
            multiple
          />
          {priceRange.some(p => p.includes('-') && !['0-200', '200-500', '500-1000', '1000+'].includes(p)) && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              已选择自定义价格: ¥{priceRange.find(p => p.includes('-') && !['0-200', '200-500', '500-1000', '1000+'].includes(p))}
            </div>
          )}
        </div>

        {/* 自定义价格输入弹窗 */}
        <Modal
          visible={customPriceVisible}
          onClose={() => setCustomPriceVisible(false)}
          title="自定义价格区间"
          content={
            <div style={{ padding: '12px 0' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontSize: 14, color: '#666' }}>最低价格(元)</div>
                <Input
                  placeholder="请输入最低价格"
                  type="number"
                  value={minPrice}
                  onChange={setMinPrice}
                />
              </div>
              <div>
                <div style={{ marginBottom: 8, fontSize: 14, color: '#666' }}>最高价格(元)</div>
                <Input
                  placeholder="请输入最高价格(可不填)"
                  type="number"
                  value={maxPrice}
                  onChange={setMaxPrice}
                />
              </div>
            </div>
          }
          actions={[
            {
              key: 'cancel',
              text: '取消',
              onClick: () => setCustomPriceVisible(false),
            },
            {
              key: 'confirm',
              text: '确定',
              primary: true,
              onClick: handleCustomPriceConfirm,
            },
          ]}
        />

        {/* 快捷标签 */}
        <div className="search-item">
          <div className="filter-label">快捷筛选</div>
          <Space wrap>
            {quickTags.map((tag) => (
              <Tag
                key={tag}
                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                fill={selectedTags.includes(tag) ? 'solid' : 'outline'}
                onClick={() => handleTagClick(tag)}
                style={{ cursor: 'pointer' }}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        </div>

        {/* 查询按钮 */}
        <Button
          color="primary"
          size="large"
          block
          onClick={handleSearch}
        >
          查询
        </Button>
      </div>
    </div>
  );
}

export default Home;
