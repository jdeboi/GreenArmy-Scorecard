var imagesPre = new Array();
var images = new Array();
preload(
	"images/kathy.jpg",
	"images/bkclap.jpg",
	//"images/general.jpg",
	"images/logogreenarmy.png"
)
function preload() {
	for (i = 0; i < preload.arguments.length; i++) {
		imagesPre[i] = new Image();
		imagesPre[i].src = preload.arguments[i];
		images.push(preload.arguments[i]);
	}
}
			
$(window).load(function() {          
  var i =0;
  var image = $('#darken');
                //Initial Background image setup
  image.css('background-image', 'url(images/generalfullsmall.jpg)');
                //Change image at regular intervals
	setInterval(function(){  
		image.fadeOut(200, function () {
  			image.css('background-image', 'url(' + images [i++] +')');
   		 	image.fadeIn(200);
   	 	});
   	 	if(i == images.length) i = 0;
  	}, 3000);           
});