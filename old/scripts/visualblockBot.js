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
var width=680;
var height=6.0/8*width;
var svg = d3.select("#svgDiv").append("svg").attr("height",height).attr("width",width);

// data variables
var allLegislators = new Array();
var allVotes = new Array();
var legislators = new Array();
var votes = new Array();
var voteLabels = new Array();
var numVotes = 17;
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1V0PnETCNZqXUdYFUJE7ndicyCmKJeVSkDAmRISRDzow/pubhtml';

// setup legislator stat/bar svg
var widthLegStats = 370;
var heightLegStats = 50;
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
var heightFactor=widthLegStats/100;
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

// vote global variables
var widthChart = 972
var rectSpace = 5;
var pad = 50;
var rectWidth = (widthChart-(pad*2))/(numVotes)-rectSpace;
var rectHeight = rectWidth;


// get things loaded
loadPaths();
loadImages();

// get legislator data and start using it
window.onload = function() { init() };
function init() {
	Tabletop.init( { key: public_spreadsheet_url,
                 callback: showInfo} )
}
function showInfo(data, tabletop) {
	allLegislators=tabletop.sheets("summary").all();
	allVotes=tabletop.sheets("votes").all();
	allLegislators.sort(function(a,b){return parseInt(a.loadID)-parseInt(b.loadID)});
	allVotes.sort(function(a,b){return parseInt(a.loadID)-parseInt(b.loadID)});
	if(getFileName()=="house") {
		legislators=allLegislators.slice(0,105);
		votes=allVotes.slice(6,111);
	}
	else if(getFileName()=="senate") {
		legislators=allLegislators.slice(105,144);
		votes=allVotes.slice(111,150);
	}
	voteLabels=allVotes.slice(0,6);
	
	// load all the stuff that depends on legislator data
	loadShapes();
	
	// make stuff visible
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
			console.log(s);
		// Update the projection to use computed scale & translate.
		projection
		    .scale(s-mScale)
		    .translate([t[0]-xTrans,t[1]-yTrans]);
		
		jsonPaths.selectAll("path")
		.data(json.geometries)
		.enter()
		.append("path")
		.attr("d",path);
	});
}
function loadImages() {
	legislators.forEach( function(i) {
		images[i] = new Image()
		images[i].src = i.Picture;
	});
	
}
function loadShapes() {
	loadLegislators();
	setDistricts();
	setTable();
	setVotes();
	setViews();	
	setCategories();
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
	
	var paths = d3.select("#districts").selectAll("path");
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
	.on("mouseout", function(d) { 
		if(this!=activeLegis && !locked) {
			d3.select(this)
			.attr("fill", function(d) {
				var score = parseInt(d.Score);
				if(isNaN(d.Score)) score=0; 
				return '#'+rainbow.colourAt(score);})
		}})	
	.on("mouseover", function(d) { 
		if(this!=activeLegis && !locked){
		d3.select(this)
			.attr("fill","lightgray");	
		}
		if(!locked) setLegislator(d);
	})
	.on("click", function(d,i) {
		clickedDistrict(this);
		if(locked){
			setLegislator(d);
			var districts = d3.select("#districts").selectAll("path");
			districts.transition().attr("fill", function(d) {return '#F0F0F0';})
			d3.select(this).transition().attr("fill", function(d) {
				var score = parseInt(d.Score);
				if(isNaN(score)) score=0; 
				return '#'+rainbow.colourAt(score);});
			d3.select("#svgDiv svg").transition().attr("class","boxed");
		}
		else {
			d3.select("#districts").selectAll("path").transition().attr("fill",function(d) {
				var score = parseInt(d.Score);
				if(isNaN(score)) score=0; 
				return '#'+rainbow.colourAt(score);}); 
			d3.select("#svgDiv svg").transition().attr("class","");
		}
	}); 
	
	//setDistrictLabels();
}
function setLegislator(d) {
	activeLoadID = d.loadID;
	
	d3.select("#barPerc").text(function() {return "supported "+d.Supported+ "%, opposed " + d.Opposed+ "%, absent " + d.Absent+"% ";});
	d3.select("body").selectAll(".legisName").text(function() {return d.First+ " " + d.Last;});
	d3.select("body").selectAll(".legisDistrict").text(function() {return " "+d.District;});
	d3.select("body").selectAll(".legisCity").text(function() {return " "+d.City;});
	d3.select("body").selectAll(".legisEmail").text(function() {return " "+d.Email;});
	d3.select("body").selectAll(".legisPhone").text(function() {return " "+d.Phone;});
	d3.select("body").selectAll(".legisImage").attr("src",function() {return d.Picture;});
	d3.select("body").selectAll(".colorScore").transition().style("color", getGradeColor(d));
	d3.select("body").selectAll(".legisGrade").transition().text(function() {return d.Grade;})
	d3.select("body").selectAll(".legisScore").transition().text(function() {return d.Score;});
	
	// setup bar percentage chart
	d3.select("#bar0")
		.transition()
		.attr("width", function() {return parseInt(d.Supported)*heightFactor;})
		.attr("x", xBar)
	d3.select("#bar1")
		.transition()
		.attr("width", function() {return parseInt(d.Opposed)*heightFactor;})
		.attr("x", function() {return xBar+parseInt(d.Supported)*heightFactor;});
	d3.select("#bar2")
		.transition()
		.attr("width", function() {return parseInt(d.Absent)*heightFactor;})
		.attr("x",function() {return xBar+(parseInt(d.Opposed)+parseInt(d.Supported))*heightFactor;});
		//.attr("y", function() {return yBar-parseInt(d.Opposed)*heightFactor;});
	
	resetRows();
	hideVoteChart();
	d3.select("#row"+d.loadID)
	.attr("class","rowHighlight");
	d3.select("#g"+d.loadID).attr("class","visible");	
	setHighlightVote(highlightedVote);
}

