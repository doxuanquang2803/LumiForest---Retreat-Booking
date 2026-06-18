const wishlistService = require('./wishlistService');
const { serializeBigInt } = require('../../utils/bigintSerializer');

exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = await wishlistService.getWishlist(userId);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách yêu thích thành công',
      data: wishlist
    }));
  } catch (error) {
    return next(error);
  }
};

exports.addWishlistItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId, itemType } = req.body;
    const newItem = await wishlistService.addWishlistItem(userId, itemId, itemType);
    return res.status(201).json(serializeBigInt({
      success: true,
      message: 'Thêm vào danh sách yêu thích thành công',
      data: newItem
    }));
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    return next(error);
  }
};

exports.deleteWishlistItem = async (req, res, next) => {
  try {
    // req.wishlistItem đã được verify ownership bởi checkWishlistOwnership middleware
    const item = req.wishlistItem;
    await wishlistService.deleteById(item.id);
    return res.status(200).json({
      success: true,
      message: 'Xóa khỏi danh sách yêu thích thành công'
    });
  } catch (error) {
    return next(error);
  }
};
