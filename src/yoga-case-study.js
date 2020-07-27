import yoga from 'yoga-layout-prebuilt';

const root = yoga.Node.create();
root.setFlexDirection(yoga.FLEX_DIRECTION_COLUMN);
root.setAlignItems(yoga.ALIGN_STRETCH);


const node1 = yoga.Node.create();
node1.setHeight(100)
node1.setFlexGrow(0);
node1.setFlexShrink(0);


const node2 = yoga.Node.create();
node2.setFlexGrow(1);

root.insertChild(node1, 0);
root.insertChild(node2, 1);


root.calculateLayout(500, 300);
console.log(root.getComputedLayout());
console.log(node1.getComputedLayout());
console.log(node2.getComputedLayout());