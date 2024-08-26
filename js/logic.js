// Function to determine marker color based on crime type
function markerColor(crime) {
  return crime === 'Assault' ? "#ff5f65" :
         crime === 'Robbery' ? "#fca35d" :
         crime === 'Break and Enter' ? "#fdb72a" :
         crime === 'Auto Theft' ? "#f7db11" :
         crime === 'Theft Over' ? "#a3a3c2" :
         "#98ee00";  // Default color for other crimes
};

// Function for getting the data in the collections into an array after adding a time field to the properties field.
let crimeDataArray = [];
async function getCrimeData(crimeColl) {
  const findCrimeData = crimeColl.find({}); // Make a find operation to get the crime data from the database.
  for await (const crime of findCrimeData) {
    // Set a new time field for each entry in the database for the TimeDimensions to easily find the times.
    crime.properties.time = new Date(crime.properties.OCC_DATE).setHours(crime.properties.OCC_HOUR);
    crimeDataArray.push(crime);// Add the entry into the array
  };
};

// API URL for calling the server function to collect crime data, modify the data for visualization purposes, and then provide an JSON Array of the data.
const getCrimeDataURL = "https://data.mongodb-api.com/app/application-0-lzefcjx/endpoint/getCrimeDataforMapping";
// API URL for calling the server function to collect covid data, merge it with census tract border data, modify the data for visualization purposes, and then provide an JSON Array of the data.
const getCOVIDDataURL = "";

let crimeData; // The variable for storing the JSON Array of crime data.
let covidData; // The variable for storing the JSON Array of covid data.
// Function that calls the API GET requests with the base URL and then given params and getting the JSON data.
const getRequest = async (url) => {
  let options = {
      method: 'GET',
      redirect: 'follow'
  };
  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
      console.error(error);
      return null;
  };
};

// Function for connecting to the server and then  all the functions to perform the Database Setup.
async function run() {
  try {
      crimeData = await getRequest(getCrimeDataURL); // Get the Crime Data into the array
      crimeData.forEach((crime) => {crime.properties.time = new Date(crime.properties.time);}); // Convert the times in the time parameter to Date objects
      console.log(crimeData);
      buildMap();
  } catch (error) {
      console.error('An error occurred:', error);
  };
};
run().catch(console.dir);

//Build Map Function
function buildMap() {
  // Create a GeoJSON layer for crime data
  let crimeLayer = L.geoJson(crimeData, {
    pointToLayer: function (geoJsonPoint, latlng) {
      return L.circleMarker(latlng, {
        radius: 4,  // Adjust radius as needed
        fillColor: "black",
        color: "black",
        weight: 1,
        fillOpacity: 0.75
      });
    },
    onEachFeature: function (feature, layer) {
            layer.bindPopup(`<h2>${feature.properties.MCI_CATEGORIES.join(", ")}</h2><hr><h3>${feature.properties.time}</h3><hr><h4>Location: ${feature.properties.LOCATION_TYPE}</h4>`);
          }
  });

  let crimeDataTime = L.timeDimension.layer.geoJson(crimeLayer, {
    updateTimeDimension: true,
    updateTimeDimensionMode: "replace",
    duration: "PT1S"
  });

  // Create the base map layer
  let streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // Create a map object
  let map = L.map('map', {
    zoom: 11,
    minZoom: 11,
    center: [43.65107, -79.347015],
    layers: [streetMap, crimeDataTime],
    timeDimension: true,
    timeDimensionOptions: {
        timeInterval: "2017-01-01T12:00:00Z/2022-12-31T24:00:00Z",
        period: "PT1H"
    },
    timeDimensionControl: true,
  });

  // Create baseMaps object
  let baseMaps = {
    'Street Map': streetMap
  };

  // Create overlayMaps object
  let overlayMaps = {
    "Criminal Activity": crimeDataTime
  };

  // Add control layers
  L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
};
