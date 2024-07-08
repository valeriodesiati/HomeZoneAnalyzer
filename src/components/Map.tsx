import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import axios from 'axios';

interface MapProps {
  surveyData: Map<string, number>;
}

const Map: React.FC<MapProps> = ({ surveyData }) => {
  let mapRef = useRef<L.Map | null>(null);
  let drawnItemsRef = useRef<L.FeatureGroup<any> | null>(null);
  const [center, _setCenter] = useState<[number, number]>([44.494887, 11.3426]);
  const [circleLayer, _setCircleLayer] = useState<L.Circle | null>(null);
  const [polyLayer, _setPolyLayer] = useState<L.Polygon | null>(null);

  // Use LayerGroup instead of FeatureGroup
  const layerGroups: { [key: string]: L.LayerGroup } = {
    scuole: L.layerGroup(),
    aree_verdi: L.layerGroup(),
    colonnine_Elettriche: L.layerGroup(),
    farmacie: L.layerGroup(),
    biblioteche: L.layerGroup(),
    teatri_Cinema: L.layerGroup(),
    ospedali: L.layerGroup(),
    biciclette: L.layerGroup(),
    sport: L.layerGroup(),
    ludico: L.layerGroup(),
    fermate_Bus: L.layerGroup()
  };

  useEffect(() => {
    mapRef.current = L.map('map', {
      center,
      zoom: 13,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }),
      ],
    });

    drawnItemsRef.current = new L.FeatureGroup();
    mapRef.current.addLayer(drawnItemsRef.current);

    let drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItemsRef.current,
      },
    });
    drawControl.setDrawingOptions({
      polyline: false,
      circlemarker: false,
      rectangle: false,
    });
    mapRef.current.addControl(drawControl);

    loadPoI();

    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    });

    var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
    });

    var baseMaps = {
      "OpenStreetMap": osm,
      "OpenStreetMap.HOT": osmHOT
    };

    L.control.layers(baseMaps, layerGroups).addTo(mapRef.current!);

    return () => {
      mapRef.current?.remove();
    };
  }, [center, circleLayer, polyLayer]);

  //caricamento dei PoI sulla mappa
  let loadPoI = () => {
    
     
    loadFeatureGroupData('aree_verdi', 'http://localhost:8083/green_areas', 'https://www.svgrepo.com/show/500085/tree.svg');
    loadFeatureGroupData('scuole', 'http://localhost:8083/schools', 'https://www.svgrepo.com/show/398258/school.svg');
    loadFeatureGroupData('sport', 'http://localhost:8083/sport', 'https://www.svgrepo.com/show/475554/gym.svg');
    loadFeatureGroupData('farmacie', 'http://localhost:8083/pharmacy', 'https://www.svgrepo.com/show/475523/pharmacy.svg');
    loadFeatureGroupData('biblioteche', 'http://localhost:8083/library', 'https://www.svgrepo.com/show/395907/books.svg');
    loadFeatureGroupData('ospedali', 'http://localhost:8083/hospital', 'https://www.svgrepo.com/show/500071/hospital.svg');
    loadFeatureGroupData('biciclette', 'http://localhost:8083/bycicles', 'https://www.svgrepo.com/show/105391/bycicle.svg');
    loadFeatureGroupData('teatri_Cinema', 'http://localhost:8083/cinemaTeathers', 'https://www.svgrepo.com/show/418375/cinema-dessert-fastfood.svg');
    loadFeatureGroupData('ludico', 'http://localhost:8083/ludic', 'https://www.svgrepo.com/show/475275/star.svg');
    loadFeatureGroupData('colonnine_Elettriche', 'http://localhost:8083/electric', 'https://www.svgrepo.com/show/396360/electric-plug.svg');
    loadFeatureGroupData('fermate_Bus', 'http://localhost:8083/bus', 'https://www.svgrepo.com/show/500067/bus-stop.svg');
    
  };

  const surveyKeys = Array.from(surveyData.keys());
  const surveyValues = Array.from(surveyData.values());

  axios.post('http://localhost:8083/', { keys: surveyKeys, values: surveyValues })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error('Error sending survey data to server:', error);
    });

  //funzione per fare fetch di ogni tipo di PoI dal DB
  let loadFeatureGroupData = (key: string, url: string, urlMarkericon: string) => {
    //creazione overlay per checkbox menù per la voce di un PoI
    L.control.layers().addOverlay(layerGroups[key], key);
    //chiamata get
    axios.get(url)
      //ottenuti i dati eseguo una serie di operazioni
      .then((response) => {
        console.log(response.data);

        //ciclo sull'array di risposta dal db
        response.data.forEach((item: { st_asgeojson: string, nome: string, quartiere: string }) => {
          //parsing di ogni item della risposta in formato geojson
          let geojson = JSON.parse(item.st_asgeojson);
        
          const markerIcon = L.icon({
            iconUrl: urlMarkericon,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          //creazione marker poi si aggiunge al layer 
          L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon }).addTo(layerGroups[key]);

          
          
           
             
          
          
          //creazione icon per il marker
        });

      })
      //in caso di errore segnalo che il fetch dei dati non è andato a buon fine
      .catch((error) => {
        console.error(`Errore durante il recupero dei dati delle ${key}:`, error);
      });
  };

  return (
    <div style={{ display: 'flex' }}>
      <div id="map" style={{ height: '100vw', width: '70vw' }} />
      <div style={{ marginLeft: '20px' }}>
        <h3>Survey Data</h3>
        <ul>
          {[...surveyData.entries()].map(([poi, response], index) => (
            <li key={index}>
              {poi}: {response}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Map;
