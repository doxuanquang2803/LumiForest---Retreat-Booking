# Task Checklist: RBAC Implementation

- [x] **Phase 1: Database & Seed Updates**
  - [x] Create `scripts/migrateRoles.js` to map existing user roles ('admin' -> 'ADMIN', 'user' -> 'CUSTOMER')
  - [x] Run role migration script (`node scripts/migrateRoles.js`)
  - [x] Modify `prisma/schema.prisma` to declare the `Role` enum and update `users` model (`role Role`, add `@@index([role])`)
  - [x] Create and run Prisma migration (`npx prisma migrate dev --name add-rbac-roles`)
  - [x] Update `scripts/createMockUsers.js` to use uppercase enum roles ('CUSTOMER', 'ADMIN')

- [x] **Phase 2: Constants, Utilities & Standard Handlers**
  - [x] Create `src/constants/roles.js` defining role constants
  - [x] Create `src/utils/asyncHandler.js` wrapper
  - [x] Create `src/utils/response.js` with `successResponse` and `errorResponse` helpers
  - [x] Create `src/utils/auditLogger.js` to log administrative modifications
  - [x] Create `src/utils/sanitizeHtml.js` utility for XSS prevention

- [x] **Phase 3: Security & Authorization Middlewares**
  - [x] Implement `src/middleware/authorizeRoles.js` (including helpers `isAdmin`, `isStaffOrAdmin`)
  - [x] Implement `src/middleware/createOwnershipMiddleware.js` (ownership factory with soft delete and 404 response checks)
  - [x] Implement concrete middlewares in `src/middleware/checkOwnership.js`
  - [x] Implement standard JWT expiration catch logic in `src/middleware/auth.js`
  - [x] Implement `src/middleware/rateLimiter.js` for brute-force prevention

- [x] **Phase 4: Authentication Controller Refactoring**
  - [x] Update JWT token generation in `src/controllers/authController.js` to standardize JWT payload and convert BigInt ID to string
  - [x] Protect auth routes with `rateLimiter`

- [x] **Phase 5: Controller & Route Protection (Rooms, Apartments, Hotels, Tours, Vouchers)**
  - [x] Protect and update routes in `src/routes/rooms.js` and `src/routes/roomImages.js`
  - [x] Protect and update routes in `src/routes/hotels.js` and `src/routes/hotelImages.js`
  - [x] Protect and update routes in `src/routes/apartments.js` and `src/routes/apartmentImages.js`
  - [x] Protect and update routes in `src/routes/tours.js` and `src/routes/tourImages.js`
  - [x] Protect and update routes in `src/routes/vouchers.js`

- [x] **Phase 6: Bookings & Payments Refactoring with Ownership Verification**
  - [x] Protect `src/routes/bookings.js` and update `src/controllers/hotelBookingController.js` (utilizing `req.booking`)
  - [x] Protect `src/routes/tourBookings.js` and update `src/controllers/tourBookingController.js` (utilizing `req.tourBooking`)
  - [x] Protect `src/routes/payments.js` and update `src/controllers/paymentController.js`
    - [x] Implement payment callback signature verification in `paymentController.js` (HMAC-SHA256)
  - [x] Protect `src/routes/voucherOrders.js` and update `src/controllers/voucherOrderController.js` (utilizing `req.voucherOrder`)

- [x] **Phase 7: Extension Modules & Mock Auth Removal**
  - [x] Clean up and protect `src/modules/wishlist/wishlistRoutes.js` (remove mock auth, use real JWT + `checkWishlistOwnership`)
  - [x] Clean up and protect `src/modules/notifications/notificationRoutes.js` (remove mock auth, use real JWT + `checkNotificationOwnership`)
  - [x] Clean up and protect `src/modules/reviews/reviewRoutes.js` (remove mock auth, use real JWT + `checkReviewOwnership`, STAFF/ADMIN delete permission)
  - [x] Update `src/modules/reviews/reviewService.js` and controller to handle staff/admin deletes and sanitize review comments

- [x] **Phase 8: Contact, Blog & Admin Modules**
  - [x] Implement database persistence and pagination/search in `src/controllers/contactController.js` and protect routes in `src/routes/contact.js`
  - [x] Update `src/controllers/blogController.js` to query DB `blog_posts`, sanitize content inputs on write, and protect routes in `src/routes/blog.js`
  - [x] Protect admin panel in `src/modules/admin/adminRoutes.js` and update controller to normalize role input and enforce self-lockout checks
  - [x] Protect `/api/users` routes and update `src/controllers/userController.js` to enforce lockout protections

