export const CustomAlert = {
  alert: function(message, title = 'Thông báo', type = 'info') {
    return Swal.fire({
      title: title,
      text: message,
      icon: type,
      confirmButtonText: 'OK',
      customClass: {
        confirmButton: 'btn btn-primary'
      },
      buttonsStyling: false
    });
  },
  confirm: function(message, title = 'Xác nhận', confirmText = 'Đồng ý', cancelText = 'Hủy') {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary mx-2'
      },
      buttonsStyling: false
    }).then((result) => {
      return result.isConfirmed;
    });
  }
};
