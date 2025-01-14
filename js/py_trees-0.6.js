/*!
 * A library for rendering, with jointjs, a behaviour tree on a
 * html canvas.
 */
// *************************************************************************
// Joint Shapes (Models/Views)
//   Originally had these in py_trees.shapes, however that replaces
//   (doesn't combine with) joint.shapes, resulting in a few inconsistent
//   behaviours when I do call on joint.shapes components (ostensibly
//   because their views don't get found).
// *************************************************************************

var joint = joint
joint.shapes = joint.shapes || {}
joint.shapes.trees = joint.shapes.trees || {}

joint.shapes.trees.Node = joint.dia.Element.define(
    'trees.Node', {
        size: { width: 170, height: 50 },
        collapse_children: false,
        selected: false,
        hidden: false,
        attrs: {
            box: {
                refX: '0%', refY: '0%',
                refWidth: '100%', refHeight: '100%',
                // stroke: none
                fill: '#333333', stroke: '#000000', 'stroke-width': 2,
                'pointer-events': 'visiblePainted', rx: 8, ry: 8,
            },
            type: {
                refX: '0%', refY: '0%',
                refWidth: '15%', refHeight: '100%',
                fill: '#00FF00', stroke: '#000000', 'stroke-width': 2,
                'pointer-events': 'visiblePainted', rx: 8, ry: 8,
            },
            collapse: {
                refX: "50%", refY: '100%',
                refWidth: '6%', refHeight: '6%',
                fill: '#704214', stroke: '#000000', 'stroke-width': 2,
                'pointer-events': 'visiblePainted', r: 5,
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'box'
        }, {
            tagName: 'rect',
            selector: 'type'
        }, {
            tagName: 'circle',
            selector: 'collapse'
        }]
    }
);

joint.shapes.trees.NodeView = joint.dia.ElementView.extend({
      // events: {
    //   'dblclick': 'onDblClick',
    // },
    template: [
        '<div class="html-element">',
        '<span class="html-name"/>',
        '<span class="html-detail"/>',
        '<div class="html-tooltip"/>',
        '</div>',
    ].join(''),

    initialize: function() {
        _.bindAll(this, 'updateBox');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.$box = $(_.template(this.template)());
        // don't do an updateBox here, causes problems
        //   https://github.com/splintered-reality/py_trees_js/issues/141
        // This is an example of reacting on the input change and storing the input data in the cell model.
        this.model.on('change', this.updateBox, this);
        // Remove the box when the model gets removed from the graph.
        this.model.on('remove', this.removeBox, this);
    },

    render: function() {
        joint.dia.ElementView.prototype.render.apply(this, arguments);
        this.paper.$el.prepend(this.$box);
        this.updateBox();
        return this;
    },

    updateBox: function() {
        // console.log("_element_view_update_box", this.model.get('name'))
        if (!this.paper) return;

        // Set the position and dimension of the box so that it covers the JointJS element.
        var bbox = this.model.getBBox();
        // Example of updating the HTML with a data stored in the cell model.
        try {
            this.$box.find('span.html-name')[0].innerHTML = this.model.get('name')
        } catch (err) {
            console.log("Thrown an error in updateBoxOnChange", this.model.get('name'))
            console.log("BBox", bbox)
            console.log("this.$box", this.$box)
            console.log("this.$box.find('span.html-name')", this.$box.find('span.html-name'))
        }
        this.$box.find('span.html-name')[0].innerHTML = this.model.get('name')
        this.$box.find('span.html-detail')[0].innerHTML = this.model.get('details')
        this.$box.find('div.html-tooltip')[0].innerHTML =
            "<div class='id'>#" +
            this.model.get('behaviour_id') +
            "</div>" +
            "<hr/>" +
            "<span><b>Name: </b>" +
            this.model.get('name') +
            "</span><br/>" +
            "<span><b>Status: </b>" +
            this.model.get('status') +
            "</span><br/>" +
            "<span><b>Visited: </b>" +
            this.model.get('visited') +
            "</span><br/>"
        data = this.model.get('data')
        for (var key in data) {
            // Not a reliable way of checking for types, but since
            // the user has control over the input (fundamentals or arrays or dicts)
            // this will do. JS has *no* reliable way. See also:
            //   http://tobyho.com/2011/01/28/checking-types-in-javascript/
            if (data[key].constructor == Object) {
            } else if (Array.isArray(data[key])) {
                this.$box.find('div.html-tooltip')[0].innerHTML +=
                    "<span><b>" +
                     key +
                     ":</b></span><br/>"
                for (var index in data[key]) {
                    this.$box.find('div.html-tooltip')[0].innerHTML +=
                        "<span>&nbsp;&nbsp;" +
                         data[key][index] +
                         "</span><br/>"
                }
            } else {
                this.$box.find('div.html-tooltip')[0].innerHTML +=
                   "<span><b>" +
                    key +
                    ": </b>" +
                    data[key] +
                    "</span><br/>"
            }
        }
        scale = this.paper.scale()       // sx, sy
        offset = this.paper.translate()  // tx, ty
        // Positioning
        var tooltip_max_width = 250  // pixels
        this.$box.find('div.html-tooltip').css({
            left: 0.85*bbox.width*scale.sx,  // see below, parent is 0.8*bbox.wdith
            'max-width': tooltip_max_width
        })
        this.$box.find('span.html-detail').css({
            'width': 0.80*bbox.width*scale.sx,
            'margin-top': 0.10*bbox.height*scale.sy,
            'margin-bottom': 0.15*bbox.height*scale.sy,
            'font-size': 10*scale.sy,
            'color': this.model.get('visited') ? '#F1F1F1' : '#AAAAAA',
        })
        this.$box.find('span.html-name').css({
            'width': 0.80*bbox.width*scale.sx,
            'margin-top': 0.10*bbox.height*scale.sy,
            'margin-bottom': 0.15*bbox.height*scale.sy,
            'font-size': 14*scale.sy,
            'color': this.model.get('visited') ? '#F1F1F1' : '#AAAAAA',
        })
        this.$box.css({
            // math says this should be 0.85/1.0, but not everything lining up correctly
            //   html-element top left corner is fine, but bottom-right corner is
            //   overhanging by some small delta in x and y directions
            width: 0.80*bbox.width*scale.sx + tooltip_max_width,  // 250 is the max-width of the tooltip
            height: 0.95*bbox.height*scale.sy,
            left: offset.tx + bbox.x*scale.sx + 0.15*bbox.width*scale.sx,
            top: offset.ty + bbox.y*scale.sy,
            transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
        });
        sepia = "#704214"
        this.model.attr({
            collapse: {
                fill: sepia,
                visibility: this.model.get('collapse_children') ? "visible" : "hidden"
            }
        })
        if ( this.model.get('selected') ) {
            this.model.attr({
                box: {
                    fill: {
                        type: 'linearGradient',
                        stops: [
                            { offset: '0%',  color: sepia },
                            { offset: '100%', color: "#d9822b" }
                        ],
                        attrs: {
                            x1: '0%',
                            y1: '0%',
                            x2: '0%',
                            y2: '100%'
                        },
                    },
                }
            })
        } else {
            this.model.attr({
                box: {
                    fill: '#333333'
                }
            })
        }
        // Hiding
        if ( this.model.get('hidden') ) {
            this.model.attr('./visibility', 'hidden')
            this.$box.css({
                'visibility': 'hidden',
            })
        } else {
            this.model.attr('./visibility', 'visible')
            this.$box.css({
                'visibility': 'visible',
            })
        }
        // console.log("_element_view_update_box_on_change_done")
      },

      removeBox: function(evt) {
          this.$box.remove();
      }
  });


/**
 * Used to model the cached trees in the timeline bar as think
 * vertical slivers.
 */
