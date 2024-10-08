# # Utilizza un'immagine di base per Node.js
# FROM node:18-alpine

# # Imposta la directory di lavoro nel container
# WORKDIR /app

# # Copia il package.json e il package-lock.json nel container
# COPY package*.json ./

# # Installa le dipendenze
# RUN npm install

# # Copia il resto del codice dell'app nel container
# COPY . .

# # Compila il progetto
# RUN npm run build

# # Espone la porta su cui l'app sarà in esecuzione
# EXPOSE 5173

# # Comando per avviare l'app
# CMD ["npm", "run", "build"]
FROM nginx:latest
COPY nginx.conf /etc/nginx/nginx.conf
ADD dist /usr/share/nginx/html


EXPOSE 80/tcp

CMD ["/usr/sbin/nginx", "-g", "daemon off;"]