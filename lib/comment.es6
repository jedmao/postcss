import warnOnce from './warn-once';
import Node from './node';
export default class Comment extends Node {
    /**
     * Represents a comment between declarations or statements (rule and at-rules).
     * Comments inside selectors, at-rule parameters, or declaration values will
     * be stored in the Node#raws properties.
     */
    constructor(defaults) {
        super(defaults);
        /**
         * Returns a string representing the node's type. Possible values are
         * root, atrule, rule, decl or comment.
         */
        this.type = 'comment';
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
    get left() {
        warnOnce('Comment#left was deprecated. Use Comment#raws.left');
        return this.raws.left;
    }
    /* istanbul ignore next */
    set left(val) {
        warnOnce('Comment#left was deprecated. Use Comment#raws.left');
        this.raws.left = val;
    }
    /* istanbul ignore next */
    get right() {
        warnOnce('Comment#right was deprecated. Use Comment#raws.right');
        return this.raws.right;
    }
    /* istanbul ignore next */
    set right(val) {
        warnOnce('Comment#right was deprecated. Use Comment#raws.right');
        this.raws.right = val;
    }
}
