import { get, del } from '@/app/lib/request';
import type { ApiResponse, Comment } from '@/app/types';


export const getCommentsByHotelId = (hotelId: number) => {
    return get<ApiResponse<Comment[]>>(`/comments?hotelId=${hotelId}`);
};

export const deleteComment = (commentId: number) => {
    return del<ApiResponse>(`/comments/${commentId}`);
};
