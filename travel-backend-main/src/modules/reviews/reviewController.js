const reviewService = require('./reviewService');
const { serializeBigInt } = require('../../utils/bigintSerializer');

exports.createReview = async (req, res, next) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;
    const review = await reviewService.createReview(req.user, BigInt(targetId), targetType, rating, comment);
    return res.status(201).json(serializeBigInt({
      success: true,
      message: 'Đăng đánh giá thành công',
      data: review
    }));
  } catch (error) {
    if (error.status === 400 || error.status === 403) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    return next(error);
  }
};

exports.getReviewsByHotel = async (req, res, next) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    if (isNaN(hotelId)) {
      return res.status(400).json({ success: false, message: 'ID khách sạn không hợp lệ' });
    }
    const { page, limit } = req.query;
    const result = await reviewService.getReviewsByTarget('HOTEL', BigInt(hotelId), page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách đánh giá khách sạn thành công',
      data: result.reviews,
      stats: result.stats,
      pagination: result.pagination
    }));
  } catch (error) {
    return next(error);
  }
};

exports.getReviewsByApartment = async (req, res, next) => {
  try {
    const apartmentId = parseInt(req.params.apartmentId, 10);
    if (isNaN(apartmentId)) {
      return res.status(400).json({ success: false, message: 'ID căn hộ không hợp lệ' });
    }
    const { page, limit } = req.query;
    const result = await reviewService.getReviewsByTarget('APARTMENT', BigInt(apartmentId), page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách đánh giá căn hộ thành công',
      data: result.reviews,
      stats: result.stats,
      pagination: result.pagination
    }));
  } catch (error) {
    return next(error);
  }
};

exports.getReviewsByTour = async (req, res, next) => {
  try {
    const tourId = parseInt(req.params.tourId, 10);
    if (isNaN(tourId)) {
      return res.status(400).json({ success: false, message: 'ID tour không hợp lệ' });
    }
    const { page, limit } = req.query;
    const result = await reviewService.getReviewsByTarget('TOUR', BigInt(tourId), page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách đánh giá tour thành công',
      data: result.reviews,
      stats: result.stats,
      pagination: result.pagination
    }));
  } catch (error) {
    return next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }
    const updated = await reviewService.updateReview(BigInt(id), userId, req.body);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: updated
    }));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    return next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }
    await reviewService.deleteReview(BigInt(id), userId, req.user.role);
    return res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    return next(error);
  }
};

exports.reportReview = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }
    const { reason } = req.body;
    const updated = await reviewService.reportReview(BigInt(id), reason);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Báo cáo đánh giá thành công',
      data: updated
    }));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    return next(error);
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await reviewService.getAllReviews(filters, page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách đánh giá thành công',
      data: result.reviews,
      pagination: result.pagination
    }));
  } catch (error) {
    return next(error);
  }
};
