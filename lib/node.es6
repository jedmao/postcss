import CssSyntaxError from './css-syntax-error';
import Stringifier from './stringifier';
import stringify from './stringify';
import warnOnce from './warn-once';
let cloneNode = (obj, parent) => {
    let cloned = new obj.constructor();
    for (let i in obj) {
        if (!obj.hasOwnProperty(i))
            continue;
        let value = obj[i];
        let type = typeof value;
        if (i === 'parent' && type === 'object') {
            if (parent)
                cloned[i] = parent;
        }
        else if (i === 'source') {
            cloned[i] = value;
        }
        else if (value instanceof Array) {
            cloned[i] = value.map(j => cloneNode(j, cloned));
        }
        else if (i !== 'before' && i !== 'after' &&
            i !== 'between' && i !== 'semicolon') {
            if (type === 'object' && value !== null)
                value = cloneNode(value);
            cloned[i] = value;
        }
    }
    return cloned;
};
export default class Node {
    constructor(defaults = {}) {
        /**
         * Contains information to generate byte-to-byte equal node string as it
         * was in origin input.
         */
        this.raws = {};
        for (let name in defaults) {
            this[name] = defaults[name];
        }
    }
    /**
     * This method produces very useful error messages. If present, an input
     * source map will be used to get the original position of the source, even
     * from a previous compilation step (e.g., from Sass compilation).
     * @returns The original position of the node in the source, showing line
     * and column numbers and also a small excerpt to facilitate debugging.
     */
    error(
        /**
         * Error description.
         */
        message, options = {}) {
        if (this.source) {
            let pos = this.positionBy(options);
            return this.source.input.error(message, pos.line, pos.column, options);
        }
        else {
            return new CssSyntaxError(message);
        }
    }
    /**
     * Creates an instance of Warning and adds it to messages. This method is
     * provided as a convenience wrapper for Result#warn.
     * Note that `opts.node` is automatically passed to Result#warn for you.
     * @param result The result that will receive the warning.
     * @param text Warning message. It will be used in the `text` property of
     * the message object.
     * @param opts Properties to assign to the message object.
     */
    warn(result, text, opts) {
        opts = opts || {};
        opts.node = this;
        return result.warn(text, opts);
    }
    /**
     * Removes the node from its parent and cleans the parent property in the
     * node and its children.
     * @returns This node for chaining.
     */
    remove() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.parent = undefined;
        return this;
    }
    /**
     * @returns A CSS string representing the node.
     */
    toString(stringifier = stringify) {
        if (stringifier.stringify)
            stringifier = stringifier.stringify;
        let result = '';
        stringifier(this, i => result += i);
        return result;
    }
    /**
     * @param overrides New properties to override in the clone.
     * @returns A clone of this node. The node and its (cloned) children will
     * have a clean parent and code style properties.
     */
    clone(overrides = {}) {
        let cloned = cloneNode(this);
        for (let name in overrides) {
            cloned[name] = overrides[name];
        }
        return cloned;
    }
    /**
     * Shortcut to clone the node and insert the resulting cloned node before
     * the current node.
     * @param overrides New Properties to override in the clone.
     * @returns The cloned node.
     */
    cloneBefore(overrides = {}) {
        let cloned = this.clone(overrides);
        this.parent.insertBefore(this, cloned);
        return cloned;
    }
    /**
     * Shortcut to clone the node and insert the resulting cloned node after
     * the current node.
     * @param overrides New Properties to override in the clone.
     * @returns The cloned node.
     */
    cloneAfter(overrides = {}) {
        let cloned = this.clone(overrides);
        this.parent.insertAfter(this, cloned);
        return cloned;
    }
    /**
     * Inserts node(s) before the current node and removes the current node.
     * @returns This node for chaining.
     */
    replaceWith(...nodes) {
        if (this.parent) {
            for (let node of nodes) {
                this.parent.insertBefore(this, node);
            }
            this.remove();
        }
        return this;
    }
    /**
     * Removes the node from its current parent and inserts it at the end of
     * newParent. This will clean the before and after code style properties
     * from the node and replace them with the indentation style of newParent.
     * It will also clean the between property if newParent is in another Root.
     * @param newParent Where the current node will be moved.
     * @returns This node for chaining.
     */
    moveTo(newParent) {
        this.cleanRaws(this.root() === newParent.root());
        this.remove();
        newParent.append(this);
        return this;
    }
    /**
     * Removes the node from its current parent and inserts it into a new
     * parent before otherNode. This will also clean the node's code style
     * properties just as it would in node.moveTo(newParent).
     * @param otherNode Will be after the current node after moving.
     * @returns This node for chaining.
     */
    moveBefore(otherNode) {
        this.cleanRaws(this.root() === otherNode.root());
        this.remove();
        otherNode.parent.insertBefore(otherNode, this);
        return this;
    }
    /**
     * Removes the node from its current parent and inserts it into a new
     * parent after otherNode. This will also clean the node's code style
     * properties just as it would in node.moveTo(newParent).
     * @param otherNode Will be before the current node after moving.
     * @returns This node for chaining.
     */
    moveAfter(otherNode) {
        this.cleanRaws(this.root() === otherNode.root());
        this.remove();
        otherNode.parent.insertAfter(otherNode, this);
        return this;
    }
    /**
     * @returns The next child of the node's parent; or, returns undefined if
     * the current node is the last child.
     */
    next() {
        let index = this.parent.index(this);
        return this.parent.nodes[index + 1];
    }
    /**
     * @returns The previous child of the node's parent; or, returns undefined
     * if the current node is the first child.
     */
    prev() {
        let index = this.parent.index(this);
        return this.parent.nodes[index - 1];
    }
    toJSON() {
        let fixed = {};
        for (let name in this) {
            if (!this.hasOwnProperty(name))
                continue;
            if (name === 'parent')
                continue;
            let value = this[name];
            if (value instanceof Array) {
                fixed[name] = value.map(i => {
                    if (typeof i === 'object' && i.toJSON) {
                        return i.toJSON();
                    }
                    else {
                        return i;
                    }
                });
            }
            else if (typeof value === 'object' && value.toJSON) {
                fixed[name] = value.toJSON();
            }
            else {
                fixed[name] = value;
            }
        }
        return fixed;
    }
    /**
     * @param prop Name or code style property.
     * @param defaultType Name of default value. It can be easily missed if the
     * value is the same as prop.
     * @returns A code style property value. If the node is missing the code
     * style property (because the node was manually built or cloned), PostCSS
     * will try to autodetect the code style property by looking at other nodes
     * in the tree.
     */
    raw(prop, defaultType) {
        let str = new Stringifier();
        return str.raw(this, prop, defaultType);
    }
    /**
     * @returns The Root instance of the node's tree.
     */
    root() {
        let result = this;
        while (result.parent)
            result = result.parent;
        return result;
    }
    cleanRaws(keepBetween) {
        delete this.raws.before;
        delete this.raws.after;
        if (!keepBetween)
            delete this.raws.between;
    }
    positionInside(index) {
        let string = this.toString();
        let column = this.source.start.column;
        let line = this.source.start.line;
        for (let i = 0; i < index; i++) {
            if (string[i] === '\n') {
                column = 1;
                line += 1;
            }
            else {
                column += 1;
            }
        }
        return { line, column };
    }
    positionBy(options) {
        let pos = this.source.start;
        if (options.index) {
            pos = this.positionInside(options.index);
        }
        else if (options.word) {
            let index = this.toString().indexOf(options.word);
            if (index !== -1)
                pos = this.positionInside(index);
        }
        return pos;
    }
    /* istanbul ignore next */
    /**
     * Deprecated. Use Node#remove.
     */
    removeSelf() {
        warnOnce('Node#removeSelf is deprecated. Use Node#remove.');
        this.remove();
    }
    /* istanbul ignore next */
    replace(nodes) {
        warnOnce('Node#replace is deprecated. Use Node#replaceWith');
        return this.replaceWith(nodes);
    }
    /* istanbul ignore next */
    style(prop, defaultType) {
        warnOnce('Node#style() is deprecated. Use Node#raw()');
        return this.raw(prop, defaultType);
    }
    /* istanbul ignore next */
    cleanStyles(keepBetween) {
        warnOnce('Node#cleanStyles() is deprecated. Use Node#cleanRaws()');
        return this.cleanRaws(keepBetween);
    }
    /* istanbul ignore next */
    get before() {
        warnOnce('Node#before is deprecated. Use Node#raws.before');
        return this.raws.before;
    }
    /* istanbul ignore next */
    set before(val) {
        warnOnce('Node#before is deprecated. Use Node#raws.before');
        this.raws.before = val;
    }
    /* istanbul ignore next */
    get between() {
        warnOnce('Node#between is deprecated. Use Node#raws.between');
        return this.raws.between;
    }
    /* istanbul ignore next */
    set between(val) {
        warnOnce('Node#between is deprecated. Use Node#raws.between');
        this.raws.between = val;
    }
}
