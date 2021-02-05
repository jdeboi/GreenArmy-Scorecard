/*
 * GreenARMY 2014 Louisiana State Legislative Scorecard
 * http://scorecard.gogreenarmy.com/
 *
 * Programmed by Jenna deBoisblanc
 * December, 2014
 * jdeboi.com
 *
 *
*/


// setup district map svg
var nums = [9,8,9,9,9,9,9,9,2,0,9,9,9,4,9,9,9,9,9,9,9,9,9,9,9,9,9,9,7,9,9,9,8,9,7,9,9,7,7,7,9,9,9,2,0,9,9,9,9,9,7,6,9,9,9,4,9,8,4,3,5,4,7,9,9,7,9,8,9,9,9,7,9,4,4,9,4,1.2,4,2,0,9,9,8,9,9,4,9,9,8,9,9,9,9,8,8,5,7,9,9,9,9,9,8,7,9,9,7,9,9,9,9,9,9,8,9,8,7,7,9,9,3,3,7,9,9,6,9,9,9,4,1.2,4,9,9,5,7,9,8,5,9,9,9,9,5,9,9,5,6,9,5,8,7,8,4,9,8,9,6,8,6,5,9,9,4,4,8,8,9,8,6,7,9,9,6,9,8,6,7,8,4,4,0,7,9,8,7,9,9,7,9,6,9,8,9,6,7,8,4,6,7,4,0,5,9,8,5,9,5,9,9,9,4,1.2,9,9,9,4,9,7,9,2,0,5,9,5,9,8,5,9,8,3,5,8,4,9,8,5,6,9,9,7,9,9,4,9,9,8,9,9,9,9,6,4,1.2,9,8,9,7,7,9,7,4,9,8,9,5,5,7,9,9,7,4,9,8,9,4,1.2,9,7,6,9,5,9,9,5,7,9,7,9,4,9,9,9,6,4,2,9,9,9,8,5,7,8,4,1.2,7,7,7,9,9,9,9,9,9,4,5,7,5,5,4,3,8,8,8,4,8,9,6,9,9,9,5,9,9,7,8,8,8,4,4,7,7,8,9,9,9,8,8,4,7,9,4,5,5,9,9,5,6,5,5,9,9,7,8,6,9,7,7,9,9,9,9,9,9,5,7,4,2,9,9,9,9,8,7,8,9,9,9,9,9,9,6,7,5,4,4,9,9,6,7,6,6,4,6,9,5,6,4,7,5,7,6,8,9,6,4,9,9,9,4,6,7,2,1.2,5,4,4,4,6,10,6,6,7,9,8,8,9,7,7,7,4,5,7,5,8,6,9,9,8,8,6,6,7,7,5,8,4,8,9,9,8,8,8,9,9,7,7,7,9,8,8,9];
var width=600,
	height=510,
	svg = d3.select("#svgDiv").append("svg").attr("height",height).attr("width",width);

// variables to keep track of button states
var scorecardOn = true, brigadesOn = true, parishesOn = false, pollutionOn = false;
var chamber = 0;
// setup rainbow gradient
var rainbow = new Rainbow();
	rainbow.setSpectrum('#F00000',"yellow", '#2ABD12');
	rainbow.setNumberRange(50, 100);

var numLegislators = 144;
var legislators, mapPoints;

// setup legislator stat/bar svg
var widthLegStats = 370, heightLegStats = 40,
	svgLegStats = d3.select("#legisBars").append("svg").attr("height", heightLegStats).attr("width", widthLegStats),
	images = new Array(),

// bar variables #D3D3D3"
	// Support, Oppose, Absent
	barColors=["#2ABD12","#F00000","#CF6"],
	widthFactor=widthLegStats/100,
	xBar = 0,
	yBar = 0,
	barWidth = 25,
	barSpace = 5,

// active legislator variables
	activeLegis = null,
	locked = false,
	map=true,
	activeLoadID = 1,
	activeDistrict = 1,

// active vote variables
	numVotes = 17,
	numHouseVotes = 17,
	numSenateVotes = 17,
	numLabels = 6,
	numHouse = 105,
	numSenate = 39,
	houseKeys = new Array(),
	senateKeys = new Array(),
	votes = new Array(),
    houseVotes = new Array(),
	senateVotes = new Array(),
	voteLabels = new Array(),
	lockedVotes = false,
	clickedVote = null,
	highlightedVote = 0,
	highlightedVoteColor = 0,
	activeColor = "#000000",
	lockedCat = false;
