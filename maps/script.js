mapboxgl.accessToken = 'pk.eyJ1IjoiY292aWRzY2hvb2xzY2FuYWRhIiwiYSI6ImNraDk2bzg3bDBsNjAycnBkNXN4ZjJibDMifQ.Gy20Etm1I_Jtd8znGFP7kA'; //Mapbox token 
// Globals
var rendered_clusterCount = 4040;
var rendered_outbreakCount = 4042;
var rendered_singleCount = 4041;

var case_cutoff = 0;
var date_cutoff = 15;

var case_min = 0;
var case_max = 110;
var date_set = 180;

$(() => {
    map.on('load', function () {
        d3.json(
            'CanadaMap_QuebecMerge-current.clean.geojson',
            function (err, data) {
                if (err) throw (err);

                data.features = data.features.map(function (d) {
                    // create new integer property for summed cases because is char by default
                    d.properties.totcase_int = parseInt(d.properties.Total_Cases_Summed);
                    // convert strings to int
                    d.properties.Is_Cluster = parseInt(d.properties.Is_Cluster);
                    d.properties.Is_Outbreak = parseInt(d.properties.Is_Outbreak);
                    d.properties.Is_Single = parseInt(d.properties.Is_Single);
                    d.properties.Difference_In_Days = parseInt(d.properties.Difference_In_Days);
                    return d;
                });

                //Add the the layer to the map 
                map.addLayer({
                    'id': 'csvData',
                    'type': 'circle',
                    'source': {
                        'type': 'geojson',
                        'data': data
                    },
                    'paint': {
                        'circle-radius': ['case',
                            ['<=', ["number", ["get", "totcase_int"]], 4],
                            4,
                            ["*", ["number", ["get", "totcase_int"]], 0.6]
                        ],
                        'circle-opacity': 0.8,
                        'circle-color': [
                            "match",
                            [
                                "get",
                                "Outbreak_Status"
                            ],
                            "Single/unlinked cases", "#FFEDA0",
                            "Declared outbreak", "#F03B20",
                            "Cluster (BC)", "#6F09BD",
                            "gray"
                        ]
                    },
                });


                // When a click event occurs on a feature in the csvData layer, open a popup at the
                // location of the feature, with description HTML from its properties.
                map.on('click', 'csvData', function (e) {
                    var coordinates = e.features[0].geometry.coordinates.slice();

                    //set popup text 
                    //You can adjust the values of the popup to match the headers of your CSV. 
                    // For example: e.features[0].properties.Name is retrieving information from the field Name in the original CSV. 
                    var description = `<h3>` + e.features[0].properties.institute_name + `</h3>`
                    description = description + `<b>` + `Total cases to date: ` + `</b>`;
                    description = description + e.features[0].properties.Total_Cases_Summed + `<br>`;

                    description = description + `<b>` + `Total outbreaks to date: ` + `</b>`
                    description = description + e.features[0].properties.Total_outbreaks_to_date + `<br>`;

                    description = description + `<b>` + `Last Reported Date: ` + `</b>`
                    description = description + e.features[0].properties.Last_Reported_Date + `<br>`;

                    description = description + `<b>` + `School board: ` + `</b>`
                    description = description + e.features[0].properties.School_board + `<br>`;

                    description = description + `<b>` + `City: ` + `</b>`
                    description = description + e.features[0].properties.City + `<br>`;

                    description = description + `<b>` + `Province: ` + `</b>`
                    description = description + e.features[0].properties.Province + `<br>`;

                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    //add Popup to map

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
                });

                // Change the cursor to a pointer when the mouse is over the places layer.
                map.on('mouseenter', 'csvData', function () {
                    map.getCanvas().style.cursor = 'pointer';
                });

                // Change it back to a pointer when it leaves.
                map.on('mouseleave', 'places', function () {
                    map.getCanvas().style.cursor = '';
                });

                var bbox = turf.bbox(data);
                map.fitBounds(bbox, { padding: 50 });


                newUpdateFilters();
                addLegend();

                updateTotals(data)

                $("#slider_min").change(e => {
                    case_min = parseInt(e.target.value)
                    newUpdateFilters()
                    updateTotals(data)
                })

                $("#slider_max").change(e => {
                    case_max = parseInt(e.target.value)
                    newUpdateFilters()
                    updateTotals(data)
                })

                $("#slider_date").change(e => {
                    date_set = parseInt(e.target.value)
                    // filterBy(case_min, case_max)
                    newUpdateFilters()
                    updateTotals(data)
                })

            }

        );
    });
})

