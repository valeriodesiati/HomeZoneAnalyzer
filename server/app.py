from flask import Flask, jsonify  # Import Flask per creare l'applicazione web e jsonify per formattare le risposte JSON
import geopandas as gpd  # Import GeoPandas per lavorare con i dati geografici
import pandas as pd  # Import Pandas per la manipolazione dei dati
from sqlalchemy import create_engine  # Import SQLAlchemy per la connessione al database
from libpysal.weights import KNN  # Import libpysal per calcolare i pesi spaziali con K-Nearest Neighbors
from esda.moran import Moran  # Import Moran per calcolare l'indice di Moran
from shapely.ops import nearest_points  # Import nearest_points per trovare i punti più vicini
from flask_cors import CORS

app = Flask(__name__)  # Crea un'istanza dell'applicazione Flask
CORS(app)

# Funzione per ottenere il motore di connessione al database
def get_engine():
    return create_engine('postgresql+psycopg2://postgres:postgres@localhost:5432/sca')  # Crea il motore di connessione a PostgreSQL

# Funzione per caricare i dati dal database
def load_data():
    engine = get_engine()  # Ottiene il motore di connessione al database
    queries = {
        'apartments': 'SELECT prezzo, geometry::geometry FROM apartments',  
        'neighborhoods': 'SELECT cod_quar, quartiere, geometry::geometry FROM neighborhoods',  
        'schools': 'SELECT geometry::geometry FROM schools', 
        'hospitals': 'SELECT geometry::geometry FROM hospitals', 
        'pharmacies': 'SELECT geometry::geometry FROM pharmacies',  
        'sports_areas': 'SELECT geometry::geometry FROM sports_areas',  
        'green_areas': 'SELECT geometry::geometry FROM green_areas', 
        'libraries': 'SELECT geometry::geometry FROM libraries', 
        'bus_stops': 'SELECT geometry::geometry FROM bus_stops',
        'bike_racks': 'SELECT geometry::geometry FROM bike_racks',  
        'electric_stations': 'SELECT geometry::geometry FROM electric_stations',
        'theaters': 'SELECT geometry::geometry FROM theaters',  
        'ludics': 'SELECT geometry::geometry FROM ludics',  
    }
    
    data = {}  # Dizionario per memorizzare i dati caricati
    for key, query in queries.items():  # Itera su ciascuna query
        data[key] = gpd.read_postgis(query, engine, geom_col='geometry')  # Esegue la query e carica i dati in un GeoDataFrame
    
    return data  # Restituisce i dati caricati

# Funzione per calcolare le distanze tra gli appartamenti e i punti di interesse
def calculate_distances(apartments_df, points_gdf):
    # Trova il punto più vicino per ogni appartamento
    nearest_geoms = [nearest_points(apt, points_gdf.unary_union)[1] for apt in apartments_df.geometry]
    # Calcola la distanza tra ogni appartamento e il punto più vicino
    return [apt.distance(geom) for apt, geom in zip(apartments_df.geometry, nearest_geoms)]

# Endpoint per calcolare l'indice di Moran generalizzato
@app.route('/calculate_morans_i', methods=['GET'])
def calculate_morans_i():
    try:
        data = load_data()  # Carica i dati dal database

        apartments_df = data['apartments']  # Ottiene i dati degli appartamenti
        neighborhoods_df = data['neighborhoods']  # Ottiene i dati dei quartieri
        # Unisce i dati di tutti i punti di interesse in un unico GeoDataFrame
        points_gdf = gpd.GeoDataFrame(pd.concat([data['schools'], data['hospitals'], data['pharmacies'], data['sports_areas'], data['green_areas'], data['libraries'], data['bus_stops'], data['bike_racks'], data['electric_stations'], data['theaters'], data['ludics']], ignore_index=True), geometry='geometry')

        # Verifica che i dati abbiano geometrie
        if apartments_df.empty or neighborhoods_df.empty:
            return jsonify({'error': 'One or more required data tables are empty'}), 500  # Restituisce un errore se i dati sono vuoti

        # Calcola le distanze da ogni appartamento al punto di interesse più vicino
        apartments_df['distance'] = calculate_distances(apartments_df, points_gdf)

        # Calcola la distanza media ai punti di interesse per ogni appartamento
        apartments_df['avg_distance'] = apartments_df['distance']

        # Unione spaziale per assegnare gli appartamenti ai quartieri (opzionale)
        joined_df = gpd.sjoin(apartments_df, neighborhoods_df, how='left', predicate='within')

        # Verifica che ci siano abbastanza appartamenti per il calcolo
        if len(joined_df) > 1:
            # Calcolo del K-Nearest Neighbors per tutti gli appartamenti
            w = KNN.from_dataframe(joined_df, k=4)  # Crea una matrice dei pesi spaziali con k-nearest neighbors
            moran = Moran(joined_df['prezzo'], w)  # Calcola l'indice di Moran

            # Restituisci il valore dell'indice di Moran
            return jsonify({
                'moran_I': moran.I,  # Indice di Moran
                'p_value': moran.p_sim,  # p-value per verificare la significatività statistica
                'z_score': moran.z_sim  # z-score per l'ipotesi di casualità spaziale
            }), 200
        else:
            return jsonify({'error': 'Not enough data points to calculate Moran\'s I'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500  # Restituisce un errore se qualcosa va storto

# Endpoint per verificare la connessione al database
@app.route('/check_connection', methods=['GET'])
def check_connection():
    try:
        engine = get_engine()  # Ottiene il motore di connessione al database
        conn = engine.connect()  # Apre una connessione
        conn.close()  # Chiude la connessione
        return jsonify({'message': 'Successfully connected to the database'}), 200  # Restituisce un messaggio di successo
    except Exception as e:
        return jsonify({'error': 'Failed to connect to the database', 'details': str(e)}), 500  # Restituisce un errore se la connessione fallisce


if __name__ == '__main__':
    # Avvia l'applicazione Flask
    app.run(host='0.0.0.0',debug=True,port=5000)
