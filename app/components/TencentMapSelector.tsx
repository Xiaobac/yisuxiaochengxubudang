'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Input, Button, message, Space } from 'antd';

interface TencentMapSelectorProps {
  latitude?: number;
  longitude?: number;
  onSelect?: (location: { latitude: number; longitude: number; address?: string }) => void;
  apiKey?: string;
  readOnly?: boolean;
}

declare global {
  interface Window {
    TMap: any;
  }
}

const DEFAULT_LAT = 39.984120;
const DEFAULT_LNG = 116.307484;

function isValidCoord(lat: unknown, lng: unknown): boolean {
  const la = Number(lat);
  const ln = Number(lng);
  return !isNaN(la) && !isNaN(ln) && isFinite(la) && isFinite(ln)
    && la >= -90 && la <= 90 && ln >= -180 && ln <= 180
    && (la !== 0 || ln !== 0);
}

// 通过服务端 API 路由进行逆地理编码（坐标 → 地址），避免客户端域名限制
async function serverReverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`/api/map/geocoder/reverse?lat=${lat}&lng=${lng}`);
    if (!res.ok) return '';
    const data = await res.json();
    return data?.result?.address || '';
  } catch {
    return '';
  }
}

// 通过服务端 API 路由进行正向地理编码（地址 → 坐标），避免客户端域名限制
async function serverGeocode(address: string): Promise<{ lat: number; lng: number } | { error: string }> {
  try {
    const res = await fetch(`/api/map/geocoder?address=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (!res.ok) {
      return { error: data?.message || '请求失败' };
    }
    if (data.status === 0 && data.result?.location) {
      return { lat: data.result.location.lat, lng: data.result.location.lng };
    }
    return { error: `地址解析失败: ${data.message || JSON.stringify(data)}` };
  } catch (err: any) {
    return { error: `网络错误: ${err?.message || '未知错误'}` };
  }
}

export default function TencentMapSelector({
  latitude,
  longitude,
  onSelect,
  readOnly = false,
}: TencentMapSelectorProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapReadyRef = useRef(false);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeAddress, setActiveAddress] = useState('');

  const initialLat = isValidCoord(latitude, longitude) ? Number(latitude) : DEFAULT_LAT;
  const initialLng = isValidCoord(latitude, longitude) ? Number(longitude) : DEFAULT_LNG;

  const [activeLat, setActiveLat] = useState(initialLat);
  const [activeLng, setActiveLng] = useState(initialLng);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  // Recreate marker (avoids stale LatLng context errors from setGeometries)
  const placeMarker = useCallback((lat: number, lng: number) => {
    if (!window.TMap || !mapInstanceRef.current || !mapReadyRef.current) return;
    if (!isValidCoord(lat, lng)) return;

    const center = new window.TMap.LatLng(lat, lng);
    mapInstanceRef.current.setCenter(center);

    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    markerRef.current = new window.TMap.MultiMarker({
      map: mapInstanceRef.current,
      styles: {
        'marker': new window.TMap.MarkerStyle({
          width: 25,
          height: 35,
          anchor: { x: 16, y: 32 },
        }),
      },
      geometries: [{
        id: 'main',
        styleId: 'marker',
        position: center,
      }],
    });
  }, []);

  // Sync props → state
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined && isValidCoord(latitude, longitude)) {
      const newLat = Number(latitude);
      const newLng = Number(longitude);
      setActiveLat(newLat);
      setActiveLng(newLng);
    }
  }, [latitude, longitude]);

  // Update map marker when coordinates change and map is ready
  useEffect(() => {
    if (mapReadyRef.current && isValidCoord(activeLat, activeLng)) {
      placeMarker(activeLat, activeLng);
    }
  }, [activeLat, activeLng, placeMarker]);

  // Init map
  useEffect(() => {
    const initMap = (lat: number, lng: number) => {
      if (!mapContainerRef.current || !window.TMap) return;
      if (!isValidCoord(lat, lng)) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        markerRef.current = null;
        mapReadyRef.current = false;
      }

      const center = new window.TMap.LatLng(Number(lat), Number(lng));

      const newMap = new window.TMap.Map(mapContainerRef.current, {
        center,
        zoom: 15,
        pitch: 0,
        rotation: 0,
      });
      mapInstanceRef.current = newMap;

      markerRef.current = new window.TMap.MultiMarker({
        map: newMap,
        styles: {
          'marker': new window.TMap.MarkerStyle({
            width: 25,
            height: 35,
            anchor: { x: 16, y: 32 },
          }),
        },
        geometries: [{
          id: 'main',
          styleId: 'marker',
          position: center,
        }],
      });

      mapReadyRef.current = true;

      newMap.on('click', async (evt: any) => {
        if (readOnlyRef.current) return;

        const clickLat = evt.latLng.getLat();
        const clickLng = evt.latLng.getLng();

        if (!isValidCoord(clickLat, clickLng)) return;

        setActiveLat(clickLat);
        setActiveLng(clickLng);

        const address = await serverReverseGeocode(clickLat, clickLng);
        setActiveAddress(address);

        if (onSelectRef.current) {
          onSelectRef.current({ latitude: clickLat, longitude: clickLng, address });
        }
      });
    };

    const loadScript = () => {
      if (window.TMap) {
        initMap(activeLat, activeLng);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://map.qq.com/api/gljs?v=1.exp&key=KZ5BZ-BTSCJ-GOMF7-D5F7X-FVVJF-RXB4D';
      script.async = true;
      script.onload = () => {
        initMap(activeLat, activeLng);
      };
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      mapReadyRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // readOnly 模式初始化时逆地理编码
  useEffect(() => {
    if (readOnly && isValidCoord(activeLat, activeLng)) {
      serverReverseGeocode(activeLat, activeLng).then((addr) => {
        if (addr) setActiveAddress(addr);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  const handleSearch = async () => {
    if (!searchKeyword) return;

    const result = await serverGeocode(searchKeyword);
    if ('error' in result) {
      messageApi.error(result.error);
      return;
    }

    const { lat, lng } = result;
    if (!isValidCoord(lat, lng)) {
      messageApi.error('返回坐标无效');
      return;
    }

    setActiveLat(lat);
    setActiveLng(lng);

    const address = await serverReverseGeocode(lat, lng);
    setActiveAddress(address);

    if (onSelect) {
      onSelect({ latitude: lat, longitude: lng, address });
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {contextHolder}
      {!readOnly && (
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="输入地址搜索 (例如: 北京天安门)"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Button onClick={handleSearch} type="primary">搜索</Button>
          <span style={{ fontSize: 12, color: '#888' }}>或点击地图选择位置</span>
        </Space>
      )}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: readOnly ? '300px' : '400px',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
        }}
      />
      {isValidCoord(activeLat, activeLng) && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          已选坐标: {activeLat.toFixed(6)}, {activeLng.toFixed(6)}
          {activeAddress && <span style={{ marginLeft: 8 }}>({activeAddress})</span>}
        </div>
      )}
    </div>
  );
}
