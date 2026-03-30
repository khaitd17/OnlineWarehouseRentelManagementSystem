/**
 * Favorites Service — lưu kho yêu thích vào localStorage
 * Key: owrms_favorites_<userId>  (tách theo user, không bị chồng chéo)
 *
 * Mỗi entry lưu đủ thông tin để render card mà không cần gọi API lại:
 * { warehouseId, name, address, imageUrl, pricePerM2, totalArea, availableArea,
 *   is24HoursAccess, averageRating, ratingCount, savedAt }
 */

const getKey = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return `owrms_favorites_${user?.userId || 'guest'}`;
};

const getAll = () => {
  try {
    return JSON.parse(localStorage.getItem(getKey()) || '[]');
  } catch {
    return [];
  }
};

const save = (list) => {
  localStorage.setItem(getKey(), JSON.stringify(list));
  // Phát sự kiện để mọi component đang mount có thể cập nhật
  window.dispatchEvent(new Event('favoritesChanged'));
};

const favoritesService = {
  /** Trả về danh sách kho đã lưu */
  getFavorites: () => getAll(),

  /** Kiểm tra một kho có đang được lưu không */
  isFavorite: (warehouseId) => {
    return getAll().some(w => w.warehouseId === Number(warehouseId));
  },

  /** Thêm kho vào yêu thích */
  addFavorite: (warehouseData) => {
    const list = getAll();
    const id = Number(warehouseData.warehouseId);
    if (list.some(w => w.warehouseId === id)) return; // đã có rồi
    list.unshift({
      warehouseId:    id,
      name:           warehouseData.name           || '',
      address:        warehouseData.address         || '',
      imageUrl:       warehouseData.imageUrl        || '',
      pricePerM2:     warehouseData.pricePerM2      ?? null,
      totalArea:      warehouseData.totalArea       ?? 0,
      availableArea:  warehouseData.availableArea   ?? 0,
      is24HoursAccess: warehouseData.is24HoursAccess ?? false,
      averageRating:  warehouseData.averageRating   ?? null,
      ratingCount:    warehouseData.ratingCount     ?? 0,
      savedAt:        new Date().toISOString(),
    });
    save(list);
  },

  /** Xóa kho khỏi yêu thích */
  removeFavorite: (warehouseId) => {
    const list = getAll().filter(w => w.warehouseId !== Number(warehouseId));
    save(list);
  },

  /** Toggle — trả về trạng thái sau khi toggle (true = đã thêm) */
  toggleFavorite: (warehouseData) => {
    const id = Number(warehouseData.warehouseId);
    if (favoritesService.isFavorite(id)) {
      favoritesService.removeFavorite(id);
      return false;
    } else {
      favoritesService.addFavorite(warehouseData);
      return true;
    }
  },

  /** Số lượng yêu thích hiện tại */
  count: () => getAll().length,
};

export default favoritesService;