- [x] **Phase 9: Cleanup & Final Validation**
  - [x] Delete `src/middleware/mockUser.js` completely
  - [x] Standardize all pagination formats across list controllers
  - [x] Run server and verify JWT roles, authorization restrictions, and resource ownership validations

- [x] **Phase 10: Security Hardening & RBAC Refinement**
  - [x] Modify Prisma Schema (add `AuditLog`, `deletedAt` for soft delete)
  - [x] Update `createOwnershipMiddleware.js` and `checkOwnership.js` (Wishlist bypass limits)
  - [x] Harden Routes: Convert `DELETE` routes for critical resources to ADMIN-only
  - [x] Harden Payments: Refine `payments.js` to prevent STAFF from force-updating status
  - [x] Implement Soft Delete in Controllers (Hotels, Tours, Blogs, Bookings, Vouchers, etc.)

- [x] Implement Audit Logging: Update `auditLogger.js` to use DB and add `GET /api/admin/audit-logs`

## Features & Role Mapping

Below is the list of currently implemented features and their corresponding roles and permissions:

### 1. Authentication & Security
- **Public**:
  - Register, Login, Request password reset
  - Rate limiting enforced on authentication endpoints to prevent brute-force attacks
- **CUSTOMER**:
  - View & Update personal profile
  - Secure API authentication via standardized JWT payload
- **STAFF**:
  - Perform operational duties under restricted scopes
- **ADMIN**:
  - Full access to all administrative capabilities

### 2. Hotel, Room & Apartment Management
- **Public / CUSTOMER**:
  - Browse hotels, view available rooms, apartments, and images
- **STAFF**:
  - Create and Update hotels, rooms, apartments, and associated images
  - *Restricted*: CANNOT delete these resources
- **ADMIN**:
  - Create, Update hotels, rooms, apartments, and images
  - Exclusive permission to Delete (Soft Delete) hotels, rooms, apartments, and images

### 3. Tour Management
- **Public / CUSTOMER**:
  - Browse tours and tour images
- **STAFF**:
  - Create and Update tours and tour images
  - *Restricted*: CANNOT delete tours
- **ADMIN**:
  - Create, Update tours
  - Exclusive permission to Delete (Soft Delete) tours

### 4. Wishlist & Notifications
- **CUSTOMER**:
  - View, add, and remove items from personal Wishlist (with ownership verification)
  - View, mark as read, and delete personal Notifications (with ownership verification)
- **STAFF & ADMIN**:
  - Support bypass: Can view and manage wishlists/notifications for support workflows

### 5. Review & Rating System
- **Public / CUSTOMER**:
  - View reviews for hotels, rooms, apartments, and tours
- **CUSTOMER**:
  - Submit, edit, and delete own reviews (comments are automatically XSS-sanitized)
- **STAFF & ADMIN**:
  - Delete any review for moderation purposes

### 6. Voucher System
- **Public / CUSTOMER**:
  - Browse available active vouchers
- **CUSTOMER**:
  - Claim, purchase (Voucher Orders), and apply vouchers to bookings
- **STAFF**:
  - Create and Update vouchers
  - *Restricted*: CANNOT delete vouchers
- **ADMIN**:
  - Create, Update vouchers
  - Exclusive permission to Delete (Soft Delete) vouchers

### 7. Booking Management
- **CUSTOMER**:
  - Book hotels, rooms, apartments, and tours
  - View personal booking history and status (with ownership verification)
- **STAFF & ADMIN**:
  - View and manage all bookings system-wide

### 8. Payments & Transactions
- **CUSTOMER**:
  - Initiate booking payments and checkout workflows (secured via HMAC-SHA256 signature verification)
  - View personal payment transactions and statuses
- **STAFF**:
  - View payment transactions and statuses to assist with customer support
  - *Restricted*: CANNOT perform refunds or force-update payment statuses
- **ADMIN**:
  - View payments and statuses
  - Exclusive permission to perform Refunds and manually Force-Update payment statuses

### 9. Blog Module
- **Public / CUSTOMER**:
  - Read published blog articles
- **STAFF**:
  - Create and Update blog posts (content is automatically XSS-sanitized)
  - *Restricted*: CANNOT delete blog posts
- **ADMIN**:
  - Create, Update blog posts
  - Exclusive permission to Delete (Soft Delete) blog posts

### 10. Contact Inquiries
- **Public / CUSTOMER**:
  - Submit contact/support inquiries
- **STAFF & ADMIN**:
  - View, search, and paginate contact submissions

### 11. System Administration & Auditing
- **STAFF**:
  - Restricted from administrative dashboards