var cities,citiesJson;
var foci = new Array(),labels = new Array();

// Create a unit projection.
var projection = d3.geo.albers()
    .scale(7190)
    .translate([-253.6512, -708.433]);

/////ZOOM AND DRAG//////////////////////////////////////////////////	
////////////////////////////////////////////////////////////////////	
var zoomScale = 1;
var zoomToFactor = 8;
var xMov,yMov;
var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 12])
    .on("zoom", function() {if(!draggingOn) zoomed(d3.event.translate,d3.event.scale);});

var draggingCoords = [0,0];
var draggingOn=false;

var drag = d3.behavior.drag()
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);
	
/*var force = d3.layout.force()
    .nodes(labels)
    .charge(-5)
	.linkDistance(0)
	.chargeDistance(0)
    .gravity(0)
    .size([width, height]);
var node, nodes=[];*/
////////////////////////////////////////////////////////////////////	
////////////////////////////////////////////////////////////////////	

	var currentDistrict=0, currentLayer=0;
	var glyph = {Pollution:"oil",Brigade:"home",Campaign:"flag"};
	var mpointsLabels = ["Brigade","Campaign","Pollution"];

// get things loaded
progressJs();
progressJs().start();
progressJs().set(20);
loadData();

function loadingDone() {
	setCitiesJson();
	setVotes();
	setDistricts();
	loadLegislators();
	setMapPoints();
	switchDistricts(0);
	switchLayers(0);
	progressJs().set(100).end();
	d3.select("#loadingMessage").remove();
	d3.select("#content").style("visibility","visible");
}
function loadData() {
	var remaining = 5;
	var houseDistricts = 105, 
		senateDistricts = 39,
		parishes = 64,
		numLabels = 6;
	d3.json("data/districts.json", function(json) {
		var houseJson = json.geometries.slice(0,houseDistricts);
		var senateJson = json.geometries.slice(houseDistricts,houseDistricts+senateDistricts);
		//var parishesJson = json.geometries.slice(houseDistricts+senateDistricts,houseDistricts+senateDistricts+parishes)

		var houseJsonPaths = svg.append("g").attr("id","houseDistricts").attr("class","gTransform").call(zoom).on("dblclick.zoom", null).call(drag);
		var senateJsonPaths = svg.append("g").attr("id","senateDistricts").attr("class","gTransform").call(zoom).on("dblclick.zoom", null).call(drag);
		//var parishesJsonPaths = svg.append("g").attr("id","parishesDistricts").attr("class","gTransform").call(zoom).on("dblclick.zoom", null).call(drag);
		
		// Create a path generator.
		var path = d3.geo.path()
		    .projection(projection);
		
		houseJsonPaths.selectAll("path")
		.data(houseJson)
		.enter()
		.append("path")
		.attr("d",path)
		.attr("stroke","gray")
		.attr("stroke-width","1px");
		
		senateJsonPaths.selectAll("path")
		.data(senateJson)
		.enter()
		.append("path")
		.attr("d",path)
		.attr("stroke","gray")
		.attr("stroke-width","1px");
		checkRemaining(--remaining,40);
		/*
		d3.json("data/congress.geojson", function(data) {
			var json=data.features;
			svg.append("g").attr("id","congressDistricts").attr("class","gTransform").call(zoom).on("dblclick.zoom", null).call(drag).selectAll("path").data(json).enter().append("path")
			.attr("d",path)
			.attr("stroke-width",".02%")
			.attr("stroke","black")
			.attr("fill-opacity",.3)
			.attr("fill","black");
			//function(){return randomColor()});
			
			parishesJsonPaths.selectAll("path")
			.data(parishesJson)
			.enter()
			.append("path")
			.attr("d",path)
			.attr("stroke","black")
			.attr("fill","black")
			//function(){return randomColor()})
			.attr("fill-opacity",.3)
			.attr("stroke-width",".02%");
		})
		checkRemaining(--remaining,40);
		*/
	});
	
	
	
	d3.tsv("data/legislators.tsv", function(data) {
		legislators = data;
		legislators=legislators.sort(function(a,b){return parseInt(a.loadID)-parseInt(b.loadID)});
		legislators=legislators.slice(0,numLegislators);
		checkRemaining(--remaining,10);
	});
	d3.tsv("data/votes.tsv", function(error, data) {
		votes = data.sort(function(a,b){return parseInt(a.loadID)-parseInt(b.loadID)});
		voteLabels= votes.slice(0,numLabels);
		votes = votes.slice(numLabels,numLegislators+numLabels);
		houseVotes = votes.slice(0,houseDistricts);
		senateVotes = votes.slice(houseDistricts,houseDistricts+senateDistricts);
		progressJs().increase(10);
		if (!--remaining) loadingDone();
	})
	d3.tsv("data/mapPoints.tsv", function(data){
		mapPoints = data;
		checkRemaining(--remaining,10);
	})
	/*d3.tsv("data/cities.tsv", function(data) {
		cities=data;
		checkRemaining(--remaining,10);
	})*/
	d3.json("data/cities.geojson", function(data) {
		var path = d3.geo.path()
    	.projection(projection);
		data.features.forEach(function(d, i) {
		    var c = path.centroid(d);
		    //foci.push({x: c[0], y: c[1]});
		    labels.push({x: c[0], y: c[1], label: d.properties.name})
		}); 
		checkRemaining(--remaining,10);
	})
} 
function checkRemaining(r,progress){
	progressJs().increase(progress);
	if (!r) loadingDone();
}

