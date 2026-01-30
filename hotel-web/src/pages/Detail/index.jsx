import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Swiper,
  Tag,
  Card,
  List,
  Loading,
  Toast,
  DatePicker,
  Button,
} from 'antd-mobile';
import {
  StarFill,
  EnvironmentOutline,
  CalendarOutline,
} from 'antd-mobile-icons';
import { getHotelById } from '../../services/hotel';
import dayjs from 'dayjs';
import './index.css';

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState(dayjs());
  const [checkOutDate, setCheckOutDate] = useState(dayjs().add(1, 'day'));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('checkIn');
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    loadHotelDetail();
  }, [id]);

  const loadHotelDetail = async () => {
    try {
      setLoading(true);
      const data = await getHotelById(id);
      setHotel(data);
    } catch (error) {
      console.error('加载酒店详情失败:', error);
      Toast.show({ content: '加载失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleDateClick = (type) => {
    setDateType(type);
    setDatePickerVisible(true);
  };

  const handleDateConfirm = (val) => {
    if (dateType === 'checkIn') {
      setCheckInDate(dayjs(val));
      // 如果入住日期晚于离店日期,自动调整离店日期
      if (dayjs(val).isAfter(checkOutDate)) {
        setCheckOutDate(dayjs(val).add(1, 'day'));
      }
    } else {
      setCheckOutDate(dayjs(val));
    }
    setDatePickerVisible(false);
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    Toast.show({
      content: `已选择 ${room.name || room.room_type}`,
      duration: 1000,
    });
  };

  const handleBooking = () => {
    if (!selectedRoom) {
      Toast.show({
        content: '请先选择房型',
        icon: 'fail',
      });
      return;
    }
    Toast.show({
      content: '预订功能开发中...',
      icon: 'success',
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: rating }, (_, i) => (
      <StarFill key={i} fontSize={14} color="#ffa940" />
    ));
  };

  const nights = checkOutDate.diff(checkInDate, 'day');

  if (loading) {
    return (
      <div className="detail-page loading-page">
        <Loading />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="detail-page">
        <NavBar onBack={handleBack}>酒店详情</NavBar>
        <div className="empty-state">酒店不存在</div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* 顶部导航 */}
      <NavBar onBack={handleBack}>{hotel.name}</NavBar>

      {/* 图片轮播 */}
      <div className="image-swiper">
        <Swiper
          loop
          indicatorProps={{
            color: 'white',
          }}
        >
          {(hotel.images && hotel.images.length > 0 ? hotel.images : ['https://via.placeholder.com/400x250']).map((image, index) => (
            <Swiper.Item key={index}>
              <div className="swiper-item">
                <img src={image} alt={hotel.name} />
              </div>
            </Swiper.Item>
          ))}
        </Swiper>
      </div>

      {/* 酒店基本信息 */}
      <Card className="hotel-info-card">
        <div className="hotel-header">
          <div>
            <div className="hotel-name">{hotel.name}</div>
            {hotel.name_en && (
              <div className="hotel-name-en">{hotel.name_en}</div>
            )}
          </div>
          <div className="hotel-stars">
            {renderStars(hotel.star_rating)}
          </div>
        </div>

        <div className="hotel-address">
          <EnvironmentOutline fontSize={14} />
          <span>{hotel.address}</span>
        </div>

        {/* 设施标签 */}
        {hotel.facilities && hotel.facilities.length > 0 && (
          <div className="hotel-facilities">
            {hotel.facilities.map((facility, idx) => (
              <Tag key={idx} color="primary" fill="outline">
                {facility}
              </Tag>
            ))}
          </div>
        )}

        {/* 酒店描述 */}
        {hotel.description && (
          <div className="hotel-description">{hotel.description}</div>
        )}
      </Card>

      {/* 日期选择 */}
      <Card className="date-card">
        <div className="date-selector">
          <div
            className="date-item clickable"
            onClick={() => handleDateClick('checkIn')}
          >
            <div className="date-label">
              <CalendarOutline />
              <span>入住</span>
            </div>
            <div className="date-value">
              {checkInDate.format('MM月DD日')}
            </div>
            <div className="date-week">
              {checkInDate.format('dddd')}
            </div>
          </div>
          <div className="date-nights">{nights}晚</div>
          <div
            className="date-item clickable"
            onClick={() => handleDateClick('checkOut')}
          >
            <div className="date-label">
              <CalendarOutline />
              <span>离店</span>
            </div>
            <div className="date-value">
              {checkOutDate.format('MM月DD日')}
            </div>
            <div className="date-week">
              {checkOutDate.format('dddd')}
            </div>
          </div>
        </div>
      </Card>

      {/* 日期选择器 */}
      <DatePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        value={dateType === 'checkIn' ? checkInDate.toDate() : checkOutDate.toDate()}
        onConfirm={handleDateConfirm}
        min={new Date()}
        title={dateType === 'checkIn' ? '选择入住日期' : '选择离店日期'}
      />

      {/* 房型价格列表 */}
      <Card className="room-card" title="选择房型">
        <List>
          {hotel.Rooms && hotel.Rooms.length > 0 ? (
            hotel.Rooms.sort((a, b) => a.price - b.price).map((room) => (
              <List.Item
                key={room.id}
                clickable
                arrow={false}
                onClick={() => handleRoomSelect(room)}
                extra={
                  <div className="room-actions">
                    <div className="room-price">
                      <div className="price-value">¥{room.price}</div>
                      <div className="price-label">每晚</div>
                    </div>
                    <Button
                      color={selectedRoom?.id === room.id ? 'success' : 'primary'}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoomSelect(room);
                      }}
                    >
                      {selectedRoom?.id === room.id ? '已选' : '选择'}
                    </Button>
                  </div>
                }
                description={
                  <div>
                    <div>剩余 {room.available_count || room.total_count} 间</div>
                    {room.bed_type && <div>床型: {room.bed_type}</div>}
                    {room.size && <div>面积: {room.size}㎡</div>}
                    {room.max_guests && <div>最多入住: {room.max_guests}人</div>}
                  </div>
                }
              >
                <div style={{ fontWeight: selectedRoom?.id === room.id ? 'bold' : 'normal' }}>
                  {room.name || room.room_type}
                </div>
              </List.Item>
            ))
          ) : (
            <div className="no-rooms">暂无房型信息</div>
          )}
        </List>
      </Card>

      {/* 底部预订栏 */}
      {hotel.Rooms && hotel.Rooms.length > 0 && (
        <div className="booking-bar">
          <div className="booking-info">
            {selectedRoom ? (
              <div>
                <div className="selected-room">{selectedRoom.name || selectedRoom.room_type}</div>
                <div className="total-price">
                  共 {nights} 晚 ¥{selectedRoom.price * nights}
                </div>
              </div>
            ) : (
              <div className="select-tip">请选择房型</div>
            )}
          </div>
          <Button
            color="primary"
            size="large"
            onClick={handleBooking}
            disabled={!selectedRoom}
          >
            立即预订
          </Button>
        </div>
      )}
    </div>
  );
}

export default Detail;
