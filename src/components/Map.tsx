import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-routing-machine';
import * as d3Scale from 'd3-scale';
import * as d3Interpolate from 'd3-interpolate'  ;
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

    axios.get('http://localhost:8083/quartieri')
  .then((response) => {
    console.log(response.data);
    response.data.forEach((item:{st_asgeojson:string,quartiere:string}) => {
      const geojson = JSON.parse(item.st_asgeojson);

      // Crea il layer GeoJSON con stile e popup
      const geojsonLayer = L.geoJSON(geojson, {
        style: {
          color: getRandomColor(),
          weight: 2
        },
        onEachFeature: function (_feature, layer) {
          layer.bindPopup(`<b>Quartiere:</b> ${item.quartiere}`);
        }
      });

      // Aggiungi il layer alla mappa
      geojsonLayer.addTo(drawnItemsRef.current!);
    });
  })
  .catch((error) => {
    console.error('Errore durante il recupero dei dati delle geofence:', error);
  });

    return () => {
      mapRef.current?.remove();
    };

    
  }, [center]);

  // Load Points of Interest (PoI) on the map
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

  

  // Function to fetch PoI data from the DB
  let loadFeatureGroupData = (key: string, url: string, urlMarkericon: string) => {
    // Create overlay for checkbox menu for a PoI item
    L.control.layers().addOverlay(layerGroups[key], key);
    // Get request
    axios.get(url)
      // Execute a series of operations on received data
      .then((response) => {
        // Iterate through the response array from the database
        response.data.forEach((item: { st_asgeojson: string, nome: string, quartiere: string }) => {
          // Parse each item of the response in geojson format
          let geojson = JSON.parse(item.st_asgeojson);
        
          // Create marker with appropriate icon
          const markerIcon = L.icon({
            iconUrl: urlMarkericon,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          // Create marker and add to the layer 
          L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon }).addTo(layerGroups[key]);
        });
      })
      // Handle error if data fetching fails
      .catch((error) => {
        console.error(`Errore durante il recupero dei dati delle ${key}:`, error);
      });

    

    // Function to interpolate color using d3-scale and d3-interpolate
    const colorScale = d3Scale.scaleLinear<string>()
    .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    .range(['#00ff00', '#66ff00', '#ccff00', '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ff0000', '#cc0000', '#990000'])
    .interpolate(d3Interpolate.interpolateRgb); // Use interpolateRgbBasis for smooth color interpolation

    // Function to calculate color based on score
    const getColorForScore = (score: number, minScore: number, maxScore: number) => {
      if (maxScore === minScore) 
          return colorScale(0); // Handle edge case where maxScore equals minScore
      let normalizedScore = (score - minScore) / (maxScore - minScore);
      return colorScale(normalizedScore);
    };

  


    // Fetch apartments data and create markers with colors
    axios.get('http://localhost:8083/apartments')
      .then((apartments) => {
        const minScore = Math.min(...apartments.data.map((item: any) => item.score));
        const maxScore = Math.max(...apartments.data.map((item: any) => item.score));

        apartments.data.forEach((item: { geometry: string, prezzo: string, score: number }) => {
          const geojson = JSON.parse(item.geometry);
          const color = getColorForScore(item.score, minScore, maxScore);

          const markerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:${color}; width: 25px; height: 25px; border-radius: 50%; border: 2px solid #FFFFFF;"></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [1, -34],
          });

          L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon })
            .bindPopup(`Prezzo: ${item.prezzo}<br>Score: ${item.score}`)
            .addTo(drawnItemsRef.current!);
        });
      })
      .catch((error) => {
        console.error('Errore durante il recupero dei dati delle geofence:', error);
      });
  };

  // Function to generate a random hexadecimal color
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  axios.post('http://localhost:8083/', Object.fromEntries(surveyData))
  .then((response) => {
    console.log('Survey data sent successfully:', response.data);
  })
  .catch((error) => {
    console.error('Error sending survey data:', error);
  });


  // Return map component with survey data from previous survey
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
