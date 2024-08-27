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
    return data;   
};

// Steps for accessing the server and the Database
// Import the MongoClient class from the 'mongodb' module 
import { MongoClient } from 'mongodb';
const uri = 'mongodb://localhost:27017/'; // Connection URI
const dbName = 'COVID_and_Crime_Toronto'; // Database Name
const client = new MongoClient(uri); // Create a new MongoClient

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
    let isThereMoreData; // Declare variable for checking if there is more data from the API call that was not received due to the transfer limit of 2000 entries per call.
    let jsonArray = []; // The JSON Array to which all the API JSON data will be dumped.
    let offsetVal = 0; // The incrementing value to offset the next API call by to get the rest of the data.
    params.resultRecordCount = 2000; // Create this parameter for declaring the number of results to transfer per API call, and set it to the transfer limit of 2000.
    do {
        await getRequest(baseURL, params); // make the API call.
        jsonArray.push(...get.features); // Dump the features array from the current API call by merging it into jsonArray.
        console.log(`${jsonArray.length} results have been collected...Proceeding to next batch`);
        isThereMoreData = get.hasOwnProperty('properties'); // check whether there is more data to get and dump with another API call.
        offsetVal += 2000; // Increment the offset before making the next API call.
        params.resultOffset = offsetVal; // Create the resultOffset parameter and/or set its value to be offsetVal.
    } while (isThereMoreData);
    console.log(`All ${jsonArray.length} results have been collected`);
    return jsonArray;
};

// Running all the functions to perform the Database Setup
async function run() {
    try {
        await client.connect(); // Connect to the MongoDB server
        const db = client.db(dbName); // Access the database
        console.log(`Connected to MongoDB server and accessed ${dbName} Database`);

        let collectionName = 'Census_Tract_Boundaries'; // Set the collection name.
        let data = modCT(); // Modify the Data with the function and get the returned JSON Array from it.

        await db.createCollection(collectionName); // Create the collection
        var collection = db.collection(collectionName); // Access the Collection
        var result = await collection.insertMany(data); // Insert the data into the Collection
        console.log(`${result.insertedCount} documents inserted`);
        // Census_Tract_Boundaries Collection Setup Complete
        console.log(`${collectionName} Collection Setup Complete`);
        
        collectionName = 'Crime_Data';  // Set the collection name
        data = await dumpToJSON(); // Get all the Crime Data from the API

        await db.createCollection(collectionName); // Create the collection
        collection = db.collection(collectionName); // Access the Collection
        result = await collection.insertMany(data); // Insert the data into the Collection
        console.log(`${result.insertedCount} documents inserted`);
        // Crime_Data Collection Setup Complete
        console.log(`${collectionName} Collection Setup Complete`);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await client.close(); // Close the connection
    };
  };
  run().catch(console.dir);
  
