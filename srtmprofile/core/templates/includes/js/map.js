function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.popup_content) {
        layer.bindPopup(
            feature.properties.popup_content
        );
    }
}

function getHost() {
    var url = "{{ request.get_host }}";
    var host = "";

    if (url == "127.0.0.1:8000") {
        host = "{{ request.get_host }}".slice(0, -5);
    } else {
        host = "{{ request.get_host }}";
    }
    return host;
}


var wms_server = "http://" + getHost() + ":8182/geoserver/";

var elevation = L.tileLayer.wms(wms_server + 'elevation/wms', {
    layers: 'elevation:srtm_rio_verde',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    //CQL_FILTER: 'cod_ibge_m=' + cod_ibge_m,
    maxZoom: 21
});

var limite = L.tileLayer.wms(wms_server + 'siga-urbano/wms', {
    layers: 'siga-urbano:municipio',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    CQL_FILTER: 'cod_ibge_m=5007406',
    maxZoom: 21
});

// function getColor(jurisdiction) {
//     switch (jurisdiction) {
//         case 'Federal':
//         return '#000';
//         break;
//         case 'Estadual':
//         return ' #994d00';
//         default:
//         return '#aaa';
//     }
// }
//
// function getWeight(jurisdiction) {
//     switch (jurisdiction) {
//         case 'Federal':
//         return 4;
//         break;
//         case 'Estadual':
//         return 2;
//         default:
//         return 1;
//     }
// }

function Style() {
    return {
        color: 'orange',
        weight: 3,
    };
}

var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

var grayscale = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
    streets = L.tileLayer(mbUrl, {id: 'mapbox.streets', attribution: mbAttr});

var satellite = L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
    maxZoom: 21,
    attribution: 'google'
});


var roads = L.geoJson([], {
    style: Style,
    onEachFeature: onEachFeature,
    maxZoom: 20
});

var roads_geojson_dataurl = "{% url 'core:roads_geojson' %}";

$.getJSON(roads_geojson_dataurl, function (data) {
    roads.addData(data);
});

var div = 'map';
var map_center = [-18.8003680998, -55.0291442871];
var zoom_init = 10;
var layers = [satellite, roads, limite];

// caso exista obj, a pag. é detail.html
var obj = '{{ obj.geom.json|safe }}';
var init_x = '{{ init_x|safe }}';
var init_y = '{{ init_y|safe }}';
var end_x = '{{ end_x|safe }}';
var end_y = '{{ end_y|safe }}';

var detailStyle = {
    "color": '#ffff00',
    "weight": 10,
    "opacity": 0.4
};

if (obj) {
    div = 'map-detail';
    road = L.geoJson(JSON.parse(obj), {style: detailStyle});
    road_group = new L.featureGroup([road,]);
    layers = [satellite, roads, limite, road_group]
}

var map = L.map(div, {
    center: map_center,
    zoom: zoom_init,
    layers: layers
});

if (obj) {
    map.fitBounds(road_group.getBounds());

    var starts = L.circle([init_y, init_x], {
        color: '#00e600',
        fillColor: '#00e600',
        fillOpacity: 0.9,
        radius: 150
    }).addTo(map);

    var ends = L.circle([end_y, end_x], {
        color: '#ff3300',
        fillColor: '#ff3300',
        fillOpacity: 0.9,
        radius: 150
    }).addTo(map);
}

var baseLayers = {
    "Google Satélite": satellite,
    "OSM Grayscale": grayscale,
    "OSM Streets": streets
};

var overlays = {
    "Limites do Município": limite,
    "Estradas": roads,
    "MDE - SRTM": elevation,
};

L.control.layers(baseLayers, overlays).addTo(map);
