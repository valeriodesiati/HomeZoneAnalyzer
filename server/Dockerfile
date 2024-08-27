# # Use the official Python image from the Docker Hub
# FROM python:3.9-slim

# # Set the working directory in the container
# WORKDIR /app

# # Define environment variable
# ENV FLASK_APP=app.py

# # Copy the current directory contents into the container at /app
# COPY . .

# # Install any needed packages specified in requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt

# # Run app.py when the container launches
# CMD ["python","app.py"]

# Usa l'immagine ufficiale di Node.js come base
FROM node:18-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia il file package.json e package-lock.json nella directory di lavoro
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto dei file della tua applicazione nella directory di lavoro
COPY . .

# Espone la porta su cui gira la tua applicazione (assicurati che la tua app ascolti su questa porta)
EXPOSE 5173

# Comando per avviare la tua applicazione
CMD ["node", "index.js"]


