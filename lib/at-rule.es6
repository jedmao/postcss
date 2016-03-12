import Container from './container';
import warnOnce from './warn-once';
export default class AtRule extends Container {
    /**
     * Represents an at-rule. If it's followed in the CSS by a {} block, this
     * node will have a nodes property representing its children.
     */
    constructor(defaults) {
        super(defaults);
        /**
         * Returns a string representing the node's type. Possible values are
         * root, atrule, rule, decl or comment.
         */
        this.type = 'atrule';
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
    append(...children) {
        if (!this.nodes)
            this.nodes = [];
        super.append(...children);
        return this;
    }
    prepend(...children) {
        if (!this.nodes)
            this.nodes = [];
        super.prepend(...children);
        return this;
    }
    /* istanbul ignore next */
    get afterName() {
        warnOnce('AtRule#afterName was deprecated. Use AtRule#raws.afterName');
        return this.raws.afterName;
    }
    /* istanbul ignore next */
    set afterName(val) {
        warnOnce('AtRule#afterName was deprecated. Use AtRule#raws.afterName');
        this.raws.afterName = val;
    }
    /* istanbul ignore next */
    get _params() {
        warnOnce('AtRule#_params was deprecated. Use AtRule#raws.params');
        return this.raws.params;
    }
    /* istanbul ignore next */
    set _params(val) {
        warnOnce('AtRule#_params was deprecated. Use AtRule#raws.params');
        this.raws.params = val;
    }
}
