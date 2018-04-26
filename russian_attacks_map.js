
var attack_sites = [], total = 0;

var margin = {top: 10, left: 10, bottom: 10, right: 10},
    width = parseInt(d3.select('#viz').style('width')),
    width = width - margin.left - margin.right,
    mapRatio = .7,
    centered,
    r = 40;
    height = width * mapRatio,
    mapRatioAdjuster = 5; 
    syria_center = [38, 35]; 

var projection = d3.geoMercator()
     .center(syria_center) 
     .translate([width/2, height/2])
     .scale(width * [mapRatio + mapRatioAdjuster]);

function resize() {
    svg.selectAll("circle").remove();
    svg.selectAll("text").remove();

    var features = svg.append("g");

    width = parseInt(d3.select('#viz').style('width'));
    width = width - margin.left - margin.right;
    height = width * mapRatio;

    projection.translate([width / 2, height / 2])
      .center(syria_center)
      .scale(width * [mapRatio + mapRatioAdjuster]);

    svg.style('width', width + 'px')
      .style('height', height + 'px');

    svg.selectAll("path")
      .attr('d', path);

    // labels = svg.append("g").attr("class", "label-group");
    //   labels.selectAll(".label")
    //     .data(topojson.feature(syr, syr.objects.SYR_adm2).features)
    //     .enter()
    //     .append("text")
    //     .attr("class", "label")
    //     .attr("x", function(d) {
    //       return path.centroid(d)[0];
    //     })
    //     .attr("y", function(d) {
    //       return path.centroid(d)[1];
    //     })
    //     .text(function(d) {
    //       if(added.includes(d.properties.NAME_1)) {
    //         return "";
    //       } else {
    //         added.push(d.properties.NAME_1);
    //         return d.properties.NAME_1;
    //       }
    //     })
    //     .style("font-family","GT-America")
    //     .style("text-transform","uppercase")
    //     .style("font-size","12px");
}

d3.select(window).on('resize', resize);

var svg = d3.select("#viz")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

var path = d3.geoPath()
    .projection(projection);

var features = svg.append("g");

