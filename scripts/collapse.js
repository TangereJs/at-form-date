/* ========================================================================
 * Bootstrap: collapse.js v3.3.4
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


(function ($, utils) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  //  var Collapse = function (element, options) {
  //    this.$element = $(element);
  //    this.options = $.extend({}, Collapse.DEFAULTS, options);
  //    this.$trigger = $('[data-toggle="collapse"][href="#' + element.id + '"],' +
  //      '[data-toggle="collapse"][data-target="#' + element.id + '"]');
  //    this.transitioning = null;
  //
  //    if (this.options.parent) {
  //      this.$parent = this.getParent();
  //    } else {
  //      this.addAriaAndCollapsedClass(this.$element, this.$trigger);
  //    }
  //
  //    if (this.options.toggle) {
  //      this.toggle();
  //    }
  //  };

  var Collapse = function (element, options) {
    // this.$element holds the reference to the html element this Collapse instance is attached to
    this.$element = element;
    this.options = utils.extend({}, Collapse.DEFAULTS, options);
    // this.$trigger is never used since we are not using data attributes to trigger datetimepicker
    //    this.$trigger = $('[data-toggle="collapse"][href="#' + element.id + '"],' +
    //      '[data-toggle="collapse"][data-target="#' + element.id + '"]');
    this.transitioning = null;

    // we are also not using parent option; this if should be removed
    // and reference to parent should not be maintained
    //    if (this.options.parent) {
    //      this.$parent = this.getParent();
    //    } else {
    this.addAriaAndCollapsedClass(this.$element);
    //    }

    if (this.options.toggle) {
      this.toggle();
    }
  };

  Collapse.VERSION = '3.3.4';

  Collapse.TRANSITION_DURATION = 350;

  Collapse.DEFAULTS = {
    toggle: true
  };

  //  Collapse.prototype.dimension = function () {
  //    var hasWidth = this.$element.hasClass('width');
  //    return hasWidth ? 'width' : 'height';
  //  };

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.classList.contains('width');
    return hasWidth ? 'width' : 'height';
  };

  //  Collapse.prototype.show = function () {
  //    if (this.transitioning || this.$element.hasClass('in')) {
  //      return;
  //    }
  //
  //    var
  //      activesData,
  //      actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing'),
  //      startEvent = $.Event('show.bs.collapse'),
  //      throwAway,
  //      dimension,
  //      complete,
  //      scrollSize;
  //
  //    if (actives && actives.length) {
  //      activesData = actives.data('bs.collapse');
  //      if (activesData && activesData.transitioning) {
  //        return;
  //      }
  //    }
  //
  //
  //    this.$element.trigger(startEvent);
  //    if (startEvent.isDefaultPrevented()) {
  //      return;
  //    }
  //
  //    if (actives && actives.length) {
  //      PluginNoJQuery.call(actives, 'hide');
  //      throwAway = activesData || actives.data('bs.collapse', null);
  //    }
  //
  //    dimension = this.dimension();
  //
  //    this.$element
  //      .removeClass('collapse')
  //      .addClass('collapsing')[dimension](0)
  //      .attr('aria-expanded', true);
  //
  //    this.$trigger
  //      .removeClass('collapsed')
  //      .attr('aria-expanded', true);
  //
  //    this.transitioning = 1;
  //
  //    complete = function () {
  //      this.$element
  //        .removeClass('collapsing')
  //        .addClass('collapse in')[dimension]('');
  //      this.transitioning = 0;
  //      this.$element
  //        .trigger('shown.bs.collapse');
  //    };
  //
  //    if (!$.support.transition) {
  //      return complete.call(this);
  //    }
  //
  //    scrollSize = $.camelCase(['scroll', dimension].join('-'));
  //
  //    this.$element
  //      .one('bsTransitionEnd', $.proxy(complete, this))
  //      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize]);
  //  };

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.classList.contains('in')) {
      return;
    }

    var
      activesData,
      actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing'),
      startEvent,
      throwAway,
      dimension,
      complete,
      scrollSize;

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse');
      if (activesData && activesData.transitioning) {
        return;
      }
    }


    startEvent = document.createEvent('Event');
    startEvent.initEvent('show.bs.collapse', false, false);
    this.$element.dispatchEvent(startEvent);

    if (startEvent.defaultPrevented) {
      return;
    }

    if (actives && actives.length) {
      PluginNoJQuery.call(actives, 'hide');
      throwAway = activesData || actives.data('bs.collapse', null);
    }

    dimension = this.dimension();

    this.$element.classList.remove('collapse');
    this.$element.classList.add('collapsing');
    this.$element.setAttribute('aria-expanded', true);
    utils[dimension](this.$element, 0);

    this.transitioning = 1;

    var self = this;
    complete = function () {
      self.$element.classList.remove('collapsing');
      self.$element.classList.add('collapse');
      self.$element.classList.add('in');
      utils[dimension](self.$element, '');

      self.transitioning = 0;

      self.$element.removeEventListener('bsTransitionEnd', complete);

      var shownBsCollapseEvent = document.createEvent('Event');
      shownBsCollapseEvent.initEvent('shown.bs.collapse', false, false);

      self.$element.dispatchEvent(shownBsCollapseEvent);
    };

    if (!utils.support.transition) {
      return complete.call(this);
    }

    scrollSize = $.camelCase(['scroll', dimension].join('-'));

    this.$element.addEventListener('bsTransitionEnd', complete);

    utils.emulateTransitionEnd(this.$element, Collapse.TRANSITION_DURATION);
    utils[dimension](this.$element, this.$element[scrollSize]);
  };


  //  Collapse.prototype.hide = function () {
  //    console.log('Collapse.prototype.hide = function () is not called NOT');
  //    if (this.transitioning || !this.$element.hasClass('in')) {
  //      return;
  //    }
  //
  //    var
  //      startEvent = $.Event('hide.bs.collapse'),
  //      dimension,
  //      complete;
  //
  //    this.$element.trigger(startEvent);
  //    if (startEvent.isDefaultPrevented()) {
  //      return;
  //    }
  //
  //    dimension = this.dimension();
  //
  //    this.$element[dimension](this.$element[dimension]())[0].offsetHeight;
  //
  //    this.$element
  //      .addClass('collapsing')
  //      .removeClass('collapse in')
  //      .attr('aria-expanded', false);
  //
  //    this.$trigger
  //      .addClass('collapsed')
  //      .attr('aria-expanded', false);
  //
  //    this.transitioning = 1;
  //
  //    complete = function () {
  //      this.transitioning = 0;
  //      this.$element
  //        .removeClass('collapsing')
  //        .addClass('collapse')
  //        .trigger('hidden.bs.collapse');
  //    };
  //
  //    if (!$.support.transition) {
  //      return complete.call(this);
  //    }
  //
  //    this.$element[dimension](0)
  //      .one('bsTransitionEnd', $.proxy(complete, this))
  //      .emulateTransitionEnd(Collapse.TRANSITION_DURATION);
  //  };

  // this is function that is being converted
  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.classList.contains('in')) {
      return;
    }

    var
      startEvent,
      dimension,
      complete;

    startEvent = document.createEvent('Event');
    startEvent.initEvent('hide.bs.collapse', false, false);
    this.$element.dispatchEvent(startEvent);
    if (startEvent.defaultPrevented) {
      return;
    }

    dimension = this.dimension();

    var dimensionValue = utils[dimension](this.$element);
    dimensionValue = dimensionValue + 'px';
    utils[dimension](this.$element, dimensionValue);

    this.$element.classList.add('collapsing');
    this.$element.classList.remove('collapse');
    this.$element.classList.remove('in');
    this.$element.removeAttribute('aria-expanded');

    this.transitioning = 1;

    var self = this;
    complete = function () {
      self.transitioning = 0;
      self.$element.classList.remove('collapsing');
      self.$element.classList.add('collapse');

      self.$element.removeEventListener('bsTransitionEnd', complete);

      var hiddenBsCollapseEvent = document.createEvent('Event');
      hiddenBsCollapseEvent.initEvent('hidden.bs.collapse', false, false);
      self.$element.dispatchEvent(hiddenBsCollapseEvent);
    };

    if (!utils.support.transition) {
      return complete.call(this);
    }

    this.$element.addEventListener('bsTransitionEnd', complete);
    utils.emulateTransitionEnd(this.$element, Collapse.TRANSITION_DURATION);
    utils[dimension](this.$element, 0);
  };

  //  Collapse.prototype.toggle = function () {
  //    this[this.$element.hasClass('in') ? 'hide' : 'show']();
  //  };

  Collapse.prototype.toggle = function () {
    this[this.$element.classList.contains('in') ? 'hide' : 'show']();
  };

//  Collapse.prototype.getParent = function () {
//    return $(this.options.parent)
//      .find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]')
//      .each($.proxy(function (i, element) {
//        var $element = $(element);
//        this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element);
//      }, this))
//      .end();
//  };

//  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
//    console.log("Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) is not called. NOT");
//    var isOpen = $element.hasClass('in');
//
//    $element.attr('aria-expanded', isOpen);
//    $trigger
//      .toggleClass('collapsed', !isOpen)
//      .attr('aria-expanded', isOpen);
//  };

//  Collapse.prototype.addAriaAndCollapsedClass = function ($element) {
//    var isOpen = $element.classList.contains('in');
//    if (isOpen) {
//      $element.setAttribute('aria-expanded', isOpen);
//    } else {
//      $element.removeAttribute('aria-expanded');
//    }
//  };

  Collapse.prototype.addAriaAndCollapsedClass = function ($element) {
    var isOpen = $element.classList.contains('in');
    if (isOpen) {
      $element.setAttribute('aria-expanded', isOpen);
    } else {
      $element.removeAttribute('aria-expanded');
    }
  };
  
//  function getTargetFromTrigger($trigger) {
//    var
//      href,
//      target = $trigger.attr('data-target') || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7
//
//    return $(target);
//  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  //  function Plugin(option) {
  //    // this is an array of elements
  //    // jqueryEach performs the function on the each element in the array and 
  //    // returns the array of elements upon which function is performed
  //    return this.each(function () {
  //      // this here is a element of the array without jquery wrapper
  //      var
  //        $this = $(this),
  //        data = $this.data('bs.collapse'),
  //        options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option === 'object' && option);
  //
  //      if (!data && options.toggle && /show|hide/.test(option)) {
  //        options.toggle = false;
  //      }
  //      if (!data) {
  //        $this.data('bs.collapse', (data = new Collapse(this, options)));
  //      }
  //      if (typeof option === 'string') {
  //        data[option]();
  //      }
  //    });
  //  }

  // COLLAPSE PLUGIN DEFINITION
  // NO jQuery
  // ==========================
  function PluginNoJQuery(elements, option) {
    var
      index,
      element,
      data,
      options;
    if (utils.isArray(elements)) {
      for (index = 0; index < elements.length; index += 1) {
        element = elements[index].get(0);
        data = utils.getData(element, 'bs.collapse');
        options = utils.extend({}, Collapse.DEFAULTS, utils.getData(element), typeof option === 'object' && option);

        if (!data && options.toggle && /show|hide/.test(option)) {
          options.toggle = false;
        }
        if (!data) {
          utils.setData(element, 'bs.collapse', (data = new Collapse(element, options)));
        }
        if (typeof option === 'string') {
          data[option]();
        }
      }
    } else {
      return PluginNoJQuery([elements], option);
    }

    return elements;
  }

  //  var old = $.fn.collapse;
  //
  //  $.fn.collapse = Plugin;
  //  $.fn.collapse.Constructor = Collapse;

  utils.collapse = PluginNoJQuery;
  utils.collapse.Constructor = Collapse;

  // COLLAPSE NO CONFLICT
  // ====================

  //  $.fn.collapse.noConflict = function () {
  //    $.fn.collapse = old;
  //    return this;
  //  };


  // COLLAPSE DATA-API
  // =================

  //  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
  //    var
  //      $this = $(this),
  //      $target,
  //      data,
  //      option;
  //
  //    if (!$this.attr('data-target')) {
  //      e.preventDefault();
  //    }
  //
  //    $target = getTargetFromTrigger($this);
  //    data = $target.data('bs.collapse');
  //    option = data ? 'toggle' : $this.data();
  //
  //    Plugin.call($target, option);
  //  });

}(jQuery, window.atFormDateUtils));