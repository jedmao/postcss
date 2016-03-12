import Stringifier from './stringifier';
/**
 * Default function to convert a node tree into a CSS string.
 */
function stringify(node, builder) {
    let str = new Stringifier(builder);
    str.stringify(node);
}
var stringify;
(function (stringify_1) {
})(stringify || (stringify = {}));
export default stringify;
