/* ============================================================
   LumiForest — Staff panel i18n (English / Tiếng Việt)
   Shares localStorage key 'site_lang' with the public site.
   On language change the page reloads so all JS-rendered
   content picks up the new language automatically.
   ============================================================ */
const STORAGE_KEY = 'site_lang';

const translations = {
  en: {
    /* ---- Sidebar ---- */
    'staff.panel': 'Staff Panel',
    'staff.sec.overview': 'Overview',
    'staff.dashboard': 'Dashboard',
    'staff.sec.manage': 'Manage',
    'staff.accommodation': 'Accommodation',
    'staff.hotels': 'Hotels',
    'staff.rooms': 'Rooms',
    'staff.apartments': 'Apartments',
    'staff.tours': 'Tours',
    'staff.vouchers': 'Vouchers',
    'staff.blog': 'Blog',
    'staff.posts': 'Posts',
    'staff.comments': 'Comments',
    'staff.sec.operations': 'Operations',
    'staff.bookings': 'Bookings',
    'staff.payments': 'Payments',
    'staff.reviews': 'Reviews',
    'staff.contacts': 'Contacts',
    'staff.viewWebsite': 'View Website',

    /* ---- Header ---- */
    'staff.header.profile': 'Profile',
    'staff.header.logout': 'Logout',

    /* ---- Common actions ---- */
    'staff.cancel': 'Cancel',
    'staff.close': 'Close',
    'staff.save': 'Save',
    'staff.edit': 'Edit',
    'staff.delete': 'Delete',
    'staff.confirm': 'Confirm',
    'staff.actions': 'Actions',
    'staff.viewDetails': 'View Details',
    'staff.updateStatus': 'Update Status',
    'staff.saving': 'Saving...',
    'staff.required': 'Please fill in all required fields.',

    /* ---- Common form labels ---- */
    'staff.label.name': 'Name',
    'staff.label.address': 'Address',
    'staff.label.city': 'City',
    'staff.label.description': 'Description',
    'staff.label.images': 'Images',
    'staff.label.price': 'Price',
    'staff.label.status': 'Status',

    /* ---- Common table columns ---- */
    'staff.col.id': 'ID',
    'staff.col.customer': 'Customer',
    'staff.col.date': 'Date',
    'staff.col.amount': 'Amount',
    'staff.col.status': 'Status',
    'staff.col.name': 'Name',
    'staff.col.address': 'Address',
    'staff.col.stars': 'Stars',
    'staff.col.hotelName': 'Hotel Name',
    'staff.col.type': 'Type',
    'staff.col.price': 'Price/Night',
    'staff.col.capacity': 'Capacity',
    'staff.col.destination': 'Destination',
    'staff.col.duration': 'Duration',
    'staff.col.value': 'Value',
    'staff.col.quantity': 'Quantity',
    'staff.col.title': 'Title',
    'staff.col.author': 'Author',
    'staff.col.publishedAt': 'Published',
    'staff.col.rating': 'Rating',
    'staff.col.content': 'Content',
    'staff.col.method': 'Method',
    'staff.col.user': 'User',
    'staff.col.email': 'Email',
    'staff.col.subject': 'Subject',
    'staff.col.message': 'Message',
    'staff.col.post': 'Post',

    /* ---- Modals (global) ---- */
    'staff.modal.detail': 'Detail',
    'staff.modal.confirm': 'Confirm Action',
    'staff.modal.confirmBody': 'Are you sure you want to proceed?',

    /* ---- Dashboard ---- */
    'staff.dash.welcome': 'Welcome back 👋',
    'staff.dash.subtitle': "Overview of today's activity.",
    'staff.dash.newBookings': 'New Bookings',
    'staff.dash.revenue': 'Revenue',
    'staff.dash.totalReviews': 'Total Reviews',
    'staff.dash.inquiries': 'Inquiries',
    'staff.dash.recentBookings': 'Recent Bookings',
    'staff.dash.viewAll': 'View all',
    'staff.dash.noBookings': 'No recent bookings found.',

    /* ---- Hotels ---- */
    'staff.hotels.title': 'Hotels Management',
    'staff.hotels.add': 'Add Hotel',
    'staff.hotels.addModal': 'Add Hotel',
    'staff.hotels.editModal': 'Edit Hotel',
    'staff.hotels.searchPh': 'Search hotels...',
    'staff.hotels.none': 'No hotels found.',
    'staff.hotels.labelStar': 'Star Rating',
    'staff.hotels.save': 'Save Hotel',
    'staff.hotels.savedOk': 'Hotel updated successfully',
    'staff.hotels.createdOk': 'Hotel created successfully',
    'staff.hotels.deletedOk': 'Hotel deleted successfully',
    'staff.hotels.deleteFail': 'Failed to delete hotel',
    'staff.hotels.saveFail': 'Failed to save hotel',
    'staff.hotels.confirmDelete': 'Are you sure you want to delete {name}?',

    /* ---- Rooms ---- */
    'staff.rooms.title': 'Rooms Management',
    'staff.rooms.add': 'Add Room',
    'staff.rooms.addModal': 'Add Room',
    'staff.rooms.editModal': 'Edit Room',
    'staff.rooms.allHotels': 'All Hotels',
    'staff.rooms.none': 'No rooms found.',
    'staff.rooms.labelHotel': 'Hotel',
    'staff.rooms.labelType': 'Room Type',
    'staff.rooms.labelPrice': 'Price / Night',
    'staff.rooms.labelCapacity': 'Capacity (Adults)',
    'staff.rooms.labelCount': 'Total Rooms Available',
    'staff.rooms.labelAmenities': 'Amenities',
    'staff.rooms.amenitiesPh': 'Wifi, TV, Minibar (comma separated)',
    'staff.rooms.typePh': 'e.g. Deluxe Double',
    'staff.rooms.save': 'Save Room',
    'staff.rooms.savedOk': 'Room updated successfully',
    'staff.rooms.createdOk': 'Room created successfully',
    'staff.rooms.deletedOk': 'Room deleted successfully',
    'staff.rooms.saveFail': 'Failed to save room',
    'staff.rooms.confirmDelete': 'Are you sure you want to delete this room?',

    /* ---- Apartments ---- */
    'staff.apts.title': 'Apartments Management',
    'staff.apts.add': 'Add Apartment',
    'staff.apts.addModal': 'Add Apartment',
    'staff.apts.editModal': 'Edit Apartment',
    'staff.apts.searchPh': 'Search apartments...',
    'staff.apts.none': 'No apartments found.',
    'staff.apts.labelPrice': 'Price / Night',
    'staff.apts.labelGuests': 'Max Guests',
    'staff.apts.save': 'Save Apartment',
    'staff.apts.savedOk': 'Apartment updated successfully',
    'staff.apts.createdOk': 'Apartment created successfully',
    'staff.apts.deletedOk': 'Apartment deleted successfully',
    'staff.apts.saveFail': 'Failed to save apartment',
    'staff.apts.confirmDelete': 'Are you sure you want to delete {name}?',

    /* ---- Tours ---- */
    'staff.tours.title': 'Tours Management',
    'staff.tours.add': 'Add Tour',
    'staff.tours.addModal': 'Add Tour',
    'staff.tours.editModal': 'Edit Tour',
    'staff.tours.searchPh': 'Search tours...',
    'staff.tours.none': 'No tours found.',
    'staff.tours.labelDest': 'Destination',
    'staff.tours.labelDuration': 'Duration (Days)',
    'staff.tours.labelDate': 'Date',
    'staff.tours.save': 'Save Tour',
    'staff.tours.savedOk': 'Tour updated successfully',
    'staff.tours.createdOk': 'Tour created successfully',
    'staff.tours.deletedOk': 'Tour deleted successfully',
    'staff.tours.saveFail': 'Failed to save tour',
    'staff.tours.confirmDelete': 'Are you sure you want to delete {name}?',

    /* ---- Vouchers ---- */
    'staff.vouchers.title': 'Vouchers Management',
    'staff.vouchers.add': 'Add Voucher',
    'staff.vouchers.addModal': 'Add Voucher',
    'staff.vouchers.editModal': 'Edit Voucher',
    'staff.vouchers.searchPh': 'Search vouchers...',
    'staff.vouchers.none': 'No vouchers found.',
    'staff.vouchers.labelValue': 'Value',
    'staff.vouchers.labelQty': 'Total Quantity',
    'staff.vouchers.labelRemaining': 'Remaining Quantity',
    'staff.vouchers.labelCover': 'Voucher Cover Image',
    'staff.vouchers.save': 'Save Voucher',
    'staff.vouchers.savedOk': 'Voucher updated successfully',
    'staff.vouchers.createdOk': 'Voucher created successfully',
    'staff.vouchers.deletedOk': 'Voucher deleted successfully',
    'staff.vouchers.saveFail': 'Failed to save voucher',
    'staff.vouchers.confirmDelete': 'Are you sure you want to delete {name}?',

    /* ---- Blogs ---- */
    'staff.blogs.title': 'Blogs Management',
    'staff.blogs.write': 'Write Blog',
    'staff.blogs.writeModal': 'Write Blog',
    'staff.blogs.editModal': 'Edit Blog',
    'staff.blogs.searchPh': 'Search title or content...',
    'staff.blogs.none': 'No blog posts found.',
    'staff.blogs.labelTitle': 'Title',
    'staff.blogs.labelSlug': 'Slug',
    'staff.blogs.slugNote': 'Auto-generated from title',
    'staff.blogs.labelContent': 'Content',
    'staff.blogs.labelCover': 'Cover Image',
    'staff.blogs.publish': 'Publish Blog',
    'staff.blogs.savedOk': 'Blog updated successfully',
    'staff.blogs.createdOk': 'Blog published successfully',
    'staff.blogs.deletedOk': 'Blog deleted successfully',
    'staff.blogs.saveFail': 'Failed to save blog',
    'staff.blogs.confirmDelete': 'Are you sure you want to delete "{title}"?',

    /* ---- Blog Comments ---- */
    'staff.comments.title': 'Blog Comments',
    'staff.comments.allPosts': 'All Posts',
    'staff.comments.searchPh': 'Search by author or content...',
    'staff.comments.none': 'No comments found.',
    'staff.comments.deletedOk': 'Comment deleted',
    'staff.comments.confirmDelete': 'Delete this comment?',

    /* ---- Bookings ---- */
    'staff.bookings.title': 'Bookings Management',
    'staff.bookings.searchPh': 'Search by ID or customer...',
    'staff.bookings.allStatuses': 'All Statuses',
    'staff.bookings.pending': 'Pending',
    'staff.bookings.confirmed': 'Confirmed',
    'staff.bookings.checkedIn': 'Checked In',
    'staff.bookings.checkedOut': 'Checked Out',
    'staff.bookings.active': 'Active',
    'staff.bookings.expired': 'Expired',
    'staff.bookings.cancelled': 'Cancelled',
    'staff.bookings.hotelType': 'Hotel Bookings',
    'staff.bookings.tourType': 'Tour Bookings',
    'staff.bookings.aptType': 'Apartment Bookings',
    'staff.bookings.modalTitle': 'Update Booking Status',
    'staff.bookings.saveStatus': 'Save Status',
    'staff.bookings.none': 'No bookings found.',
    'staff.bookings.savedOk': 'Booking status updated',
    'staff.bookings.saveFail': 'Failed to update status',

    /* ---- Payments ---- */
    'staff.payments.title': 'Payments Management',
    'staff.payments.searchPh': 'Search by payment ID...',
    'staff.payments.allStatuses': 'All Statuses',
    'staff.payments.pending': 'Pending',
    'staff.payments.completed': 'Completed',
    'staff.payments.failed': 'Failed',
    'staff.payments.refunded': 'Refunded',
    'staff.payments.none': 'No payments found.',

    /* ---- Reviews ---- */
    'staff.reviews.title': 'Reviews Management',
    'staff.reviews.searchPh': 'Search user or content...',
    'staff.reviews.allRatings': 'All Ratings',
    'staff.reviews.none': 'No reviews found.',
    'staff.reviews.deletedOk': 'Review deleted',
    'staff.reviews.confirmDelete': 'Delete this review?',

    /* ---- Contacts ---- */
    'staff.inquiries.title': 'Inquiries Management',
    'staff.inquiries.searchPh': 'Search by name, email or message...',
    'staff.inquiries.none': 'No inquiries found.',
    'staff.inquiries.deletedOk': 'Inquiry deleted',
    'staff.inquiries.confirmDelete': 'Delete this inquiry?',
  },

  vi: {
    /* ---- Sidebar ---- */
    'staff.panel': 'Bảng Staff',
    'staff.sec.overview': 'Tổng quan',
    'staff.dashboard': 'Bảng điều khiển',
    'staff.sec.manage': 'Quản lý',
    'staff.accommodation': 'Chỗ ở',
    'staff.hotels': 'Khách sạn',
    'staff.rooms': 'Phòng',
    'staff.apartments': 'Căn hộ',
    'staff.tours': 'Tour',
    'staff.vouchers': 'Voucher',
    'staff.blog': 'Blog',
    'staff.posts': 'Bài viết',
    'staff.comments': 'Bình luận',
    'staff.sec.operations': 'Vận hành',
    'staff.bookings': 'Đặt chỗ',
    'staff.payments': 'Thanh toán',
    'staff.reviews': 'Đánh giá',
    'staff.contacts': 'Liên hệ',
    'staff.viewWebsite': 'Xem trang web',

    /* ---- Header ---- */
    'staff.header.profile': 'Hồ sơ',
    'staff.header.logout': 'Đăng xuất',

    /* ---- Common actions ---- */
    'staff.cancel': 'Hủy',
    'staff.close': 'Đóng',
    'staff.save': 'Lưu',
    'staff.edit': 'Sửa',
    'staff.delete': 'Xóa',
    'staff.confirm': 'Xác nhận',
    'staff.actions': 'Hành động',
    'staff.viewDetails': 'Xem chi tiết',
    'staff.updateStatus': 'Cập nhật trạng thái',
    'staff.saving': 'Đang lưu...',
    'staff.required': 'Vui lòng điền đầy đủ các trường bắt buộc.',

    /* ---- Common form labels ---- */
    'staff.label.name': 'Tên',
    'staff.label.address': 'Địa chỉ',
    'staff.label.city': 'Thành phố',
    'staff.label.description': 'Mô tả',
    'staff.label.images': 'Ảnh',
    'staff.label.price': 'Giá',
    'staff.label.status': 'Trạng thái',

    /* ---- Common table columns ---- */
    'staff.col.id': 'ID',
    'staff.col.customer': 'Khách hàng',
    'staff.col.date': 'Ngày',
    'staff.col.amount': 'Số tiền',
    'staff.col.status': 'Trạng thái',
    'staff.col.name': 'Tên',
    'staff.col.address': 'Địa chỉ',
    'staff.col.stars': 'Sao',
    'staff.col.hotelName': 'Tên khách sạn',
    'staff.col.type': 'Loại',
    'staff.col.price': 'Giá/Đêm',
    'staff.col.capacity': 'Sức chứa',
    'staff.col.destination': 'Điểm đến',
    'staff.col.duration': 'Thời gian',
    'staff.col.value': 'Giá trị',
    'staff.col.quantity': 'Số lượng',
    'staff.col.title': 'Tiêu đề',
    'staff.col.author': 'Tác giả',
    'staff.col.publishedAt': 'Đăng ngày',
    'staff.col.rating': 'Đánh giá',
    'staff.col.content': 'Nội dung',
    'staff.col.method': 'Phương thức',
    'staff.col.user': 'Người dùng',
    'staff.col.email': 'Email',
    'staff.col.subject': 'Chủ đề',
    'staff.col.message': 'Nội dung',
    'staff.col.post': 'Bài viết',

    /* ---- Modals (global) ---- */
    'staff.modal.detail': 'Chi tiết',
    'staff.modal.confirm': 'Xác nhận hành động',
    'staff.modal.confirmBody': 'Bạn có chắc muốn thực hiện?',

    /* ---- Dashboard ---- */
    'staff.dash.welcome': 'Chào mừng trở lại 👋',
    'staff.dash.subtitle': 'Tổng quan hoạt động hôm nay.',
    'staff.dash.newBookings': 'Đặt chỗ mới',
    'staff.dash.revenue': 'Doanh thu',
    'staff.dash.totalReviews': 'Tổng đánh giá',
    'staff.dash.inquiries': 'Yêu cầu',
    'staff.dash.recentBookings': 'Đặt chỗ gần đây',
    'staff.dash.viewAll': 'Xem tất cả',
    'staff.dash.noBookings': 'Không có đặt chỗ gần đây.',

    /* ---- Hotels ---- */
    'staff.hotels.title': 'Quản lý Khách sạn',
    'staff.hotels.add': 'Thêm khách sạn',
    'staff.hotels.addModal': 'Thêm khách sạn',
    'staff.hotels.editModal': 'Sửa khách sạn',
    'staff.hotels.searchPh': 'Tìm khách sạn...',
    'staff.hotels.none': 'Không có khách sạn nào.',
    'staff.hotels.labelStar': 'Hạng sao',
    'staff.hotels.save': 'Lưu khách sạn',
    'staff.hotels.savedOk': 'Cập nhật khách sạn thành công',
    'staff.hotels.createdOk': 'Tạo khách sạn thành công',
    'staff.hotels.deletedOk': 'Xóa khách sạn thành công',
    'staff.hotels.deleteFail': 'Xóa khách sạn thất bại',
    'staff.hotels.saveFail': 'Lưu khách sạn thất bại',
    'staff.hotels.confirmDelete': 'Bạn có chắc muốn xóa {name}?',

    /* ---- Rooms ---- */
    'staff.rooms.title': 'Quản lý Phòng',
    'staff.rooms.add': 'Thêm phòng',
    'staff.rooms.addModal': 'Thêm phòng',
    'staff.rooms.editModal': 'Sửa phòng',
    'staff.rooms.allHotels': 'Tất cả khách sạn',
    'staff.rooms.none': 'Không có phòng nào.',
    'staff.rooms.labelHotel': 'Khách sạn',
    'staff.rooms.labelType': 'Loại phòng',
    'staff.rooms.labelPrice': 'Giá / Đêm',
    'staff.rooms.labelCapacity': 'Sức chứa (Người lớn)',
    'staff.rooms.labelCount': 'Tổng số phòng',
    'staff.rooms.labelAmenities': 'Tiện nghi',
    'staff.rooms.amenitiesPh': 'Wifi, TV, Minibar (cách nhau bởi dấu phẩy)',
    'staff.rooms.typePh': 'vd: Deluxe Double',
    'staff.rooms.save': 'Lưu phòng',
    'staff.rooms.savedOk': 'Cập nhật phòng thành công',
    'staff.rooms.createdOk': 'Tạo phòng thành công',
    'staff.rooms.deletedOk': 'Xóa phòng thành công',
    'staff.rooms.saveFail': 'Lưu phòng thất bại',
    'staff.rooms.confirmDelete': 'Bạn có chắc muốn xóa phòng này?',

    /* ---- Apartments ---- */
    'staff.apts.title': 'Quản lý Căn hộ',
    'staff.apts.add': 'Thêm căn hộ',
    'staff.apts.addModal': 'Thêm căn hộ',
    'staff.apts.editModal': 'Sửa căn hộ',
    'staff.apts.searchPh': 'Tìm căn hộ...',
    'staff.apts.none': 'Không có căn hộ nào.',
    'staff.apts.labelPrice': 'Giá / Đêm',
    'staff.apts.labelGuests': 'Khách tối đa',
    'staff.apts.save': 'Lưu căn hộ',
    'staff.apts.savedOk': 'Cập nhật căn hộ thành công',
    'staff.apts.createdOk': 'Tạo căn hộ thành công',
    'staff.apts.deletedOk': 'Xóa căn hộ thành công',
    'staff.apts.saveFail': 'Lưu căn hộ thất bại',
    'staff.apts.confirmDelete': 'Bạn có chắc muốn xóa {name}?',

    /* ---- Tours ---- */
    'staff.tours.title': 'Quản lý Tour',
    'staff.tours.add': 'Thêm tour',
    'staff.tours.addModal': 'Thêm tour',
    'staff.tours.editModal': 'Sửa tour',
    'staff.tours.searchPh': 'Tìm tour...',
    'staff.tours.none': 'Không có tour nào.',
    'staff.tours.labelDest': 'Điểm đến',
    'staff.tours.labelDuration': 'Thời gian (Ngày)',
    'staff.tours.labelDate': 'Ngày',
    'staff.tours.save': 'Lưu tour',
    'staff.tours.savedOk': 'Cập nhật tour thành công',
    'staff.tours.createdOk': 'Tạo tour thành công',
    'staff.tours.deletedOk': 'Xóa tour thành công',
    'staff.tours.saveFail': 'Lưu tour thất bại',
    'staff.tours.confirmDelete': 'Bạn có chắc muốn xóa {name}?',

    /* ---- Vouchers ---- */
    'staff.vouchers.title': 'Quản lý Voucher',
    'staff.vouchers.add': 'Thêm voucher',
    'staff.vouchers.addModal': 'Thêm voucher',
    'staff.vouchers.editModal': 'Sửa voucher',
    'staff.vouchers.searchPh': 'Tìm voucher...',
    'staff.vouchers.none': 'Không có voucher nào.',
    'staff.vouchers.labelValue': 'Giá trị',
    'staff.vouchers.labelQty': 'Tổng số lượng',
    'staff.vouchers.labelRemaining': 'Số lượng còn lại',
    'staff.vouchers.labelCover': 'Ảnh bìa voucher',
    'staff.vouchers.save': 'Lưu voucher',
    'staff.vouchers.savedOk': 'Cập nhật voucher thành công',
    'staff.vouchers.createdOk': 'Tạo voucher thành công',
    'staff.vouchers.deletedOk': 'Xóa voucher thành công',
    'staff.vouchers.saveFail': 'Lưu voucher thất bại',
    'staff.vouchers.confirmDelete': 'Bạn có chắc muốn xóa {name}?',

    /* ---- Blogs ---- */
    'staff.blogs.title': 'Quản lý Blog',
    'staff.blogs.write': 'Viết bài',
    'staff.blogs.writeModal': 'Viết bài',
    'staff.blogs.editModal': 'Sửa bài viết',
    'staff.blogs.searchPh': 'Tìm tiêu đề hoặc nội dung...',
    'staff.blogs.none': 'Không có bài viết nào.',
    'staff.blogs.labelTitle': 'Tiêu đề',
    'staff.blogs.labelSlug': 'Slug',
    'staff.blogs.slugNote': 'Tự động tạo từ tiêu đề',
    'staff.blogs.labelContent': 'Nội dung',
    'staff.blogs.labelCover': 'Ảnh bìa',
    'staff.blogs.publish': 'Đăng bài',
    'staff.blogs.savedOk': 'Cập nhật bài viết thành công',
    'staff.blogs.createdOk': 'Đăng bài thành công',
    'staff.blogs.deletedOk': 'Xóa bài viết thành công',
    'staff.blogs.saveFail': 'Lưu bài viết thất bại',
    'staff.blogs.confirmDelete': 'Bạn có chắc muốn xóa "{title}"?',

    /* ---- Blog Comments ---- */
    'staff.comments.title': 'Bình luận Blog',
    'staff.comments.allPosts': 'Tất cả bài viết',
    'staff.comments.searchPh': 'Tìm tác giả hoặc nội dung...',
    'staff.comments.none': 'Không có bình luận nào.',
    'staff.comments.deletedOk': 'Đã xóa bình luận',
    'staff.comments.confirmDelete': 'Xóa bình luận này?',

    /* ---- Bookings ---- */
    'staff.bookings.title': 'Quản lý Đặt chỗ',
    'staff.bookings.searchPh': 'Tìm theo ID hoặc khách hàng...',
    'staff.bookings.allStatuses': 'Tất cả trạng thái',
    'staff.bookings.pending': 'Chờ xử lý',
    'staff.bookings.confirmed': 'Đã xác nhận',
    'staff.bookings.checkedIn': 'Đã nhận phòng',
    'staff.bookings.checkedOut': 'Đã trả phòng',
    'staff.bookings.active': 'Còn hiệu lực',
    'staff.bookings.expired': 'Hết hiệu lực',
    'staff.bookings.cancelled': 'Đã hủy',
    'staff.bookings.hotelType': 'Đặt phòng khách sạn',
    'staff.bookings.tourType': 'Đặt tour',
    'staff.bookings.aptType': 'Đặt căn hộ',
    'staff.bookings.modalTitle': 'Cập nhật trạng thái đặt chỗ',
    'staff.bookings.saveStatus': 'Lưu trạng thái',
    'staff.bookings.none': 'Không có đặt chỗ nào.',
    'staff.bookings.savedOk': 'Cập nhật trạng thái thành công',
    'staff.bookings.saveFail': 'Cập nhật trạng thái thất bại',

    /* ---- Payments ---- */
    'staff.payments.title': 'Quản lý Thanh toán',
    'staff.payments.searchPh': 'Tìm theo mã thanh toán...',
    'staff.payments.allStatuses': 'Tất cả trạng thái',
    'staff.payments.pending': 'Chờ xử lý',
    'staff.payments.completed': 'Hoàn thành',
    'staff.payments.failed': 'Thất bại',
    'staff.payments.refunded': 'Đã hoàn tiền',
    'staff.payments.none': 'Không có thanh toán nào.',

    /* ---- Reviews ---- */
    'staff.reviews.title': 'Quản lý Đánh giá',
    'staff.reviews.searchPh': 'Tìm người dùng hoặc nội dung...',
    'staff.reviews.allRatings': 'Tất cả đánh giá',
    'staff.reviews.none': 'Không có đánh giá nào.',
    'staff.reviews.deletedOk': 'Đã xóa đánh giá',
    'staff.reviews.confirmDelete': 'Xóa đánh giá này?',

    /* ---- Contacts ---- */
    'staff.inquiries.title': 'Quản lý Liên hệ',
    'staff.inquiries.searchPh': 'Tìm theo tên, email hoặc nội dung...',
    'staff.inquiries.none': 'Không có yêu cầu nào.',
    'staff.inquiries.deletedOk': 'Đã xóa yêu cầu',
    'staff.inquiries.confirmDelete': 'Xóa yêu cầu này?',
  },
};

