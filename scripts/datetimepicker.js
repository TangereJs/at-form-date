/*global define:false */
/*global exports:false */
/*global require:false */
/*global jQuery:false */
/*global moment:false */
(function (factory) {
  'use strict';

  if (typeof moment === 'undefined') {
    throw 'datetimepicker requires Moment.js to be loaded first';
  }
  factory(moment, window.atFormDateUtils);

}(function (moment, utils) {
  'use strict';
  if (!moment) {
    throw new Error('datetimepicker requires Moment.js to be loaded first');
  }

  var styleScopeValue = 'at-form-date';

  var dateTimePicker = function (element, options) {
    var picker = {},
      date = moment().startOf('d'),
      viewDate = date.clone(),
      unset = true,
      input,
      component = false,
      widget = false,
      use24Hours,
      minViewModeNumber = 0,
      actualFormat,
      parseFormats,
      currentViewMode,
      datePickerModes = [
        {
          clsName: 'days',
          navFnc: 'M',
          navStep: 1
        },
        {
          clsName: 'months',
          navFnc: 'y',
          navStep: 1
        },
        {
          clsName: 'years',
          navFnc: 'y',
          navStep: 10
        }
      ],
      viewModes = ['days', 'months', 'years'],
      verticalModes = ['top', 'bottom', 'auto'],
      horizontalModes = ['left', 'right', 'auto'],
      toolbarPlacements = ['default', 'top', 'bottom'],
      keyMap = {
        'up': 38,
        38: 'up',
        'down': 40,
        40: 'down',
        'left': 37,
        37: 'left',
        'right': 39,
        39: 'right',
        'tab': 9,
        9: 'tab',
        'escape': 27,
        27: 'escape',
        'enter': 13,
        13: 'enter',
        'pageUp': 33,
        33: 'pageUp',
        'pageDown': 34,
        34: 'pageDown',
        'shift': 16,
        16: 'shift',
        'control': 17,
        17: 'control',
        'space': 32,
        32: 'space',
        't': 84,
        84: 't',
        'delete': 46,
        46: 'delete'
      },
      keyState = {},

      /********************************************************************************
       *
       * Private functions
       *
       ********************************************************************************/
      isEnabled = function (granularity) {
        if (typeof granularity !== 'string' || granularity.length > 1) {
          throw new TypeError('isEnabled expects a single character string parameter');
        }
        switch (granularity) {
        case 'y':
          return actualFormat.indexOf('Y') !== -1;
        case 'M':
          return actualFormat.indexOf('M') !== -1;
        case 'd':
          return actualFormat.toLowerCase().indexOf('d') !== -1;
        case 'h':
        case 'H':
          return actualFormat.toLowerCase().indexOf('h') !== -1;
        case 'm':
          return actualFormat.indexOf('m') !== -1;
        case 's':
          return actualFormat.indexOf('s') !== -1;
        default:
          return false;
        }
      },

      hasTime = function () {
        return (isEnabled('h') || isEnabled('m') || isEnabled('s'));
      },

      hasDate = function () {
        return (isEnabled('y') || isEnabled('M') || isEnabled('d'));
      },

      getHeadTemplate = function () {
        var headTemplate = document.createElement('thead');
        var trElem = document.createElement('tr');
        Polymer.dom(headTemplate).appendChild(trElem);

        var thElem = document.createElement('th');
        Polymer.dom(thElem).classList.add('prev');
        Polymer.dom(thElem).setAttribute('data-action', 'previous');

        Polymer.dom(trElem).appendChild(thElem);

        var previousIcon = document.createElement('at-carbon-icon');
        previousIcon.icon = "now:caret-left";
        Polymer.dom(thElem).appendChild(previousIcon);

        thElem = document.createElement('th');
        Polymer.dom(thElem).classList.add('picker-switch');
        Polymer.dom(thElem).setAttribute('data-action', 'pickerSwitch');
        Polymer.dom(thElem).setAttribute('colspan', (options.calendarWeeks ? '6' : '5'));

        Polymer.dom(trElem).appendChild(thElem);

        thElem = document.createElement('th');
        Polymer.dom(thElem).classList.add('next');
        Polymer.dom(thElem).setAttribute('data-action', 'next');

        Polymer.dom(trElem).appendChild(thElem);

        var nextIcon = document.createElement('at-carbon-icon');
        nextIcon.icon = "now:caret-right";
        Polymer.dom(thElem).appendChild(nextIcon);

        return headTemplate;
      },

      getContTemplate = function () {
        var contTemplate = document.createElement('tbody');
        var trElem, tdElem;
        trElem = document.createElement('tr');
        Polymer.dom(trElem).setAttribute('style-scope', styleScopeValue);
        Polymer.dom(contTemplate).appendChild(trElem);

        tdElem = document.createElement('td');
        Polymer.dom(tdElem).setAttribute('style-scope', styleScopeValue);
        Polymer.dom(tdElem).setAttribute('colspan', options.calendarWeeks ? '8' : '7');

        Polymer.dom(trElem).appendChild(tdElem);

        return contTemplate;
      },

      getDatePickerTemplate = function () {

        var result1, result2, result3, tableElem, tableBodyElem;

        result1 = document.createElement('div');
        Polymer.dom(result1).classList.add('datepicker-days');
        tableElem = document.createElement('table');
        Polymer.dom(tableElem).classList.add('table-condensed');
        tableBodyElem = document.createElement('tbody');

        Polymer.dom(result1).appendChild(tableElem);
        Polymer.dom(tableElem).appendChild(getHeadTemplate());
        Polymer.dom(tableElem).appendChild(tableBodyElem);

        result2 = document.createElement('div');
        Polymer.dom(result2).classList.add('datepicker-months');
        tableElem = document.createElement('table');
        Polymer.dom(tableElem).classList.add('table-condensed');
        Polymer.dom(result2).appendChild(tableElem);
        Polymer.dom(tableElem).appendChild(getHeadTemplate());
        Polymer.dom(tableElem).appendChild(getContTemplate());

        result3 = document.createElement('div');
        Polymer.dom(result3).classList.add('datepicker-years');
        tableElem = document.createElement('table');
        Polymer.dom(tableElem).classList.add('table-condensed');
        Polymer.dom(result3).appendChild(tableElem);
        Polymer.dom(tableElem).appendChild(getHeadTemplate());
        Polymer.dom(tableElem).appendChild(getContTemplate());

        return [result1, result2, result3];
      },

      getTimePickerMainTemplate = function () {
        var topRow = document.createElement('tr'),
          middleRow = document.createElement('tr'),
          bottomRow = document.createElement('tr');

        var tdElem, aElem, spanElem;

        if (isEnabled('h')) {
          tdElem = document.createElement('td');
          Polymer.dom(topRow).appendChild(tdElem);

          aElem = document.createElement('a');
          Polymer.dom(tdElem).appendChild(aElem);

          Polymer.dom(aElem).setAttribute('href', '#');
          Polymer.dom(aElem).setAttribute('tabindex', '-1');
          Polymer.dom(aElem).classList.add('btn');
          Polymer.dom(aElem).setAttribute('data-action', 'incrementHours');

          var upIcon = document.createElement('at-carbon-icon');
          upIcon.icon = options.nowicons.up;
          Polymer.dom(aElem).appendChild(upIcon);

          tdElem = document.createElement('td');
          Polymer.dom(middleRow).appendChild(tdElem);

          spanElem = document.createElement('span');
          Polymer.dom(tdElem).appendChild(spanElem);
          Polymer.dom(spanElem).classList.add('timepicker-hour')
          Polymer.dom(spanElem).setAttribute('data-time-component', 'hours');
          Polymer.dom(spanElem).setAttribute('data-action', 'showHours');

          tdElem = document.createElement('td');
          Polymer.dom(bottomRow).appendChild(tdElem);

          aElem = document.createElement('a');
          Polymer.dom(tdElem).appendChild(aElem);
          Polymer.dom(aElem).setAttribute('href', '#');
          Polymer.dom(aElem).setAttribute('tabindex', '-1');
          Polymer.dom(aElem).classList.add('btn');
          Polymer.dom(aElem).setAttribute('data-action', 'decrementHours');

          var downIcon = document.createElement('at-carbon-icon');
          downIcon.icon = options.nowicons.down;
          Polymer.dom(aElem).appendChild(downIcon);
        }

        if (isEnabled('m')) {
          if (isEnabled('h')) {
            tdElem = document.createElement('td');
            Polymer.dom(topRow).appendChild(tdElem);
            Polymer.dom(tdElem).classList.add('separator');
            tdElem = document.createElement('td');
            Polymer.dom(middleRow).appendChild(tdElem);
            Polymer.dom(tdElem).classList.add('separator');
            Polymer.dom(tdElem).innerHTML = ':';
            tdElem = document.createElement('td');
            Polymer.dom(bottomRow).appendChild(tdElem);
            Polymer.dom(tdElem).classList.add('separator');
          }

          // ----- for top row ----- //
          tdElem = document.createElement('td');
          Polymer.dom(topRow).appendChild(tdElem);

          aElem = document.createElement('a');
          Polymer.dom(tdElem).appendChild(aElem);
          Polymer.dom(aElem).setAttribute('href', '#');
          Polymer.dom(aElem).setAttribute('tabindex', '-1');
          Polymer.dom(aElem).classList.add('btn');
          Polymer.dom(aElem).setAttribute('data-action', 'incrementMinutes');

          upIcon = document.createElement('at-carbon-icon');
          upIcon.icon = options.nowicons.up;
          Polymer.dom(aElem).appendChild(upIcon);

          // ----- for middle row ----- //
          tdElem = document.createElement('td');
          Polymer.dom(middleRow).appendChild(tdElem);

          spanElem = document.createElement('span');
          Polymer.dom(tdElem).appendChild(spanElem);
          Polymer.dom(spanElem).classList.add('timepicker-minute');
          Polymer.dom(spanElem).setAttribute('data-time-component', 'minutes');
          Polymer.dom(spanElem).setAttribute('data-action', 'showMinutes');

          // ----- for bottom row ----- //
          tdElem = document.createElement('td');
          Polymer.dom(bottomRow).appendChild(tdElem);

          aElem = document.createElement('a');
          Polymer.dom(tdElem).appendChild(aElem);
          Polymer.dom(aElem).setAttribute('href', '#');
          Polymer.dom(aElem).setAttribute('tabindex', '-1');
          Polymer.dom(aElem).classList.add('btn');
          Polymer.dom(aElem).setAttribute('data-action', 'decrementMinutes');

          downIcon = document.createElement('at-carbon-icon');
          downIcon.icon = options.nowicons.down;
          Polymer.dom(aElem).appendChild(downIcon);
        }

        if (isEnabled('s')) {
          if (isEnabled('m')) {
            tdElem = document.createElement('td');
            Polymer.dom(topRow).appendChild(tdElem);
            Polymer.dom(tdElem).classList.add('separator');
            tdElem = document.createElement('td');
            Polymer.dom(middleRow).appendChild(tdElem);
            Polymer.dom(tdElem).classList.add('separator');
            Polymer.dom(tdElem).innerHTML = ':';
            tdElem = document.createElement('td');
            Polymer.dom(bottomRow).appendChild(tdElem);
            Polymer.dom(tdElem).classList.add('separator');
          }

          // ----- for top row ----- //
          tdElem = document.createElement('td');
          Polymer.dom(topRow).appendChild(tdElem);

          aElem = document.createElement('a');
          Polymer.dom(tdElem).appendChild(aElem);
          Polymer.dom(aElem).setAttribute('href', '#');
          Polymer.dom(aElem).setAttribute('tabindex', '-1');
          Polymer.dom(aElem).classList.add('btn');
          Polymer.dom(aElem).setAttribute('data-action', 'incrementSeconds');

          upIcon = document.createElement('at-carbon-icon');
          upIcon.icon = options.nowicons.up;
          Polymer.dom(aElem).appendChild(upIcon);

          // ----- for middle row ----- //
          tdElem = document.createElement('td');
          Polymer.dom(middleRow).appendChild(tdElem);

          spanElem = document.createElement('span');
          Polymer.dom(tdElem).appendChild(spanElem);
          Polymer.dom(spanElem).classList.add('timepicker-minute');
          Polymer.dom(spanElem).setAttribute('data-time-component', 'seconds');
          Polymer.dom(spanElem).setAttribute('data-action', 'showSeconds');

          // ----- for bottom row ----- //
          tdElem = document.createElement('td');
          Polymer.dom(bottomRow).appendChild(tdElem);

          aElem = document.createElement('a');
          Polymer.dom(tdElem).appendChild(aElem);
          Polymer.dom(aElem).setAttribute('href', '#');
          Polymer.dom(aElem).setAttribute('tabindex', '-1');
          Polymer.dom(aElem).classList.add('btn');
          Polymer.dom(aElem).setAttribute('data-action', 'decrementSeconds');

          downIcon = document.createElement('at-carbon-icon');
          downIcon.icon = options.nowicons.down;
          Polymer.dom(aElem).appendChild(downIcon);
        }

        if (!use24Hours) {
          tdElem = document.createElement('td');
          Polymer.dom(topRow).appendChild(tdElem);
          Polymer.dom(tdElem).classList.add('separator');

          tdElem = document.createElement('td');
          Polymer.dom(middleRow).appendChild(tdElem);

          var buttonElem = document.createElement('button');
          Polymer.dom(tdElem).appendChild(buttonElem);
          Polymer.dom(buttonElem).classList.add('btn');
          Polymer.dom(buttonElem).classList.add('btn-primary');
          Polymer.dom(buttonElem).setAttribute('data-action', 'togglePeriod');

          tdElem = document.createElement('td');
          Polymer.dom(bottomRow).appendChild(tdElem);
          Polymer.dom(tdElem).classList.add('separator');
        }

        var divElem = document.createElement('div');
        Polymer.dom(divElem).classList.add('timepicker-picker');
        var tableElem = document.createElement('table');
        Polymer.dom(divElem).appendChild(tableElem);
        Polymer.dom(tableElem).classList.add('table-condensed');
        Polymer.dom(tableElem).appendChild(topRow);
        Polymer.dom(tableElem).appendChild(middleRow);
        Polymer.dom(tableElem).appendChild(bottomRow);

        return divElem;
      },

      getTimePickerTemplate = function () {
        var hoursView, minutesView, secondsView, tableElem, ret;

        hoursView = document.createElement('div');
        Polymer.dom(hoursView).classList.add('timepicker-hours');
        tableElem = document.createElement('table');
        Polymer.dom(hoursView).appendChild(tableElem);
        Polymer.dom(tableElem).classList.add('table-condensed');

        minutesView = document.createElement('div');
        Polymer.dom(minutesView).classList.add('timepicker-minutes');
        tableElem = document.createElement('table');
        Polymer.dom(minutesView).appendChild(tableElem);
        Polymer.dom(tableElem).classList.add('table-condensed');

        secondsView = document.createElement('div');
        Polymer.dom(secondsView).classList.add('timepicker-seconds');
        tableElem = document.createElement('table');
        Polymer.dom(secondsView).appendChild(tableElem);
        Polymer.dom(tableElem).classList.add('table-condensed');

        ret = [getTimePickerMainTemplate()];

        if (isEnabled('h')) {
          ret.push(hoursView);
        }
        if (isEnabled('m')) {
          ret.push(minutesView);
        }
        if (isEnabled('s')) {
          ret.push(secondsView);
        }

        return ret;
      },

      getToolbar = function () {
        var row = [],
          tdElem, aElem, spanElem;
        if (options.showTodayButton) {
          tdElem = document.createElement('td');
          row.push(tdElem);

          aElem = document.createElement('a');
          Polymer.dom(tdElem).appendChild(aElem);
          Polymer.dom(aElem).setAttribute('data-action', 'today');

          var todayIcon = document.createElement('at-carbon-icon');
          todayIcon.icon = options.nowicons.today;
          Polymer.dom(aElem).appendChild(todayIcon);
        }
        if (!options.sideBySide && hasDate() && hasTime()) {
          tdElem = document.createElement('td');
          row.push(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          Polymer.dom(aElem).setAttribute('data-action', 'togglePicker');

          var switchIcon = document.createElement('at-carbon-icon');
          switchIcon.icon = options.nowicons.time;
          Polymer.dom(aElem).appendChild(switchIcon);
        }
        if (options.showClear) {
          tdElem = document.createElement('td');
          row.push(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          Polymer.dom(aElem).setAttribute('data-action', 'clear');

          var clearIcon = document.createElement('at-carbon-icon');
          clearIcon.icon = options.nowicons.clear;
          Polymer.dom(aElem).appendChild(clearIcon);
        }
        if (options.showClose) {
          tdElem = document.createElement('td');
          row.push(tdElem);

          aElem = document.createElement('a');
          Polymer.dom(tdElem).appendChild(aElem);
          Polymer.dom(aElem).setAttribute('data-action', 'close');

          var closeIcon = document.createElement('at-carbon-icon');
          closeIcon.icon = options.nowicons.close;
          Polymer.dom(aElem).appendChild(closeIcon);
        }

        var tableElem = document.createElement('table'),
          tbodyElem = document.createElement('tbody'),
          trElem = document.createElement('tr');
        Polymer.dom(tableElem).classList.add('table-condensed');
        Polymer.dom(tableElem).appendChild(tbodyElem);
        Polymer.dom(tbodyElem).appendChild(trElem);

        for (var i = 0; i < row.length; i += 1) {
          Polymer.dom(trElem).appendChild(row[i]);
        }
        return tableElem;
      },

      getTemplate = function () {
        var template = document.createElement('div'),
          dateView = document.createElement('div'),
          timeView = document.createElement('div'),
          content = document.createElement('ul'),
          toolbar = document.createElement('li'),
          i;

        Polymer.dom(template).classList.add('datetimepicker-widget');
        Polymer.dom(template).classList.add('dropdown-menu');

        Polymer.dom(dateView).classList.add('datepicker');
        var datePickerTemplate = getDatePickerTemplate();
        for (i = 0; i < datePickerTemplate.length; i++) {
          Polymer.dom(dateView).appendChild(datePickerTemplate[i]);
        }

        Polymer.dom(timeView).classList.add('timepicker');
        var timePickerTemplate = getTimePickerTemplate();
        for (i = 0; i < timePickerTemplate.length; i++) {
          Polymer.dom(timeView).appendChild(timePickerTemplate[i]);
        }

        Polymer.dom(content).classList.add('list-unstyled');

        var toolbarClass = (options.collapse ? 'accordion-toggle' : '');
        var toolbarTemplate = getToolbar();
        Polymer.dom(toolbar).classList.add('picker-switch');
        Polymer.dom(toolbar).classList.add(toolbarClass);
        Polymer.dom(toolbar).appendChild(toolbarTemplate);

        if (options.inline) {
          Polymer.dom(template).classList.remove('dropdown-menu');
        }

        if (use24Hours) {
          Polymer.dom(template).classList.add('usetwentyfour');
        }
        if (options.sideBySide && hasDate() && hasTime()) {
          Polymer.dom(template).classList.add('timepicker-sbs');
          var rowDiv = document.createElement('div');
          Polymer.dom(rowDiv).classList.add('row');

          Polymer.dom(dateView).classList.add('col-sm-6');
          Polymer.dom(rowDiv).appendChild(dateView);

          Polymer.dom(timeView).classList.add('col-sm-6');
          Polymer.dom(rowDiv).appendChild(timeView);

          Polymer.dom(template).appendChild(rowDiv);

          Polymer.dom(template).appendChild(toolbar);

          return template;
        }

        var liElem, liClass;

        if (options.toolbarPlacement === 'top') {
          Polymer.dom(content).appendChild(toolbar);
        }
        if (hasDate()) {
          liElem = document.createElement('li');
          liClass = (options.collapse && hasTime() ? 'collapse in' : '');
          if (liClass !== '') {
            utils.addClasses(liElem, liClass);
          }
          Polymer.dom(liElem).appendChild(dateView);
          Polymer.dom(content).appendChild(liElem);
        }
        if (options.toolbarPlacement === 'default') {
          Polymer.dom(content).appendChild(toolbar);
        }
        if (hasTime()) {
          liElem = document.createElement('li');
          liClass = (options.collapse && hasDate() ? 'collapse' : '');
          if (liClass !== '') {
            utils.addClasses(liElem, liClass);
          }
          Polymer.dom(liElem).appendChild(timeView);
          Polymer.dom(content).appendChild(liElem);
        }
        if (options.toolbarPlacement === 'bottom') {
          Polymer.dom(content).appendChild(toolbar);
        }

        Polymer.dom(template).appendChild(content);

        return template;
      },

      // we are not using data-* attributes
      // so this method is not needed
      dataToOptions = function () {
        var eData,
          dataOptions = {};

        if (element.is('input') || options.inline) {
          eData = element.data();
        } else {
          eData = element.find('input').data();
        }

        if (eData.dateOptions && eData.dateOptions instanceof Object) {
          dataOptions = $.extend(true, dataOptions, eData.dateOptions);
        }

        $.each(options, function (key) {
          var attributeName = 'date' + key.charAt(0).toUpperCase() + key.slice(1);
          if (eData[attributeName] !== undefined) {
            dataOptions[key] = eData[attributeName];
          }
        });
        return dataOptions;
      },

      place = function () {
        // extract html element from jQuery
        var compent = component || element; // compent = COMP[onent] + [elem]ENT
        var htmlElement = element;
        var position = {
          left: compent.offsetLeft,
          top: compent.offsetTop
        };

        var compentBoundingRect = compent.getBoundingClientRect();
        var offset = {
          left: compentBoundingRect.left,
          top: compentBoundingRect.top
        };

        //        var position = (component || element).position(),
        //          offset = (component || element).offset();
        var vertical = options.widgetPositioning.vertical,
          horizontal = options.widgetPositioning.horizontal,
          parent;

        // REMOVE THIS REFERENCE TO JQUERY WHEN JQUERY IF FINALLY REMOVED
        var htmlWidgetParent = options.widgetParent ? options.widgetParent : null;

        if (options.widgetParent) {
          parent = htmlWidgetParent;
          Polymer.dom(parent).appendChild(widget);
        } else if (utils.isTag(htmlElement, 'input')) {
          parent = htmlElement.parentElement;
          Polymer.dom(parent).appendChild(widget);
        } else if (options.inline) {
          parent = htmlElement.parentElement;
          Polymer.dom(parent).appendChild(widget);
          return;
        } else {
          var referenceElem = Polymer.dom(htmlElement).children[1];
          Polymer.dom(htmlElement).insertBefore(widget, referenceElem);
          var firstChild = Polymer.dom(htmlElement).children[0];
          parent = firstChild;
        }

        // Top and bottom logic
        if (vertical === 'auto') {
          if (offset.top + utils.elementHeight(widget) * 1.5 >= utils.windowHeight(window) + utils.windowScrollTop(window) &&
            utils.elementHeight(widget) + utils.elementOuterHeight(htmlElement) < offset.top) {
            vertical = 'top';
          } else {
            vertical = 'bottom';
          }
        }

        // Left and right logic
        var containerWidth = utils.elementOuterWidth(htmlElement);
        var widgetWidth = utils.elementOuterWidth(widget);
        if ((Math.ceil(containerWidth*0.75)) < widgetWidth) {
          horizontal = 'right';
        } else {
          horizontal = 'left';
        }

        if (vertical === 'top') {
          Polymer.dom(widget).classList.add('top');
          Polymer.dom(widget).classList.remove('bottom');
        } else {
          Polymer.dom(widget).classList.add('bottom');
          Polymer.dom(widget).classList.remove('top');
        }

        if (horizontal === 'right') {
          Polymer.dom(widget).classList.add('pull-right');
          Polymer.dom(widget).classList.remove('pull-left');
        } else {
          Polymer.dom(widget).classList.remove('pull-right');
          Polymer.dom(widget).classList.add('pull-left');
        }

        var parentStyle = window.getComputedStyle(parent);
        var parentPosition = parentStyle.getPropertyValue('position');
        var relativeParentFound = false;

        // find the first parent element that has a relative css positioning
        // it appears that when parentPosition is not relative its not possible to show the datepicker;
        // button that should trigger the datetimepicker widget is not displayed
        // code remains here because maybe in the future this case will be somehow possible
        if (parentPosition !== 'relative') {
          var parentsParent = parent;
          while (!relativeParentFound) {
            parentsParent = parentsParent.parentElement;
            if (parentsParent.nodeType !== 9) {
              var parentsPrarentStyle = window.getComputedStyle(parentsParent);
              var parentsParentPosition = parentsPrarentStyle.getPropertyValue('position');

              if (parentsParentPosition === 'relative') {
                relativeParentFound = true;
                parent = parentsParent;
              }
            }
          }
        } else {
          relativeParentFound = true;
        }

        if (!relativeParentFound) {
          throw new Error('datetimepicker component should be placed within a relative positioned container');
        }

        if (vertical === 'top') {
          widget.style.top = 'auto';
          widget.style.bottom = (position.top + utils.elementOuterHeight(htmlElement)) + 'px';
        } else {
          widget.style.top = (position.top + utils.elementOuterHeight(htmlElement)) + 'px';
          widget.style.bottom = 'auto';
        }

        if (horizontal === 'left') {
          widget.style.left = window.getComputedStyle(parent).getPropertyValue('padding-left');
          widget.style.right = 'auto';
        } else {
          widget.style.left = 'auto';
          widget.style.right = 0;
        }
      },

      notifyEvent = function (e) {
        // if (e.type === 'dp.change' && ((e.date && e.date.isSame(e.oldDate)) || (!e.date && !e.oldDate))) {
        if (e.type === 'dp.change' && (!e.date && !e.oldDate)) {
          // *ij* AT-11 2016-02-03 (YYYY-MM-DD)
          // we need dp.change to trigger when e.date && e.date.isSame(e.oldDate) because that will remove validation errors
          // if dp.change doesn't trigger, validation error remain even when value is valid
          return;
        }
        // jquery custom events can be done with dispatchEvent
        // listening to the dispatched event can be done by attaching the event listener to the
        // parent element of the element on which event is dispatched on
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(e.type, true, true, {});
        event.date = e.date;
        event.oldDate = e.oldDate;
        element.dispatchEvent(event);
      },

      showMode = function (dir) {
        if (!widget) {
          return;
        }
        if (dir) {
          currentViewMode = Math.max(minViewModeNumber, Math.min(2, currentViewMode + dir));
        }

        var findResults = Polymer.dom(widget).querySelectorAll('.datepicker > div');
        for (var findResultsIndex = 0; findResultsIndex < findResults.length; findResultsIndex += 1) {
          findResults[findResultsIndex].style.display = "none";
        }

        var filterSelector = '.datepicker-' + datePickerModes[currentViewMode].clsName;
        var filterResult = Polymer.dom(widget).querySelector(filterSelector);
        if (filterResult) {
          filterResult.style.display = "block";
        }
      },

      fillDow = function () {
        var row = document.createElement('tr');
        var currentDate = viewDate.clone().startOf('w');

        if (options.calendarWeeks === true) {
          var th = document.createElement('th');
          Polymer.dom(th).classList.add('cw');
          Polymer.dom(th).innerHTML = '#';
          Polymer.dom(row).appendChild(th);
        }

        while (currentDate.isBefore(viewDate.clone().endOf('w'))) {
          var th1 = document.createElement('th');
          Polymer.dom(th1).classList.add('dow');
          Polymer.dom(th1).innerHTML = currentDate.format('dd');
          currentDate.add(1, 'd');
        }

        var thead = Polymer.dom(widget).querySelector('.datepicker-days thead');
        if (thead !== null) {
          Polymer.dom(thead).appendChild(row);
        }
      },

      isInDisabledDates = function (testDate) {
        return options.disabledDates[testDate.format('YYYY-MM-DD')] === true;
      },

      isInEnabledDates = function (testDate) {
        return options.enabledDates[testDate.format('YYYY-MM-DD')] === true;
      },

      isValid = function (targetMoment, granularity) {
        if (!targetMoment.isValid()) {
          return false;
        }
        if (options.disabledDates && isInDisabledDates(targetMoment) && granularity !== 'M') {
          return false;
        }
        if (options.enabledDates && !isInEnabledDates(targetMoment) && granularity !== 'M') {
          return false;
        }
        if (options.minDate && targetMoment.isBefore(options.minDate, granularity)) {
          return false;
        }
        if (options.maxDate && targetMoment.isAfter(options.maxDate, granularity)) {
          return false;
        }
        if (granularity === 'd' && options.daysOfWeekDisabled.indexOf(targetMoment.day()) !== -1) { //widget && widget.find('.datepicker-days').length > 0
          return false;
        }
        return true;
      },

      fillMonths = function () {
        var spans = [],
          monthsShort = viewDate.clone().startOf('y').hour(12); // hour is changed to avoid DST issues in some browsers
        while (monthsShort.isSame(viewDate, 'y')) {
          var span = document.createElement('span');
          Polymer.dom(span).setAttribute('data-action', 'selectMonth');
          Polymer.dom(span).classList.add('month');
          Polymer.dom(span).innerHTML = monthsShort.format('MMM');
          spans.push(span);
          monthsShort.add(1, 'M');
        }

        var widgetFind = Polymer.dom(widget).querySelector('.datepicker-months td');
        if (widgetFind) {
          Polymer.dom(widgetFind).innerHTML = '';
          for (var spansIndex = 0; spansIndex < spans.length; spansIndex += 1) {
            Polymer.dom(widgetFind).appendChild(spans[spansIndex]);
          }
        }
      },

      updateMonths = function () {
        var monthsView = Polymer.dom(widget).querySelector('.datepicker-months');
        var monthsViewHeader = Polymer.dom(monthsView).querySelectorAll('th');
        var months = Polymer.dom(monthsView).querySelector('tbody').querySelectorAll('span');

        var monthsViewDisabledItems = Polymer.dom(monthsView).querySelectorAll('.disabled');
        for (var monthsViewDisabledItemsIndex = 0; monthsViewDisabledItemsIndex < monthsViewDisabledItems.length; monthsViewDisabledItemsIndex += 1) {
          var monthsViewDisabledItem = monthsViewDisabledItems[monthsViewDisabledItemsIndex];
          Polymer.dom(monthsViewDisabledItem).classList.remove('disabled');
        }

        if (!isValid(viewDate.clone().subtract(1, 'y'), 'y')) {
          Polymer.dom(monthsViewHeader[0]).classList.add('disabled');
        }

        Polymer.dom(monthsViewHeader[1]).innerHTML = viewDate.year();

        if (!isValid(viewDate.clone().add(1, 'y'), 'y')) {
          Polymer.dom(monthsViewHeader[2]).classList.add('disabled');
        }

        for (var monthsIndex = 0; monthsIndex < months.length; monthsIndex += 1) {
          var month = months[monthsIndex];
          Polymer.dom(month).classList.remove('active');
        }

        if (date.isSame(viewDate, 'y')) {
          Polymer.dom(months[date.month()]).classList.add('active');
        }

        for (var monthsIndex = 0; monthsIndex < months.length; monthsIndex += 1) {
          if (!isValid(viewDate.clone().month(monthsIndex), 'M')) {
            Polymer.dom(months[monthsIndex]).classList.add('disabled');
          }
        }
      },

      updateYears = function () {
        var yearsView = Polymer.dom(widget).querySelector('.datepicker-years');
        var yearsViewHeader = Polymer.dom(yearsView).querySelectorAll('th');
        var startYear = viewDate.clone().subtract(5, 'y');
        var endYear = viewDate.clone().add(6, 'y');
        var html = '';

        var yearsViewDisabledItems = Polymer.dom(yearsView).querySelectorAll('.disabled');
        for (var yearsViewDisabledItemsIndex = 0; yearsViewDisabledItemsIndex < yearsViewDisabledItems.length; yearsViewDisabledItems += 1) {
          var yearsViewDisabledItem = yearsViewDisabledItems[yearsViewDisabledItemsIndex];
          Polymer.dom(yearsViewDisabledItem).classList.remove('disabled');
        }

        if (options.minDate && options.minDate.isAfter(startYear, 'y')) {
          Polymer.dom(yearsViewHeader[0]).classList.add('disabled');
        }

        Polymer.dom(yearsViewHeader[1]).innerHTML = startYear.year() + '-' + endYear.year();

        if (options.maxDate && options.maxDate.isBefore(endYear, 'y')) {
          Polymer.dom(yearsViewHeader[2]).classList.add('disabled');
        }

        while (!startYear.isAfter(endYear, 'y')) {
          html += '<span data-action="selectYear" class="at-form-date year' + (startYear.isSame(date, 'y') ? ' active' : '') + (!isValid(startYear, 'y') ? ' disabled' : '') + '">' + startYear.year() + '</span>';
          startYear.add(1, 'y');
        }

        Polymer.dom(yearsView).querySelector('td').innerHTML = html;
      },

      fillDate = function () {
        if (!hasDate()) {
          return;
        }

        var daysView = Polymer.dom(widget).querySelector('.datepicker-days');
        var daysViewHeader = Polymer.dom(daysView).querySelectorAll('th');
        var currentDate,
          html = [],
          row,
          clsName;

        var daysViewDisabledItems = Polymer.dom(daysView).querySelectorAll('.disabled');
        for (var daysViewDisabledItemsIndex = 0; daysViewDisabledItemsIndex < daysViewDisabledItems.length; daysViewDisabledItems += 1) {
          var daysViewDisabledItem = daysViewDisabledItems[daysViewDisabledItemsIndex];
          Polymer.dom(daysViewDisabledItem).classList.remove('disabled');
        }

        Polymer.dom(daysViewHeader[1]).innerHTML = viewDate.format(options.dayViewHeaderFormat);

        if (!isValid(viewDate.clone().subtract(1, 'M'), 'M')) {
          Polymer.dom(daysViewHeader[0]).classList.add('disabled');
        }
        if (!isValid(viewDate.clone().add(1, 'M'), 'M')) {
          Polymer.dom(daysViewHeader[2]).classList.add('disabled');
        }

        currentDate = viewDate.clone().startOf('M').startOf('week');

        while (!viewDate.clone().endOf('M').endOf('w').isBefore(currentDate, 'd')) {
          if (currentDate.weekday() === 0) {
            row = document.createElement('tr');
            if (options.calendarWeeks) {
              var td = document.createElement('td');
              Polymer.dom(td).classList.add('cw');
              Polymer.dom(td).innerHTML = currentDate.week();
              Polymer.dom(row).appendChild(td);
            }
            html.push(row);
          }
          clsName = '';
          if (currentDate.isBefore(viewDate, 'M')) {
            clsName += ' old';
          }
          if (currentDate.isAfter(viewDate, 'M')) {
            clsName += ' new';
          }
          if (currentDate.isSame(date, 'd') && !unset) {
            clsName += ' active';
          }
          if (!isValid(currentDate, 'd')) {
            clsName += ' disabled';
          }
          if (currentDate.isSame(moment(), 'd')) {
            clsName += ' today';
          }
          if (currentDate.day() === 0 || currentDate.day() === 6) {
            clsName += ' weekend';
          }
          var tdDay = document.createElement('td');
          Polymer.dom(tdDay).setAttribute('data-action', 'selectDay');
          Polymer.dom(tdDay).classList.add('day');
          clsName = clsName.trim();
          if (clsName != '') {
            utils.addClasses(tdDay, clsName);
          }
          Polymer.dom(tdDay).innerHTML = currentDate.date();
          Polymer.dom(row).appendChild(tdDay);
          currentDate.add(1, 'd');
        }

        var daysViewTBody = Polymer.dom(daysView).querySelector('tbody');
        Polymer.dom(daysViewTBody).innerHTML = '';
        for (var htmlIndex = 0; htmlIndex < html.length; htmlIndex += 1) {
          Polymer.dom(daysViewTBody).appendChild(html[htmlIndex]);
        }

        updateMonths();

        updateYears();
        reattachEventListeners(Polymer.dom(widget).querySelector('.datepicker'));
      },

      fillHours = function () {
        var table = Polymer.dom(widget).querySelector('.timepicker-hours table');
        var currentHour = viewDate.clone().startOf('d');
        var html = [];
        var row = document.createElement('tr');

        if (viewDate.hour() > 11 && !use24Hours) {
          currentHour.hour(12);
        }
        while (currentHour.isSame(viewDate, 'd') && (use24Hours || (viewDate.hour() < 12 && currentHour.hour() < 12) || viewDate.hour() > 11)) {
          if (currentHour.hour() % 4 === 0) {
            row = document.createElement('tr');
            html.push(row);
          }
          var tdSelectHour = document.createElement('td');
          Polymer.dom(tdSelectHour).setAttribute('data-action', 'selectHour');
          Polymer.dom(tdSelectHour).classList.add('hour');
          if (!isValid(currentHour, 'h')) {
            Polymer.dom(tdSelectHour).classList.add('disabled');
          }
          Polymer.dom(tdSelectHour).innerHTML = currentHour.format(use24Hours ? 'HH' : 'hh');

          Polymer.dom(row).appendChild(tdSelectHour);

          currentHour.add(1, 'h');
        }

        if (table) {
          Polymer.dom(table).innerHTML = '';
          for (var htmlIndex = 0; htmlIndex < html.length; htmlIndex += 1) {
            Polymer.dom(table).appendChild(html[htmlIndex]);
          }
        }
      },

      fillMinutes = function () {
        var table = Polymer.dom(widget).querySelector('.timepicker-minutes table');
        var currentMinute = viewDate.clone().startOf('h');
        var html = [];
        var row = document.createElement('tr');
        var step = options.stepping === 1 ? 5 : options.stepping;

        while (viewDate.isSame(currentMinute, 'h')) {
          if (currentMinute.minute() % (step * 4) === 0) {
            row = document.createElement('tr');
            html.push(row);
          }

          var td = document.createElement('td');
          Polymer.dom(td).setAttribute('data-action', 'selectMinute');
          Polymer.dom(td).classList.add('minute');
          if (!isValid(currentMinute, 'm')) {
            Polymer.dom(td).classList.add('disabled');
          }
          Polymer.dom(td).innerHTML = currentMinute.format('mm');
          Polymer.dom(row).appendChild(td);
          currentMinute.add(step, 'm');
        }

        if (table) {
          Polymer.dom(table).innerHTML = '';
          for (var htmlIndex = 0; htmlIndex < html.length; htmlIndex += 1) {
            Polymer.dom(table).appendChild(html[htmlIndex]);
          }
        }
      },

      fillSeconds = function () {
        var table = Polymer.dom(widget).querySelector('.timepicker-seconds table');
        var currentSecond = viewDate.clone().startOf('m');
        var html = [];
        var row = document.createElement('tr');

        if (table === null) {
          return;
        }

        while (viewDate.isSame(currentSecond, 'm')) {
          if (currentSecond.second() % 20 === 0) {
            row = document.createElement('tr');
            html.push(row);
          }
          var td = document.createElement('td');
          Polymer.dom(td).setAttribute('data-action', 'selectSecond');
          Polymer.dom(td).classList.add('second');
          if (!isValid(currentSecond, 's')) {
            Polymer.dom(td).classList.add('disabled');
          }
          Polymer.dom(td).innerHTML = currentSecond.format('ss');
          Polymer.dom(row).appendChild(td);
          currentSecond.add(5, 's');
        }

        Polymer.dom(table).innerHTML = '';
        for (var htmlIndex = 0; htmlIndex < html.length; htmlIndex += 1) {
          Polymer.dom(table).appendChild(html[htmlIndex]);
        }
      },

      fillTime = function () {
        var tcIndex;
        var timeComponents = Polymer.dom(widget).querySelectorAll('.timepicker span[data-time-component]');

        if (!use24Hours) {
          var togglePeriodElem = Polymer.dom(widget).querySelector('.timepicker [data-action=togglePeriod]');
          Polymer.dom(togglePeriodElem).innerHTML = date.format('A');
        }

        for (tcIndex = 0; tcIndex < timeComponents.length; tcIndex += 1) {
          var timeComponent = timeComponents[tcIndex];
          var dtcAttrValue = timeComponent.getAttribute('data-time-component');

          if (dtcAttrValue === 'hours') {
            Polymer.dom(timeComponent).innerHTML = date.format(use24Hours ? 'HH' : 'hh');
          } else if (dtcAttrValue === 'minutes') {
            Polymer.dom(timeComponent).innerHTML = date.format('mm');
          } else if (dtcAttrValue === 'seconds') {
            Polymer.dom(timeComponent).innerHTML = date.format('ss');
          }
        }

        fillHours();
        fillMinutes();
        fillSeconds();
        reattachEventListeners(Polymer.dom(widget).querySelector('.timepicker'));
      },

      update = function () {
        if (!widget) {
          return;
        }
        fillDate();
        fillTime();
      },

      reattachEventListeners = function (container) {
        // added this here to fix broken event listeners
        // jQuery remembers what handlers to call on what html elements even
        // when elements are removed and than added back to the same place
        // in pure DOM API this doesn't happen; so we add the event listeners here
        //          tdDay.addEventListener('click', doAction);

        // DOM event attachment is currently buggy; will return to this later
        if (container) {
          var wcElems = Polymer.dom(container).querySelectorAll('[data-action]');
          var wcElemIndex, wcElem;
          for (wcElemIndex = 0; wcElemIndex < wcElems.length; wcElemIndex += 1) {
            wcElem = wcElems[wcElemIndex];
            wcElem.addEventListener('click', doAction);
          }
        }
      },

      setValue = function (targetMoment) {
        var oldDate = unset ? null : date;
        // case of calling setValue(null or false)
        if (!targetMoment) {
          unset = true;
          input.value = '';
          // element.data('date', ''); // <- this data is never read, as far as I can see
          notifyEvent({
            type: 'dp.change',
            date: null,
            oldDate: oldDate
          });
          update();
          return;
        }

        targetMoment = targetMoment.clone().locale(options.locale);

        if (options.stepping !== 1) {
          targetMoment.minutes((Math.round(targetMoment.minutes() / options.stepping) * options.stepping) % 60).seconds(0);
        }

        if (isValid(targetMoment)) {
          date = targetMoment;
          viewDate = date.clone();
          input.value = date.format(actualFormat);
          // element.data('date', date.format(actualFormat)); // <- this data is never read, as far as I can see
          update();
          unset = false;
          notifyEvent({
            type: 'dp.change',
            date: date.clone(),
            oldDate: oldDate
          });
        } else {
          if (!options.keepInvalid) {
            input.value = unset ? '' : date.format(actualFormat);
          }
          notifyEvent({
            type: 'dp.error',
            date: targetMoment
          });
        }
      },

      hide = function () {
        var transitioning = false;
        if (!widget) {
          return picker;
        }

        // Ignore event if in the middle of a picker transition
        var elemWithCollapseClass = Polymer.dom(widget).querySelector('.collapse');
        if (elemWithCollapseClass) {
          var collapseData = utils.getData(elemWithCollapseClass, 'collapse');
          if (collapseData && collapseData.transitioning) {
            transitioning = true;
          }
        }
        // Ignore event if in the middle of a picker transition
        //        widget.find('.collapse').each(function () {
        //          var collapseData = $(this).data('collapse');
        //          if (collapseData && collapseData.transitioning) {
        //            transitioning = true;
        //            return false;
        //          }
        //          return true;
        //        });
        if (transitioning) {
          return picker;
        }
        //        if (component && component.hasClass('btn')) {
        //          component.toggleClass('active');
        //        }
        if (component && Polymer.dom(component).classList.contains('btn')) {
          if (Polymer.dom(component).classList.contains('active')) {
            Polymer.dom(component).classList.remove('active');
          } else {
            Polymer.dom(component).classList.add('active');
          }
        }
        widget.style.display = "none";
        //        widget.hide();

        window.removeEventListener('resize', place);
        //        $(window).off('resize', place);
        //        widget.off('click', '[data-action]');
        var nojqWidgetChildren = Polymer.dom(widget).querySelectorAll('[data-action]');
        for (var nojqwcIndex = 0; nojqwcIndex < nojqWidgetChildren.length; nojqwcIndex += 1) {
          var nojqwChild = nojqWidgetChildren[nojqwcIndex];
          nojqwChild.removeEventListener('click', doAction);
        }
        widget.removeEventListener('mousedown', utils.returnFalse);
        //        widget.off('mousedown', false);

        var parentElement = Polymer.dom(widget).parentNode;
        Polymer.dom(parentElement).removeChild(widget);
        //        widget.remove();
        widget = false;

        notifyEvent({
          type: 'dp.hide',
          date: date.clone()
        });
        return picker;
      },

      clear = function () {
        setValue(null);
      },

      /********************************************************************************
       *
       * Widget UI interaction functions
       *
       ********************************************************************************/
      actions = {
        next: function () {
          viewDate.add(datePickerModes[currentViewMode].navStep, datePickerModes[currentViewMode].navFnc);
          fillDate();
        },

        previous: function () {
          viewDate.subtract(datePickerModes[currentViewMode].navStep, datePickerModes[currentViewMode].navFnc);
          fillDate();
        },

        pickerSwitch: function () {
          showMode(1);
        },

        selectMonth: function (e) {
          var spans = utils.closestByTagName(e.target, 'tbody').querySelectorAll('span');
          var month = utils.indexOf(spans, e.target);
          viewDate.month(month);
          if (currentViewMode === minViewModeNumber) {
            setValue(date.clone().year(viewDate.year()).month(viewDate.month()));
            if (!options.inline) {
              hide();
            }
          } else {
            showMode(-1);
            fillDate();
          }
        },

        selectYear: function (e) {
          var targetTextIntValue = parseInt(e.target.textContent, 10);
          var year = targetTextIntValue || 0;
          viewDate.year(year);
          if (currentViewMode === minViewModeNumber) {
            setValue(date.clone().year(viewDate.year()));
            if (!options.inline) {
              hide();
            }
          } else {
            showMode(-1);
            fillDate();
          }
        },

        selectDay: function (e) {
          var day = viewDate.clone();
          if (e.target.classList.contains('old')) {
            day.subtract(1, 'M');
          }
          if (e.target.classList.contains('new')) {
            day.add(1, 'M');
          }
          var targetTextIntValue = parseInt(e.target.textContent, 10);
          setValue(day.date(targetTextIntValue));
          if (!hasTime() && !options.keepOpen && !options.inline) {
            hide();
          }
        },

        incrementHours: function () {
          setValue(date.clone().add(1, 'h'));
        },

        incrementMinutes: function () {
          setValue(date.clone().add(options.stepping, 'm'));
        },

        incrementSeconds: function () {
          setValue(date.clone().add(1, 's'));
        },

        decrementHours: function () {
          setValue(date.clone().subtract(1, 'h'));
        },

        decrementMinutes: function () {
          setValue(date.clone().subtract(options.stepping, 'm'));
        },

        decrementSeconds: function () {
          setValue(date.clone().subtract(1, 's'));
        },

        togglePeriod: function () {
          setValue(date.clone().add((date.hours() >= 12) ? -12 : 12, 'h'));
        },

        togglePicker: function (e) {
          var parent = utils.closestByTagName(e.target, 'ul'),
            expanded = parent.querySelector('.in'),
            closed = parent.querySelector('.collapse:not(.in)'),
            collapseData;

          if (expanded) {
            collapseData = utils.getData(expanded, 'collapse');
            if (collapseData && collapseData.transitioning) {
              return;
            }
            //if (expanded.collapse) { // if collapse plugin is available through bootstrap.js then use it
            if (utils.collapse) { // if collapse plugin is available through bootstrap.js then use it
              utils.collapse(expanded, 'hide');
              utils.collapse(closed, 'show');
            } else { // otherwise just toggle in class on the two views
              expanded.classList.remove('in');
              closed.classList.add('in');
            }

            if (utils.isTag(e.target, 'at-carbon-icon')) {
              if (e.target.icon === options.nowicons.date) {
                e.target.icon = options.nowicons.time;
              } else {
                e.target.icon = options.nowicons.date;
              }
            } else {
              var spans = e.target.querySelectorAll('at-carbon-icon');
              for (var spansIndex = 0; spansIndex < spans.length; spansIndex += 1) {
                var spanElem = spans[spansIndex];
                if (spanElem.icon === options.nowicons.date) {
                  spanElem.icon = options.nowicons.time;
                } else {
                  spanElem.icon = options.nowicons.date;
                }
              }
            }

            // NOTE: uncomment if toggled state will be restored in show()
            //if (component) {
            //    component.find('span').toggleClass(options.icons.time + ' ' + options.icons.date);
            //}
          }
        },

        showPicker: function () {
          var elems1 = widget.querySelectorAll('.timepicker > div:not(.timepicker-picker)');
          var elems2 = widget.querySelectorAll('.timepicker .timepicker-picker');

          utils.hide(elems1);
          utils.show(elems2);
        },

        showHours: function () {
          var elems1 = widget.querySelectorAll('.timepicker .timepicker-picker');
          var elems2 = widget.querySelectorAll('.timepicker .timepicker-hours');

          utils.hide(elems1);
          utils.show(elems2);
        },

        showMinutes: function () {
          var elems1 = widget.querySelectorAll('.timepicker .timepicker-picker');
          var elems2 = widget.querySelectorAll('.timepicker .timepicker-minutes');

          utils.hide(elems1);
          utils.show(elems2);
        },

        showSeconds: function () {
          var elems1 = widget.querySelectorAll('.timepicker .timepicker-picker');
          var elems2 = widget.querySelectorAll('.timepicker .timepicker-seconds');

          utils.hide(elems1);
          utils.show(elems2);
        },

        selectHour: function (e) {
          var hour = parseInt(e.target.textContent, 10);

          if (!use24Hours) {
            if (date.hours() >= 12) {
              if (hour !== 12) {
                hour += 12;
              }
            } else {
              if (hour === 12) {
                hour = 0;
              }
            }
          }
          setValue(date.clone().hours(hour));
          actions.showPicker.call(picker);
        },

        selectMinute: function (e) {
          setValue(date.clone().minutes(parseInt(e.target.textContent, 10)));
          actions.showPicker.call(picker);
        },

        selectSecond: function (e) {
          setValue(date.clone().seconds(parseInt(e.target.textContent, 10)));
          actions.showPicker.call(picker);
        },

        clear: clear,

        today: function () {
          setValue(moment());
        },

        close: hide
      },

      doAction = function (e) {
        if (e.currentTarget.classList.contains('disabled')) {
          return false;
        }
        var actionName = e.currentTarget.getAttribute('data-action');
        actions[actionName].apply(picker, arguments);
        return false;
      },

      show = function () {
        var currentMoment,
          useCurrentGranularity = {
            'year': function (m) {
              return m.month(0).date(1).hours(0).seconds(0).minutes(0);
            },
            'month': function (m) {
              return m.date(1).hours(0).seconds(0).minutes(0);
            },
            'day': function (m) {
              return m.hours(0).seconds(0).minutes(0);
            },
            'hour': function (m) {
              return m.seconds(0).minutes(0);
            },
            'minute': function (m) {
              return m.seconds(0);
            }
          };

        if (input.hasAttribute('disabled') || (!options.ignoreReadonly && input.hasAttribute('readonly')) || widget) {
          return picker;
        }
        if (options.useCurrent && unset && ((utils.isTag(input, 'input') && input.value.trim().length === 0) || options.inline)) {
          currentMoment = moment();
          if (typeof options.useCurrent === 'string') {
            currentMoment = useCurrentGranularity[options.useCurrent](currentMoment);
          }
          setValue(currentMoment);
        }

        widget = getTemplate();

        fillDow();
        fillMonths();

        var timepickerHours = widget.querySelectorAll('.timepicker-hours');
        utils.hide(timepickerHours);
        var timepickerMinuts = widget.querySelectorAll('.timepicker-minutes');
        utils.hide(timepickerMinuts);
        var timepickerSeconds = widget.querySelectorAll('.timepicker-seconds');
        utils.hide(timepickerSeconds);

        update();
        showMode();

        //        $(window).on('resize', place);
        window.addEventListener('resize', place);


        //        widget.addEventListener('click', doAction);
        widget.addEventListener('mousedown', utils.returnFalse);

        reattachEventListeners(widget);

        //        widget = $(widget);
        //        widget.on('click', '[data-action]', doAction); // this handles clicks on the widget
        //        widget.on('mousedown', utils.returnFalse);
        //        widget = widget.get(0);

        if (component && component.classList.contains('btn')) {
          utils.toggleClass(component, 'active');
        }

        widget.style.display = 'block';
        place();

        var isFocus = input.parentElement.querySelectorAll(':focus').length > 0;
        if (!isFocus) {
          widget.setAttribute('tabindex', "0");
          input.focus();
        }

        notifyEvent({
          type: 'dp.show'
        });
        return picker;
      },

      toggle = function () {
        return (widget ? hide() : show());
      },

      parseInputDate = function (inputDate) {
        if (moment.isMoment(inputDate) || inputDate instanceof Date) {
          inputDate = moment(inputDate);
        } else {
          inputDate = moment(inputDate, parseFormats, options.useStrict);
        }
        inputDate.locale(options.locale);
        return inputDate;
      },

      keydown = function (e) {
        //if (e.keyCode === 27 && widget) { // allow escape to hide picker
        //    hide();
        //    return false;
        //}
        //if (e.keyCode === 40 && !widget) { // allow down to show picker
        //    show();
        //    e.preventDefault();
        //}
        //return true;

        var handler = null,
          index,
          index2,
          pressedKeys = [],
          pressedModifiers = {},
          currentKey = e.which,
          keyBindKeys,
          allModifiersPressed,
          pressed = 'p';

        keyState[currentKey] = pressed;

        for (index in keyState) {
          if (keyState.hasOwnProperty(index) && keyState[index] === pressed) {
            pressedKeys.push(index);
            if (parseInt(index, 10) !== currentKey) {
              pressedModifiers[index] = true;
            }
          }
        }

        for (index in options.keyBinds) {
          if (options.keyBinds.hasOwnProperty(index) && typeof (options.keyBinds[index]) === 'function') {
            keyBindKeys = index.split(' ');
            if (keyBindKeys.length === pressedKeys.length && keyMap[currentKey] === keyBindKeys[keyBindKeys.length - 1]) {
              allModifiersPressed = true;
              for (index2 = keyBindKeys.length - 2; index2 >= 0; index2--) {
                if (!(keyMap[keyBindKeys[index2]] in pressedModifiers)) {
                  allModifiersPressed = false;
                  break;
                }
              }
              if (allModifiersPressed) {
                handler = options.keyBinds[index];
                break;
              }
            }
          }
        }

        if (handler) {
          handler.call(picker, widget);
          e.stopPropagation();
          e.preventDefault();
        }
      },

      keyup = function (e) {
        keyState[e.which] = 'r';
        e.stopPropagation();
        e.preventDefault();
      },

      change = function (e) {
        var val = e.target.value.trim();
        var parsedDate = val ? parseInputDate(val) : null;
        setValue(parsedDate);
        e.stopImmediatePropagation();
        return false;
      },

      attachDatePickerElementEvents = function () {
        //        input.on({
        //          'change': change,
        //          'blur': options.debug ? '' : hide,
        //          'keydown': keydown,
        //          'keyup': keyup
        //        });

        //        var nojqInput = input.get(0);
        input.addEventListener('change', change);
        if (!options.debug) {
          input.addEventListener('blur', function (event) {
            // *ij*
            // When input goes out of focus, hide function is called.
            // hide function destroys the UI Widget.
            // The "out of focus" happens when user clicks on the UI widget.
            // But when user clicks on the UI widget a click callback function should be executed.
            // Its not executed because blur is triggered by the browser first,
            // so click never gets the chance.
            // hide function is called when the user has not clicked the widget
            if (event.relatedTarget !== widget) {
              if (event.relatedTarget === null) {
                // event.relatedTarget is null when user clicks outside the widget and the input
                hide();
              } else if (utils.isChildOf(event.relatedTarget, widget)) {
                // user has clicked somewhere on the widget; fosuc the input field
                // this  focusing ensures that this blur handler can be called again
                input.focus();
              } else {
                hide();
              }
            } else if (utils.isChildOf(event.relatedTarget, widget)) {
              // user has clicked somewhere on the widget; fosuc the input field
              // this  focusing ensures that this blur handler can be called again
              input.focus();
            } else {
              hide();
            }
          });
        }
        input.addEventListener('keydown', keydown);
        input.addEventListener('keyup', keyup);

        //        if (element.is('input')) {
        //          input.on({
        //            'focus': show
        //          });
        //        } else if (component) {
        //          component.on('click', toggle);
        //          component.on('mousedown', false);
        //        }

        if (utils.isTag(component, 'input')) {
          input.addEventListener('focus', show);
        } else if (component) {
          component.addEventListener('click', toggle);
          component.addEventListener('mousedown', utils.returnFalse);
        }

      },

      detachDatePickerElementEvents = function () {
        input.removeEventListener('change', change);
        input.removeEventListener('blur', hide);
        input.removeEventListener('keydown', keydown);
        input.removeEventListener('keyup', keyup);
        //        input.off({
        //          'change': change,
        //          'blur': hide,
        //          'keydown': keydown,
        //          'keyup': keyup
        //        });

        if (utils.isTag(element, 'input')) {
          input.removeEventListener('focus', show);
        } else if (element) {
          element.removeEventListener('click', toggle);
          element.removeEventListener('mousedown', utils.returnFalse);
        }
        //        if (element.is('input')) {
        //          input.off({
        //            'focus': show
        //          });
        //        } else if (component) {
        //          component.off('click', toggle);
        //          component.off('mousedown', false);
        //        }
      },

      indexGivenDates = function (givenDatesArray) {
        // Store given enabledDates and disabledDates as keys.
        // This way we can check their existence in O(1) time instead of looping through whole array.
        // (for example: options.enabledDates['2014-02-27'] === true)
        var givenDatesIndexed = {};
        $.each(givenDatesArray, function () {
          var dDate = parseInputDate(this);
          if (dDate.isValid()) {
            givenDatesIndexed[dDate.format('YYYY-MM-DD')] = true;
          }
        });
        return (Object.keys(givenDatesIndexed).length) ? givenDatesIndexed : false;
      },

      initFormatting = function () {
        var format = options.format || 'L LT';

        actualFormat = format.replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, function (formatInput) {
          var newinput = date.localeData().longDateFormat(formatInput) || formatInput;
          return newinput.replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, function (formatInput2) { //temp fix for #740
            return date.localeData().longDateFormat(formatInput2) || formatInput2;
          });
        });


        parseFormats = options.extraFormats ? options.extraFormats.slice() : [];
        if (parseFormats.indexOf(format) < 0 && parseFormats.indexOf(actualFormat) < 0) {
          parseFormats.push(actualFormat);
        }

        use24Hours = (actualFormat.toLowerCase().indexOf('a') < 1 && actualFormat.indexOf('h') < 1);

        if (isEnabled('y')) {
          minViewModeNumber = 2;
        }
        if (isEnabled('M')) {
          minViewModeNumber = 1;
        }
        if (isEnabled('d')) {
          minViewModeNumber = 0;
        }

        currentViewMode = Math.max(minViewModeNumber, currentViewMode);

        if (!unset) {
          setValue(date);
        }
      };

    /********************************************************************************
     *
     * Public API functions
     * =====================
     *
     * Important: Do not expose direct references to private objects or the options
     * object to the outer world. Always return a clone when returning values or make
     * a clone when setting a private variable.
     *
     ********************************************************************************/
    picker.destroy = function () {
      hide();
      detachDatePickerElementEvents();
      //      element.removeData('DateTimePicker');
      //      element.removeData('date');
      var nojqElement = element.get(0);
      utils.removeData(nojqElement, 'DateTimePicker');
      utils.removeData(nojqElement, 'date');
    };

    picker.toggle = toggle;

    picker.show = show;

    picker.hide = hide;

    picker.disable = function () {
      hide();
      //      if (component && component.hasClass('btn')) {
      //        component.addClass('disabled');
      //      }

      if (component && component.classList.contains('btn')) {
        component.classList.add('disabled');
      }

      //      input.prop('disabled', true);

      //      var nojqInput = input.get(0);
      input.setAttribute('disabled', true);

      return picker;
    };

    picker.enable = function () {
      //      if (component && component.hasClass('btn')) {
      //        component.removeClass('disabled');
      //      }
      if (component && component.classList.contains('btn')) {
        component.classList.remove('disabled');
      }

      //      input.prop('disabled', false);
      //      var nojqInput = input.get(0);
      input.removeAttribute('disabled');

      return picker;
    };

    picker.ignoreReadonly = function (ignoreReadonly) {
      if (arguments.length === 0) {
        return options.ignoreReadonly;
      }
      if (typeof ignoreReadonly !== 'boolean') {
        throw new TypeError('ignoreReadonly () expects a boolean parameter');
      }
      options.ignoreReadonly = ignoreReadonly;
      return picker;
    };

    picker.options = function (newOptions) {
      if (arguments.length === 0) {
        return utils.extend(true, {}, options);
        //        return $.extend(true, {}, options);
      }

      if (!(newOptions instanceof Object)) {
        throw new TypeError('options() options parameter should be an object');
      }
      //      $.extend(true, options, newOptions);
      utils.extend(true, options, newOptions);

      var key, value;
      for (key in options) {
        value = options[key];
        if (picker[key] !== undefined) {
          picker[key](value);
        } else {
          throw new TypeError('option ' + key + ' is not recognized!');
        }
      }

      //      $.each(options, function (key, value) {
      //        if (picker[key] !== undefined) {
      //          picker[key](value);
      //        } else {
      //          throw new TypeError('option ' + key + ' is not recognized!');
      //        }
      //      });
      return picker;
    };

    picker.date = function (newDate) {
      if (arguments.length === 0) {
        if (unset) {
          return null;
        }
        return date.clone();
      }

      if (newDate !== null && typeof newDate !== 'string' && !moment.isMoment(newDate) && !(newDate instanceof Date)) {
        throw new TypeError('date() parameter must be one of [null, string, moment or Date]');
      }

      setValue(newDate === null ? null : parseInputDate(newDate));
      return picker;
    };

    picker.format = function (newFormat) {
      if (arguments.length === 0) {
        return options.format;
      }

      if ((typeof newFormat !== 'string') && ((typeof newFormat !== 'boolean') || (newFormat !== false))) {
        throw new TypeError('format() expects a sting or boolean:false parameter ' + newFormat);
      }

      options.format = newFormat;
      if (actualFormat) {
        initFormatting(); // reinit formatting
      }
      return picker;
    };

    picker.dayViewHeaderFormat = function (newFormat) {
      if (arguments.length === 0) {
        return options.dayViewHeaderFormat;
      }

      if (typeof newFormat !== 'string') {
        throw new TypeError('dayViewHeaderFormat() expects a string parameter');
      }

      options.dayViewHeaderFormat = newFormat;
      return picker;
    };

    picker.extraFormats = function (formats) {
      if (arguments.length === 0) {
        return options.extraFormats;
      }

      if (formats !== false && !(formats instanceof Array)) {
        throw new TypeError('extraFormats() expects an array or false parameter');
      }

      options.extraFormats = formats;
      if (parseFormats) {
        initFormatting(); // reinit formatting
      }
      return picker;
    };

    picker.disabledDates = function (dates) {
      if (arguments.length === 0) {
        return (options.disabledDates ? utils.extend({}, options.disabledDates) : options.disabledDates);
      }

      if (!dates) {
        options.disabledDates = false;
        update();
        return picker;
      }
      if (!(dates instanceof Array)) {
        throw new TypeError('disabledDates() expects an array parameter');
      }
      options.disabledDates = indexGivenDates(dates);
      options.enabledDates = false;
      update();
      return picker;
    };

    picker.enabledDates = function (dates) {
      if (arguments.length === 0) {
        return (options.enabledDates ? utils.extend({}, options.enabledDates) : options.enabledDates);
      }

      if (!dates) {
        options.enabledDates = false;
        update();
        return picker;
      }
      if (!(dates instanceof Array)) {
        throw new TypeError('enabledDates() expects an array parameter');
      }
      options.enabledDates = indexGivenDates(dates);
      options.disabledDates = false;
      update();
      return picker;
    };

    picker.daysOfWeekDisabled = function (daysOfWeekDisabled) {
      if (arguments.length === 0) {
        return options.daysOfWeekDisabled.splice(0);
      }

      if (!(daysOfWeekDisabled instanceof Array)) {
        throw new TypeError('daysOfWeekDisabled() expects an array parameter');
      }
      options.daysOfWeekDisabled = daysOfWeekDisabled.reduce(function (previousValue, currentValue) {
        currentValue = parseInt(currentValue, 10);
        if (currentValue > 6 || currentValue < 0 || isNaN(currentValue)) {
          return previousValue;
        }
        if (previousValue.indexOf(currentValue) === -1) {
          previousValue.push(currentValue);
        }
        return previousValue;
      }, []).sort();
      update();
      return picker;
    };

    picker.maxDate = function (maxDate) {
      if (arguments.length === 0) {
        return options.maxDate ? options.maxDate.clone() : options.maxDate;
      }

      if ((typeof maxDate === 'boolean') && maxDate === false) {
        options.maxDate = false;
        update();
        return picker;
      }

      if (typeof maxDate === 'string') {
        if (maxDate === 'now' || maxDate === 'moment') {
          maxDate = moment();
        }
      }

      var parsedDate = parseInputDate(maxDate);

      if (!parsedDate.isValid()) {
        throw new TypeError('maxDate() Could not parse date parameter: ' + maxDate);
      }
      if (options.minDate && parsedDate.isBefore(options.minDate)) {
        throw new TypeError('maxDate() date parameter is before options.minDate: ' + parsedDate.format(actualFormat));
      }
      options.maxDate = parsedDate;
      if (options.maxDate.isBefore(maxDate)) {
        setValue(options.maxDate);
      }
      if (viewDate.isAfter(parsedDate)) {
        viewDate = parsedDate.clone();
      }
      update();
      return picker;
    };

    picker.minDate = function (minDate) {
      if (arguments.length === 0) {
        return options.minDate ? options.minDate.clone() : options.minDate;
      }

      if ((typeof minDate === 'boolean') && minDate === false) {
        options.minDate = false;
        update();
        return picker;
      }

      if (typeof minDate === 'string') {
        if (minDate === 'now' || minDate === 'moment') {
          minDate = moment();
        }
      }

      var parsedDate = parseInputDate(minDate);

      if (!parsedDate.isValid()) {
        throw new TypeError('minDate() Could not parse date parameter: ' + minDate);
      }
      if (options.maxDate && parsedDate.isAfter(options.maxDate)) {
        throw new TypeError('minDate() date parameter is after options.maxDate: ' + parsedDate.format(actualFormat));
      }
      options.minDate = parsedDate;
      if (options.minDate.isAfter(minDate)) {
        setValue(options.minDate);
      }
      if (viewDate.isBefore(parsedDate)) {
        viewDate = parsedDate.clone();
      }
      update();
      return picker;
    };

    picker.defaultDate = function (defaultDate) {
      if (arguments.length === 0) {
        return options.defaultDate ? options.defaultDate.clone() : options.defaultDate;
      }
      if (!defaultDate) {
        options.defaultDate = false;
        return picker;
      }

      if (typeof defaultDate === 'string') {
        if (defaultDate === 'now' || defaultDate === 'moment') {
          defaultDate = moment();
        }
      }

      var parsedDate = parseInputDate(defaultDate);
      if (!parsedDate.isValid()) {
        throw new TypeError('defaultDate() Could not parse date parameter: ' + defaultDate);
      }
      if (!isValid(parsedDate)) {
        throw new TypeError('defaultDate() date passed is invalid according to component setup validations');
      }

      options.defaultDate = parsedDate;

      if (options.defaultDate && nojqInput.value.trim() === '' && input.getAttribute('placeholder') === undefined) {
        setValue(options.defaultDate);
      }
      return picker;
    };

    picker.locale = function (locale) {
      if (arguments.length === 0) {
        return options.locale;
      }

      if (!moment.localeData(locale)) {
        throw new TypeError('locale() locale ' + locale + ' is not loaded from moment locales!');
      }

      options.locale = locale;
      date.locale(options.locale);
      viewDate.locale(options.locale);

      if (actualFormat) {
        initFormatting(); // reinit formatting
      }
      if (widget) {
        hide();
        show();
      }
      return picker;
    };

    picker.stepping = function (stepping) {
      if (arguments.length === 0) {
        return options.stepping;
      }

      stepping = parseInt(stepping, 10);
      if (isNaN(stepping) || stepping < 1) {
        stepping = 1;
      }
      options.stepping = stepping;
      return picker;
    };

    picker.useCurrent = function (useCurrent) {
      var useCurrentOptions = ['year', 'month', 'day', 'hour', 'minute'];
      if (arguments.length === 0) {
        return options.useCurrent;
      }

      if ((typeof useCurrent !== 'boolean') && (typeof useCurrent !== 'string')) {
        throw new TypeError('useCurrent() expects a boolean or string parameter');
      }
      if (typeof useCurrent === 'string' && useCurrentOptions.indexOf(useCurrent.toLowerCase()) === -1) {
        throw new TypeError('useCurrent() expects a string parameter of ' + useCurrentOptions.join(', '));
      }
      options.useCurrent = useCurrent;
      return picker;
    };

    picker.collapse = function (collapse) {
      if (arguments.length === 0) {
        return options.collapse;
      }

      if (typeof collapse !== 'boolean') {
        throw new TypeError('collapse() expects a boolean parameter');
      }
      if (options.collapse === collapse) {
        return picker;
      }
      options.collapse = collapse;
      if (widget) {
        hide();
        show();
      }
      return picker;
    };

    picker.nowicons = function (icons) {
      if (arguments.length === 0) {
        return utils.extend({}, options.icons);
      }

      if (!(icons instanceof Object)) {
        throw new TypeError('nowicons() expects parameter to be an Object');
      }
      utils.extend(options.icons, icons);
      if (widget) {
        hide();
        show();
      }
      return picker;
    };

    picker.useStrict = function (useStrict) {
      if (arguments.length === 0) {
        return options.useStrict;
      }

      if (typeof useStrict !== 'boolean') {
        throw new TypeError('useStrict() expects a boolean parameter');
      }
      options.useStrict = useStrict;
      return picker;
    };

    picker.sideBySide = function (sideBySide) {
      if (arguments.length === 0) {
        return options.sideBySide;
      }

      if (typeof sideBySide !== 'boolean') {
        throw new TypeError('sideBySide() expects a boolean parameter');
      }
      options.sideBySide = sideBySide;
      if (widget) {
        hide();
        show();
      }
      return picker;
    };

    picker.viewMode = function (viewMode) {
      if (arguments.length === 0) {
        return options.viewMode;
      }

      if (typeof viewMode !== 'string') {
        throw new TypeError('viewMode() expects a string parameter');
      }

      if (viewModes.indexOf(viewMode) === -1) {
        throw new TypeError('viewMode() parameter must be one of (' + viewModes.join(', ') + ') value');
      }

      options.viewMode = viewMode;
      currentViewMode = Math.max(viewModes.indexOf(viewMode), minViewModeNumber);

      showMode();
      return picker;
    };

    picker.toolbarPlacement = function (toolbarPlacement) {
      if (arguments.length === 0) {
        return options.toolbarPlacement;
      }

      if (typeof toolbarPlacement !== 'string') {
        throw new TypeError('toolbarPlacement() expects a string parameter');
      }
      if (toolbarPlacements.indexOf(toolbarPlacement) === -1) {
        throw new TypeError('toolbarPlacement() parameter must be one of (' + toolbarPlacements.join(', ') + ') value');
      }
      options.toolbarPlacement = toolbarPlacement;

      if (widget) {
        hide();
        show();
      }
      return picker;
    };

    picker.widgetPositioning = function (widgetPositioning) {
      if (arguments.length === 0) {
        return utils.extend({}, options.widgetPositioning);
      }

      if (({}).toString.call(widgetPositioning) !== '[object Object]') {
        throw new TypeError('widgetPositioning() expects an object variable');
      }
      if (widgetPositioning.horizontal) {
        if (typeof widgetPositioning.horizontal !== 'string') {
          throw new TypeError('widgetPositioning() horizontal variable must be a string');
        }
        widgetPositioning.horizontal = widgetPositioning.horizontal.toLowerCase();
        if (horizontalModes.indexOf(widgetPositioning.horizontal) === -1) {
          throw new TypeError('widgetPositioning() expects horizontal parameter to be one of (' + horizontalModes.join(', ') + ')');
        }
        options.widgetPositioning.horizontal = widgetPositioning.horizontal;
      }
      if (widgetPositioning.vertical) {
        if (typeof widgetPositioning.vertical !== 'string') {
          throw new TypeError('widgetPositioning() vertical variable must be a string');
        }
        widgetPositioning.vertical = widgetPositioning.vertical.toLowerCase();
        if (verticalModes.indexOf(widgetPositioning.vertical) === -1) {
          throw new TypeError('widgetPositioning() expects vertical parameter to be one of (' + verticalModes.join(', ') + ')');
        }
        options.widgetPositioning.vertical = widgetPositioning.vertical;
      }
      update();
      return picker;
    };

    picker.calendarWeeks = function (calendarWeeks) {
      if (arguments.length === 0) {
        return options.calendarWeeks;
      }

      if (typeof calendarWeeks !== 'boolean') {
        throw new TypeError('calendarWeeks() expects parameter to be a boolean value');
      }

      options.calendarWeeks = calendarWeeks;
      update();
      return picker;
    };

    picker.showTodayButton = function (showTodayButton) {
      if (arguments.length === 0) {
        return options.showTodayButton;
      }

      if (typeof showTodayButton !== 'boolean') {
        throw new TypeError('showTodayButton() expects a boolean parameter');
      }

      options.showTodayButton = showTodayButton;
      if (widget) {
        hide();
        show();
      }
      return picker;
    };

    picker.showClear = function (showClear) {
      if (arguments.length === 0) {
        return options.showClear;
      }

      if (typeof showClear !== 'boolean') {
        throw new TypeError('showClear() expects a boolean parameter');
      }

      options.showClear = showClear;
      if (widget) {
        hide();
        show();
      }
      return picker;
    };

    // TODO this function and options.widgetParent can be removed because its not needed for our use case
    picker.widgetParent = function (widgetParent) {
      if (arguments.length === 0) {
        return options.widgetParent;
      }

      //      if (typeof widgetParent === 'string') {
      //        widgetParent = $(widgetParent);
      //      }

      //      if (widgetParent !== null && (typeof widgetParent !== 'string' && !(widgetParent instanceof $))) {
      //        throw new TypeError('widgetParent() expects a string or a jQuery object parameter');
      //      }

      options.widgetParent = widgetParent;
      if (widget) {
        hide();
        show();
      }
      return picker;
    };

    picker.keepOpen = function (keepOpen) {
      if (arguments.length === 0) {
        return options.keepOpen;
      }

      if (typeof keepOpen !== 'boolean') {
        throw new TypeError('keepOpen() expects a boolean parameter');
      }

      options.keepOpen = keepOpen;
      return picker;
    };

    picker.inline = function (inline) {
      if (arguments.length === 0) {
        return options.inline;
      }

      if (typeof inline !== 'boolean') {
        throw new TypeError('inline() expects a boolean parameter');
      }

      options.inline = inline;
      return picker;
    };

    picker.clear = function () {
      clear();
      return picker;
    };

    picker.keyBinds = function (keyBinds) {
      options.keyBinds = keyBinds;
      return picker;
    };

    picker.debug = function (debug) {
      if (typeof debug !== 'boolean') {
        throw new TypeError('debug() expects a boolean parameter');
      }

      options.debug = debug;
      return picker;
    };

    picker.showClose = function (showClose) {
      if (arguments.length === 0) {
        return options.showClose;
      }

      if (typeof showClose !== 'boolean') {
        throw new TypeError('showClose() expects a boolean parameter');
      }

      options.showClose = showClose;
      return picker;
    };

    picker.keepInvalid = function (keepInvalid) {
      if (arguments.length === 0) {
        return options.keepInvalid;
      }

      if (typeof keepInvalid !== 'boolean') {
        throw new TypeError('keepInvalid() expects a boolean parameter');
      }
      options.keepInvalid = keepInvalid;
      return picker;
    };

    picker.datepickerInput = function (datepickerInput) {
      if (arguments.length === 0) {
        return options.datepickerInput;
      }

      if (typeof datepickerInput !== 'string') {
        throw new TypeError('datepickerInput() expects a string parameter');
      }

      options.datepickerInput = datepickerInput;
      return picker;
    };

    // initializing element and component attributes
    //    if (element.is('input')) {
    //      input = element;
    //    } else {
    //      input = element.find(options.datepickerInput);
    //      if (input.size() === 0) {
    //        input = element.find('input');
    //      } else if (!input.is('input')) {
    //        throw new Error('CSS class "' + options.datepickerInput + '" cannot be applied to non input element');
    //      }
    //    }

    if (utils.isTag(element, 'input')) {
      input = element;
    } else {
      input = element.querySelector(options.datepickerInput);
      if (!input) {
        input = element.querySelector('input');
      } else if (!utils.isTag(input, 'input')) {
        throw new Error('CSS class "' + options.datepickerInput + '" cannot be applied to non input element');
      }
    }

    if (element.classList.contains('input-group')) {
      // in case there is more then one 'input-group-addon' Issue #48
      var datePicketButton = element.querySelectorAll('.datepickerbutton');
      if (datePicketButton.length === 0) {
        component = element.querySelector('[class^="input-group-"]');
      } else {
        component = element.querySelector('.datepickerbutton');
      }
    }

    if (!options.inline && !utils.isTag(input, 'input')) {
      throw new Error('Could not initialize DateTimePicker without an input element');
    }

    // we are ignoring data-* attributes because we are not using them
    //var dataToOptionsResult = dataToOptions();
    //$.extend(true, options, dataToOptionsResult);

    picker.options(options);

    initFormatting();

    attachDatePickerElementEvents();

    if (input.hasAttribute('disabled')) {
      picker.disable();
    }
    if (utils.isTag(input, 'input') && input.value.trim().length !== 0) {
      setValue(parseInputDate(input.value.trim()));
    } else if (options.defaultDate && input.hasAttribute('placeholder')) {
      setValue(options.defaultDate);
    }
    if (options.inline) {
      show();
    }
    return picker;
  };

  /********************************************************************************
   *
   * jQuery plugin constructor and defaults object
   *
   ********************************************************************************/

  utils.datetimepicker = function (element, options) {
    if (!utils.getData(element, 'DateTimePicker')) {
      // create a private copy of the defaults object
      options = utils.extend(true, {}, utils.datetimepicker.defaults, options);
      var instance = dateTimePicker(element, options)
      utils.setData(element, 'DateTimePicker', instance);
      return instance;
    }
  };

  utils.datetimepicker.defaults = {
    format: false,
    dayViewHeaderFormat: 'MMMM YYYY',
    extraFormats: false,
    stepping: 1,
    minDate: false,
    maxDate: false,
    useCurrent: true,
    collapse: true,
    locale: moment.locale(),
    defaultDate: false,
    disabledDates: false,
    enabledDates: false,
    nowicons: {
      time: 'now:clock',
      date: 'now:calendar',
      up: 'now:caret-up',
      down: 'now:caret-down',
      previous: 'now:caret-left',
      next: 'now:caret-right',
      today: 'now:plus',
      clear: 'now:delete',
      close: 'now:cancel'
    },
    useStrict: false,
    sideBySide: false,
    daysOfWeekDisabled: [],
    calendarWeeks: false,
    viewMode: 'days',
    toolbarPlacement: 'default',
    showTodayButton: false,
    showClear: false,
    showClose: false,
    widgetPositioning: {
      horizontal: 'auto',
      vertical: 'auto'
    },
    widgetParent: null,
    ignoreReadonly: false,
    keepOpen: false,
    inline: false,
    keepInvalid: false,
    datepickerInput: '.datepickerinput',
    keyBinds: {
      up: function (widget) {
        if (!widget) {
          return;
        }
        var d = this.date() || moment();
        if (utils.isVisible(widget.querySelector('.datepicker'))) {
          this.date(d.clone().subtract(7, 'd'));
        } else {
          this.date(d.clone().add(1, 'm'));
        }
      },
      down: function (widget) {
        if (!widget) {
          this.show();
          return;
        }
        var d = this.date() || moment();
        if (utils.isVisible(widget.querySelector('.datepicker'))) {
          this.date(d.clone().add(7, 'd'));
        } else {
          this.date(d.clone().subtract(1, 'm'));
        }
      },
      'control up': function (widget) {
        if (!widget) {
          return;
        }
        var d = this.date() || moment();
        if (utils.isVisible(widget.querySelector('.datepicker'))) {
          this.date(d.clone().subtract(1, 'y'));
        } else {
          this.date(d.clone().add(1, 'h'));
        }
      },
      'control down': function (widget) {
        if (!widget) {
          return;
        }
        var d = this.date() || moment();
        if (utils.isVisible(widget.querySelector('.datepicker'))) {
          this.date(d.clone().add(1, 'y'));
        } else {
          this.date(d.clone().subtract(1, 'h'));
        }
      },
      left: function (widget) {
        if (!widget) {
          return;
        }
        var d = this.date() || moment();
        if (utils.isVisible(widget.querySelector('.datepicker'))) {
          this.date(d.clone().subtract(1, 'd'));
        }
      },
      right: function (widget) {
        if (!widget) {
          return;
        }
        var d = this.date() || moment();
        if (utils.isVisible(widget.querySelector('.datepicker'))) {
          this.date(d.clone().add(1, 'd'));
        }
      },
      pageUp: function (widget) {
        if (!widget) {
          return;
        }
        var d = this.date() || moment();
        if (utils.isVisible(widget.querySelector('.datepicker'))) {
          this.date(d.clone().subtract(1, 'M'));
        }
      },
      pageDown: function (widget) {
        if (!widget) {
          return;
        }
        var d = this.date() || moment();
        if (utils.isVisible(widget.querySelector('.datepicker'))) {
          this.date(d.clone().add(1, 'M'));
        }
      },
      enter: function () {
        this.hide();
      },
      escape: function () {
        this.hide();
      },
      //tab: function (widget) { //this break the flow of the form. disabling for now
      //    var toggle = widget.find('.picker-switch a[data-action="togglePicker"]');
      //    if(toggle.length > 0) toggle.click();
      //},
      'control space': function (widget) {
        if (widget && utils.isVisible(widget.querySelector('.timepicker'))) {
          var togglePeriodElem = widget.querySelector('.btn[data-action="togglePeriod"]');
          if (togglePeriodElem) {
            var clickEvent = document.createEvent('Event');
            clickEvent.initEvent('click', true, true);
            togglePeriodElem.dispatchEvent(clickEvent);
          }
          //          widget.find('.btn[data-action="togglePeriod"]').click();
        }
      },
      t: function () {
        this.date(moment());
      },
      'delete': function () {
        this.clear();
      }
    },
    debug: false
  };
}));
