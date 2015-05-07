/* ========================================================================
 * Bootstrap: transition.js v3.3.4
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


(function ($, utils) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var
      el = document.createElement('bootstrap'),

      transEndEventNames = {
        WebkitTransition: 'webkitTransitionEnd',
        MozTransition: 'transitionend',
        OTransition: 'oTransitionEnd otransitionend',
        transition: 'transitionend'
      },
      name;

    for (name in transEndEventNames) {
      if (transEndEventNames.hasOwnProperty(name)) {
        if (el.style[name] !== undefined) {
          return {
            end: transEndEventNames[name]
          };
        }
      }
    }

    return false; // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
//  $.fn.emulateTransitionEnd = function (duration) {
//    var called = false,
//      $el = this,
//      callback;
//
//    // http://api.jquery.com/one/
//    $(this).one('bsTransitionEnd', function () {
//      called = true;
//    });
//
//    callback = function () {
//      if (!called) {
//        // http://api.jquery.com/trigger/
//        $($el).trigger($.support.transition.end);
//      }
//    };
//
//    setTimeout(callback, duration);
//    return this;
//  };

  utils.emulateTransitionEnd = function (element, duration) {

    var called = false;
    
    var handler = function() {
      element.removeEventListener('bsTransitionEnd', handler);
      called = true;
    };
    element.addEventListener('bsTransitionEnd', handler);
    
    var callback = function () {
      if (!called) {
        var transitionEvent = document.createEvent('Event');
        transitionEvent.initEvent('bsTransitionEnd');
        element.dispatchEvent(transitionEvent, false, false);
      }
    }

    setTimeout(callback, duration);
  }

  // http://api.jquery.com/jQuery/#jQuery3
//  $(function () {
//    $.support.transition = transitionEnd();
//
//    if (!$.support.transition) {
//      return;
//    }
//
//    $.event.special.bsTransitionEnd = {
//      bindType: $.support.transition.end,
//      delegateType: $.support.transition.end,
//      handle: function (e) {
//        //http://api.jquery.com/is/
//        if ($(e.target).is(this)) {
//          return e.handleObj.handler.apply(this, arguments);
//        }
//      }
//    };
//  });

  utils.support = {};
  utils.support.transition = transitionEnd();

}(jQuery, window.atFormDateUtils = window.atFormDateUtils || {}));