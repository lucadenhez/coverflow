var songUrls = [];
var globalIndex;

//  --- Begin Config ---
var loadingMessageDelay = 2000;       // How long to wait before showing loading message (in ms)
var loadingMessageSpeed = 1200;       // Duration of each pulse in/out of the loading message (in ms)
var loadingMessageMinOpacity = 0.4;   // Minimum opacity of the loading message
var loadingMessageMaxOpacity = 1;     // Maximum opacity of the loading message
var bgRotateAngle = 65;               // Rotation angle of background slides (in degrees)
var stepPercent = 15;                 // Horiz gap between background slides (as % of window height)
var currentSlidePaddingPercent = 70;  // Horiz gap between current slide and background slides (as % of window height)
var swipeXThreshold = 30;             // X-axis minimum threshold for swipe action (in px) 
var swipeYThreshold = 90;             // Y-axis maximum threshold for swipe action (in px) 
var leftKeyCode = 37;                 // Character code for "move left" key (default: left arrow)
var rightKeyCode = 39;                // Character code for "move right" key (default: right arrow)
//  --- End Config ---

var currentSlide = 1;                 // The slide that the user is currently viewing
var oldCurrentSlide = currentSlide;   // The previous slide that the user viewed
var totalSlides = 0;                  // Total number of slides in the gallery (computed later)
var flipTimeouts = new Array;         // For storing the timeout IDs so we can clear them

//PRIVATE (DO NOT SHARE)

var bearer = Cookies.get('bearerToken');
var token = Cookies.get('mediaToken');

if ((bearer == null) || (token == null)) {
  window.location.replace("login.html");
}

var headers = { "authorization" : "Bearer " + bearer, "media-user-token" : token };
var query = "?include[library-albums]=artists&include[library-artists]=catalog&fields[artists]=url&fields%5Balbums%5D=artistName%2CartistUrl%2Cartwork%2CcontentRating%2CeditorialArtwork%2CeditorialNotes%2Cname%2CplayParams%2CreleaseDate%2Curl&includeOnly=catalog%2Cartists&limit=25";
var altQuery = "https://amp-api.music.apple.com/v1/me/library/recently-added?l=en-us&platform=web&include[library-albums]=artists&include[library-artists]=catalog&fields[artists]=url&fields%5Balbums%5D=artistName%2CartistUrl%2Cartwork%2CcontentRating%2CeditorialArtwork%2Cname%2CplayParams%2CreleaseDate%2Curl&includeOnly=catalog%2Cartists&limit=25";

String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};

function getCovers() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var rjson = JSON.parse(xhr.responseText);  
      for (i = 0; i < rjson.data.length; i++) {
        var artwork = rjson.data[i].attributes.artwork;
        let url = artwork.url.formatUnicorn({ w : artwork.width, h : artwork.height });
        var image = document.createElement("img");
        image.src = url;
        image.alt = rjson.data[i].attributes.name + " - " + rjson.data[i].attributes.artistName;
        var gallery = document.getElementById("gallery")
        gallery.appendChild(image);
        songUrls.push(rjson.data[i].relationships.catalog.data[0].attributes.url);
      }
      init();
    }
    else if (this.readyState == 4 && this.status != 200) {
      window.location.replace("login.html");
    }
};
xhr.open("GET", "https://cors-app-ld.herokuapp.com/https://amp-api.music.apple.com/v1/me/library/recently-added" + query, true);
//xhr.open("GET", "https://cors-anywhere.herokuapp.com/https://amp-api.music.apple.com/v1/me/library/recently-added" + query, true);
  
for(let key in headers) {
  xhr.setRequestHeader(key, headers[key]) 
}

xhr.send();
}

// Display the loading message after a short delay
$( function() {

  var userAgent = navigator.userAgent.toString().toLowerCase();
  if (userAgent.indexOf('safari') == -1) {
    alert("This extension is made to work on a Chromium or Safari browser, so the extension may not work properly.")
  }

  $('#loading').delay( loadingMessageDelay );
  fadeInLoadingMessage();
} );

