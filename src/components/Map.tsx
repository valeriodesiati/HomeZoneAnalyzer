import React, { useEffect, useRef, useState } from 'react';
// import della libreria leaflet
import L, { latLng } from 'leaflet';
// import plugin per disegnare 
import 'leaflet-draw';
// import plugin per clusterizzare
import 'leaflet.markercluster';
// file css di leaflet
import 'leaflet/dist/leaflet.css';
// file di stile per il modulo per disegnare
import 'leaflet-draw/dist/leaflet.draw.css';
// file di stile della mappa
import '../css/Map.css'
// stile per i marker
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// javascript per il marker
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
// import di axios per chiamate GET e POST
import axios from 'axios';
// import d3scale per la creazione di una scala di colori
import * as d3Scale from 'd3-scale';
// modulo per interpolazione correlata alla scala di colori
import * as d3Interpolate from 'd3-interpolate';
// componente react per la schermata di caricamento
import LoadingOverlay from './LoadingOverlay'; 
// import di mapbox
import mapboxgl from 'mapbox-gl';

import { PYTHON_URL, JS_URL } from '../prova.js'

// Carica il file .env
require('dotenv').config();

// Utilizza le variabili d'ambiente
const mapboxToken = process.env.MAPBOX_TOKEN;

// token di mapbox
mapboxgl.accessToken = mapboxToken;

// props per passare la mappa da Survey a Map
interface MapProps {
  surveyData: Map<string, number>;
}
//interfaccia per i dati di calcolo dell'indice I di Moran
interface MoranData {
  moran_I: number;
  p_value: number;
  z_score: number;
}