function setCitiesJson() {
	var path = d3.geo.path()
    	.projection(projection);
	svg.append("g").attr("id","citiesCircles").attr("class","gTransform").selectAll("circle").data(labels).enter().append("circle")
		.attr("cx",function(d){
			return d.x;
		})
		.attr("cy",function(d){
			return d.y;
		})
		//.attr("transform", function(d) { return "translate(" + path.centroid(d)  + ")"; })
		.attr("r","1")
		.attr("fill","black");
	
	svg.append("g").attr("id","citiesLabels").attr("class","gTransform").selectAll("text").data(labels).enter().append("text")
		//.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
		//.attr("dx", ".1em")
	    .style("pointer-events","none")
		.style("font-size","8px")
		.attr('x', function(d) { return d.x; })
	    .attr('y', function(d) { return d.y; })
	    .attr('text-anchor', 'left')
	    .text(function(d) { return d.label; });
		//.text(function(d){
		//	return d.properties.name;
		//}); 
}

function setDistricts() {
	var paths = d3.select("#svgDiv").selectAll("path");
	paths
	.data(legislators)
	.attr("fill", function(d) {
		var score = parseInt(d.Score); 
		if(isNaN(score)) score=0; 
		return '#'+rainbow.colourAt(score);
	})
	.attr("stroke","black")
	.attr("stroke-width",".02%")
	.attr("class",function(d,i){
		return "path"+i;
	})
	.on("mouseover", function(d) {
		if(!currentLayer){
			if(this!=activeLegis && !locked && !draggingOn && scorecardOn) d3.select(this).attr("fill-opacity",".6");	
			if(!locked && !draggingOn ) setLegislator(d);
		}
	})
	.on("mouseout", function(d,i) {
		if(!currentLayer){ 
			if(this!=activeLegis && !locked && !lockedVotes && !draggingOn && scorecardOn) d3.select(this).attr("fill-opacity",1);
			else if(lockedVotes && !locked) d3.select(this).attr("fill-opacity",1);
		}
	})	
	.on("click", function(d,i) {
		if (d3.event.defaultPrevented) return;
		else if(!currentLayer){
			clickedDistrict(this);
			setLegislator(d);
			if(locked) {
				d3.select("#svgDiv").selectAll("path").attr("fill-opacity",1);
				d3.select(this).attr("fill-opacity",.3);
				d3.select("#sidebar").attr("class","col-md-5 selected");
			}
			else{
				d3.select(this).attr("fill-opacity",.6);
				d3.select("#sidebar").attr("class","col-md-5");
			}
		}
	}); 
}
function setLegislator(d) {
	activeLoadID = parseInt(d.loadID);
	activeDistrict = parseInt(d.District);
	d3.select("#barPerc").text(function() {return "supported "+d.Supported+ "%, opposed " + d.Opposed+ "%, absent " + d.Absent+"% ";});
	d3.select("body").selectAll(".legisName").text(function() {return d.First+ " " + d.Last;});
	d3.select("body").selectAll(".legisDistrict").text(function() {return " "+d.District;});
	d3.select("body").selectAll(".legisCity").text(function() {return " "+d.City;});
	d3.select("body").selectAll(".legisEmail").text(function() {return " "+d.Email;});
	d3.select("body").selectAll(".legisPhone").text(function() {return " "+d.Phone;});
	d3.select("body").select(".legisImage").attr("src",function() {return "https://jdeboi.com/GreenArmy-Scorecard/images/placeholder.jpg";}); //{return d.Picture;});
	d3.select("body").selectAll(".colorScore").transition().style("color", getGradeColor(d));
	d3.select("body").selectAll(".legisGrade").transition().text(function() {return d.Grade;})
	d3.select("body").selectAll(".legisScore").transition().text(function() {return d.Score;});
	
	setBarChart(d);
	setVoteChart(activeLoadID);
}
function setVoteChart(id){
	hideVoteChart();
	d3.select("#g"+id).attr("class","visible");	
	setHighlightColor(highlightedVoteColor);
}
function setBarChart(d) {
	d3.select("#bar0")
		.transition()
		.attr("width", function() {return parseInt(d.Supported)*widthFactor;})
		.attr("x", xBar)
	d3.select("#bar1")
		.transition()
		.attr("width", function() {return parseInt(d.Opposed)*widthFactor;})
		.attr("x", function() {return xBar+parseInt(d.Supported)*widthFactor;});
	d3.select("#bar2")
		.transition()
		.attr("width", function() {return parseInt(d.Absent)*widthFactor;})
		.attr("x",function() {return xBar+(parseInt(d.Opposed)+parseInt(d.Supported))*widthFactor;});
}
function hideVoteChart() {
	d3.select("#houseRows").selectAll("g").attr("class","hidden");
	d3.select("#senateRows").selectAll("g").attr("class","hidden");
}

