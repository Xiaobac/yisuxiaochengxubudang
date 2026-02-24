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
  const [messageApi, contextHolder] = message.useMessage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); 
  const markerRef = useRef<any>(null); 

  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Use state to track the active coordinates to display
  // Ensure we have numbers even if props are strings like "39.984120"
  const [activeLat, setActiveLat] = useState(latitude ? Number(latitude) : 39.984120);
  const [activeLng, setActiveLng] = useState(longitude ? Number(longitude) : 116.307484);

  // Update effect if props change externally (e.g. form reset or initial load async)
  useEffect(() => {
      if (latitude !== undefined && longitude !== undefined) {
          const newLat = Number(latitude);
          const newLng = Number(longitude);
          if (!isNaN(newLat) && !isNaN(newLng)) {
             setActiveLat(newLat);
             setActiveLng(newLng);
             // Also update map if it exists
             if (window.TMap && mapInstanceRef.current && markerRef.current) {
                 const center = new window.TMap.LatLng(newLat, newLng);
                 mapInstanceRef.current.setCenter(center);
                 markerRef.current.setGeometries([{
                    id: 'main',
                    styleId: 'marker',
                    position: new window.TMap.LatLng(newLat, newLng),
                 }]);
             }
          }
      }
  }, [latitude, longitude]);

  // Initialize function (extracted to be callable when scripts load)
  const initMap = (lat: number, lng: number) => {
      if(!mapContainerRef.current || !window.TMap) return;

      const validLat = Number(lat);
      const validLng = Number(lng);

      if (isNaN(validLat) || isNaN(validLng)) {
          console.error("Invalid coordinates for map operation:", lat, lng);
          return;
      }
      
      const center = new window.TMap.LatLng(validLat, validLng);
      
      // If map already exists, just update center
      if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(center);
          
          if (markerRef.current) {
              try {
                  markerRef.current.setGeometries([{
                      id: 'main',
                      styleId: 'marker',
                      position: center,
                  }]);
              } catch (e) {
                  // If marker instance is invalid, recreate it
                  console.warn("Error updating marker, attempting recreate:", e);
              }
          }
          return;
      }

      // Create new map
      const newMap = new window.TMap.Map(mapContainerRef.current, {
        center: center,
        zoom: 15,
        pitch: 0,
        rotation: 0,
      });

      mapInstanceRef.current = newMap;

      // Initialize marker
      try {
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
                 position: new window.TMap.LatLng(validLat, validLng),
              }]
          });
          markerRef.current = newMarker;
      } catch(e) {
          console.error("Error creating marker:", e);
      }

      // Bind click
      newMap.on('click', (evt: any) => {
         const clickLat = evt.latLng.getLat();
         const clickLng = evt.latLng.getLng();
         
         setActiveLat(clickLat);
         setActiveLng(clickLng);
         
         const clickPosition = new window.TMap.LatLng(clickLat, clickLng);
         
         if (markerRef.current) {
             markerRef.current.setGeometries([{
                id: 'main',
                styleId: 'marker',
                position: clickPosition,
             }]);
         }
         
         if (onSelect) {
             onSelect({ latitude: clickLat, longitude: clickLng });
         }
      });
  };

  // 1. Initial Load of Script and Map
  useEffect(() => {
    const loadScript = () => {
        if (window.TMap) {
            initMap(activeLat, activeLng);
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://map.qq.com/api/gljs?v=1.exp&key=KZ5BZ-BTSCJ-GOMF7-D5F7X-FVVJF-RXB4D&libraries=service`;
        script.async = true;
        script.onload = () => {
             initMap(activeLat, activeLng);
        };
        document.head.appendChild(script);
    };

    loadScript();

    return () => {
        if(mapInstanceRef.current) {
            mapInstanceRef.current.destroy();
            mapInstanceRef.current = null;
            markerRef.current = null;
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 2. React to Search or Props changes basically
  // However, avoid double init. The search updates state, which triggers this effect if we added dependencies.
  // But we handle search imperatively below to ensure order.
  
  const handleSearch = async () => {
      if (!searchKeyword) return;
      
      try {
          const res = await fetch(`/api/map/geocoder?address=${encodeURIComponent(searchKeyword)}`);
          if (!res.ok) throw new Error(res.json ? (await res.json()).message : 'Network response was not ok');
          const data = await res.json();
          
          if (data.status === 0) {
              const { lat, lng } = data.result.location;
              const latNum = Number(lat);
              const lngNum = Number(lng);
              
              // Update State
              setActiveLat(latNum);
              setActiveLng(lngNum);

              // Update Map Directly
              if (window.TMap && mapInstanceRef.current) {
                  const center = new window.TMap.LatLng(latNum, lngNum);
                  mapInstanceRef.current.setCenter(center);
                  if (markerRef.current) {
                      markerRef.current.setGeometries([{
                          id: 'main',
                          styleId: 'marker',
                          position: center
                      }]);
                  }
              }

              // Notify Parent
              if (onSelect) {
                  onSelect({ latitude: latNum, longitude: lngNum });
              }

          } else {
              messageApi.error(data.message || '地址解析失败');
          }
      } catch (error) {
          console.error('Search error:', error);
          messageApi.error('搜索服务出现异常');
      }
  }

  return (
    <div style={{ width: '100%' }}>
      {contextHolder}
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
       {activeLat && activeLng && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
            已选坐标: {activeLat.toFixed(6)}, {activeLng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