- **ADMIN**:
  - View financial revenue dashboard
  - Manage user accounts (lock/unlock, ban/unban users)
  - Update user roles (with safe lockout prevention checking to prevent self-demotion/de-admining)
  - Inspect system Audit Logs (automatically logged to DB for every critical administrative action)


## API Endpoints Reference

Below is a complete index of all active API endpoints grouped by module, showing their HTTP methods, exact URL paths, and access control scopes.

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Public | Register a new user |
| `POST` | `/api/auth/login` | No | Public (Rate-limited) | Login to retrieve JWT access & refresh tokens |
| `POST` | `/api/auth/logout` | Yes | CUSTOMER, STAFF, ADMIN | Invalidate session & logout |
| `POST` | `/api/auth/refresh-token` | No | Public | Refresh expired access token |
| `GET` | `/api/auth/profile` | Yes | CUSTOMER, STAFF, ADMIN | Get active user profile |
| `PUT` | `/api/auth/change-password` | Yes | CUSTOMER, STAFF, ADMIN | Change user password |

### 2. User Profiles & Administration (`/api/users`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Yes | CUSTOMER, STAFF, ADMIN | Retrieve own user profile |
| `PUT` | `/api/users/profile` | Yes | CUSTOMER, STAFF, ADMIN | Update own profile info |
| `GET` | `/api/users` | Yes | ADMIN | Retrieve all user accounts (Admin view) |
| `GET` | `/api/users/:id` | Yes | ADMIN | Retrieve user details by ID |
| `PUT` | `/api/users/:id/status` | Yes | ADMIN | Toggle user account status (lock/unlock) |
| `DELETE` | `/api/users/:id` | Yes | ADMIN | Remove user account (Admin only) |

### 3. Hotels & Room Management
#### Hotels (`/api/hotels`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/hotels` | No | Public | Get all hotels with pagination/filters |
| `GET` | `/api/hotels/search` | No | Public | Search hotels by keyword |
| `GET` | `/api/hotels/filter` | No | Public | Filter hotels by star rating, price, location |
| `GET` | `/api/hotels/featured` | No | Public | List featured/promoted hotels |
| `GET` | `/api/hotels/popular` | No | Public | List popular hotels |
| `GET` | `/api/hotels/:id` | No | Public | Get complete hotel details by ID |
| `GET` | `/api/hotels/:id/recommendations` | No | Public | Get personalized hotel recommendations |
| `POST` | `/api/hotels` | Yes | STAFF, ADMIN | Create a new hotel |
| `PUT` | `/api/hotels/:id` | Yes | STAFF, ADMIN | Update hotel details |
| `DELETE` | `/api/hotels/:id` | Yes | ADMIN | Soft delete a hotel |

#### Hotel Images (`/api/hotel-images`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/hotel-images` | Yes | STAFF, ADMIN | Upload hotel gallery image (Supabase storage) |
| `PUT` | `/api/hotel-images/:id/thumbnail` | Yes | STAFF, ADMIN | Set uploaded image as hotel thumbnail |
| `DELETE` | `/api/hotel-images/:id` | Yes | ADMIN | Delete hotel image |

#### Rooms (`/api/rooms`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/rooms` | No | Public | List all rooms |
| `GET` | `/api/rooms/hotel/:hotelId` | No | Public | List available rooms in a specific hotel |
| `GET` | `/api/rooms/:id` | No | Public | Get room details by ID |
| `GET` | `/api/rooms/:id/availability` | No | Public | Check room reservation availability |
| `POST` | `/api/rooms` | Yes | STAFF, ADMIN | Create a new room |
| `PUT` | `/api/rooms/:id` | Yes | STAFF, ADMIN | Update room specifications |
| `PUT` | `/api/rooms/:id/status` | Yes | STAFF, ADMIN | Force-update room status (available, occupied) |
| `DELETE` | `/api/rooms/:id` | Yes | ADMIN | Soft delete a room |

#### Room Images (`/api/room-images`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/room-images` | Yes | STAFF, ADMIN | Upload room gallery image |
| `DELETE` | `/api/room-images/:id` | Yes | ADMIN | Delete room image |

### 4. Apartments Management
#### Apartments (`/api/apartments`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/apartments` | No | Public | List all apartments with pagination |
| `GET` | `/api/apartments/search` | No | Public | Search apartments by keyword |
| `GET` | `/api/apartments/filter` | No | Public | Filter apartments by criteria |
| `GET` | `/api/apartments/:id` | No | Public | Get apartment details by ID |
| `POST` | `/api/apartments` | Yes | STAFF, ADMIN | Create a new apartment |
| `PUT` | `/api/apartments/:id` | Yes | STAFF, ADMIN | Update apartment info |
| `DELETE` | `/api/apartments/:id` | Yes | ADMIN | Soft delete an apartment |