function loadLegislators() {
	var bars = svgLegStats.append("g");
	bars.selectAll("rect").data(barColors).enter().append("rect")
	.attr("x", xBar)
	.attr("y", yBar)
	.attr("id",function(d,i){return "bar"+i;})
	.attr("height", barWidth)
	.attr("width", 0)
	.attr("fill", function(d,i) {return barColors[i];})
	setLegislator(legislators[0]);
}

function setVotes() {
	var widthChart = 400;
	var rectSpace = 5;
	var pad = 4;
	var rectWidth = 30;
	var rectHeight = rectWidth;
	var numLine = parseInt((widthChart-2*pad)/(rectSpace+rectWidth));
	var heightChart = (parseInt(numVotes/numLine)+1)*(rectHeight+rectSpace)+pad;
	
	houseKeys = (d3.keys(houseVotes[1]).splice(3,numVotes+3));
	houseKeys.forEach(function(d,i){
		if(houseVotes[10][d]=="-"){
			numHouseVotes--;
			houseKeys.splice(i,1);
		}
	});
	senateKeys = (d3.keys(senateVotes[1]).splice(3,numVotes+3));
	senateKeys.forEach(function(d,i){
		if(senateVotes[10][d]=="-"){
			numSenateVotes--;
			senateKeys.splice(i,1);
		}
	});
	var rows = d3.select("#voteChart").append("svg").attr("height",heightChart).attr("width",widthChart).append("g").attr("id","voteBlocks");
	var houseRows = rows.append("g").attr("id","houseRows");
	var senateRows = rows.append("g").attr("id","senateRows");
	
	houseRows.selectAll("g").data(houseVotes).enter().append("g")
	.attr("id",function(d) {
		return "g" + d.loadID;
	})
	
	var houseBoxes = houseRows.selectAll("g").selectAll("rect")
	.data(function(d) {
		var i = 0;
        var test = houseKeys.map(function(column) {
			i++;
			return {column: column, value: d[column], num:i};
        });
		
		return test;
    })
	.enter()
	.append("rect")
	.attr("x", function(d,i){
		var index = i%numVotes;
		return (rectSpace+rectWidth)*(index%numLine)+pad;
	})
	.attr("class",function(d,i){return "rect"+i})
	.attr("y", function(d,i){
		return (rectHeight+rectSpace)*(parseInt(i%numVotes/numLine))+pad;
	})
	.attr("height",rectHeight)
	.attr("width",rectWidth)
	.attr("stroke","black")
	.attr("stroke-width",0)
	.attr("fill", function(d) {
		return getVoteColor(d.value);
	})
	.on("mouseover", function(d,i){
		if(!lockedVotes) {
			setHighlightColor(i);
			setVoteText(d.column);	
		}
	})
	.on("click", function(d,i) {
		setVoteClick(d.column,i);
	});
	
	senateRows.selectAll("g").data(senateVotes).enter().append("g")
	.attr("id",function(d) {
		return "g" + d.loadID;
	});
	var senateBoxes = senateRows.selectAll("g").selectAll("rect")
	.data(function(d) {
		var i = 0;
        var test = senateKeys.map(function(column) {
			i++;
			return {column: column, value: d[column], num:i};
        });
		return test;
    })
	.enter()
	.append("rect")
	.attr("x", function(d,i){
		var index = i%numSenateVotes;
		return (rectSpace+rectWidth)*(index%numLine)+pad;
	})
	.attr("class",function(d,i){return "rect"+i})
	.attr("y", function(d,i){
		return (rectHeight+rectSpace)*(parseInt(i%numSenateVotes/numLine))+pad;
	})
	.attr("height",rectHeight)
	.attr("width",rectWidth)
	.attr("stroke","black")
	.attr("stroke-width",0)
	.attr("fill", function(d) {
		return getVoteColor(d.value);
	})
	.on("mouseover", function(d,i){
		if(!lockedVotes) {
			setHighlightColor(i);
			setVoteText(d.column);	
		}
		
	})
	.on("click", function(d,i) {
		setVoteClick(d.column,i);
	});
	
	d3.select("#voteChart").select("#houseRows g").attr("class","visible");
	setVoteText("v1");
	setHighlightColor(0);
}


