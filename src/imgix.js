(function (resrc) {
  "use strict";

  // Set the options property or create an empty options object.
  resrc.options = resrc.options || {};

  // Declare the default properties object.
  var defaults = {
    server : "livingdocs.imgix.net",
    resrcClass : "resrc",
    resrcOnResize : true,
    resrcOnResizeDown : false,
    resrcOnPinch : false,
    imageQuality : 85,
    pixelRounding : 80,
    ssl : false
  };

  // Declare various window defaults.
  var windowHasResizeEvent = false;
  var windowResizeTimeout = 200;
  var windowLastWidth = 0;

  /**
   * Merge 2 objects together.
   * @param a - default object
   * @param b - options object
   * @returns {object}
   */
  var mergeObject = function (a, b) {
    if (a && b) {
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key];
        }
      }
    }
    return a;
  };

  /*
   * Helper parsing the url using the browser's anchor node
   */
  var parseUrl = function(url){
    var elem = document.createElement('a');
    elem.href = url;
    return elem;
  };


  /**
   * Declare the options.
   * This is a merged object of the defaults with any additional / override options.
   * @type {object}
   */
  var options = mergeObject(defaults, resrc.options);


  /**
   * Utility method for setting resrc options. Merges over the top of any current values
   * @param newOptions {object} - New options to merge with current ones
   * @returns {object}
   */
  var extendResrcOptions = function(newOptions){
    mergeObject(options,newOptions);
    return resrc;
  };


  /**
   * Get the url protocol based on the options.ssl value.
   * @param ssl
   * @returns {string}
   */
  var getProtocol = function (ssl) {
    if (ssl === true) {
      return "https://";
    }
    return "http://";
  };


  var getServiceUrl = function (src, server) {
    var url = parseUrl(src);

    if(url.host === server) {
      return url.toString();
    } else {
      url.host = server;
      return url.toString(); 
    }
  };

  /**
   * Round the pixel size based on the pixel rounding parameter.
   * @param pixelSize
   * @param pixelRounding
   * @returns {number}
   */
  var pixelRound = function (pixelSize, pixelRounding) {
    return Math.ceil(pixelSize / pixelRounding) * pixelRounding;
  };


  /**
   * Does the user agent match a supported ResrcOnPinch device? (iPhone, iPod, iPad)
   * @returns {boolean}
   */
  var isSupportedResrcOnPinchDevice = function () {
    return (/iPhone|iPod|iPad/i).test(navigator.userAgent);
  };


  /**
   * Is the value a number?
   * @param value
   * @returns {boolean}
   */
  var isNumber = function (value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  };


  /**
   * Get the inner width of the screen.
   * @returns {number}
   */
  var getDeviceScreenInnerWidth = function () {
    var zoomMultiplier = Math.round((screen.width / window.innerWidth) * 10) / 10;
    return zoomMultiplier <= 1 ? 1 : zoomMultiplier;
  };


  /**
   * Get the pixel ratio specified on the element if it has a data-dpi attribute.
   * Fall back to the device pixel ratio.
   * @param elem
   * @returns {Number}
   */
  var getPixelRatio = function (elem) {
    var dpiOverride = elem.getAttribute("data-dpi");
    var devicePixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
    var dpi = isNumber(dpiOverride) === true ? parseFloat(dpiOverride) : devicePixelRatio;
    if (dpi % 1 !== 0) {
      dpi = dpi.toFixed(1);
    }
    return dpi;
  };


  /**
   * Get the window width.
   * @returns {number}
   */
  var getWindowWidth = function () {
    return document.documentElement.clientWidth || document.body && document.body.clientWidth || 1024;
  };


  /**
   * Get the window height.
   * @returns {number}
   */
  var getWindowHeight = function () {
    return document.documentElement.clientHeight || document.body && document.body.clientHeight || 768;
  };


  /**
   * Get the elements image src.
   * @param elem
   * @returns {string}
   */
  var getImgSrc = function (elem) {
    return elem.getAttribute("data-src") || elem.getAttribute("src");
  };

  /**
   * Set the elements image src.
   * @param elem
   * @param value {string}
   */
  var setImgSrc = function (elem, value) {
    elem.setAttribute("data-src", value);
  };


  /**
   * Get an elements computed pixel width and height.
   * @param elem
   * @returns {object}
   */
  var getComputedPixelSize = function (elem) {
    var val = {};
    val.width = elem.offsetWidth;
    val.height = elem.offsetHeight;
    if (elem.parentNode === null) {
      val.width = getWindowWidth();
      val.height = getWindowHeight();
      return val;
    }

    if (val.width !== 0 || val.height !== 0) {
      /**
       * 1 time hack for images with an alt and no src tag.
       * Example: <img data-src="img.jpg" alt="An Image"/>
       * Since the image has no parsable src yet, the browser actually reports the width of the alt text.
       * For example: 20px or whatever. F***ing Crazy I know, but does make sense! We return the parent nodes sizes instead.
       * 2nd time round we skip this and return the correct values.
       */
      if (elem.alt && !elem.resrc) {
        elem.resrc = true;
        return getComputedPixelSize(elem.parentNode);
      }
      return val;
    } else {
      var ret;
      var name;
      var old = {};
      var cssShow = { position : "absolute", visibility : "hidden", display : "block" };
      for (name in cssShow) {
        if (cssShow.hasOwnProperty(name)) {
          old[ name ] = elem.style[ name ];
          elem.style[ name ] = cssShow[ name ];
        }
      }
      ret = val;
      for (name in cssShow) {
        if (cssShow.hasOwnProperty(name)) {
          elem.style[ name ] = old[ name ];
        }
      }
      if (ret.width === 0 || ret.height === 0) {
        return getComputedPixelSize(elem.parentNode);
      } else {
        return ret;
      }
    }
  };


  /**
   * Throttle function calls based on a period of time.
   * @param func
   * @param wait
   * @returns {function}
   */
  var debounce = function (func, wait) {
    var timeout;
    return function () {
      var context = this;
      var args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };


  /**
   * Replace the elements image src when the elementPinched function is called.
   * This is used in the "gestureend" event listener callback.
   */
  var elementPinched = function () {
    updateElementSrcIfNeeded(this);
  };


  /**
   * Reload resrc if the window width is different to last window width.
   * This is used in the "resize" event listener callback.
   */
  var windowResized = function () {
    if (windowLastWidth !== getWindowWidth()) {
      resrcReload();
    }
  };


  /**
   * Add "gestureend" event listener if supported.
   * @param elem
   */
  var addGestureendEvent = function (elem) {
    if (elem.addEventListener && !elem.eventListenerAdded) {
      elem.addEventListener("gestureend", elementPinched, false);
      elem.eventListenerAdded = true;
    }
  };


  /**
   * Add "resize" window event.
   */
  var addWindowResizeEvent = function () {
    if (window.addEventListener) {
      window.addEventListener("resize", windowResized, false);
    } else if (window.attachEvent) {
      window.attachEvent("onresize", windowResized);
    }
    windowHasResizeEvent = true;
  };


  /**
   * Initialize resrc and update the last window width variable.
   */
  var resrcReload = debounce(function () {
    initResrc();
    windowLastWidth = getWindowWidth();
  }, windowResizeTimeout);


  /**
   * Cross browser DOM ready function.
   * Hat tip to Dustin Diaz <dustindiaz.com> (MIT License)
   * https://github.com/ded/domready/tree/v0.3.0
   */
  var domReady = function (ready) {
    var fns = [];
    var fn;
    var f = false;
    var doc = document;
    var testEl = doc.documentElement;
    var hack = testEl.doScroll;
    var domContentLoaded = "DOMContentLoaded";
    var addEventListener = "addEventListener";
    var onreadystatechange = "onreadystatechange";
    var readyState = "readyState";
    var loadedRgx = hack ? /^loaded|^c/ : /^loaded|c/;
    var loaded = loadedRgx.test(doc[readyState]);
    function flush(f) {
      loaded = 1;
      while (f = fns.shift()) {
        f();
      }
    }
    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f);
      flush();
    }, f);
    hack && doc.attachEvent(onreadystatechange, fn = function () {
      if (/^c/.test(doc[readyState])) {
        doc.detachEvent(onreadystatechange, fn);
        flush();
      }
    });
    return (ready = hack ?
      function (fn) {
        self !== top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll("left");
            } catch (e) {
              return setTimeout(function () {
                ready(fn);
              }, 50);
            }
            fn();
          }();
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn);
      });
  }();


  /**
   * Create the ReSRC image object.
   * @param elem
   * @returns {object}
   */
  var getResrcImageObject = function (elem) {
    // Declare the dpi for the element.
    var dpr = getPixelRatio(elem);
    // Declare the pixel rounding value.
    var pixelRounding = options.pixelRounding;
    // Declare the screen zoom multiplier.
    var zoomMultiplier = isSupportedResrcOnPinchDevice() ? getDeviceScreenInnerWidth() : 1;
    // Declare the sizes of the element (width and height as an Object).
    var elementSizeObj = getComputedPixelSize(elem);
    // Declare the pixel width of the element.
    var elementPixelWidth = pixelRound(elementSizeObj.width * zoomMultiplier, pixelRounding);
    // Declare the pixel height of the element.
    var elementPixelHeight = pixelRound(elementSizeObj.height * zoomMultiplier, pixelRounding);
    // Declare the server.
    var server = elem.getAttribute("data-server") || options.server;
    // Source of incoming image
    var imageSrc = getImgSrc(elem);
    // Declare the resrc full image path.
    var serviceImageURL = getServiceUrl(imageSrc, server);
    // Either w or h, depending on format
    var sizeParam = elementPixelHeight <= elementPixelWidth === true ? ("w=" + elementPixelWidth) : ("h="+ elementPixelHeight);
    // Declare the fallback image url.
    var fallbackImgURL = imageSrc;
    // Client params, determined by capabilities/sizing
    var clientParams = sizeParam + '&dpr=' + dpr

    var url = parseUrl(imageSrc);
    var queryString = url.search ? (url.search + '&' + clientParams) : ('?' + clientParams);

    function getURL() {
      return getProtocol(options.ssl) + server + url.pathname + queryString; 
    }

    // Return the image object.
    return {
      width : elementPixelWidth,
      height : elementPixelHeight,
      getURL: getURL,
      resrcImgPath: getURL(),
      getFallbackURL: function(){
        return fallbackImgURL;
      },
      isInlineImage: function(){
        return elem.tagName.toLowerCase() === "img";
      },
    };
  };


  /**
   * Replace the image source of the element if size changes
   * and configurations make it necessary.
   * @param elem
   */
  var updateElementSrcIfNeeded = function (elem) {
    // Declare the resrc image object.
    var resrcObj = getResrcImageObject(elem);
    // Declare the current width of the element.
    var currentElemWidth = resrcObj.width;
    // Make sure lastWidth is set on the element.
    elem.lastWidth = elem.lastWidth || 0;
    // Abort if the resrcOnResizeDown option is disabled, and
    // the last width of the element is greater than the current width.
    if (options.resrcOnResizeDown === false) {
      if (elem.lastWidth >= currentElemWidth) {
        return;
      }
    }

    updateElementSrc(elem, resrcObj);
  };


  /**
   * Set the image source of the element.
   * @param  elem
   * @param  resrcObj [optional] object accquired with getResrcImageObject(elem)
   */
  var updateElementSrc = function (elem, image) {
    // Declare image object if it was not supplied.
    image = image || getResrcImageObject(elem);
    // Declare the resrc image path.
    var imageURL = image.getURL();
    // Declare the fallback image path.
    var fallbackURL = image.getFallbackURL();
    // Declare the current width of the element.
    var currentElemWidth = image.width;

    // If element is an image tag, then...
    if(image.isInlineImage()){
      // Set the src of the element to be the resrc image path.
      elem.src = imageURL;
      // If there is an error set the src of the element to the fallback image path.
      elem.onerror = function(){
        this.src = fallbackURL;
      };
    }
    else {
      // Declare a new image object.
      var img = new Image();
      // Set the image objects src to the resrc image path.
      img.src = imageURL;
      // Set the css background image style of the element to be the resrc image path.
      elem.style.backgroundImage = "url(" + imageURL + ")";
      // If there is an error set the css background image style of the element to be the fallback image path.
      img.onerror = function () {
        elem.style.backgroundImage = "url(" + fallbackURL + ")";
      };
    }

    // Set the elements last width = to the current width.
    elem.lastWidth = currentElemWidth;
  };

  /**
   * Initialize resrc
   * @param elem
   */
  var initResrc = function (elem) {
    // Declare the elemArr.
    var elemArr;
    // Return if the elem param is null.
    if (elem === null){
      return;
    }
    // If the elem param is not an array then make it so.
    if (elem) {
      elemArr = elem.length ? elem : [elem];
    }
    // If no elem param is set, then get all elements with a class = options.resrcClass.
    else {
      elemArr = document.getElementsByClassName(options.resrcClass);
    }
    // Loop through the elemArr.
    for (var i = 0; i < elemArr.length; i++) {
      // Return if a specific item in the array is null.
      if (elemArr[i] === null) {
        return;
      }
      // If the resrcOnPinch option is set to true add the "gestureend" event listener to the element.
      if (options.resrcOnPinch) {
        addGestureendEvent(elemArr[i]);
      }
      // replace the element image source.
      updateElementSrc(elemArr[i]);
    }
    // Finally add the window resize event if the resrcOnResize option is set to true.
    if (options.resrcOnResize && !windowHasResizeEvent) {
      addWindowResizeEvent();
    }
  };

  /**
   * Update an image src with a new url
   * @param elem
   * @param url {string}
   */
  var setElementSrc = function(elem, url) {
    // Return if one of the params is undefined.
    if (!elem || !url) {
      return;
    }

    // Set the image source manually
    setImgSrc(elem, url);

    // recalculate and reset the image src
    updateElementSrc(elem);
  };

  /**
   * Expose various private functions as public methods.
   */
  resrc.ready = domReady;
  resrc.run = initResrc;
  resrc.setImageUrl = setElementSrc;
  resrc.getResrcImageObject = getResrcImageObject;
  resrc.getElementsByClassName = document.getElementsByClassName;
  resrc.options = options;
  resrc.extend = mergeObject;
  resrc.configure = extendResrcOptions;

}(window.imgix = window.imgix || {}));

if (!window.resrc){
  window.resrc = window.imgix;
}