#### Apartment Images (`/api/apartment-images`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/apartment-images` | Yes | STAFF, ADMIN | Upload apartment gallery image |
| `PUT` | `/api/apartment-images/:id` | Yes | STAFF, ADMIN | Update apartment image details |
| `DELETE` | `/api/apartment-images/:id` | Yes | ADMIN | Delete apartment image |

### 5. Tours Management
#### Tours (`/api/tours`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tours` | No | Public | List all tours |
| `GET` | `/api/tours/search` | No | Public | Search tours by location/keyword |
| `GET` | `/api/tours/filter` | No | Public | Filter tours by price, duration, capacity |
| `GET` | `/api/tours/popular` | No | Public | List popular tours |
| `GET` | `/api/tours/:id` | No | Public | Get tour details by ID |
| `POST` | `/api/tours` | Yes | STAFF, ADMIN | Create a new tour (Local file upload) |
| `PUT` | `/api/tours/:id` | Yes | STAFF, ADMIN | Update tour details |
| `DELETE` | `/api/tours/:id` | Yes | ADMIN | Soft delete a tour |

#### Tour Images (`/api/tour-images`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/tour-images` | Yes | STAFF, ADMIN | Upload tour image to Supabase |
| `PUT` | `/api/tour-images/:id` | Yes | STAFF, ADMIN | Replace tour image |
| `DELETE` | `/api/tour-images/:id` | Yes | ADMIN | Delete tour image |

### 6. Bookings & Reservations
#### Hotel Bookings (`/api/bookings`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/bookings/my` | Yes | CUSTOMER, STAFF, ADMIN | Get own booking history |
| `GET` | `/api/bookings` | Yes | STAFF, ADMIN | Get all system bookings |
| `POST` | `/api/bookings` | Yes | CUSTOMER, STAFF, ADMIN | Place a room booking |
| `GET` | `/api/bookings/:id` | Yes | Owner, STAFF, ADMIN | Get booking details |
| `PUT` | `/api/bookings/:id/cancel` | Yes | Owner, STAFF, ADMIN | Cancel reservation |
| `PUT` | `/api/bookings/:id/checkin` | Yes | STAFF, ADMIN | Check-in customer |
| `PUT` | `/api/bookings/:id/checkout` | Yes | STAFF, ADMIN | Check-out customer |
| `PUT` | `/api/bookings/:id/status` | Yes | STAFF, ADMIN | Override booking status manually |
| `DELETE` | `/api/bookings/:id` | Yes | ADMIN | Soft delete a booking |

#### Tour Bookings (`/api/tour-bookings`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tour-bookings/my` | Yes | CUSTOMER, STAFF, ADMIN | Get own tour bookings |
| `GET` | `/api/tour-bookings` | Yes | STAFF, ADMIN | Get all tour bookings |
| `POST` | `/api/tour-bookings` | Yes | CUSTOMER, STAFF, ADMIN | Book a tour reservation |
| `GET` | `/api/tour-bookings/:id` | Yes | Owner, STAFF, ADMIN | Get tour booking details |
| `PUT` | `/api/tour-bookings/:id/cancel` | Yes | Owner, STAFF, ADMIN | Cancel tour booking |

### 7. Payments & Transactions (`/api/payments`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/payments/my` | Yes | CUSTOMER, STAFF, ADMIN | View personal transactions |
| `GET` | `/api/payments/history` | Yes | STAFF, ADMIN | View all system payments |
| `POST` | `/api/payments/create` | Yes | CUSTOMER, STAFF, ADMIN | Initialize booking payment checkout |
| `POST` | `/api/payments/callback` | No | Public (HMAC verified) | Secure third-party payment gateway callback |
| `GET` | `/api/payments/:id` | Yes | Owner, STAFF, ADMIN | Get transaction status |
| `PUT` | `/api/payments/:id/refund` | Yes | ADMIN | Process customer refund |

### 8. Vouchers & Promotion Orders
#### Vouchers (`/api/vouchers`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/vouchers` | No | Public | List all available vouchers |
| `GET` | `/api/vouchers/active` | No | Public | List active non-expired vouchers |
| `GET` | `/api/vouchers/expired` | No | Public | List expired vouchers |
| `GET` | `/api/vouchers/:id` | No | Public | Get voucher details |
| `POST` | `/api/vouchers` | Yes | STAFF, ADMIN | Create a promotional voucher |
| `PUT` | `/api/vouchers/:id` | Yes | STAFF, ADMIN | Update voucher conditions |
| `DELETE` | `/api/vouchers/:id` | Yes | ADMIN | Soft delete a voucher |

