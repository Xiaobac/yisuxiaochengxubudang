import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  NavBar,
  SearchBar,
  Dropdown,
  InfiniteScroll,
  List,
  Tag,
  Loading,
  Empty,
} from 'antd-mobile';
import { StarFill, EnvironmentOutline } from 'antd-mobile-icons';
import { getHotels } from '../../services/hotel';
import './index.css';

function HotelList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    city: location.state?.city || '上海',
    keyword: location.state?.keyword || '',
    checkInDate: location.state?.checkInDate || '',
    checkOutDate: location.state?.checkOutDate || '',
    starRating: location.state?.starRating || '',
    priceRange: location.state?.priceRange || '',
    tags: location.state?.tags || '',
    sortBy: 'default',
  });

  useEffect(() => {
    loadHotels();
  }, [filters]);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const data = await getHotels({
        city: filters.city,
        status: 'published',
      });

      let filteredData = data || [];

      // 关键字筛选
      if (filters.keyword) {
        filteredData = filteredData.filter(hotel =>
          hotel.name.toLowerCase().includes(filters.keyword.toLowerCase())
        );
      }

      // 星级筛选
      if (filters.starRating) {
        const ratings = filters.starRating.toString().split(',').map(Number);
        filteredData = filteredData.filter(hotel =>
          ratings.includes(hotel.star_rating)
        );
      }

      // 价格区间筛选
      if (filters.priceRange) {
        const ranges = filters.priceRange.split(',');
        filteredData = filteredData.filter(hotel => {
          return ranges.some(range => {
            if (range === '1000+') {
              return hotel.price >= 1000;
            }
            const [min, max] = range.split('-').map(v => v === '∞' ? Infinity : Number(v));
            return hotel.price >= min && hotel.price <= max;
          });
        });
      }

      // 排序
      if (filters.sortBy === 'price_asc') {
        filteredData.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'price_desc') {
        filteredData.sort((a, b) => b.price - a.price);
      }

      setHotels(filteredData);
      setHasMore(false);
    } catch (error) {
      console.error('加载酒店列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    // 模拟分页加载
    setHasMore(false);
  };

  const handleHotelClick = (id) => {
    navigate(`/detail/${id}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const renderStars = (rating) => {
    return Array.from({ length: rating }, (_, i) => (
      <StarFill key={i} fontSize={12} color="#ffa940" />
    ));
  };

  return (
    <div className="list-page">
      {/* 顶部导航 */}
      <NavBar onBack={handleBack}>酒店列表</NavBar>

      {/* 搜索头 */}
      <div className="search-header">
        <div className="search-bar-wrapper">
          <SearchBar
            placeholder="搜索酒店"
            value={filters.keyword}
            onChange={(val) => setFilters({ ...filters, keyword: val })}
          />
        </div>
        <div className="filter-wrapper">
          <Dropdown>
            <Dropdown.Item key="city" title={filters.city}>
              <div style={{ padding: 12 }}>
                {['上海', '北京', '杭州', '成都', '广州', '深圳', '南京', '苏州'].map((city) => (
                  <div
                    key={city}
                    style={{
                      padding: 8,
                      cursor: 'pointer',
                      backgroundColor: filters.city === city ? '#e6f7ff' : 'transparent',
                      borderRadius: '4px',
                    }}
                    onClick={() => {
                      setFilters({ ...filters, city });
                    }}
                  >
                    {city}
                  </div>
                ))}
              </div>
            </Dropdown.Item>
            <Dropdown.Item key="star" title={filters.starRating ? `${filters.starRating}星` : '星级'}>
              <div style={{ padding: 12 }}>
                {['不限', 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    style={{
                      padding: 8,
                      cursor: 'pointer',
                      backgroundColor: (star === '不限' && !filters.starRating) || filters.starRating == star ? '#e6f7ff' : 'transparent',
                      borderRadius: '4px',
                    }}
                    onClick={() => {
                      setFilters({ ...filters, starRating: star === '不限' ? '' : star });
                    }}
                  >
                    {star === '不限' ? '不限' : `${star}星级`}
                  </div>
                ))}
              </div>
            </Dropdown.Item>
            <Dropdown.Item key="sort" title={filters.sortBy === 'price_asc' ? '价格升序' : filters.sortBy === 'price_desc' ? '价格降序' : '排序'}>
              <div style={{ padding: 12 }}>
                {[
                  { label: '默认排序', value: 'default' },
                  { label: '价格从低到高', value: 'price_asc' },
                  { label: '价格从高到低', value: 'price_desc' },
                ].map((item) => (
                  <div
                    key={item.value}
                    style={{
                      padding: 8,
                      cursor: 'pointer',
                      backgroundColor: filters.sortBy === item.value ? '#e6f7ff' : 'transparent',
                      borderRadius: '4px',
                    }}
                    onClick={() => {
                      setFilters({ ...filters, sortBy: item.value });
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </Dropdown.Item>
          </Dropdown>
        </div>
      </div>

      {/* 酒店列表 */}
      <div className="hotel-list">
        {loading && hotels.length === 0 ? (
          <div className="loading-wrapper">
            <Loading />
          </div>
        ) : hotels.length === 0 ? (
          <Empty description="暂无酒店数据" />
        ) : (
          <List>
            {hotels.map((hotel) => (
              <List.Item
                key={hotel.id}
                onClick={() => handleHotelClick(hotel.id)}
                className="hotel-item"
              >
                <div className="hotel-card">
                  <div className="hotel-image">
                    <img
                      src={hotel.images?.[0] || 'https://via.placeholder.com/120x90'}
                      alt={hotel.name}
                    />
                  </div>
                  <div className="hotel-info">
                    <div className="hotel-name">{hotel.name}</div>
                    <div className="hotel-stars">
                      {renderStars(hotel.star_rating)}
                    </div>
                    <div className="hotel-address">
                      <EnvironmentOutline fontSize={12} />
                      <span>{hotel.address}</span>
                    </div>
                    {hotel.facilities && hotel.facilities.length > 0 && (
                      <div className="hotel-tags">
                        {hotel.facilities.slice(0, 3).map((facility, idx) => (
                          <Tag key={idx} color="default" fill="outline">
                            {facility}
                          </Tag>
                        ))}
                      </div>
                    )}
                    <div className="hotel-price">
                      <span className="price-value">¥{hotel.price}</span>
                      <span className="price-label">起</span>
                    </div>
                  </div>
                </div>
              </List.Item>
            ))}
          </List>
        )}

        <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
      </div>
    </div>
  );
}

export default HotelList;
