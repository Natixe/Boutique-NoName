FROM --platform=amd64 node:20-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances de l'application principale
COPY package*.json ./
COPY process.yml ./

RUN npm install 
COPY . .
RUN npm run build

WORKDIR /app/admin
COPY package*.json ./

RUN npm install
COPY . .
RUN npm run build


# Étape final
FROM node:20-alpine

# Revenir au dossier principal
WORKDIR /app

# Copier les fichiers depuis l'étape de build
COPY --from=build /app/dist ./
COPY --from=build /app/admin/dist ./admin
COPY --from=build /app/process.yml ./
COPY --from=build /app/start.sh ./
COPY --from=build /app/server ./server

COPY --from=build /app/package*.json ./
RUN npm install --only=production

COPY --from=build /app/admin/package*.json ./admin
RUN npm install --only=production

# Installer PM2 globalement
RUN npm install -g pm2

# Ajouter les permissions d'exécution à start.sh
RUN chmod +x /app/start.sh

# Exposer les ports pour les deux applications
EXPOSE 8888

# Démarrer les deux application
CMD ["pm2-runtime", "process.yml"]