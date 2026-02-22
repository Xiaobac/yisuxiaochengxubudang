import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const key = process.env.QQ_MAP_KEY;

  if (!key) {
    return NextResponse.json({ status: 500, message: 'QQ_MAP_KEY 环境变量未配置' }, { status: 500 });
  }

  if (!address) {
    return NextResponse.json({ status: 400, message: 'Address is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(address)}&key=${key}`, {
        headers: {
            'Referer': 'https://ob4bz-d4w3u-b7vvo-4pjww-6tkjj-wpb77.map.qq.com' // 有些Key需要Referer，虽然后端调用通常不需要，但带上无妨
        }
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocoder error:', error);
    return NextResponse.json({ status: 500, message: 'Internal Server Error' }, { status: 500 });
  }
}
