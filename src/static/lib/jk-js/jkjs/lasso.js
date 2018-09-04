/**
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

jkjs.Lasso = function(sel) {
  var that = this;

  var objProvider = null;
  this.objProvider = function(_) {
    if(!arguments.length) return objProvider;
    objProvider = _;
  };

  var objInPolygon = pointInPolygon;
  this.objInPolygon = function(_) {
    if(!arguments.length) return objInPolygon;
    objInPolygon = _;
  };

  var objToPos = function(obj) {
    return obj.pos;
  };
  this.objToPos = function(_) {
    if(!arguments.length) return objToPos;
    objToPos = _;
  };

  var updateSel = null;
  this.updateSel = function(_) {
    if(!arguments.length) return updateSel;
    updateSel = _;
  };

  var onClick = null;
  this.onClick = function(_) {
    if(!arguments.length) return onClick;
    onClick = _;
  };

  function mousePos() {
    var pos = d3.mouse(sel.node());
    return [pos[0], pos[1]];
  }

  function dragUpdate() {
    if(!objProvider) return;
    var objs = objProvider();
    var curSel = [];
    objs.forEach(function(obj) {
      var objPos = objToPos(obj);
      if(objInPolygon(objPos, selArr)) {
        curSel.push(obj);
      }
    });
    return curSel;
  }

  var selArr = [];
  var drag = d3.behavior.drag().on("dragstart.lasso", function() {
    selArr = [];
    selArr.push(mousePos());
  }).on("drag.lasso", function() {
    selArr.push(mousePos());
    updateSel(dragUpdate(), selArr);
  }).on("dragend.lasso", function() {
    var pos = mousePos();
    selArr.push(pos);
    var isLasso = true;
    if(selArr.length == 2) {
      isLasso = selArr[0][0] != selArr[1][0] || selArr[0][1] != selArr[1][1];
    }
    if(isLasso) {
      updateSel(dragUpdate(), []);
    } else {
      onClick && onClick(pos);
    }
  });
  sel.call(drag);

  function pointInPolygon(pos, arr) {
    var px = pos[0];
    var py = pos[1];

    function crossings(posA, posB) {
      var x0 = posA[0];
      var y0 = posA[1];
      var x1 = posB[0];
      var y1 = posB[1];
      if(py <  y0 && py <  y1) return 0;
      if(py >= y0 && py >= y1) return 0;
      // (y0 != y1) || console.warn("y0 == y1", posA, posB);
      if(px >= x0 && px >= x1) return 0;
      if(px <  x0 && px <  x1) return (y0 < y1) ? 1 : -1;
      var xintercept = x0 + (py - y0) * (x1 - x0) / (y1 - y0);
      if (px >= xintercept) return 0;
      return (y0 < y1) ? 1 : -1;
    }

    var posA = arr[arr.length - 1];
    var numCrossings = 0;
    for(var ix = 0;ix < arr.length;ix += 1) {
      var posB = arr[ix];
      numCrossings += crossings(posA, posB);
      posA = posB;
    }
    return numCrossings & 1 != 0;
  }

  function rectInPolygon(pos, arr) {
    var x = pos[0];
    var y = pos[1];
    var w = pos[2];
    var h = pos[3];
    var rect = [
      [ x, y ],
      [ x + w, y ],
      [ x + w, y + h ],
      [ x, y + h ]
    ];
    // not 100% precise
    if(rect.some(function(p) {
      return pointInPolygon(p, arr);
    })) {
      return true;
    }
    if(arr.some(function(p) {
      return pointInPolygon(p, rect);
    })) {
      return true;
    }
    return false;
  }

  this.pointInPolygon = pointInPolygon;
  this.rectInPolygon = rectInPolygon;
}; // jkjs.Lasso
