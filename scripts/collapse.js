
(function (utils) {
  'use strict';

  var Collapse = function (element, options) {
    // this.$element holds the reference to the html element this Collapse instance is attached to
    this.$element = element;
    this.options = utils.extend({}, Collapse.DEFAULTS, options);
    this.transitioning = null;

    this.addAriaAndCollapsedClass(this.$element);

    if (this.options.toggle) {
      this.toggle();
    }
  };

  Collapse.VERSION = '3.3.4';

  Collapse.TRANSITION_DURATION = 350;

  Collapse.DEFAULTS = {
    toggle: true
  };

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.classList.contains('width');
    return hasWidth ? 'width' : 'height';
  };

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
      scrollSize,
      scrollSizeProp;

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

    scrollSizeProp = utils.camelCase(['scroll', dimension].join('-'));
    scrollSize = this.$element[scrollSizeProp];

    this.$element.addEventListener('bsTransitionEnd', complete);
    utils.emulateTransitionEnd(this.$element, Collapse.TRANSITION_DURATION);
    utils[dimension](this.$element, scrollSize + 'px');
  };

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
    this.$element.setAttribute('aria-expanded', false);

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
    // *ij* setting the dimension is delayed in order to simulate jquery behavior
    setTimeout(function () {
      utils[dimension](self.$element, '0px');
    }, 0);
    this.$element.addEventListener('bsTransitionEnd', complete);
    utils.emulateTransitionEnd(this.$element, Collapse.TRANSITION_DURATION);
  };

  Collapse.prototype.toggle = function () {
    this[this.$element.classList.contains('in') ? 'hide' : 'show']();
  };

  Collapse.prototype.addAriaAndCollapsedClass = function ($element) {
    var isOpen = $element.classList.contains('in');
    $element.setAttribute('aria-expanded', isOpen);
  };

  function PluginNoJQuery(elements, option) {
    var
      index,
      element,
      data,
      options;
    if (utils.isArray(elements)) {
      for (index = 0; index < elements.length; index += 1) {
        element = elements[index];
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

  utils.collapse = PluginNoJQuery;
  utils.collapse.Constructor = Collapse;
  
}(window.atFormDateUtils));