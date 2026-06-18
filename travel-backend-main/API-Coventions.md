==============================
API RESPONSE CONVENTION
==============================
 
1. SUCCESS RESPONSE
------------------------------
 
{
 "success": true,
 "message": "Success message",
 "data": {}
}
 
Note:
- success: trang thai API
- message: thong bao
- data: du lieu tra ve
 
 
==============================
 
2. ERROR RESPONSE
------------------------------
 
{
 "success": false,
 "message": "Error message",
 "errorCode": "ERROR_CODE"
}
 
Note:
- errorCode dung de frontend xu ly loi
 
 
==============================
 
3. LIST RESPONSE
------------------------------
 
{
 "success": true,
 "message": "Get data successfully",
 "data": []
}
 
Note:
- data la array
 
 
==============================
 
4. PAGINATION RESPONSE
------------------------------
 
{
 "success": true,
 "message": "Get data successfully",
 "data": [],
 "pagination": {
   "page": 1,
   "limit": 10,
   "total": 100,
   "totalPages": 10
 }
}
 
Note:
- dung cho danh sach co phan trang
 
 
==============================
 
5. VALIDATION ERROR RESPONSE
------------------------------
 
{
 "success": false,
 "message": "Validation failed",
 "errors": [
   {
     "field": "email",
     "message": "Email is required"
   }
 ]
}
 
Note:
- dung khi validate form
 
 
==============================
 
6. LOGIN RESPONSE
------------------------------
 
{
 "success": true,
 "message": "Login successfully",
 "data": {
   "accessToken": "jwt_token",
   "refreshToken": "refresh_token",
   "user": {
     "id": 1,
     "fullName": "John Doe",
     "role": "CUSTOMER"
   }
 }
}
 
 
==============================
 
7. COMMON ERROR CODE
------------------------------
 
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
SERVER_ERROR
 
 
==============================
 
8. COMMON HTTP STATUS
------------------------------
 
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error