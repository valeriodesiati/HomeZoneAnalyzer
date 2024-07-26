import React, { useEffect, useRef, useState } from 'react';
import L, { latLng } from 'leaflet';
import 'leaflet-draw';
import 'leaflet.markercluster';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import axios from 'axios';
import * as d3Scale from 'd3-scale';
import * as d3Interpolate from 'd3-interpolate';
import LoadingOverlay from './LoadingOverlay'; // Import the LoadingOverlay component
import mapboxgl from 'mapbox-gl';
mapboxgl.accessToken = 'pk.eyJ1IjoiZXNzZWVlZWVlZWVlZWVlZSIsImEiOiJjbHR0dDRpd2QwY2lwMnBvdThqNTlud2xxIn0.JKesOWYFKHZP3y_T2TLVUw';



interface MapProps {
  surveyData: Map<string, number>;
}


//marker per isochrone API


const Map: React.FC<MapProps> = ({ surveyData }) => {
  const mapRef = useRef<L.Map | null>(null);
  const [center] = useState<[number, number]>([44.494887, 11.3426]);
  const [bestQuartiere, setBestQuartiere] = useState<string>('');
  const clusterQuartieri = useRef<L.MarkerClusterGroup | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup<any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isQuartieriLoaded, setIsQuartieriLoaded] = useState<boolean>(false);
  const [isApartmentsLoaded, setIsApartmentsLoaded] = useState<boolean>(false);
  
  //struttura
  let poiMap: { [key: string]: L.LayerGroup } = {
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
    fermate_Bus: L.layerGroup(),
  };

  let isochroneMarker = new L.Marker(latLng(44.494887,11.3426163),{draggable:true})
  
  
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
    mapRef.current.addLayer(isochroneMarker)
    mapRef.current.addLayer(drawnItemsRef.current);

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItemsRef.current,
      },
    });

    drawControl.setDrawingOptions({
      polyline: false,
      circlemarker: false,
      rectangle: false,
      marker: false,
    });

    mapRef.current.addControl(drawControl);

    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    });

    const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France',
    });

    const baseMaps = {
      "OpenStreetMap": osm,
      "OpenStreetMap.HOT": osmHOT,
    };

    clusterQuartieri.current = new L.MarkerClusterGroup();
    const overlayMaps = {
      "Appartamenti": clusterQuartieri.current,
      ...poiMap
    };

    L.control.layers(baseMaps, overlayMaps).addTo(mapRef.current!);

    mapRef.current.addLayer(clusterQuartieri.current);

    return () => {
      mapRef.current?.remove();
    };
  }, [center]);

  useEffect(() => {
    // Fetch and display neighbourhood data
    if (!isQuartieriLoaded) {
      setLoading(true);
      axios.get('http://localhost:8083/quartieri')
        .then((quartieri) => {
          const minScore = Math.min(...quartieri.data.map((item: any) => item.score));
          const maxScore = Math.max(...quartieri.data.map((item: any) => item.score));
          setBestQuartiere(quartieri.data[0].nome);

          quartieri.data.forEach((item: { nome: string, quartiere_id: number, geom: string, score: number }) => {
            const geojson = JSON.parse(item.geom);
            const color = getNeighbourhoodScale(item.score, minScore, maxScore);

            const geojsonLayer = L.geoJSON(geojson, {
              style: {
                color: color,
                weight: 2,
              },
              onEachFeature: function (_feature, layer) {
                layer.bindPopup(`<b>Quartiere:</b> ${item.nome}`);
              },
            });
            geojsonLayer.addTo(drawnItemsRef.current!);
          });

          setIsQuartieriLoaded(true);
          if (isApartmentsLoaded) setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching neighbourhood data:', error);
          setLoading(false);
        });

        
    }
  }, [isQuartieriLoaded, isApartmentsLoaded]);

  useEffect(() => {
    // Fetch and display apartment data
    if (!isApartmentsLoaded && isQuartieriLoaded) {
      axios.get('http://localhost:8083/apartments')
        .then((apartments) => {
          const minScore = Math.min(...apartments.data.map((item: any) => item.score));
          const maxScore = Math.max(...apartments.data.map((item: any) => item.score));

          apartments.data.forEach((item: { geometry: string, prezzo: string, score: number, code: number }) => {
            const geojson = JSON.parse(item.geometry);
            const color = getApartmentColorScale(item.score, minScore, maxScore);

            const markerIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color:${color}; width: 25px; height: 25px; border-radius: 50%; border: 2px solid #FFFFFF;"></div>`,
              iconSize: [30, 42],
              iconAnchor: [15, 42],
              popupAnchor: [1, -34],
            });

            L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon })
              .bindPopup(`Prezzo: ${item.prezzo}<br>Score: ${item.score}`)
              .addTo(clusterQuartieri.current!);
          });
          clusterQuartieri.current!.addTo(drawnItemsRef.current!);

          setIsApartmentsLoaded(true);
          if (isQuartieriLoaded) setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching apartment data:', error);
          setLoading(false);
        });
    }
  }, [isApartmentsLoaded, isQuartieriLoaded]);

  useEffect(() => {
    axios.post('http://localhost:8083/', Object.fromEntries(surveyData));
    let transportMode='cycling'
    let travelTime = 10
    
    axios.get(`https://api.mapbox.com/isochrone/v1/mapbox/${transportMode}/${isochroneMarker.getLatLng().lng},${isochroneMarker.getLatLng().lat}?contours_minutes=${travelTime}&polygons=true&access_token=${mapboxgl.accessToken}`)
    .then((response)=>{
      let geom = response.data.features[0].geometry
      
      L.geoJSON(geom,{style: {
              color: '#ff0000',
              weight: 0.5,
              fillOpacity: 0.5,
              opacity:1

              
      }}).addTo(drawnItemsRef.current!)
      });

     
      // response.data.features.forEach((item: { geometry: string }) => {
      //   console.log(item.geometry);
        
      //   let geojson = JSON.parse(item.geometry);
      //   const geojsonLayer = L.geoJSON(geojson, {
      //     style: {
      //       color: '#f0f0f0',
      //       weight: 2,
      //     }
      //   })
      //   geojsonLayer.addTo(drawnItemsRef.current!);
      // });
      
        // onEachFeature: function (_feature, layer) {
        //   layer.bindPopup(`<b>Quartiere:</b> ${item.nome}`);
        // },
      
     
    
  }, [surveyData]);


  

  const loadFeatureGroupData = (key: string, url: string, urlMarkericon: string) => {
    axios.get(url)
      .then((response) => {
        response.data.forEach((item: { st_asgeojson: string, nome: string, quartiere: string }) => {
          let geojson = JSON.parse(item.st_asgeojson);
          
          const markerIcon = L.icon({
            iconUrl: urlMarkericon,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon }).addTo(poiMap[key]);
        });
      })
      .catch((error) => {
        console.error(`Error fetching data for ${key}:`, error);
      });
  };

  const loadPoI = () => {
    loadFeatureGroupData('aree_verdi', 'http://localhost:8083/aree_verdi', 'https://www.svgrepo.com/show/500085/tree.svg');
    loadFeatureGroupData('scuole', 'http://localhost:8083/scuole', 'https://www.svgrepo.com/show/398258/school.svg');
    loadFeatureGroupData('sport', 'http://localhost:8083/sport', 'https://www.svgrepo.com/show/397373/sports.svg');
    loadFeatureGroupData('farmacie', 'http://localhost:8083/farmacie', 'https://www.svgrepo.com/show/475523/pharmacy.svg');
    loadFeatureGroupData('biblioteche', 'http://localhost:8083/biblioteche', 'https://www.svgrepo.com/show/475151/book.svg');
    loadFeatureGroupData('ospedali', 'http://localhost:8083/ospedali', 'https://www.svgrepo.com/show/500071/hospital.svg');
    loadFeatureGroupData('biciclette', 'http://localhost:8083/biciclette', 'https://www.svgrepo.com/show/105391/bycicle.svg');
    loadFeatureGroupData('teatri_Cinema', 'http://localhost:8083/teatri_Cinema', 'https://www.svgrepo.com/show/418375/cinema-dessert-fastfood.svg');
    loadFeatureGroupData('ludico', 'http://localhost:8083/ludico', 'https://www.svgrepo.com/show/475275/star.svg');
    loadFeatureGroupData('colonnine_Elettriche', 'http://localhost:8083/colonnine_Elettriche', 'https://www.svgrepo.com/show/396360/electric-plug.svg');
    loadFeatureGroupData('fermate_Bus', 'http://localhost:8083/fermate_Bus', 'https://www.svgrepo.com/show/500067/bus-stop.svg');
  };

  useEffect(() => {
    loadPoI();
  }, []);

  const ApartmentColorScale = d3Scale.scaleLinear<string>()
    .domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    .range(['#00FF00', '#FFFF00', '#FFA500', '#FF0000'])
    .interpolate(d3Interpolate.interpolateRgb);

  const NeighbourhoodColorScale = d3Scale.scaleLinear<string>()
    .domain([0, 0.2, 0.4, 0.6, 0.8, 1])
    .range(['#00ff00', '#ccff00', '#ffff00', '#ff9900', '#ff6600', '#ff0000'])
    .interpolate(d3Interpolate.interpolateRgb);

  const getApartmentColorScale = (score: number, minScore: number, maxScore: number) => {
    if (maxScore === minScore) return ApartmentColorScale(0);
    const normalizedScore = (score - minScore) / (maxScore - minScore);
    return ApartmentColorScale(normalizedScore);
  };

  const getNeighbourhoodScale = (score: number, minScore: number, maxScore: number) => {
    if (maxScore === minScore) return NeighbourhoodColorScale(0);
    const normalizedScore = (score - minScore) / (maxScore - minScore);
    return NeighbourhoodColorScale(normalizedScore);
  };
  
  return (
    <div style={{ display: 'flex' }}>
      {loading && <LoadingOverlay />} {/* Use LoadingOverlay component */}
      <div id="map" style={{ height: '100vh', width: '70vw' }} />
      <div style={{ marginLeft: '20px' }}>
        <h3>Survey Data</h3>
        <ul>
          {[...surveyData.entries()].map(([poi, response], index) => (
            <li key={index}>
              {poi}: {response}
            </li>
          ))}
        </ul>
        {bestQuartiere && <h2 style={{ color: '#2AFF00' }}>Miglior Quartiere: {bestQuartiere}</h2>}
      </div>
    </div>
  );
};

export default Map;
