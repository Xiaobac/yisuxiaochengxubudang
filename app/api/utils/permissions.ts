import { prisma } from '@/app/lib/prisma';

export async function checkPermission(userId: number, permissionName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermission: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });
  return user?.role?.rolePermission.some(rp => rp.permission.name === permissionName) ?? false;
}
