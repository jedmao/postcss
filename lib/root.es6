import Container from './container';
import warnOnce from './warn-once';
export default class Root extends Container {
    /**
     * Represents a CSS file and contains all its parsed nodes.
     */
    constructor(defaults) {
        super(defaults);
        /**
         * Returns a string representing the node's type. Possible values are
         * root, atrule, rule, decl or comment.
         */
        this.type = 'root';
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
     * Removes child from the root node, and the parent properties of node and
     * its children.
     * @param child Child or child's index.
     * @returns This root node for chaining.
     */
    removeChild(child) {
        child = this.index(child);
        if (child === 0 && this.nodes.length > 1) {
            this.nodes[1].raws.before = this.nodes[child].raws.before;
        }
        super.removeChild(child);
        return this;
    }
    normalize(child, sample, type) {
        let nodes = super.normalize(child);
        if (sample) {
            if (type === 'prepend') {
                if (this.nodes.length > 1) {
                    sample.raws.before = this.nodes[1].raws.before;
                }
                else {
                    delete sample.raws.before;
                }
            }
            else if (this.first !== sample) {
                for (let node of nodes) {
                    node.raws.before = sample.raws.before;
                }
            }
        }
        return nodes;
    }
    /**
     * @returns A Result instance representing the root's CSS.
     */
    toResult(options = {}) {
        let LazyResult = require('./lazy-result');
        let Processor = require('./processor');
        let lazy = new LazyResult(new Processor(), this, options);
        return lazy.stringify();
    }
    /* istanbul ignore next */
    /**
     * Deprecated. Use Root#removeChild.
     */
    remove(child) {
        warnOnce('Root#remove is deprecated. Use Root#removeChild.');
        return this.removeChild(child);
    }
    /* istanbul ignore next */
    /**
     * Deprecated. Use Root#source.input.map.
     */
    prevMap() {
        warnOnce('Root#prevMap is deprecated. Use Root#source.input.map');
        return this.source.input.map;
    }
}
