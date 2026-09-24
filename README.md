# CanteenGo

## Giới thiệu

CanteenGo là ứng dụng demo đặt đồ ăn căn tin dành cho sinh viên, giảng viên và quản trị viên. Dự án được xây dựng theo mô tả trong tài liệu nhóm G9, tập trung vào trải nghiệm đặt món, thanh toán mô phỏng và quản lý thực đơn.

## Tính năng chính

- Xem thực đơn theo danh mục
- Thêm món vào giỏ hàng
- Tính tổng tiền và phí giao
- Đăng nhập theo vai trò: sinh viên, giảng viên, khách vãng lai, quản trị
- Quản lý món ăn trong trang admin
- Dashboard doanh thu mô phỏng
- Dữ liệu chia sẻ qua localStorage/sessionStorage

## Cấu trúc project

```text
CanteenGo/
├── public/
│   ├── index.html
│   └── admin.html
├── src/
│   ├── css/
│   │   ├── styles.css
│   │   └── admin.css
│   ├── js/
│   │   ├── data.js
│   │   ├── script.js
│   │   └── admin.js
│   ├── data/
│   ├── services/
│   └── pages/
├── assets/
├── docs/
├── package.json
├── README.md
├── .gitignore
└── Nhóm G9.docx
```

## Cách chạy

### Với Python
```bash
python -m http.server 8000 --directory public
```

Sau đó mở:
- http://localhost:8000/index.html
- http://localhost:8000/admin.html

### Với npm (nếu đã có Node.js)
```bash
npm run dev
```

## Tài khoản demo

- Admin: admin@vwa.edu.vn / Admin@123
- Sinh viên: SV2024001 / sv123456
- Giảng viên: ha.minh@edu.vn / gv123456

## Lưu ý

Dự án này là demo frontend, không có backend thật. Các dữ liệu được lưu trong localStorage/sessionStorage theo mô tả trong tài liệu G9.
