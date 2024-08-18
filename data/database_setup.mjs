// Modify census tract GeoJSON file in order to import the data onto the Mongo Database.
let censusTractGeoJSON = "Neighbourhoods-historical_140-4326.geojson"; // The GeoJSON file name.

// Get the Node.js fs module and the d3 js library to make the modifications.
import * as d3 from 'd3';
import * as fs from 'fs';

// Read the GeoJSON file.
const geojsonData = fs.readFileSync(censusTractGeoJSON, 'utf8');
let data = JSON.parse(geojsonData);

// Modify the data so that it only contains the features array and nothing else.
data = data.features;

// Save the modified data back to the GeoJSON file
fs.writeFileSync(censusTractGeoJSON, JSON.stringify(data));

console.log('GeoJSON file updated successfully.');
