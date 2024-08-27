export const GET_APARTMENTS_QUERY = `
WITH poi_distances AS (
    -- Altri tipi di POI rimangono invariati
    SELECT a.id AS apartment_id,
           'school' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN schools p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'electricStations' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN electric_stations p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'pharmacies' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN pharmacies p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'libraries' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN libraries p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'theaters' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN theaters p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'hospitals' AS poi_type,
           CASE
               WHEN COUNT(p.id) >= 1 THEN 1
               ELSE 5
           END AS distance
    FROM apartments a
    LEFT JOIN hospitals p ON ST_DWithin(a.geometry, p.geometry, 500)
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'bikeRacks' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN bike_racks p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'sportsAreas' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN sports_areas p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'ludics' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN ludics p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'busStops' AS poi_type,
           CASE
               WHEN COUNT(p.id) >= 2 THEN 1
               ELSE 5
           END AS distance
    FROM apartments a
    LEFT JOIN bus_stops p ON ST_DWithin(a.geometry, p.geometry, 300)
    GROUP BY a.id
    UNION ALL
    -- Aggiunta delle green_areas
    SELECT a.id AS apartment_id,
           'greenAreas' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN green_areas p
    GROUP BY a.id
),
weighted_distances AS (
    SELECT
        pd.apartment_id,
        pd.poi_type,
        pd.distance,
        uv.vote,
        ((pd.distance/1000) * (uv.vote)) AS weighted_distance
    FROM poi_distances pd
    JOIN user_votes uv ON pd.poi_type = uv.poi_type
),
apartment_scores AS (
    SELECT
        apartment_id,
        SUM(weighted_distance) AS total_weighted_distance
    FROM weighted_distances
    GROUP BY apartment_id
)
SELECT
    a.id AS code,
    ST_AsGeoJSON(a.geometry::geometry) AS geometry,
    a.prezzo,
    a.quartiere,
    a.indirizzo,
    ascore.total_weighted_distance AS score
FROM apartments a
JOIN apartment_scores ascore ON a.id = ascore.apartment_id
ORDER BY ascore.total_weighted_distance ASC;

`


export const GET_NEIGHBOURHOOD_RANKING = `
WITH poi_distances AS (
    -- Altri tipi di POI rimangono invariati
    SELECT a.id AS apartment_id,
           'school' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN schools p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'electricStations' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN electric_stations p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'pharmacies' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN pharmacies p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'libraries' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN libraries p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'theaters' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN theaters p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'hospitals' AS poi_type,
           CASE
               WHEN COUNT(p.id) >= 1 THEN 1
               ELSE 5
           END AS distance
    FROM apartments a
    LEFT JOIN hospitals p ON ST_DWithin(a.geometry, p.geometry, 500)
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'bikeRacks' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN bike_racks p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'sportsAreas' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN sports_areas p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'ludics' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN ludics p
    GROUP BY a.id
    UNION ALL
    SELECT a.id AS apartment_id,
           'busStops' AS poi_type,
           CASE
               WHEN COUNT(p.id) >= 2 THEN 1
               ELSE 5
           END AS distance
    FROM apartments a
    LEFT JOIN bus_stops p ON ST_DWithin(a.geometry, p.geometry, 300)
    GROUP BY a.id
    UNION ALL
    -- Aggiunta delle green_areas
    SELECT a.id AS apartment_id,
           'greenAreas' AS poi_type,
           MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN green_areas p
    GROUP BY a.id
),
weighted_distances AS (
    SELECT
        pd.apartment_id,
        pd.poi_type,
        pd.distance,
        uv.vote,
        ((pd.distance/1000) * (uv.vote)) AS weighted_distance
    FROM poi_distances pd
    JOIN user_votes uv ON pd.poi_type = uv.poi_type
),
apartment_scores AS (
    SELECT
        apartment_id,
        SUM(weighted_distance) AS total_weighted_distance
    FROM weighted_distances
    GROUP BY apartment_id
),
apartments_with_quartieri AS (
    SELECT
        a.id AS apartment_id,
        ST_AsGeoJSON(a.geometry::geometry) AS geometry,
        a.prezzo,
        ascore.total_weighted_distance AS score,
        q.cod_quar AS quartiere_id
    FROM apartments a
    JOIN apartment_scores ascore ON a.id = ascore.apartment_id
    JOIN neighborhoods q ON ST_Within(a.geometry::geometry, q.geometry)
)
SELECT
       ST_AsGeoJSON(q.geometry::geometry) as geom,
       q.cod_quar AS quartiere_id,
       q.quartiere AS nome,
       AVG(aq.score) AS score
FROM apartments_with_quartieri aq
JOIN neighborhoods q ON aq.quartiere_id = q.cod_quar
GROUP BY q.cod_quar, q.quartiere, geom
ORDER BY score ASC
`
   
