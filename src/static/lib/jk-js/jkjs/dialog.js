/**
 * Easy to use dialogs. This package requires bootstrap
 *
 * @author Joschi <josua.krause@gmail.com>
 */

jkjs = window.jkjs || {}; // init namespace

try {
  window.$.fn.popover || console.error("jkjs.dialog requires bootstrap.js");
} catch(e) {
  console.error("jkjs.dialog requires jQuery");
}

jkjs.dialog = function() {

  var inputShowing = [];

  var inputPostTitle = ' <span class="glyphicon glyphicon-question-sign" '
    + 'data-toggle="collapse" data-target="#inputdialog_content" />';
  var inputPreMsg = '<p id="inputdialog_content">';
  var inputPostMsg = '</p><div class="popover-prompt input-group" />';

  this.input = function(title, msg) {
    var that = this;
    var pop = null;

    this.close = function() {
      pop && pop.popover('destroy');
      pop = null;
      d3.select("body").on("keydown.inputdialog", null).on("click.inputdialog", null, true);
    };

    this.show = function(sel, init, check, finish) {
      if (inputShowing.length) {
        inputShowing.forEach(function(d) {
          d.close();
        });
        inputShowing = [];
        d3.selectAll(".popover").remove();
      }
      if (pop) {
        that.close();
      }
      pop = $(sel.node()).popover({
        container: "body",
        title: title + inputPostTitle,
        content: inputPreMsg + msg + inputPostMsg,
        html: true,
        placement: "bottom",
        trigger: "manual"
      });
      var cur = null;
      pop.popover('show');
      var noClose = true;
      d3.select("body").on("keydown.inputdialog", function() {
        if (d3.event.which === 27) {
          that.close();
        }
      }).on("click.inputdialog", function() {
        if (noClose) {
          noClose = false;
          return;
        }
        that.close();
      });
      var popover = d3.select(".popover").on("click", function() {
        noClose = true;
      });
      if (sel.node().getBoundingClientRect) {
        var bbox = sel.node().getBoundingClientRect();
        var own = popover.node().getBoundingClientRect();
        popover.style({
          // manually assign positions again to fix bug with collapse
          top: (window.scrollY + bbox.bottom) + "px",
          left: (window.scrollX + bbox.left + (bbox.width - own.width) * 0.5) + "px"
        });
      }
      var pp = popover.select(".popover-prompt");
      var isValid = function() {
        return cur !== null;
      };
      var validate = function() {
        var txt = input.node().value;
        cur = check(txt);
        input.style({
          "background-color": isValid() ? null : "red",
          "color": isValid() ? null : "white"
        });
        okay.attr({
          "disabled": isValid() ? null : "disabled"
        });
      };
      var done = function() {
        validate();
        if (isValid()) {
          finish(cur);
          that.close();
        }
      };
      var initStr = init.toString();
      var input = pp.append("input").classed({
        "form-control": true
      }).attr({
        "value": initStr
      }).on("input", validate).on("keypress", function() {
        if (d3.event.which === 13) {
          done();
        }
      });
      var inputNode = input.node();
      inputNode.setSelectionRange(0, initStr.length);
      inputNode.focus();
      inputNode.scrollIntoViewIfNeeded();
      var btns = pp.append("span").classed({
        "input-group-btn": true
      });
      var okay = btns.append("button").classed({
        "btn": true,
        "btn-primary": true
      }).attr({
        "type": "button"
      }).on("click", done);
      okay.text("Ok");
      var cl = btns.append("button").classed({
        "btn": true,
        "btn-default": true
      }).attr({
        "type": "button"
      }).on("click", that.close);
      cl.text("Close");
      popover.select("#inputdialog_content").classed("collapse", true);
      inputShowing.push(that);
    };

  }; // jkjs.dialog.input

}; // jkjs.dialog

jkjs.dialog = new jkjs.dialog(); // create instance
