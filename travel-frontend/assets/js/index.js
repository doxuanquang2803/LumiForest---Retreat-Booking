document.addEventListener('DOMContentLoaded', function () {
  var roomsContainer = document.getElementById('index-rooms-list');
  var blogContainer = document.getElementById('index-blog-list');

  function formatPrice(price) {
    return Number(price).toLocaleString('vi-VN') + ' ₫';
  }

  function getPostImage(post) {
    if (post.image) return api.resolveUrl(post.image);
    if (post.content) {
      var m = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m && m[1] && !m[1].startsWith('data:')) return m[1];
    }
    return 'assets/images/image_1.jpg';
  }

  function loadRooms() {
    if (!roomsContainer) return;
    roomsContainer.innerHTML = '<div class="col-12 text-center py-5"><p>' + (window.t ? t('common.loading') : 'Loading...') + '</p></div>';

    api.get('/rooms?limit=6')
      .then(function (res) {
        if (!res.success || !res.data || !res.data.length) {
          roomsContainer.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No rooms available.</p></div>';
          return;
        }

        roomsContainer.innerHTML = res.data.map(function (room) {
          var imgUrl = room.thumbnail ? api.resolveUrl(room.thumbnail) : 'assets/images/room-1.jpg';
          var badge = room.status === 'available'
            ? ''
            : '<span class="badge badge-danger" style="position:absolute;top:10px;right:10px">' + room.status + '</span>';
          
          var priceFormatted = formatPrice(room.price);
          var viewDetailsText = window.t ? t('rooms.viewDetails') : 'View Room Details';
          var perNightText = window.t ? t('rooms.perNight') : 'per night';

          return (
            '<div class="col-sm col-md-6 col-lg-4 ftco-animate">' +
              '<div class="room" style="position:relative">' +
                badge +
                '<a href="rooms-single.html?id=' + room.id + '" class="img d-flex justify-content-center align-items-center" style="background-image: url(' + imgUrl + ');">' +
                  '<div class="icon d-flex justify-content-center align-items-center">' +
                    '<span class="icon-search2"></span>' +
                  '</div>' +
                '</a>' +
                '<div class="text p-3 text-center">' +
                  '<h3 class="mb-3"><a href="rooms-single.html?id=' + room.id + '">' + room.name + '</a></h3>' +
                  '<p class="d-none"><span class="price mr-2">' + priceFormatted + '</span> <span class="per" data-i18n="rooms.perNight">' + perNightText + '</span></p>' +
                  '<hr>' +
                  '<p class="pt-1"><a href="rooms-single.html?id=' + room.id + '" class="btn-custom"><span data-i18n="rooms.viewDetails">' + viewDetailsText + '</span> <span class="icon-long-arrow-right"></span></a></p>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('');

        // Apply translations to dynamic tags
        if (window.I18N) window.I18N.applyI18n(roomsContainer);

        // Trigger animations
        roomsContainer.querySelectorAll('.ftco-animate').forEach(function (el) {
          el.classList.add('ftco-animated', 'fadeInUp');
        });
      })
      .catch(function (err) {
        console.error('Error loading rooms:', err);
        roomsContainer.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">Unable to load rooms.</p></div>';
      });
  }

  function loadBlogs() {
    if (!blogContainer) return;
    blogContainer.innerHTML = '<div class="col-12 text-center py-5"><p>' + (window.t ? t('common.loading') : 'Loading...') + '</p></div>';

    api.get('/blog?limit=4')
      .then(function (res) {
        if (!res.success || !res.data || !res.data.length) {
          blogContainer.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No blog posts available.</p></div>';
          return;
        }

        var locale = (window.I18N && I18N.getLang() === 'vi') ? 'vi-VN' : 'en-US';

        blogContainer.innerHTML = res.data.map(function (post) {
          var date = post.published_at
            ? new Date(post.published_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
            : '';

          var imgUrl = getPostImage(post);

          return (
            '<div class="col-md-3 d-flex ftco-animate">' +
              '<div class="blog-entry align-self-stretch" style="width: 100%">' +
                '<a href="blog-single.html?id=' + post.id + '" class="block-20"' +
                  ' style="background-image: url(\'' + imgUrl + '\');"></a>' +
                '<div class="text mt-3 d-block">' +
                  '<h3 class="heading mt-3"><a href="blog-single.html?id=' + post.id + '">' + post.title + '</a></h3>' +
                  '<div class="meta mb-3">' +
                    '<div><a href="blog-single.html?id=' + post.id + '">' + date + '</a></div>' +
                    '<div><a href="blog-single.html?id=' + post.id + '">' + (post.author || 'Admin') + '</a></div>' +
                    '<div><a href="blog-single.html?id=' + post.id + '" class="meta-chat"><span class="icon-chat"></span> ' + (post.views || 0) + '</a></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('');

        // Trigger animations
        blogContainer.querySelectorAll('.ftco-animate').forEach(function (el) {
          el.classList.add('ftco-animated', 'fadeInUp');
        });
      })
      .catch(function (err) {
        console.error('Error loading blog posts:', err);
        blogContainer.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">Unable to load blog posts.</p></div>';
      });
  }

  // Handle booking form submission
  var bookingForm = document.getElementById('index-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var checkIn = document.getElementById('booking-checkin').value;
      var checkOut = document.getElementById('booking-checkout').value;
      var type = document.getElementById('booking-room-type').value;
      var maxGuests = document.getElementById('booking-guests').value;

      var params = new URLSearchParams();
      if (checkIn) params.append('checkIn', checkIn);
      if (checkOut) params.append('checkOut', checkOut);
      if (type) params.append('type', type);
      if (maxGuests) params.append('maxGuests', maxGuests);

      window.location.href = 'rooms.html?' + params.toString();
    });
  }

  function initBannersCarousel() {
    if (typeof $ !== 'undefined' && $.fn.owlCarousel) {
      var $slider = $('#index-banners-slider');

      // Destroy any existing carousel instance first
      if ($slider.hasClass('owl-loaded')) {
        $slider.trigger('destroy.owl.carousel');
        $slider.removeClass('owl-loaded owl-hidden');
      }

      // Ensure the carousel class and visibility
      $slider.addClass('owl-carousel').show();

      $slider.owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplaySpeed: 800,
        margin: 0,
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        nav: false,
        dots: false,
        autoplayHoverPause: false,
        items: 1,
        responsive: {
          0: { items: 1 },
          600: { items: 1 },
          1000: { items: 1 }
        }
      });
    }
  }

  function loadBanners() {
    var slider = document.getElementById('index-banners-slider');
    if (!slider) return;

    // Destroy any carousel that main.js may have started (belt & suspenders)
    if (typeof $ !== 'undefined' && $.fn.owlCarousel) {
      var $s = $(slider);
      if ($s.hasClass('owl-loaded')) {
        $s.trigger('destroy.owl.carousel');
        $s.removeClass('owl-loaded owl-carousel owl-hidden');
      }
    }

    api.get('/settings/banners')
      .then(function (res) {
        if (res.success && res.data && res.data.length) {
          slider.innerHTML = res.data.map(function (banner) {
            var imgUrl = api.resolveUrl(banner.imageUrl);
            var title = banner.title || '';
            var sub = banner.sub || '';

            return (
              '<div class="slider-item" style="background-image:url(' + imgUrl + ');">' +
                '<div class="overlay"></div>' +
                '<div class="container">' +
                  '<div class="row no-gutters slider-text align-items-center justify-content-center">' +
                    '<div class="col-md-12 ftco-animate text-center">' +
                      '<div class="text mb-5 pb-3">' +
                        '<h1 class="mb-3">' + title + '</h1>' +
                        '<h2>' + sub + '</h2>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>'
            );
          }).join('');
        }
        // If API fails or returns empty, keep the static HTML slides from index.html

        if (window.I18N) window.I18N.applyI18n(slider);
        initBannersCarousel();

        slider.querySelectorAll('.ftco-animate').forEach(function (el) {
          el.classList.add('ftco-animated', 'fadeInUp');
        });
      })
      .catch(function (err) {
        console.error('Error loading banners:', err);
        // Still init carousel with the static fallback slides
        initBannersCarousel();
      });
  }

  function loadInstagram() {
    var container = document.getElementById('index-instagram-list');
    if (!container) return;

    api.get('/settings/instagrams')
      .then(function (res) {
        if (res.success && res.data && res.data.length) {
          container.innerHTML = res.data.map(function (insta) {
            var imgUrl = api.resolveUrl(insta.imageUrl);
            var link = insta.link || '#';

            return (
              '<div class="col-sm-12 col-md ftco-animate">' +
                '<a href="' + link + '" class="insta-img image-popup" style="background-image: url(' + imgUrl + ');" target="_blank">' +
                  '<div class="icon d-flex justify-content-center">' +
                    '<span class="icon-instagram align-self-center"></span>' +
                  '</div>' +
                '</a>' +
              '</div>'
            );
          }).join('');

          if (typeof $ !== 'undefined' && $.fn.magnificPopup) {
            $(container).find('.image-popup').magnificPopup({
              type: 'image',
              closeOnContentClick: true,
              closeBtnInside: false,
              fixedContentPos: true,
              mainClass: 'mfp-no-margins mfp-with-zoom',
              gallery: {
                enabled: true,
                navigateByImgClick: true,
                preload: [0, 1]
              },
              image: {
                verticalFit: true
              },
              zoom: {
                enabled: true,
                duration: 300
              }
            });
          }
        }

        container.querySelectorAll('.ftco-animate').forEach(function (el) {
          el.classList.add('ftco-animated', 'fadeInUp');
        });
      })
      .catch(function (err) {
        console.error('Error loading Instagram grid:', err);
      });
  }

  function loadAboutImage() {
    var container = document.getElementById('index-about-image');
    if (!container) return;

    api.get('/settings/aboutImage')
      .then(function (res) {
        if (res.success && res.data) {
          var imgUrl = typeof res.data === 'string' ? res.data : (res.data.value || res.data.imageUrl);
          if (imgUrl) {
            container.style.backgroundImage = 'url(' + api.resolveUrl(imgUrl) + ')';
          }
        }
      })
      .catch(function (err) {
        console.error('Error loading about image:', err);
      });
  }

  // Initial load
  loadRooms();
  loadBlogs();
  loadBanners();
  loadInstagram();
  loadAboutImage();

  // Reload dynamically when language changes
  document.addEventListener('i18n:changed', function () {
    loadRooms();
    loadBlogs();
    loadBanners();
    loadInstagram();
    loadAboutImage();
  });
});