// marker per isochrone API
const Map: React.FC<MapProps> = ({ surveyData }) => {

  // mappa geografica da renderizzare
  const mapRef = useRef<L.Map | null>(null);
  // coordinate centro di Bologna
  const [center] = useState<[number, number]>([44.494887, 11.3426]);
  // variabile del miglior quartiere
  const [bestQuartiere, setBestQuartiere] = useState<string>('');
  // variabile per il cluster degli appartamenti 
  const clusterAppartamenti = useRef<L.MarkerClusterGroup | null>(null);
  // variabile per tenere traccia di alcuni elementi di da renderizzare su mappa
  const drawnItemsRef = useRef<L.FeatureGroup<any> | null>(null);
  // variabile che tiene tracci dell'area raggiungibile dalla libreria ISOCHRONE secondo un certo tempo e modalità di spostamento
  const isochroneAreasRef = useRef<L.FeatureGroup<any> | null>(null);
  // variabile che tiene conto degli appartamenti trovati col tracciamento di un poligono
  const featureGroup = useRef<L.FeatureGroup<any> | null>(null);
   // variabile che tiene conto dei quartieri 
  const neighbourhoodGroup = useRef<L.FeatureGroup<any> | null>(null);
  // variabile per controllare il caricamento degli elementi
  const [loading, setLoading] = useState<boolean>(true);
  // variabile che tiene traccia del caricamento dei quartieri
  const [isQuartieriLoaded, setIsQuartieriLoaded] = useState<boolean>(false);
  // variabile che tiene traccia degli appartamenti
  const [isApartmentsLoaded, setIsApartmentsLoaded] = useState<boolean>(false);
  // variabile che tiene traccia del tempo in minuti dell'area raggiungibile da ISOCHRONE API
  const [travelTime, setTravelTime] = useState<number>(5);
  // variabile che tiene traccia della modalità di ISOCHRONE API
  const [transportMode, setTransportMode] = useState<string>('walking');
  // variabile che tiene conto del marker di ISOCHRONE API
  const [isochronePosition, setIsochronePosition] = useState<L.LatLng>(latLng(44.494887, 11.3426163));
  // variabile che tiene conto degli indici di Morans
  const [moransData, setMoransData] = useState<MoranData>();



  
  
  // struttura a mappa dei punti di interesse
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

  

  
  // marker ISOCHRONE
  let isochroneMarker = new L.Marker(isochronePosition, { draggable: true });
  //area copribile 
  let areaIsochroneLayer = new L.FeatureGroup();


  
  
  // funzione per aggiornare il tempo per ISOCHRONE API 
  function updateTravelTime(event: React.ChangeEvent<HTMLSelectElement>) {
    mapRef.current?.removeLayer(areaIsochroneLayer)
    setTravelTime(Number(event.target.value));
    
  }
  // funzione per aggiornare la modalità di spostamento di ISOCHRONE API
  function updateTravelMode(event: React.ChangeEvent<HTMLSelectElement>) {
    mapRef.current?.removeLayer(areaIsochroneLayer)
    areaIsochroneLayer.eachLayer(e=>e.remove())
    setTransportMode(event.target.value);
    
  }


 

  useEffect(() => {
    // inizializzazione mappa
    mapRef.current = L.map('map', {
      center,
      zoom: 13,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }),
      ],
    });


    // inzializzazione della geature group che tiene traccia di alcuni elementi renderizzabili
    drawnItemsRef.current = new L.FeatureGroup();

    // inizializzazione Feature group che tiene traccia dell'area raggiungibile secondo ISOCHRONE API
    isochroneAreasRef.current = new L.FeatureGroup()
    featureGroup.current = new L.FeatureGroup()
    neighbourhoodGroup.current = new L.FeatureGroup()
    // aggiunta dei layer alla mappa
    mapRef.current.addLayer(isochroneMarker);
    mapRef.current.addLayer(drawnItemsRef.current);
    mapRef.current.addLayer(isochroneAreasRef.current)
    mapRef.current.addLayer(neighbourhoodGroup.current)
  
    // inzializzazione menù di disegno
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: featureGroup.current,
        edit: false,
        remove: true
      },
    });

    // setting menù di disegno
    drawControl.setDrawingOptions({
      polyline: false,
      circlemarker: false,
      rectangle: false,
      marker: false,
      circle:false

    });

    // aggiunta del menù da disegno  su mappa
    mapRef.current.addControl(drawControl);

    //listener che permette di eliminare il poligono di area di ricerca di appartamenti
    mapRef.current.on(L.Draw.Event.DELETESTART,function() {
      featureGroup.current?.clearLayers()
    });


    //gestione eventi di disegno
    mapRef.current.on(L.Draw.Event.CREATED, async (event) => {
      featureGroup.current?.clearLayers();
      featureGroup.current?.addLayer(event.layer)
      //gestione evento quando disegno un poligono
      if(event.layer instanceof L.Polygon){
        axios
          //invio del poligono al server per l'eleaborazione
          .post(JS_URL + '/shape/polygon', event.layer.toGeoJSON())
          .then((response) => {
            response.data.forEach((item: { st_asgeojson: string,prezzo:number,quartiere:string,indirizzo:string }) => {
              let geojson = JSON.parse(item.st_asgeojson);
              const markerIcon = L.icon({
                iconUrl: `https://www.svgrepo.com/show/187213/apartment.svg`,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              });
              featureGroup
                .current!
                  .addLayer(L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon })
                    .bindPopup(`Prezzo: ${item.prezzo}<br>Quartiere: ${item.quartiere}<br>Indirizzo:   ${item.indirizzo}`));
            });
          })
          .catch((error) => {
            console.error('Error sending geometry to server:', error);
          });

        drawnItemsRef.current?.addLayer(featureGroup.current!);
      }
      
    })
  

    // creazione di un tile layer
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    });
    // creazione di un tile layer
    const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France',
    });

    // oggetto baseMaps
    const baseMaps = {
      "OpenStreetMap": osm,
      "OpenStreetMap.HOT": osmHOT,
    };

    // inzializzazione cluster di marker di appartamenti
    clusterAppartamenti.current = new L.MarkerClusterGroup();
    // creazione del layer di overlay
    const overlayMaps = {
      "Appartamenti": clusterAppartamenti.current,
      ...poiMap,
      "Area Isochrone": isochroneAreasRef.current,
      "Quartieri": neighbourhoodGroup.current
    };
    //aggiunta dell'overlay alla mappa
    L.control.layers(baseMaps, overlayMaps).addTo(mapRef.current!);
    //aggiunta del cluster appartamenti alla mappa
    mapRef.current.addLayer(clusterAppartamenti.current);

    return () => {
      mapRef.current?.remove();
    };
  }, [center]);



  //hook per caricamento dei quartieri
  useEffect(() => {
    // controllo se i quartieri sono stati caricati
    if (!isQuartieriLoaded) {
      setLoading(true);

      //chiamata get per recuperare i quartieri
      axios.get(JS_URL + '/quartieri')
        .then((quartieri) => {
          //punteggio minimo
          const minScore = Math.min(...quartieri.data.map((item: any) => item.score));
          //punteggio massimo
          const maxScore = Math.max(...quartieri.data.map((item: any) => item.score));
          //selezione miglior quartiere
          setBestQuartiere(quartieri.data[0].nome);
          //creazione del poligono per ogni quartiere 
          quartieri.data.forEach((item: { nome: string, quartiere_id: number, geom: string, score: number }) => {
            //paarsing
            const geojson = JSON.parse(item.geom);
            //assegnamento colore in base al punteggio
            const color = getNeighbourhoodScale(item.score, minScore, maxScore);
            //creazione del poligono
            const geojsonLayer = L.geoJSON(geojson, {
              style: {
                color: color,
                weight: 2,
              },
              onEachFeature: function (_feature, layer) {
                layer.bindPopup(`<b>Quartiere:</b> ${item.nome}`);
              },
            });
            //aggiunta del poligono alla mappa
            geojsonLayer.addTo(neighbourhoodGroup.current!);
          });
          //quartieri caricati
          setIsQuartieriLoaded(true);
          if (isApartmentsLoaded) setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching neighbourhood data:', error);
          setLoading(false);
        });
    }
  }, [isQuartieriLoaded, isApartmentsLoaded]);

  
  
  // hook per caricamento degli appartamenti
  useEffect(() => {
    // Fcontrollo se quartieri sono stati caricati
    if (!isApartmentsLoaded && isQuartieriLoaded) {
      //chiamata get per recuperare i quartieri
      axios.get(JS_URL + '/apartments')
        .then((apartments) => {
          //punteggio minimo
          const minScore = Math.min(...apartments.data.map((item: any) => item.score));
          //punteggio massimo
          const maxScore = Math.max(...apartments.data.map((item: any) => item.score));

          apartments.data.forEach((item: { geometry: string, prezzo: string, score: number, code: number,quartiere: string, indirizzo: string }) => {
            // parsing in json della geometria
            const geojson = JSON.parse(item.geometry);
            // assegnamento colore in base al punteggio
            const color = getApartmentColorScale(item.score, minScore, maxScore);
            //creazione del marker con colore associato
            const markerIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color:${color}; width: 25px; height: 25px; border-radius: 50%; border: 2px solid #FFFFFF;"></div>`,
              iconSize: [30, 42],
              iconAnchor: [15, 42],
              popupAnchor: [1, -34],
            });
            //creazione popup
            L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon })
              .bindPopup(`Prezzo: ${item.prezzo}<br>Punteggio: ${item.score}<br>Quartiere: ${item.quartiere}<br>Indirizzo: ${item.indirizzo}`)
              .addTo(clusterAppartamenti.current!);
          });
          //aggiunta al cluster
          clusterAppartamenti.current!.addTo(drawnItemsRef.current!);
          // gli appartamenti sono stati caricati 
          setIsApartmentsLoaded(true);
          if (isQuartieriLoaded) setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching apartment data:', error);
          setLoading(false);
        });
    }
  }, [isApartmentsLoaded, isQuartieriLoaded]);

  //invio voti sondaggio
  useEffect(() => {
    axios.post(JS_URL + '/', Object.fromEntries(surveyData));
  }, [surveyData]);

  // hook per il calcolo degli indici di moran suddivisi per quartiere
  useEffect(()=>{
    axios.get( PYTHON_URL + '/calculate_morans_i')
       .then((response)=>{
        setMoransData(response.data)
       })
  },[])

  //controllo evento sul dragging del marker isochrone
  isochroneMarker.on('dragend', () => {
    setIsochronePosition(isochroneMarker.getLatLng());
  })

  //assegnamento icona svg ai amrker dell'area isochrone in base al tipo
  function getPoiType(type: string){
    let urlIcon;
    //a seconda del tipo asssegno un'icona diversa
    switch(type){

      case('school'):
        urlIcon='https://www.svgrepo.com/show/398258/school.svg'
        break

      case('pharmacy'):
        urlIcon='https://www.svgrepo.com/show/475523/pharmacy.svg'
        break

      case('hospital'):
        urlIcon='https://www.svgrepo.com/show/500071/hospital.svg'
        break

      case('ludic'):
        urlIcon='https://www.svgrepo.com/show/475275/star.svg'
        break

      case('sport'):
        urlIcon='https://www.svgrepo.com/show/475554/gym.svg'
        break

      case('theater'):
        urlIcon='https://www.svgrepo.com/show/418375/cinema-dessert-fastfood.svg'
        break

      case('library'):
        urlIcon='https://www.svgrepo.com/show/395907/books.svg'
        break

      case('green'):
        urlIcon='https://www.svgrepo.com/show/500085/tree.svg'
        break

      case('bus'):
        urlIcon='https://www.svgrepo.com/show/500067/bus-stop.svg'
        break

      case('electric_station'):
        urlIcon='https://www.svgrepo.com/show/396360/electric-plug.svg'
        break

      case('bike_rack'):
        urlIcon='https://www.svgrepo.com/show/105391/bycicle.svg'
        break

      default:
        urlIcon=''
        break
      

    }
    return urlIcon;
  }

  // hook per il rendering dell'area isochrone
  useEffect(()=>{ 
       // pulizia layer dalla vecchia area isochrone
      areaIsochroneLayer.clearLayers()
      // pulizia della variabile dei layers
      isochroneAreasRef.current?.clearLayers()
      // chiamata ad ISOCHRONE API di mapbox, restituisce un poligono
      axios.get(`https://api.mapbox.com/isochrone/v1/mapbox/${transportMode}/${isochroneMarker.getLatLng().lng},${isochroneMarker.getLatLng().lat}?contours_minutes=${travelTime}&polygons=true&access_token=${mapboxgl.accessToken}`)
           .then((response) => {
            // ottenimento poligono
            let geom = response.data.features[0].geometry;
            //invio del poligono al mio server che gestisce il fetch dei vari marker dei PoI interni ad esso
            axios.post(JS_URL + '/isochrone',geom).then((response=>{
            
              let markerIcon;
              let urlIcon='';
              response.data.forEach((item: { type: string; st_asgeojson: string; info:string }) => {
                // ottenimento dell'icona svg
                urlIcon = getPoiType(item.type);
                markerIcon = new L.Icon({
                  iconUrl: urlIcon,
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                });
                let geom = JSON.parse(item.st_asgeojson)
                L.marker([geom.coordinates[1], geom.coordinates[0]],{icon:markerIcon})
                  .addTo(areaIsochroneLayer)
                    .addTo(isochroneAreasRef.current!)
                    .bindPopup(`Info: ${item.info}`);
              
              });
            }))
           
            //cast in geojson del poligono
            L.geoJSON(geom, {
              style: {
                color: 'purple',
                weight: 0.5,
                fillOpacity: 0.5,
                opacity: 1
              }
              //aggiunta popup poi aggiunta all'oggetto che tiene traccia dell'area ISOCHRONE
            }).bindPopup(`Tempo: ${travelTime}<br>Modalità: ${transportMode}`).addTo(areaIsochroneLayer).addTo(isochroneAreasRef.current!);
      });
    },[isochronePosition,travelTime,transportMode]);
 
  
  //caricmento di ogni punto di interesse
  //  key --> parola chiave della struttura dati mappa
  //  url --> link endpoint
  //  urlMarkericon --> link icona da web
  const loadFeatureGroupData = (key: string, url: string, urlMarkericon: string) => {
    // effettuo la chiamata get
    axios.get(url)
      .then((response) => {
        //per ogni elemento ottenuto di quella categoria ciclo
        response.data.forEach((item: { st_asgeojson: string, nome: string, quartiere: string, tipologia:string }) => {
          //parsing json dell'oggetto
          let geojson = JSON.parse(item.st_asgeojson);
          //creazione marker
          const markerIcon = L.icon({
            iconUrl: urlMarkericon,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          if(item.tipologia != undefined)
            L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon }).bindPopup(`<b>tipo:</b> ${item.tipologia} <br>
              <b>nome:</b> ${item.nome}`).addTo(poiMap[key])
          else if(item.nome != undefined)
            L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon }).bindPopup(`<b>nome:</b> ${item.nome}`).addTo(poiMap[key])                                                                                                
          else//aggiunta del marker alla struttura dati mappa
            L.marker([geojson.coordinates[1], geojson.coordinates[0]], { icon: markerIcon }).addTo(poiMap[key]);
        });
      })
      .catch((error) => {
        console.error(`Error fetching data for ${key}:`, error);
      });
  };

  //funzione che effettua le chiamate per ricavare i punti di interesse suddivisi per tipologia
  const loadPoI = () => {
    loadFeatureGroupData('aree_verdi', JS_URL + '/aree_verdi', 'https://www.svgrepo.com/show/500085/tree.svg');
    loadFeatureGroupData('scuole', JS_URL + '/scuole', 'https://www.svgrepo.com/show/398258/school.svg');
    loadFeatureGroupData('sport', JS_URL + '/sport', 'https://www.svgrepo.com/show/475554/gym.svg');
    loadFeatureGroupData('farmacie', JS_URL + '/farmacie', 'https://www.svgrepo.com/show/475523/pharmacy.svg');
    loadFeatureGroupData('biblioteche', JS_URL + '/biblioteche', 'https://www.svgrepo.com/show/395907/books.svg');
    loadFeatureGroupData('ospedali', JS_URL + '/ospedali', 'https://www.svgrepo.com/show/500071/hospital.svg');
    loadFeatureGroupData('biciclette', JS_URL + '/biciclette', 'https://www.svgrepo.com/show/105391/bycicle.svg');
    loadFeatureGroupData('teatri_Cinema', JS_URL + '/teatri_Cinema', 'https://www.svgrepo.com/show/418375/cinema-dessert-fastfood.svg');
    loadFeatureGroupData('ludico', JS_URL + '/ludico', 'https://www.svgrepo.com/show/475275/star.svg');
    loadFeatureGroupData('colonnine_Elettriche', JS_URL + '/colonnine_Elettriche', 'https://www.svgrepo.com/show/396360/electric-plug.svg');
    loadFeatureGroupData('fermate_Bus', JS_URL + '/fermate_Bus', 'https://www.svgrepo.com/show/500067/bus-stop.svg');
  };

  // esecuzione del fetching dei punti di interesse
  useEffect(() => {
    loadPoI();
  }, []);

  //scala di colori interpolata degli appartamenti
  const ApartmentColorScale = d3Scale.scaleLinear<string>()
    .domain([0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1])
    .range([
      "#00FF00", // Verde
      "#33FF00", // Intermedio tra verde e giallo
      "#66FF00", // Intermedio tra verde e giallo
      "#99FF00", // Intermedio tra verde e giallo
      "#FFFF00", // Giallo
      "#FFCC00", // Intermedio tra giallo e arancione
      "#FF9900", // Intermedio tra giallo e arancione
      "#FF6600", // Intermedio tra arancione e rosso
      "#FF3300", // Intermedio tra arancione e rosso
      "#FF0000", // Rosso
      "#5F021F"  // rosso bordeaux
    ])
    .interpolate(d3Interpolate.interpolateRgb);

  // scala di colori interpolata dei quartieri
  const NeighbourhoodColorScale = d3Scale.scaleLinear<string>()
  .domain([0,0.2,0.4,0.6,0.8,1])
    .range([
      "#00FF00", // Verde
      "#66FF00", // Intermedio tra verde e giallo
      "#CCFF00", // Intermedio tra verde e giallo
      "#FF9900", // Intermedio tra giallo e arancione
      "#FF6600", // Intermedio tra arancione e rosso
      "#FF0000"  // Rosso
    ])
  .interpolate(d3Interpolate.interpolateRgb);

  // funzione per ottenere il colore dell'appartamento
  const getApartmentColorScale = (score: number, minScore: number, maxScore: number) => {
    if (maxScore === minScore) return ApartmentColorScale(0);
    const normalizedScore = (score - minScore) / (maxScore - minScore);
    return ApartmentColorScale(normalizedScore);
  };

  // funzione per ottenere il colore del quartiere
  const getNeighbourhoodScale = (score: number, minScore: number, maxScore: number) => {
    if (maxScore === minScore) return NeighbourhoodColorScale(0);
    const normalizedScore = (score - minScore) / (maxScore - minScore);
    return NeighbourhoodColorScale(normalizedScore);
  };



  //return del componenete
  return (
    <div style={{ display: 'flex' }}>
      {loading && <LoadingOverlay />} {/* Use LoadingOverlay component */}
      <div id="map" style={{ height: '100vh', width: '70vw' }} />
      <div style={{ marginLeft: '20px' }}>
        <div style={{display:'flex',flexDirection:'column',width:'100%',height:'auto',maxWidth:'100%'}}>
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
      <div>
        <label htmlFor="travelTimeSelect">Select travel time (minutes):</label>
        <select id="travelTimeSelect" value={travelTime} onChange={updateTravelTime}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
          <option value={25}>25</option>
          <option value={30}>30</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="travelModeSelect">Select travel mode:</label>
        <select id="travelModeSelect" value={transportMode} onChange={updateTravelMode}>
          <option value="walking">Walking</option>
          <option value="driving">Driving</option>
          <option value="cycling">Cycling</option>
        </select>
      </div>
      
      <h2>Risultati dell'indice di Moran</h2>
      <div className='moransContainer'>
      
          <h2>Morans'I Computation:</h2>
          <p>
            <br></br>
            Moran's I: {moransData?.moran_I}<br/>
            Statistical Significance: {moransData?.p_value}<br/>
            Spatial Causality Hypotheses: {moransData?.z_score}<br/>
          </p>
      </div>
      </div>
    </div>
  );
};

export default Map;
