easyDnD
=======

Easy to use drag and drop functionality for [d3](https://github.com/mbostock/d3/).
You can specify source and target objects for
drag and drop. The functionality is built on top
of `d3.behavior.drag()`, uses `"dragstart"`, `"drag"`,
and `"dragend"` events on sources and `"mouseover"` and
`"mouseout"` events on targets.

```javascript
var dnd = new DnD();
```

Creates the drag & drop environment.

```javascript
var ghostItem = new dnd.GhostItem(selection, create, show, move, hide);
```

Creates a ghost item that is shown during the drag operation. The
first argument is the selection where the ghost item will be added. The
second argument is a function creating a selection containing the item
with the selection and the (empty) ghost item state as argument. The
created selection will have the ghost item state as datum. The next
three arguments are callbacks that are called during the drag & drop
operation. The arguments to these callbacks are an ghost object that
can be used to store information about the state of the ghost item
and has a field `elem` which contains the ghost item selection.
`move` has the x and y difference as next arguments. The last two arguments
of all three callbacks are the single source selection and the
associated source data item.

```javascript
var srcType = new dnd.Source(ghostItem, dragstart, dragend, drag);
```

Creates a source type. The first argument is a previously created ghost item.
The next arguments are callbacks for the drag & drop operation. The callbacks
are called with the single source selection and the associated source data item.

```javascript
var template = new dnd.Template();
```

Initializes a new template.

```javascript
srcType.register(template);
```

Registers a template as dragging source of the given type.
Every template can have only one source type and when the template
is applied to a selection all elements need an associated data item.

```javascript
var tgtType = new dnd.Target(source, drop, hover, leave);
```

Creates a target type. The first argument is the associated source type.
Every target type can only be associated with one source type. Elements, however,
can be associated with multiple target types. The `drop` callback is called when
the user drops the dragged element while hovering over the target element.
The arguments are the ghost item state object, the source single selection,
the associated source data, the target single selection, and optionally the
associated target data. Target elements need not necessarily be associated with
any data. The `hover` and `leave` callbacks are called when entering and leaving
the target element respectively. The arguments of the callbacks are
the source single selection, the associated source data, the target single
selection, and optionally the associated target data.

```javascript
tgtType.register(template);
```

Registers a template as dragging target of the given type.
Every template can be associated with multiple targets and when the template
is applied to a selection the elements don't need an associated data item.
A template should be registered by a given target type only once.

```javascript
template.apply(selection, mouseover, mouseout);
```

Applies `template` to the given selection. This call resets the
`"mouseover"` and `"mouseout"` events of all elements in the selection.
If no target type is associated with the template those listeners will
be cleared or set to the optional `mouseover` and `mouseout` arguments
if specified. The optional listener callbacks are added to the listener
chain if specified. `"mouseover"` and `"mouseout"` listeners that are
present before the call are overwritten.

See [`index.html`](index.html) for a small usage example. Note that the
dynamically created elements are individually associated with data instead of
maintaining a data list and updating the visible rectangles via `selectAll([...]).data([...])`.
This way no bookkeeping on a data list is required (we can remove elements with
`element.remove()` instead of looking for it in the data and removing it there).
