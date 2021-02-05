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
	svg = d3.select("#svgDiv").append("svg").attr("height",height).attr("width",width);

// variables to keep track of button states
var houseOn=true, scorecardOn = true, brigadesOn = true, parishesOn = false, pollutionOn = false;

// setup rainbow gradient
var rainbow = new Rainbow();
	rainbow.setSpectrum('red', 'yellow', 'green');
	rainbow.setNumberRange(50, 100);


var numLegislators = 144;
var numHouse = 105;
var legislators, mapPoints;

// Create a unit projection.
var projection = d3.geo.albers()
    .scale(7190)
    .translate([-253.6512, -708.433]);

// setup legislator stat/bar svg
var widthLegStats = 370, heightLegStats = 40,
	svgLegStats = d3.select("#legisBars").append("svg").attr("height", heightLegStats).attr("width", widthLegStats),
	images = new Array(),

// bar variables #FFD94A
	barColors=["#2ABD12","red","#CF6"],
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

// sorting variables
	disAscend = false,
	lastAscend = true,
	cityAscend = true,
	scoreAscend = false,
	gradeAscend = true,

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
	lockedCat = false


// get things loaded
loadData();
function loadingDone() {
	setVotes();
	setTable();
	loadLegislators();
	switchChamber(0);
	d3.select("#loadingMessage").remove();
	d3.selectAll(".notVisible").attr("class","visible");
}
function loadData() {
	var remaining = 2;
	var houseDistricts = 105, 
		senateDistricts = 39,
		parishes = 64,
		numLabels = 6;
	d3.tsv("data/legislators.tsv", function(data) {
		legislators = data;
		legislators=legislators.sort(function(a,b){return parseInt(a.loadID)-parseInt(b.loadID)});
		legislators=legislators.slice(0,numLegislators);
		if (!--remaining) loadingDone();
	});
	d3.tsv("data/votes.tsv", function(error, data) {
		votes = data.sort(function(a,b){return parseInt(a.loadID)-parseInt(b.loadID)});
		voteLabels= votes.slice(0,numLabels);
		votes = votes.slice(numLabels,numLegislators+numLabels);
		houseVotes = votes.slice(0,houseDistricts);
		senateVotes = votes.slice(houseDistricts,houseDistricts+senateDistricts);
		if (!--remaining) loadingDone();
	})
}

/////////SAME AS MAP.JS/////////////////////
function setLegislator(d) {
	activeLoadID = parseInt(d.loadID);
	activeDistrict = parseInt(d.District);
	d3.select("#barPerc").text(function() {return "supported "+d.Supported+ "%, opposed " + d.Opposed+ "%, absent " + d.Absent+"% ";});
	d3.select("body").selectAll(".legisName").text(function() {return d.First+ " " + d.Last;});
	d3.select("body").selectAll(".legisDistrict").text(function() {return " "+d.District;});
	d3.select("body").selectAll(".legisCity").text(function() {return " "+d.City;});
	d3.select("body").selectAll(".legisEmail").text(function() {return " "+d.Email;});
	d3.select("body").selectAll(".legisPhone").text(function() {return " "+d.Phone;});
	d3.select("body").select(".legisImage").attr("src",function() {return "/images/placeholder.jpg"}); //{return d.Picture;});
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

//vote colors
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
	if(houseOn) {
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
	else if(parseInt(val)==0) return "#CF6";
	else if(parseInt(val)>0) return "#2ABD12"; 
	return "#F00000";
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
/////////////END SAME AS MAP.JS/////////////////

/* button logic - swtiching layers */
function chamberButtonLogic(i) {
	d3.select("#chamberButtons").selectAll("button").attr("class","btn btn-lg btn-default");
	switchChamber(i);
	if(i==0) {
		d3.select("#houseButton").attr("class","btn btn-lg btn-default active");
	}
	else if (i==1) {
		d3.select("#senateButton").attr("class","btn btn-lg btn-default active");
	}
}
function switchHighlightedChamber(i) {
	// reset all DistrictButtonLabels
	d3.select("#districtsUl").selectAll("li").attr("class","");
	// color just the one that is selected
	var l = "#dl"+i;
	d3.select(l).attr("class","highlighted")
	// change label at top button
	var districtLabels=["House","Senate"]
	d3.select("#districtButtonLabel").text(districtLabels[i]+ " ");
}
function switchChamber(i) {
	switchHighlightedChamber(i);
	// house
	if(i==0) {
		houseOn=true;
		d3.select("#legisTable").selectAll(".senate").style("display","none");
		d3.select("#legisTable").selectAll(".house").style("display","block").style("fill-opacity",1).attr("stroke-width",".02%");
	}
	// senate
	else if (i==1) {
		houseOn=false;
		d3.select("#legisTable").selectAll(".house").style("display","none");
		d3.select("#legisTable").selectAll(".senate").style("display","block").style("fill-opacity",1).attr("stroke-width",".02%");
	}
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
				//var str = d3.select(this).attr("class");
				//str += " rowHightlight";
				//d3.select(this).attr("class",str);
				d3.select(this).attr("class","rowHighlight");
				setLegislator(d);
			}
		})
		.on("mouseout", function(d,i){
			if(!locked){
				//var str = d3.select(this).attr("class");
				//str=str.substring(0,str.length - 14);
				//d3.select(this).attr("class", str);
			
				colorRows();
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
		
	colorRows();

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
	var j=0;
	var k=0;
	d3.select("#legisTable").selectAll("tbody tr") 
	.attr("class",function(d,i){
		var str = this.id;
		var str = parseInt(this.id.slice(3));
		if(str < 106) {
			j++;
			if(j%2==0)return "house evenRow";
			else return "house oddRow";
		}
		else {
			k++;
			if(k%2==0)return "senate evenRow";
			else return "senate oddRow";
		}	
	});
}