joint.shapes.trees.EventMarker = joint.shapes.standard.Rectangle.define(
    'trees.EventMarker', {
        position: { x: 0, y: 0 },
        size: { width: 4, height: 30 },
        default_width: 4,
        significant: true,  // denotes a significant tree status/graph change or otherwise
        attrs: {
            body: {
                refWidth: '100%',
                refHeight: '100%',
                stroke: 'black',
                strokeWidth: 0,
                fill: '#FFFFFF',
                'pointer-events': 'auto',
            }
        }
    },
    {
      // inherit markup from joint.shapes.standard.Rectangle
    }
);

// *************************************************************************
// py_trees
// *************************************************************************

var py_trees = (function() {

    var _version = '0.6.6'

    /**
     * Introduce the user to the library and print relevant info about it's discovered
     * dependencies.
     */
    var _hello = function() {
        console.log("********************************************************************************")
        console.log("                                    Py Trees JS                                 ")
        console.log("")
        console.log("A javascript library for visualisation of executing behaviour trees.")
        console.log("")
        console.log("Version & Dependency Info:")
        console.log(" - py_trees: ", py_trees.version)
        console.log("   - jointjs : ", joint.version)
        console.log("      - backbone: ", Backbone.VERSION)
        console.log("      - dagre   : ", dagre.version)
        console.log("      - jquery  : ", jQuery.fn.jquery)
        console.log("      - lodash  : ", _.VERSION)
        console.log("********************************************************************************")
    }


  // *************************************************************************
  // py_trees.experimental
  // *************************************************************************
  /*
   * Create a serialised tree in javascript form. Useful for testing
   * a web app without wiring it up to an external source.
   */
  var _experimental_create_demo_tree_definition = function() {
    var tree = {
        timestamp: 1563938995,
        visited_path: ['1', '2', '3', '4', '5', '7', '8'],
        behaviours: {
            '1': {
                id: '1',
                status: 'RUNNING',
                name: 'Selector',
                colour: '#00FFFF',
                children: ['2', '3', '4', '6'],
                data: {
                    Type: 'py_trees.composites.Selector',
                    Feedback: "Decision maker",
                },
            },
            '2': {
                id: '2',
                status: 'FAILURE',
                name: 'Sequence',
                colour: '#FFA500',
                children: ['7', '8', '9'],
                data: {
                    Type: 'py_trees.composites.Sequence',
                    Feedback: "Worker"
                },
            },
            '3': {
                id: '3',
                status: 'FAILURE',
                name: 'Parallel',
                details: 'SuccessOnOne',
                colour: '#FFFF00',
                data: {
                    Type: 'py_trees.composites.Parallel',
                    Feedback: 'Baked beans is good for your heart, baked beans makes you',
                },
            },
            '4': {
                id: '4',
                status: 'RUNNING',
                name: '&#x302; &#x302; Decorator',
                colour: '#DDDDDD',
                children: ['5'],
                data: {
                    Type: 'py_trees.composites.Decorator',
                    Feedback: 'Wearing the hats',
                },
            },
            '5': {
                id: '5',
                status: 'RUNNING',
                name: 'Decorated Beyond The Beliefs of an Agnostic Rhino',
                colour: '#555555',
                data: {
                    Type: 'py_trees.composites.Behaviour',
                    Feedback: "...."
                },
            },
            '6': {
                id: '6',
                status: 'INVALID',
                name: 'Behaviour',
                colour: '#555555',
                data: {
                    Type: 'py_trees.composites.Behaviour',
                    Feedback: "..."
                },
            },
            '7': {
                id: '7',
                status: 'SUCCESS',
                name: 'Worker A',
                colour: '#555555',
                data: {
                    Type: 'py_trees.composites.Behaviour',
                    Feedback: "..."
                },
            },
            '8': {
                id: '8',
                status: 'FAILURE',
                name: 'Worker B',
                colour: '#555555',
                data: {
                    Type: 'py_trees.composites.Behaviour',
                    Feedback: "..."
                },
            },
            '9': {
                id: '9',
                status: 'INVALID',
                name: 'Worker C',
                colour: '#555555',
                data: {
                    Type: 'py_trees.composites.Behaviour',
                    Feedback: "..."
                },
            },
        }
    }
    return tree
  }

  // *************************************************************************
  //  py_trees.canvas
  // *************************************************************************
  // Variables
  //
  //   graph
  //     blackboard_minimum_height (float) - initial 'fit content' height of the view
  //     bounding_box ({x, y, width, height}) - dimensions of the dot style graph layout
  //     last_double_click_ms (float) - used to help distinguish between single-double clicks
  //     last_single_click_ms (float) - used to help distinguish between single-double clicks
  //     scale_content_to_fit (bool, default: true) - always scale content to fit
  //     splash (bool) - showing the splash cheat sheet or a rendered tree
  //
  /**
   * Collapse children of the selected model. This merely
   * hides them from view, but doesn't remove them from the graph.
   */
  var _canvas_collapse_children = function(graph, model) {
      var successors = graph.getSuccessors(model)
      if ( !successors.length ) {
          return
      }
      model.set('collapse_children', !model.get('collapse_children'))
      collapse_children = model.get('collapse_children')
      _.each(successors, function(behaviour) {
          behaviour.set('hidden', collapse_children)
          var links = graph.getConnectedLinks(behaviour, { inbound: true })
          _.each(links, function(link) {
              // prefer to set a variable in the model and do this in a view,
              // but this will do till we have a custom link and link view
              link.attr('line/visibility', collapse_children ? 'hidden' : 'visible')
          })
      })
  }

  /**
   * Create elided details from a details (text) snippet.
   */
  var _canvas_create_elided_details = function(details) {
    elided_details = joint.util.breakText(
            details || '...',
            { width: 150, height:30 },
            {},
            { ellipsis: true }
        )
    return elided_details
  }

  /*
   * Construct a node given the specified properties.
   */
  var _canvas_create_node = function({behaviour_id, colour, name, details, status, visited, data}) {
      // console.log("_canvas_create_node")
      node = new joint.shapes.trees.Node({
          name: name,
          behaviour_id: behaviour_id,
          details: details,
          elided_details: _canvas_create_elided_details(details),
          status: status,
          visited: visited,
          data: data
      })
      _canvas_update_node_style({
          node: node,
          colour: colour
      })
      // console.log("_canvas_create_node_done")
      return node
  }

  /**
   * Create graph with initialised variables.
   */
  var _canvas_create_graph = function() {
      graph = new joint.dia.Graph({});
      graph.set('scale_content_to_fit', true)
      // Date.now() returns ms since Jan 1, 1970
      graph.set('last_single_click_ms', Date.now())
      graph.set('last_double_click_ms', Date.now())
      graph.set('tree', {})
      return graph
  }

  /**
   * Initialise the paper with default settings and
   * configure the interactive callbacks (mouse, clicks, etc).
   */
  var _canvas_create_paper = function({graph}) {
      console.log("_canvas_create_paper")
      var paper = new joint.dia.Paper({
          el: document.getElementById('canvas'),
          model: graph,
          width: '100%',
          height: '100%',
          interactive: false,  // disable dragging, but keep highlighting
          // defaultConnector: {  // doesn't seem to have any effect
          //     name: 'rounded',
          //     args: {
          //         radius: 20
          //     }
          // },
          background: { color: '#111111' },
          // gridSize: 15,     // doesn't work?
          // drawGrid: {
          //     name: 'doubleMesh',
          //     args: [
          //         { color: '#222222', thickness: 1 }, // settings for the primary mesh
          //         { color: '#333333', scaleFactor: 5, thickness: 5 } //settings for the secondary mesh
          // ]},
          async: true
      });
      paper.on('element:mouseover', function(view, event) {
          if ( view.model.get('type') == "trees.Node" ) {
              // ugh, is there a better way than pulling [0]?
              //    note; the method used in the view with .find().css({ ... doesn't work
              view.$box.find('div.html-tooltip')[0].style.display = "block"
          }
      })
      paper.on('element:mouseout', function(view, event) {
          if ( view.model.get('type') == "trees.Node" ) {
              view.$box.find('div.html-tooltip')[0].style.display = "none"
          }
      })
      // cell:mousewheel gives strange scale values back (30.0!)
      paper.on('blank:mousewheel',
          _canvas_scale.bind(null, paper)
      )
       // pan canvas
      paper.on('blank:pointerdown',
          _canvas_pan_begin.bind(null, paper)
      )
      paper.on('blank:pointermove',
          _canvas_pan_move.bind(null, paper)
      )
      paper.on('blank:pointerup',
          _canvas_pan_move.bind(null, paper)
      )
      paper.on('blank:pointerdblclick', function(event, x, y) {
          canvas_graph.set('scale_content_to_fit', true)
          _canvas_scale_content_to_fit(paper)
          _canvas_scale_activity_view({paper: paper, graph: paper.model})
          _canvas_scale_blackboard_view({paper: paper, graph: paper.model})
      })
      paper.on('element:pointerdblclick',
        _canvas_handle_collapse_children.bind(null, graph)
      )
      paper.on('element:pointerclick',
        _canvas_handle_select_node.bind(null, paper, graph)
      )

      graph.set("splash", true)
      _canvas_create_splash(paper)

      console.log("_canvas_create_paper_done")
      return paper
  }

  /**
   * Create the graph that shows the splash (shortcuts sheet).
   */
  var _canvas_create_splash = function(paper) {
      console.log("_canvas_create_splash")
      graph = paper.model
      graph.clear()
      dimensions = paper.getComputedSize()
      height = 0.8*dimensions.height
      // splash banner
      var splash = new joint.shapes.standard.Rectangle({
          position: { x: dimensions.width / 2.0 - 100, y: 0.1*dimensions.height},
          size: { width: 300, height: height },
          attrs: {
              body: {
                  fill: '#111111',
                  stroke: '#AAAAAA', 'stroke-width': 1,  // border
                  rx: 5, ry: 5,  // rounded corners
                  'pointer-events': 'none',
                  filter: {
                      name: 'highlight',
                      args: {
                          color: '#999999',
                          width: 2,
                          opacity: 0.8,
                          blur: 5
                      }
                  },
              },
              label: {
                  text: 'Shortcuts - Background\n\n' +
                        '-------------------------------------\n\n' +
                        'Zoom In/Out ............. mousewheel\n\n' +
                        'Scale to Fit ............ double-click\n\n\n' +
                        'Shortcuts - Behaviours\n\n' +
                        '-------------------------------------\n\n' +
                        'Blackboard Tracking ..... single-click\n\n' +
                        'Collapse Children ....... double-click',
                  fill: 'white',
                  'font-size': 12,
              }
          }
      });
      splash.addTo(graph)
      console.log("_canvas_create_splash_done")
  }

  /**
   * Callback for collapsing children on a click event
   */
  var _canvas_handle_collapse_children = function(graph, view, event, x, y) {
      _canvas_collapse_children(graph, view.model)
  }

  /**
   * React to an event triggered by selecting (one-click) a node. Just toggle
   * the selected flag on the node here. Rendering the node and the blackboard
   * view will take advantage of that flag elsewhere.
   */
  var _canvas_handle_select_node = function(paper, graph, view, event, x, y) {
      // make sure we're not picking up double click events, see
      //   https://stackoverflow.com/questions/5497073/how-to-differentiate-single-click-event-and-double-click-event/53939059#53939059
      timestamp_ms = Date.now()
      if (event.detail == 1) {
          graph.set("last_single_click_ms", timestamp_ms)
          setTimeout(() => {
              if ( graph.get("last_single_click_ms") > graph.get("last_double_click_ms") ) {
                  view.model.set('selected', !view.model.get('selected'))
                  // update the blackboard view
                  tree = graph.get("tree")
                  _canvas_update_blackboard_view({
                      graph: graph,
                      visited: tree.visited_path,
                      blackboard: tree.blackboard
                  })
                  _canvas_scale_activity_view({paper: paper, graph: graph})
                  _canvas_scale_blackboard_view({paper: paper, graph: graph})
              }
          }, 350); // ms
      } else {  // event.detail == 2+
          graph.set("last_double_click_ms", Date.now())
          // do nothing, handled in the separate double click handler
      }
  }

  var _canvas_layout_graph = function({graph}) {
      console.log("_canvas_layout_graph")
      graph.set(
          "bounding_box",
          joint.layout.DirectedGraph.layout(graph, {
              marginX: 50,
              marginY: 50,
              nodeSep: 50,
              edgeSep: 80,
              rankDir: "TB"
          })
      );
      // console.log("  dot graph layout")
      // console.log('    x:', graph_bounding_box.x, 'y:', graph_bounding_box.y)
      // console.log('    width:', graph_bounding_box.width, 'height:', graph_bounding_box.height);
      console.log("_canvas_layout_graph_done")
  }

  /**
   * Handle window resizing events. Needs to be hooked up
   * on the outside, e.g. in the web app:
   *
   *    $(window).resize(function() {
   *      py_trees.canvas.on_window_resize(canvas_paper)
   *    })
   */
  var _canvas_on_window_resize = function(paper) {
      console.log("_canvas_on_window_resize")
      graph = paper.model
      console.log("  scale_content_to_fit: ", graph.get('scale_content_to_fit'))
      if (graph.get('splash')) {
          _canvas_create_splash(paper)
      } else {
          if (graph.get('scale_content_to_fit')) {
            _canvas_scale_content_to_fit(paper)
          }
      }
      console.log("_canvas_on_window_resize_done")
  }

  /**
   * Initialise data for a panning maneuvre.
   */
  var _canvas_pan_begin = function(paper, event, x, y) {
      console.log("_canvas_pan_begin")
      scale = paper.scale()
      // TODO: little dirty, monkeypatching paper on the fly
      paper.start_drag = {}
      paper.start_drag.x = x * scale.sx
      paper.start_drag.y = y * scale.sy
      console.log("_canvas_pan_begin_done")
  }
  /**
   * Pan the canvas, lookup the offset via paper.translate() later
   * (necessary when rendering the html views, but not the models).
   */
  var _canvas_pan_move = function(paper, event, x, y) {
      paper.translate(
          event.offsetX - paper.start_drag.x,
          event.offsetY - paper.start_drag.y
      )
      if ( event.type == "mouseup" ) {
          _canvas_scale_activity_view({paper: paper, graph: paper.model})
          _canvas_scale_blackboard_view({paper: paper, graph: paper.model})
      }
  }
  /**
   * Scale the canvas. Note that paper will automagically
   * re-render the models, but any html added via views
   * needs to listen to the paper.scale trigger and react
   * to that explicitly.
   */
  var _canvas_scale = function(paper, event, x, y, delta) {
      graph = paper.model
      graph.set('scale_content_to_fit', false)
      scale = paper.scale()
      sx = scale.sx
      sy = scale.sy
      sx = (sx < 0.2 && delta < 0 ? sx : sx + delta / 10.0)
      sy = (sy < 0.2 && delta < 0  ? sy : sy + delta / 10.0)
      paper.scale(sx, sy)
      _canvas_scale_activity_view({paper: paper, graph: graph})
      _canvas_scale_blackboard_view({paper: paper, graph: graph})
  }

  var _canvas_scale_activity_view = function({paper, graph}) {
      /**
       * Scale the activity view if there is empty space, otherwise leave it
       * scaled to just fit it's own content, even if it overlaps the graph.
       */
          var activity_view = document.getElementById("activity_view")
          if ( activity_view ) {
              canvas_height = paper.getComputedSize().height
              canvas_scale = canvas_paper.scale().sy       // sx, sy
              canvas_offset_height = canvas_paper.translate().ty  // tx, ty
              graph_bounding_box = graph.get("bounding_box")
              scaled_graph_height = canvas_scale * (graph_bounding_box.y + graph_bounding_box.height)
              // initially stored 'fit content' height
              activity_height = graph.get("activity_minimum_height")
              // console.log("  canvas scale: " + canvas_scale)
              // console.log("  canvas height: ", canvas_height)
              // console.log("--------------------------------")
              // console.log("  canvas offset: ", canvas_offset_height)
              // console.log("  graph  height: ", graph.get("bounding_box").height)
              // console.log("  graph  height (scaled): ", scaled_graph_height)
              // console.log("  blackboard height: ", blackboard_height)
              // The 45 is a bit of a hack, it keeps the bottom above a timeline if it is present
              // (timeline height is 35px. Otherwise, just leaves that sized margin if no timeline
              // is present.
              timeline_margin = 45
              epsilon_hack = 20
              if ( canvas_offset_height + scaled_graph_height + activity_height + timeline_margin + epsilon_hack < canvas_height ) {
                  // view fits inside the space between graph bottom and canvas bottom, pull it up
                  activity_view.style.top = Math.max(
                          (canvas_offset_height + scaled_graph_height + epsilon_hack),
                          (1.0 * canvas_height / 3.0)).toString() + "px"
                  // blackboard_view.style.bottom = "auto" // if you want to pull the bottom 'up'.
              } else if ( activity_height + timeline_margin > canvas_height / 3.0 ) {
                  // view doesn't fit and would swamp the canvas - limit it
                  activity_view.style.top = Math.min(
                          (2.0 * canvas_height / 3.0),
                          (canvas_offset_height + scaled_graph_height + epsilon_hack)
                      ).toString() + "px"
              } else {
                  // view doesn't fit but is small, let it grow as needed
                  activity_view.style.top = "auto"
              }
          }
      }

  var _canvas_scale_blackboard_view = function({paper, graph}) {
  /**
   * Scale the blackboard if there is empty space, otherwise leave it
   * scaled to just fit it's own content, even if it overlaps the graph.
   */
      var blackboard_view = document.getElementById("blackboard_view")
      if ( blackboard_view ) {
          canvas_height = paper.getComputedSize().height
          canvas_scale = canvas_paper.scale().sy       // sx, sy
          canvas_offset_height = canvas_paper.translate().ty  // tx, ty
          graph_bounding_box = graph.get("bounding_box")
          scaled_graph_height = canvas_scale * (graph_bounding_box.y + graph_bounding_box.height)
          // initially stored 'fit content' height
          blackboard_height = graph.get("blackboard_minimum_height")
          /*
          console.log("  canvas scale: " + canvas_scale)
          console.log("  canvas height: ", canvas_height)
          console.log("--------------------------------")
          console.log("  canvas offset: ", canvas_offset_height)
          console.log("  graph  height: ", graph.get("bounding_box").height)
          console.log("  graph  height (scaled): ", scaled_graph_height)
          console.log("  blackboard height: ", blackboard_height)
          */
          // The 45 is a bit of a hack, it keeps the bottom above a timeline if it is present
          // (timeline height is 35px. Otherwise, just leaves that sized margin if no timeline
          // is present.
          timeline_margin = 45
          epsilon_hack = 20
          if ( canvas_offset_height + scaled_graph_height + blackboard_height + timeline_margin + epsilon_hack < canvas_height ) {
              // view fits inside the space between graph bottom and canvas bottom, pull it up
              blackboard_view.style.top = Math.max(
                   (canvas_offset_height + scaled_graph_height + epsilon_hack),
                   (1.0 * canvas_height / 3.0)).toString() + "px"
              // blackboard_view.style.bottom = "auto" // if you want to pull the bottom 'up'.
          } else if ( blackboard_height + timeline_margin > canvas_height / 3.0 ) {
              // view doesn't fit and would swamp the canvas - limit it
              blackboard_view.style.top = Math.min(
                      (2.0 * canvas_height / 3.0),
                      (canvas_offset_height + scaled_graph_height + epsilon_hack)
                  ).toString() + "px"
          } else {
              // view doesn't fit but is small, let it grow as needed
              blackboard_view.style.top = "auto"
          }
      }
  }

  var _canvas_scale_content_to_fit = function(paper, event, x, y) {
      console.log("_canvas_scale_content_to_fit")
      paper.scaleContentToFit({
          padding: 50,
          minScale: 0.1,
          maxScale: 1.0,
          scaleGrid: 0.01,
      });
      console.log("_canvas_scale_content_to_fit_done")
  }


  /**
   * Complete update of the canvas - this encapsulates many of the
   * other functions that update, then layout the canvas for both
   * graph and views.
   *
   * paper: jointjs view for the canvas
   * graph: jointjs model for the canvas
   * tree: data for the model
   * force_scale_content_to_fit(bool): scale graph to fit horizontally inside the canvas
   */
  var _canvas_update = function({paper, graph, tree, force_scale_content_to_fit}) {
      paper.freeze()
      var nodes_added = _canvas_update_graph({graph: graph, tree: tree})
      if ( nodes_added.length != 0 ) {
          // dot graph layout
          _canvas_layout_graph({graph: canvas_graph})
          // listen to scale/translate events on the paper
          for (index = 0; index < nodes_added.length; index++) {
              view = paper.findViewByModel(nodes_added[index])
              view.listenTo(paper, 'translate', view.updateBox)
              view.listenTo(paper, 'scale', view.updateBox)

          }
          // Render the views so that appropriate dimensions can be
          // initialised for further calculations, e.g. scale to fit.
          paper.updateViews()
      }
      // force scale content to fit, even if the graph didn't change
      if ( force_scale_content_to_fit ) {
          canvas_graph.set('scale_content_to_fit', true)
          _canvas_scale_content_to_fit(canvas_paper)
      } else if ( canvas_graph.get('scale_content_to_fit') ) {
          _canvas_scale_content_to_fit(canvas_paper)
      }
      _canvas_scale_activity_view({paper: canvas_paper, graph: canvas_graph })
      _canvas_scale_blackboard_view({paper: canvas_paper, graph: canvas_graph })
      paper.unfreeze()
  }

  /**
   * Update the activity view that hangs in the lower left
   * corner of the canvas div.
   *
   * Args:
   *     graph: graph, for computing position of the activity view
   *     activity [str]: list of activity items as xhtml snippets
   *
   * If the activity field is not present (null) this method returns
   * quietly without generating the view.
   */
  var _canvas_update_activity_view = function({graph, activity}) {
      console.log("_canvas_update_activity_view")

      // clean
      var existing_activity_view = document.getElementById("activity_view")
      if ( existing_activity_view ) {
          existing_activity_view.parentNode.removeChild(existing_activity_view)
      }

      if ( activity == null ) {
          console.log("_canvas_update_activity_view_abort - no activity")
          return
      }

      // (re)create the activity view (sans variables)
      var canvas = document.getElementById("canvas")
      var activity_view = document.createElement("div")
      var activity_view_header = document.createElement("div")
      var activity_view_items = document.createElement("div")
      activity_view.id = "activity_view"
      activity_view_header.className = "activity_view_header"
      activity_view_items.className = "activity_view_items"
      activity_view_header.innerHTML =
          "<b>Activity View</b><br/>" +
          "<hr/>"
      activity_view.appendChild(activity_view_header)
      activity_view.appendChild(activity_view_items)
      canvas.appendChild(activity_view)

      _.each(activity, function(item) {
          activity_view_items.innerHTML += item + "<br/>"
      })
      graph.set("activity_minimum_height", activity_view.offsetHeight)
      console.log("_canvas_update_activity_view_done")
  }

  /**
   * Update the blackboard view that hangs in the upper right
   * corner of the canvas div.
   *
   * Args:
   *     selected: list of behaviour id's to track
   *     visited: list of behaviour id's visited
   *     blackboard: expects a dict with the following structure
   *
   * {
   *     "behaviours": {
   *         <id>: {
   *             <key>: <access>
   *         }
   *     },
   *     "data": {
   *         <key>: <value>
   *     }
   * }
   *
   * If relevant fields are not present or empty, this method returns
   * quietly without generating the view.
   */
  var _canvas_update_blackboard_view = function({graph, visited, blackboard}) {
      console.log("_canvas_update_blackboard_view")

      // clean
      var existing_blackboard_view = document.getElementById("blackboard_view")
      if ( existing_blackboard_view ) {
          existing_blackboard_view.parentNode.removeChild(existing_blackboard_view)
      }

      if ( blackboard == null ) {
          console.log("_canvas_update_blackboard_view_abort - no blackboard")
          return
      }
      // do the optional blackboard fields exist? if not, don't show anything
      if (!("behaviours" in blackboard)) {
          console.log("_canvas_update_blackboard_view_abort - no behaviours")
          return
      }
      if (!("data" in blackboard)) {
          console.log("_canvas_update_blackboard_view_abort - no data")
          return
      }
      if ( Object.keys(blackboard.behaviours).length === 0 ) {
          console.log("_canvas_update_blackboard_view_abort - behaviours empty")
          return
      }
      if ( Object.keys(blackboard.data).length === 0 ) {
          console.log("_canvas_update_blackboard_view_abort - data empty")
          return
      }

      // selected nodes
      var selected = []
      _.each(graph.getElements(), function(el) {
          behaviour_id = el.get('behaviour_id')
          if (el.get('selected')) {
              selected.push(behaviour_id)
          }
      })

      // (re)create the blackboard view (sans variables)
      var canvas = document.getElementById("canvas")
      var blackboard_view = document.createElement("div")
      var blackboard_view_header = document.createElement("div")
      var blackboard_view_variables = document.createElement("div")
      blackboard_view.id = "blackboard_view"
      blackboard_view_header.className = "blackboard_view_header"
      blackboard_view_variables.className = "blackboard_view_variables"
      blackboard_view_header.innerHTML =
          "<b>Blackboard View</b><br/>" +
          "(select behaviours or default to visited path)<br/>" +
          "<hr/>"
      blackboard_view.appendChild(blackboard_view_header)
      blackboard_view.appendChild(blackboard_view_variables)
      canvas.appendChild(blackboard_view)

      // anything selected?
      if ( selected.length === 0 ) {
          selected = visited
          // console.log("_canvas_update_blackboard_view_abort - nothing selected")
          // return
      }
      // gather variables
      var blackboard_variables = {}
      // determine intersection of selected and visited / selected and not visited
      selected_and_visited = []
      selected_and_not_visited = []
      for (var i = 0; i < selected.length; i++) {
          var behaviour_id = selected[i]
          if (visited.includes(behaviour_id)) {
              selected_and_visited.push(behaviour_id)
          } else {
              selected_and_not_visited.push(behaviour_id)
          }
      }
      // collect data
      for (var i = 0; i < selected_and_visited.length; i++) {
          var behaviour_id = selected_and_visited[i]
          if ( behaviour_id in blackboard.behaviours ) {
              for (var key in blackboard.behaviours[behaviour_id]) {
                  if (key in blackboard.data) {
                      blackboard_variables[key] = blackboard.data[key]
                  } else {
                      blackboard_variables[key] = '-'
                  }
              }
          }
      }
      // collect and tag not visited variables
      var not_visited_blackboard_variables = []
      for (var i = 0; i < selected_and_not_visited.length; i++) {
          var behaviour_id = selected_and_not_visited[i]
          if ( behaviour_id in blackboard.behaviours ) {
              for (var key in blackboard.behaviours[behaviour_id]) {
                  if (!(key in blackboard_variables)) {
                      if (key in blackboard.data) {
                          blackboard_variables[key] = blackboard.data[key]
                      } else {
                          blackboard_variables[key] = '-'
                      }
                      not_visited_blackboard_variables.push(key)
                  }
              }
          }
      }
      var keys = Object.keys(blackboard_variables)
      keys.sort()
      // populate html
      for (var i=0; i<keys.length; i++) {
          var key = keys[i]
          if ( not_visited_blackboard_variables.includes(key) ) {
              blackboard_view_variables.innerHTML +=
                  "<span style='color: green;'>" + key + ": " +
                  blackboard_variables[key] + "</span><br/>"
          } else {
              blackboard_view_variables.innerHTML +=
                  "<span style='color: cyan;'>" + key + ": " +
                  "<span style='color: yellow;'>" + blackboard_variables[key] + "</span><br/>"
          }
      }
      graph.set("blackboard_minimum_height", blackboard_view.offsetHeight)
      console.log("_canvas_update_blackboard_view_done")
  }

  /**
   * Checks if the constituent graph cell/link population has changed
   * and clears/rebuilds if that is the case. The clear/rebuild is
   * expensive, but in most cases, happens very rarely. it's usually
   * just the cell/link data changes. 
   *
   * Following this, it then proceeds to update each node/link to
   * reflect new details.
   * 
   * Returns: true or false depending on whether the graph changed
   *   i.e. composition of nodes and cells, not their contents/styles
   */
  var _canvas_update_graph = function({graph, tree}) {

    // Log the tree for introspection
    console.log("_canvas_update_graph")
    // console.log("  behaviours", tree.behaviours)
    // console.log("  visited path: " + tree.visited_path)

    console.log("_canvas_update_graph_preparation_and_verification")
    graph.set("splash", false)

    // extract interactive information
    // also collect old behaviour ids to later compare with new tree
    var collapsed_nodes = []
    var _behaviour_ids = []
    _.each(graph.getElements(), function(el) {
        behaviour_id = el.get('behaviour_id')
        _behaviour_ids.push(behaviour_id)
        if (el.get('collapse_children')) {
          collapsed_nodes.push(behaviour_id)
        }
    })

    // root level json checks
    // TODO: replace with a json specification verification later
    if (typeof tree.behaviours == 'undefined') {
      alert("Tree Parsing Error: tree.behaviours does not exist")
      return
    }
    if (typeof tree.timestamp == 'undefined') {
        alert("Tree Parsing Error: tree.timestamp does not exist")
        return
    }
    for (behaviour in tree.behaviours) {
        // at least id, name are required, all others are optional
        if (typeof tree.behaviours[behaviour].id == 'undefined') {
            alert("Tree Parsing Error: tree.behaviours[n].id does not exist")
            return
        }
        if (typeof tree.behaviours[behaviour].name == 'undefined') {
            alert("Tree Parsing Error: tree.behaviours[n].name does not exist")
            return
        }
    }

    console.log("_canvas_update_graph_clear_if_necessary")

    // Determine if we need to fully clear elements and links
    need_to_clear = false
    if (_behaviour_ids.length != Object.keys(tree.behaviours).length) {
        need_to_clear = true
    } else {
        for (behaviour in tree.behaviours) {
            if (!_behaviour_ids.includes(tree.behaviours[behaviour].id)) {
                need_to_clear = true
            }
        }
    }
    var _cells = []
    if ( need_to_clear ) {
        // reset
        graph.clear()

        console.log("_canvas_update_graph_create_nodes")
        // repopulate
        var _nodes = {}
        for (behaviour in tree.behaviours) {
            node = _canvas_create_node({
                behaviour_id: tree.behaviours[behaviour].id,
                colour: tree.behaviours[behaviour].colour || '#555555',
                name: tree.behaviours[behaviour].name,
                status: tree.behaviours[behaviour].status || 'INVALID',
                details: tree.behaviours[behaviour].details || '...',
                visited: tree.visited_path.includes(tree.behaviours[behaviour].id) || false,
                data: tree.behaviours[behaviour].data || {},
            })
            _nodes[tree.behaviours[behaviour].id] = node
            _cells.push(node)
        }
        console.log("_canvas_update_graph_create_links")
        for (behaviour in tree.behaviours) {
            if ( typeof tree.behaviours[behaviour].children !== 'undefined') {
                tree.behaviours[behaviour].children.forEach(function (child_id, index) {
                    link = new joint.shapes.standard.Link()
                    _canvas_update_link({
                        link: link,
                        source: _nodes[tree.behaviours[behaviour].id],
                        target: _nodes[child_id],
                    })
                    _cells.push(link)
                });
            }
        }
        console.log("_canvas_update_graph_add_nodes_and_links")
        graph.resetCells(_cells)

        console.log("_canvas_update_graph_re-establish_interactivity")
        // re-establish interactive properties
        _.each(graph.getElements(), function(el) {
            behaviour_id = el.get("behaviour_id")
            if (collapsed_nodes.includes(behaviour_id)) {
              _canvas_collapse_children(graph, el)
            }
        })
    } else {
        var _elements_by_id = {}
        _.each(graph.getElements(), function(element) {
            _elements_by_id[element.get("behaviour_id")] = element
        })
        console.log("_canvas_update_graph_update_nodes")
        for (behaviour in tree.behaviours) {
            _canvas_update_node({
                node: _elements_by_id[tree.behaviours[behaviour].id],
                behaviour_id: tree.behaviours[behaviour].id,
                colour: tree.behaviours[behaviour].colour || '#555555',
                name: tree.behaviours[behaviour].name,
                status: tree.behaviours[behaviour].status || 'INVALID',
                details: tree.behaviours[behaviour].details || '...',
                visited: tree.visited_path.includes(tree.behaviours[behaviour].id) || false,
                data: tree.behaviours[behaviour].data || {},
            })
        }
        console.log("_canvas_update_graph_update_links")
        _.each(graph.getLinks(), function(link) {
            _canvas_update_link({
                link: link,
                source: graph.getCell([link.get("source").id]),
                target: graph.getCell([link.get("target").id]),
            })
        })
    }
    console.log("_canvas_update_graph_update_views")
    _canvas_update_activity_view({
        graph: graph,
        activity: tree.activity,
    })
    _canvas_update_blackboard_view({
        graph: graph,
        visited: tree.visited_path,
        blackboard: tree.blackboard
    })
    graph.set("tree", tree)
    console.log("_canvas_update_graph_done")
    return _cells
  }

  /**
   * Update a link - source, target, colour by status and
   * highlight for visited.
   */
  var _canvas_update_link = function({link, source, target}) {
      // console.log("_canvas_update_link")
      var very_dark_gray = '#444444'
      var stroke = very_dark_gray
      if (target.get("visited")) {
          switch(target.get("status")) {
              case "SUCCESS":
                  stroke = 'green'
                  break;
              case "RUNNING":
                  stroke = 'blue'
                  break;
              case "FAILURE":
                  stroke = 'red'
                  break;
              case "INVALID":
                  stroke = 'white'
                  break;
              default:
                  stroke = very_dark_gray
          }
      }
      link.attr({
          line: { // selector for the visible <path> SVGElement
              stroke: stroke // SVG attribute and value
          }
      });
      // TODO: avoid setting these if the link already exists, not urgent
      //       though, since the blockers are always above setting the html attrs.
      link.source(source)
      link.target(target)
      // Routers
      //   obstacle avoiding: manhatten (orthogonal), metro (octolinear)
      //   other: normal, orthogonal, oneSide (restricted orthogonal)
      //   demo: https://resources.jointjs.com/demos/routing
      // Connectors
      //   smooth: bezier, doesn't play well with manhattan or metro
      //   rounded: best option with manhattan or metro
      //   other: jumpover, normal
      // Notes
      //   metro - can't make it work, half the links end up in the centre of the cells
      //   normal/smooth - bezier curves to the boundary point, so arrow doesn't end up pointing to the centre of the cell
      //   a custom 'smooth' connector?
      //     https://resources.jointjs.com/docs/jointjs/v3.0/joint.html#connectors.custom
      //
      link.connector('rounded')  //
      link.router('manhattan', {
          step: 1,
          padding: { top: 25 },
          startDirections: ['bottom'],
          endDirections: ['top']
      })
      // console.log("_canvas_update_link_done")
      return link
  }

  /*
   * Take an existing node model and update it's properties rather than
   * creating it. This assumes the passed in node's id underpins the
   * transient nature of the other elements.
   */
  var _canvas_update_node = function({node, behaviour_id, colour, name, details, status, visited, data}) {
      // TODO assert that behaviour_id is the same
      // console.log("_canvas_update_node")
      node.set("name", name)
      node.set("details", _canvas_create_elided_details(details))
      node.set("status", status)
      node.set("visited", visited)
      node.set("data", data)
      _canvas_update_node_style({
          node: node,
          colour: colour
      })
      // console.log("_canvas_update_node_done")
  }

  /*
   * Update just the style.
   *
   * This method is hanging on it's own since it is
   * used in multiple places (node creation and
   * node update).
   *
   * It also makes implicit use of the node's status
   * and visited attributes (set before calling this
   * method).
   */
  var _canvas_update_node_style = function({node, colour}) {
      status = node.get("status")
      visited = node.get("visited")
      var highlight_colours = {
          'FAILURE': 'red',
          'SUCCESS': 'green',
          'RUNNING': 'blue',
          'INVALID': 'gray'
      }
      // TODO: consider not showing any highlight if invalid
      if ( typeof status !== 'undefined') {
          node.attr({
            'box': {
              opacity: visited ? 1.0 : 0.3,
              filter: {
                  name: 'highlight',
                  args: {
                      color: highlight_colours[status],
                      width: 3,
                      opacity: 0.8,
                      blur: 5
                  }
              }
            },
            'type': {
                fill: colour || '#555555',
                opacity: visited ? 1.0 : 0.3
            },
          })
      }
  }

  // *************************************************************************
  // py_trees.timeline
  // *************************************************************************
  // Variables
  //
  //   graph
  //     buttons ({string: jointjs model}) - keys are one of 'previous', 'next', 'resume'
  //     cache (jointjs models) - all jointjs objects for timeline events
  //     streaming (bool)
  //   cache
  //     selected (joint.shapes.trees.EventMarker) - model for the selected event marker (rendered tree)
  //     selected_index (int) - index in trees / event markers lists for currently rendered tree
  //     trees ([dict]) - tree data (pure js structure, i.e. no jointjs)
  //     events ([joint.shapes.trees.EventMarker]) - models for the events

  /**
   * Create a graph for the timeline, allocating storage for the cache
   * to be bounded by the specified cache size.
   */
  var _timeline_create_graph = function({event_cache_limit}) {
      var graph = new joint.dia.Graph({});
      separation_width = 20
      height = 30
      timeline_width = 2400
      var cache = new joint.shapes.standard.Rectangle({
          position: { x: 0, y: 0},
          size: { width: timeline_width, height: height },
          attrs: {
              body: {
                  fill: '#111111',
                  stroke: '#AAAAAA', 'stroke-width': 1,  // border
                  rx: 5, ry: 5,  // rounded corners
                  filter: {
                      name: 'highlight',
                      args: {
                          color: '#999999',
                          width: 2,
                          opacity: 0.8,
                          blur: 5
                      }
                  },
              },
          }
      });
      cache.set('event_cache_limit', event_cache_limit)
      cache.set('trees', [])
      var previous = new joint.shapes.standard.Rectangle({
          position: { x: cache.get('size').width + separation_width, y: 0},
          size: { width: 70, height: height },
          attrs: {
              body: {
                  fill: '#111111',
                  stroke: '#AAAAAA', 'stroke-width': 1,  // border
                  rx: 5, ry: 5,  // rounded corners
                  'pointer-events': 'auto',
                  filter: {
                      name: 'highlight',
                      args: {
                          color: '#999999',
                          width: 2,
                          opacity: 0.8,
                          blur: 5
                      }
                  },
              },
              label: {
                  text: '<',
                  fill: 'white',
                  'font-size': height - 8,
              }
          }
      });
      next = previous.clone()
      next.translate(previous.get('size').width + separation_width, 0)
      next.attr({
          label: { text: '>' }
      })
      resume = next.clone()
      resume.translate(next.get('size').width + separation_width, 0)
      resume.attr({
          label: {
              text: '>>'
          }
      })
      // populate graph
      cache.addTo(graph);
      previous.addTo(graph)
      next.addTo(graph)
      resume.addTo(graph)
      graph.set('streaming', true)
      graph.set('cache', cache)
      graph.set('buttons', {'previous': previous, 'next': next, 'resume': resume})
      _timeline_toggle_buttons({graph: graph, enabled: false})
      return graph
  }

  /**
   * Create the timeline paper and a few mouseover events for event markers.
   */
  var _timeline_create_paper = function({timeline_graph, canvas_graph, canvas_paper}) {
      var paper = new joint.dia.Paper({
          el: document.getElementById('timeline'),
          model: timeline_graph,
          width: '100%',
          height: '35px',
          background: { color: '#111111' },
          interactive: false,
      });
      paper.on('element:mouseover', _timeline_zoom_event_marker_appearance)
      paper.on('element:mouseout', _timeline_restore_event_marker_appearance)
      paper.on(
          'element:pointerclick',
          _timeline_handle_element_pointerclicks.bind(null, timeline_graph, canvas_graph, canvas_paper)
      )
      paper.on(
          'element:pointermove',
          _timeline_handle_dragging.bind(null, paper)
      )
      paper.on('element:pointerdown', _timeline_handle_button_pressed)
      paper.on('element:pointerup',_timeline_handle_button_pressed)
      _timeline_scale_content_to_fit(paper)
      return paper
  }


  /**
   * Currently only used to make sure event marker appearance's
   * are restored when moving out of their bounding box rather than
   * on a mouseout.
   */
  var _timeline_handle_dragging = function(paper, view, event, x, y) {
      console.log("_timeline_handle_dragging")
      if ( view.model.get('type') == "trees.EventMarker" ) {
          outside = true
          views = paper.findViewsFromPoint({x: x, y: y})
          for (var index = 0; index < views.length; index++) {
              if (views[index].model.id == view.model.id) {
                  outside = false
              }
          }
          if ( outside ) {
              _timeline_restore_event_marker_appearance(view)
          }
      }
  }
  /**
   * Checks to see if a button was pressed and animate it with the
   * appearance of being pushed in and out.
   */
  var _timeline_handle_button_pressed = function(view, event, x, y) {
      console.log("_timeline_handle_button_pressed (up || down)")
      console.log(event)
      pressed = event.type == "mousedown" ? true : false
      if ( ( view.model.id == timeline_graph.get('buttons')["previous"].id ) ||
           ( view.model.id == timeline_graph.get('buttons')["next"].id ) ||
           ( view.model.id == timeline_graph.get('buttons')["resume"].id ) ) {
          console.log("  button '%s'", event.type)
          view.model.attr({
              body: {
                  stroke: pressed ? '#777777' : '#AAAAAA',
                  filter: {
                      args: {
                          color: pressed ? '#333333' : '#999999',
                      }
                  },
              },
              label: {
                  fill: pressed ? '#555555' : 'white',
              }
          })
          multiplier = event.type == "mousedown" ? 1 : -1
          view.model.translate(2 * multiplier, 2 * multiplier)
      }
  }

  var _timeline_handle_element_pointerclicks = function(
      timeline_graph,
      canvas_graph,
      canvas_paper,
      view
  ) {
      console.log("_timeline_handle_element_pointerclicks")
      cache = timeline_graph.get('cache')
      trees = cache.get('trees')
      events = cache.get('events')

      if ( view.model.get('type') == "trees.EventMarker" ) {
          console.log("  clicked an event marker")
          _timeline_select_event(timeline_graph, canvas_graph, canvas_paper, view.model)
          _timeline_toggle_buttons({graph: timeline_graph, enabled: true})
          timeline_graph.set('streaming', false)
      } else { // buttons
          if ( view.model.id == timeline_graph.get('buttons')["resume"].id ) {
              console.log("  clicked 'resume'")
              timeline_graph.set('streaming', true)
              _timeline_toggle_buttons({graph: timeline_graph, enabled: false})
              // could alternatively find the last tree's event marker view via
              // _.each(cache_model.getEmbeddedCells(), function(embedded) {
              //    tree = embedded.get('tree')
              //    check timestamp with the trees' last element's timestamp
              //    pass that model's view to  _timeline_select_event
              _timeline_rebuild_cache_event_markers({graph: timeline_graph})
              _canvas_update({
                  paper: canvas_paper,
                  graph: canvas_graph,
                  tree: cache.get('selected').get('tree'),
                  force_scale_content_to_fit: true
              })
          } else if ( view.model.id == timeline_graph.get('buttons')["next"].id ) {
              console.log("  clicked 'next'")
              index = cache.get('selected_index')
              if ( index != events.length - 1) {
                  console.log("    next  timestamp : ", events[index+1].get('tree').timestamp)
                  _timeline_select_event(timeline_graph, canvas_graph, canvas_paper, events[index+1])
              } else {
                  console.log("    obstinately refusing to advance to the 'next' event marker [already at the end of the timeline]")
              }
          } else if ( view.model.id == timeline_graph.get('buttons')["previous"].id ) {
              console.log("  clicked 'previous'")
              index = cache.get('selected_index')
              if ( index != 0) {
                  console.log("    next  timestamp : ", events[index-1].get('tree').timestamp)
                  _timeline_select_event(timeline_graph, canvas_graph, canvas_paper, events[index-1])
              } else {
                  console.log("    obstinately refusing to advance to the 'previous' event marker [already at the beginning of the timeline]")
              }
          } else {
              alert("Error: unknown element clicked")
          }
      }
  }

  /**
   * Handle window resizing events. Needs to be hooked up
   * on the outside, e.g. in the web app:
   *
   *    $(window).resize(function() {
   *      py_trees.timeline.on_window_resize(timeline_paper)
   *    })
   */
  var _timeline_on_window_resize = function(paper) {
      console.log("_timeline_on_window_resize")
      _timeline_scale_content_to_fit(paper)
      console.log("_timeline_on_window_resize_done")
  }

  var _timeline_select_event = function(
          timeline_graph,
          canvas_graph,
          canvas_paper,
          event  // joint.shapes.trees.EventMarker
  ) {
      console.log("Select timeline event")

      cache = timeline_graph.get('cache')
      events = cache.get('events')
      tree = event.get('tree')

      // force scale content to fit, even if the graph didn't change so you get the whole tree
      _canvas_update({
          paper: canvas_paper,
          graph: canvas_graph,
          tree: tree,
          force_scale_content_to_fit: true
      })

      // update timeline highlight
      // TODO: optimise, i.e. cache the selected marker and update
      // it only
      _.each(cache.getEmbeddedCells(), function(embedded) {
          _timeline_highlight_event({event: embedded, highlight: false})
      })
      _timeline_highlight_event({event: event, highlight: true})
      cache.set('selected', event)
      for (var index = 0; index < events.length; index++) {
          if (events[index].get('id') == event.get('id')) {
              cache.set('selected_index', index)
              break
          }
      }
  }

  /**
   * Toggle the visual and checkable state of the buttons.
   */
  var _timeline_toggle_buttons = function({graph, enabled}) {
      buttons = graph.get('buttons')
      opacity = enabled ? 1.0 : 0.3
      for (var key in buttons) {
          buttons[key].attr({
              body: {
                  stroke: enabled ? '#AAAAAA' : '#777777',
                  'pointer-events': enabled ? 'auto' : 'none',
                  filter: {
                      args: {
                          color: enabled ? '#999999' : '#333333',
                      }
                  },
              },
              label: {
                  fill: enabled ? 'white' : '#555555',
              }
          })
      }
  }

  /**
   * Resize (enlargen) and re-position the timeline event marker
   * centred on it's current position.
   */
  var _timeline_zoom_event_marker_appearance = function(view) {
      mouse_over_zoom_scale = 3.0
      if ( view.model.get('type') == "trees.EventMarker") {
          console.log("_timeline_zoom_event_marker_appearance")
          size = view.model.get('size')
          view.model.translate(
              - (mouse_over_zoom_scale - 1) * size.width / 2.0,
              0.0
          )
          view.model.resize(mouse_over_zoom_scale * size.width, size.height)
          view.model.attr({
              body: {
                  strokeWidth: 0 // 2
              }
          })
      }
  }

  /**
   * Highlight the event marker, used to denote it's elevated status
   * with respect to other event markers.
   */
  var _timeline_highlight_event = function({event, highlight}) {
      if ( highlight ) {
          event.toFront()
          colour = 'red'
      } else if ( event.get('significant') ) {
          colour = 'white'
      } else {
          colour = 'green'  // grey doesn't sufficiently distinguish itself from white
      }
      event.attr({
          body: {
              fill: colour
          }
      })
  }

  /**
   * Resize (shrink) and re-position the event marker to it's original position.
   */
  var _timeline_restore_event_marker_appearance = function(view) {
      if ( view.model.get('type') == "trees.EventMarker") {
          console.log("_timeline_restore_event_marker_appearance")
          position = view.model.get('position')
          size = view.model.get('size')
          if ( size.width == view.model.get('default_width')) {
              return
          }
          mouse_over_zoom_scale = 3.0  // also used by _timeline_zoom_event_marker_appearance
          original_width = size.width / mouse_over_zoom_scale
          view.model.translate(
              - (mouse_over_zoom_scale - 1) * original_width / 2.0,
              0.0
          )
          view.model.resize(
               width=size.width / mouse_over_zoom_scale,
               height=size.height,
               opt={
                   direction: 'top-left'
               }
          )
          view.model.attr({
              body: {
                  strokeWidth: 0
              }
          })
      }
  }

  var _timeline_scale_content_to_fit = function(paper) {
      console.log("_timeline_scale_content_to_fit")
      paper.scaleContentToFit({
          padding: 10,
          minScale: 0.1,
          preserveAspectRatio: false,
          scaleGrid: 0.005,
      });
      console.log("_timeline_scale_content_to_fit_done")
  }

  /**
   * Add the incoming tree to the cache (stored in
   * the specified graph).
   *
   * Also trigger any necessary actions post-update.
   * Alternatively, could setup listeners on the tree cache
   * variable to do similarly.
   */
  var _timeline_add_tree_to_cache = function({
          timeline_graph,
          canvas_graph,
          canvas_paper,
          tree
      }) {
      console.log("_timeline_add_tree_to_cache")
      time_start_ms = Date.now()
      cache = timeline_graph.get('cache')
      trees = cache.get('trees')

      // update the tree cache
      if ( trees.length == cache.get('event_cache_limit')) {
          trees.shift() // pop first element
          cache.set('selected_index', cache.get('selected_index') - 1)
      }
      // ugly hack since I can't pass in a boolean except as a string
      //   mayhap there is some way...load the json object into javascript?
      tree['changed'] = tree['changed'] == 'true' ? true : false
      trees.push(tree)
      _timeline_rebuild_cache_event_markers({graph: timeline_graph})

      if ( timeline_graph.get('streaming') ) {
          _canvas_update({
              paper: canvas_paper,
              graph: canvas_graph,
              tree: tree,
              force_scale_content_to_fit: false
          })
      }
      console.log("_timeline_add_tree_to_cache_ms: ", Date.now() - time_start_ms)
      console.log("_timeline_add_tree_to_cache_done")
  }

  var _timeline_rebuild_cache_event_markers = function({graph}) {
    console.log("_timeline_rebuild_cache_event_markers")

    cache = graph.get('cache')
    trees = cache.get('trees')

    // clear the visual cache
    _.each(cache.getEmbeddedCells(), function(embedded) {
        cache.unembed(embedded)
        embedded.remove()  // from the graph
    })
    events = []
    min_timestamp = trees.length == 1 ? 0 : trees[0]['timestamp']
    max_timestamp = trees[trees.length - 1]['timestamp']
    delta = max_timestamp - min_timestamp
    // handle the case when only trees are the same timestamp (yes, can happen!)
    delta = delta == 0 ? max_timestamp : delta
    dimensions = cache.getBBox()
    trees.forEach(function (tree, index) {
      // normalise between 0.05 and 0.95
      normalised_x = 0.05 + 0.9 * (tree['timestamp'] - min_timestamp) / delta
      var event_marker = new joint.shapes.trees.EventMarker()
      event_marker.set('significant', tree['changed'])
      event_marker.translate(
          dimensions.x + normalised_x * dimensions.width - event_marker.get('default_width') / 2.0,
          0
      )
      event_marker.resize(event_marker.get('default_width'), dimensions.height)
      event_marker.set('tree', tree)
      if ( !graph.get('streaming') && (index == cache.get('selected_index')) ) {
          cache.set('selected', event_marker)
          _timeline_highlight_event({event: event_marker, highlight: true})
      } else if ( graph.get('streaming') && (index == trees.length - 1) ) {
          _timeline_highlight_event({event: event_marker, highlight: true})
          cache.set('selected', event_marker)
          cache.set('selected_index', index)
      } else {
          _timeline_highlight_event({event: event_marker, highlight: false})
      }
      cache.embed(event_marker)
      events.push(event_marker)
      event_marker.addTo(graph)
    })
    cache.set('events', events)
    console.log("_timeline_rebuild_cache_event_markers_done")
  }

  // *************************************************************************
  // Public API
  // *************************************************************************

  return {
    // variables
    version: _version,
    // methods
    hello: _hello,
    canvas: {
        create_graph: _canvas_create_graph,
        create_node: _canvas_create_node,
        create_paper: _canvas_create_paper,
        layout_graph: _canvas_layout_graph,
        on_window_resize: _canvas_on_window_resize,
        scale_content_to_fit: _canvas_scale_content_to_fit,
        update_graph: _canvas_update_graph,
    },
    experimental: {
      create_demo_tree_definition: _experimental_create_demo_tree_definition,
    },
    timeline: {
      add_tree_to_cache: _timeline_add_tree_to_cache,
      create_graph: _timeline_create_graph,
      create_paper: _timeline_create_paper,
      on_window_resize: _timeline_on_window_resize,
    },
  };
})(); // namespace py_trees
