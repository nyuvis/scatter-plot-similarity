/**
 * Created by krause on 2014-06-07.
 */

function DnD() {
    var targetCount = 0;
    var dragObj = null;
    var dragSel = null;
    var dragListener = d3.behavior.drag().on("dragstart", function(d) {
        var node = this;
        dragObj = d;
        dragSel = d3.select(node);
        var src = getSource(dragObj);
        src.getGhost().show(dragSel, dragObj);
        src.dragstart(dragSel, dragObj);
        d3.event.sourceEvent.stopPropagation();
    }).on("drag", function() {
        var src = getSource(dragObj);
        src.getGhost().move(d3.event.dx, d3.event.dy, dragSel, dragObj);
        src.drag(dragSel, dragObj);
    }).on("dragend", function() {
        var d = dragObj;
        var t = curTarget;
        var s = dragSel;
        dragObj = null;
        curTarget = null;
        var src = getSource(d);
        var g = src.getGhost();
        g.hide(s, d);
        src.dragend(s, d);
        t && t.callDrop(g.gi, s, d);
    });

    function getSource(d) {
        return d.__drag_source;
    }

    function Source(ghostItem, dragstart, dragend, drag) {
        var gi = ghostItem;
        var targets = {};
        this.dragstart = function(dragSel, dragObj) {
            dragstart && dragstart(dragSel, dragObj);
        };
        this.drag = function(dragSel, dragObj) {
            drag && drag(dragSel, dragObj);
        };
        this.dragend = function(dragSel, dragObj) {
            dragend && dragend(dragSel, dragObj);
        };
        this.getGhost = function() {
            return gi;
        };
        this.register = function(template) {
            template.source && console.warn(template, "template cannot be associated with multiple sources");
            template.source = this;
        };
        this.addTarget = function(target) {
            targets[target.id()] = true;
        };
        this.isTarget = function(target) {
            return target.id() in targets;
        };
    }

    var curTarget = null;
    var curTargetObj = null;
    var curTargetSel = null;
    function Target(source, drop, hover, leave) {
        var id = targetCount++;
        this.id = function() {
            return id;
        };
        this.register = function(template) {
            var target = this;
            var mor = template.mouseover;
            var mot = template.mouseout;
            template.mouseover = function(node, d, i) {
                mor && mor(node, d, i);
                if(dragObj === null) return;
                var src = getSource(dragObj);
                if(!src.isTarget(target)) return;
                curTarget = target;
                curTargetSel = d3.select(node);
                curTargetObj = node;
                hover && hover(dragSel, dragObj, curTargetSel, d);
                if(curTargetObj.__drop_target === undefined) {
                    curTargetObj.__drop_target = {};
                }
                curTargetObj.__drop_target[id] = function(g, dragSel, dragObj) {
                    drop(g, dragSel, dragObj, curTargetSel, d);
                    leave && leave(dragSel, dragObj, curTargetSel, d);
                };
            };
            template.mouseout = function(node, d, i) {
                mot && mot(node, d, i);
                if(dragObj === null) return;
                var src = getSource(dragObj);
                if(!src.isTarget(target)) return;
                leave && leave(dragSel, dragObj, d3.select(node), d);
                if(node !== curTargetObj) return;
                curTarget = null;
                curTargetObj = null;
                curTargetSel = null;
            };
        };
        source.addTarget(this);
    }
    Target.prototype.callDrop = function(g, dragSel, dragObj) {
        curTargetObj.__drop_target[this.id()](g, dragSel, dragObj);
        curTargetObj = null;
        curTargetSel = null;
    };

    function GhostItem(selection, create, show, move, hide) {
        var gi = {};
        gi.elem = create(selection, gi);
        gi.elem.datum(gi);
        this.gi = gi;
        this.show = function(sel, obj) {
            show(gi, sel, obj);
        };
        this.move = function(dx, dy, sel, obj) {
            move(gi, dx, dy, sel, obj);
        };
        this.hide = function(sel, obj) {
            hide(gi, sel, obj);
        };
    }

    function Template() {
        this.source = null;
        this.mouseover = null;
        this.mouseout = null;
    }
    Template.prototype.apply = function(selection, mouseover, mouseout) {
        var template = this;
        if(template.source !== null) {
            selection.each(function(d) {
                d.__drag_source = template.source;
            });
            selection.call(dragListener);
        }
        var mor = template.mouseover !== null ? function(d, i) {
            var node = this;
            mouseover && mouseover.bind(node)(d, i);
            template.mouseover(node, d, i);
        } : mouseover ? mouseover : null;
        var mot = template.mouseout !== null ? function(d, i) {
            var node = this;
            mouseout && mouseout.bind(node)(d, i);
            template.mouseout(node, d, i);
        } : mouseout ? mouseout : null;
        selection.on("mouseover", mor, true).on("mouseout", mot, true);
    };

    this.GhostItem = GhostItem;
    this.Source = Source;
    this.Target = Target;
    this.Template = Template;
}
