/* ============================================================
   Lightweight i18n for LumiForest Admin (English / Tiếng Việt)
   - Static text: add [data-i18n], [data-i18n-placeholder],
     [data-i18n-title] attributes in HTML.
   - Dynamic text (rendered by JS): call window.t('key').
   - On language switch, a 'i18n:changed' event is dispatched
     so dynamic views can re-render.
   ============================================================ */
(function () {
  const translations = {
    en: {
      'nav.dashboard': 'Dashboard',
      'nav.users': 'Users',
      'nav.reports': 'Reports',
      'nav.audit': 'Audit Logs',
      'nav.trash': 'Trash',
      'nav.settings': 'System Settings',
      'nav.website': 'View Website',
      'section.management': 'Management',
      'section.other': 'Other',
      'menu.profile': 'Profile',
      'menu.settings': 'Settings',
      'menu.logout': 'Logout',

      // Settings page
      'settings.title': 'System Settings',
      'settings.subtitle': 'Update website footer information, banners, and Instagram links.',
      'settings.tab.footer': 'Footer Settings',
      'settings.tab.banners': 'Banners Settings',
      'settings.tab.instagram': 'Instagram Settings',
      'settings.tab.catBanners': 'Category Banners',
      'settings.tab.aboutImage': 'About Section Image',
      'settings.tab.services': 'Services Settings',
      'settings.footer.desc': 'Introductory text about company',
      'settings.footer.address': 'Contact Address',
      'settings.footer.phone': 'Contact Phone',
      'settings.footer.email': 'Contact Email',
      'settings.save': 'Save Settings',
      'settings.loading': 'Loading configurations...',
      'settings.saveSuccess': 'Website settings updated successfully!',
      'settings.saveError': 'Failed to save settings.',
      'settings.banner.add': 'Add Slide Banner',
      'settings.banner.title': 'Banner Title',
      'settings.banner.subtitle': 'Banner Subtitle / Description',
      'settings.banner.image': 'Upload Banner Image',
      'settings.banner.link': 'Banner Redirect Link',
      'settings.instagram.add': 'Add Instagram Image',
      'settings.instagram.image': 'Instagram Image',
      'settings.instagram.link': 'Instagram Post URL',
      'settings.aboutImage.title': 'About Section Image',
      'settings.services.add': 'Add Service',
      'settings.services.icon': 'Icon Class (e.g. flaticon-spa)',
      'settings.services.title': 'Service Title',
      'settings.services.desc': 'Service Description',
      'settings.services.max': 'You can only add a maximum of 4 services.',

      // Dashboard
      'dash.welcome': 'Welcome back 👋',
      'dash.subtitle': 'Overview of your administration system activity.',
      'stat.users': 'Total Users',
      'stat.logs': 'Audit Logs',
      'stat.active': 'Active Sessions',
      'stat.trash': 'Trash Items',
      'chart.regTrends': 'User Registration Trends',
      'chart.rolesDist': 'User Roles Distribution',
      'chart.newUsers': 'New Users',

      // Roles
      'role.admin': 'Admin',
      'role.staff': 'Staff',
      'role.customer': 'Customer',

      // Table headers
      'th.id': 'ID',
      'th.name': 'Name',
      'th.email': 'Email',
      'th.role': 'Role',
      'th.actions': 'Actions',
      'th.date': 'Date',
      'th.performedBy': 'Performed By',
      'th.action': 'Action',
      'th.entity': 'Entity',
      'th.details': 'Details',
      'th.type': 'Type',
      'th.info': 'Info',
      'th.deletedAt': 'Deleted At',

      // Users page
      'users.title': 'Manage Users',
      'users.subtitle': 'Create, edit and assign account roles.',
      'users.add': 'Add User',
      'users.loading': 'Loading users...',
      'users.empty': 'No users found',
      'users.error': 'Error loading users',
      'modal.title': 'Add / Edit User',
      'modal.addTitle': 'Add User',
      'modal.editTitle': 'Edit User',
      'modal.username': 'Username',
      'modal.email': 'Email',
      'modal.password': 'Password',
      'modal.pwdHelp': '(Leave blank if unchanged)',
      'modal.role': 'Role',
      'modal.cancel': 'Cancel',
      'modal.save': 'Save',
      'btn.edit': 'Edit',
      'btn.delete': 'Delete',
      'btn.restore': 'Restore',
      'confirm.deleteUser': 'Are you sure you want to delete this user?',
      'alert.deleteUserFail': 'Failed to delete user: ',
      'error.saveUser': 'Failed to save user',

      // Reports page
      'reports.title': 'Business Reports',
      'reports.subtitle': 'View revenue charts and top booking destinations.',
      'reports.revenueChart': 'Monthly Revenue',
      'reports.topLocations': 'Top Locations',
      'reports.topHotels': 'Top Hotels',
      'reports.month.all': 'All Months',
      'reports.type.all': 'All Services',
      'reports.type.hotel': 'Hotels',
      'reports.type.tour': 'Tours',
      'reports.type.voucher': 'Vouchers',

      // Audit page
      'audit.title': 'Audit Logs',
      'audit.subtitle': 'History of critical administrative actions across the system.',
      'filter.action': 'Action',
      'filter.allActions': 'All Actions',
      'filter.entity': 'Entity',
      'filter.entityPlaceholder': 'e.g. User',
      'filter.filter': 'Filter',
      'audit.loading': 'Loading logs...',
      'audit.empty': 'No audit logs found',
      'audit.error': 'Error loading audit logs',
      'audit.performedBy': 'Admin (ID: {id})',
      'audit.entity.user': 'User',
      'audit.entity.setting': 'System Setting',
      'audit.detail.create': 'Created user account <strong>{name}</strong> ({email}) with role <strong>{role}</strong>.',
      'audit.detail.update': 'Updated user account (ID: {id}) to: Name: <strong>{name}</strong>, Email: <strong>{email}</strong>, Role: <strong>{role}</strong>.',
      'audit.detail.updateSetting': 'Updated system setting: <strong>{key}</strong>.',
      'audit.detail.delete': 'Permanently deleted user account (ID: {id}).',
      'audit.detail.restore': 'Restored user account (ID: {id}) <strong>{name}</strong>.',

      // Trash page
      'trash.title': 'Trash',
      'trash.subtitle': 'Manage and restore soft-deleted items.',
      'trash.loading': 'Loading trash...',
      'trash.empty': 'Trash is empty',
      'trash.error': 'Error loading trash items',
      'trash.unknown': 'Unknown',
      'confirm.restore': 'Restore this item?',
      'alert.restoreFail': 'Failed to restore item: ',

      // Login
      'login.subtitle': 'Sign in to access the dashboard',
      'login.email': 'Email',
      'login.password': 'Password',
      'login.btn': 'Login',
      'login.signing': 'Signing in...',
      'login.error': 'Login failed. Please check your credentials.',
    },

    vi: {
      // Sidebar / nav
      'nav.dashboard': 'Tổng quan',
      'nav.users': 'Người dùng',
      'nav.reports': 'Báo cáo',
      'nav.audit': 'Nhật ký',
      'nav.trash': 'Thùng rác',
      'nav.settings': 'Cấu hình hệ thống',
      'nav.website': 'Xem website',
      'section.management': 'Quản trị',
      'section.other': 'Khác',
      'menu.profile': 'Hồ sơ',
      'menu.settings': 'Cài đặt',
      'menu.logout': 'Đăng xuất',

      // Settings page
      'settings.title': 'Cấu hình hệ thống',
      'settings.subtitle': 'Cập nhật thông tin footer website, banner giới thiệu và mục Instagram.',
      'settings.tab.footer': 'Cấu hình Footer',
      'settings.tab.banners': 'Cấu hình Banner',
      'settings.tab.instagram': 'Cấu hình Instagram',
      'settings.tab.catBanners': 'Cấu hình Banner chuyên mục',
      'settings.tab.aboutImage': 'Hình Ảnh Giới Thiệu',
      'settings.tab.services': 'Cấu hình Dịch vụ',

      'settings.footer.desc': 'Văn bản giới thiệu về công ty',
      'settings.footer.address': 'Địa chỉ liên hệ',
      'settings.footer.phone': 'Số điện thoại',
      'settings.footer.email': 'Email liên hệ',
      'settings.save': 'Lưu cấu hình',
      'settings.loading': 'Đang tải cấu hình...',
      'settings.saveSuccess': 'Cập nhật cấu hình website thành công!',
      'settings.saveError': 'Lưu cấu hình thất bại.',
      'settings.banner.add': 'Thêm slide banner',
      'settings.banner.title': 'Tiêu đề Banner',
      'settings.banner.subtitle': 'Mô tả / Phụ đề Banner',
      'settings.banner.image': 'Tải ảnh Banner',
      'settings.banner.link': 'Đường dẫn liên kết',
      'settings.instagram.add': 'Thêm ảnh Instagram',
      'settings.instagram.image': 'Tải ảnh Instagram',
      'settings.instagram.link': 'Đường dẫn bài viết Instagram',
      'settings.aboutImage.title': 'Hình Ảnh Giới Thiệu',
      'settings.services.add': 'Thêm Dịch vụ',
      'settings.services.icon': 'Mã Icon (vd: flaticon-spa)',
      'settings.services.title': 'Tên Dịch vụ',
      'settings.services.desc': 'Mô tả Dịch vụ',
      'settings.services.max': 'Bạn chỉ có thể thêm tối đa 4 dịch vụ.',

      // Dashboard
      'dash.welcome': 'Chào mừng trở lại 👋',
      'dash.subtitle': 'Tổng quan hoạt động hệ thống quản trị.',
      'stat.users': 'Tổng người dùng',
      'stat.logs': 'Nhật ký hệ thống',
      'stat.active': 'Phiên hoạt động',
      'stat.trash': 'Mục trong thùng rác',
      'chart.regTrends': 'Xu hướng đăng ký người dùng',
      'chart.rolesDist': 'Phân bố vai trò',
      'chart.newUsers': 'Người dùng mới',

      // Roles
      'role.admin': 'Quản trị viên',
      'role.staff': 'Nhân viên',
      'role.customer': 'Khách hàng',

      // Table headers
      'th.id': 'ID',
      'th.name': 'Tên',
      'th.email': 'Email',
      'th.role': 'Vai trò',
      'th.actions': 'Thao tác',
      'th.date': 'Thời gian',
      'th.performedBy': 'Người thực hiện',
      'th.action': 'Hành động',
      'th.entity': 'Đối tượng',
      'th.details': 'Chi tiết',
      'th.type': 'Loại',
      'th.info': 'Thông tin',
      'th.deletedAt': 'Đã xóa lúc',

      // Users page
      'users.title': 'Quản lý người dùng',
      'users.subtitle': 'Tạo, chỉnh sửa và phân quyền tài khoản.',
      'users.add': 'Thêm người dùng',
      'users.loading': 'Đang tải người dùng...',
      'users.empty': 'Không có người dùng nào',
      'users.error': 'Lỗi khi tải người dùng',
      'modal.title': 'Thêm / Sửa người dùng',
      'modal.addTitle': 'Thêm người dùng',
      'modal.editTitle': 'Sửa người dùng',
      'modal.username': 'Tên người dùng',
      'modal.email': 'Email',
      'modal.password': 'Mật khẩu',
      'modal.pwdHelp': '(Để trống nếu không đổi)',
      'modal.role': 'Vai trò',
      'modal.cancel': 'Hủy',
      'modal.save': 'Lưu',
      'btn.edit': 'Sửa',
      'btn.delete': 'Xóa',
      'btn.restore': 'Khôi phục',
      'confirm.deleteUser': 'Bạn có chắc muốn xóa người dùng này?',
      'alert.deleteUserFail': 'Xóa người dùng thất bại: ',
      'error.saveUser': 'Lưu người dùng thất bại',

      // Reports page
      'reports.title': 'Báo cáo Kinh doanh',
      'reports.subtitle': 'Xem biểu đồ doanh thu và các địa điểm được đặt nhiều nhất.',
      'reports.revenueChart': 'Doanh thu Hàng tháng',
      'reports.topLocations': 'Top Địa điểm',
      'reports.topHotels': 'Top Khách sạn',
      'reports.month.all': 'Tất cả các tháng',
      'reports.type.all': 'Tất cả Dịch vụ',
      'reports.type.hotel': 'Khách sạn',
      'reports.type.tour': 'Tour du lịch',
      'reports.type.voucher': 'Mã giảm giá',

      // Audit page
      'audit.title': 'Nhật ký hệ thống',
      'audit.subtitle': 'Lịch sử các thao tác quản trị quan trọng trong hệ thống.',
      'filter.action': 'Hành động',
      'filter.allActions': 'Tất cả',
      'filter.entity': 'Đối tượng',
      'filter.entityPlaceholder': 'VD: User',
      'filter.filter': 'Lọc',
      'audit.loading': 'Đang tải nhật ký...',
      'audit.empty': 'Không có nhật ký nào',
      'audit.error': 'Lỗi khi tải nhật ký',
      'audit.performedBy': 'Quản trị (ID: {id})',
      'audit.entity.user': 'Người dùng',
      'audit.entity.setting': 'Cấu hình hệ thống',
      'audit.detail.create': 'Đã tạo tài khoản <strong>{name}</strong> ({email}) với vai trò <strong>{role}</strong>.',
      'audit.detail.update': 'Đã cập nhật tài khoản (ID: {id}): Tên: <strong>{name}</strong>, Email: <strong>{email}</strong>, Vai trò: <strong>{role}</strong>.',
      'audit.detail.updateSetting': 'Đã cập nhật cấu hình hệ thống: <strong>{key}</strong>.',
      'audit.detail.delete': 'Đã xóa vĩnh viễn tài khoản (ID: {id}).',
      'audit.detail.restore': 'Đã khôi phục tài khoản (ID: {id}) <strong>{name}</strong>.',

      // Trash page
      'trash.title': 'Thùng rác',
      'trash.subtitle': 'Quản lý và khôi phục các mục đã xóa mềm.',
      'trash.loading': 'Đang tải thùng rác...',
      'trash.empty': 'Thùng rác trống',
      'trash.error': 'Lỗi khi tải thùng rác',
      'trash.unknown': 'Không rõ',
      'confirm.restore': 'Khôi phục mục này?',
      'alert.restoreFail': 'Khôi phục thất bại: ',

      // Login
      'login.subtitle': 'Đăng nhập để truy cập bảng điều khiển',
      'login.email': 'Email',
      'login.password': 'Mật khẩu',
      'login.btn': 'Đăng nhập',
      'login.signing': 'Đang đăng nhập...',
      'login.error': 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.',
    },
  };

  const STORAGE_KEY = 'admin_lang';

  function getLang() {
    const l = localStorage.getItem(STORAGE_KEY);
    return l === 'vi' ? 'vi' : 'en';
  }

  function t(key) {
    const lang = getLang();
    return (translations[lang] && translations[lang][key]) || key;
  }

  // Translate with {placeholder} interpolation, e.g. tf('audit.detail.delete', { id: 5 })
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
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  function updateToggleLabel() {
    const lang = getLang();
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang.toUpperCase();
    const flag = document.getElementById('lang-flag');
    if (flag) flag.className = 'fi fi-' + (lang === 'vi' ? 'vn' : 'gb');
  }

  function setLang(lang) {
    lang = lang === 'vi' ? 'vi' : 'en';
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    applyI18n(document);
    updateToggleLabel();
    // Notify dynamic views to re-render their content.
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
  }

  function toggleLang() {
    setLang(getLang() === 'en' ? 'vi' : 'en');
  }

  // Expose globally for dynamic renderers.
  window.I18N = { t, tf, getLang, setLang, toggleLang, applyI18n };
  window.t = t;
  window.tf = tf;

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = getLang();
    applyI18n(document);
    updateToggleLabel();

    const toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLang();
      });
    }
  });
})();
