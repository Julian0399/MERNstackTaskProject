FROM node:18

WORKDIR /app

# 1. Copiar solo los archivos esenciales primero
COPY package.json package-lock.json* ./  

# 2. Instalar dependencias
RUN npm install

# 3. Copiar el resto del proyecto (si existen)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]