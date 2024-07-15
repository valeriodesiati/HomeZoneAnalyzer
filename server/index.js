import express from 'express';
const app = express();
import cors from 'cors';
import pg from 'pg'
import {GET_APARTMENTS_QUERY} from '../src/assets/queryRanking.js'


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


// //post request to manage circle drawing area
// app.post('/shape/circle',  (req, res) => {
// 	//get radius
// 	var radius = req.body.r; // Assuming this is in meters
// 	//get latitude
// 	var lat = req.body.geojson.geometry.coordinates[1];
// 	// get longitude
// 	var lon = req.body.geojson.geometry.coordinates[0];

// 	//query to get schools coords that are inside circle area
// 	let query = `WITH circle_geom AS (
// 	SELECT ST_Buffer(ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, ${radius})::geometry AS geom
// 	)
// 	SELECT ST_AsGeoJSON(es.geometry::geometry)
// 	FROM circle_geom AS cg, public."elenco-scuole" AS es 
// 	WHERE ST_Contains(cg.geom, es.geometry::geometry)`;

// 	//try query execution
//     try {
//         client.query(query, (error, results) => {
//       if (error) {
//         console.error('Errore durante l\'esecuzione della query:', error);
//       } else {
//         console.log("query effettutata con successo");
//         res.send(results.rows)
//       }
//     });
//     } catch (err) {
//         console.error('Errore durante il confronto delle geometrie:', err);
//         res.status(500).json({ error: 'Errore durante il confronto delle geometrie' });
//     }
// });




app.post('/',(req,res)=>{

	client.query(`truncate table user_votes`);

	for (let i = 0; i < req.body.values.length; i++) {
		
		client.query(`INSERT INTO user_votes (poi_type, vote) VALUES ('${req.body.keys[i]}', '${req.body.values[i]}');`);
		
		
		
	}

	res.send('INSERIMENTO VOTI ANDATO')
	
})


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


app.get('/schools', (req, res) => {
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




app.get('/pharmacy', (req, res) => {
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


app.get('/bycicles', (req, res) => {
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

app.get('/green_areas', (req, res) => {
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

app.get('/hospital', (req, res) => {
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


app.get('/library', (req, res) => {
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

app.get('/electric', (req, res) => {
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

  
  app.get('/cinemaTeathers', (req, res) => {
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

  
  app.get('/ludic', (req, res) => {
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

  app.get('/bus', (req, res) => {
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
  
  

app.get('/quartieri',(req,res) =>{
	let query=`SELECT ST_AsGeoJSON(n.geometry),n.quartiere from neighborhoods n`
			   
	client.query(query, (error, results) => {
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
    let geojson = req.body; // Supponendo che req.body sia una lista di coordinate [{lat: ..., lng: ...}, ...]
    console.log(geojson);
	//query to find schoools inside polygon area
	let query= `
      SELECT ST_AsGeoJSON(es.geometry::geometry)
      FROM public."elenco-scuole" es
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
			console.log(results.rows);
			res.send(results.rows)
		}
	  });
	}
	catch (err) {
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