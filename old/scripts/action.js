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
var width=600;
var height=510;
var svg = d3.select("#svgDiv").append("svg").attr("height",height).attr("width",width).on("click",setDistrict(null));

// data variables
var legToLoad = [1,2,3,4]; // district #s = loadIDs House = loadIDs Senate - 105 = array index + 1
var allLegislators = new Array();
var allVotes = new Array();
var legislators = new Array();
var votes = new Array();
var voteLabels = new Array();
var numVotes = 17;
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1V0PnETCNZqXUdYFUJE7ndicyCmKJeVSkDAmRISRDzow/pubhtml';
var numLabels = 6;
var numHouse = 105;
var numSenate = 39;

// setup legislator stat/bar svg
var widthLegStats = 370;
var heightLegStats = 40;
var svgLegStats = d3.select("#legisBars").append("svg").attr("height", heightLegStats).attr("width", widthLegStats);
var images = new Array();

// sorting variables
var disAscend = true;
var lastAscend = true;
var cityAscend = true;
var scoreAscend = false;
var gradeAscend = true;
 
// bar variables
var barColors=["#2ABD12","red","lightgray"];
var widthFactor=widthLegStats/100;
var xBar = 0;
var yBar = 0;
var barWidth = 25;
var barSpace = 5;

// active legislator variables
var activeLegis;
var locked = false;
var map=true;
var activeLoadID = 1;

// active vote variables
var lockedVotes = false;
var clickedVote = null;
var highlightedVote = 0;
var activeColor = "#000000";
var lockedCat = false;

// setup rainbow gradient
var rainbow = new Rainbow();
rainbow.setSpectrum('red', 'yellow', 'green');
rainbow.setNumberRange(50, 100);

// voting labels variables
var colormap = {coast:"green",oil:"black",water:"blue",air:"lightblue",salt:"gray",other:"lightgray"};


// get things loaded
progressJs();
progressJs().start();
progressJs().set(10);
loadPaths();
progressJs().set(35);

// get legislator data and start using it
window.onload = function() { 
	progressJs().set(50);
	init(); 
};
function init() {
	Tabletop.init( { key: public_spreadsheet_url,
                 callback: showInfo} )
}
function showInfo(data, tabletop) {
	progressJs().set(70);
	legToLoad.sort(function(a,b){return a-b});
	allLegislators=tabletop.sheets("summary").all();
	allVotes=tabletop.sheets("votes").all();
	allLegislators.sort(function(a,b){return parseInt(a.loadID)-parseInt(b.loadID)});
	allVotes.sort(function(a,b){return parseInt(a.loadID)-parseInt(b.loadID)});
	if(getFileName()=="house") {
		legislators=allLegislators.slice(0,numHouse);
		votes=allVotes.slice(numLabels,numHouse+numLabels);
	}
	else if(getFileName()=="senate") {
		legislators=allLegislators.slice(numHouse,numHouse+numSenate);
		votes=allVotes.slice(numHouse+numLabels,numHouse+numSenate+numLabels);
	}
	else if (getFileName()=="action") {
		for (var i = 0; i < legToLoad.length; i++) {
			var index = legToLoad[i]-1;
			legislators[i] = allLegislators[index];
			votes[i] = allVotes[index+numLabels];
		}
	}
	voteLabels=allVotes.slice(0,numLabels);
	
	// load all the stuff that depends on legislator data
	progressJs().set(88);
	loadShapes();
	progressJs().set(90);
	// make stuff visible
	loadImages();
	progressJs().set(100).end();
	d3.select("#loadingMessage").remove();
	d3.select("#svgDiv").style("visibility","visible");
	d3.selectAll(".notVisible").attr("class","visible");
}