function setCategories() {
	d3.select("#votingRecord").selectAll("li")
	.on("click", function(d,i){
		lockedCat = d;
		var cats = d3.keys(colormap);
		var index = "#g"+activeLoadID;
		highlightedVote = null;
		var votes = d3.select(index).selectAll("rect");
		if(i==0) {
			setHighlightVote(0);
			resetVotePositions();
		}
		else {
			var xp = pad;
			votes.each(function(r,j) {
				var cl = "rect"+j;
				if(cats[i-1] == getLabelInfo(voteLabels[1],j)) {
					if(highlightedVote == null) setHighlightVote(j);
					cl+= " visible";
					console.log(this + " "+xp);
					xp+=(rectSpace+rectWidth);
					d3.select(this).transition().attr("x",xp);
				}
				else cl+= " hidden";
				d3.select(this).transition().attr("class",cl);
			});
		}
	});
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
function setVotes() {
	var keys =(d3.keys(votes[1]).splice(3,numVotes+3));
	
	var rows= d3.select("#voteChart").append("svg").attr("height","120").attr("width",widthChart).append("g").attr("id","voteBlocks")
	.selectAll("g").data(votes).enter().append("g")
	.attr("id",function(d) {
		return "g" + d.loadID;
	})
	//.attr("class","hidden");
	
	var boxes = rows.selectAll("rect")
	.data(function(d) {
        return keys.map(function(column) {
            return {column: column, value: d[column]};
        });
    })
	.enter()
	.append("rect")
	.attr("x", function(d,i){
		return i*(rectSpace+rectWidth)+pad;
	})
	.attr("class",function(d,i){return "rect"+i})
	.attr("data-cat", function(d,i) {
		return getLabelInfo(voteLabels[1],i);
	})
	.attr("y",5)
	.attr("height",rectHeight)
	.attr("width",rectWidth)
	.attr("stroke","black")
	.attr("stroke-width",0)
	.attr("fill", function(d) {
		return getVoteColor(d);
	})
	.on("mouseover", function(d,i){
		if(!lockedVotes) {
			d3.select(this).attr("fill",function(){
				return getShadeColor(getVoteColor(d),-.40);});
			setHighlightVote(i);
			setVoteText(i);	
		}
		
	})
	.on("mouseout",function(d,i){
		if(!lockedVotes) {
			d3.select(this).attr("fill",function(){
				return getVoteColor(d);
			});
		}	
	})
	.on("click", function(d,i) {
		setVoteClick(i);
	});
	d3.select("#voteChart").select("#voteBlocks g").attr("class","visible");
	loadVoteLabels();
	setVoteText(0);
	setHighlightVote(0);
}

function resetVotePositions() {
	var index = "#g"+activeLoadID;
	d3.select(index).selectAll("rect").transition().attr("x", function(d,i){
		return i*(rectSpace+rectWidth)+pad;
	})
}
function setDistrictLabels() {
	var labels = d3.select("#svgDiv svg").append("g");
	labels.attr("id","districtLabels");
	labels.selectAll("text").data(legislators).enter().append("text")
	.text(function(d,i){
		return i+1;
	})
	.style("pointer-events","none")
	.attr("font-size", "6px")
	.attr("x",function(d,i) {
		var index = ".path" +i;
		var p = d3.select("#districts").select(index);
		p = p[0][0];
		var x = getCenter(p)[0];
		return x;
	})
	.attr("y",function(d,i) {
		var index = ".path" +i;
		var p = d3.select("#districts").select(index);
		p = p[0][0];
		var y = getCenter(p)[1];
		return y;
	});
	
}
function setHighlightVote(i) {
	highlightedVote=i;
	resetHighlightVotes();
	d3.select("#voteBlocks").selectAll(".rect"+i)
	.attr("class","highlightedVote")
	.attr("stroke-width","4")
}

function resetHighlightVotes(){
	d3.select("#voteBlocks").selectAll("rect")
	.attr("class",function(d,i){
		var name = "rect"+i%numVotes;
		return name;
	})
	.attr("stroke-width","0");
	//d3.select("#voteBlocks").selectAll("rect"+highlightedVote).attr("stroke-width","0");
	//d3.select("#voteBlocks").selectAll("rect")("class","highlightedVote");
}

function loadVoteLabels() {
	var widthChart = 972
	var rectSpace = 5;
	var pad = 50;
	var rectWidth = (widthChart-(pad*2))/(numVotes)-rectSpace;
	var rectHeight = 10;
	var keys=(d3.keys(votes[1]).splice(3,numVotes+3));
	d3.select("#voteChart svg").append("g").attr("class","visible").selectAll("rect").data(keys).enter().append("rect")
	.attr("x", function(d,i){
		return i*(rectWidth+rectSpace)+pad;
	})
	.attr("y",65)
	.attr("height",rectHeight)
	.attr("width",rectWidth+rectSpace)
	.attr("fill",function(d,i){
		return getVoteStrokeColor(i);
	});
}
function setVoteText(i) {
	d3.select("#billName").text(function(){
		return getLabelInfo(voteLabels[0],i);
	});
	d3.select("#billGenre").text(function(){
		return getLabelInfo(voteLabels[2],i);
	});
	d3.select("#billNum").text(function(){
		return getLabelInfo(voteLabels[3],i);	
	});
	d3.select("#billGAPos").text(function(){
		return getLabelInfo(voteLabels[4],i);	
	});
	d3.select("#billNotes").text(function(){
		return getLabelInfo(voteLabels[5],i);	
	});
}

function setVoteClick(d) {
	if(clickedVote !== d) {
		clickedVote=d;
		lockedVotes=true;
	}
	else {
		clickedVote=null;
		lockedVotes=false;
	}
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
function getVoteColor(d) {
	if (isNaN(parseInt(d.value))) return "#D3D3D3";
	else if(parseInt(d.value)==0) return "#F0E400";
	else if(parseInt(d.value)>0) return "#2ABD12"; 
	return "#F00000";
}
function getShadeColor(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}
function blendColors(c0, c1, p) {
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
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

function getVoteStrokeColor(i) {
	return colormap[getLabelInfo(voteLabels[1],i)];
}


function getLabelInfo(obj, i) {
	var index = "v"+(i+1);
	var value = "";
	for (var key in obj) {
		if (key==index)  value= obj[key];
	}
	return value;
}


