/* Map of GeoJSON data from map2.geojson */

// markers for bike friendly cities 

var Massachusetts = L.marker([42.407211, -71.382437]).bindPopup('Massachusetts ranked #1'),
    Oregon = L.marker([43.804133, -120.554201]).bindPopup('Oregon ranked #2'),
    Washington    = L.marker([47.751074, -120.740139]).bindPopup('Washington ranked #3'),
    California    = L.marker([36.778261, -119.417932]).bindPopup('California ranked #4');
    Minnesota    = L.marker([	46.729553, -94.6859]).bindPopup('Minnesota ranked #5');
    SouthDakota = L.marker([43.969515, -99.901813]).bindPopup('South Dakota ranked #46'),
    Oklahoma    = L.marker([35.007752, -97.092877]).bindPopup('Oklahoma ranked #47'),
    Mississippi    = L.marker([	32.354668, -89.398528]).bindPopup('Mississippi ranked #48'),
    Nebraska    = L.marker([41.492537, -99.901813]).bindPopup('Nebraska ranked #49');
    Wyoming    = L.marker([43.075968, -107.290284]).bindPopup('Wyoming ranked #50');

//marker groups
var top5 = L.layerGroup([Massachusetts, Oregon, Washington, California, Minnesota]);

var bottom5 = L.layerGroup([SouthDakota, Oklahoma, Mississippi, Nebraska, Wyoming]);

//create!!! map!!!
function createMap(){
    var map = L.map('map', {
        center: [41, -96],
        zoom: 4,
        // limit the user's ability to zoom
        maxZoom: 9,
        layers: [top5, bottom5]

    });

    //add OSM base tilelayer
var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
    }).addTo(map);

var controlLayers = L.control.layers(null, friendly).addTo(map);

    getData(map);
};

// marker group labels etc for layer control
  var friendly = {
      "Top 5 Bike Friendly States": top5,
      "Bottom 5 Bike Friendly States": bottom5
  }


// add proportional symbols to map at coordinates
function createPropSymbols(data, map, attributes) {
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//create circles, make them look nice
function pointToLayer(feature, latlng, attributes){
    var attribute = attributes[0];
    //is this working(ish)
    console.log(attribute);
    
    //decide how we want our circles
    var options = {
        radius: 7,
        //cadet blue to match the title
        fillColor: "#5F9EA0",
        color: "#000",
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.2
    };

    //value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    if (attValue == 0) {
        attValue = 1;
    }
    //radius based on its attribute value
    options.radius = calcPropRadius(attValue);
    
    //draw aforementioned circles
    var layer = L.circleMarker(latlng, options);
    createPopup(feature.properties, attribute, layer, options.radius);

    //mouseover/out on circles
    layer.on({
        mouseover: function() {
            this.openPopup();
        },
        mouseout: function() {
            this.closePopup();
        },

    });
    
    return layer;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor 
    var scaleFactor = 5;
    //area 
    var area = attValue * scaleFactor;
    //radius calculation
    var radius = Math.sqrt(area/Math.PI);
    

    return radius;
};


//make a slider, make it work
function createSequenceControls(map, attributes){
        //create range input element (slider)
        $('#slider').append('<div class="yeartitle"> </div>');
        $('#slider').append('<input class="range-slider" type="range">');
        $('#slider').append('<button class="skip" id="reverse">reverse</button>');
        $('#slider').append('<button class="skip" id="forward">forward</button>');
        $('#reverse').html('<img src="img/reverse.png"/>');
        $('#forward').html('<img src="img/forward.png"/>');

        //set slider attributes
        $('.range-slider').attr({
            max: 7,
            min:0,
            value:0,
            step:1
        });
            
        var year = attributes[0].split("_")[1]; 
            $('.yeartitle').html(year);
    
    //click functionality
        $('.skip').click(function(){
            var index = $('.range-slider').val();
            //var max_index = $('.range-slider').attr('max');

            // increment by 1 or -1 for the eight years 
            if ($(this).attr('id') == 'forward') {
                index++;
                index = index > 7 ? 0 : index;
            } else if ($(this).attr('id') == 'reverse') {
                index--;
                index = index <0 ? 7 : index;
            };
            // update slider
            console.log(index);
            $('.range-slider').val(index);
            
            var year = attributes[index].split("_")[1]; 
            $('.yeartitle').html(year);

            updatedPropSymbols(map, attributes[index]);
        });

    $('.range-slider').on('input', function(){
        var index = $(this).val();
        
    var year = attributes[index].split("_")[1]; 
    $('.yeartitle').html(year);

        updatedPropSymbols(map, attributes[index]);
    });
};

// update symbols                           
function updatedPropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            var props = layer.feature.properties;
            
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            createPopup(props, attribute, layer, radius);
        };
    });
}
    // popup with correct information to match year 
function createPopup(props, attribute, layer, radius){
     var year = attribute.split("_")[1];
    var popupContent = "<p><b>Docked Bikeshare Stations in " + props.City + ", " + props.State + " in " + year + ":</b> " + props[attribute];

    //bind popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
};

    
function processData(data) {
    //array for attributes
    var attributes = [];
    var properties = data.features[0].properties;
 //only use columns that are years   
    for (var attribute in properties) {
        if (attribute.includes("20")) {
            attributes.push(attribute);
        };
    };
    console.log(attributes);
    
    return attributes;
};


// load via ajax
function getData(map){
    $.ajax("data/map2.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);
          
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
        }
    });
    

};

$(document).ready(createMap);
