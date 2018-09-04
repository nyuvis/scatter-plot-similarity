/**
 * This package provides general utility functionality.
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

jkjs.util = function() {
  var that = this;

  this.WARN_DUP_CALL = false;

  var dupCallMap = {};
  var __flagObj = {};
  /**
   * Detects duplicate calls in quick succession and warns about them.
   * This functionality must be enabled with the WARN_DUP_CALL flag.
   */
  this.warnDupCalls = function(name) {
    if(!that.WARN_DUP_CALL) return;
    if(name in dupCallMap && dupCallMap[name]) {
      console.warn(name + " called more than once in quick succession");
      console.trace();
      if(dupCallMap[name] !== __flagObj) {
        console.warn("first call", dupCallMap[name]);
      }
      return;
    }
    if(Error) {
      dupCallMap[name] = new Error().stack || __flagObj;
    } else {
      dupCallMap[name] = __flagObj;
    }
    setTimeout(function() {
      // we never actually remove elements from the map
      // this would slow down performance -- we can assume that
      // the number of names is small and they are manually defined
      dupCallMap[name] = null;
    }, 0);
  };

  // suitable for SVGs
  this.BIG_NUMBER = 1e6;

  /**
   * Converts a list of classes into an object that can be used by the d3 classed function to activate all those classes.
   *
   * @param classes
   *          The classes as array. null is equivalent to an empty list.
   * @returns {Object} The object activating all classes when given to the d3 classed function.
   */
  this.convertClasses = function(classes) {
    if (!classes)
      return {};
    return classes.reduce(function(obj, c) {
      obj[c] = true;
      return obj;
    }, {});
  }

  /**
   * An implementation to set attributes only when they have changed.
   * This might increase performance for attributes which are expensive to update.
   * This does not work with attribute functions or qualified names.
   */
  this.attr = function(sel, attr) {
    // even without the value checks
    // it is still faster because of optimization
    // (at this point value checks slow everything down)
    Object.keys(attr).forEach(function(key) {
      var value = attr[key];
      if(value === null) {
        sel.each(function() {
          // if(!this.hasAttribute(key)) {
            this.removeAttribute(key);
          // }
        });
      } else {
        sel.each(function() {
          // if(this.getAttribute(key) !== value) {
            this.setAttribute(key, value);
          // }
        });
      }
    });
    return sel;
  };

  /**
   * Returns all GET arguments of the current URL location as key value pairs.
   *
   * @returns {Object} The arguments as keys and values.
   */
  this.getQueryStrings = function() {
    var assoc = {};
    var decode = function(s) {
      return decodeURIComponent(s.replace(/\+/g, " "));
    };
    var queryString = location.search.substring(1);
    var keyValues = queryString.split('&');
    keyValues.forEach(function(e) {
      var key = that.split(e, '=', 1);
      if (key.length > 1) {
        assoc[decode(key[0])] = decode(key[1]).replace(/\/+$/,'');
      } else if(e.length > 0) {
        assoc[decode(e)] = true;
      }
    });
    return assoc;
  }

  /**
   * Getter.
   *
   * @returns {String} The current URL.
   */
  this.getOwnURL = function() {
    return location.origin + location.pathname;
  }

  /**
   * Whether the given object has no keys.
   *
   * @param obj
   *          The object.
   * @returns {Boolean} Whether the given object has no keys.
   */
  this.isEmpty = function(obj) {
    return Object.keys(obj).length == 0;
  }

  /**
   * Maps elements of an array to an array of results.
   *
   * <pre>
   * [a] -&gt; (a -&gt; [b]) -&gt; [b]
   * </pre>
   *
   * @param arr
   *          The array to map.
   * @param fun
   *          The mapping function. It gets the current element as argument and is expected to return a list of results.
   * @returns The concatenated list of all result lists.
   */
  this.flatMap = function(arr, fun) {
    return [].concat.apply([], arr.map(fun));
  }

  /**
   * A python like split function.
   * Note: The behavior is different than JavaScript's split function.
   *
   * @param str
   *          The string to split.
   * @param sep
   *          The separator. Same default as in python.
   * @param n
   *          The maximum number of splits.
   */
  this.split = function(str, sep, n) {
    var s = arguments.length > 1 ? sep : /\s+/;
    if(arguments.length < 3) {
      return str.split(s);
    }
    var out = [];
    cur = str;
    if(s.exec) {
      for(;;) {
        if(out.length >= n) break;
        var match = s.exec(cur);
        if(!match) break;
        out.push(cur.slice(0, match['index']));
        cur = cur.slice(match['index'] + match[0].length);
      }
    } else {
      for(;;) {
        if(out.length >= n) break;
        var index = cur.indexOf(s);
        if(index < 0) break;
        out.push(cur.slice(0, index));
        cur = cur.slice(index + s.length);
      }
    }
    out.push(cur);
    return out;
  }

  /**
   * Moves all elements of the given selection to either the front or the back of the parent's children list resulting in
   * different visibility.
   *
   * @param sel
   *          The d3 selection to move.
   * @param toFront
   *          Whether to move to the front or to the back.
   */
  this.toFront = function(sel, toFront) {
    sel.each(function() {
      var obj = this;
      var parent = obj.parentElement;
      if (toFront) {
        parent.appendChild(obj);
      } else {
        parent.insertBefore(obj, parent.firstChild);
      }
    });
  }

  this.rectIntersect = function(rectA, rectB) {
    if(rectA.width <= 0 || rectA.height <= 0 || rectB.width <= 0 || rectB.height <= 0) {
      return false;
    }
    return rectB.x + rectB.width  > rectA.x &&
           rectB.y + rectB.height > rectA.y &&
           rectB.x < rectA.x + rectA.width  &&
           rectB.y < rectA.y + rectA.height;
  };

  this.getGrayValue = function(color) {
    return 0.2126 * color.r / 255 + 0.7152 * color.g / 255 + 0.0722 * color.b / 255;
  };

  this.getFontColor = function(color) {
    var grayValue = this.getGrayValue(d3.rgb(color));
    return grayValue > 0.5 ? d3.rgb("black") : d3.rgb("white");
  };

  this.ensureSorted = function(arr) {
    if(!arr.length) return;
    var prev = Number.NEGATIVE_INFINITY;
    for(var i = 0;i < arr.length;i += 1) {
      var v = arr[i];
      if(v < prev) {
        requireSorted(arr);
        return;
      }
      prev = v;
    }
  };

  function requireSorted(arr) {
    console.warn("slow sort test");
    var prev = Number.NEGATIVE_INFINITY;
    var run = false;
    var swapped = [];
    arr.forEach(function(v) {
      if(v < prev) {
        if(!run) {
          swapped.push(prev);
        }
        swapped.push(v);
        run = true;
      } else {
        run = false;
      }
      prev = v;
    });
    if(swapped.length) {
      console.warn("array not sorted", swapped, arr, new Error().stack);
      arr.sort(d3.ascending);
    }
  };

  this.join = function(ixs, add) {
    if(!ixs.length) {
      that.ensureSorted(add);
      return add;
    }
    if(!add.length) {
      that.ensureSorted(ixs);
      return ixs;
    }
    // TODO hacky way -- maybe optimize later
    var tmp = ixs.concat(add);
    tmp.sort(d3.ascending);
    return that.unique(tmp);
  };

  this.eqArr = function(arrA, arrB) {
    if(arrA.length !== arrB.length) return false;
    for(var ix = 0;ix < arrA.length;ix += 1) {
      if(arrA[ix] !== arrB[ix]) return false;
    }
    return true;
  };

  this.unique = function(ixs) {
    if(!ixs.length) return ixs;
    // sorted ixs
    that.ensureSorted(ixs);
    var res = [];
    res.length = ixs.length;
    var prev = ixs[0];
    res[0] = prev;
    var q = 1;
    for(var p = 1;p < ixs.length;p += 1) {
      var cur = ixs[p];
      if(cur !== prev) {
        res[q] = cur;
        q += 1;
        prev = cur;
      }
    }
    if(q < res.length) {
      res.length = q;
    }
    return res;
  };

  this.intersect = function(xs, ys) {
    if(!xs.length || !ys.length) return [];
    // sorted xs and ys
    that.ensureSorted(xs);
    that.ensureSorted(ys);
    var p = 0;
    var q = 0;
    var res = [];
    res.length = Math.min(xs.length, ys.length);
    var i = 0;
    while(p < xs.length && q < ys.length) {
      var a = xs[p];
      var b = ys[q];
      if(a < b) {
        p += 1;
      } else if(b < a) {
        q += 1;
      } else { // a === b
        res[i] = a;
        i += 1;
        p += 1;
        q += 1;
      }
    }
    if(i < res.length) {
      res.length = i;
    }
    return res;
  };

  this.getRemaining = function(ixs, minus) {
    if(!ixs.length || !minus.length) return ixs;
    // sorted ixs and minus
    that.ensureSorted(ixs);
    that.ensureSorted(minus);
    var p = 0;
    var q = 0;
    var res = [];
    res.length = ixs.length;
    var i = 0;
    while(p < ixs.length && q < minus.length) {
      var cur = ixs[p];
      var m = minus[q];
      if(cur < m) {
        res[i] = cur;
        i += 1;
        p += 1;
      } else if(cur > m) {
        q += 1;
      } else { // cur == m
        p += 1;
      }
    }
    var realLength = i + ixs.length - p;
    if(realLength !== res.length) {
      res.length = realLength;
    }
    for(;p < ixs.length;p += 1) {
      res[i] = ixs[p];
      i += 1;
    }
    return res;
  };

  this.getRemainingIter = function(ixs, minus, cb) {
    if(!ixs.length || !minus.length) {
      ixs.forEach(cb);
      return;
    }
    // sorted ixs and minus
    that.ensureSorted(ixs);
    that.ensureSorted(minus);
    var p = 0;
    var q = 0;
    while(p < ixs.length && q < minus.length) {
      var cur = ixs[p];
      var m = minus[q];
      if(cur < m) {
        cb(cur);
        p += 1;
      } else if(cur > m) {
        q += 1;
      } else { // cur == m
        p += 1;
      }
    }
    for(;p < ixs.length;p += 1) {
      cb(ixs[p]);
    }
  };

  this.applyPerm = function(arr, perm) {
    var tmp = arr.slice();
    if(tmp.length !== perm.length) console.warn(tmp.length + " != " + perm.length, new Error().stack);
    for(var i = 0;i < perm.length;i += 1) {
      arr[i] = tmp[perm[i]];
    }
  };

  this.randomNorm = function(maxRad, norm) {
    // maxRad should be >= 1e-3
    for(;;) {
      var rnd = ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3; // stddev: ~1, mean: ~0
      if(arguments.length < 1 || maxRad < 1e-3 || Math.abs(rnd) <= maxRad) {
        if(arguments.length >= 2 && norm) {
          return rnd / maxRad;
        }
        return rnd;
      }
    }
  };

  this.timing = function(name, cb, obj, args) {
    var from = new Date().getTime();
    var res = cb.apply(obj, args);
    var to = new Date().getTime();
    if(obj || args) {
      console.log("TIMING " + name, (to - from) + "ms", obj, args);
    } else {
      console.log("TIMING " + name, (to - from) + "ms");
    }
    return res;
  }

  this.sample = function(arr, count) {
    var reservoir = [];
    arr.forEach(function(v, ix) {
      if(reservoir.length < count) {
        reservoir.push(v);
        return;
      }
      var pos = Math.floor(Math.random() * (ix + 1));
      if(pos < reservoir.length) {
        reservoir[pos] = v;
      }
    });
    return reservoir;
  };

  this.shuffle = function(arr, from, to) {
    var f = arguments.length < 2 ? 0 : from;
    var t = arguments.length < 3 ? arr.length : to;
    var i = t;
    while(i > f) {
      var j = Math.floor(Math.random() * (i - f)) + f;
      i -= 1;
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  };

  this.Randomizer = function(estSize) {
    var arr = [];
    arr.length = estSize;
    var ix = 0;

    this.push = function(el) {
      arr[ix] = el;
      ix += 1;
    };
    this.each = function(cb) {
      that.shuffle(arr, 0, ix);
      for(var i = 0;i < ix;i += 1) {
        cb(arr[i]);
      }
    };
  } // Randomizer

}; // jkjs.util

jkjs.util = new jkjs.util(); // create instance

if(!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function(searchString, position) {
      position = position || 0;
      return this.lastIndexOf(searchString, position) === position;
    }
  });
}

Number.isNaN = Number.isNaN || function(value) {
  return typeof value === "number" && value !== value;
}

if(typeof Number.isFinite !== 'function') {
  Number.isFinite = function isFinite(value) {
    if(typeof value !== 'number') return false;
    return !(value !== value || value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY);
  };
}
