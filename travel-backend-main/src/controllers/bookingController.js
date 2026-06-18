const bookings = [];
let nextId = 1;

exports.getAll = (req, res) => {
  res.json({ success: true, data: bookings });
};

exports.getById = (req, res) => {
  const booking = bookings.find(b => b.id === parseInt(req.params.id));
  if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng' });
  res.json({ success: true, data: booking });
};

exports.create = (req, res) => {
  const { name, email, phone, roomType, checkin, checkout, guests } = req.body;

  if (!name || !email || !checkin || !checkout) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
  }

  const booking = {
    id: nextId++,
    name, email, phone, roomType, checkin, checkout, guests,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  res.status(201).json({ success: true, data: booking });
};

exports.update = (req, res) => {
  const index = bookings.findIndex(b => b.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng' });

  bookings[index] = { ...bookings[index], ...req.body };
  res.json({ success: true, data: bookings[index] });
};

exports.remove = (req, res) => {
  const index = bookings.findIndex(b => b.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng' });

  bookings.splice(index, 1);
  res.json({ success: true, message: 'Đã xóa đặt phòng' });
};
