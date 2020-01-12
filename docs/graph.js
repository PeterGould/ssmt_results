var graph = false;
var current_site = 'BUCKHORN2';
var current_response = 'ht';
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
            event.item.text = pick;
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
                            var hover_message = ["Pop: " + a_pop.pop,"Region: " + a_pop.region
                                                ,"DBH: " + a_pop.dbh10
                                                ,"Ht: " + a_pop.ht10, "Surv: " + a_pop.surv10
                                                ,"Vol: " + a_pop.vol10, "VolYld: " + a_pop.volyld10
                                                ,"Family 1: " + a_pop.fam1, " Elevation (m) " + a_pop.elev1
                                                ,"Family 2: " + a_pop.fam2, " Elevation (m) " + a_pop.elev2
                                            
                                            ];
                            var point = {
                                x:a_pop["pop_" + current_climate]
                                ,y:a_pop[current_response+'10']
                                ,id:a_pop.pop
                                ,pop:a_pop.pop
                                ,fam1:a_pop.fam1
                                ,fam2:a_pop.fam2
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
            //add lines
            var line_data = models["pop_" + current_climate];
            var line_coef = line_data.models[current_site][current_response+"10"];
            var step = (line_data.max - line_data.min)/50;
            var line_points = [];
            for(var k = line_data.min; k < line_data.max;k+=step){
                line_points.push({x:k,y:line_coef.a0 + line_coef.a1*k+line_coef.a2*k*k})
            }
            var line_dataset = {
                label:"Model Fit"
                ,data:line_points
                ,type:"line"
                ,fill:false
                ,backgroundColor:'rgba(0,0,0,0.5)'
                ,borderColor:'rgba(0,0,0,0.5)'
                ,pointRadius:0
                ,cubicInterpolationMode:'monotone'
            }
            datasets.push(line_dataset);
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
            //setup on-click event
            canvas.onclick = function(evt) {
                var activePoints = graph.getElementAtEvent(evt);
                if (activePoints[0]) {
                  var chartData = activePoints[0]['_chart'].config.data;
                  var datasetIndex = activePoints[0]['_datasetIndex']
                  var idx = activePoints[0]['_index'];
                  var point = datasets[datasetIndex].data[idx];
                  PubSub.publish(POPULATION_FOCUS,[point.fam1,point.fam2]);
                }
              }

        } 
        
        //listen for map point click
        PubSub.subscribe(FAMILY_CLICK,function(msg,family_data){
           //which region?
            var region = locations[family_data.id].region;
            var region_n = 0;
            var family_n = 0;
            var pop = false;
            for(var k = 0; k<datasets.length;k++){
                if(datasets[k].label==region){
                    region_n = k;
                    for(var j = 0; j<datasets[k].data.length;j++){
                        if(parseInt(datasets[k].data[j].fam1)==parseInt(family_data.id)
                        || parseInt(datasets[k].data[j].fam2)==parseInt(family_data.id)){
                            family_n = j;
                            pop = [String(datasets[k].data[j].fam1),String(datasets[k].data[j].fam2)];
                            break;
                        }
                    }
                    break;
                }
            }
            var meta = graph.getDatasetMeta(region_n);
            var rect = graph.chart.canvas.getBoundingClientRect();
            point = meta.data[family_n].getCenterPoint(),
            evt = new MouseEvent('mousemove', {
              clientX: rect.left + point.x,
              clientY: rect.top + point.y
            });
            var node = graph.chart.canvas;
           node.dispatchEvent(evt);
           if(pop) PubSub.publish(POPULATION_FOCUS,pop);
        });