function setHighlightVote(i) {
	highlightedVote=i;
	resetHighlightVotes();
	
	d3.select("#voteBlocks").selectAll(".rect"+i)
	.attr("stroke-width","4")
}
function resetHighlightVotes(){
	d3.select("#voteBlocks").selectAll("rect")
	.attr("stroke-width","0");
}

function setHighlightColor(i) {
	highlightedVoteColor=i;
	resetVoteColors();
	var key;
	if(chamber==0) {
		key = houseKeys[i];
		d3.select("#houseRows").selectAll(".rect"+i)
		.attr("fill",function() {
			return getShadeColor(getVoteColor(houseVotes[activeDistrict-1][key]),-.40);
		});
	}
	else {
		key = senateKeys[i];
		d3.select("#senateRows").selectAll(".rect"+i)
		.attr("fill",function() {
			return getShadeColor(getVoteColor(senateVotes[activeDistrict-1][key]),-.40);
		});
	}
}
function resetVoteColors() {
	d3.select("#houseRows").selectAll("rect") 
	.attr("fill", function(d,i){
		var index = houseKeys[i%numHouseVotes];
		return getVoteColor(houseVotes[parseInt(i/numHouseVotes)][index]);
	});
	d3.select("#senateRows").selectAll("rect") 
	.attr("fill", function(d,i){
		var index = senateKeys[i%numSenateVotes];
		return getVoteColor(senateVotes[parseInt(i/numSenateVotes)][index]);
	});
}

function setVoteText(ind) {
	d3.select("#billName").text(function(){
		return getLabelInfo(voteLabels[0],ind);
	});
	d3.select("#billGenre").text(function(){
		return getLabelInfo(voteLabels[2],ind);
	});
	d3.select("#billNum").text(function(){
		return getLabelInfo(voteLabels[3],ind);	
	});
	d3.select("#billGAPos").text(function(){
		return getLabelInfo(voteLabels[4],ind);	
	});
	d3.select("#billNotes").text(function(){
		return getLabelInfo(voteLabels[5],ind);	
	});
}
function setVoteClick(n,i) {
	if(clickedVote !== n) {
		clickedVote=n;
		lockedVotes=true;
		setPathVoteColors(n);
		setHighlightVote(i);
		setHighlightColor(i);
		setVoteText(n);
	}
	else {
		resetHighlightVotes();
		clickedVote=null;
		lockedVotes=false;
		resetPathColors();
	}
}

function resetLocks() {
	d3.select("#sidebar").attr("class","col-md-5");
	resetHighlightVotes();
	clickedVote=null;
	lockedVotes=false;
	resetPathColors();
	d3.select("voteBlocks").selectAll("rect").attr("stroke-width",0);
	setVoteText("v1");
	setHighlightColor(0);
	locked=false;
	activeLegis=null;
}
function resetMap() {
	resetLocks();
	zoomed([0,0],1);
}


