
# Usa la imagen oficial de Node.js como base
FROM node:16

# Instala las dependencias necesarias para compilar módulos nativos de Node.js
RUN apt-get update && apt-get install -y \
    python \
    libfontconfig \
    libfreetype6 \
    libpng-dev \
    libjpeg-dev \
    libssl-dev \
    libx11-dev \
    libxext-dev \
    libxrender-dev \
    wget \
    curl \
    ca-certificates \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación al directorio de trabajo
COPY . .

# Expone el puerto en el que la aplicación va a escuchar
EXPOSE 3000

# Comando para ejecutar la aplicación cuando el contenedor se inicie
CMD ["npm", "start"]


