// Create a map object
let map = L.map('map', {
  zoom: 11,
  center: [43.65107, -79.347015],
  timeDimension: true,
  timeDimensionOptions: {
      timeInterval: "2018-09-30/2022-10-30",
      period: "PT1H"
  },
  timeDimensionControl: true,
});

// Create the base map layer
let streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to determine marker color based on crime type
function markerColor(crime) {
  return crime === 'Assault' ? "#ff5f65" :
         crime === 'Robbery' ? "#fca35d" :
         crime === 'Break and Enter' ? "#fdb72a" :
         crime === 'Auto Theft' ? "#f7db11" :
         "#98ee00";  // Default color for other crimes
}

// Fetch the crime data
d3.json("data/TorontoCrime_Data.json").then(function (data) {
  
  // Create a GeoJSON layer for crime data
  let crimeData = L.geoJson(data, {
    pointToLayer: function (geoJsonPoint, latlng) {
      return L.circleMarker(latlng, {
        radius: 2,  // Adjust radius as needed
        fillColor: markerColor(geoJsonPoint.properties.MCI_CATEGORY),  
        color: "black",
        weight: 1,
        fillOpacity: 0.75
      });
    },
    onEachFeature: function (feature, layer) {
            layer.bindPopup(`<h2>${feature.properties.MCI_CATEGORY}</h2><hr><h3>${feature.properties.OCC_YEAR}</h3><h3>${feature.properties.OCC_MONTH}</h3><hr><h4>Location: ${feature.properties.LOCATION_TYPE}</h4>`);
          }
        }).addTo(map);

  // Create baseMaps object
  let baseMaps = {
    'Street Map': streetMap
  };

  // Create overlayMaps object
  let overlayMaps = {
    "Crime Spread": crimeData
  };

  // Add control layers
  L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
});

// var wmsUrl = "https://thredds.socib.es/thredds/wms/observational/hf_radar/hf_radar_ibiza-scb_codarssproc001_aggregation/dep0001_hf-radar-ibiza_scb-codarssproc001_L1_agg.nc"
// var wmsLayer = L.tileLayer.wms(wmsUrl, {
//     layers: 'sea_water_velocity',
//     format: 'image/png',
//     transparent: true,
//     attribution: 'SOCIB HF RADAR | sea_water_velocity'
// });

// // Create and add a TimeDimension Layer to the map
// var tdWmsLayer = L.timeDimension.layer.wms(wmsLayer);
// tdWmsLayer.addTo(map);