function resetPathColors() {
	if(currentDistrict==0) {
		d3.select("#houseDistricts").selectAll("path")
		.attr("fill", function(d,i) {
			var score = parseInt(legislators[i].Score);
			if(isNaN(score)) score=0; 
			return '#'+rainbow.colourAt(score);
		})
		.attr("fill-opacity",1);
	}
	else if (currentDistrict==1) {
		d3.select("#senateDistricts").selectAll("path")
		.attr("fill", function(d,i) {
			var score = parseInt(legislators[i+105].Score);
			if(isNaN(score)) score=0; 
			return '#'+rainbow.colourAt(score);
		})
		.attr("fill-opacity",1);
	}
}
function setPathVoteColors(v) {
	if(chamber==0) {
		d3.select("#houseDistricts").selectAll("path")
		.attr("fill", function(d,i) {
			var val = houseVotes[i][v];
			if(val == 0) return barColors[2];
			else if (val < 0) return barColors[1];
			else if (val > 0) return barColors[0];
			else return "gray";
		});
	}
	else if (chamber==1){
		d3.select("#senateDistricts").selectAll("path")
		.attr("fill", function(d,i) {
			var val = senateVotes[i][v];
			if(val == 0) return barColors[2];
			else if (val < 0) return barColors[1];
			else if (val > 0) return barColors[0];
			else return "gray";
		});
	}
}

function clickedDistrict(d) {
  if (d && activeLegis !== d) {
    activeLegis = d;
	locked=true;
  } else {
    zoomScale = 1;
    activeLegis = null;
	locked=false;
  }
}

/* get colors */
function getGradeColor(d) {
	if(d.Grade=="A") return barColors[0];
	else if (d.Grade=='B') return barColors[0];
	else if (d.Grade=='C') return "orange";
	else if (d.Grade=='D') return "orange";
	else if (d.Grade=='F') return barColors[1];
	else return "";
}
function getVoteColor(val) {
	if (isNaN(parseInt(val))) return "gray";
	else if(parseInt(val)==0) return barColors[2];
	else if(parseInt(val)>0) return barColors[0]; 
	return barColors[1];
}
function getShadeColor(color, percent) { 
	if(color=="#CF6") return "#AED959"; 
    else {var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    	return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
	}
}
function blendColors(c0, c1, p) {
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
}

function getLabelInfo(obj, index) {
	var value = "";
	for (var key in obj) {
		if (key==index)  value= obj[key];
	}
	return value;
}
function setMapPoints() {
	// [brigades, pollution]
	var mpointsColors = {Brigade:"#286090",Pollution:"black"};
 
	
	var mpoints = d3.select("#svgDiv svg").append("g").attr("id","mapPoints").attr("class","gTransform");
	
	d3.selectAll(".pointLink").append("a").attr("xlink:href","#");
	
	var mpointsg = mpoints.selectAll("g").data(mapPoints).enter().append("g").attr("class",function(d){return "g"+d.Category});
	svg.append("g").selectAll("defs").data(mpointsLabels).enter().append("defs")
	.append("pattern")
	.attr("height",28)
	.attr("width",28)
	.attr("id",function(d){
		return "pattern"+d;
	})
	.append("image")
	.attr("xlink:href",function(d){
		return "images/"+d+".png";
	})
	.attr("width",28)
	.attr("height",28)
	.attr("x",0)
	.attr("y",0);
	
	mpointsg
	.append("circle")
	.attr("fill","white")
	.attr("fill-opacity",.5)
	.attr("stroke-width","2")
	.attr("stroke","white")
	.attr("cx", function (d) { 
		return projection([d.Long,d.Lat])[0]; 
	})
	.attr("cy", function (d) { 
		return projection([d.Long,d.Lat])[1];
	})
	.attr("r",14)
	.on("mouseover", function(d,i){
		//d3.select(this).attr("fill","gray");
		d3.select(this).attr("fill-opacity",1).attr("fill","#1ACAFF").attr("stroke","blue");
		setInfoLabels(d);
		
		//d3.selectAll(".pointImage").attr("src",function() {return d.Picture;});
		//d3.select(this).attr("fill-opacity",1).attr("fill","#cF6").attr("stroke","#2ABD12");
		
	})
	.on("mouseout", function(d,i) {
		d3.select(this).attr("fill","white").attr("stroke","white").attr("fill-opacity",.5);
	});
	
	mpointsg
	.append("circle")
	.style("fill",function(d){
		return "url(#pattern"+d.Category+")";
	})
	.attr("cx", function (d) { 
		return projection([d.Long,d.Lat])[0]; 
	})
	.attr("cy", function (d) { 
		return projection([d.Long,d.Lat])[1];
	})
	.attr("r",14)
	.style("pointer-events","none");
	
	
	/*.append("g").attr("class","gTransform").selectAll("g").data(mapPoints);
	var mpointsEnter= mpoints.enter().append("g").attr("class",function(d){return "g"+d.Category});
	
	mpointsEnter.append("circle")
	.attr("width", 20)
    .attr("height", 20)
	.attr("cx", function (d) { 
		return projection([d.Long,d.Lat])[0]; 
	})
	.attr("cy", function (d) { 
		return projection([d.Long,d.Lat])[1];
	})
	.attr("r",2)
	.attr("fill","red")
	
	
	
	mpointsEnter.append("svg:foreignObject")
        .attr("width", 20)
        .attr("height", 20)
		.attr("x", function (d) { 
			return projection([d.Long,d.Lat])[0]-10; 
		})
		.attr("y", function (d) { 
			return projection([d.Long,d.Lat])[1]-10;
		})
		.style("pointer-events","none")
    .append("xhtml:span")
    .attr("class", function(d) {
    		return "control glyphicon glyphicon-"+glyph[d.Category];	
    });*/
	    
}

