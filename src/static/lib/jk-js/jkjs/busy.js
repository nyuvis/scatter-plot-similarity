/**
 * This package provides a layer that can be added to SVG elements showing the current state.
 * States can be normal (the layer is invisible), busy (the layer shows a busy image), and
 * failure (indicates an error). The states must be set manually.
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

jkjs.busy = function() {
  var outer = this;

  this.imgBusy = "jkjs/img/busy.gif";

  this.imgWarn = "jkjs/img/warning.png";

  this.busyClass = "busy";

  this.size = 32;

  this.state = {
    norm: 0,
    busy: 1,
    warn: 2
  };

  /**
   * Adds a layer to a selection.
   *
   * @param sel
   *          The selection.
   * @param rect
   *          The size of the layer. {x, y, width, height}
   * @returns The layer. The state can be set with <code>setState(jkjs.busy.state.{norm, busy, warn})</code> and
   *          the base selection can be retrieved with <code>layer.getSelection()</code>.
   */
  this.layer = function(sel, rect) {
    var that = this;
    var x = rect.x;
    var y = rect.y;
    var w = rect.width;
    var h = rect.height;
    var busyClass = outer.busyClass;
    var imgBusy = outer.imgBusy;
    var imgWarn = outer.imgWarn;
    var size = outer.size;
    var res = sel.append("g");
    var elem = res.append("rect").classed(busyClass, true).style({
      "fill": "white",
      "opacity": 0.5
    });
    var busy = res.append("image").classed(busyClass, true).attr({
      "xlink:href": imgBusy
    }).on("click", resetState);
    var warn = res.append("image").classed(busyClass, true).attr({
      "xlink:href": imgWarn
    }).on("click", resetState);
    var text = res.append("text").attr({
      "text-anchor": "middle"
    });

    function resetState() {
      that.setState(outer.state.norm);
    }

    var curState = outer.state.norm;
    this.setState = function(state, msg) {
      var txt = msg || "";
      var emptyRect = {
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0
      };
      curState = state;
      if (state === outer.state.norm) {
        elem.attr({
          "x": x,
          "y": y,
          "width": 0,
          "height": 0,
        });
        busy.attr(emptyRect);
        warn.attr(emptyRect);
        text.style({
          "opacity": 0
        }).text("");
        return;
      }
      elem.attr({
        "x": x,
        "y": y,
        "width": w,
        "height": h
      });
      var imgRect = {
        "x": x + (w - size) * 0.5,
        "y": y + (h - size) * 0.5,
        "width": size,
        "height": size
      };
      if (txt != "") {
        text.style({
          "opacity": 1
        }).attr({
          "x": x + (w - size) * 0.5,
          "y": y + (h - size) * 0.5 + size + 20
        }).text(txt);
      } else {
        text.style({
          "opacity": 0
        }).text("");
      }
      if (state === outer.state.busy) {
        busy.attr(imgRect);
        warn.attr(emptyRect);
      } else {
        state === outer.state.warn || console.warn("unknown state", state, outer.state);
        busy.attr(emptyRect);
        warn.attr(imgRect);
        curState = outer.state.warn;
      }
    };

    this.getState = function() {
      return curState;
    };

    this.setRect = function(rect) {
      x = rect.x;
      y = rect.y;
      w = rect.width;
      h = rect.height;
      this.setState(this.getState());
    };

    this.getSelection = function() {
      return res;
    };

    resetState();
  }; // jkjs.busy.layer

}; // jkjs.busy

jkjs.busy = new jkjs.busy(); // create instance
