<html>
    <title>SSMT Interactive Data</title>
    <head>
        <link rel="stylesheet" type="text/css" href="http://w2ui.com/src/w2ui-1.4.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.5.0/Chart.min.js"></script>
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
        <script type="text/javascript" src="http://w2ui.com/src/w2ui-1.4.min.js"></script>
        <script type="text/javascript" src="data.js"></script>
    </head>
    <body>
        <div id = 'myToolbar'></div>
        <div id= 'graph_div' style = 'height:80%;width:90%;'>
            <canvas id='graph_canvas' style="height:100%;width:100%;"></canvas>
        </div>

    </body>
    <script>
    var graph = false;
    var current_site = 'BUCKHORN2';
    var current_response = 'dbh';
    var current_climate = 'mat';
    var datasets = false;

    //create toolbar
        $(function () {
            $('#myToolbar').w2toolbar({
                name : 'myToolbar',
                items: [
                    {type:"html",html:"<div>Response</div>"}
                    ,{ type: 'menu',   id: 'response', caption: current_response, 
                            items: [
                            {text:"dbh"}
                            ,{text:"ht"}
                            ,{text:"surv"}
                            ,{text: "vol"}
                            ,{text:"volyld"}
                            ]
                        }
                    ,{type:"html",html:"<div>Site</div>"}
                    ,{ type: 'menu',   id: 'site', caption: current_site, 
                        items: [
                        {text:"BUCKHORN2"}
                        ,{text:"DOORSTOP"}
                        ,{text:"EVANS_CREEK"}
                        ,{text: "FLORAS"}
                        ,{text:"JAMMER3"}
                        ,{text: "NORTONS"}
                        ,{text:"SLICE_BUTTE"}
                        ,{text: "SODA320"}
                        ,{text:"STONE_NURSERY"}
                        ]
                    },
                    {type:"html",html:"<div>Pop Climate</div>"},
                    { type: 'menu',   id: 'climate', caption: current_climate, 
                    items: [
                    {text:"cmd"}
                    ,{text:"emt"}
                    ,{text:"eref"}
                    ,{text:"map"}
                    ,{text:"mat"}
                    ,{text:"msp"}
                    ,{text:"mcmt"}
                    ,{text:"mwmt"}
                    ,{text:"shm"}
                    ,{text:"td"}
                    ]
                }
                ],
                onClick:function(event){
                    if(event.subItem==null) return;
                    process_click(event);
                }
            });
        });
        //process an event click
        var process_click = function(event){
            var pick = event.subItem.text;
            event.item.caption = pick;
            if(event.item.id=="site") current_site = pick;
            if(event.item.id=="response") current_response = pick;
            if(event.item.id=="climate") current_climate = pick;
            setup_graph();
            w2ui.myToolbar.refresh();

        }

        //put together the data
        var setup_graph = function(){
            datasets = [];
            //create by region
            var region_sets = {};
            //now parse data
            var site_data = data[current_site];
            Object.keys(site_data).forEach(
                function(a_site){
                    region_sets[a_site] = [];
                    Object.keys(site_data[a_site]).forEach(
                        function(pop_name){
                            var a_pop =site_data[a_site][pop_name];                          
                            var hover_message = ["Pop: " + a_pop.pop,"Region: " + a_pop.region, "DBH: " + a_pop.dbh10
                                                ,"Ht: " + a_pop.ht10, "Surv: " + a_pop.surv10,
                                                "Vol: " + a_pop.vol10, "VolYld: " + a_pop.volyld10];
                            var point = {
                                x:a_pop["pop_" + current_climate]
                                ,y:a_pop[current_response+'10']
                                ,id:a_pop.pop
                                ,hover_message:hover_message
                            }; 
                         region_sets[a_pop.region].push(point) ;     
                        }
                    );
                        
                });     
            //add to datasets
            Object.keys(region_sets).forEach(function(a_region){
                var new_group = {
                                    label:a_region,
                                    pointBackgroundColor:region_colors[a_region].hex_color,
                                    backgroundColor:region_colors[a_region].hex_color,
                                    pointBorderColor:'rgba(0,0,0,1)',
                                    pointRadius:4,
                                    pointBorderWidth:1,
                                    fill:false,
                                    showLine:false,
                                    data:region_sets[a_region]
                                }
                datasets.push(new_group);
            })
           publish_graph();
        }

        var publish_graph = function(){
            var canvas = document.getElementById('graph_canvas');
            var ctx = canvas.getContext('2d');
            var graph_options  = {
                type: 'scatter',
                data: {
                    datasets:datasets
                },
                options: {
                    maintainAspectRatio:false
                    ,scales: {
                        xAxes: [{
                            type: 'linear',
                            position: 'bottom',
                            scaleLabel: {
                                display: true,
                                labelString: current_climate
                              }
                            }]
                        ,yAxes: [{
                            type: 'linear',
                            position: 'left',
                            scaleLabel: {
                                display: true,
                                labelString: current_response
                              }
                        }]
                    }
                    ,tooltips: {
                        callbacks: {
                            label: function(tooltipItem, data) {
                                return data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].hover_message;
                            }
                        }
                    }
                }
            };
            if(graph) graph.destroy();
            graph = new Chart(ctx,graph_options); 
        } 

        document.onload = setup_graph();

    </script>
</html>