#### Voucher Orders & Redemption (`/api/voucher-orders`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/voucher-orders` | Yes | CUSTOMER, STAFF, ADMIN | Purchase/claim a voucher |
| `GET` | `/api/voucher-orders` | Yes | STAFF, ADMIN | List all voucher orders |
| `GET` | `/api/voucher-orders/my` | Yes | CUSTOMER, STAFF, ADMIN | List own voucher orders |
| `POST` | `/api/voucher-orders/redeem` | Yes | STAFF, ADMIN | Redeem/apply voucher |
| `GET` | `/api/voucher-orders/:id` | Yes | Owner, STAFF, ADMIN | Get voucher order detail |
| `PUT` | `/api/voucher-orders/:id/cancel` | Yes | Owner, STAFF, ADMIN | Cancel voucher order |
| `POST` | `/api/voucher-orders/:id/pay` | Yes | Owner, STAFF, ADMIN | Pay for voucher order |
| `GET` | `/api/voucher-orders/:id/qr` | Yes | Owner, STAFF, ADMIN | Get QR code for voucher validation |

### 9. Social & Interaction Modules
#### Wishlist (`/api/wishlist`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/wishlist` | Yes | CUSTOMER, STAFF, ADMIN | Retrieve own wishlist items |
| `POST` | `/api/wishlist` | Yes | CUSTOMER, STAFF, ADMIN | Add hotel/apartment/tour to wishlist |
| `DELETE` | `/api/wishlist/:id` | Yes | Owner, STAFF, ADMIN | Remove item from wishlist |

#### Notifications (`/api/notifications`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Yes | CUSTOMER, STAFF, ADMIN | Retrieve user notifications |
| `PUT` | `/api/notifications/:id/read` | Yes | Owner, STAFF, ADMIN | Mark a notification as read |
| `DELETE` | `/api/notifications/:id` | Yes | Owner, STAFF, ADMIN | Delete notification |

#### Reviews & Moderation (`/api/reviews`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews/hotel/:hotelId` | No | Public | List hotel reviews |
| `GET` | `/api/reviews/apartment/:apartmentId` | No | Public | List apartment reviews |
| `GET` | `/api/reviews/tour/:tourId` | No | Public | List tour reviews |
| `POST` | `/api/reviews` | Yes | CUSTOMER, STAFF, ADMIN | Write review (XSS-sanitized) |
| `PUT` | `/api/reviews/:id` | Yes | Owner, STAFF, ADMIN | Update own review |
| `DELETE` | `/api/reviews/:id` | Yes | Owner, STAFF, ADMIN | Delete review (Staff/Admin moderator bypass allowed) |
| `PUT` | `/api/reviews/:id/report` | Yes | CUSTOMER, STAFF, ADMIN | Flag/Report review for moderation |

### 10. Blog & Articles (`/api/blog`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/blog` | No | Public | List all articles |
| `GET` | `/api/blog/:id` | No | Public | Read full blog article |
| `POST` | `/api/blog` | Yes | STAFF, ADMIN | Create blog article (XSS-sanitized) |
| `PUT` | `/api/blog/:id` | Yes | STAFF, ADMIN | Edit blog article |
| `DELETE` | `/api/blog/:id` | Yes | ADMIN | Soft delete blog article |

### 11. Contact Messages (`/api/contact`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/contact` | No | Public | Submit contact support form |
| `GET` | `/api/contact` | Yes | STAFF, ADMIN | List all contact submissions |
| `GET` | `/api/contact/:id` | Yes | STAFF, ADMIN | View contact detail |
| `DELETE` | `/api/contact/:id` | Yes | ADMIN | Delete contact submission |

### 12. Administration Console (`/api/admin`)
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Yes | ADMIN | Advanced user accounts listing |
| `GET` | `/api/admin/bookings` | Yes | ADMIN | Advanced booking history listing |
| `GET` | `/api/admin/payments` | Yes | ADMIN | Advanced transaction history listing |
| `GET` | `/api/admin/statistics` | Yes | ADMIN | Retrieve business dashboard statistics |
| `GET` | `/api/admin/revenue` | Yes | ADMIN | Retrieve financial revenue data |
| `GET` | `/api/admin/audit-logs` | Yes | ADMIN | Inspect system security audit logs |
| `PUT` | `/api/admin/users/:id/role` | Yes | ADMIN | Update user role (with safe self-demotion checks) |
| `DELETE` | `/api/admin/users/:id` | Yes | ADMIN | Soft delete user |

### 13. Health Verification
| Method | Endpoint | Auth Required | Allowed Roles / Scope | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | Public | Check service & database health status |
