
(function (utils) {
  'use strict';

  function transitionEnd() {
    var
      el = document.createElement('randomElem'),

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

    return false;
  }

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
        transitionEvent.initEvent('bsTransitionEnd', false, false, {});
        element.dispatchEvent(transitionEvent);
      }
    }

    setTimeout(callback, duration);
  }

  utils.support = {};
  utils.support.transition = transitionEnd();

}(window.atFormDateUtils = window.atFormDateUtils || {}));