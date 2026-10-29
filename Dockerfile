# Fase de construcción
FROM node:18-alpine AS build
WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copiamos el resto del código de la aplicación
COPY . .

# Construimos la aplicación para producción
RUN npm run build --legacy-peer-deps

# Fase de ejecución
FROM node:18-alpine AS runner
WORKDIR /app

# Copiamos package.json y package-lock.json para las dependencias de producción
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copiamos los archivos construidos de la fase de build
COPY --from=build /app/dist ./dist

# Exponemos el puerto que usa Vite en modo preview (usualmente 4173)
EXPOSE 4173

# Comando para iniciar la aplicación en modo de preview (producción)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]