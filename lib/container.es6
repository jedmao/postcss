import Declaration from './declaration';
import warnOnce from './warn-once';
import Comment from './comment';
import AtRule from './at-rule';
import parse from './parse';
import Node from './node';
import Root from './root';
import Rule from './rule';
function cleanSource(nodes) {
    return nodes.map(i => {
        if (i.nodes)
            i.nodes = cleanSource(i.nodes);
        delete i.source;
        return i;
    });
}
/**
 * Containers can store any content. If you write a rule inside a rule,
 * PostCSS will parse it.
 */
export default class Container extends Node {
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
    push(child) {
        child.parent = this;
        this.nodes.push(child);
        return this;
    }
    /**
     * Iterates through the container's immediate children, calling the
     * callback function for each child. If you need to recursively iterate
     * through all the container's descendant nodes, use container.walk().
     * Unlike the for {} -cycle or Array#forEach() this iterator is safe if you
     * are mutating the array of child nodes during iteration.
     * @param callback Iterator. Returning false will break iteration. Safe
     * if you are mutating the array of child nodes during iteration. PostCSS
     * will adjust the current index to match the mutations.
     */
    each(callback) {
        if (!this.lastEach)
            this.lastEach = 0;
        if (!this.indexes)
            this.indexes = {};
        this.lastEach += 1;
        let id = this.lastEach;
        this.indexes[id] = 0;
        if (!this.nodes)
            return undefined;
        let index, result;
        while (this.indexes[id] < this.nodes.length) {
            index = this.indexes[id];
            result = callback(this.nodes[index], index);
            if (result === false)
                break;
            this.indexes[id] += 1;
        }
        delete this.indexes[id];
        return result;
    }
    /**
     * Traverses the container's descendant nodes, calling `callback` for each
     * node. Like container.each(), this method is safe to use if you are
     * mutating arrays during iteration. If you only need to iterate through
     * the container's immediate children, use container.each().
     * @param callback Iterator.
     */
    walk(callback) {
        return this.each((child, i) => {
            let result = callback(child, i);
            if (result !== false && child.walk) {
                result = child.walk(callback);
            }
            return result;
        });
    }
    walkDecls(propFilter, callback) {
        if (!callback) {
            callback = propFilter;
            return this.walk((child, i) => {
                if (child.type === 'decl') {
                    return callback(child, i);
                }
            });
        }
        else if (propFilter instanceof RegExp) {
            return this.walk((child, i) => {
                if (child.type === 'decl' && propFilter.test(child.prop)) {
                    return callback(child, i);
                }
            });
        }
        else {
            return this.walk((child, i) => {
                if (child.type === 'decl' && child.prop === propFilter) {
                    return callback(child, i);
                }
            });
        }
    }
    walkRules(selectorFilter, callback) {
        if (!callback) {
            callback = selectorFilter;
            return this.walk((child, i) => {
                if (child.type === 'rule') {
                    return callback(child, i);
                }
            });
        }
        else if (selectorFilter instanceof RegExp) {
            return this.walk((child, i) => {
                if (child.type === 'rule' && selectorFilter.test(child.selector)) {
                    return callback(child, i);
                }
            });
        }
        else {
            return this.walk((child, i) => {
                if (child.type === 'rule' && child.selector === selectorFilter) {
                    return callback(child, i);
                }
            });
        }
    }
    walkAtRules(nameFilter, callback) {
        if (!callback) {
            callback = nameFilter;
            return this.walk((child, i) => {
                if (child.type === 'atrule') {
                    return callback(child, i);
                }
            });
        }
        else if (nameFilter instanceof RegExp) {
            return this.walk((child, i) => {
                if (child.type === 'atrule' && nameFilter.test(child.name)) {
                    return callback(child, i);
                }
            });
        }
        else {
            return this.walk((child, i) => {
                if (child.type === 'atrule' && child.name === nameFilter) {
                    return callback(child, i);
                }
            });
        }
    }
    /**
     * Traverses the container's descendant nodes, calling `callback` for each
     * commennt. Like container.each(), this method is safe to use if you are
     * mutating arrays during iteration.
     * @param callback Iterator called for each comment node within the container.
     */
    walkComments(callback) {
        return this.walk((child, i) => {
            if (child.type === 'comment') {
                return callback(child, i);
            }
        });
    }
    /**
     * Inserts new nodes to the end of the container.
     * Because each node class is identifiable by unique properties, use the
     * following shortcuts to create nodes in insert methods:
     *     root.append({ name: '@charset', params: '"UTF-8"' }); // at-rule
     *     root.append({ selector: 'a' });                       // rule
     *     rule.append({ prop: 'color', value: 'black' });       // declaration
     *     rule.append({ text: 'Comment' })                      // comment
     * A string containing the CSS of the new element can also be used. This
     * approach is slower than the above shortcuts.
     *     root.append('a {}');
     *     root.first.append('color: black; z-index: 1');
     * @param nodes New nodes.
     * @returns This container for chaining.
     */
    append(...nodes) {
        if (!this.nodes)
            this.nodes = [];
        for (let child of nodes) {
            let normalized = this.normalize(child, this.last);
            for (let node of normalized)
                this.nodes.push(node);
        }
        return this;
    }
    /**
     * Inserts new nodes to the beginning of the container.
     * Because each node class is identifiable by unique properties, use the
     * following shortcuts to create nodes in insert methods:
     *     root.prepend({ name: 'charset', params: '"UTF-8"' }); // at-rule
     *     root.prepend({ selector: 'a' });                       // rule
     *     rule.prepend({ prop: 'color', value: 'black' });       // declaration
     *     rule.prepend({ text: 'Comment' })                      // comment
     * A string containing the CSS of the new element can also be used. This
     * approach is slower than the above shortcuts.
     *     root.prepend('a {}');
     *     root.first.prepend('color: black; z-index: 1');
     * @param nodes New nodes.
     * @returns This container for chaining.
     */
    prepend(...nodes) {
        if (!this.nodes)
            this.nodes = [];
        nodes = nodes.reverse();
        for (let child of nodes) {
            let normalized = this.normalize(child, this.first, 'prepend').reverse();
            for (let node of normalized)
                this.nodes.unshift(node);
            for (let id in this.indexes) {
                this.indexes[id] = this.indexes[id] + normalized.length;
            }
        }
        return this;
    }
    cleanRaws(keepBetween) {
        super.cleanRaws(keepBetween);
        if (this.nodes) {
            for (let node of this.nodes)
                node.cleanRaws(keepBetween);
        }
    }
    /**
     * Insert newNode before oldNode within the container.
     * @param oldNode Child or child's index.
     * @returns This container for chaining.
     */
    insertBefore(oldNode, newNode) {
        if (!this.nodes)
            this.nodes = [];
        oldNode = this.index(oldNode);
        let type = oldNode === 0 ? 'prepend' : false;
        let nodes = this.normalize(newNode, this.nodes[oldNode], type).reverse();
        for (let node of nodes)
            this.nodes.splice(oldNode, 0, node);
        let index;
        for (let id in this.indexes) {
            index = this.indexes[id];
            if (oldNode <= index) {
                this.indexes[id] = index + nodes.length;
            }
        }
        return this;
    }
    /**
     * Insert newNode after oldNode within the container.
     * @param oldNode Child or child's index.
     * @returns This container for chaining.
     */
    insertAfter(oldNode, newNode) {
        if (!this.nodes)
            this.nodes = [];
        oldNode = this.index(oldNode);
        let nodes = this.normalize(newNode, this.nodes[oldNode]).reverse();
        for (let node of nodes)
            this.nodes.splice(oldNode + 1, 0, node);
        let index;
        for (let id in this.indexes) {
            index = this.indexes[id];
            if (oldNode < index) {
                this.indexes[id] = index + nodes.length;
            }
        }
        return this;
    }
    /**
     * Removes the container from its parent and cleans the parent property in the
     * container and its children.
     * @returns This container for chaining.
     */
    remove() {
        if (arguments.length) {
            warnOnce('Container#remove is deprecated. ' +
                'Use Container#removeChild');
            return this.removeChild.apply(this, arguments);
        }
        return super.remove();
    }
    /**
     * Removes child from the container and clean the parent properties from the
     * node and its children.
     * @param child Child or child's index.
     * @returns This container for chaining.
     */
    removeChild(child) {
        child = this.index(child);
        this.nodes[child].parent = undefined;
        this.nodes.splice(child, 1);
        let index;
        for (let id in this.indexes) {
            index = this.indexes[id];
            if (index >= child) {
                this.indexes[id] = index - 1;
            }
        }
        return this;
    }
    /**
     * Removes all children from the container and cleans their parent
     * properties.
     * @returns This container for chaining.
     */
    removeAll() {
        for (let node of this.nodes)
            node.parent = undefined;
        this.nodes = [];
        return this;
    }
    replaceValues(pattern, options, callbackOrReplaceValue) {
        if (!callbackOrReplaceValue) {
            callbackOrReplaceValue = options;
            options = {};
        }
        this.walkDecls(decl => {
            if (options.props && options.props.indexOf(decl.prop) === -1)
                return;
            if (options.fast && decl.value.indexOf(options.fast) === -1)
                return;
            decl.value = decl.value.replace(pattern, callbackOrReplaceValue);
        });
        return this;
    }
    /**
     * Determines whether all child nodes satisfy the specified test.
     * @param callback A function that accepts up to three arguments. The
     * every method calls the callback function for each node until the
     * callback returns false, or until the end of the array.
     * @returns True if the callback returns true for all of the container's
     * children.
     */
    every(callback, thisArg) {
        return this.nodes.every(callback, thisArg);
    }
    /**
     * Determines whether the specified callback returns true for any child node.
     * @param callback A function that accepts up to three arguments. The some
     * method calls the callback for each node until the callback returns true,
     * or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the
     * callback function. If thisArg is omitted, undefined is used as the
     * this value.
     * @returns True if callback returns true for (at least) one of the
     * container's children.
     */
    some(callback, thisArg) {
        return this.nodes.some(callback, thisArg);
    }
    /**
     * @param child Child of the current container.
     * @returns The child's index within the container's "nodes" array.
     */
    index(child) {
        if (typeof child === 'number') {
            return child;
        }
        else {
            return this.nodes.indexOf(child);
        }
    }
    /**
     * @returns The container's first child.
     */
    get first() {
        if (!this.nodes)
            return undefined;
        return this.nodes[0];
    }
    /**
     * @returns The container's last child.
     */
    get last() {
        if (!this.nodes)
            return undefined;
        return this.nodes[this.nodes.length - 1];
    }
    normalize(nodes, sample, type) {
        if (typeof nodes === 'string') {
            nodes = cleanSource(parse(nodes).nodes);
        }
        else if (!Array.isArray(nodes)) {
            if (nodes.type === 'root') {
                nodes = nodes.nodes;
            }
            else if (nodes.type) {
                nodes = [nodes];
            }
            else if (nodes.prop) {
                if (typeof nodes.value === 'undefined') {
                    throw new Error('Value field is missed in node creation');
                }
                nodes = [new Declaration(nodes)];
            }
            else if (nodes.selector) {
                nodes = [new Rule(nodes)];
            }
            else if (nodes.name) {
                nodes = [new AtRule(nodes)];
            }
            else if (nodes.text) {
                nodes = [new Comment(nodes)];
            }
            else {
                throw new Error('Unknown node type in node creation');
            }
        }
        let processed = nodes.map((i) => {
            /* istanbul ignore if */
            if (typeof i.raws === 'undefined')
                i = this.rebuild(i);
            if (i.parent)
                i = i.clone();
            if (typeof i.raws.before === 'undefined') {
                if (sample && typeof sample.raws.before !== 'undefined') {
                    i.raws.before = sample.raws.before.replace(/[^\s]/g, '');
                }
            }
            i.parent = this;
            return i;
        });
        return processed;
    }
    /* istanbul ignore next */
    rebuild(node, parent) {
        let fix;
        if (node.type === 'root') {
            fix = new Root();
        }
        else if (node.type === 'atrule') {
            fix = new AtRule();
        }
        else if (node.type === 'rule') {
            fix = new Rule();
        }
        else if (node.type === 'decl') {
            fix = new Declaration();
        }
        else if (node.type === 'comment') {
            fix = new Comment();
        }
        for (let i in node) {
            if (i === 'nodes') {
                fix.nodes = node.nodes.map(j => this.rebuild(j, fix));
            }
            else if (i === 'parent' && parent) {
                fix.parent = parent;
            }
            else if (node.hasOwnProperty(i)) {
                fix[i] = node[i];
            }
        }
        return fix;
    }
    /* istanbul ignore next */
    eachInside(callback) {
        warnOnce('Container#eachInside is deprecated. ' +
            'Use Container#walk instead.');
        return this.walk.apply(this, arguments);
    }
    /* istanbul ignore next */
    eachDecl(propFilter, callback) {
        warnOnce('Container#eachDecl is deprecated. ' +
            'Use Container#walkDecls instead.');
        return this.walkDecls.apply(this, arguments);
    }
    /* istanbul ignore next */
    eachRule(selectorFilter, callback) {
        warnOnce('Container#eachRule is deprecated. ' +
            'Use Container#walkRules instead.');
        return this.walkRules.apply(this, arguments);
    }
    /* istanbul ignore next */
    eachAtRule(nameFilter, callback) {
        warnOnce('Container#eachAtRule is deprecated. ' +
            'Use Container#walkAtRules instead.');
        return this.walkAtRules.apply(this, arguments);
    }
    /* istanbul ignore next */
    eachComment(selectorFilter, callback) {
        warnOnce('Container#eachComment is deprecated. ' +
            'Use Container#walkComments instead.');
        return this.walkComments.apply(this, arguments);
    }
    /* istanbul ignore next */
    get semicolon() {
        warnOnce('Node#semicolon is deprecated. Use Node#raws.semicolon');
        return this.raws.semicolon;
    }
    /* istanbul ignore next */
    set semicolon(val) {
        warnOnce('Node#semicolon is deprecated. Use Node#raws.semicolon');
        this.raws.semicolon = val;
    }
    /* istanbul ignore next */
    get after() {
        warnOnce('Node#after is deprecated. Use Node#raws.after');
        return this.raws.after;
    }
    /* istanbul ignore next */
    set after(val) {
        warnOnce('Node#after is deprecated. Use Node#raws.after');
        this.raws.after = val;
    }
}
