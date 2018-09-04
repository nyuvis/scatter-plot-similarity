/**
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

jkjs.LOAD_VERBOSE = true;
jkjs.load = function(the_file) {

  function FileLoader(file) {
    var that = this;
    var loader = getLoaderFor(file);

    function getLoaderFor(file) {
      if(file.startsWith("data:text/csv;")) {
        return new CSVLoader(file);
      }
      var dot = file.lastIndexOf(".");
      if(dot < 0) return null;
      var suffix = file.substring(dot + 1);
      // TODO better way to specify loader
      if(suffix === "json") {
        return new JSONLoader(file.substring(0, dot));
      }
      if(suffix === "csv" || suffix === "txt") {
        return new CSVLoader(file);
      }
      return null;
    }

    this.featureConstructor = function(_) {
      loader.featureConstructor(_);
      return that;
    };
    this.get = function(cb, err) {
      if(!loader) {
        console.warn("no file loader found:", file);
        return;
      }
      loader.get(cb, err);
    };
  } // FileLoader

  function JSONLoader(file) {
    var that = this;
    var loader = new Loader(0.95);
    this.featureConstructor = function(_) {
      loader.setFeatureConstructor(_);
      return that;
    };

    function loadJSON(file, onsuccess, onerror) {
      d3.json(file, function(error, json) {
        if (error) {
          console.warn("Failed to load file: '" + file + "'");
          console.warn(error);
          onerror && onerror();
          return;
        }
        var error = true;
        try {
          onsuccess(json);
          error = false;
        } finally {
          if(error) {
            onerror && onerror();
          }
        }
      });
    }

    function loadTypes(cb, err) {
      var inputFile = file + "_category_type.json"; // TODO weird postfix
      loadJSON(inputFile, function(types) {
        loadRowsWithTypes(cb, types);
      }, function() {
        jkjs.LOAD_VERBOSE && console.log("no category file -- automatic type detection");
        loadRows(cb, err);
      });
    }

    function loadRowsWithTypes(cb, types) {
      var features = [];
      var ixs = [];
      var inputFile = file + "CF3k.json"; // TODO weird postfix
      loadJSON(inputFile, function(rows) {
        // TODO specify type format
        var fMap = {};
        var size = rows.length;
        Object.keys(types).forEach(function(key) {
          var name = key;
          var catType = types[key];
          var isNominal = catType === "discrete";
          var f = loader.getFeatureConstructor()(name, size, isNominal);
          fMap[key] = f;
          features.push(f);
        });
        rows.forEach(function(r, ix) {
          Object.keys(r).forEach(function(k) {
            var f = fMap[k];
            f || console.warn("unknown type: " + k);
            f.setValue(ix, r[k]);
          });
          ixs.push(ix);
        });
        ixs.sort(d3.ascending);
        features.forEach(function(f) {
          f.finishInit();
        });
        cb(features, ixs);
      });
    }

    function loadRows(cb, err) {
      var inputFile = file + "CF3k.json"; // TODO weird postfix
      loader.loadRows(loadJSON, inputFile, cb, err);
    }

    this.get = function(cb, err) {
      loadTypes(cb, err);
    };
  } // JSONLoader

  function CSVLoader(file) {
    var that = this;
    var loader = new Loader(0.95);
    this.featureConstructor = function(_) {
      loader.setFeatureConstructor(_);
      return that;
    };

    function loadCSV(file, onsuccess, onerror) {
      d3.csv(file).get(function(error, rows) {
        if (error) {
          console.warn("Failed to load file: '" + file + "'");
          console.warn(error);
          onerror && onerror();
          return;
        }
        var error = true;
        try {
          onsuccess(rows);
          error = false;
        } finally {
          if(error) {
            onerror && onerror();
          }
        }
      });
    }

    this.get = function(cb, err) {
      loader.loadRows(loadCSV, file, cb, err);
    };
  } // CSVLoader

  function Loader(numeric_threshold) {
    var that = this;
    var featureConstructor = function(name, size, isNominal) {
      // TODO standard constructor requires Feature in namespace
      return new Feature(name, size, isNominal);
    };
    this.getFeatureConstructor = function() {
      return featureConstructor;
    };
    this.setFeatureConstructor = function(_) {
      featureConstructor = _;
      return that;
    };

    this.detectType = function(col, name) {
      if(name.trim().startsWith("num_")) {
        jkjs.LOAD_VERBOSE && console.log("num", name, "because of name");
        return false;
      }
      if(name.trim().startsWith("cat_")) {
        jkjs.LOAD_VERBOSE && console.log("cat", name, "because of name");
        return true;
      }
      var lastNumeric = "";
      var lastNominal = "";
      var numNom = 0;
      col.forEach(function(v) {
        var str = ("" + v).trim();
        var asNum = +v;
        var isNumeric = str.length === 0 || str === "?" || !isNaN(asNum);
        if(isNumeric) {
          lastNumeric = str;
        } else {
          lastNominal = str;
          numNom += 1;
        }
      });
      var isNom = (col.length - numNom) / col.length < numeric_threshold;
      jkjs.LOAD_VERBOSE && console.log(isNom ? "cat" : "num", name, lastNumeric, lastNominal);
      return isNom;
    };

    this.loadFeature = function(col, name, size) {
      var isNominal = that.detectType(col, name);
      var f = that.getFeatureConstructor()(name, size, isNominal);
      col.forEach(function(v, ix) {
        f.setValue(ix, v);
      });
      f.finishInit();
      return f;
    };

    this.loadRows = function(req, file, cb, err) {
      req(file, function(rows) {
        var features = [];
        var ixs = [];
        var size = rows.length;
        var columns = {};
        rows.forEach(function(r, ix) {
          Object.keys(r).forEach(function(k) {
            if(!(k in columns)) {
              columns[k] = [];
            }
            if(columns[k].length !== ix) {
              console.warn("row index does not match entry index", columns[k].length, ix);
            }
            columns[k].push(r[k]);
          });
          ixs.push(ix);
        });
        Object.keys(columns).forEach(function(k) {
          features.push(that.loadFeature(columns[k], k, size));
        });
        ixs.sort(d3.ascending);
        cb(features, ixs);
      }, err);
    };
  } // Loader

  return new FileLoader(the_file);
}; // jkjs.load
