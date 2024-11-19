FROM --platform=amd64 node:22-alpine3.20 AS build

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances de l'application principale
COPY package*.json ./
COPY process.yml ./
COPY . .

RUN npm install 
RUN npm run build

WORKDIR /app/admin
COPY package*.json ./
COPY . .

RUN npm install
RUN npm run build


# Étape final
FROM node:22-alpine3.20

# Revenir au dossier principal
WORKDIR /app

# Copier les fichiers depuis l'étape de build
COPY --from=build /app/dist ./
COPY --from=build /app/admin/dist ./admin
COPY --from=build /app/process.yml ./
COPY --from=build /app/start.sh ./
COPY --from=build /app/server ./

# Ajouter les permissions d'exécution à start.sh
RUN chmod +x /app/start.sh

# Installer PM2 globalement
RUN npm install -g pm2

# Exposer les ports pour les deux applications
EXPOSE 8888

# Démarrer les deux application
CMD ["pm2-runtime", "process.yml"]