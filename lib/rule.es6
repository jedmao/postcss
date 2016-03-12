import Container from './container';
import warnOnce from './warn-once';
import list from './list';
export default class Rule extends Container {
    /**
     * Represents a CSS rule: a selector followed by a declaration block.
     */
    constructor(defaults) {
        super(defaults);
        /**
         * Returns a string representing the node's type. Possible values are
         * root, atrule, rule, decl or comment.
         */
        this.type = 'rule';
        if (!this.nodes)
            this.nodes = [];
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
    /**
     * @returns An array containing the rule's individual selectors.
     * Groups of selectors are split at commas.
     */
    get selectors() {
        return list.comma(this.selector);
    }
    set selectors(values) {
        let match = this.selector ? this.selector.match(/,\s*/) : null;
        let sep = match ? match[0] : ',' + this.raw('between', 'beforeOpen');
        this.selector = values.join(sep);
    }
    get _selector() {
        /* istanbul ignore next */
        warnOnce('Rule#_selector is deprecated. Use Rule#raws.selector');
        /* istanbul ignore next */
        return this.raws.selector;
    }
    set _selector(val) {
        /* istanbul ignore next */
        warnOnce('Rule#_selector is deprecated. Use Rule#raws.selector');
        /* istanbul ignore next */
        this.raws.selector = val;
    }
}