// Fire the init() function once the page and all images have loaded
$(window).load( getCovers );


// Set up the gallery

function init() {
  totalSlides = $('#gallery img').length;  // Total number of slides in the gallery
  var pos = 0;  // To track the index of the slide we're working with

  // Hide the loading message and reveal the slider
  $('#loading').clearQueue().stop().fadeTo( 'fast', 0 ).remove();
  if ( !navigator.platform.match(/(iPhone|iPod|iPad)/) ) $('#slider').fadeIn('slow');

  // For each image in the gallery:
  //  - Show the image
  //  - Wrap the image in a div
  //  - Store the image's index and initial oldLeftPos values in the div 

  $('#gallery img').each( function() {
    $(this).css( 'display', 'inline' );
    var div = $('<div />').data('slideNum',++pos);
    $(this).wrap( div );
    $(this).parent().data('oldLeftPos',0);
  } );

  // Add a click handler to each div to jump to the div's image when clicked
  $('#gallery div').click( function() {
    currentSlide = $(this).data('slideNum');
    window.open(songUrls[currentSlide - 1], '_blank');
  } );

  // Redraw the gallery whenever the user resizes the browser
  $(window).resize( displayGallery );

  // Bind the moveRight() and moveLeft() functions to
  // the swipeLeft and swipeRight events respectively.
  $('body').swipe( {
      swipeLeft: moveRight,
      swipeRight: moveLeft,
      threshold: { x:swipeXThreshold, y:swipeYThreshold }
  } );

  // Bind the moveleft() and moveRight() functions to the
  // "move left" and "move right" keys on the keyboard

  $(document).keydown( function(event) {
    if ( event.which == leftKeyCode ) moveLeft();
    if ( event.which == rightKeyCode ) moveRight();
    if ( event.which == 13 ) {
      currentSlide = $('#gallery div').data('slideNum');
      window.open(songUrls[currentSlide - 1], '_blank');
    }
  } );

  $(window).bind('mousewheel DOMMouseScroll', function(event){
    if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
      moveRight();
    }
    else {
      moveLeft();
    }
});

  // Set up the slider

  $('#slider').attr( {
    'min': 1,
    'max': totalSlides,
    'value': currentSlide
  } );

  $('#slider').change( function() {
    oldCurrentSlide = currentSlide;
    currentSlide = $(this).val();
    displayGallery();
  } );

  // All set! Show the gallery
  displayGallery();

}

// Display the slides in the gallery

