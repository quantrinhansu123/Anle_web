/** Single item hoặc object */
export function successResponse<T>(data: T, message = 'Success') {
  return { success: true, message, data };
}

/** Danh sách có phân trang */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** Lỗi */
export function errorResponse(message: string, code?: string) {
  return { success: false, message, code };
}
