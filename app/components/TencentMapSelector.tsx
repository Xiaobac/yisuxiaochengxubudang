'use client';

import { useEffect, useRef, useState } from 'react';
import { Input, Button, message, Space } from 'antd';

interface TencentMapSelectorProps {
  latitude?: number;
  longitude?: number;
  onSelect?: (location: { latitude: number; longitude: number; address?: string }) => void;
  apiKey?: string; // 腾讯地图 Key
}

declare global {
  interface Window {
    TMap: any;
  }
}

export default function TencentMapSelector({ latitude, longitude, onSelect }: TencentMapSelectorProps) { // 使用默认测试KEY或者提示用户替换
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  // Default Beijing coordinates if none provided
  const [currentLat, setCurrentLat] = useState(latitude || 39.984120);
  const [currentLng, setCurrentLng] = useState(longitude || 116.307484);

  // 初始化地图
  useEffect(() => {
    const initMap = () => {
      if(!mapContainerRef.current) return;
      
      const center = new window.TMap.LatLng(currentLat, currentLng);
      
      const newMap = new window.TMap.Map(mapContainerRef.current, {
        center: center,
        zoom: 15,
        pitch: 0,
        rotation: 0,
      });

      setMap(newMap);

      // Initialize marker
      const newMarker = new window.TMap.MultiMarker({
          map: newMap,
          styles: {
              'marker': new window.TMap.MarkerStyle({ 
                  width: 25, 
                  height: 35, 
                  anchor: { x: 16, y: 32 }
              }) 
          },
          geometries: [{
             id: 'main',
             styleId: 'marker',
             position: center,
          }]
      });
      setMarker(newMarker);

      // Bind click
      newMap.on('click', (evt: any) => {
         const lat = evt.latLng.getLat();
         const lng = evt.latLng.getLng();
         setCurrentLat(lat);
         setCurrentLng(lng);
         
         // Update marker directly
         newMarker.setGeometries([{
            id: 'main',
            position: evt.latLng,
         }]);
         
         if (onSelect) {
             onSelect({ latitude: lat, longitude: lng });
         }
      });
    };

    const initScript = () => {
        if (window.TMap) {
            initMap();
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://map.qq.com/api/gljs?v=1.exp&key=KZ5BZ-BTSCJ-GOMF7-D5F7X-FVVJF-RXB4D&libraries=service`;
        script.async = true;
        script.onload = () => {
            initMap();
        };
        document.head.appendChild(script);
    };

    initScript();
    
    return () => {
        if(map) {
            map.destroy();
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSearch = async () => {
      if (!searchKeyword) return;
      
      try {
          const res = await fetch(`/api/map/geocoder?address=${encodeURIComponent(searchKeyword)}`);
          const data = await res.json();
          
          if (data.status === 0) {
              const { lat, lng } = data.result.location;
              const center = new window.TMap.LatLng(lat, lng);
              
              if (map) {
                map.setCenter(center);
                if (marker) {
                    marker.setGeometries([{
                        id: 'main',
                        position: center
                    }]);
                }
                setCurrentLat(lat);
                setCurrentLng(lng);
                
                if (onSelect) {
                    onSelect({ latitude: lat, longitude: lng });
                }
              }
          } else {
              message.error(data.message || '地址解析失败，请尝试手动选择');
          }
      } catch (error) {
          console.error('Search error:', error);
          message.error('搜索服务出现异常');
      }
  }

  return (
    <div style={{ width: '100%' }}>
      <Space style={{ marginBottom: 16 }}>
        <Input 
            placeholder="输入地址搜索 (例如: 北京天安门)" 
            value={searchKeyword} 
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
        />
        <Button onClick={handleSearch} type="primary">搜索</Button>
        <span style={{ fontSize: 12, color: '#888' }}>或点击地图选择位置</span>
      </Space>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '400px', border: '1px solid #d9d9d9', borderRadius: 4 }}
      ></div>
       {latitude && longitude && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
            已选坐标: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
}