d3.json("data/syria-districts-topojson.json", function(error, syr) {

  if (error) return console.error(error);

  queue()
    .defer(d3.json, "chemical-attacks.json")
    .awaitAll(function(error, results) { 
      //var attacks = parseData(results);
      drawMap();
      drawChemicalAttacks(results);
    });

  function drawMap() {
    // Bind data and create one path per TopoJSON feature

    var added = [];

    var districts = features.selectAll("path")
      .data(topojson.feature(syr, syr.objects.SYR_adm2).features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#A9A9A9")
      // .attr("stroke", "#404040")
      .attr("stroke", "#ddd")
      .attr("stroke-width", .8)
      .attr("stroke-opacity", 1)

    var labels = svg.append("g").attr("class", "label-group");
      labels.selectAll(".label")
        .data(topojson.feature(syr, syr.objects.SYR_adm2).features)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", function(d) {
          return path.centroid(d)[0];
        })
        .attr("y", function(d) {
          return path.centroid(d)[1];
        })
        .text(function(d) {
          if(added.includes(d.properties.NAME_1)) {
            return "";
          } else {
            added.push(d.properties.NAME_1);
            return d.properties.NAME_1;
          }
        })
        .style("font-family","GT-America")
        .style("text-transform","uppercase")
        .style("font-size","12px");


  }


  function parseData(results) {

    var incidents = results[0].units;
    var filteredData = {};
    var dataDict = {};

    for (var i = 0 ; i < incidents.length ; i++) {
      var incident = incidents[i];
      //console.log(incident)
      var attackCoords = projection([parseFloat(incident.longitude), parseFloat(incident.latitude)]);
      if(!isNaN(attackCoords[0]) && !isNaN(attackCoords[1])) {
        //filteredData.push(incident);
        if(filteredData[incident.incident_date.substring(0,7)]) {
          filteredData[incident.incident_date.substring(0,7)].push(incident)
        } else {
          filteredData[incident.incident_date.substring(0,7)] = [incident];
        }
      }
    }

    console.log(filteredData);

    drawChemicalAttacks(incidents);
  }


  function drawChemicalAttacks(results) {

    var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-8, 0])
    .html(function(d) { 
      //return d.fr_title;
      return "Name: " + d.name 
      // + "<br>" + "Nationality: " + d.country  
      + "<br>" + "Date: " + d.incident_date  
      // + "<br>" + "Summary: " + d.summary_en; 
      //+ "<br>" + "Status: " + d.status; 
    });

    svg.call(tool_tip);

    var incidents = results[0].units;

    for (var i = 0 ; i < incidents.length ; i++) {
      var incident = incidents[i];
      var incidentNo = "incident"+i;
      var attackCoords = projection([parseFloat(incident.longitude), parseFloat(incident.latitude)]);

      if(!isNaN(attackCoords[0]) && !isNaN(attackCoords[1])) {
        
        console.log(incident);
        console.log(attackCoords)
        var circle = svg.append("circle")
            .attr("class","circ"+incidentNo)
            .data([incident])
            .attr("cx", attackCoords[0])
            .attr("cy", attackCoords[1])
            .on("mouseover", tool_tip.show)
            .on("mouseout", tool_tip.hide)
            .attr("r", 0)
            .style("stroke-width", 2)
            .style("stroke","#FF4F00")
            .style("stroke-opacity",0.7)
            .style("fill", "none")
            .style("cursor","pointer")
            .transition()   
            .delay(Math.pow(1, 2.5) * 10)
            .duration(1000)         
            .attr('r', 10);

      }

    }

  }
















  function parseRussianAttacks(results) {

    var attacksByDay = {};

    for(var i = 0 ; i < results.length ; i++) {
      for(var j = 0 ; j < results[i].length ; j++) {
        if(results[i][j].location_latitude != "" && results[i][j].location_longitude != ""){
          var longitude = parseFloat(results[i][j].location_longitude);
          var latitude = parseFloat(results[i][j].location_latitude);
          var coords = [longitude, latitude, results[i][j]];
          attack_sites.push(coords);
        }
      }
    }

    for (var i = 0 ; i < attack_sites.length ; i++) {
      var date = ((attack_sites[i][2]).recording_date).split(" ");
      date = date[0];
      if(attacksByDay[date]) {
        (attacksByDay[date]).push(attack_sites[i][2]);
      } else {
        attacksByDay[date] = [attack_sites[i][2]];
      }
    }
    
    return attacksByDay;
  }

  function playAttacks(attacksByDay) {
    var subunits = topojson.feature(syr, syr.objects.SYR_adm2);

    var time1 = 1, attackDay = 0;
    var interval1 = setInterval(function() { 
      if (time1 <= (Object.keys(attacksByDay)).length) { 
        var date = (Object.keys(attacksByDay))[attackDay];
        $(".date").empty();
        $(".date").append(date);
        var dayData = (attacksByDay[((Object.keys(attacksByDay))[attackDay])]);
        var time2 = 0, k = 0;
        var interval2 = setInterval(function(){
          if (time2 <= dayData.length-1) {

            var loc = ((((dayData[time2]).location).split(" "))[0]).toLowerCase();
            var amt = parseInt(($("#"+loc)).text());
            amt++;
            total ++;
            $("#"+loc).empty();
            $("#"+loc).append(amt);
            $("#total").empty();
            $("#total").append(total); 

            if(loc != "aleppo" && loc != "idlib" && loc != "hama" && loc != "daraa" && loc != "damascus" && loc != "lattakia" && loc != "homs") {
              console.log(loc);
            }           

            var longitude = parseFloat(dayData[k].location_longitude),
                latitude = parseFloat(dayData[k].location_latitude),
                attackCoords = projection([longitude, latitude]);

            var circle = svg.append("circle")
              .attr("class",".circ"+attackDay)
              .data([(Object.keys(attacksByDay))[attackDay]])
              .attr("cx", attackCoords[0])
              .attr("cy", attackCoords[1])
              .attr("r", 0)
              .style("stroke-width", 5 / (1))
              .transition()
                  .delay(Math.pow(1, 2.5) * 10)
                  .duration(300)
                  .ease('quad-in')
              .attr("r", r)
              .style("stroke-opacity", 0)
              .each("end", function () {
                  d3.select(".circ"+attackDay).remove();
              });
            k++;
            time2++;
          } else {
            clearInterval(interval2);
          }
        }, 1000/dayData.length);
        attackDay++;
        time1++;
      }
      else { 
         clearInterval(interval1);
      }
    }, 1000);
  }

});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}





