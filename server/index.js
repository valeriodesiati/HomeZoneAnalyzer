import express from 'express';
const app = express();
import cors from 'cors';
import pg from 'pg'



app.use(cors())

app.use(express.json()
)
var client = new pg.Client({
	user: 'postgres',
	password: 'postgres',
  //ricorda di mettere postgis quando dovrai dockerizzare l'app
	host: 'localhost',
	port: '5432',
	database: 'sca',
})

client.connect().then(() => {
		console.log('Connected to PostgreSQL database');
       
	})
	.catch((err) => {
		console.error('Error connecting to PostgreSQL database\n', err);
	});

app.listen(8083, () => {
      console.log('server listening on port 8083')
})

app.post('',  (req, res) => {
	
	var radius = req.body.r; // Assuming this is in meters
	var lat = req.body.geojson.geometry.coordinates[1];
	var lon = req.body.geojson.geometry.coordinates[0];

	let query = `WITH circle_geom AS (
	SELECT ST_Buffer(ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, ${radius})::geometry AS geom
	)
	SELECT ST_AsGeoJSON(es.geometry::geometry)
	FROM circle_geom AS cg, public."elenco-scuole" AS es 
	WHERE ST_Contains(cg.geom, es.geometry::geometry)`;

    try {
        client.query(query, (error, results) => {
      if (error) {
        console.error('Errore durante l\'esecuzione della query:', error);
      } else {
        console.log("query effettutata con successo");
        res.send(results.rows)
      }
    });
    } catch (err) {
        console.error('Errore durante il confronto delle geometrie:', err);
        res.status(500).json({ error: 'Errore durante il confronto delle geometrie' });
    }
});

// app.get('/g', (req, res) => {
//       let query='select lat,lon from countryschema.countries'
//       client.query(query, (error, results) => {
//           if (error) {
//             console.error('Errore durante l\'esecuzione della query:', error);
//           } else {
//             console.log("query effettutata con successo");
//             res.send(results.rows)
//           }
//         });
// })

// app.get('/', (req, res) => { 
//   let query='select  ST_AsGeoJSON(geom) from countryschema.countries'
//   client.query(query, (error, results) => {
//       if (error) {
//         console.error('Errore durante l\'esecuzione della query:', error);
//       } else {
//         console.log("query effettutata con successo");
        
//         res.send(results.rows)
//       }
//     });
// })