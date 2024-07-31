import express from 'express';
const app = express();
import cors from 'cors';
import pg from 'pg'
import {GET_APARTMENTS_QUERY,GET_NEIGHBOURHOOD_RANKING} from '../src/assets/queryRanking.js'


//allow CORS-policy
app.use(cors())

//json parser enabling
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

//db connection
client.connect().then(() => {
		console.log('Connected to PostgreSQL database');
       
	})
	.catch((err) => {
		console.error('Error connecting to PostgreSQL database\n', err);
	});

//server port listinening
app.listen(8083, () => {
      console.log('server listening on port 8083')
})





//end point voti sondaggio
app.post('/', (req, res) => {
	client.query('truncate table user_votes');
    Object.entries(req.body).forEach(([key, value]) => {
        // Sanitize and validate 'key' and 'value' if necessary
		
        // Use parameterized query to prevent SQL Injection
        client.query('INSERT INTO user_votes (poi_type, vote) VALUES ($1, $2)', [key, parseInt(value, 10)], (error, results) => {
            if (error) {
                console.error('Errore Inserimento voto sondaggio:', error);
                res.status(500).send('Errore durante l\'inserimento del voto');
            } else {
                console.log("Record voto inserito con successo");
                // Not recommended: res.send(results.rows);
            }
        });

        console.log([key, value]);
    });

    res.send('INSERIMENTO VOTI COMPLETATO CON SUCCESSO');
});


//end point appartamenti
app.get('/apartments',(req,res)=>{
	client.query(GET_APARTMENTS_QUERY,(error,results)=>{
		if (error) {
            console.error('Errore durante l\'esecuzione della query:', error);
          } else {
            console.log("query appartamenti effettutata con successo");
            res.send(results.rows)
          }
	});


})

//end point scuole
app.get('/scuole', (req, res) => {
      let query=`SELECT ST_AsGeoJSON(es.geometry::geometry),es.quartiere,es.nome
      			 FROM schools es;`

      client.query(query, (error, results) => {
          if (error) {
            console.error('Errore durante l\'esecuzione della query:', error);
          } else {
            console.log("query scuole effettutata con successo");
            res.send(results.rows)
          }
        });
})

//end point sport
app.get('/sport', (req, res) => {
	let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
				 FROM sports_areas es;`
			   
	client.query(query, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query impianti sportivi effettutata con successo");
		  res.send(results.rows)
		}
	  });
})



//end point farmacie
app.get('/farmacie', (req, res) => {
	let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
				 FROM pharmacies es;`

	client.query(query, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query farmacie effettutata");
		  res.send(results.rows)
		}
	  });
})

//end point biciclette
app.get('/biciclette', (req, res) => {
  let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
			   FROM bike_racks es;`
			 
  client.query(query, (error, results) => {
	  if (error) {
		console.error('Errore durante l\'esecuzione della query:', error);
	  } else {
		console.log("query rastrelliere biciclette effettutata");
		res.send(results.rows)
	  }
	});
})


//end point aree verdi
app.get('/aree_verdi', (req, res) => {
	let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
				 FROM green_areas es;`

	client.query(query, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query aree verdi effettutata con successo");
		  res.send(results.rows)
		}
	  });
})

//end point ospedali
app.get('/ospedali', (req, res) => {
	let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
				 FROM hospitals es;`

	client.query(query, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query ospedali effettuata");
		  res.send(results.rows)
		}
	  });
})

//end point biblioteche
app.get('/biblioteche', (req, res) => {
  let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
			   FROM libraries es;`
			 
  client.query(query, (error, results) => {
	  if (error) {
		console.error('Errore durante l\'esecuzione della query:', error);
	  } else {
		console.log("query librerie effettutata");
		res.send(results.rows)
	  }
	});
})

//end point colonnine elettriche
app.get('/colonnine_Elettriche', (req, res) => {
	let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
				 FROM electric_stations es;`
			   
	client.query(query, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query colonnine elettriche effettuata");
		  res.send(results.rows)
		}
	  });
  })

  //end point teatri e cinema
  app.get('/teatri_Cinema', (req, res) => {
	let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
				 FROM theaters es;`
			   
	client.query(query, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query cinema e teatri");
		  res.send(results.rows)
		}
	  });
  })

  //end point zone ludiche
  app.get('/ludico', (req, res) => {
	let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
				 FROM ludics es;`
			   
	client.query(query, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query impianti luidici effettutata");
		  res.send(results.rows)
		}
	  });
  })
  //end point fermate bus
  app.get('/fermate_Bus', (req, res) => {
	let query=`SELECT ST_AsGeoJSON(es.geometry::geometry)
				 FROM bus_stops es`
			   
	client.query(query, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query bus effettuata");
		  res.send(results.rows)
		}
	  });
  })
  
  
//end point dei quartieri
app.get('/quartieri',(req,res) =>{
	client.query(GET_NEIGHBOURHOOD_RANKING, (error, results) => {
		if (error) {
		  console.error('Errore durante l\'esecuzione della query:', error);
		} else {
		  console.log("query quartieri effettuata");
		  res.send(results.rows)
		}
	  });
})





//post request for the send polygon area 
app.post('/shape/polygon',  (req, res) => {
	//ricavo dati inviati da utente(geojson del poligono)
    let geojson = req.body; 
	//query per trovare appartamenti interni al poligono
	let query= `
      SELECT ST_AsGeoJSON(es.geometry::geometry)
      FROM apartments es
      WHERE ST_Contains(
        ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(geojson.geometry)}'), 4326),
        es.geometry::geometry
      );
    `;
	try {
		//query execution
        client.query(query, (error, results) => {
		if (error) {
			console.error('Errore durante l\'esecuzione della query:', error);
		} else {
			console.log("query effettutata con successo");
			res.send(results.rows)
		}
	  });
	}
	catch (err) {
		console.error('Errore durante il confronto delle geometrie:', err);
		res.status(500).json({ error: 'Errore durante il confronto delle geometrie' });
	}
});




