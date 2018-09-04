/**
 * This package amends the zoomable user interface of d3 with extended functionality.
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

jkjs.zui = function() {
  var that = this;

  this.applyCanvasZoom = function(target, translate, scale, w, h, canvasRect, isSmooth) {
    target.attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
  };

  this.applyFixedHeightZoom = function(target, translate, scaleH, w, h, canvasRect, isSmooth) {
    var scaleV = canvasRect.height > 0 ? h / canvasRect.height : 1;
    if(isNaN(scaleH)) {
      scaleH = 1;
    }
    if(isNaN(scaleV)) {
      scaleV = 1;
    }
    if(isNaN(translate[0])) {
      translate[0] = 0;
    }
    target.attr('transform', 'translate(' + translate[0] + ' 0) scale(' + scaleH + ' ' + scaleV + ')');
  };

  this.computeVisibleRect = function(translate, scale, w, h) {
    return {
      x: -translate[0] / scale,
      y: -translate[1] / scale,
      width: w / scale,
      height: h / scale
    };
  };

  this.animationEase = "easeInOutCubic";

  this.animationDuration = 750;

  this.asTransition = function(sel, smooth) {
    if(!smooth) return sel;
    return sel.transition().duration(that.animationDuration).ease(that.animationEase);
  };
  this.afterTransition = function(cb, smooth) {
    if(!smooth) {
      cb();
      return;
    }
    setTimeout(function() {
      cb();
    }, that.animationDuration); // TODO not 100% precise
  };

  this.margin = 10;

  function fitInto(pixWidth, pixHeight, w, h, fit) {
    var rw = pixWidth / w;
    var rh = pixHeight / h;
    return fit ? Math.min(rw, rh) : Math.max(rw, rh);
  }

  function setOffset(x, y, off) {
    off[0] = x;
    off[1] = y;
  }

  function zoomTo(x, y, factor, zoom, off) {
    var f = factor;
    var newZoom = zoom * factor;
    newZoom <= 0 && console.warn("factor: " + factor + " zoom: " + newZoom);
    setOffset((off[0] - x) * f + x, (off[1] - y) * f + y, off);
    return newZoom;
  }

  this.create = function(sel, realSize, viewSize, getCanvasRect, applyZoom, extent) {
    var canvasMargin = that.margin;
    var w, h, rw, rh;
    var svg = sel.append("svg");
    var zoom = null;

    function setSize(realSize, viewSize) {
      w = viewSize.width;
      h = viewSize.height;
      rw = realSize.width;
      rh = realSize.height;
      svg.attr({
        "viewBox": "0 0 " + w + " " + h
      }).style({
        "width": rw,
        "height": rh,
        "padding": 0
      });
      // propagate changes
      if(zoom) {
        svg.on("mousemove.zoom")();
        setZoom(zoom.translate(), zoom.scale(), false);
      }
    }

    setSize(realSize, viewSize);
    // enabling zoom
    zoom = d3.behavior.zoom();
    var inner = svg.append("g");

    function showRectangle(rect, margin, fit, smooth) {
      var screenW = w - 2 * margin;
      var screenH = h - 2 * margin;
      var factor = fitInto(screenW, screenH, rect.width, rect.height, fit);
      var zoom = 1;
      var off = [ margin + (screenW - rect.width) * 0.5 - rect.x, margin + (screenH - rect.height) * 0.5 - rect.y ];
      zoom = zoomTo(screenW * 0.5 + margin, screenH * 0.5 + margin, factor, zoom, off);
      setZoom(off, zoom, smooth);
    }

    var prevTranslate = null;
    var prevScale = 0;

    function setZoom(translation, scale, smooth) {
      zoom.translate(translation);
      zoom.scale(scale);
      var target = that.asTransition(inner, smooth);
      applyZoom(target, translation, scale, w, h, getCanvasRect(), smooth);
      prevTranslate = translation;
      prevScale = scale;
    }

    var ext = extent || [ 1 / 6, 12 ];
    if(ext.length) {
      zoom.scaleExtent(ext);
    }
    var sidewaysScroll = false;
    var onSidewayScroll = false;
    var onNormalZoom = false;
    zoom.on("zoom", function() {
      var t = d3.event.translate;
      var s = d3.event.scale;
      var eve = d3.event.sourceEvent;
      var initSidewayScroll = sidewaysScroll && prevTranslate && eve instanceof WheelEvent && eve.wheelDeltaX;
      if(onSidewayScroll || (!onNormalZoom && initSidewayScroll)) {
        t[0] = prevTranslate[0] + eve.wheelDeltaX;
        t[1] = prevTranslate[1];
        s = prevScale !== 0 ? prevScale : s;
        onSidewayScroll = true;
        setZoom(t, s, false);
        return;
      }
      setZoom(t, s, false);
      onNormalZoom = true;
    });
    zoom.on("zoomend", function() {
      onSidewayScroll = false;
      onNormalZoom = false;
      // simulate an empty mouse move to remove the internal state of the "zoom" event
      svg.on("mousemove.zoom")();
    });
    svg.call(zoom);

    function showAll(smooth) {
      if (!getCanvasRect)
        return;
      showRectangle(getCanvasRect(), canvasMargin, true, smooth);
    }

    svg.on("dblclick.zoom", function() {
      showAll(true);
    });
    // the object
    return {
      sidewaysScroll: function(set) {
        if(!arguments.length) return sidewaysScroll;
        sidewaysScroll = !!set;
      },
      move: function(dx, dy, smooth) {
        var t = zoom.translate();
        t[0] += dx;
        t[1] += dy;
        setZoom(t, zoom.scale(), smooth);
      },
      getScale: function() {
        return zoom.scale();
      },
      zoomTo: function(x, y, factor, smooth) {
        var off = zoom.translate();
        var s = zoom.scale();
        s = zoomTo(x, y, factor, s, off);
        setZoom(off, s, smooth);
      },
      showRectangle: showRectangle,
      setZoom: setZoom,
      showAll: showAll,
      inner: inner,
      svg: svg,
      setSize: setSize,
      getVisibleRect: function() {
        return that.computeVisibleRect(zoom.translate(), zoom.scale(), w, h);
      }
    };
  }

}; // jkjs.zui

jkjs.zui = new jkjs.zui(); // create instance