function displayGallery() {

  var pos = 0;                              // To track the index of the slide we're working with
  var galleryWidth = $('#gallery').width(); // Width of the gallery/viewport in px
  var galleryCentre = galleryWidth / 2;     // Horizontal centre point of the gallery in px
  var windowHeight = $(window).height();    // Viewport height in px
  var slideHeight = windowHeight - 150;     // Maximum slide height based on window height

  // Compute the actual step and slide padding values, based on window height
  var step = windowHeight * stepPercent / 100;
  var currentSlidePadding = windowHeight * currentSlidePaddingPercent / 100;

  // Clear any previous timeouts to avoid clashes when moving the gallery quickly
  while ( t = flipTimeouts.pop() ) clearTimeout(t);

  // Move through each slide div, positioning it in 3D space

  $('#gallery div').each( function(index) {
    globalIndex = index;
    console.log(globalIndex);
    var div = $(this);
    
    // Resize each slide if necessary (e.g. if the window height has changed) 
    div.css('max-width', slideHeight);
    div.css('max-height', slideHeight);

    if ( ++pos < currentSlide ) {

      // The slide is to the left of the current slide.

      // Compute its horizontal position
      var leftPos = galleryCentre - ( currentSlide * step ) + ( pos * step ) - (div.width()/2) - currentSlidePadding;

      // If the slide was previously to the right of the current slide, flip it immediately to the new angle.
      // (If we were to let it rotate slowly as it's repositioned then it would sometimes cut into other slides.)

      if ( pos > oldCurrentSlide ) {
        div.css( {
          '-webkit-transition': 'none',
          '-webkit-transform': 'translate3d(' +  div.data('oldLeftPos') + 'px,0,-' + (100+parseInt(div.width()/1.5)) + 'px) rotateY(' + bgRotateAngle + 'deg)'
        } );
      }

      // Wait 10 ms to give the slide a chance to rotate if necessary,
      // then reposition the slide to its new horiziontal position and angle

      var t = setTimeout( function() {
        div.css( {
          '-webkit-transition': '-webkit-transform .8s cubic-bezier(0, 0, .001, 1)',
          '-webkit-transform': 'translate3d(' + leftPos + 'px,0,-' + (100+parseInt(div.width()/1.5)) + 'px) rotateY(' + bgRotateAngle + 'deg)'
        } );
      }, 10 );

      // Store the timeout ID so we can clear it later
      flipTimeouts.push(t);

      // Store the new position in oldLeftPos
      div.data('oldLeftPos', leftPos);

    } else if ( pos > currentSlide ) {

      // The slide is to the right of the current slide.

      // Edited by Luca, added z-index for layering authenticity.

      div.css('z-index', "-100");

      // Compute its horizontal position
      var leftPos = galleryCentre + ( (pos-currentSlide) * step ) - (div.width()/2) + currentSlidePadding;

      // If the slide was previously to the left of the current slide, flip it immediately to the new angle.
      // (If we were to let it rotate slowly as it's repositioned then it would sometimes cut into other slides.)

      if ( pos < oldCurrentSlide ) {
        div.css( {
          '-webkit-transition': 'none',
          '-webkit-transform': 'translate3d(' + div.data('oldLeftPos') + 'px,0,-' + (100+parseInt(div.width()/1.5)) + 'px) rotateY(-' + bgRotateAngle + 'deg)'
        } );
      }

      // Wait 10 ms to give the slide a chance to rotate if necessary,
      // then reposition the slide to its new horiziontal position and angle

      var t = setTimeout( function() {
        div.css( {
          '-webkit-transition': '-webkit-transform .8s cubic-bezier(0, 0, .001, 1)',
          '-webkit-transform': 'translate3d(' + leftPos + 'px,0,-' + (100+parseInt(div.width()/1.5)) + 'px) rotateY(-' + bgRotateAngle + 'deg)'
        } );
      }, 10 );

      // Store the timeout ID so we can clear it later
      flipTimeouts.push(t);

      // Store the new position in oldLeftPos
      div.data('oldLeftPos', leftPos);

    } else {

      // The slide is the current slide.
      // Position it in the horizontal centre of the gallery, facing forward.

      var leftPos = galleryCentre - ( div.width()/2 );
      
      // Edited by Luca, added z-index for layering authenticity.

      div.css('z-index', "100");

      div.css( {
        '-webkit-transform': 'translate3d(' + leftPos + 'px,0,0) rotateY(0deg)',
      } );

      // Store the new position in oldLeftPos
      div.data('oldLeftPos', leftPos);
    }
  } );


  // Update the slider value and caption
  var currentSlideImage = $('#gallery img').eq( currentSlide - 1 );
  $('#caption').text( currentSlideImage.attr('alt') );
}


// Move one slide to the left by sliding the gallery left-to-right

function moveLeft() {
  if ( currentSlide > 1 ) {
    oldCurrentSlide = currentSlide; 
    currentSlide--;
    displayGallery();
  }
}


// Move one slide to the right by sliding the gallery right-to-left

function moveRight() {
  if ( currentSlide < totalSlides ) {
    oldCurrentSlide = currentSlide;
    currentSlide++;
    displayGallery();
  }
}


// Functions to pulse the loading message

function fadeInLoadingMessage() {
  $('#loading').animate( { opacity: loadingMessageMaxOpacity }, loadingMessageSpeed, 'swing', fadeOutLoadingMessage );
}

function fadeOutLoadingMessage(){
  $('#loading').animate( { opacity: loadingMessageMinOpacity }, loadingMessageSpeed, 'swing', fadeInLoadingMessage );
}
