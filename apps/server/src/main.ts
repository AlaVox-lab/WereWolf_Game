import { createApp } from './interface/api/app.js';

// Điểm lắp ráp phụ thuộc và khởi động máy chủ.
const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  console.log(`Máy chủ Làng Trăng Mờ chạy tại http://localhost:${port}`);
});
