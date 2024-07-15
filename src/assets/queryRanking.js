export const GET_APARTMENTS_QUERY = 
` WITH poi_distances AS (
    SELECT a.id AS apartment_id,
        'school' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN schools p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'electricStations' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN electric_stations p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'pharmacies' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN pharmacies p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'libraries' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN libraries p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'theaters' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN theaters p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'hospitals' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN hospitals p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'bikeRacks' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN bike_racks p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'sportsAreas' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN sports_areas p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'recreation' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN ludics p
    GROUP BY a.id
    UNION ALL
    SELECT
        a.id AS apartment_id,
        'busStops' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN bus_stops p
    GROUP BY a.id
	UNION ALL
    SELECT
        a.id AS apartment_id,
        'ludics' AS poi_type,
        MIN(ST_Distance(a.geometry, p.geometry)) AS distance
    FROM apartments a
    CROSS JOIN bus_stops p
    GROUP BY a.id
),
weighted_distances AS (
    SELECT
        pd.apartment_id,
        pd.poi_type,
        pd.distance,
        uv.vote,
        (pd.distance * (5 - uv.vote)) AS weighted_distance
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
    a.id AS apartment_id,
	ST_AsGeoJSON(a.geometry::geometry) as geometry,
	a.prezzo,
    ascore.total_weighted_distance as score
FROM apartments a
JOIN apartment_scores ascore ON a.id = ascore.apartment_id
ORDER BY ascore.total_weighted_distance ASC;`
