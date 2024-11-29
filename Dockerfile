# Étape de build de l'application principale
FROM --platform=amd64 node:20-alpine AS build-main

# Définir le répertoire de travail
WORKDIR /app

COPY . .

RUN rm -rf admin
COPY server/upload/images ./upload/images

# Installer les dépendances de l'application principale
RUN npm install 

# Construire l'application principale
RUN npm run build


# Étape de build de l'application admin
FROM --platform=amd64 node:20-alpine AS build-admin

# Définir le répertoire de travail
WORKDIR /app/admin

COPY admin/package*.json ./
COPY admin/. .
# Installer les dépendances de l'application admin
RUN npm install



# Construire l'application admin
RUN npm run build


# Étape final
FROM --platform=amd64 node:20-alpine

# Revenir au dossier principal
WORKDIR /app

# Copier les artefacts construits de l'application principale
COPY --from=build-main /app/dist ./dist
COPY --from=build-main /app/process.yml ./
COPY --from=build-main /app/start.sh ./
COPY --from=build-main /app/server ./server
COPY --from=build-main /app/.env ./ 
COPY --from=build-main /app/upload/images ./server/upload/images

# Copier les artefacts construits de l'application admin
COPY --from=build-admin /app/admin/dist ./admin/dist



# Copier les fichiers package.json et installer les dépendances
COPY --from=build-main /app/package*.json ./
WORKDIR /app
RUN npm install

COPY --from=build-admin /app/admin/package*.json ./admin/
WORKDIR /app/admin
RUN npm install 


# Revenir au dossier principal
WORKDIR /app

# Installer PM2 globalement
RUN npm install -g pm2

# Ajouter les permissions d'exécution à start.sh
RUN chmod +x /app/start.sh

# Exposer les ports pour les deux applications
EXPOSE 8888

# Démarrer les deux application
CMD ["pm2-runtime", "process.yml"]