import yoga from 'yoga-layout-prebuilt';

export default function yogaLayoutParser() {
  // The root DOM node of the parsed DOM hierarchy
  var rootNode = null;

  // Maps DOM nodes to Yoga nodes
  var nodeToLayoutNodeMap = new Map();

  // Maps DOM nodes to layout transforms
  var nodeToLayoutTransformMap = new Map();

  // Whether or not the layout has already been calculated
  var layoutCalculated = false;

  // Property parser that can only be applied after the layout has been calculated
  // This is very useful for things like 2D positioning because Flexbox lacks this
  // possibility out of the box. If a yogaLayout property has a value of the form of
  // $some-query-selector#some-rect-property, the property needs access to the already
  // layed out dimensions of the node. Therefore, the parsing of this property is
  // delayed until after the layout has been calculated, which forces a recalculation
  // after the application of the post-layout properties.
  var postLayoutPropertyParsers = [];

  // This map defines how to parse the different yogaLayout properties
  // WARNING: Not all properties are parsed yet.
  var propParseMap = {
    'flex-direction': {
      fnc: 'setFlexDirection',
      params: {
        column: yoga.FLEX_DIRECTION_COLUMN,
        row: yoga.FLEX_DIRECTION_ROW,
      },
    },
    'align-items': {
      fnc: 'setAlignItems',
      params: {
        stretch: yoga.ALIGN_STRETCH,
        center: yoga.ALIGN_CENTER,
      },
    },
    'align-self': {
      fnc: 'setAlignSelf',
      params: {
        stretch: yoga.ALIGN_STRETCH,
        center: yoga.ALIGN_CENTER,
      },
    },
    'flex-grow': {
      fnc: 'setFlexGrow',
      paramsFnc: parseLayoutPropertyValue,
    },
    'flex-shrink': {
      fnc: 'setFlexShrink',
      paramsFnc: parseLayoutPropertyValue,
    },
    width: {
      fnc: 'setWidth',
      paramsFnc: parseLayoutPropertyValue,
    },
    height: {
      fnc: 'setHeight',
      paramsFnc: parseLayoutPropertyValue,
    },
  };

  // The following code automatically generates parse mappings for edge-based
  // properties like e.g. margin-top/right/bottom/left etc.
  var edgeBasedProps = ['margin', 'padding'];
  var edgeBasedPropFncs = ['setMargin', 'setPadding'];
  var edgePropStrings = ['top', 'right', 'bottom', 'left'];
  var edgesPropValues = [
    yoga.EDGE_TOP,
    yoga.EDGE_RIGHT,
    yoga.EDGE_BOTTOM,
    yoga.EDGE_LEFT,
  ];
  for (var propIndex = 0; propIndex < edgeBasedProps.length; ++propIndex) {
    for (var edgeIndex = 0; edgeIndex < edgePropStrings.length; ++edgeIndex) {
      propParseMap[
        `${edgeBasedProps[propIndex]}-${edgePropStrings[edgeIndex]}`
      ] = {
        fnc: edgeBasedPropFncs[propIndex],
        paramsFnc: ((edgeValue) => (node, key, value) => [
          edgeValue,
          ...parseLayoutPropertyValue(node, key, value),
        ])(edgesPropValues[edgeIndex]),
      };
    }
  }

  // Parse a yogaLayout property
  function parseLayoutProperty(node, layoutNode, key, value) {
    var parsedProp = propParseMap[key];

    if (parsedProp) {
      if (parsedProp.params) {
        // Property parameters can be parsed via a simple mapping

        // console.log(`${parsedProp.fnc}(${parsedProp.params[value]})`);
        layoutNode[parsedProp.fnc](parsedProp.params[value]);
      } else if (parsedProp.paramsFnc) {
        // Property parameters are parsed via a parse function

        if (value.indexOf('$') < 0 || layoutCalculated) {
          // Property is either no post-layout property or the layout has already been calculated

          // console.log(
          //   `${parsedProp.fnc}(${parsedProp.paramsFnc(node, key, value)})`
          // );
          layoutNode[parsedProp.fnc](...parsedProp.paramsFnc(node, key, value));
        } else {
          // Delay parsing of property until after layout calculation
          postLayoutPropertyParsers.push(function () {
            parseLayoutProperty(node, layoutNode, key, value);
          });
        }
      }
    } else {
      console.warn(`Unparsable layout property: (${key}: ${value})`);
    }
  }

  // Parses the value of a yogaLayout property
  function parseLayoutPropertyValue(node, key, value) {
    return [
      value[0] === '$'
        ? parseLayoutPropertyVariable(value)
        : value === 'auto'
        ? node.getBoundingClientRect()[key]
        : value,
    ];
  }

  // Parses the value variable of a yogaLayout property
  function parseLayoutPropertyVariable(value) {
    var splitStr = value.substr(1).split('#');
    var node = document.querySelector(splitStr[0]);
    return nodeToLayoutNodeMap.get(node).getComputedLayout()[splitStr[1]];
  }

  return {
    rootNode,
    nodeToLayoutNodeMap,
    parseNodeHierarchy(node) {
      // console.log(node);
      rootNode = rootNode || node;

      // Init transform attribute for later layout application
      nodeToLayoutTransformMap.set(node, '');

      var layoutNode = yoga.Node.create();
      nodeToLayoutNodeMap.set(node, layoutNode);

      // Clean up the yogaLayout properties string
      var propsString = node.getAttribute('yogaLayout');
      var props = propsString
        .split(';')
        .map((prop) => prop.split(':').map((str) => str.trim()));

      // Parse all yogaLayout properties
      for (var i = 0; i < props.length; ++i) {
        parseLayoutProperty(node, layoutNode, props[i][0], props[i][1]);
      }

      // Parse children recursively
      for (var i = 0; i < node.children.length; ++i) {
        var childNode = node.children[i];

        // Only parse children with yogaLayout attributes
        // For this parser to work correctly you have to make sure that a level of
        // the DOM hierarchy either contains yogaLayout attributes on all nodes or
        // on none.
        if (childNode.getAttribute('yogaLayout')) {
          var childLayoutNode = this.parseNodeHierarchy(childNode);

          // Child index might not be correct if non yogaLayout nodes are mixed with yogaLayout
          // nodes on the same level of the DOM hierarchy.
          layoutNode.insertChild(childLayoutNode, i);
        }
      }
      return layoutNode;
    },
    calculateLayout(width, height) {
      // Calculate the layout
      var rootLayoutNode = nodeToLayoutNodeMap.get(rootNode);
      rootLayoutNode.calculateLayout(width, height);
      layoutCalculated = true;

      // Apply post-layout property parsers
      for (var i = 0; i < postLayoutPropertyParsers.length; ++i) {
        postLayoutPropertyParsers[i]();
      }

      // Recalculate the layout
      rootLayoutNode.calculateLayout(width, height);
    },
    applyLayout() {
      // Apply a translation on all yogaLayout nodes to mirror the layout.
      for (var [node, layoutNode] of nodeToLayoutNodeMap.entries()) {
        var transform = node.getAttribute('transform') || '';

        // Remove the previous layout transform
        transform = transform.replace(nodeToLayoutTransformMap.get(node), '');

        // Set the new layout transform
        var newTransform = `translate(${layoutNode.getComputedLeft()}, ${layoutNode.getComputedTop()})`;
        nodeToLayoutTransformMap.set(node, newTransform);
        transform = `${newTransform}${transform}`;

        node.setAttribute('transform', transform);
      }
    },
  };
}
