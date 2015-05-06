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

  utils.type = function (obj) {
    if (obj == null) {
      return obj + "";
    }
    // Support: Android<4.0, iOS<6 (functionish RegExp)
    return typeof obj === "object" || typeof obj === "function" ?
      class2type[toString.call(obj)] || "object" :
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

  // returns an entry in the __dataApiStorage for specified element and entryKey
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

  // sets or gets the width of the element;
  // when returned value is as number
  // when set value needs to be a string with units assigned
  utils.width = function(element, value){
    if (notNullAndUndefined(element)){
      if (notNullAndUndefined(value)){
        element.style.width = value;
      } else {
        return element.getBoundingClientRect().width;
      }
    }
  }
  
  // sets or gets the width of the element;
  // when returned value is as number
  // when set value needs to be a string with units assigned
  utils.height = function(element, value){
    if (notNullAndUndefined(element)){
      if (notNullAndUndefined(value)){
        element.style.height = value;
      } else {
        return element.getBoundingClientRect().height;
      }
    }
  }
  
}(window.atFormDateUtils = window.atFormDateUtils || {}));