function getLang() {
  const l = localStorage.getItem(STORAGE_KEY);
  return l === 'vi' ? 'vi' : 'en';
}

function t(key) {
  const lang = getLang();
  return (translations[lang] && translations[lang][key]) || key;
}

function tf(key, params) {
  let str = t(key);
  if (params) {
    Object.keys(params).forEach((k) => {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k] == null ? '' : params[k]);
    });
  }
  return str;
}

function applyI18n(root) {
  root = root || document;
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  root.querySelectorAll('[data-i18n-value]').forEach(el => {
    el.setAttribute('value', t(el.getAttribute('data-i18n-value')));
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
}

function updateToggle() {
  const lang = getLang();
  document.querySelectorAll('#staff-lang-label').forEach(el => { el.textContent = lang.toUpperCase(); });
  document.querySelectorAll('#staff-lang-flag').forEach(el => {
    el.className = 'fi fi-' + (lang === 'vi' ? 'vn' : 'gb');
  });
}

function apply(root) {
  applyI18n(root || document);
  updateToggle();
}

function setLang(lang) {
  lang = lang === 'vi' ? 'vi' : 'en';
  localStorage.setItem(STORAGE_KEY, lang);
  window.location.reload();
}

function toggleLang() {
  setLang(getLang() === 'en' ? 'vi' : 'en');
}

export const StaffI18N = { t, tf, getLang, setLang, toggleLang, apply, applyI18n };
export { t, tf };
