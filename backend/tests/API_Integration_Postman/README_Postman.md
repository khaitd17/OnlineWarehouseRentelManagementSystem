# Hướng dẫn Kiểm thử Tích hợp với Postman Collection Runner

Tài liệu này hướng dẫn bạn cách sử dụng bộ công cụ Postman để tự động kiểm thử toàn bộ dòng đời của một kho hàng (từ lúc tạo mới đến lúc được Admin phê duyệt).

## 1. Chuẩn bị
1. Cài đặt **Postman Desktop** (khuyên dùng) hoặc dùng trên trình duyệt.
2. Đảm bảo Backend OWRMS đang chạy tại `http://localhost:5276`.
3. Kiểm tra xem trong database đã có 2 tài khoản mẫu chưa:
   - **Owner**: `owner@owrms.com` / Pass: `123456`
   - **Admin**: `admin@owrms.com` / Pass: `123456`
   *(Nếu tài khoản khác, bạn có thể chỉnh sửa trong file Environment ở bước sau).*

## 2. Các bước thực hiện

### Bước 1: Import file vào Postman
1. Mở Postman, nhấn nút **Import**.
2. Kéo thả 2 file sau vào cửa sổ Import:
   - `OWRMS_Warehouse_Integration.postman_collection.json`
   - `OWRMS_Local.postman_environment.json`
3. Nhấn **Import** để xác nhận.

### Bước 2: Chọn Môi trường (Environment)
1. Ở góc trên bên phải giao diện Postman, tìm menu thả xuống (thường mặc định là "No Environment").
2. Chọn môi trường **OWRMS_Local**.
3. (Tùy chọn) Click vào biểu tượng con mắt bên cạnh để kiểm tra các biến như `base_url`, `owner_email`, v.v.

### Bước 3: Sử dụng Collection Runner (Chạy tự động)
1. Trong danh sách Collections bên trái, click vào **OWRMS_Warehouse_Integration**.
2. Nhấn nút **Run** (thường nằm ở thanh công cụ phía trên danh sách API).
3. Một tab mới hiện ra, đảm bảo các API được chọn đúng thứ tự:
   - Login -> Create -> Submit -> Approve -> Search.
4. Nhấn nút **Run OWRMS_Warehouse_Integration**.

## 3. Đọc kết quả
- **Màu xanh (PASS)**: API hoạt động đúng logic, dữ liệu trả về đúng mong đợi.
- **Màu đỏ (FAIL)**: Có lỗi xảy ra (có thể do lỗi code backend hoặc dữ liệu test không hợp lệ).
- Sau khi chạy xong, bạn có thể nhấn vào từng API để xem chi tiết Request/Response đã gửi đi.

## 4. Các tính năng tự động có trong bộ test này
- **Auto Token**: Tự động lấy JWT Token sau khi Login và điền vào các API sau.
- **Auto Warehouse ID**: Tự động lấy ID của kho vừa tạo để dùng cho việc Update, Submit và Approve.
- **Random Data**: Tự động tạo tên kho ngẫu nhiên để bạn có thể nhấn "Run" nhiều lần mà không sợ trùng tên kho trong DB.

---
*Lưu ý: Nếu bạn muốn chạy qua dòng lệnh (không cần mở Postman), hãy cài đặt Newman và chạy lệnh:*
`newman run OWRMS_Warehouse_Integration.postman_collection.json -e OWRMS_Local.postman_environment.json`
