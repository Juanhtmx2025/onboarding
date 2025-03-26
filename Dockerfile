FROM node:20-slim

# Instalar dependencias necesarias para Puppeteer/Chrome
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos del proyecto
COPY . .

# Instalar dependencias de Node.js
RUN npm install

# Evitar que Puppeteer descargue Chrome (usaremos el del sistema si es necesario)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Forzar Puppeteer a trabajar sin sandbox (requerido en IBM Code Engine)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Puerto que usará la app (ajústalo si usas otro)
EXPOSE 3000

# Comando para ejecutar tu aplicación
CMD ["node", "app.js"]