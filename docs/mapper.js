
var map = false;
var point_grid = false;
var point_layer = false;
var BASELAYER_CHANGE = 'base_layer_change';
var POPULATION_FOCUS = 'population_focus'
var bases = { //basemap images
    Imagery:{
        url:'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ,attribution: '&copy; <a href="http://www.esri.com/">Esri</a>'
        ,max_zoom:23
    }
   , Hillshade:{
        url:'https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/{z}/{y}/{x}'
        ,attribution: '&copy; <a href="https://basemap.nationalmap.gov/arcgis/rest/services">USGS</a>'
        ,max_zoom:16
    }
    , ImageTopo:{
        url:'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}'
        ,attribution: '&copy; <a href="https://basemap.nationalmap.gov/arcgis/rest/services">USGS</a>'
        ,max_zoom:16
    }
    ,OpenTopo:{
        url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
        ,attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
        ,max_zoom:17
    }
    ,Street:{
        url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ,attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
        ,max_zoom:23
    }
    ,USGSClassic:{
        url:'http://server.arcgisonline.com/arcgis/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}'
        ,attribution: '&copy; <a href="http://www.esri.com/">Esri</a>'
        ,max_zoom:15
    }
    , USGSTopo:{
        url:'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'
        ,attribution: '&copy; <a href="https://basemap.nationalmap.gov/arcgis/rest/services">USGS</a>'
        ,max_zoom:16
    }
}

var show_blank_map = function(){
    var map_holder = document.getElementById('map_div');
    if(map){
        map.remove();
        map = false;
    }
    map = new L.map(map_holder,{zoomSnap:0.25,zoomDelta:0.25});
    //create objects to add to map
    
    var pick_base = L.control({position: 'topleft'});
    pick_base.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'baselayer_options');
        div.innerHTML = '<select onchange="PubSub.publish(BASELAYER_CHANGE,this)">><option>USGSTopo</option><option>Imagery</option><option>Hillshade</option><option>ImageTopo</option><option>OpenTopo</option><option>Street</option><option>USGSClassic</option></select>';
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    }

    //set imagery as default
    baselayer = L.tileLayer(bases.USGSTopo.url, {
        attribution: bases.USGSTopo.attribution
        ,maxNativeZoom:bases.USGSTopo.max_zoom
    });
    //add scalebar
    var sbar = L.control.scale({metric:true,imperial:false});
    var map_callback = function(){   
        //add objects now
        pick_base.addTo(map);
        sbar.addTo(map);
        if(baselayer){
            baselayer.addTo(map);
        }
        //change style
        $('.leaflet-control-scale-line').css('background','rgba(255,255,255,1)');
    };
    map.whenReady(map_callback);
    map.setView([46.1914,-122.1956],8);
    
}

//show points
var show_points = function () {
    var plotColor = "#ff4230";
    point_layer = null;
    if(point_grid==null || point_grid.features.length==0) return;
    point_layer = L.geoJson(point_grid, {
        pointToLayer: function (feature, latlng) {
            var pt_icon = L.divIcon({className:'leaflet-div-icon2',html:String(feature.family),iconAnchor:[20,30]});
            return L.marker(latlng,{icon:pt_icon});
        },
    });
point_layer.label = 'point_layer';
   var pts = L.geoJson(point_grid, {
        pointToLayer: function (feature, latlng) {
             return new L.CircleMarker(latlng, {
                        radius: 5
                        ,weight:2
                        ,fillColor:'red'
                        ,fillOpacity:1
                        ,color:'white'
                        ,stroke:true
             })
        },
    });
     //make points clickable
  /*  point_layer.on("click",function(e){
        PubSub.publish(MAP_POINT_CLICK,{id:e.layer.feature.properties.id});
    });
*/
    point_layer.addLayer(pts);
    if(point_layer==null) return;
    if(map){
        map.eachLayer(function (layer) {
            if(layer.label=='point_layer') map.removeLayer(layer);
        });
        point_layer.addTo(map);
        //zoom to layer
        if(point_layer.getLayers().length>0) map.fitBounds(point_layer.getBounds(),{maxZoom:8,padding:[50,50]});
    }
};

PubSub.subscribe(BASELAYER_CHANGE,function(msg,data){
    if(baselayer) baselayer.remove();
    var new_base = data.value;
    baselayer = L.tileLayer(bases[new_base].url, {
        attribution: bases[new_base].attribution
        ,maxNativeZoom:bases[new_base].max_zoom
    });
    baselayer.addTo(map);
});

PubSub.subscribe(POPULATION_FOCUS,function(msd,data){
    point_grid = null;
    var pt_array = [];
    for(var k = 0; k<data.length;k++){
        var a_fam = locations[data[k]]
        var x = a_fam.lon
        var y = a_fam.lat
        var id = String(a_fam.family);
        pt_array.push(turf.point([x,y],{name:id,id:id}));
    } 
    point_grid = turf.featureCollection(pt_array);
    turf.featureEach(point_grid,function(feature,index){
        feature.family = feature.properties.name;
    });
    show_points();

});

