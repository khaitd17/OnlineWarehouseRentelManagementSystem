import axiosClient from "./axiosClient";

const aiService = {
  /**
   * Phân tích ảnh đồ vật bằng AI → trả về danh sách đồ vật + gợi ý kho.
   * @param {File[]} images - Danh sách ảnh (tối đa 5 ảnh)
   * @param {string|null} province - Tỉnh/thành phố ưa thích (tùy chọn)
   * @param {string|null} district - Quận/huyện ưa thích (tùy chọn)
   * @returns Promise<AnalyzeItemsResult>
   */
  analyzeItems: (images, province = null, district = null, lat = null, lng = null) => {
    const formData = new FormData();
    images.forEach((img) => formData.append("images", img));
    if (province) formData.append("province", province);
    if (district) formData.append("district", district);
    if (lat !== null) formData.append("lat", lat);
    if (lng !== null) formData.append("lng", lng);

    return axiosClient.post("/ai/analyze-items", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 90000, // 90 giây vì Gemini xử lý ảnh lâu
    });
  },

  /**
   * Lấy lịch sử phân tích AI của user hiện tại.
   */
  getMySessions: () => axiosClient.get("/ai/my-sessions"),

  /**
   * Kiểm tra quota còn lại hôm nay.
   * @returns { usedToday, dailyLimit, remaining }
   */
  getQuota: () => axiosClient.get("/ai/quota"),
};

export default aiService;
