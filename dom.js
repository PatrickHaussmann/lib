// Inspired and modified from https://github.com/KoryNunn/crel
(function (root, factory) {
  typeof define === "function" && define.amd
    ? define([], factory)
    : typeof module === "object" && module.exports
    ? (module.exports = factory())
    : (root.dom = factory());
})(typeof self !== "undefined" ? self : this, function () {
  // helper functions
  const isType = (object, type) => typeof object === type,
    isElement = (object) => object instanceof Element,
    isNode = (node) => node instanceof Node,
    // recursively appends children to given element
    appendChild = (element, child) => {
      if (child) {
        if (Array.isArray(child)) {
          // support (deeply) nested child elements
          child.map((subChild) => appendChild(element, subChild));
        } else if (isNode(child)) {
          element.appendChild(child);
        } else if (isType(child, "string")) {
          // if you want to create a text node start with # or . or it is user input use dom.textNode
          if (child.startsWith(".")) {
            // set class name on element if starts with .
            element.classList.add(...child.slice(1).split(" "));
          } else if (child.startsWith("#")) {
            // set id on element if starts with #
            element.id = child.slice(1);
          } else {
            element.appendChild(document.createTextNode(child));
          }
        } else if (isType(child, "object")) {
          // go through settings / attributes object
          for (let key in child) {
            // store the attribute into a variable, before we potentially modify the key
            let attribute = child[key];
            // get mapped key / function, if one exists
            key = dom.attrMap[key] || key;
            // prioritise mapping over properties
            if (isType(key, "function")) {
              key(element, attribute);
            } else if (isType(attribute, "function")) {
              element[key] = attribute;
            } else {
              // set the element attribute
              element.setAttribute(key, attribute);
            }
          }
        } else if (isType(child, "function")) {
          let return_el = child(element);
          // if the function returns an element, append it
          if (isNode(return_el)) {
            element.appendChild(return_el);
          }
        } else console.error("Unsupported type of child"); // ignore unsupported types
      }
    },
    // define dom as a proxy interface
    dom = new Proxy(
      (element, ...children) => {
        // if first argument is an element, use it as is, otherwise treat it as a tagname
        if (!isElement(element)) {
          if (!isType(element, "string") || element == "") {
            console.error("invalid input");
            return; // ignore invalid input
          }
          if (element.startsWith("#")) {
            element = document.getElementById(element.slice(1));
            if (!element) throw "No element with this id";
          } else {
            element = document.createElement(element);
          }
        }

        appendChild(element, children);
        return element;
      },
      {
        // binds specific tagnames to dom function calls with that tag as the first argument
        get: (target, key) => {
          if (key in target) {
            // dom internals like attrMap and cached functions
            return target[key];
          }
          // transform key and cached
          let transformedKey = target.tagTransform(key);

          if (transformedKey == "textNode") {
            target[key] = (text) => document.createTextNode(text);
          } else {
            target[key] = target.bind(null, transformedKey);
          }

          return target[key];
        },
      }
    );

  // used for mapping attribute keys to supported versions in bad browsers, or to custom functionality
  dom.attrMap = {
    on: (element, value) => {
      for (let eventName in value) {
        if (Object.hasOwnProperty.call(value, eventName)) {
          element.addEventListener(eventName, value[eventName]);
        }
      }
    },
    style: (element, value) => {
      for (let styleName in value) {
        if (Object.hasOwnProperty.call(value, styleName)) {
          element.style[styleName] = value[styleName];
        }
      }
    },
    cssVariable: (element, value) => {
      for (let varName in value) {
        if (Object.hasOwnProperty.call(value, varName)) {
          element.style.setProperty("--" + varName, value[varName]);
        }
      }
    },
  };

  // transforms tags on call, to for example allow dashes in tags
  dom.tagTransform = (key) => key;

  return dom;
});
