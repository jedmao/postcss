import warnOnce from './warn-once';
import Node from './node';
export default class Declaration extends Node {
    /**
     * Represents a CSS declaration.
     */
    constructor(defaults) {
        super(defaults);
        /**
         * Returns a string representing the node's type. Possible values are
         * root, atrule, rule, decl or comment.
         */
        this.type = 'decl';
    }
    /**
     * @param overrides New properties to override in the clone.
     * @returns A clone of this node. The node and its (cloned) children will
     * have a clean parent and code style properties.
     */
    clone(overrides) {
        return super.clone(overrides);
    }
    toJSON() {
        return super.toJSON();
    }
    /* istanbul ignore next */
    get _value() {
        warnOnce('Node#_value was deprecated. Use Node#raws.value');
        return this.raws.value;
    }
    /* istanbul ignore next */
    set _value(val) {
        warnOnce('Node#_value was deprecated. Use Node#raws.value');
        this.raws.value = val;
    }
    /* istanbul ignore next */
    get _important() {
        warnOnce('Node#_important was deprecated. Use Node#raws.important');
        return this.raws.important;
    }
    /* istanbul ignore next */
    set _important(val) {
        warnOnce('Node#_important was deprecated. Use Node#raws.important');
        this.raws.important = val;
    }
}
