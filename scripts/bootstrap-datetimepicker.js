/*! version : 4.7.14
 =========================================================
 bootstrap-datetimejs
 https://github.com/Eonasdan/bootstrap-datetimepicker
 Copyright (c) 2015 Jonathan Peterson
 =========================================================
 */
/*
 The MIT License (MIT)

 Copyright (c) 2015 Jonathan Peterson

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */
/*global define:false */
/*global exports:false */
/*global require:false */
/*global jQuery:false */
/*global moment:false */
(function (factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // AMD is used - Register as an anonymous module.
    define(['jquery', 'moment'], factory);
  } else if (typeof exports === 'object') {
    factory(require('jquery'), require('moment'));
  } else {
    if (typeof moment === 'undefined') {
      throw 'bootstrap-datetimepicker requires Moment.js to be loaded first';
    }
    factory(moment, window.atFormDateUtils);
  }
}(function (moment, utils) {
  'use strict';
  if (!moment) {
    throw new Error('bootstrap-datetimepicker requires Moment.js to be loaded first');
  }

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
        var
          headTemplate = document.createElement('thead');

        var trElem = document.createElement('tr');
        headTemplate.appendChild(trElem);

        var thElem = document.createElement('th');
        thElem.classList.add('prev');
        thElem.setAttribute('data-action', 'previous');

        trElem.appendChild(thElem);

        var spanElem = document.createElement('span');
        utils.addClasses(spanElem, options.icons.previous);
        thElem.appendChild(spanElem);

        thElem = document.createElement('th');
        thElem.classList.add('picker-switch');
        thElem.setAttribute('data-action', 'pickerSwitch');
        thElem.setAttribute('colspan', (options.calendarWeeks ? '6' : '5'));

        trElem.appendChild(thElem);

        thElem = document.createElement('th');
        thElem.classList.add('next');
        thElem.setAttribute('data-action', 'next');

        trElem.appendChild(thElem);

        spanElem = document.createElement('span');
        utils.addClasses(spanElem, options.icons.next);

        thElem.appendChild(spanElem);

        return headTemplate;
      },

      getContTemplate = function () {
        var contTemplate = document.createElement('tbody');
        var trElem, tdElem;
        trElem = document.createElement('tr');
        contTemplate.appendChild(trElem);

        tdElem = document.createElement('td');
        tdElem.setAttribute('colspan', options.calendarWeeks ? '8' : '7');

        trElem.appendChild(tdElem);

        return contTemplate;
      },

      getDatePickerTemplate = function () {

        var result1, result2, result3, tableElem, tableBodyElem;

        result1 = document.createElement('div');
        result1.classList.add('datepicker-days');
        tableElem = document.createElement('table');
        tableElem.classList.add('table-condensed');
        tableBodyElem = document.createElement('tbody');
        result1.appendChild(tableElem);
        tableElem.appendChild(getHeadTemplate());
        tableElem.appendChild(tableBodyElem);

        result2 = document.createElement('div');
        result2.classList.add('datepicker-months');
        tableElem = document.createElement('table');
        tableElem.classList.add('table-condensed');
        result2.appendChild(tableElem);
        tableElem.appendChild(getHeadTemplate());
        tableElem.appendChild(getContTemplate());

        result3 = document.createElement('div');
        result3.classList.add('datepicker-years');
        tableElem = document.createElement('table');
        tableElem.classList.add('table-condensed');
        result3.appendChild(tableElem);
        tableElem.appendChild(getHeadTemplate());
        tableElem.appendChild(getContTemplate());

        return [result1, result2, result3];
      },

      getTimePickerMainTemplate = function () {
        var topRow = document.createElement('tr'),
          middleRow = document.createElement('tr'),
          bottomRow = document.createElement('tr');

        var tdElem, aElem, spanElem;

        if (isEnabled('h')) {
          tdElem = document.createElement('td');
          topRow.appendChild(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);

          aElem.setAttribute('href', '#');
          aElem.setAttribute('tabindex', '-1');
          aElem.classList.add('btn');
          aElem.setAttribute('data-action', 'incrementHours');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.up);

          tdElem = document.createElement('td');
          middleRow.appendChild(tdElem);

          spanElem = document.createElement('span');
          tdElem.appendChild(spanElem);
          spanElem.classList.add('timepicker-hour')
          spanElem.setAttribute('data-time-component', 'hours');
          spanElem.setAttribute('data-action', 'showHours');

          tdElem = document.createElement('td');
          bottomRow.appendChild(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          aElem.setAttribute('href', '#');
          aElem.setAttribute('tabindex', '-1');
          aElem.classList.add('btn');
          aElem.setAttribute('data-action', 'decrementHours');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.down);
        }

        if (isEnabled('m')) {
          if (isEnabled('h')) {
            tdElem = document.createElement('td');
            topRow.appendChild(tdElem);
            tdElem.classList.add('separator');
            tdElem = document.createElement('td');
            middleRow.appendChild(tdElem);
            tdElem.classList.add('separator');
            tdElem.innerHTML = ':';
            tdElem = document.createElement('td');
            bottomRow.appendChild(tdElem);
            tdElem.classList.add('separator');
          }

          // ----- for top row ----- //
          tdElem = document.createElement('td');
          topRow.appendChild(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          aElem.setAttribute('href', '#');
          aElem.setAttribute('tabindex', '-1');
          aElem.classList.add('btn');
          aElem.setAttribute('data-action', 'incrementMinutes');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.up);

          // ----- for middle row ----- //
          tdElem = document.createElement('td');
          middleRow.appendChild(tdElem);

          spanElem = document.createElement('span');
          tdElem.appendChild(spanElem);
          spanElem.classList.add('timepicker-minute');
          spanElem.setAttribute('data-time-component', 'minutes');
          spanElem.setAttribute('data-action', 'showMinutes');

          // ----- for bottom row ----- //          
          tdElem = document.createElement('td');
          bottomRow.appendChild(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          aElem.setAttribute('href', '#');
          aElem.setAttribute('tabindex', '-1');
          aElem.classList.add('btn');
          aElem.setAttribute('data-action', 'decrementMinutes');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.down);
        }

        if (isEnabled('s')) {
          if (isEnabled('m')) {
            tdElem = document.createElement('td');
            topRow.appendChild(tdElem);
            tdElem.classList.add('separator');
            tdElem = document.createElement('td');
            middleRow.appendChild(tdElem);
            tdElem.classList.add('separator');
            tdElem.innerHTML = ':';
            tdElem = document.createElement('td');
            bottomRow.appendChild(tdElem);
            tdElem.classList.add('separator');
          }

          // ----- for top row ----- //
          tdElem = document.createElement('td');
          topRow.appendChild(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          aElem.setAttribute('href', '#');
          aElem.setAttribute('tabindex', '-1');
          aElem.classList.add('btn');
          aElem.setAttribute('data-action', 'incrementSeconds');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.up);

          // ----- for middle row ----- //
          tdElem = document.createElement('td');
          middleRow.appendChild(tdElem);

          spanElem = document.createElement('span');
          tdElem.appendChild(spanElem);
          spanElem.classList.add('timepicker-minute');
          spanElem.setAttribute('data-time-component', 'seconds');
          spanElem.setAttribute('data-action', 'showSeconds');

          // ----- for bottom row ----- //          
          tdElem = document.createElement('td');
          bottomRow.appendChild(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          aElem.setAttribute('href', '#');
          aElem.setAttribute('tabindex', '-1');
          aElem.classList.add('btn');
          aElem.setAttribute('data-action', 'decrementSeconds');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.down);
        }

        if (!use24Hours) {
          tdElem = document.createElement('td');
          topRow.appendChild(tdElem);
          tdElem.classList.add('separator');

          tdElem = document.createElement('td');
          middleRow.appendChild(tdElem);

          var buttonElem = document.createElement('button');
          tdElem.appendChild(buttonElem);
          utils.addClasses(buttonElem, 'btn btn-primary');
          buttonElem.setAttribute('data-action', 'togglePeriod');

          tdElem = document.createElement('td');
          bottomRow.appendChild(tdElem);
          tdElem.classList.add('separator');
        }

        var divElem = document.createElement('div');
        divElem.classList.add('timepicker-picker');
        var tableElem = document.createElement('table');
        divElem.appendChild(tableElem);
        tableElem.classList.add('table-condensed');
        tableElem.appendChild(topRow);
        tableElem.appendChild(middleRow);
        tableElem.appendChild(bottomRow);

        return divElem;
      },

      getTimePickerTemplate = function () {
        var hoursView, minutesView, secondsView, tableElem, ret;

        hoursView = document.createElement('div');
        hoursView.classList.add('timepicker-hours');
        tableElem = document.createElement('table');
        hoursView.appendChild(tableElem);
        tableElem.classList.add('table-condensed');

        minutesView = document.createElement('div');
        minutesView.classList.add('timepicker-minutes');
        tableElem = document.createElement('table');
        minutesView.appendChild(tableElem);
        tableElem.classList.add('table-condensed');

        secondsView = document.createElement('div');
        secondsView.classList.add('timepicker-seconds');
        tableElem = document.createElement('table');
        secondsView.appendChild(tableElem);
        tableElem.classList.add('table-condensed');

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
          tdElem.appendChild(aElem);
          aElem.setAttribute('data-action', 'today');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.today);
        }
        if (!options.sideBySide && hasDate() && hasTime()) {
          tdElem = document.createElement('td');
          row.push(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          aElem.setAttribute('data-action', 'togglePicker');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.time);
        }
        if (options.showClear) {
          tdElem = document.createElement('td');
          row.push(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          aElem.setAttribute('data-action', 'clear');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.clear);
        }
        if (options.showClose) {
          tdElem = document.createElement('td');
          row.push(tdElem);

          aElem = document.createElement('a');
          tdElem.appendChild(aElem);
          aElem.setAttribute('data-action', 'close');

          spanElem = document.createElement('span');
          aElem.appendChild(spanElem);
          utils.addClasses(spanElem, options.icons.close);
        }

        var tableElem = document.createElement('table'),
          tbodyElem = document.createElement('tbody'),
          trElem = document.createElement('tr');
        tableElem.classList.add('table-condensed');
        tableElem.appendChild(tbodyElem);
        tbodyElem.appendChild(trElem);

        for (var i = 0; i < row.length; i += 1) {
          trElem.appendChild(row[i]);
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

        template.classList.add('bootstrap-datetimepicker-widget');
        template.classList.add('dropdown-menu');

        dateView.classList.add('datepicker');
        var datePickerTemplate = getDatePickerTemplate();
        for (i = 0; i < datePickerTemplate.length; i++) {
          dateView.appendChild(datePickerTemplate[i]);
        }

        timeView.classList.add('timepicker');
        var timePickerTemplate = getTimePickerTemplate();
        for (i = 0; i < timePickerTemplate.length; i++) {
          timeView.appendChild(timePickerTemplate[i]);
        }

        content.classList.add('list-unstyled');

        var toolbarClass = (options.collapse ? 'accordion-toggle' : '');
        var toolbarTemplate = getToolbar();
        toolbar.classList.add('picker-switch');
        toolbar.classList.add(toolbarClass);
        toolbar.appendChild(toolbarTemplate);

        if (options.inline) {
          template.classList.remove('dropdown-menu');
        }

        if (use24Hours) {
          template.classList.add('usetwentyfour');
        }
        if (options.sideBySide && hasDate() && hasTime()) {
          template.classList.add('timepicker-sbs');
          var rowDiv = document.createElement('div');
          rowDiv.classList.add('row');

          dateView.classList.add('col-sm-6');
          rowDiv.appendChild(dateView);

          timeView.classList.add('col-sm-6');
          rowDiv.appendChild(timeView);

          template.appendChild(rowDiv);

          template.appendChild(toolbar);

          return template;
        }

        var liElem, liClass;

        if (options.toolbarPlacement === 'top') {
          content.appendChild(toolbar);
        }
        if (hasDate()) {
          liElem = document.createElement('li');
          liClass = (options.collapse && hasTime() ? 'collapse in' : '');
          atFormDateUtils.addClasses(liElem, liClass);
          liElem.appendChild(dateView);
          content.appendChild(liElem);
        }
        if (options.toolbarPlacement === 'default') {
          content.appendChild(toolbar);
        }
        if (hasTime()) {
          liElem = document.createElement('li');
          liClass = (options.collapse && hasDate() ? 'collapse' : '');
          liElem.classList.add(liClass);
          liElem.appendChild(timeView);
          content.appendChild(liElem);
        }
        if (options.toolbarPlacement === 'bottom') {
          content.appendChild(toolbar);
        }

        template.appendChild(content);

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
          parent.appendChild(widget);
        } else if (utils.isTag(htmlElement, 'input')) {
          parent = htmlElement.parentElement;
          parent.appendChild(widget);
        } else if (options.inline) {
          parent = htmlElement.parentElement;
          parent.appendChild(widget);
          return;
        } else {
          var referenceElem = htmlElement.children[1];
          htmlElement.insertBefore(widget, referenceElem);
          var firstChild = htmlElement.children[0];
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
        if (horizontal === 'auto') {
          if (utils.elementWidth(parent) < offset.left + utils.elementOuterWidth(widget) / 2 &&
            offset.left + utils.elementOuterWidth(widget) > utils.windowWidth(window)) {
            horizontal = 'right';
          } else {
            horizontal = 'left';
          }
        }

        if (vertical === 'top') {
          widget.classList.add('top');
          widget.classList.remove('bottom');
        } else {
          widget.classList.add('bottom');
          widget.classList.remove('top');
        }

        if (horizontal === 'right') {
          widget.classList.add('pull-right');
        } else {
          widget.classList.remove('pull-left');
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
          widget.style.right = (utils.elementWidth(parent) - utils.elementOuterWidth(htmlElement)) + 'px';
        }
      },

      notifyEvent = function (e) {
        if (e.type === 'dp.change' && ((e.date && e.date.isSame(e.oldDate)) || (!e.date && !e.oldDate))) {
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

        var findResults = widget.querySelectorAll('.datepicker > div');
        for (var findResultsIndex = 0; findResultsIndex < findResults.length; findResultsIndex += 1) {
          findResults[findResultsIndex].style.display = "none";
        }

        var filterSelector = '.datepicker-' + datePickerModes[currentViewMode].clsName;
        var filterResult = widget.querySelector(filterSelector);
        filterResult.style.display = "block";
      },

      fillDow = function () {
        var row = document.createElement('tr');
        var currentDate = viewDate.clone().startOf('w');

        if (options.calendarWeeks === true) {
          var th = document.createElement('th');
          th.classList.add('cw');
          th.textContent = '#';
          row.appendChild(th);
        }

        while (currentDate.isBefore(viewDate.clone().endOf('w'))) {
          var th1 = document.createElement('th');
          th1.classList.add('dow');
          th1.textContent = currentDate.format('dd');
          currentDate.add(1, 'd');
        }

        var thead = widget.querySelector('.datepicker-days thead');
        thead.appendChild(row);
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
          span.setAttribute('data-action', 'selectMonth');
          span.classList.add('month');
          span.textContent = monthsShort.format('MMM');
          spans.push(span);
          monthsShort.add(1, 'M');
        }

        var widgetFind = widget.querySelector('.datepicker-months td');
        widgetFind.innerHTML = '';
        for (var spansIndex = 0; spansIndex < spans.length; spansIndex += 1) {
          widgetFind.appendChild(spans[spansIndex]);
        }
      },

      updateMonths = function () {
        var monthsView = widget.querySelector('.datepicker-months');
        var monthsViewHeader = monthsView.querySelectorAll('th');
        var months = monthsView.querySelector('tbody').querySelectorAll('span');

        var monthsViewDisabledItems = monthsView.querySelectorAll('.disabled');
        for (var monthsViewDisabledItemsIndex = 0; monthsViewDisabledItemsIndex < monthsViewDisabledItems.length; monthsViewDisabledItemsIndex += 1) {
          var monthsViewDisabledItem = monthsViewDisabledItems[monthsViewDisabledItemsIndex];
          monthsViewDisabledItem.classList.remove('disabled');
        }

        if (!isValid(viewDate.clone().subtract(1, 'y'), 'y')) {
          monthsViewHeader[0].classList.add('disabled');
        }

        monthsViewHeader[1].textContent = viewDate.year();

        if (!isValid(viewDate.clone().add(1, 'y'), 'y')) {
          monthsViewHeader[2].classList.add('disabled');
        }

        for (var monthsIndex = 0; monthsIndex < months.length; monthsIndex += 1) {
          var month = months[monthsIndex];
          month.classList.remove('active');
        }

        if (date.isSame(viewDate, 'y')) {
          months[date.month()].classList.add('active');
        }

        for (var monthsIndex = 0; monthsIndex < months.length; monthsIndex += 1) {
          if (!isValid(viewDate.clone().month(monthsIndex), 'M')) {
            months[monthsIndex].classList.add('disabled');
          }
        }
      },

      updateYears = function () {
        var yearsView = widget.querySelector('.datepicker-years');
        var yearsViewHeader = yearsView.querySelectorAll('th');
        var startYear = viewDate.clone().subtract(5, 'y');
        var endYear = viewDate.clone().add(6, 'y');
        var html = '';

        var yearsViewDisabledItems = yearsView.querySelectorAll('.disabled');
        for (var yearsViewDisabledItemsIndex = 0; yearsViewDisabledItemsIndex < yearsViewDisabledItems.length; yearsViewDisabledItems += 1) {
          var yearsViewDisabledItem = yearsViewDisabledItems[yearsViewDisabledItemsIndex];
          yearsViewDisabledItem.classList.remove('disabled');
        }

        if (options.minDate && options.minDate.isAfter(startYear, 'y')) {
          yearsViewHeader[0].classList.add('disabled');
        }

        yearsViewHeader[1].textContent = startYear.year() + '-' + endYear.year();

        if (options.maxDate && options.maxDate.isBefore(endYear, 'y')) {
          yearsViewHeader[2].classList.add('disabled');
        }

        while (!startYear.isAfter(endYear, 'y')) {
          html += '<span data-action="selectYear" class="year' + (startYear.isSame(date, 'y') ? ' active' : '') + (!isValid(startYear, 'y') ? ' disabled' : '') + '">' + startYear.year() + '</span>';
          startYear.add(1, 'y');
        }

        yearsView.querySelector('td').innerHTML = html;
      },

      fillDate = function () {
        var daysView = widget.querySelector('.datepicker-days');
        var daysViewHeader = daysView.querySelectorAll('th');
        var currentDate,
          html = [],
          row,
          clsName;

        if (!hasDate()) {
          return;
        }

        var daysViewDisabledItems = daysView.querySelectorAll('.disabled');
        for (var daysViewDisabledItemsIndex = 0; daysViewDisabledItemsIndex < daysViewDisabledItems.length; daysViewDisabledItems += 1) {
          var daysViewDisabledItem = daysViewDisabledItems[daysViewDisabledItemsIndex];
          daysViewDisabledItem.classList.remove('disabled');
        }

        daysViewHeader[1].textContent = viewDate.format(options.dayViewHeaderFormat);

        if (!isValid(viewDate.clone().subtract(1, 'M'), 'M')) {
          daysViewHeader[0].classList.add('disabled');
        }
        if (!isValid(viewDate.clone().add(1, 'M'), 'M')) {
          daysViewHeader[2].classList.add('disabled');
        }

        currentDate = viewDate.clone().startOf('M').startOf('week');

        while (!viewDate.clone().endOf('M').endOf('w').isBefore(currentDate, 'd')) {
          if (currentDate.weekday() === 0) {
            row = document.createElement('tr');
            if (options.calendarWeeks) {
              var td = document.createElement('td');
              td.classList.add('cw');
              td.textContent = currentDate.week();
              row.appendChild(td);
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
          tdDay.setAttribute('data-action', 'selectDay');
          tdDay.classList.add('day');
          clsName = clsName.trim();
          if (clsName != '') {
            utils.addClasses(tdDay, clsName);
          }
          tdDay.textContent = currentDate.date();
          row.appendChild(tdDay);
          currentDate.add(1, 'd');
        }

        var daysViewTBody = daysView.querySelector('tbody');
        daysViewTBody.innerHTML = '';
        for (var htmlIndex = 0; htmlIndex < html.length; htmlIndex += 1) {
          daysViewTBody.appendChild(html[htmlIndex]);
        }

        updateMonths();

        updateYears();
        reattachEventListeners(widget.querySelector('.datepicker'));
      },

      fillHours = function () {
        var
          table = widget.querySelector('.timepicker-hours table'),
          currentHour = viewDate.clone().startOf('d'),
          html = [],
          row = document.createElement('tr');

        if (viewDate.hour() > 11 && !use24Hours) {
          currentHour.hour(12);
        }
        while (currentHour.isSame(viewDate, 'd') && (use24Hours || (viewDate.hour() < 12 && currentHour.hour() < 12) || viewDate.hour() > 11)) {
          if (currentHour.hour() % 4 === 0) {
            row = document.createElement('tr');
            html.push(row);
          }
          var tdSelectHour = document.createElement('td');
          tdSelectHour.setAttribute('data-action', 'selectHour');
          tdSelectHour.classList.add('hour');
          if (!isValid(currentHour, 'h')) {
            tdSelectHour.classList.add('disabled');
          }
          tdSelectHour.textContent = currentHour.format(use24Hours ? 'HH' : 'hh');

          row.appendChild(tdSelectHour);

          currentHour.add(1, 'h');
        }

        table.innerHTML = '';
        for (var htmlIndex = 0; htmlIndex < html.length; htmlIndex += 1) {
          table.appendChild(html[htmlIndex]);
        }
      },

      fillMinutes = function () {
        var
          table = widget.querySelector('.timepicker-minutes table'),
          currentMinute = viewDate.clone().startOf('h'),
          html = [],
          row = document.createElement('tr'),
          step = options.stepping === 1 ? 5 : options.stepping;

        while (viewDate.isSame(currentMinute, 'h')) {
          if (currentMinute.minute() % (step * 4) === 0) {
            row = document.createElement('tr');
            html.push(row);
          }

          var td = document.createElement('td');
          td.setAttribute('data-action', 'selectMinute');
          td.classList.add('minute');
          if (!isValid(currentMinute, 'm')) {
            td.classList.add('disabled');
          }
          td.textContent = currentMinute.format('mm');
          row.appendChild(td);
          currentMinute.add(step, 'm');
        }
        table.innerHTML = '';
        for (var htmlIndex = 0; htmlIndex < html.length; htmlIndex += 1) {
          table.appendChild(html[htmlIndex]);
        }
      },

      fillSeconds = function () {
        var
          table = widget.querySelector('.timepicker-seconds table'),
          currentSecond = viewDate.clone().startOf('m'),
          html = [],
          row = document.createElement('tr');

        if (table === null) {
          return;
        }

        while (viewDate.isSame(currentSecond, 'm')) {
          if (currentSecond.second() % 20 === 0) {
            row = document.createElement('tr');
            html.push(row);
          }
          var td = document.createElement('td');
          td.setAttribute('data-action', 'selectSecond');
          td.classList.add('second');
          if (!isValid(currentSecond, 's')) {
            td.classList.add('disabled');
          }
          td.textContent = currentSecond.format('ss');
          row.appendChild(td);
          currentSecond.add(5, 's');
        }

        table.innerHTML = '';
        for (var htmlIndex = 0; htmlIndex < html.length; htmlIndex += 1) {
          table.appendChild(html[htmlIndex]);
        }
      },

      fillTime = function () {
        var tcIndex;
        var timeComponents = widget.querySelectorAll('.timepicker span[data-time-component]');

        if (!use24Hours) {
          var togglePeriodElem = widget.querySelector('.timepicker [data-action=togglePeriod]');
          togglePeriodElem.textContent = date.format('A');
        }

        for (tcIndex = 0; tcIndex < timeComponents.length; tcIndex += 1) {
          var timeComponent = timeComponents[tcIndex];
          var dtcAttrValue = timeComponent.getAttribute('data-time-component');

          if (dtcAttrValue === 'hours') {
            timeComponent.textContent = date.format(use24Hours ? 'HH' : 'hh');
          } else if (dtcAttrValue === 'minutes') {
            timeComponent.textContent = date.format('mm');
          } else if (dtcAttrValue === 'seconds') {
            timeComponent.textContent = date.format('ss');
          }
        }

        fillHours();
        fillMinutes();
        fillSeconds();
        reattachEventListeners(widget.querySelector('.timepicker'));
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
          var wcElems = container.querySelectorAll('[data-action]'),
            wcElemIndex, wcElem;
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
          //          element.data('date', ''); // <- this data is never read, as far as I can see
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
          //          element.data('date', date.format(actualFormat)); // <- this data is never read, as far as I can see
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
        var elemWithCollapseClass = widget.querySelector('.collapse');
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
        if (component && component.classList.contains('btn')) {
          if (component.classList.contains('active')) {
            component.classList.remove('active');
          } else {
            component.classList.add('active');
          }
        }
        widget.style.display = "none";
        //        widget.hide();

        window.removeEventListener('resize', place);
        //        $(window).off('resize', place);
        //        widget.off('click', '[data-action]');
        var nojqWidgetChildren = widget.querySelectorAll('[data-action]');
        for (var nojqwcIndex = 0; nojqwcIndex < nojqWidgetChildren.length; nojqwcIndex += 1) {
          var nojqwChild = nojqWidgetChildren[nojqwcIndex];
          nojqwChild.removeEventListener('click', doAction);
        }
        widget.removeEventListener('mousedown', utils.returnFalse);
        //        widget.off('mousedown', false);

        widget.parentElement.removeChild(widget);
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

            if (utils.isTag(e.target, 'span')) {
              utils.toggleClass(e.target, options.icons.time);
              utils.toggleClass(e.target, options.icons.date);
            } else {
              var spans = e.target.querySelectorAll('span');
              for (var spansIndex = 0; spansIndex < spans.length; spansIndex += 1) {
                var spanElem = spans[spansIndex];
                utils.toggleClass(spanElem, options.icons.time);
                utils.toggleClass(spanElem, options.icons.date);
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
        var val = e.target.value.trim(),
          parsedDate = val ? parseInputDate(val) : null;
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
              } else {
                // user has clicked somewhere on the widget; fosuc the input field
                // this  focusing ensures that this blur handler can be called again
                input.focus();
              }
            } else {
              // user has clicked somewhere on the widget; fosuc the input field
              // this  focusing ensures that this blur handler can be called again
              input.focus();
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

    picker.icons = function (icons) {
      if (arguments.length === 0) {
        return utils.extend({}, options.icons);
      }

      if (!(icons instanceof Object)) {
        throw new TypeError('icons() expects parameter to be an Object');
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
    icons: {
      time: 'glyphicon glyphicon-time',
      date: 'glyphicon glyphicon-calendar',
      up: 'glyphicon glyphicon-chevron-up',
      down: 'glyphicon glyphicon-chevron-down',
      previous: 'glyphicon glyphicon-chevron-left',
      next: 'glyphicon glyphicon-chevron-right',
      today: 'glyphicon glyphicon-screenshot',
      clear: 'glyphicon glyphicon-trash',
      close: 'glyphicon glyphicon-remove'
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