function setInfoLabels(d) {
	var mp = d3.select("#infoPoints");
		mp.selectAll(".pointTitle").text(d.Title);
		mp.selectAll(".pointCat").text(d.Category);
		mp.selectAll(".pointDesc").text(d.Description);
		mp.selectAll(".pointLoc").text(d.Location+", LA");
		mp.selectAll(".pointLink")
		.attr("href", function(){ 
			console.log(d.Link);
			if(d.Link=="") return "#"; 
			return d.Link;
		})
		.text(function() {
			if (d.Link=="" || d.Link==" ") return "";
			return "Website";
		})
}



function switchDistricts(i) {
	currentDistrict=i;
	resetMap();
	hideDistricts();
	switchHighlightedDistrict(i);
	var c=["#houseDistricts","#senateDistricts","#congressDistricts","#parishesDistricts"];
	d3.select(c[i]).style("visibility","visible").attr("stroke-width",".02%");
	if (i==0) setLegislator(legislators[0]);
	else setLegislator(legislators[numHouse]);
	// house
	//if(i==0){}
	// senate
	//else if (i==1){}
	// congress
	/*if (i==2 || i==3){
		d3.select(c[0]).style("fill-opacity",.5).style("visibility","visible");
		d3.select(c[1]).style("fill-opacity",.5).style("visibility","visible");
	}*/
	
}

function switchHighlightedDistrict(i) {
	// reset all DistrictButtonLabels
	d3.select("#districtsUl").selectAll("li").attr("class","");
	// color just the one that is selected
	var l = "#dl"+i;
	d3.select(l).attr("class","highlighted")
	// change label at top button
	var districtLabels=["House","Senate","Congress","Parishes"]
	d3.select("#districtButtonLabel").text(districtLabels[i]+ " ");
}
function switchHighlightedLayer(i) {
	d3.select("#layersUl").selectAll("li").attr("class","");
	var l = "#layer"+i;
	d3.select(l).attr("class","highlighted");
	// change label at top button
	var districtLabels=["Scorecard","","Brigades","Campaigns","Pollution"]
	d3.select("#layerButtonLabel").text(districtLabels[i]+ " ");
}

function hideDistricts() {
	d3.select("#houseDistricts").style("visibility","hidden");
	d3.select("#senateDistricts").style("visibility","hidden");
	d3.select("#congressDistricts").style("visibility","hidden");
	d3.select("#parishesDistricts").style("visibility","hidden");
}

function goToCoords(long,lat,scale) {
	var x=width/2 - projection([long,lat])[0]*scale;
	var y=height/2 - projection([long,lat])[1]*scale;
    zoomed([x,y],scale);
}
function goToPoint(xp, yp, scale) {
	var x = width/2 - xp*scale;
	var y = height/2 - yp*scale;
	zoomed([x,y],scale);
}
 

function switchLayers(layer) {
	resetLayers();
	showLayer(layer);
	switchHighlightedLayer(layer);
	currentLayer=layer;
}
function resetLayers() {
	resetLocks();
	resetPointInfo();
	for(i = 0; i < 5; i++) {
		hideLayer(i);
	}
}
function hideLayer(layer) {
	hideSidebar(layer);
	hideMapFeatures(layer);
}
function showLayer(layer) {
	showSidebar(layer);
	showMapFeatures(layer);
}
function hideMapFeatures(layer) {
	d3.select("#mapPoints").selectAll("g").style("visibility","hidden");
}
function showMapFeatures(layer) {
	// scorecard
	if(layer>1) d3.selectAll(".g"+mpointsLabels[layer-2]).style("visibility","visible");
}
function hideSidebar(layer){
	var sidebar = ["#legislatorStats","#districtInfo","#brigadeInfo","#campaignInfo","#pollutionInfo"];
	d3.select(sidebar[layer]).style("display","none");
}
function showSidebar(layer) {
	var sidebar = ["#legislatorStats","#districtInfo","#brigadeInfo","#campaignInfo","#pollutionInfo"];
	d3.select(sidebar[layer]).style("display","block");
}

