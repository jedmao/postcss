import Stringifier from './stringifier';
import postcss     from './postcss';
import Node        from './node';

/**
 * Default function to convert a node tree into a CSS string.
 */
function stringify(node: Node, builder: Stringifier.Builder) {
    let str = new Stringifier(builder);
    str.stringify(node);
}

module stringify {
    export var stringify: postcss.Syntax|postcss.Stringify;
}

export default stringify;
