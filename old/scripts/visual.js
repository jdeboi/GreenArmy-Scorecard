

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
var width=600,
	height=510,
	svg = d3.select("#svgDiv").append("svg").attr("height",height).attr("width",width).on("click",clickedDistrict(null)),

// data variables
	allLegislators = new Array(),
	allVotes = new Array(),
	legislators = new Array(),
	votes = new Array(),
	voteLabels = new Array(),
	numVotes = 17,
	public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1V0PnETCNZqXUdYFUJE7ndicyCmKJeVSkDAmRISRDzow/pubhtml',
	numLabels = 6,
	numHouse = 105,
	numSenate = 39,
	keys = new Array(),


// setup legislator stat/bar svg
	widthLegStats = 370,
	heightLegStats = 40,
	svgLegStats = d3.select("#legisBars").append("svg").attr("height", heightLegStats).attr("width", widthLegStats),
	images = new Array(),

// sorting variables
	disAscend = true,
	lastAscend = true,
	cityAscend = true,
	scoreAscend = false,
	gradeAscend = true,
 
// bar variables
	barColors=["#2ABD12","red","lightgray"],
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
	activeDistrict = 1;

// active vote variables
var lockedVotes = false;
var clickedVote = null;
var highlightedVote = 0;
var highlightedVoteColor = 0;
var activeColor = "#000000";
var lockedCat = false;

// setup rainbow gradient
var rainbow = new Rainbow();
	rainbow.setSpectrum('red', 'yellow', 'green');
	rainbow.setNumberRange(50, 100);

// voting labels variables
	colormap = {coast:"green",oil:"black",water:"blue",air:"lightblue",salt:"gray",other:"lightgray"};
// long, lat
	coords = [-90.103587,29.930739];

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
	allLegislators=tabletop.sheets("summary").all();
	allVotes=tabletop.sheets("votes").all();
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
		
	var point = projection(coords);	
		
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
			.attr("d",path);
		//.call(zoom);
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
	.on("mouseout", function(d,i) { 
		if(this!=activeLegis && !locked && !lockedVotes) {
			d3.select(this)
			.attr("fill", function(d) {
				var score = parseInt(d.Score);
				if(isNaN(d.Score)) score=0; 
				return '#'+rainbow.colourAt(score);
			});
		}
		else if(lockedVotes) {
			
			setPathVoteColors(clickedVote);
		}
	})	
	.on("mouseover", function(d) { 
		if(this!=activeLegis && !locked){
		d3.select(this)
			.attr("fill","lightgray");	
		}
		if(!locked) setLegislator(d);
	})
	.on("click", function(d,i) {
		clickedDistrict(this);
		if(locked && !lockedVotes){
			setLegislator(d);
			var districts = d3.select("#districts").selectAll("path");
			districts.transition().attr("fill", function(d) {return '#F0F0F0';})
			d3.select(this).transition().attr("fill", function(d) {
				var score = parseInt(d.Score);
				if(isNaN(score)) score=0; 
				return '#'+rainbow.colourAt(score);});
			d3.select("#svgDiv svg").transition().attr("class","boxed");
		}
		else if (locked && lockedVotes) {
			setLegislator(d);
			var districts = d3.select("#districts").selectAll("path");
			d3.select("#svgDiv svg").transition().attr("class","boxed");
		}
		else if (!locked && lockedVotes) {
			setPathVoteColors(clickedVote);
			d3.select("#svgDiv svg").transition().attr("class","");
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
	activeLoadID = parseInt(d.loadID);
	activeDistrict = parseInt(d.District);
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
	setHighlightColor(highlightedVoteColor);
}
 


// The table generation function
function setTable() {
	var columnWidths=[12,15,12,18,9,15];
	var columns = ["First","Last","District","City","Score"];
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
	
	var widthChart = 400;
	var rectSpace = 5;
	var pad = 4;
	var rectWidth = 30;
	var rectHeight = rectWidth;
	var numLine = parseInt((widthChart-2*pad)/(rectSpace+rectWidth));
	var heightChart = (parseInt(numVotes/numLine)+1)*(rectHeight+rectSpace)+pad;
	keys =(d3.keys(votes[1]).splice(3,numVotes+3));
	keys.forEach(function(d,i){
		if(votes[10][d]=="-"){
			numVotes--;
			keys.splice(i,1);
		}
	});
	var rows= d3.select("#voteChart").append("svg").attr("height",heightChart).attr("width",widthChart).append("g").attr("id","voteBlocks")
	.selectAll("g").data(votes).enter().append("g")
	.attr("id",function(d) {
		return "g" + d.loadID;
	});
	
	var boxes = rows.selectAll("rect")
	.data(function(d) {
		var i = 0;
		console.log(d[0]);
        var test = keys.map(function(column) {
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
	/*.on("mouseout",function(d,i){
		if(!lockedVotes) {
			d3.select(this).attr("fill",function(){
				return getVoteColor(d.value);
			});
		}	
	})*/
	.on("click", function(d,i) {
		setVoteClick(d.column,i);
		//setHighlightColor(i);
		
	});
	d3.select("#voteChart").select("#voteBlocks g").attr("class","visible");
	setVoteText("v1");
	setHighlightColor(0);
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
	.attr("stroke-width","4")
}
function resetHighlightVotes(){
	d3.select("#voteBlocks").selectAll("rect")
	.attr("stroke-width","0");
}
function setHighlightColor(i) {
	highlightedVoteColor=i;
	resetVoteColors();
	var key = keys[i];
	d3.select("#voteBlocks").selectAll(".rect"+i)
	.attr("fill",function() {
		return getShadeColor(getVoteColor(votes[activeDistrict-1][key]),-.40);
	});
}
function resetVoteColors() {
	d3.select("#voteBlocks").selectAll("rect") 
	.attr("fill", function(d,i){
		var index = keys[i%numVotes];
		return getVoteColor(votes[parseInt(i/numVotes)][index]);
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
function resetPathColors() {
	d3.select("#districts").selectAll("path")
	.attr("fill", function(d,i) {
		var score = parseInt(legislators[i].Score);
		if(isNaN(score)) score=0; 
		return '#'+rainbow.colourAt(score);
	});
}
function setPathVoteColors(v) {
	d3.select("#districts").selectAll("path")
	.attr("fill", function(d,i) {
		var val = votes[i][v];
		if(val == 0) return "lightgray";
		else if (val < 0) return "red";
		else if (val > 0) return "#2ABD12";
		else return "gray";
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
  //getCenter(d);

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
function getVoteColor(val) {
	if (isNaN(parseInt(val))) return "#D3D3D3";
	else if(parseInt(val)==0) return "#D3D3D3";
	else if(parseInt(val)>0) return "#2ABD12"; 
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


function getLabelInfo(obj, index) {
	var value = "";
	for (var key in obj) {
		if (key==index)  value= obj[key];
	}
	return value;
}




