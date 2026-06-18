export const CONFIG = {
  API_BASE: 'http://localhost:3000/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh-token',
      PROFILE: '/auth/profile'
    },
    HOTELS: '/hotels',
    HOTEL_IMAGES: '/hotel-images',
    ROOMS: '/rooms',
    ROOM_IMAGES: '/room-images',
    APARTMENTS: '/apartments',
    APARTMENT_IMAGES: '/apartment-images',
    TOURS: '/tours',
    TOUR_IMAGES: '/tour-images',
    VOUCHERS: '/vouchers',
    VOUCHER_ORDERS: '/voucher-orders',
    BOOKINGS: {
      HOTEL: '/bookings',
      TOUR: '/tour-bookings',
      APARTMENT: '/bookings/apartment'
    },
    PAYMENTS: '/payments',
    REVIEWS: '/reviews',
    CONTACT: '/contact',
    BLOG: '/blog',
    BLOG_COMMENTS: '/blog/admin/comments',
    SETTINGS: '/settings'
  }
};