function loadPaths() {
	var jsonPaths = svg.append("g").attr("id","districts");

	// Create a unit projection.
	var projection = d3.geo.albers()
	    .scale(1)
	    .translate([0, 0]);

	// Create a path generator.
	var path = d3.geo.path()
	    .projection(projection);
		
	d3.json("json/"+getFileName()+".json", function(json) {
		
		var mScale = 0;
		var xTrans = 0;
		var yTrans = 0;
		
		// Compute the bounds of a feature of interest, then derive scale & translate.
		var b = path.bounds(json),
		    s = 1.0 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
		    t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
		// Update the projection to use computed scale & translate.
		projection
		    .scale(s-mScale)
		    .translate([t[0]-xTrans,t[1]-yTrans]);
		
		jsonPaths.selectAll("path")
		.data(json.geometries)
		.enter()
		.append("path")
		.attr("class",function(d,i){
			return "path"+i+1;
		})
		.attr("d",path);
	});
}
function loadImages() {
	legislators.forEach( function(d,i) {
		images[i] = new Image();
		images[i].src = d.Picture;
	});
}
function loadShapes() {
	loadLegislators();
	setDistricts();
	setTable();
	setVotes();
	setViews();	
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


function setViews() {
	var buttonWidth=100;
	var buttonSpacing=30;
	var buttonHeight=35;
	var colorOff="black";
	var colorOn="gray";
	
	d3.selectAll("#selectView input")
	.on("click", function(d,i) {
		d3.selectAll("#selectView label").attr("class","toggle-btn");
		if(i==0) {
			d3.select("#svgDiv").attr("class","visible");
			d3.select("#legisTable").attr("class","hidden");
			d3.select(this.parentNode).attr("class","toggle-btn success");
			d3.select("#container").style("height","550px");
		}
		else {
			d3.select("#svgDiv").attr("class","hidden");
			d3.select("#legisTable").attr("class","visible");
			d3.select(this.parentNode).attr("class","toggle-btn success");
			d3.select("#container").style("height","170px");
		}
		map=!map;
	});
}
function setDistricts() {
	
	var paths = d3.select("#districts").selectAll("path").attr("fill","lightgray");
	for (var i = 0; i < legToLoad.length; i++) {
		var pathID = "path" + legToLoad[i];
		d3.select("#districts").select("."+pathID)
		.attr("fill", function() {
			var score = parseInt(legislators[i].Score); 
			if(isNaN(score)) score=0; 
			return '#'+rainbow.colourAt(score);
		})
		.attr("stroke","black")
		.attr("stroke-width",".02%")
		.on("mouseout", function() { 
			if(this!=activeLegis && !locked) {
				d3.select(this)
				.attr("fill", function(){
					var score = parseInt(legislators[i].Score); 
					if(isNaN(score)) score=0; 
					return '#'+rainbow.colourAt(score);
				});
			}})	
		.on("mouseover", function() { 
			if(this!=activeLegis && !locked){
			d3.select(this)
				.attr("fill","orange");	
			}
			if(!locked) setLegislator(legToLoad[]);
		})
		.on("click", function() {
			clickedDistrict(this);
			if(locked){
				setLegislator(legToLoad[i]);
				d3.select("#svgDiv svg").transition().attr("class","boxed");
			}
			else {
				d3.select("#svgDiv svg").transition().attr("class","");
			}
		});
	} 
}
function setLegislator(d) {
	activeLoadID = d.loadID;
	d3.select("#barPerc").text(function() {return "supported "+d.Supported+ "%, opposed " + d.Opposed+ "%, absent " + d.Absent+"% ";});
	d3.select("body").selectAll(".legisName").text(function() {return d.First+ " " + d.Last;});
	d3.select("body").selectAll(".legisDistrict").text(function() {return " "+d.District;});
	d3.select("body").selectAll(".legisCity").text(function() {return " "+d.City;});
	d3.select("body").selectAll(".legisEmail").text(function() {return " "+d.Email;});
	d3.select("body").selectAll(".legisPhone").text(function() {return " "+d.Phone;});
	d3.select("body").select(".legisImage").attr("src",function() {return d.Picture;});
	d3.select("body").selectAll(".colorScore").transition().style("color", getGradeColor(d));
	d3.select("body").selectAll(".legisGrade").transition().text(function() {return d.Grade;})
	d3.select("body").selectAll(".legisScore").transition().text(function() {return d.Score;});
	
	// setup bar percentage chart
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
		//.attr("y", function() {return yBar-parseInt(d.Opposed)*widthFactor;});
	
	resetRows();
	hideVoteChart();
	d3.select("#row"+d.loadID)
	.attr("class","rowHighlight");
	d3.select("#g"+d.loadID).attr("class","visible");	
	setHighlightVote(highlightedVote);
}
 


// The table generation function
function setTable() {
	var columnWidths=[9,14,8,15,5,12,12];
	var columns = ["First","Last","District","City","Score","Grade"];
	var columnFactor=9;
	//var columns = Object.keys(legislators[0]);
	//columns=columns.slice(0,6);
    var table = d3.select("#legisTable").append("table");
	var thead = table.append("thead");
	var tbody= table.append("tbody");	
    // append the header row

	thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
		.attr("width",function(d,i){
			return columnWidths[i]*columnFactor;
		})
        .text(function(column) {
			return column; 
		})
		.attr("class",function(column) {
			if(column=="Last"||column=="City"||column=="District"||column=="Score"||column=="Grade")
			return "headerClickable";
		})
		.on("click",function(column){setSorting(column)});
		

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(legislators)
        .enter()
        .append("tr")
		.attr("id",function(d){
			return "row" + d.loadID;
		}) 
		.on("mouseover", function(d) {
			if(!locked){
				d3.select(this)
				.attr("class","rowHighlight");
				setLegislator(d);
			}
		})
		.on("mouseout", function(d,i){
			if(!locked){
				resetRows();
			}
		})
		.on("click", function(d) {
			if(d!=activeLegis) {
				activeLegis = d;
				locked=true;
				setLegislator(d);
			}
			else if(d==activeLegis) {
				locked=false;
			}	
		});
		
	resetRows();

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append("td")
        .html(function(d) { return d.value; })
		.attr("width",function(d,i){
			return columnWidths[i]*columnFactor;
		});	
}



///////////////////
// HELPER FUNCTIONS
///////////////////
// sorting functions
function setSorting (column) {
	if(column=="Last") {
		lastAscend =! lastAscend;
		sortLast();
	}
	else if(column=="District") {
		disAscend =! disAscend;
		sortDistrict();
	}
	else if(column=="Score") {
		scoreAscend =! scoreAscend;
		sortScore();
	}
	else if(column=="City"){
		cityAscend =! cityAscend;
		sortCity();
	}
	else if(column=="Grade"){
		gradeAscend =! gradeAscend;
		sortGrade();
	}
}
function sortLast() {
	d3.select("#legisTable").selectAll("tbody tr") 
        .sort(function(a, b) {
			if(lastAscend) return d3.descending(a.Last, b.Last);
            else return d3.ascending(a.Last, b.Last);
    })
	colorRows();
}
function sortDistrict() {
	d3.select("#legisTable").selectAll("tbody tr") 
        .sort(function(a, b) {
			if(disAscend) return d3.descending(parseInt(a.District), parseInt(b.District));
            else return d3.ascending(parseInt(a.District), parseInt(b.District));
    })
	colorRows();
}
function sortCity() {
	d3.select("#legisTable").selectAll("tbody tr") 
        .sort(function(a, b) {
			if(cityAscend) return d3.descending(a.City, b.City);
            else return d3.ascending(a.City, b.City);
    })
	colorRows();
}
function sortScore() {
	d3.select("#legisTable").selectAll("tbody tr") 
        .sort(function(a, b) {
			if(scoreAscend) return d3.descending(parseInt(a.Score), parseInt(b.Score));
            else return d3.ascending(parseInt(a.Score), parseInt(b.Score));
    })
	colorRows();
}
function sortGrade() {
	d3.select("#legisTable").selectAll("tbody tr") 
        .sort(function(a, b) {
			if(gradeAscend) return d3.descending(a.Grade, b.Grade);
            else return d3.ascending(a.Grade, b.Grade);
    })
	colorRows();
}
function colorRows() {
	d3.select("#legisTable").selectAll("tbody tr") 
	.attr("class",function(d,i){
		if(i%2==0)return "evenRow";
		else return "oddRow";
	});
}

// reset functions
function resetRows() {
	d3.select("#legisTable table").selectAll("tr")
	.attr("class",function(d,i){
		if(i%2==0)return "evenRow";
		else return "oddRow";
	});
}
function hideVoteChart() {
	d3.select("#voteBlocks").selectAll("g").attr("class","hidden");
}

function clickedDistrict(d) {
  var x, y, k;

  if (d && activeLegis !== d) {
	bbox = d.getBBox();
	x=bbox.x + bbox.width/2;
	y=bbox.y + bbox.height/2;
	k=3;
    activeLegis = d;
	locked=true;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    activeLegis = null;
	locked=false;
  }
  getCenter(d);

  d3.select("#districts").transition()
      .duration(750)
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
	  
  d3.select("#districtLabels").transition()
      .duration(750)
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}

// get functions
function getFileName() {
	var url = window.location.pathname;
	var filename = url.substring(url.lastIndexOf('/')+1);
	filename=filename.slice(0,-5);
	if(filename=="") filename = "house";
	else if(filename=="index") filename = "house";
	return filename;
}
function getGradeColor(d) {
	var gradeColor=["#2ABD12","#2ABD12","orange","orange","red"];
	if(d.Grade=="A") return gradeColor[0];
	else if (d.Grade=='B') return gradeColor[1];
	else if (d.Grade=='C') return gradeColor[2];
	else if (d.Grade=='D') return gradeColor[3];
	else if (d.Grade=='F') return gradeColor[4];
	else return "";
}

function getCenter(d) {
	bbox = d.getBBox();
	x=bbox.x + bbox.width/2;
	y=bbox.y + bbox.height/2;
	var pts = [x,y];
	return pts;
}
function jumpScroll(h) {
   	window.scroll(0,parseInt(h)); // horizontal and vertical scroll targets
}

