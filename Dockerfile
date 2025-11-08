# 1️⃣ Node tabanlı imaj ile başla
FROM node:18-alpine AS build

# 2️⃣ Çalışma dizinini oluştur
WORKDIR /app

# 3️⃣ package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# 4️⃣ Bağımlılıkları yükle
RUN npm install

# 5️⃣ Proje dosyalarını kopyala
COPY . .

# 6️⃣ Production build oluştur
RUN npm run build

# 7️⃣ Nginx ile build dosyalarını sunmak için ikinci aşama
FROM nginx:alpine

# 8️⃣ Build edilen dosyaları Nginx'in varsayılan web dizinine kopyala
COPY --from=build /app/build /usr/share/nginx/html

# 9️⃣ 80 portunu aç
EXPOSE 80

# 10️⃣ Nginx başlat
CMD ["nginx", "-g", "daemon off;"]


# docker run -p 8080:80 rotaproje