function zoomed(translate, scale) {
  transformPaths(translate,scale);
  draggingCoords=translate;
  zoomScale=scale;
  zoom.translate(draggingCoords).scale(zoomScale);
}


function dragstarted() {
	d3.event.sourceEvent.stopPropagation(); // silence other listeners
	draggingOn=true;
	xMov=draggingCoords[0];
	yMov=draggingCoords[1];
}
function dragged() {
	xMov+=d3.event.dx;
	yMov+=d3.event.dy;
	transformPaths([xMov,yMov],zoomScale);	
}
function dragended() {
	draggingCoords[0]=xMov;
	draggingCoords[1]=yMov;
	zoom.translate(draggingCoords);
	draggingOn=false;
}



function transformPaths(translate, scale) {
	d3.select("#svgDiv").selectAll(".gTransform").attr("transform","translate("+translate+")scale("+scale+")");
	d3.select("#svgDiv svg").selectAll("image").attr("width",28/scale).attr("height",28/scale);
	//d3.select("#mapPoints").selectAll(".foreignObj").attr("width",20*scale).attr("height",20*scale);
	//d3.select("#mapPoints").selectAll(".foreignObj").attr("transform","translate("+[translate[0]-7*scale,translate[1]-7*scale]+")scale("+scale+")");
	//d3.select("#mapPoints").selectAll(".glyphicon-home").style("font-size",100.0/scale+"%");
	//.attr("transform","translate("+[translate[0]-7*scale,translate[1]-7*scale]+")scale("+scale+")");
	d3.select("#mapPoints").selectAll("circle").attr("r",14/scale).attr("stroke-width",2/scale);
	d3.select("#citiesLabels").selectAll("text").style("font-size",function(d,i){
		var size= (16-nums[i])/scale;
		if (size <1.2) size=1.2;
		return size;
		//return 12/scale;
	});
	d3.select("#citiesLabels").selectAll("text").style("visibility", function(d,i) {
		if (scale>= zoomToFactor) return "visible";
		else if(nums[i]<(scale) && scale>1) return "visible";
		else return "hidden";
	})
	d3.select("#citiesCircles").selectAll("circle")
	.style("visibility", function(d,i) {
		if (scale>= zoomToFactor) return "visible";
		else if(nums[i]<(scale) && scale>1) return "visible";
		else return "hidden";
	})
	.attr("r",2/scale)
	.attr("fill","white")
	.attr("stroke-width",1/scale)
	.attr("stroke","black")
}



/*force.on("tick", function(e) {
    var k = .1 * e.alpha;
    labels.forEach(function(o, j) {
        // The change in the position is proportional to the distance
        // between the label and the corresponding place (foci)
        o.y += (foci[j].y - o.y) * k;
        o.x += (foci[j].x - o.x) * k;
    });

    // Update the position of the text element
    svg.select("#citiesLabels").selectAll("text")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
});*/
//force.start();
var randomColor = (function(){
  var golden_ratio_conjugate = 0.618033988749895;
  var h = Math.random();

  var hslToRgb = function (h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
  };
  
  return function(){
    h += golden_ratio_conjugate;
    h %= 1;
    return hslToRgb(h, 0.5, 0.60);
  };
})();

function citySearch() {
	var city ="";
	var match = false;
    city = d3.select('#citySearchValue').node().value;
	labels.forEach(function(el) {
		if(city.toUpperCase() === el.label.toUpperCase()) {
			goToPoint(el.x,el.y,zoomToFactor);
			match=true;
			return;
		}
	})
	if(!match) resetCitySearch();
}

function resetPointInfo() {
	d3.select("#infoPoints").selectAll(".pointTitle").text("");
	d3.select("#infoPoints").selectAll(".pointLoc").text("Hover your mouse over a point...");
	d3.select("#infoPoints").selectAll(".pointDesc").text("");
	d3.select("#infoPoints").selectAll(".pointImage").attr("src","");
	d3.select("#infoPoints").selectAll(".pointLink").attr("href","#").text("");
}

function resetCitySearch() {
	alert("No results found. Enter a Louisiana city without any other address information.");
}

window.addEventListener('keypress', function (e) {
    if (e.keyCode == 13) {
        citySearch();
    }
}, false);