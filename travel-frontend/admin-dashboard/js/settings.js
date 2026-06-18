document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('settings-form');
  const bannersContainer = document.getElementById('banners-container');
  const instagramContainer = document.getElementById('instagram-container');
  const catBannersContainer = document.getElementById('cat-banners-container');
  const servicesContainer = document.getElementById('services-container');
  const aboutFileInput = document.getElementById('about-file-input');
  const aboutImgUrl = document.getElementById('about-img-url');
  const aboutImagePreview = document.getElementById('about-image-preview');
  const btnResetAboutImage = document.getElementById('btn-reset-about-image');
  const alertEl = document.getElementById('settings-alert');
  const spinner = document.getElementById('saving-spinner');

  const CATEGORIES = [
    { key: 'hotels', name: 'Hotels Page Banner', defaultImg: '../../assets/images/bg_1.jpg' },
    { key: 'apartments', name: 'Apartments Page Banner', defaultImg: '../../assets/images/bg_2.jpg' },
    { key: 'tours', name: 'Tours Page Banner', defaultImg: '../../assets/images/bg_1.jpg' },
    { key: 'vouchers', name: 'Vouchers Page Banner', defaultImg: '../../assets/images/bg_1.jpg' },
    { key: 'blog', name: 'Blog Page Banner', defaultImg: '../../assets/images/bg_1.jpg' },
    { key: 'about', name: 'About Page Banner', defaultImg: '../../assets/images/bg_1.jpg' },
    { key: 'contact', name: 'Contact Page Banner', defaultImg: '../../assets/images/bg_1.jpg' }
  ];

  function showAlert(msg, isSuccess) {
    if (!alertEl) return;
    alertEl.className = 'alert ' + (isSuccess ? 'alert-success' : 'alert-danger');
    alertEl.textContent = msg;
    alertEl.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideAlert() {
    if (alertEl) alertEl.classList.add('d-none');
  }

  // Map initialization
  let map, marker;
  let mapInitialized = false;

  const contactTab = document.getElementById('contact-tab');
  if (contactTab) {
    contactTab.addEventListener('shown.bs.tab', function () {
      if (!mapInitialized) {
        const latVal = document.getElementById('contact-lat').value;
        const lngVal = document.getElementById('contact-lng').value;
        const location = (latVal && lngVal) ? [parseFloat(latVal), parseFloat(lngVal)] : [21.028511, 105.804817];
        
        map = L.map('contact-map').setView(location, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        marker = L.marker(location, { draggable: true }).addTo(map);
        
        async function reverseGeocode(lat, lng) {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
              document.getElementById('contact-address').value = data.display_name;
              const searchInput = document.getElementById('map-search-input');
              if (searchInput) searchInput.value = data.display_name;
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        }

        marker.on('dragend', function (e) {
          const pos = e.target.getLatLng();
          document.getElementById('contact-lat').value = pos.lat;
          document.getElementById('contact-lng').value = pos.lng;
          reverseGeocode(pos.lat, pos.lng);
        });

        map.on('click', function (e) {
          const pos = e.latlng;
          marker.setLatLng(pos);
          document.getElementById('contact-lat').value = pos.lat;
          document.getElementById('contact-lng').value = pos.lng;
          reverseGeocode(pos.lat, pos.lng);
        });

        const mapSearchBtn = document.getElementById('map-search-btn');
        const mapSearchInput = document.getElementById('map-search-input');
        if (mapSearchBtn && mapSearchInput) {
          mapSearchBtn.addEventListener('click', async function () {
            const query = mapSearchInput.value.trim();
            if (!query) return;
            
            try {
              mapSearchBtn.disabled = true;
              mapSearchBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
              
              const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
              const data = await response.json();
              
              if (data && data.length > 0) {
                const newPos = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                map.setView(newPos, 13);
                marker.setLatLng(newPos);
                document.getElementById('contact-lat').value = newPos[0];
                document.getElementById('contact-lng').value = newPos[1];
                document.getElementById('contact-address').value = data[0].display_name;
              } else {
                window.CustomAlert.alert('Location not found. Please try a different search term.');
              }
            } catch (err) {
              console.error('Search error:', err);
              window.CustomAlert.alert('An error occurred while searching for the location.');
            } finally {
              mapSearchBtn.disabled = false;
              mapSearchBtn.innerHTML = '<i class="bi bi-search"></i> Search';
            }
          });
          
          mapSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              mapSearchBtn.click();
            }
          });
        }

        const addressInput = document.getElementById('contact-address');
        if (addressInput) {
          addressInput.addEventListener('change', async function() {
            const query = this.value.trim();
            if (!query) return;
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
              const data = await response.json();
              if (data && data.length > 0) {
                const newPos = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                map.setView(newPos, 13);
                marker.setLatLng(newPos);
                document.getElementById('contact-lat').value = newPos[0];
                document.getElementById('contact-lng').value = newPos[1];
                if (mapSearchInput) mapSearchInput.value = data[0].display_name;
              }
            } catch (err) {
              console.error('Geocoding error on address change:', err);
            }
          });
        }

        mapInitialized = true;
      } else {
        map.invalidateSize();
      }
    });
  }

  // Upload utility
  async function uploadImageFile(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('http://localhost:3000/api/settings/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'File upload failed');
    }

    const data = await res.json();
    return data.data.imageUrl;
  }

  function createBannerCard(banner) {
    banner = banner || {};
    const imageUrl = banner.imageUrl || '';
    const title = banner.title || '';
    const sub = banner.sub || '';
    const link = banner.link || '';

    const div = document.createElement('div');
    div.className = 'banner-slide-card';
    div.innerHTML = `
      <button type="button" class="btn btn-sm btn-outline-danger remove-btn btn-remove-banner"><i class="bi bi-x"></i></button>
      <div class="row g-3">
        <div class="col-md-6">
          <div class="mb-2">
            <label class="form-label" data-i18n="settings.banner.title">Banner Title</label>
            <input type="text" class="form-control banner-title" value="${title.replace(/"/g, '&quot;')}" required>
          </div>
          <div class="mb-2">
            <label class="form-label" data-i18n="settings.banner.subtitle">Banner Subtitle / Description</label>
            <input type="text" class="form-control banner-sub" value="${sub.replace(/"/g, '&quot;')}">
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-2">
            <label class="form-label" data-i18n="settings.banner.link">Banner Redirect Link</label>
            <input type="text" class="form-control banner-link" value="${link.replace(/"/g, '&quot;')}">
          </div>
          <div class="mb-2">
            <label class="form-label">Upload Banner Image</label>
            <input type="file" class="form-control banner-file-input" accept="image/*">
            <input type="hidden" class="banner-img-url" value="${imageUrl}">
            <div class="mt-2 text-center">
              <span class="d-block text-muted small mb-1">Current Active Image</span>
              <img class="preview-img mx-auto banner-preview" src="${imageUrl ? api.resolveUrl(imageUrl) : '../../assets/images/room-1.jpg'}" alt="Preview">
              <button type="button" class="btn btn-sm btn-outline-warning mt-2 btn-reset-single-banner"><i class="bi bi-arrow-counterclockwise"></i> Reset to Default</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const fileInput = div.querySelector('.banner-file-input');
    const preview = div.querySelector('.banner-preview');
    fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });

    div.querySelector('.btn-remove-banner').addEventListener('click', function () {
      div.remove();
    });

    div.querySelector('.btn-reset-single-banner').addEventListener('click', function () {
      const index = Array.from(bannersContainer.children).indexOf(div);
      const defaultImg = index === 1 ? 'assets/images/bg_2.jpg' : 'assets/images/bg_1.jpg';
      div.querySelector('.banner-img-url').value = defaultImg;
      preview.src = api.resolveUrl(defaultImg);
      fileInput.value = '';
    });

    if (window.I18N) window.I18N.applyI18n(div);
    return div;
  }

  function createCategoryCard(catKey, catName, imageUrl, defaultImg) {
    const resolvedUrl = imageUrl ? api.resolveUrl(imageUrl) : defaultImg;
    const div = document.createElement('div');
    div.className = 'banner-slide-card';
    div.setAttribute('data-category', catKey);
    div.innerHTML = `
      <div class="row g-3 align-items-center">
        <div class="col-md-4">
          <h5 class="fw-semibold mb-0 text-primary">${catName}</h5>
          <span class="text-muted small">Key: ${catKey}</span>
        </div>
        <div class="col-md-5">
          <label class="form-label mb-1">Upload Banner Image</label>
          <input type="file" class="form-control cat-file-input" accept="image/*">
          <input type="hidden" class="cat-img-url" value="${imageUrl || ''}">
          <button type="button" class="btn btn-sm btn-outline-warning mt-2 btn-reset-single-cat"><i class="bi bi-arrow-counterclockwise"></i> Reset to Default</button>
        </div>
        <div class="col-md-3 text-center">
          <span class="d-block text-muted small mb-1">Current Active Image</span>
          <img class="preview-img mx-auto cat-preview" src="${resolvedUrl}" alt="Preview">
        </div>
      </div>
    `;

    const fileInput = div.querySelector('.cat-file-input');
    const preview = div.querySelector('.cat-preview');
    fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });

    div.querySelector('.btn-reset-single-cat').addEventListener('click', function () {
      const cleanDefault = defaultImg.replace('../../', '');
      div.querySelector('.cat-img-url').value = cleanDefault;
      preview.src = defaultImg;
      fileInput.value = '';
    });

    return div;
  }

  function createInstagramCard(insta) {
    insta = insta || {};
    const imageUrl = insta.imageUrl || '';
    const link = insta.link || '';

    const div = document.createElement('div');
    div.className = 'instagram-card';
    div.innerHTML = `
      <button type="button" class="btn btn-sm btn-outline-danger remove-btn btn-remove-insta"><i class="bi bi-x"></i></button>
      <div class="row g-3">
        <div class="col-md-6">
          <div class="mb-2">
            <label class="form-label" data-i18n="settings.instagram.link">Instagram Post URL</label>
            <input type="url" class="form-control insta-link" value="${link.replace(/"/g, '&quot;')}" required placeholder="https://instagram.com/p/...">
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-2">
            <label class="form-label">Instagram Image</label>
            <input type="file" class="form-control insta-file-input" accept="image/*">
            <input type="hidden" class="insta-img-url" value="${imageUrl}">
            <div class="mt-2 text-center">
              <span class="d-block text-muted small mb-1">Current Active Image</span>
              <img class="preview-img mx-auto insta-preview" src="${imageUrl ? api.resolveUrl(imageUrl) : '../../assets/images/insta-1.jpg'}" alt="Preview">
              <button type="button" class="btn btn-sm btn-outline-warning mt-2 btn-reset-single-insta"><i class="bi bi-arrow-counterclockwise"></i> Reset to Default</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const fileInput = div.querySelector('.insta-file-input');
    const preview = div.querySelector('.insta-preview');
    fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });

    div.querySelector('.btn-remove-insta').addEventListener('click', function () {
      div.remove();
    });

    div.querySelector('.btn-reset-single-insta').addEventListener('click', function () {
      const index = Array.from(instagramContainer.children).indexOf(div);
      const defaultImg = `assets/images/insta-${(index >= 0 ? (index % 5) + 1 : 1)}.jpg`;
      div.querySelector('.insta-img-url').value = defaultImg;
      preview.src = api.resolveUrl(defaultImg);
      fileInput.value = '';
    });

    if (window.I18N) window.I18N.applyI18n(div);
    return div;
  }

  function createServiceCard(service = {}) {
    const div = document.createElement('div');
    div.className = 'banner-slide-card service-card';

    const PRESET_ICONS = [
      // Booking & Hotel
      { value: 'flaticon-reception-bell', label: '🛎️ Reception Bell', tags: 'booking hotel front desk bell service checkin lobby' },
      { value: 'ion-ios-key', label: '🔑 Room Access Key', tags: 'booking hotel key room entry card checkin lock' },
      { value: 'ion-ios-calendar', label: '📅 Easy Booking Calendar', tags: 'booking hotel calendar reservation schedule date time stay' },
      { value: 'ion-ios-home', label: '🏨 Hotel Building', tags: 'booking hotel building house accommodation residence' },
      { value: 'ion-ios-contact', label: '👤 Guest Receptionist', tags: 'booking hotel staff client guest service checkin helper' },
      
      // Rooms & Apartments
      { value: 'ion-ios-bed', label: '🛏️ Bedroom / Bed', tags: 'room apartment bed sleep comfort layout single double' },
      { value: 'ion-ios-snow', label: '❄️ Air Conditioning', tags: 'room apartment ac cooling weather temperature comfort cold' },
      { value: 'ion-ios-tv', label: '📺 Smart TV Entertainment', tags: 'room apartment television screen media movies dynamic' },
      { value: 'ion-ios-wine', label: '🍷 Mini Bar / Wine', tags: 'room apartment drink beverage alcohol bar glass wine' },
      { value: 'ion-ios-wifi', label: '📶 Free High-speed Wifi', tags: 'room apartment wifi internet online network connection speed' },
      { value: 'ion-ios-lock', label: '🔒 Safe Deposit Box', tags: 'room apartment safe security lock deposit protect money box' },
      { value: 'ion-ios-shirt', label: '👕 Laundry & Dry-cleaning', tags: 'room apartment laundry clothes shirt service wash clean iron' },
      
      // Tours & Travel
      { value: 'flaticon-car', label: '🚗 Shuttle Car / Transfer', tags: 'tour travel car transport shuttle pickup transfer taxi driver ride' },
      { value: 'ion-ios-map', label: '🗺️ Local Guide Map', tags: 'tour travel guide map direction navigation location adventure explore' },
      { value: 'ion-ios-compass', label: '🧭 Adventure Compass', tags: 'tour travel compass adventure direction explore way finder' },
      { value: 'ion-ios-sunny', label: '☀️ Beach & Sun Activities', tags: 'tour travel beach sun weather outdoor island summer hot' },
      { value: 'ion-ios-boat', label: '🚢 Cruise / Boat Tour', tags: 'tour travel boat ship sea river cruise water lake sail' },
      { value: 'ion-ios-camera', label: '📷 Sightseeing Camera', tags: 'tour travel photo camera scenery view memory shoot picture' },
      { value: 'ion-ios-airplane', label: '✈️ Airport Flight', tags: 'tour travel flight plane airplane airport tickets sky travel' },
      { value: 'ion-ios-walk', label: '🚶 Trekking / Hiking Tour', tags: 'tour travel walking hiking outdoor sport fitness explorer path' },
      
      // Vouchers & Offers
      { value: 'ion-ios-gift', label: '🎁 Gift Voucher', tags: 'voucher offer gift discount promotion loyalty reward package birthday' },
      { value: 'ion-ios-pricetags', label: '🏷️ Promo Code / Discount Tag', tags: 'voucher offer price discount tag sale deal coupon code value' },
      { value: 'ion-ios-cash', label: '💵 Cashback / Refund', tags: 'voucher offer money cash discount price payment currency' },
      { value: 'ion-ios-ribbon', label: '🎀 Membership Privilege', tags: 'voucher offer badge ribbon reward vip loyalty premium luxury' },
      { value: 'ion-ios-percent', label: '🎟️ Percentage Coupon', tags: 'voucher offer coupon ticket discount percentage rate sale ticket coupon' },
      
      // Food & Recreation
      { value: 'flaticon-spa', label: '🌸 Spa & Relaxation', tags: 'recreation spa wellness massage health flower treatment luxury' },
      { value: 'flaticon-serving-dish', label: '🍽️ Restaurant / Meal', tags: 'food dining meal dish breakfast serving kitchen cook' },
      { value: 'ion-ios-cafe', label: '☕ Coffee Bar', tags: 'food cafe cup coffee morning beverage breakfast tea' },
      { value: 'ion-ios-help-buoy', label: '🏊 Swimming Pool', tags: 'recreation pool swimming sport water activity beach' },
      { value: 'ion-ios-fitness', label: '🏋️ Fitness Gym', tags: 'recreation gym fitness workout body training dumbbells health' }
    ];

    const currentIcon = service.icon || 'flaticon-spa';
    const isImage = currentIcon.indexOf('/') !== -1 || currentIcon.indexOf('.') !== -1;

    div.innerHTML = `
      <button type="button" class="btn btn-sm btn-danger remove-btn btn-remove-svc" style="position:absolute; top:10px; right:10px;"><i class="bi bi-x"></i></button>
      <div class="row g-3">
        <!-- Icon Source Type Selector -->
        <div class="col-md-3">
          <label class="form-label text-muted small">Icon Source</label>
          <select class="form-select svc-type-select">
            <option value="font" ${!isImage ? 'selected' : ''}>🔤 Icon Font (Class)</option>
            <option value="image" ${isImage ? 'selected' : ''}>🖼️ Upload Image</option>
          </select>
        </div>

        <!-- Preview Panel -->
        <div class="col-md-2 text-center">
          <label class="form-label text-muted small">Preview</label>
          <div class="icon-preview-box text-primary fs-3 d-flex align-items-center justify-content-center bg-white border rounded mx-auto" style="width: 45px; height: 45px; min-width: 45px;">
            <i class="svc-icon-preview ${!isImage ? currentIcon : ''}" style="${!isImage ? '' : 'display:none;'}"></i>
            <img class="svc-img-preview" src="${isImage ? api.resolveUrl(currentIcon) : ''}" style="width: 38px; height: 38px; object-fit: contain; ${isImage ? '' : 'display:none;'}" alt="Preview">
          </div>
          <button type="button" class="btn btn-link text-warning p-0 mt-1 btn-reset-single-svc-icon" style="font-size: 11px; text-decoration: none;"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>
        </div>

        <!-- Dynamic Fields wrapper -->
        <div class="col-md-7 svc-font-fields" style="${!isImage ? '' : 'display: none;'}">
          <label class="form-label text-muted small">Select Icon Font (Search by theme)</label>
          <div class="dropdown svc-icon-dropdown-container">
            <button class="btn btn-outline-secondary dropdown-toggle w-100 d-flex align-items-center justify-content-between text-start svc-dropdown-btn" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
              <span class="selected-text">Loading...</span>
            </button>
            <div class="dropdown-menu p-2" style="width: 100%; min-width: 280px; max-height: 350px; overflow-y: auto; z-index: 1050;">
              <input type="text" class="form-control form-control-sm mb-2 svc-search-input" placeholder="Tìm theo chủ đề: room, tour, voucher, wifi...">
              <div class="svc-options-list list-group list-group-flush" style="max-height: 250px; overflow-y: auto;">
                <!-- dynamic options list -->
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-7 svc-image-fields" style="${isImage ? '' : 'display: none;'}">
          <label class="form-label text-muted small">Upload Icon Image</label>
          <input type="file" class="form-control svc-file-input" accept="image/*">
          <input type="hidden" class="svc-img-url" value="${isImage ? currentIcon : ''}">
        </div>

        <!-- Hidden input holding final output value -->
        <input type="hidden" class="svc-icon" value="${currentIcon}">

        <!-- Title & Description -->
        <div class="col-md-12">
          <label class="form-label text-muted small" data-i18n="settings.services.title">Service Title</label>
          <input type="text" class="form-control svc-title" value="${service.title || ''}" placeholder="Enter service title">
        </div>
        <div class="col-md-12">
          <label class="form-label text-muted small" data-i18n="settings.services.desc">Service Description</label>
          <textarea class="form-control svc-desc" rows="2" placeholder="Enter service description">${service.desc || ''}</textarea>
        </div>
        <div class="col-md-12 d-flex justify-content-end align-items-center mt-2">
          <button type="button" class="btn btn-sm btn-outline-warning btn-reset-single-svc-content"><i class="bi bi-arrow-counterclockwise"></i> Reset Title & Desc</button>
        </div>
      </div>
    `;

    const typeSelect = div.querySelector('.svc-type-select');
    const fileInput = div.querySelector('.svc-file-input');
    const hiddenInput = div.querySelector('.svc-icon');
    const previewIcon = div.querySelector('.svc-icon-preview');
    const previewImg = div.querySelector('.svc-img-preview');
    const imgUrlInput = div.querySelector('.svc-img-url');

    const fontFields = div.querySelector('.svc-font-fields');
    const imageFields = div.querySelector('.svc-image-fields');

    // Searchable dropdown components
    const dropdownBtn = div.querySelector('.svc-dropdown-btn');
    const selectedText = div.querySelector('.selected-text');
    const searchInput = div.querySelector('.svc-search-input');
    const optionsList = div.querySelector('.svc-options-list');

    function renderOptions(filterText = '') {
      optionsList.innerHTML = '';
      const query = filterText.toLowerCase().trim();

      const filtered = PRESET_ICONS.filter(item => {
        return item.label.toLowerCase().includes(query) || item.tags.toLowerCase().includes(query);
      });

      if (filtered.length === 0) {
        optionsList.innerHTML = '<div class="text-muted text-center p-2 small">Không tìm thấy icon nào</div>';
        return;
      }

      filtered.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'list-group-item list-group-item-action border-0 d-flex align-items-center gap-2 py-2 px-3';
        btn.style.fontSize = '14px';
        btn.innerHTML = `<i class="${item.value} fs-5 text-primary" style="width: 24px; text-align: center;"></i> <span>${item.label}</span>`;
        
        btn.addEventListener('click', function () {
          hiddenInput.value = item.value;
          previewIcon.className = `svc-icon-preview ${item.value}`;
          selectedText.innerHTML = btn.innerHTML;
          
          // Close dropdown using bootstrap's Dropdown API
          const dropdownInstance = bootstrap.Dropdown.getOrCreateInstance(dropdownBtn);
          dropdownInstance.hide();
        });
        
        optionsList.appendChild(btn);
      });
    }

    searchInput.addEventListener('input', function () {
      renderOptions(this.value);
    });

    function updateIconState() {
      const mode = typeSelect.value;
      if (mode === 'font') {
        fontFields.style.display = 'block';
        imageFields.style.display = 'none';
        previewIcon.style.display = 'inline-block';
        previewImg.style.display = 'none';

        hiddenInput.value = hiddenInput.value || 'flaticon-spa';
        previewIcon.className = `svc-icon-preview ${hiddenInput.value}`;
        
        const matched = PRESET_ICONS.find(item => item.value === hiddenInput.value) || PRESET_ICONS[0];
        selectedText.innerHTML = `<i class="${matched.value} fs-5 text-primary" style="width: 24px; text-align: center;"></i> <span>${matched.label}</span>`;
      } else {
        fontFields.style.display = 'none';
        imageFields.style.display = 'block';
        previewIcon.style.display = 'none';
        previewImg.style.display = 'inline-block';

        hiddenInput.value = imgUrlInput.value;
        previewImg.src = imgUrlInput.value ? api.resolveUrl(imgUrlInput.value) : '';
      }
    }

    typeSelect.addEventListener('change', updateIconState);

    fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          previewImg.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });

    const defaultIcons = [
      'flaticon-reception-bell',
      'flaticon-serving-dish',
      'flaticon-car',
      'flaticon-spa'
    ];

    div.querySelector('.btn-reset-single-svc-icon').addEventListener('click', function () {
      const index = Array.from(servicesContainer.children).indexOf(div);
      const defaultIcon = defaultIcons[index >= 0 && index < 4 ? index : 3];
      typeSelect.value = 'font';
      hiddenInput.value = defaultIcon;
      fileInput.value = '';
      updateIconState();
    });

    const defaultTitles = [
      '24/7 Front Desk',
      'Restaurant Bar',
      'Transfer Services',
      'Spa Suites'
    ];
    const defaultDesc = 'Thoughtful amenities and attentive service for a truly relaxing getaway.';

    div.querySelector('.btn-reset-single-svc-content').addEventListener('click', function () {
      const index = Array.from(servicesContainer.children).indexOf(div);
      const titleInput = div.querySelector('.svc-title');
      const descInput = div.querySelector('.svc-desc');
      
      titleInput.value = defaultTitles[index >= 0 && index < 4 ? index : 3];
      descInput.value = defaultDesc;
    });

    div.querySelector('.btn-remove-svc').addEventListener('click', function () {
      div.remove();
      updateAddServiceBtn();
    });

    // Initialize custom dropdown
    const matched = PRESET_ICONS.find(item => item.value === currentIcon) || PRESET_ICONS[0];
    selectedText.innerHTML = `<i class="${matched.value} fs-5 text-primary" style="width: 24px; text-align: center;"></i> <span>${matched.label}</span>`;
    renderOptions();
    updateIconState();

    if (window.I18N) window.I18N.applyI18n(div);
    return div;
  }

  function updateAddServiceBtn() {
    const addBtn = document.getElementById('add-service-btn');
    if (addBtn) {
      if (servicesContainer.children.length >= 4) {
        addBtn.style.display = 'none';
      } else {
        addBtn.style.display = 'inline-block';
      }
    }
  }

  // Load existing settings
  api.get('/settings')
    .then(function (res) {
      if (!res.success || !res.data) return;
      const settings = res.data;

      // Footer
      if (settings.footer) {
        document.getElementById('footer-desc').value = settings.footer.desc || '';
        document.getElementById('footer-address').value = settings.footer.address || '';
        document.getElementById('footer-phone').value = settings.footer.phone || '';
        document.getElementById('footer-email').value = settings.footer.email || '';
      }

      // Contact Page
      if (settings.contact_info) {
        document.getElementById('contact-address').value = settings.contact_info.address || '';
        document.getElementById('contact-phone').value = settings.contact_info.phone || '';
        document.getElementById('contact-email').value = settings.contact_info.email || '';
        const websiteInput = document.getElementById('contact-website');
        if (websiteInput) websiteInput.value = settings.contact_info.website || '';
        
        if (settings.contact_info.mapLat && settings.contact_info.mapLng) {
          document.getElementById('contact-lat').value = settings.contact_info.mapLat;
          document.getElementById('contact-lng').value = settings.contact_info.mapLng;
        }
      }

      // Banners
      if (settings.banners && settings.banners.length) {
        settings.banners.forEach(function (banner) {
          bannersContainer.appendChild(createBannerCard(banner));
        });
      }

      // Category Banners
      const catBanners = settings.categoryBanners || {};
      CATEGORIES.forEach(function (cat) {
        const currentUrl = catBanners[cat.key] || '';
        catBannersContainer.appendChild(createCategoryCard(cat.key, cat.name, currentUrl, cat.defaultImg));
      });

      // Instagram
      if (settings.instagrams && settings.instagrams.length) {
        settings.instagrams.forEach(function (insta) {
          instagramContainer.appendChild(createInstagramCard(insta));
        });
      }

      // About Image
      if (settings.aboutImage) {
        const url = typeof settings.aboutImage === 'string' ? settings.aboutImage : settings.aboutImage.value || settings.aboutImage.imageUrl;
        if (url) {
          aboutImgUrl.value = url;
          aboutImagePreview.src = api.resolveUrl(url);
        }
      }

      // Services
      if (settings.services && settings.services.length > 0) {
        settings.services.forEach(function (svc) {
          servicesContainer.appendChild(createServiceCard(svc));
        });
      } else {
        // If no services in DB, render the 4 default ones so the user can edit and save them
        const defaultServices = [
          { icon: 'flaticon-reception-bell', title: '24/7 Front Desk', desc: 'A small river named Duden flows by their place and supplies.' },
          { icon: 'flaticon-serving-dish', title: 'Restaurant Bar', desc: 'A small river named Duden flows by their place and supplies.' },
          { icon: 'flaticon-car', title: 'Transfer Services', desc: 'A small river named Duden flows by their place and supplies.' },
          { icon: 'flaticon-spa', title: 'Spa Suites', desc: 'A small river named Duden flows by their place and supplies.' }
        ];
        defaultServices.forEach(function (svc) {
          servicesContainer.appendChild(createServiceCard(svc));
        });
      }
      updateAddServiceBtn();
    })
    .catch(function (err) {
      showAlert(err.message || 'Error loading configurations.', false);
    });

  // Event listeners for About Image
  if (aboutFileInput) {
    aboutFileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          aboutImagePreview.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  if (btnResetAboutImage) {
    btnResetAboutImage.addEventListener('click', function () {
      aboutImgUrl.value = 'assets/images/about_placeholder.png';
      aboutImagePreview.src = '../../assets/images/about_placeholder.png';
      aboutFileInput.value = '';
    });
  }

  // Add event listeners
  document.getElementById('add-banner-btn').addEventListener('click', function () {
    bannersContainer.appendChild(createBannerCard());
  });

  document.getElementById('add-instagram-btn').addEventListener('click', function () {
    instagramContainer.appendChild(createInstagramCard());
  });

  document.getElementById('add-service-btn').addEventListener('click', function () {
    if (servicesContainer.children.length < 4) {
      servicesContainer.appendChild(createServiceCard());
      updateAddServiceBtn();
    } else {
      window.CustomAlert.alert(window.t ? t('settings.services.max') : 'You can only add a maximum of 4 services.');
    }
  });

  document.getElementById('settings-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlert();
    if (spinner) spinner.classList.remove('d-none');

    try {
      // 1. Process Banners uploads & compilation
      const bannerCards = bannersContainer.querySelectorAll('.banner-slide-card');
      const bannersData = [];
      for (let i = 0; i < bannerCards.length; i++) {
        const card = bannerCards[i];
        const fileInput = card.querySelector('.banner-file-input');
        let imageUrl = card.querySelector('.banner-img-url').value;

        if (fileInput.files && fileInput.files[0]) {
          imageUrl = await uploadImageFile(fileInput.files[0]);
        }

        bannersData.push({
          imageUrl: imageUrl,
          title: card.querySelector('.banner-title').value,
          sub: card.querySelector('.banner-sub').value,
          link: card.querySelector('.banner-link').value
        });
      }

      // 2. Process Category Banners
      const catCards = catBannersContainer.querySelectorAll('.banner-slide-card');
      const catData = {};
      for (let i = 0; i < catCards.length; i++) {
        const card = catCards[i];
        const catKey = card.getAttribute('data-category');
        const fileInput = card.querySelector('.cat-file-input');
        let imageUrl = card.querySelector('.cat-img-url').value;

        if (fileInput.files && fileInput.files[0]) {
          imageUrl = await uploadImageFile(fileInput.files[0]);
        }

        // If it was absolute backend path, keep it relative
        if (imageUrl.startsWith('http://localhost:3000')) {
          imageUrl = imageUrl.replace('http://localhost:3000', '');
        }

        catData[catKey] = imageUrl || CATEGORIES.find(c => c.key === catKey).defaultImg.replace('../../', '');
      }

      // 3. Process Instagram uploads & compilation
      const instaCards = instagramContainer.querySelectorAll('.instagram-card');
      const instaData = [];
      for (let i = 0; i < instaCards.length; i++) {
        const card = instaCards[i];
        const fileInput = card.querySelector('.insta-file-input');
        let imageUrl = card.querySelector('.insta-img-url').value;

        if (fileInput.files && fileInput.files[0]) {
          imageUrl = await uploadImageFile(fileInput.files[0]);
        }

        instaData.push({
          imageUrl: imageUrl,
          link: card.querySelector('.insta-link').value
        });
      }

      // 4. Process Footer
      const footerData = {
        desc: document.getElementById('footer-desc').value,
        address: document.getElementById('footer-address').value,
        phone: document.getElementById('footer-phone').value,
        email: document.getElementById('footer-email').value
      };

      // 5. Process About Image
      let aboutImageValue = aboutImgUrl.value || 'assets/images/about_placeholder.png';
      if (aboutFileInput && aboutFileInput.files && aboutFileInput.files[0]) {
        aboutImageValue = await uploadImageFile(aboutFileInput.files[0]);
        if (aboutImageValue.startsWith('http://localhost:3000')) {
          aboutImageValue = aboutImageValue.replace('http://localhost:3000', '');
        }
      }

      // 6. Process Services
      const servicesData = [];
      const serviceCards = document.querySelectorAll('.service-card');
      for (let i = 0; i < serviceCards.length; i++) {
        const card = serviceCards[i];
        const typeSelect = card.querySelector('.svc-type-select');
        let iconValue = '';

        if (typeSelect && typeSelect.value === 'image') {
          const fileInput = card.querySelector('.svc-file-input');
          iconValue = card.querySelector('.svc-img-url').value;
          if (fileInput.files && fileInput.files[0]) {
            iconValue = await uploadImageFile(fileInput.files[0]);
            if (iconValue.startsWith('http://localhost:3000')) {
              iconValue = iconValue.replace('http://localhost:3000', '');
            }
          }
        } else {
          iconValue = card.querySelector('.svc-icon').value;
        }

        servicesData.push({
          icon: iconValue || 'flaticon-spa',
          title: card.querySelector('.svc-title').value,
          desc: card.querySelector('.svc-desc').value
        });
      }

      // 6.5 Process Contact Page
      const websiteInput = document.getElementById('contact-website');
      const contactInfoData = {
        address: document.getElementById('contact-address').value,
        phone: document.getElementById('contact-phone').value,
        email: document.getElementById('contact-email').value,
        website: websiteInput ? websiteInput.value : '',
        mapLat: document.getElementById('contact-lat').value,
        mapLng: document.getElementById('contact-lng').value
      };

      // 7. Save to Database
      await api.put('/settings', { key: 'footer', value: footerData });
      await api.put('/settings', { key: 'banners', value: bannersData });
      await api.put('/settings', { key: 'categoryBanners', value: catData });
      await api.put('/settings', { key: 'instagrams', value: instaData });
      await api.put('/settings', { key: 'aboutImage', value: aboutImageValue });
      await api.put('/settings', { key: 'services', value: servicesData });
      await api.put('/settings', { key: 'contact_info', value: contactInfoData });

      showAlert(window.t ? t('settings.saveSuccess') : 'Settings updated successfully!', true);

      // Reset file inputs since files are already uploaded
      form.querySelectorAll('input[type="file"]').forEach(function (input) {
        input.value = '';
      });

      // Update hidden img-url inputs to the newly uploaded ones
      bannerCards.forEach(function (card, index) {
        card.querySelector('.banner-img-url').value = bannersData[index].imageUrl;
      });
      catCards.forEach(function (card) {
        const catKey = card.getAttribute('data-category');
        card.querySelector('.cat-img-url').value = catData[catKey];
      });
      instaCards.forEach(function (card, index) {
        card.querySelector('.insta-img-url').value = instaData[index].imageUrl;
      });
      const svcCardsNew = servicesContainer.querySelectorAll('.service-card');
      svcCardsNew.forEach(function (card, index) {
        const typeSelect = card.querySelector('.svc-type-select');
        if (typeSelect && typeSelect.value === 'image') {
          card.querySelector('.svc-img-url').value = servicesData[index].icon;
        }
      });

    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Failed to save settings.', false);
    } finally {
      if (spinner) spinner.classList.add('d-none');
    }
  });

  // Reset button logic
  document.getElementById('reset-settings-btn').addEventListener('click', async function () {
    const confirmed = await window.CustomAlert.confirm('Are you sure you want to reset all configurations to default values? This will save defaults immediately.');
    if (!confirmed) {
      return;
    }

    const defaultFooter = {
      desc: "Discover a sanctuary of comfort and elegance. At LumiForest, every stay is crafted to make you feel at home while enjoying world-class hospitality, serene surroundings, and unforgettable experiences.",
      address: "123 Forest Hill, Da Lat, Vietnam",
      phone: "+84 263 3123 456",
      email: "contact@lumiforest.com"
    };

    const defaultBanners = [
      {
        imageUrl: "assets/images/bg_1.jpg",
        title: "Welcome To LumiForest",
        sub: "Retreat & Booking",
        link: ""
      },
      {
        imageUrl: "assets/images/bg_2.jpg",
        title: "Enjoy A Luxury Experience",
        sub: "Join With Us",
        link: ""
      }
    ];

    const defaultInstagrams = [
      { imageUrl: "assets/images/insta-1.jpg", link: "https://instagram.com" },
      { imageUrl: "assets/images/insta-2.jpg", link: "https://instagram.com" },
      { imageUrl: "assets/images/insta-3.jpg", link: "https://instagram.com" },
      { imageUrl: "assets/images/insta-4.jpg", link: "https://instagram.com" },
      { imageUrl: "assets/images/insta-5.jpg", link: "https://instagram.com" }
    ];

    const defaultCategoryBanners = {
      hotels: "assets/images/bg_1.jpg",
      apartments: "assets/images/bg_2.jpg",
      tours: "assets/images/bg_1.jpg",
      vouchers: "assets/images/bg_1.jpg",
      blog: "assets/images/bg_1.jpg",
      about: "assets/images/bg_1.jpg",
      contact: "assets/images/bg_1.jpg"
    };

    const defaultServices = [
      { icon: 'flaticon-reception-bell', title: '24/7 Front Desk', desc: 'A small river named Duden flows by their place and supplies.' },
      { icon: 'flaticon-serving-dish', title: 'Restaurant Bar', desc: 'A small river named Duden flows by their place and supplies.' },
      { icon: 'flaticon-car', title: 'Transfer Services', desc: 'A small river named Duden flows by their place and supplies.' },
      { icon: 'flaticon-spa', title: 'Spa Suites', desc: 'A small river named Duden flows by their place and supplies.' }
    ];

    try {
      spinner.classList.remove('d-none');
      await api.put('/settings', { key: 'footer', value: defaultFooter });
      await api.put('/settings', { key: 'banners', value: defaultBanners });
      await api.put('/settings', { key: 'instagrams', value: defaultInstagrams });
      await api.put('/settings', { key: 'categoryBanners', value: defaultCategoryBanners });
      await api.put('/settings', { key: 'aboutImage', value: 'assets/images/about_placeholder.png' });
      await api.put('/settings', { key: 'services', value: defaultServices });

      window.CustomAlert.alert('All settings successfully reset to defaults!');
      window.location.reload();
    } catch (e) {
      console.error(e);
      window.CustomAlert.alert('Failed to reset settings: ' + e.message);
    } finally {
      if (spinner) spinner.classList.add('d-none');
    }
  });
});
