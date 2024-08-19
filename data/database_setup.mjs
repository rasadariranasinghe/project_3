// Get the Node.js fs module and the d3 js library to make the modifications.
import * as d3 from 'd3';
import * as fs from 'fs';

// Function for modifying census tract GeoJSON file in order to import the data onto the Mongo Database.
function modCT() {
    let censusTractGeoJSON = "Neighbourhoods-historical_140-4326.geojson"; // The GeoJSON file name.

    // Read the GeoJSON file.
    const geojsonData = fs.readFileSync(censusTractGeoJSON, 'utf8');
    let data = JSON.parse(geojsonData);
    
    // Modify the data so that it only contains the features array and nothing else.
    data = data.features;
    
    // Save the modified data back to the GeoJSON file
    fs.writeFileSync(censusTractGeoJSON, JSON.stringify(data));
    
    console.log('GeoJSON file updated successfully.');    
};

// Steps for accessing the server and the Database
// Import the MongoClient class from the 'mongodb' module 
import { MongoClient } from 'mongodb';
const uri = 'mongodb://localhost:27017/'; // Connection URI
const dbName = 'COVID_and_Crime_Toronto'; // Database Name
const client = new MongoClient(uri); // Create a new MongoClient

// Function for creating the remaining collections
async function createCollection(collectionName) {
    try {
        await client.connect(); // Connect to the MongoDB server
        const database = client.db(dbName); // Access the database
        console.log(`Connected to MongoDB server and ${dbName} Database`);
        await database.createCollection(collectionName); // Create the collection
        console.log(`Collection '${collectionName}' created successfully.`);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await client.close(); // Close the connection
    };
};

// Function for importing data into the collections
async function insertData(data, collectionName) {
    try {
        await client.connect(); // Connect to the MongoDB server
        const db = client.db(dbName); // Access the database
        console.log(`Connected to MongoDB server and ${dbName} Database`);
        const collection = db.collection(collectionName); // Access the Collection
        const result = await collection.insertMany(data); // Insert the data into the Collection
        console.log(`${result.insertedCount} documents inserted`);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await client.close(); // Close the connection
    };
};

// Get the crime data by making multiple API requests and then posting them to a collection in COVID_and_Crime_Toronto Mongo Database
const baseURL = 'https://services.arcgis.com/S9th0jAJ7bqgIRjw/ArcGIS/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0/query';

var params = {
    param1: value1,
    param2: value2 
};

const getRequest = async (url, params = {}) => {
    let options = {
        method: 'GET'
    };
    url += '?' + ( new URLSearchParams( params ) ).toString();
    return await fetch( url, options ).then( response => response.json() );
};
const get = async ( url, params ) => await getRequest( url, params);

// Running all the functions to finish Database setup
let collectionName = 'Census_Tract_Boundaries';
let censusTractGeoJSON = "Neighbourhoods-historical_140-4326.geojson"; // The Census Tract Boundaries GeoJSON file name.
const geojsonData = fs.readFileSync(censusTractGeoJSON, 'utf8'); // Read the GeoJSON file.
let data = JSON.parse(geojsonData);
createCollection(collectionName);
insertData(data, collectionName);
// Census_Tract_Boundaries Collection Setup Complete

collectionName = 'Crime_Data';
// Steps to getting the Crime Data from the API to be inserted here
createCollection(collectionName);
insertData(data, collectionName);
// Crime_Data Collection Setup Complete
