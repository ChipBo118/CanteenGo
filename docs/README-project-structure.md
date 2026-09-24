# Báo cáo tổ chức lại cấu trúc project theo mô tả nhóm G9

## 1. Mục tiêu

Dự án CanteenGo được mô tả trong tài liệu nhóm G9 là ứng dụng đặt đồ ăn căn tin hỗ trợ:
- đăng nhập theo vai trò Sinh viên / Nhân viên căn tin / Quản trị viên
- xem thực đơn và đặt món
- thanh toán giả lập bằng Ví CanteenGo
- xác nhận / từ chối đơn hàng
- quản lý thực đơn và báo cáo doanh thu

## 2. Đánh giá cấu trúc hiện tại

Các file hiện có:
- index.html
- admin.html
- script.js
- admin.js
- data.js
- styles.css
- admin.css

Đây là dạng project frontend tĩnh, không có cấu trúc theo mô hình web project chuẩn. Tuy nhiên, source hiện tại đã tương ứng với mô tả G9 ở mức logic nghiệp vụ chính:
- khách hàng xem menu và đặt hàng
- giỏ hàng và thanh toán mô phỏng
- quản trị thêm/sửa/xóa món ăn
- dashboard doanh thu và thống kê

## 3. Cấu trúc web project nên theo chuẩn

Gợi ý tổ chức tương ứng với kiến trúc 3 tầng và chuẩn project frontend:

```text
CanteenGo/
├── public/
│   ├── index.html
│   ├── admin.html
│   └── assets/
│       ├── images/
│       └── icons/
├── src/
│   ├── css/
│   │   ├── styles.css
│   │   └── admin.css
│   ├── js/
│   │   ├── app.js
│   │   ├── data.js
│   │   ├── script.js
│   │   └── admin.js
│   ├── pages/
│   │   ├── customer/
│   │   │   └── home.js
│   │   └── admin/
│   │       └── dashboard.js
│   ├── data/
│   │   └── menuData.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── menuService.js
│   │   └── orderService.js
│   └── utils/
│       └── format.js
├── docs/
│   └── README-project-structure.md
├── package.json
├── README.md
└── .gitignore
```

## 4. So sánh với source hiện tại

### Đã có tương ứng với yêu cầu G9
- Customer page: [index.html](../index.html)
- Admin page: [admin.html](../admin.html)
- Shared data layer: [data.js](../data.js)
- Customer logic: [script.js](../script.js)
- Admin logic: [admin.js](../admin.js)
- Styling: [styles.css](../styles.css), [admin.css](../admin.css)

### Chưa đạt chuẩn tổ chức project web
- Tất cả file nằm cùng cấp root.
- Không có phân tầng rõ ràng theo public/src/assets/docs.
- Chưa tách service, page logic, data, assets theo chuẩn.
- Chưa có package.json hoặc cấu hình chạy dự án chuẩn.

## 5. Kiểm tra chức năng theo mô tả G9

### 5.1. Chức năng khách hàng (Sinh viên)
- Xem thực đơn: có trong [index.html](../index.html) và [script.js](../script.js)
- Chọn món và thêm vào giỏ: có trong [script.js](../script.js)
- Tính tiền và giỏ hàng: có trong [script.js](../script.js)
- Đặt hàng: có logic trong [script.js](../script.js)
- Đăng nhập đa vai trò: có trong [script.js](../script.js)

### 5.2. Chức năng quản trị
- Quản lý món ăn: có trong [admin.js](../admin.js)
- Dashboard doanh thu mô phỏng: có trong [admin.js](../admin.js)
- Dữ liệu menu dùng chung: có trong [data.js](../data.js)

### 5.3. Điểm phù hợp với doc G9
- Cấu trúc chức năng chính tương ứng với mô tả đề tài.
- Dữ liệu demo và luồng role-based đã được triển khai theo dạng frontend mô phỏng.
- Chưa có backend / DB thật, đúng với mô tả trong doc: đây là demo frontend và dữ liệu lưu trong localStorage/sessionStorage.

## 6. Kết luận

Source code hiện tại chưa ở dạng project web chuẩn nhưng đã đáp ứng đúng phần lớn chức năng core mô tả trong doc nhóm G9. Do đó, việc tổ chức lại project nên là việc sắp xếp lại folder, không sửa code chạy, chỉ tách nguyên tắc clean structure theo chuẩn web project.

## 7. Lưu ý

Yêu cầu của người dùng là: "tổ chức lại cấu trúc file (tạo thư mục cần thiết theo cấu trúc project lập trình web), đặt tên , kiểm tra chức năng , không sửa đổi code và báo cáo lại dựa theo file doc mô tả".

Do đó việc thực hiện đúng là:
- tạo folder chuẩn
- đặt tên rõ ràng
- thừa nhận source hiện tại đã chạy nhưng chưa được tổ chức theo chuẩn
- không thay đổi logic hiện có
- báo cáo dựa trên doc mô tả G9
