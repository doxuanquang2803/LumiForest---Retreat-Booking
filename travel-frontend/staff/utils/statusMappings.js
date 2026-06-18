export const STATUS_MAPPINGS = {
  BOOKING: {
    PENDING: { label: 'Pending', cssClass: 'text-warning', badgeType: 'bg-warning', icon: 'bi-hourglass-split' },
    CONFIRMED: { label: 'Confirmed', cssClass: 'text-success', badgeType: 'bg-success', icon: 'bi-check-circle' },
    CHECKED_IN: { label: 'Checked In', cssClass: 'text-primary', badgeType: 'bg-primary', icon: 'bi-box-arrow-in-right' },
    CHECKED_OUT: { label: 'Checked Out', cssClass: 'text-secondary', badgeType: 'bg-secondary', icon: 'bi-box-arrow-left' },
    CANCELLED: { label: 'Cancelled', cssClass: 'text-danger', badgeType: 'bg-danger', icon: 'bi-x-circle' }
  },
  PAYMENT: {
    PENDING: { label: 'Pending', cssClass: 'text-warning', badgeType: 'bg-warning', icon: 'bi-hourglass' },
    COMPLETED: { label: 'Completed', cssClass: 'text-success', badgeType: 'bg-success', icon: 'bi-check' },
    FAILED: { label: 'Failed', cssClass: 'text-danger', badgeType: 'bg-danger', icon: 'bi-x' },
    REFUNDED: { label: 'Refunded', cssClass: 'text-info', badgeType: 'bg-info', icon: 'bi-arrow-return-left' }
  },
  REVIEW: {
    PENDING: { label: 'Pending', cssClass: 'text-warning', badgeType: 'bg-warning', icon: 'bi-clock' },
    APPROVED: { label: 'Approved', cssClass: 'text-success', badgeType: 'bg-success', icon: 'bi-check' },
    HIDDEN: { label: 'Hidden', cssClass: 'text-secondary', badgeType: 'bg-secondary', icon: 'bi-eye-slash' },
    REPORTED: { label: 'Reported', cssClass: 'text-danger', badgeType: 'bg-danger', icon: 'bi-flag' }
  },
  CONTACT: {
    UNREAD: { label: 'Unread', cssClass: 'text-danger', badgeType: 'bg-danger', icon: 'bi-envelope' },
    READ: { label: 'Read', cssClass: 'text-warning', badgeType: 'bg-warning', icon: 'bi-envelope-open' },
    REPLIED: { label: 'Replied', cssClass: 'text-success', badgeType: 'bg-success', icon: 'bi-reply' }
  }
};