var transformRequest = (url, resourceType) => {
    var isMapboxRequest =
        url.slice(8, 22) === "api.mapbox.com" ||
        url.slice(10, 26) === "tiles.mapbox.com";
    return {
        url: isMapboxRequest
            ? url.replace("?", "?pluginName=sheetMapper&")
            : url
    };
};

var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/dark-v10', //stylesheet location
    center: [-98.61328125, 52.05249047600099], // starting position
    zoom: 5,// starting zoom
    transformRequest: transformRequest
});

function findSchools(query) {
    // console.log("in geocoder bloo")
    var matchingFeatures = [];
    var schools = map.querySourceFeatures('csvData');

    console.log("total schools: " + schools.length)
    for (var i = 0; i < schools.length; i++) {
        var feature = schools[i];
        // handle queries with different capitalization than the source data by calling toLowerCase()
        if (
            feature.properties.institute_name
                .toLowerCase()
                .search(query.toLowerCase()) !== -1
        ) {

            feature['place_name'] = '🏫 ' + feature.properties.institute_name;
            feature['center'] = feature.geometry.coordinates;
            feature['place_type'] = ['park'];
            matchingFeatures.push(feature);
        }
    }
    return matchingFeatures;
}

var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    localGeocoder: findSchools,
    // limit results to Canada
    countries: 'ca',
    placeholder: 'Enter search e.g. Glamorgan School',
    // type: 'poi',
    mapboxgl: mapboxgl
});
map.addControl(geocoder);
map.addControl(new mapboxgl.NavigationControl()); // zoom rotate
map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    })
);


function addPoint() {
    // console.log("adding point")
}

function addLegend() {
    var layers = ['Single/unlinked', 'Outbreaks', 'Clusters (BC)'];
    var colors = ['#FFEDA0', '#F03B20', '#6F09BD'];
    var totalCount = [rendered_singleCount, rendered_outbreakCount, rendered_clusterCount]
    // console.log(layers.length);
    for (i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var count = totalCount[i]
        var color = colors[i];
        var item = document.createElement('div');
        var key = document.createElement('span');
        key.className = 'legend-key';
        key.style.backgroundColor = color;

        var value = document.createElement('span');
        value.innerHTML = layer;


        var case_count = document.createElement('span');
        case_count.innerHTML = " (" + count + ")";
        case_count.id = "legendItem_" + i;

        item.appendChild(key);
        item.appendChild(value);
        item.appendChild(case_count);
        legend.appendChild(item);
    }
}

function updateTotals(data) {
    // Filters the data set to count how many schools have been declared to have single cases, outbreaks, or clusters based on the filters
    var data_filterByCase = data.features.filter(schools => schools.properties.totcase_int >= case_min && schools.properties.totcase_int <= case_max)
    var data_filterByDate = data_filterByCase.filter(schools => schools.properties.Difference_In_Days <= date_set)


    var total_single = data_filterByDate.filter(schools => schools.properties.Outbreak_Status == "Single/unlinked cases").length;
    var total_outbreaks = data_filterByDate.filter(schools => schools.properties.Outbreak_Status === "Declared outbreak").length;
    var total_clusters = data_filterByDate.filter(schools => schools.properties.Outbreak_Status === "Cluster (BC)").length;

    var clusterCount_DOM = document.getElementById("legendItem_2")
    if (clusterCount_DOM) {
        clusterCount_DOM.innerHTML = " (" + total_clusters + ")"
    }

    var outbreakCount_DOM = document.getElementById("legendItem_1")
    if (outbreakCount_DOM) {
        outbreakCount_DOM.innerHTML = " (" + total_outbreaks + ")"
    }

    var singleCount_DOM = document.getElementById("legendItem_0")
    if (singleCount_DOM) {
        singleCount_DOM.innerHTML = " (" + total_single + ")"
    }
}

function newUpdateFilters() {
    var f2 = ["all", [">=", "totcase_int", case_min], ["<=", "totcase_int", case_max], ["<=", "Difference_In_Days", date_set]]

    map.setFilter('csvData', f2)
}

function filterByType(caseType) {
    console.log(caseType.target.id);
    //map.setFilter('csvData', [op, 'Outbreak_Status', val])
    var f1 = 0; var f2 = 0; var f3 = 0
    if (caseType.target.id == "cluster") {
        f1 = document.getElementById("cluster").checked ? [">", "Is_Cluster", 0] : ["<", "Is_Cluster", 1]
    }
    if (caseType.target.id == "outbreak") {
        f2 = document.getElementById("outbreak").checked ? [">", "Is_Outbreak", 0] : ["<", "Is_Outbreak", 1]
    }
    if (caseType.target.id == "other") {
        f3 = document.getElementById("other").checked ? [">", "Is_Single", 0] : ["<", "Is_Single", 1]
    }
}

