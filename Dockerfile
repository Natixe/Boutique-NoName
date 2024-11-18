FROM --platform=amd64 node:22-alpine3.20 AS build

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances de l'application principale
COPY package*.json ./
COPY process.yml ./
COPY . .

# Installer toutes les dépendances sans --production
RUN npm install 

# Construire l'application principale
RUN npm run build

# Installer les dépendances de l'application admin
WORKDIR /app/admin
COPY package*.json ./
COPY . .

RUN npm install


# Étape final
FROM node:22-alpine3.20

# Installer PM2 globalement
RUN npm install -g pm2

# Revenir au dossier principal
WORKDIR /app

# Copier les fichiers depuis l'étape de build
COPY --from=build /app ./
COPY --from=build /app/admin ./
COPY --from=build /app/start.sh ./

# Ajouter les permissions d'exécution à start.sh
RUN chmod +x /app/start.sh

# Exposer les ports pour les deux applications
EXPOSE 3000 5173 8888

# Démarrer les deux application
CMD ["pm2-runtime", "process.yml"]