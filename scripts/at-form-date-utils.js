(function (utils) {
  'use strict';

  var
    class2type = {},
    typeNames = "Boolean Number String Function Array Date RegExp Object Error".split(" "),
    typeNameIndex,
    typeName,
    hasOwn = ({}).hasOwnProperty;

  for (typeNameIndex = 0; typeNameIndex < typeNames.length; typeNameIndex += 1) {
    typeName = typeNames[typeNameIndex];
    class2type["[object " + typeName + "]"] = typeName.toLowerCase();
  }

  // checks if obj is of type array
  utils.isArray = function (obj) {
    return Object.prototype.toString.apply(obj) === Object.prototype.toString.apply([]);
  };

  utils.isFunction = function (obj) {
    return Object.prototype.toString.apply(obj) === Object.prototype.toString.apply(function () {});
  };

  utils.isWindow = function (obj) {
    return obj != null && obj === obj.window;
  };

  utils.isTag = function (element, tagname) {
    return element.nodeName.toUpperCase() === tagname.toUpperCase();
  }

  utils.type = function (obj) {
    if (obj == null) {
      return obj + "";
    }
    // Support: Android<4.0, iOS<6 (functionish RegExp)
    return typeof obj === "object" || typeof obj === "function" ?
      class2type[Object.prototype.toString.call(obj)] || "object" :
      typeof obj;
  };

  utils.isPlainObject = function (obj) {
    // Not plain objects:
    // - Any object or value whose internal [[Class]] property is not "[object Object]"
    // - DOM nodes
    // - window
    if (utils.type(obj) !== "object" || obj.nodeType || utils.isWindow(obj)) {
      return false;
    }

    if (obj.constructor &&
      !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
      return false;
    }

    // If the function hasn't returned already, we're confident that
    // |obj| is a plain object, created by {} or constructed with new Object
    return true;
  };

  utils.extend = function () {
    var options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if (typeof target === "boolean") {
      deep = target;

      // Skip the boolean and the target
      target = arguments[i] || {};
      i++;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && !utils.isFunction(target)) {
      target = {};
    }

    // Extend jQuery itself if only one argument is passed
    if (i === length) {
      target = this;
      i--;
    }

    for (; i < length; i += 1) {
      // Only deal with non-null/undefined values
      if ((options = arguments[i]) != null) {
        // Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];

          // Prevent never-ending loop
          if (target === copy) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (utils.isPlainObject(copy) || (copyIsArray = utils.isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && utils.isArray(src) ? src : [];

            } else {
              clone = src && utils.isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[name] = utils.extend(deep, clone, copy);

            // Don't bring in undefined values
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  };

  function notNullAndUndefined(obj) {
    return obj !== undefined && obj !== null;
  }

  // this variable will imitate the hashtable for data api
  var dataApiStorage = {};
  var dataApiStorageUniqueIdCounter = 100;

  // returns an entry in the dataApiStorage for specified element and entryKey
  utils.getData = function (element, entryKey) {
    if (notNullAndUndefined(element)) {
      if (!element.utilsDataApiStorage) {
        element.utilsDataApiStorage = dataApiStorageUniqueIdCounter + '';
        dataApiStorageUniqueIdCounter += 1;
      }
      if (notNullAndUndefined(entryKey)) {
        return dataApiStorage[element.utilsDataApiStorage] ? dataApiStorage[element.utilsDataApiStorage][entryKey] : undefined;
      } else {
        return dataApiStorage[element.utilsDataApiStorage];
      }
    }
  };

  utils.setData = function (element, entryKey, entryData) {
    if (notNullAndUndefined(element)) {

      if (!element.utilsDataApiStorage) {
        element.utilsDataApiStorage = dataApiStorageUniqueIdCounter + '';
        dataApiStorageUniqueIdCounter += 1;
      }

      if (notNullAndUndefined(entryKey)) {
        if (!dataApiStorage[element.utilsDataApiStorage]) {
          dataApiStorage[element.utilsDataApiStorage] = {};
        }
        dataApiStorage[element.utilsDataApiStorage][entryKey] = entryData;
      }
    }
  };

  utils.removeData = function (element, entryKey) {
    if (notNullAndUndefined(element)) {
      if (element.utilsDataApiStorage) {
        delete dataApiStorage[element.utilsDataApiStorage];
      }
    }
  }

  // sets or gets the width of the element;
  // when returned value is as number
  // when set value needs to be a string with units assigned
  utils.width = function (element, value) {
    if (notNullAndUndefined(element)) {
      if (notNullAndUndefined(value)) {
        element.style.width = value;
      } else {
        return element.getBoundingClientRect().width;
      }
    }
  }

  // sets or gets the width of the element;
  // when returned value is as number
  // when set value needs to be a string with units assigned
  utils.height = function (element, value) {
    if (notNullAndUndefined(element)) {
      if (notNullAndUndefined(value)) {
        element.style.height = value;
      } else {
        return element.getBoundingClientRect().height;
      }
    }
  }

  // sets the classes to the element
  // element is an html element, classes is space separated list of classes
  utils.addClasses = function (element, classes) {
    var classesArray = classes.split(' '),
      i;
    for (i = 0; i < classesArray.length; i += 1) {
      element.classList.add(classesArray[i]);
    }
  }

  utils.extractNumericValue = function (cssStringValue) {
    var stringValue, indexOfUnit;
    if (cssStringValue.indexOf('px') != -1) {
      indexOfUnit = cssStringValue.indexOf('px');
      stringValue = cssStringValue.slice(0, indexOfUnit);
    }

    return parseFloat(stringValue);
  }

  // http://www.texelate.co.uk/blog/post/91-jquery-whats-the-difference-between-height-innerheight-and-outerheight/

  // element height returns the element height minus padding and border (margin is not part of height)
  // height = boundingClientRect.height - padding - border
  utils.elementHeight = function (element) {
    var computedStyle = window.getComputedStyle(element);
    var paddingTop = computedStyle.getPropertyValue('padding-top');
    var paddingBottom = computedStyle.getPropertyValue('padding-bottom');
    var borderTop = computedStyle.getPropertyValue('border-top');
    var borderBottom = computedStyle.getPropertyValue('border-bottom');

    // since values from computed style are strings with unit text (px, etc) ...
    // convert those to number of pixels
    var paddingTopNumeric = utils.extractNumericValue(paddingTop);
    var paddingBottomNumeric = utils.extractNumericValue(paddingBottom);
    var borderTopNumeric = utils.extractNumericValue(borderTop);
    var borderBottomNumeric = utils.extractNumericValue(borderBottom);

    var elementHeight = element.getBoundingClientRect().height;

    return elementHeight - paddingTopNumeric - paddingBottomNumeric - borderTopNumeric - borderBottomNumeric;
  }

  // element width returns the element width minus padding and border (margin is not part of width)
  // width = boundingClientRect.width - padding - border
  utils.elementWidth = function (element) {
    var computedStyle = window.getComputedStyle(element);
    var paddingLeft = computedStyle.getPropertyValue('padding-left');
    var paddingRight = computedStyle.getPropertyValue('padding-right');
    var borderLeft = computedStyle.getPropertyValue('border-left');
    var borderRight = computedStyle.getPropertyValue('border-right');

    // since values from computed style are strings with unit text (px, etc) ...
    // convert those to number of pixels
    var paddingLeftNumeric = utils.extractNumericValue(paddingLeft);
    var paddingRightNumeric = utils.extractNumericValue(paddingRight);
    var borderLeftNumeric = utils.extractNumericValue(borderLeft);
    var borderRightNumeric = utils.extractNumericValue(borderRight);

    var elementWidth = element.getBoundingClientRect().width;

    return elementWidth - paddingLeftNumeric - paddingRightNumeric - borderLeftNumeric - borderRightNumeric;
  }

  // element outer height returns the element height including padding and border (margin is not part of outer height)
  // outerHeight = boundingClientRect.height
  utils.elementOuterHeight = function (element) {
    return element.getBoundingClientRect().height;
  }

  // element outer widith returns the element width including padding and border (margin is not part of outer width)
  // outerWidth = boundingClientRect.width
  utils.elementOuterWidth = function (element) {
    return element.getBoundingClientRect().width;
  }

  utils.windowWidth = function (windowInst) {
    return windowInst.document.documentElement.clientWidth;
  }

  utils.windowHeight = function (windowInst) {
    return windowInst.document.documentElement.clientHeight;
  }

  utils.documentWidth = function (documentInst) {
    var name = "Width";
    doc = documentInst.documentElement;
    // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
    // whichever is greatest
    return Math.max(
      documentInst.body["scroll" + name], doc["scroll" + name],
      documentInst.body["offset" + name], doc["offset" + name],
      doc["client" + name]
    );
  }

  utils.documentHeight = function (documentInst) {
    var name = "Height";
    doc = documentInst.documentElement;
    // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
    // whichever is greatest
    return Math.max(
      documentInst.body["scroll" + name], doc["scroll" + name],
      documentInst.body["offset" + name], doc["offset" + name],
      doc["client" + name]
    );
  }

  utils.windowScrollTop = function (windowInst) {
    return windowInst.pageYOffset;
  }

  // this function is here to simulate jquery's special meaning of value false for .on() and .off() functions
  utils.returnFalse = function (event) {
    return false;
  }

  utils.closestByTagName = function (element, tagName) {
    var result = undefined;
    var iteratorElem = element;
    while (iteratorElem.nodeType !== 9 && result === undefined) {
      if (iteratorElem.tagName === tagName.toUpperCase()) {
        result = iteratorElem;
      }
      iteratorElem = iteratorElem.parentElement;
    }

    return result;
  }

  // this is here to simulate jQuery index function for a list of elements
  // .querySelectorAll does not return an array, but returned structure has a length property and can be indexed as an array
  // but returned structure doesn't have an indexOf function; so I wrote it
  utils.indexOf = function (elemArray, needle) {
    var result = -1,
      arrIndex;

    for (arrIndex = 0; arrIndex < elemArray.length; arrIndex += 1) {
      if (elemArray[arrIndex] === needle) {
        result = arrIndex;
        break;
      }
    }

    return result;
  }

  // toggleClass is a helper function that turns on/off the specified cssClass
  utils.toggleClass = function (element, cssClass) {
    var cssClassList = cssClass.split(' '),
      clIndex;

    for (clIndex = 0; clIndex < cssClassList.length; clIndex += 1) {
      if (cssClassList[clIndex] !== '') {
        if (element.classList.contains(cssClassList[clIndex])) {
          element.classList.remove(cssClassList[clIndex]);
        } else {
          element.classList.add(cssClassList[clIndex]);
        }
      }
    }
  }

  // a simulation of jquery's show function
  // elements is an array of htmlElements
  utils.show = function (elements) {
    var index, elem;
    for (index = 0; index < elements.length; index += 1) {
      var elem = elements[index];
      elem.style.display = 'block';
    }
  }

  // a simulation of jquery's hide function
  // elements is an array of htmlElements
  utils.hide = function (elements) {
    var index, elem;
    for (index = 0; index < elements.length; index += 1) {
      var elem = elements[index];
      elem.style.display = 'none';
    }
  }

  var rmsPrefix = /^-ms-/;
  var rdashAlpha = /-([\da-z])/gi;

  // Used by jQuery.camelCase as callback to replace()
  function fcamelCase(all, letter) {
    return letter.toUpperCase();
  };

  // Convert dashed to camelCase; used by the css and data modules
  // Support: IE9-11+
  // Microsoft forgot to hump their vendor prefix (#9572)
  utils.camelCase = function (string) {
    return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
  };

  utils.isVisible = function (element) {
    return element.offsetWidth > 0 && element.offsetHeight > 0;
  }

  utils.isChildOf = function (child, parent) {
    var isChild = false;
    var iterElem = child ? child.parentElement : null;

    while (!isChild && iterElem !==null && iterElem.nodeType !== 9) {
      isChild = iterElem === parent;
      iterElem = iterElem.parentElement;
    }

    return isChild;
  }

}(window.atFormDateUtils = window.atFormDateUtils || {}));