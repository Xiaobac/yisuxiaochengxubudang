import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const key = process.env.QQ_MAP_KEY;

  if (!key) {
    return NextResponse.json({ status: 500, message: 'QQ_MAP_KEY 环境变量未配置' }, { status: 500 });
  }

  if (!lat || !lng) {
    return NextResponse.json({ status: 400, message: 'lat and lng are required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${key}`,
      {
        headers: {
          'Referer': 'https://ob4bz-d4w3u-b7vvo-4pjww-6tkjj-wpb77.map.qq.com',
        },
      }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reverse geocoder error:', error);
    return NextResponse.json({ status: 500, message: 'Internal Server Error' }, { status: 500 });
  }
}
