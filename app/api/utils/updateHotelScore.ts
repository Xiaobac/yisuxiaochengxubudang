import { prisma } from '@/app/lib/prisma';

export async function updateHotelScore(hotelId: number) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        hotelId: hotelId,
        score: {
          not: null
        }
      },
      select: {
        score: true
      }
    });

    if (comments.length === 0) {
      await prisma.hotel.update({
        where: { id: hotelId },
        data: { score: null } 
      });
      return;
    }

    const totalScore = comments.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const averageScore = Number((totalScore / comments.length).toFixed(1));

    await prisma.hotel.update({
      where: { id: hotelId },
      data: { score: averageScore }
    });
  } catch (error) {
    console.error('Failed to update hotel score:', error);
  }
}
