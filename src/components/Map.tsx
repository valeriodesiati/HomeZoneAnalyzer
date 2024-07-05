import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import axios from 'axios';

interface MapProps {
  surveyData: number[];
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
    
    
    loadFeatureGroupData('scuole', 'http://localhost:8083/schools','https://www.svgrepo.com/show/398258/school.svg');
    loadFeatureGroupData('sport', 'http://localhost:8083/sport','https://www.svgrepo.com/show/475554/gym.svg');
    loadFeatureGroupData('farmacie', 'http://localhost:8083/pharmacy','https://www.svgrepo.com/show/475523/pharmacy.svg');
    loadFeatureGroupData('biblioteche', 'http://localhost:8083/library','https://www.svgrepo.com/show/395907/books.svg');
    loadFeatureGroupData('ospedali', 'http://localhost:8083/hospital','https://www.svgrepo.com/show/500071/hospital.svg');
    loadFeatureGroupData('biciclette', 'http://localhost:8083/bycicles','https://www.svgrepo.com/show/105391/bycicle.svg');
    loadFeatureGroupData('teatri_Cinema', 'http://localhost:8083/cinemaTeathers','https://www.svgrepo.com/show/418375/cinema-dessert-fastfood.svg');
    loadFeatureGroupData('ludico', 'http://localhost:8083/ludic','https://www.svgrepo.com/show/475275/star.svg');
    loadFeatureGroupData('colonnine_Elettriche', 'http://localhost:8083/electric','https://www.svgrepo.com/show/396360/electric-plug.svg');
    loadFeatureGroupData('fermate_Bus', 'http://localhost:8083/bus','https://www.svgrepo.com/show/500067/bus-stop.svg');
    

    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    });
  
    var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'});
  

    var baseMaps = {
        "OpenStreetMap": osm,
        "OpenStreetMap.HOT": osmHOT
    };

    L.control.layers(baseMaps, layerGroups).addTo(mapRef.current!);

   
    
    

    return () => {
      mapRef.current?.remove();
    };
  }, [center, circleLayer, polyLayer]);

  let loadFeatureGroupData = (key: string, url: string,urlMarkericon:string) => {
    L.control.layers().addOverlay(layerGroups[key],key)
    axios.get(url)
      .then((response) => {
        response.data.forEach((item: { st_asgeojson: string }) => {
          const geojson = JSON.parse(item.st_asgeojson);
          const markerIcon = L.icon({
            // iconUrl: `https://www.svgrepo.com/show/398258/school.svg`,
            iconUrl: urlMarkericon,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon }).addTo(layerGroups[key])
          
        });
       
      })
      .catch((error) => {
        console.error(`Errore durante il recupero dei dati delle ${key}:`, error);
      });
  };

  // const getRandomColor = () => {
  //   const letters = '0123456789ABCDEF';
  //   let color = '#';
  //   for (let i = 0; i < 6; i++) {
  //     color += letters[Math.floor(Math.random() * 16)];
  //   }
  //   return color;
  // };


  return (
    <div style={{ display: 'flex' }}>
      <div id="map" style={{ height: '100vw', width: '70vw' }} />
      <div style={{ marginLeft: '20px' }}>
        <h3>Survey Data</h3>
        <ul>
          {surveyData.map((response, index) => (
            <li key={index}>
              Question {index + 1}: {response}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Map;
