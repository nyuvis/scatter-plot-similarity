/**
 * This package provides useful graphical effects that can be used by SVG elements.
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

jkjs.effects = function() {
  /**
   * Creates an svg definition for the given id if needed.
   *
   * @param svg
   *          The svg selection.
   * @param id
   *          The id of the definition.
   * @param name
   *          The name of the element.
   * @returns The d3 selection for the definition.
   */
  function createDef(svg, id, name) {
    var res = svg.select("#" + id);
    if (!res.empty())
      return res;
    var defs = svg.select("defs");
    if (defs.empty()) {
      defs = svg.append("defs");
    }
    return defs.append(name).attr({
      "id": id
    });
  }

  /**
   * Returns the id of a blur filter.
   *
   * @param svg
   *          The svg selection.
   * @param stddev
   *          The blurriness factor (ie the standard deviation of the filter).
   * @returns {Ref} A reference that can be used in SVG attributes.
   */
  this.getBlurFilter = function(svg, stddev) {
    var id = ("blur" + stddev).replace(/\./g, "_");
    var mul = stddev;
    var perc = stddev * 8;
    var filter = createDef(svg, id, "filter").attr({
        x: -perc + '%',
        y: -perc + '%',
        width:  (100 + 2 * perc) + '%',
        height: (100 + 2 * perc) + '%'
    });
    var mat = (-mul)+' 0 0 0 1 '
            + '0 '+(-mul)+' 0 0 1 '
            + '0 0 '+(-mul)+' 0 1 '
            + '0 0 0 '+mul+' 0';
    var inner = '<feGaussianBlur in="SourceGraphic" result="blurOut" stdDeviation="' + stddev + '" />'
              + '<feColorMatrix in="blurOut" result="invOut" type="matrix" values="' + mat + '" />'
              + '<feBlend in="SourceGraphic" in2="invOut" mode="normal" />';
    filter.node().innerHTML = inner;
    return new Ref(id);
  };

  /**
   * Returns the id of a stripe pattern with the given color.
   *
   * @param svg
   *          The svg selection.
   * @param color
   *          The color of the pattern.
   * @param size
   *          The size of the pattern. Defaults to 30.
   * @returns {Ref} A reference that can be used in SVG attributes.
   */
  this.getStripePattern = function(svg, color, size) {
    var c = color.toString();
    // enable for smaller color space
    //c = c.length === 7 && c.charAt(0) === '#' ? c.substring(0, 2) + c.charAt(3) + c.charAt(5) : c;
    var id = ("stripes" + c + '_' + size).replace(/[#\.]/, '_');
    var pattern = createDef(svg, id, "pattern");
    var s = size || 30;
    pattern.attr({
      "x": 0,
      "y": 0,
      "width": s,
      "height": s,
      "patternUnits": "userSpaceOnUse"
    });
    var p = new jkjs.Path();
    p.move(0, 0);
    p.line(s * 0.5, 0);
    p.line(0, s * 0.5);
    p.close();
    p.move(s, 0);
    p.line(s, s * 0.5);
    p.line(s * 0.5, s);
    p.line(0, s);
    p.close();
    pattern.node().innerHTML = '<path style="fill: ' + c + '; stroke: none" d="' + p + '" />';
    return new Ref(id);
  };

  /**
   * A reference to a defined effect.
   *
   * @param id
   *          The id identifying the effect.
   */
  function Ref(id) {
    this.ref = 'url(#' + id + ')';
    this.id = id;
  };
  Ref.prototype.toString = function() {
    return this.ref;
  };

}; // jkjs.effects

jkjs.effects = new jkjs.effects(); // create instance
