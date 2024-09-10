# Usa una base image di Python
FROM python:3.9-slim

# Imposta la directory di lavoro nel container
WORKDIR /app

# Copia il resto dei file dell'applicazione nella directory di lavoro
COPY . .

# Installa le dipendenze del progetto
RUN pip install --no-cache-dir -r requirements.txt

# Espone la porta su cui Flask sarà eseguito (solitamente 5000)
EXPOSE 5000

# Imposta la variabile di ambiente per far partire Flask correttamente
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Comando per eseguire l'app Flask
CMD ["flask", "run"]
