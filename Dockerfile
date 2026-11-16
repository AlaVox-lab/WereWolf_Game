# Ảnh chạy Làng Trăng Mờ trong một container (ROADMAP 6.4): máy chủ Node phục vụ cả REST,
# Socket.IO lẫn bản build của web trên cùng một cổng. CSDL là container PostgreSQL riêng —
# xem infra/docker-compose.yml. Dựng và chạy: npm run docker:up → http://localhost:8080

FROM node:24-bookworm-slim AS xay
WORKDIR /app

# Cài thư viện trước, chép mã sau — đổi mã không phải cài lại. postinstall của máy chủ chạy
# `prisma generate`, nên cần lược đồ Prisma ngay từ bước này.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/prisma.config.ts apps/server/
COPY apps/server/prisma apps/server/prisma
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build --workspace @moonvillage/web

FROM node:24-bookworm-slim
WORKDIR /app
COPY --from=xay /app /app
WORKDIR /app/apps/server
ENV PORT=3000 \
    THU_MUC_WEB=/app/apps/web/dist
EXPOSE 3000
# Mỗi lần khởi động: áp migration còn thiếu, nạp dữ liệu mẫu (chạy lại an toàn), rồi mở máy chủ.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && npx tsx src/main.ts"]
