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
        const database = client.db(dbName); // Access the database
        console.log(`Connected to MongoDB server and ${dbName} Database`);
        await database.createCollection(collectionName); // Create the collection
        console.log(`Collection '${collectionName}' created successfully.`);
    } catch (error) {
        console.error('An error occurred:', error);
    };
};

// Function for importing data into the collections
async function insertData(data, collectionName) {
    try {        
        const db = client.db(dbName); // Access the database
        console.log(`Connected to MongoDB server and ${dbName} Database`);
        const collection = db.collection(collectionName); // Access the Collection
        const result = await collection.insertMany(data); // Insert the data into the Collection
        console.log(`${result.insertedCount} documents inserted`);
    } catch (error) {
        console.error('An error occurred:', error);
    } 
};

// Steps to getting the crime data by making multiple API requests, dumping the features array of each request into an array, which will get inserted later to a collection in COVID_and_Crime_Toronto Mongo Database.
const baseURL = 'https://services.arcgis.com/S9th0jAJ7bqgIRjw/ArcGIS/rest/services/Major_Crime_Indicators_Open_Data/FeatureServer/0/query';

// The parameters for the initial API request, which will later get modified to make subsequent requests.
var params = {
    where: 'OCC_YEAR<=2022 AND OCC_YEAR>=2017',
    outFields:'OBJECTID,EVENT_UNIQUE_ID,OCC_DATE,OCC_YEAR,OCC_MONTH,OCC_DAY,OCC_DOY,OCC_DOW,OCC_HOUR,LOCATION_TYPE,PREMISES_TYPE,MCI_CATEGORY,HOOD_140',
    f:'geojson'
};

let get; // The variable for storing the JSON data.
// Function that builds the API GET requests with the base URL and the given params and getting the JSON data.
const getRequest = async (url, params = {}) => {
    let options = {
        method: 'GET',
        redirect: 'follow'
    };
    url += '?' + ( new URLSearchParams( params ) ).toString();
    return await fetch( url, options )
    .then( async response => await response.json() )
    .then(async data => {get = data})
    .catch((error) => console.error(error));
};

// Function for dumping all the JSON data from each API request into a single JSON array.
async function dumpToJSON() {
    await getRequest(baseURL, params); // make the initial API call.
    let isThereMoreData = get.hasOwnProperty('properties'); // check if there is more data from the API call that was not received due to the transfer limit of 2000 entries per call

    let jsonArray = []; // The JSON Array to which all the API JSON data will be dumped
    let offsetVal = 0; // The incrementing value to offset the next API call by to get the rest of the data
    params.resultRecordCount = 2000; // Set this as a param for the other API calls.
    do {
        jsonArray.push(...get.features); // Dump the features array from the current API call by merging it into jsonArray.
        offsetVal += 2000; // Increment the offset before making the next API call.
        console.log(`${offsetVal} or so results have been collected...Proceeding to next batch`);
        params.resultOffset = offsetVal; // Create the resultOffset parameter and/or set its value to be offsetVal.
        await getRequest(baseURL, params); // make the next API call.
        isThereMoreData = get.hasOwnProperty('properties'); // check whether there is more data to get and dump with another API call.
    } while (isThereMoreData);
    console.log(`All ${jsonArray.length} results have been collected`);
    return jsonArray;
};

// Running all the functions to finish Database setup
async function run() {
    try {
        await client.connect(); // Connect to the MongoDB server
        
        let collectionName = 'Crime_Data';
        let data = await dumpToJSON(); // Get all the Crime Data from the API
        const db = client.db(dbName); // Access the database
        console.log(`Connected to MongoDB server and ${dbName} Database`);
        await db.createCollection(collectionName); // Create the collection
        let collection = db.collection(collectionName); // Access the Collection
        let result = await collection.insertMany(data); // Insert the data into the Collection
        console.log(`${result.insertedCount} documents inserted`);
        // Crime_Data Collection Setup Complete
        console.log(collection.find());
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await client.close(); // Close the connection
    };
  };
  run().catch(console.dir);
  
