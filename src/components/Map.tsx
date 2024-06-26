import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';
import axios from 'axios';

interface MapProps {
  surveyData: number[];
}

const Map: React.FC<MapProps> = ({ surveyData }) => {
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup<any> | null>(null);
  const [center, setCenter] = useState<[number, number]>([44.494887, 11.3426]);

  useEffect(() => {
    setCenter([44.494887, 11.3426]);
    mapRef.current = L.map('map', {
      center,
      zoom: 13,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ]
    });

    drawnItemsRef.current = new L.FeatureGroup();
    mapRef.current.addLayer(drawnItemsRef.current);

    const drawControl = new L.Control.Draw();
    mapRef.current.addControl(drawControl);

    mapRef.current.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;
      drawnItemsRef.current?.addLayer(layer);

      if (layer instanceof L.Marker) {
        const { lat, lng } = layer.getLatLng();
        const point1 = turf.point([lng, lat]);
        const point2 = turf.point([center[1], center[0]]);
        const distance = turf.distance(point1, point2, { units: 'kilometers' });
        layer.bindPopup(`Distanza dal centro: ${distance.toFixed(2)} km`).openPopup();

        const randomColor = getRandomColor();
        const line = turf.lineString([[center[1], center[0]], [lng, lat]]);
        L.geoJSON(line, {
          style: {
            color: randomColor,
            weight: 2
          }
        }).addTo(mapRef.current!);
      }
    });

    fetch('https://raw.githubusercontent.com/simorina/bolognaGEO/main/file.geojson')
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data, {
          style: (feature) => {
            const fillColor = feature?.properties?.fill || 'red';
            const color = feature?.properties?.color || 'black';
            return {
              fillColor,
              color,
              weight: 2,
              fillOpacity: 0.5
            };
          }
        }).addTo(mapRef.current!);
      });

    axios.get('http://localhost:8083/g')
      .then((response) => {
        response.data.forEach((item: { lat: number; lon: number; }) => {
          const marker = L.marker([item.lat, item.lon]).addTo(mapRef.current!);
          const point1 = turf.point([item.lon, item.lat]);
          const point2 = turf.point([center[1], center[0]]);
          const distance = turf.distance(point1, point2, { units: 'kilometers' });

          marker.bindPopup(`Distanza dal centro: ${distance.toFixed(2)} km`).openPopup();

          const randomColor = getRandomColor();
          const line = turf.lineString([[center[1], center[0]], [item.lon, item.lat]]);
          L.geoJSON(line, {
            style: {
              color: randomColor,
              weight: 2
            }
          }).addTo(mapRef.current!);
        });
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });

    axios.get('http://localhost:8083')
      .then((response) => {
        response.data.forEach((item: { st_asgeojson: string }) => {
          const geojson = JSON.parse(item.st_asgeojson);
          L.geoJSON(geojson, {
            style: {
              color: getRandomColor(),
              weight: 2
            }
          }).addTo(mapRef.current!);
        });
      })
      .catch((error) => {
        console.error('Errore durante il recupero dei dati delle geofence:', error);
      });

    const marker1 = L.marker(center).addTo(mapRef.current!);
    const marker2 = L.marker([44.500456, 11.346367]).addTo(mapRef.current!);
    const point1 = turf.point([marker1.getLatLng().lng, marker1.getLatLng().lat]);
    const point2 = turf.point([marker2.getLatLng().lng, marker2.getLatLng().lat]);
    const distance = turf.distance(point1, point2, { units: 'kilometers' });

    marker2.bindPopup(`Distanza da punto 1: ${distance.toFixed(2)} km`);
    const line = turf.lineString([[marker1.getLatLng().lng, marker1.getLatLng().lat], [marker2.getLatLng().lng, marker2.getLatLng().lat]]);
    L.geoJSON(line, {
      style: {
        color: 'red',
        weight: 2
      }
    }).addTo(mapRef.current!);

    return () => {
      mapRef.current?.remove();
    };
  }, [center]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <div>
      <div id="map" style={{ height: '500px', width: '100vh' }} />
      <div>
        <h3>Survey Data</h3>
        <ul>
          {surveyData.map((response, index) => (
            <li key={index}>Question {index + 1}: {response}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Map;
