import express from 'express';
const app = express();
import cors from 'cors';
import pg from 'pg'



app.use(cors())


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

app.get('/g', (req, res) => {
      let query='select lat,lon from countryschema.countries'
      client.query(query, (error, results) => {
          if (error) {
            console.error('Errore durante l\'esecuzione della query:', error);
          } else {
            console.log("query effettutata con successo");
            res.send(results.rows)
          }
        });
})

app.get('/', (req, res) => { 
  let query='select  ST_AsGeoJSON(geom) from countryschema.countries'
  client.query(query, (error, results) => {
      if (error) {
        console.error('Errore durante l\'esecuzione della query:', error);
      } else {
        console.log("query effettutata con successo");
        
        res.send(results.rows)
      }
    });
})



app.listen(8083, () => {
      console.log('server listening on port 8083')
})