'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _declaration = require('./declaration');

var _declaration2 = _interopRequireDefault(_declaration);

var _warnOnce = require('./warn-once');

var _warnOnce2 = _interopRequireDefault(_warnOnce);

var _comment = require('./comment');

var _comment2 = _interopRequireDefault(_comment);

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function cleanSource(nodes) {
    return nodes.map(function (i) {
        if (i.nodes) i.nodes = cleanSource(i.nodes);
        delete i.source;
        return i;
    });
}

/**
 * @callback childCondition
 * @param {Node} node    - container child
 * @param {number} index - child index
 * @param {Node[]} nodes - all container children
 * @return {boolean}
 */

/**
 * @callback childIterator
 * @param {Node} node    - container child
 * @param {number} index - child index
 * @return {boolean}
 */

/**
 * The {@link Root}, {@link AtRule}, and {@link Rule} container nodes
 * inherit some common methods to help work with their children.
 *
 * Note that all containers can store any content. If you write a rule inside
 * a rule, PostCSS will parse it.
 *
 * @extends Node
 * @abstract
 * @ignore
 */

var Container = function (_Node) {
    _inherits(Container, _Node);

    function Container() {
        _classCallCheck(this, Container);

        return _possibleConstructorReturn(this, _Node.apply(this, arguments));
    }

    Container.prototype.push = function push(child) {
        child.parent = this;
        this.nodes.push(child);
        return this;
    };

    /**
     * Iterates through the container’s immediate children,
     * calling `callback` for each child.
     *
     * Returning `false` in the callback will break iteration.
     *
     * This method only iterates through the container’s immediate children.
     * If you need to recursively iterate through all the container’s descendant
     * nodes, use {@link Container#walk}.
     *
     * Unlike the for `{}`-cycle or `Array#forEach` this iterator is safe
     * if you are mutating the array of child nodes during iteration.
     * PostCSS will adjust the current index to match the mutations.
     *
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {boolean} returns `false` if iteration was broke
     *
     * @example
     * const root = postcss.parse('a { color: black; z-index: 1 }');
     * const rule = root.first;
     *
     * for ( let decl of rule.nodes ) {
     *     decl.cloneBefore({ prop: '-webkit-' + decl.prop });
     *     // Cycle will be infinite, because cloneBefore moves the current node
     *     // to the next index
     * }
     *
     * rule.each(decl => {
     *     decl.cloneBefore({ prop: '-webkit-' + decl.prop });
     *     // Will be executed only for color and z-index
     * });
     */


    Container.prototype.each = function each(callback) {
        if (!this.lastEach) this.lastEach = 0;
        if (!this.indexes) this.indexes = {};

        this.lastEach += 1;
        var id = this.lastEach;
        this.indexes[id] = 0;

        if (!this.nodes) return undefined;

        var index = void 0,
            result = void 0;
        while (this.indexes[id] < this.nodes.length) {
            index = this.indexes[id];
            result = callback(this.nodes[index], index);
            if (result === false) break;

            this.indexes[id] += 1;
        }

        delete this.indexes[id];

        return result;
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each node.
     *
     * Like container.each(), this method is safe to use
     * if you are mutating arrays during iteration.
     *
     * If you only need to iterate through the container’s immediate children,
     * use {@link Container#each}.
     *
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {boolean} returns `false` if iteration was broke
     *
     * @example
     * root.walk(node => {
     *   // Traverses all descendant nodes.
     * });
     */


    Container.prototype.walk = function walk(callback) {
        return this.each(function (child, i) {
            var result = callback(child, i);
            if (result !== false && child.walk) {
                result = child.walk(callback);
            }
            return result;
        });
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each declaration node.
     *
     * If you pass a filter, iteration will only happen over declarations
     * with matching properties.
     *
     * Like {@link Container#each}, this method is safe
     * to use if you are mutating arrays during iteration.
     *
     * @param {string|RegExp} [prop]   - string or regular expression
     *                                   to filter declarations by property name
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {boolean} returns `false` if iteration was broke
     *
     * @example
     * root.walkDecls(decl => {
     *   checkPropertySupport(decl.prop);
     * });
     *
     * root.walkDecls('border-radius', decl => {
     *   decl.remove();
     * });
     *
     * root.walkDecls(/^background/, decl => {
     *   decl.value = takeFirstColorFromGradient(decl.value);
     * });
     */


    Container.prototype.walkDecls = function walkDecls(prop, callback) {
        if (!callback) {
            callback = prop;
            return this.walk(function (child, i) {
                if (child.type === 'decl') {
                    return callback(child, i);
                }
            });
        } else if (prop instanceof RegExp) {
            return this.walk(function (child, i) {
                if (child.type === 'decl' && prop.test(child.prop)) {
                    return callback(child, i);
                }
            });
        } else {
            return this.walk(function (child, i) {
                if (child.type === 'decl' && child.prop === prop) {
                    return callback(child, i);
                }
            });
        }
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each rule node.
     *
     * If you pass a filter, iteration will only happen over rules
     * with matching selectors.
     *
     * Like {@link Container#each}, this method is safe
     * to use if you are mutating arrays during iteration.
     *
     * @param {string|RegExp} [selector] - string or regular expression
     *                                     to filter rules by selector
     * @param {childIterator} callback   - iterator receives each node and index
     *
     * @return {boolean} returns `false` if iteration was broke
     *
     * @example
     * const selectors = [];
     * root.walkRules(rule => {
     *   selectors.push(rule.selector);
     * });
     * console.log(`Your CSS uses ${selectors.length} selectors');
     */


    Container.prototype.walkRules = function walkRules(selector, callback) {
        if (!callback) {
            callback = selector;

            return this.walk(function (child, i) {
                if (child.type === 'rule') {
                    return callback(child, i);
                }
            });
        } else if (selector instanceof RegExp) {
            return this.walk(function (child, i) {
                if (child.type === 'rule' && selector.test(child.selector)) {
                    return callback(child, i);
                }
            });
        } else {
            return this.walk(function (child, i) {
                if (child.type === 'rule' && child.selector === selector) {
                    return callback(child, i);
                }
            });
        }
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each at-rule node.
     *
     * If you pass a filter, iteration will only happen over at-rules
     * that have matching names.
     *
     * Like {@link Container#each}, this method is safe
     * to use if you are mutating arrays during iteration.
     *
     * @param {string|RegExp} [name]   - string or regular expression
     *                                   to filter at-rules by name
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {boolean} returns `false` if iteration was broke
     *
     * @example
     * root.walkAtRules(rule => {
     *   if ( isOld(rule.name) ) rule.remove();
     * });
     *
     * let first = false;
     * root.walkAtRules('charset', rule => {
     *   if ( !first ) {
     *     first = true;
     *   } else {
     *     rule.remove();
     *   }
     * });
     */


    Container.prototype.walkAtRules = function walkAtRules(name, callback) {
        if (!callback) {
            callback = name;
            return this.walk(function (child, i) {
                if (child.type === 'atrule') {
                    return callback(child, i);
                }
            });
        } else if (name instanceof RegExp) {
            return this.walk(function (child, i) {
                if (child.type === 'atrule' && name.test(child.name)) {
                    return callback(child, i);
                }
            });
        } else {
            return this.walk(function (child, i) {
                if (child.type === 'atrule' && child.name === name) {
                    return callback(child, i);
                }
            });
        }
    };

    /**
     * Traverses the container’s descendant nodes, calling callback
     * for each comment node.
     *
     * Like {@link Container#each}, this method is safe
     * to use if you are mutating arrays during iteration.
     *
     * @param {childIterator} callback - iterator receives each node and index
     *
     * @return {boolean} returns `false` if iteration was broke
     *
     * @example
     * root.walkComments(comment => {
     *   comment.remove();
     * });
     */


    Container.prototype.walkComments = function walkComments(callback) {
        return this.walk(function (child, i) {
            if (child.type === 'comment') {
                return callback(child, i);
            }
        });
    };

    /**
     * Inserts new nodes to the start of the container.
     *
     * @param {...(Node|object|string|Node[])} children - new nodes
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * const decl1 = postcss.decl({ prop: 'color', value: 'black' });
     * const decl2 = postcss.decl({ prop: 'background-color', value: 'white' });
     * rule.append(decl1, decl2);
     *
     * root.append({ name: 'charset', params: '"UTF-8"' });  // at-rule
     * root.append({ selector: 'a' });                       // rule
     * rule.append({ prop: 'color', value: 'black' });       // declaration
     * rule.append({ text: 'Comment' })                      // comment
     *
     * root.append('a {}');
     * root.first.append('color: black; z-index: 1');
     */


    Container.prototype.append = function append() {
        for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
            children[_key] = arguments[_key];
        }

        for (var _iterator = children, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
            }

            var child = _ref;

            var nodes = this.normalize(child, this.last);
            for (var _iterator2 = nodes, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
                var _ref2;

                if (_isArray2) {
                    if (_i2 >= _iterator2.length) break;
                    _ref2 = _iterator2[_i2++];
                } else {
                    _i2 = _iterator2.next();
                    if (_i2.done) break;
                    _ref2 = _i2.value;
                }

                var node = _ref2;
                this.nodes.push(node);
            }
        }
        return this;
    };

    /**
     * Inserts new nodes to the end of the container.
     *
     * @param {...(Node|object|string|Node[])} children - new nodes
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * const decl1 = postcss.decl({ prop: 'color', value: 'black' });
     * const decl2 = postcss.decl({ prop: 'background-color', value: 'white' });
     * rule.prepend(decl1, decl2);
     *
     * root.append({ name: 'charset', params: '"UTF-8"' });  // at-rule
     * root.append({ selector: 'a' });                       // rule
     * rule.append({ prop: 'color', value: 'black' });       // declaration
     * rule.append({ text: 'Comment' })                      // comment
     *
     * root.append('a {}');
     * root.first.append('color: black; z-index: 1');
     */


    Container.prototype.prepend = function prepend() {
        for (var _len2 = arguments.length, children = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            children[_key2] = arguments[_key2];
        }

        children = children.reverse();
        for (var _iterator3 = children, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
            var _ref3;

            if (_isArray3) {
                if (_i3 >= _iterator3.length) break;
                _ref3 = _iterator3[_i3++];
            } else {
                _i3 = _iterator3.next();
                if (_i3.done) break;
                _ref3 = _i3.value;
            }

            var child = _ref3;

            var nodes = this.normalize(child, this.first, 'prepend').reverse();
            for (var _iterator4 = nodes, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
                var _ref4;

                if (_isArray4) {
                    if (_i4 >= _iterator4.length) break;
                    _ref4 = _iterator4[_i4++];
                } else {
                    _i4 = _iterator4.next();
                    if (_i4.done) break;
                    _ref4 = _i4.value;
                }

                var node = _ref4;
                this.nodes.unshift(node);
            }for (var id in this.indexes) {
                this.indexes[id] = this.indexes[id] + nodes.length;
            }
        }
        return this;
    };

    Container.prototype.cleanRaws = function cleanRaws(keepBetween) {
        _Node.prototype.cleanRaws.call(this, keepBetween);
        if (this.nodes) {
            for (var _iterator5 = this.nodes, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
                var _ref5;

                if (_isArray5) {
                    if (_i5 >= _iterator5.length) break;
                    _ref5 = _iterator5[_i5++];
                } else {
                    _i5 = _iterator5.next();
                    if (_i5.done) break;
                    _ref5 = _i5.value;
                }

                var node = _ref5;
                node.cleanRaws(keepBetween);
            }
        }
    };

    /**
     * Insert new node before old node within the container.
     *
     * @param {Node|number} exist             - child or child’s index.
     * @param {Node|object|string|Node[]} add - new node
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * rule.insertBefore(decl, decl.clone({ prop: '-webkit-' + decl.prop }));
     */


    Container.prototype.insertBefore = function insertBefore(exist, add) {
        exist = this.index(exist);

        var type = exist === 0 ? 'prepend' : false;
        var nodes = this.normalize(add, this.nodes[exist], type).reverse();
        for (var _iterator6 = nodes, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
            var _ref6;

            if (_isArray6) {
                if (_i6 >= _iterator6.length) break;
                _ref6 = _iterator6[_i6++];
            } else {
                _i6 = _iterator6.next();
                if (_i6.done) break;
                _ref6 = _i6.value;
            }

            var node = _ref6;
            this.nodes.splice(exist, 0, node);
        }var index = void 0;
        for (var id in this.indexes) {
            index = this.indexes[id];
            if (exist <= index) {
                this.indexes[id] = index + nodes.length;
            }
        }

        return this;
    };

    /**
     * Insert new node after old node within the container.
     *
     * @param {Node|number} exist             - child or child’s index
     * @param {Node|object|string|Node[]} add - new node
     *
     * @return {Node} this node for methods chain
     */


    Container.prototype.insertAfter = function insertAfter(exist, add) {
        exist = this.index(exist);

        var nodes = this.normalize(add, this.nodes[exist]).reverse();
        for (var _iterator7 = nodes, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
            var _ref7;

            if (_isArray7) {
                if (_i7 >= _iterator7.length) break;
                _ref7 = _iterator7[_i7++];
            } else {
                _i7 = _iterator7.next();
                if (_i7.done) break;
                _ref7 = _i7.value;
            }

            var node = _ref7;
            this.nodes.splice(exist + 1, 0, node);
        }var index = void 0;
        for (var id in this.indexes) {
            index = this.indexes[id];
            if (exist < index) {
                this.indexes[id] = index + nodes.length;
            }
        }

        return this;
    };

    Container.prototype.remove = function remove(child) {
        if (typeof child !== 'undefined') {
            (0, _warnOnce2.default)('Container#remove is deprecated. ' + 'Use Container#removeChild');
            this.removeChild(child);
        } else {
            _Node.prototype.remove.call(this);
        }
        return this;
    };

    /**
     * Removes node from the container and cleans the parent properties
     * from the node and its children.
     *
     * @param {Node|number} child - child or child’s index
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * rule.nodes.length  //=> 5
     * rule.removeChild(decl);
     * rule.nodes.length  //=> 4
     * decl.parent        //=> undefined
     */


    Container.prototype.removeChild = function removeChild(child) {
        child = this.index(child);
        this.nodes[child].parent = undefined;
        this.nodes.splice(child, 1);

        var index = void 0;
        for (var id in this.indexes) {
            index = this.indexes[id];
            if (index >= child) {
                this.indexes[id] = index - 1;
            }
        }

        return this;
    };

    /**
     * Removes all children from the container
     * and cleans their parent properties.
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * rule.removeAll();
     * rule.nodes.length //=> 0
     */


    Container.prototype.removeAll = function removeAll() {
        for (var _iterator8 = this.nodes, _isArray8 = Array.isArray(_iterator8), _i8 = 0, _iterator8 = _isArray8 ? _iterator8 : _iterator8[Symbol.iterator]();;) {
            var _ref8;

            if (_isArray8) {
                if (_i8 >= _iterator8.length) break;
                _ref8 = _iterator8[_i8++];
            } else {
                _i8 = _iterator8.next();
                if (_i8.done) break;
                _ref8 = _i8.value;
            }

            var node = _ref8;
            node.parent = undefined;
        }this.nodes = [];
        return this;
    };

    /**
     * Passes all declaration values within the container that match pattern
     * through callback, replacing those values with the returned result
     * of callback.
     *
     * This method is useful if you are using a custom unit or function
     * and need to iterate through all values.
     *
     * @param {string|RegExp} pattern    - replace pattern
     * @param {object} opts              - options to speed up the search
     * @param {string} opts.prop         - an array of property names
     * @param {string} opts.fast         - string that’s used
     *                                     to narrow down values and speed up
     *                                     the regexp search
     * @param {function|string} callback - string to replace pattern
     *                                     or callback that returns a new value.
     *                                     The callback will receive
     *                                     the same arguments as those passed
     *                                     to a function parameter
     *                                     of `String#replace`.
     *
     * @return {Node} this node for methods chain
     *
     * @example
     * root.replaceValues(/\d+rem/, { fast: 'rem' }, string => {
     *   return 15 * parseInt(string) + 'px';
     * });
     */


    Container.prototype.replaceValues = function replaceValues(pattern, opts, callback) {
        if (!callback) {
            callback = opts;
            opts = {};
        }

        this.walkDecls(function (decl) {
            if (opts.props && opts.props.indexOf(decl.prop) === -1) return;
            if (opts.fast && decl.value.indexOf(opts.fast) === -1) return;

            decl.value = decl.value.replace(pattern, callback);
        });

        return this;
    };

    /**
     * Returns `true` if callback returns `true`
     * for all of the container’s children.
     *
     * @param {childCondition} condition - iterator returns true or false.
     *
     * @return {boolean} is every child pass condition
     *
     * @example
     * const noPrefixes = rule.every(i => i.prop[0] !== '-');
     */


    Container.prototype.every = function every(condition) {
        return this.nodes.every(condition);
    };

    /**
     * Returns `true` if callback returns `true` for (at least) one
     * of the container’s children.
     *
     * @param {childCondition} condition - iterator returns true or false.
     *
     * @return {boolean} is every child pass condition
     *
     * @example
     * const hasPrefix = rule.every(i => i.prop[0] === '-');
     */


    Container.prototype.some = function some(condition) {
        return this.nodes.some(condition);
    };

    /**
     * Returns a `child`’s index within the {@link Container#nodes} array.
     *
     * @param {Node} child - child of the current container.
     *
     * @return {number} child index
     *
     * @example
     * rule.index( rule.nodes[2] ) //=> 2
     */


    Container.prototype.index = function index(child) {
        if (typeof child === 'number') {
            return child;
        } else {
            return this.nodes.indexOf(child);
        }
    };

    /**
     * The container’s first child.
     *
     * @type {Node}
     *
     * @example
     * rule.first == rules.nodes[0];
     */


    Container.prototype.normalize = function normalize(nodes, sample) {
        var _this2 = this;

        if (typeof nodes === 'string') {
            var parse = require('./parse');
            nodes = cleanSource(parse(nodes).nodes);
        } else if (!Array.isArray(nodes)) {
            if (nodes.type === 'root') {
                nodes = nodes.nodes;
            } else if (nodes.type) {
                nodes = [nodes];
            } else if (nodes.prop) {
                if (typeof nodes.value === 'undefined') {
                    throw new Error('Value field is missed in node creation');
                } else if (typeof nodes.value !== 'string') {
                    nodes.value = String(nodes.value);
                }
                nodes = [new _declaration2.default(nodes)];
            } else if (nodes.selector) {
                var Rule = require('./rule');
                nodes = [new Rule(nodes)];
            } else if (nodes.name) {
                var AtRule = require('./at-rule');
                nodes = [new AtRule(nodes)];
            } else if (nodes.text) {
                nodes = [new _comment2.default(nodes)];
            } else {
                throw new Error('Unknown node type in node creation');
            }
        }

        var processed = nodes.map(function (i) {
            if (typeof i.raws === 'undefined') i = _this2.rebuild(i);

            if (i.parent) i = i.clone();
            if (typeof i.raws.before === 'undefined') {
                if (sample && typeof sample.raws.before !== 'undefined') {
                    i.raws.before = sample.raws.before.replace(/[^\s]/g, '');
                }
            }
            i.parent = _this2;
            return i;
        });

        return processed;
    };

    Container.prototype.rebuild = function rebuild(node, parent) {
        var _this3 = this;

        var fix = void 0;
        if (node.type === 'root') {
            var Root = require('./root');
            fix = new Root();
        } else if (node.type === 'atrule') {
            var AtRule = require('./at-rule');
            fix = new AtRule();
        } else if (node.type === 'rule') {
            var Rule = require('./rule');
            fix = new Rule();
        } else if (node.type === 'decl') {
            fix = new _declaration2.default();
        } else if (node.type === 'comment') {
            fix = new _comment2.default();
        }

        for (var i in node) {
            if (i === 'nodes') {
                fix.nodes = node.nodes.map(function (j) {
                    return _this3.rebuild(j, fix);
                });
            } else if (i === 'parent' && parent) {
                fix.parent = parent;
            } else if (node.hasOwnProperty(i)) {
                fix[i] = node[i];
            }
        }

        return fix;
    };

    Container.prototype.eachInside = function eachInside(callback) {
        (0, _warnOnce2.default)('Container#eachInside is deprecated. ' + 'Use Container#walk instead.');
        return this.walk(callback);
    };

    Container.prototype.eachDecl = function eachDecl(prop, callback) {
        (0, _warnOnce2.default)('Container#eachDecl is deprecated. ' + 'Use Container#walkDecls instead.');
        return this.walkDecls(prop, callback);
    };

    Container.prototype.eachRule = function eachRule(selector, callback) {
        (0, _warnOnce2.default)('Container#eachRule is deprecated. ' + 'Use Container#walkRules instead.');
        return this.walkRules(selector, callback);
    };

    Container.prototype.eachAtRule = function eachAtRule(name, callback) {
        (0, _warnOnce2.default)('Container#eachAtRule is deprecated. ' + 'Use Container#walkAtRules instead.');
        return this.walkAtRules(name, callback);
    };

    Container.prototype.eachComment = function eachComment(callback) {
        (0, _warnOnce2.default)('Container#eachComment is deprecated. ' + 'Use Container#walkComments instead.');
        return this.walkComments(callback);
    };

    _createClass(Container, [{
        key: 'first',
        get: function get() {
            if (!this.nodes) return undefined;
            return this.nodes[0];
        }

        /**
         * The container’s last child.
         *
         * @type {Node}
         *
         * @example
         * rule.last == rule.nodes[rule.nodes.length - 1];
         */

    }, {
        key: 'last',
        get: function get() {
            if (!this.nodes) return undefined;
            return this.nodes[this.nodes.length - 1];
        }
    }, {
        key: 'semicolon',
        get: function get() {
            (0, _warnOnce2.default)('Node#semicolon is deprecated. Use Node#raws.semicolon');
            return this.raws.semicolon;
        },
        set: function set(val) {
            (0, _warnOnce2.default)('Node#semicolon is deprecated. Use Node#raws.semicolon');
            this.raws.semicolon = val;
        }
    }, {
        key: 'after',
        get: function get() {
            (0, _warnOnce2.default)('Node#after is deprecated. Use Node#raws.after');
            return this.raws.after;
        },
        set: function set(val) {
            (0, _warnOnce2.default)('Node#after is deprecated. Use Node#raws.after');
            this.raws.after = val;
        }

        /**
         * @memberof Container#
         * @member {Node[]} nodes - an array containing the container’s children
         *
         * @example
         * const root = postcss.parse('a { color: black }');
         * root.nodes.length           //=> 1
         * root.nodes[0].selector      //=> 'a'
         * root.nodes[0].nodes[0].prop //=> 'color'
         */

    }]);

    return Container;
}(_node2.default);

exports.default = Container;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRhaW5lci5lczYiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUVBLFNBQVMsV0FBVCxDQUFxQixLQUFyQixFQUE0QjtBQUN4QixXQUFPLE1BQU0sR0FBTixDQUFXLGFBQUs7QUFDbkIsWUFBSyxFQUFFLEtBQVAsRUFBZSxFQUFFLEtBQUYsR0FBVSxZQUFZLEVBQUUsS0FBZCxDQUFWO0FBQ2YsZUFBTyxFQUFFLE1BQVQ7QUFDQSxlQUFPLENBQVA7QUFDSCxLQUpNLENBQVA7QUFLSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUE0QkssUzs7Ozs7Ozs7O3dCQUVGLEksaUJBQUssSyxFQUFPO0FBQ1IsY0FBTSxNQUFOLEdBQWUsSUFBZjtBQUNBLGFBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsS0FBaEI7QUFDQSxlQUFPLElBQVA7QUFDSCxLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQW1DRCxJLGlCQUFLLFEsRUFBVTtBQUNYLFlBQUssQ0FBQyxLQUFLLFFBQVgsRUFBc0IsS0FBSyxRQUFMLEdBQWdCLENBQWhCO0FBQ3RCLFlBQUssQ0FBQyxLQUFLLE9BQVgsRUFBcUIsS0FBSyxPQUFMLEdBQWUsRUFBZjs7QUFFckIsYUFBSyxRQUFMLElBQWlCLENBQWpCO0FBQ0EsWUFBSSxLQUFLLEtBQUssUUFBZDtBQUNBLGFBQUssT0FBTCxDQUFhLEVBQWIsSUFBbUIsQ0FBbkI7O0FBRUEsWUFBSyxDQUFDLEtBQUssS0FBWCxFQUFtQixPQUFPLFNBQVA7O0FBRW5CLFlBQUksY0FBSjtBQUFBLFlBQVcsZUFBWDtBQUNBLGVBQVEsS0FBSyxPQUFMLENBQWEsRUFBYixJQUFtQixLQUFLLEtBQUwsQ0FBVyxNQUF0QyxFQUErQztBQUMzQyxvQkFBUyxLQUFLLE9BQUwsQ0FBYSxFQUFiLENBQVQ7QUFDQSxxQkFBUyxTQUFTLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBVCxFQUE0QixLQUE1QixDQUFUO0FBQ0EsZ0JBQUssV0FBVyxLQUFoQixFQUF3Qjs7QUFFeEIsaUJBQUssT0FBTCxDQUFhLEVBQWIsS0FBb0IsQ0FBcEI7QUFDSDs7QUFFRCxlQUFPLEtBQUssT0FBTCxDQUFhLEVBQWIsQ0FBUDs7QUFFQSxlQUFPLE1BQVA7QUFDSCxLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFxQkQsSSxpQkFBSyxRLEVBQVU7QUFDWCxlQUFPLEtBQUssSUFBTCxDQUFXLFVBQUMsS0FBRCxFQUFRLENBQVIsRUFBYztBQUM1QixnQkFBSSxTQUFTLFNBQVMsS0FBVCxFQUFnQixDQUFoQixDQUFiO0FBQ0EsZ0JBQUssV0FBVyxLQUFYLElBQW9CLE1BQU0sSUFBL0IsRUFBc0M7QUFDbEMseUJBQVMsTUFBTSxJQUFOLENBQVcsUUFBWCxDQUFUO0FBQ0g7QUFDRCxtQkFBTyxNQUFQO0FBQ0gsU0FOTSxDQUFQO0FBT0gsSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQStCRCxTLHNCQUFVLEksRUFBTSxRLEVBQVU7QUFDdEIsWUFBSyxDQUFDLFFBQU4sRUFBaUI7QUFDYix1QkFBVyxJQUFYO0FBQ0EsbUJBQU8sS0FBSyxJQUFMLENBQVcsVUFBQyxLQUFELEVBQVEsQ0FBUixFQUFjO0FBQzVCLG9CQUFLLE1BQU0sSUFBTixLQUFlLE1BQXBCLEVBQTZCO0FBQ3pCLDJCQUFPLFNBQVMsS0FBVCxFQUFnQixDQUFoQixDQUFQO0FBQ0g7QUFDSixhQUpNLENBQVA7QUFLSCxTQVBELE1BT08sSUFBSyxnQkFBZ0IsTUFBckIsRUFBOEI7QUFDakMsbUJBQU8sS0FBSyxJQUFMLENBQVcsVUFBQyxLQUFELEVBQVEsQ0FBUixFQUFjO0FBQzVCLG9CQUFLLE1BQU0sSUFBTixLQUFlLE1BQWYsSUFBeUIsS0FBSyxJQUFMLENBQVUsTUFBTSxJQUFoQixDQUE5QixFQUFzRDtBQUNsRCwyQkFBTyxTQUFTLEtBQVQsRUFBZ0IsQ0FBaEIsQ0FBUDtBQUNIO0FBQ0osYUFKTSxDQUFQO0FBS0gsU0FOTSxNQU1BO0FBQ0gsbUJBQU8sS0FBSyxJQUFMLENBQVcsVUFBQyxLQUFELEVBQVEsQ0FBUixFQUFjO0FBQzVCLG9CQUFLLE1BQU0sSUFBTixLQUFlLE1BQWYsSUFBeUIsTUFBTSxJQUFOLEtBQWUsSUFBN0MsRUFBb0Q7QUFDaEQsMkJBQU8sU0FBUyxLQUFULEVBQWdCLENBQWhCLENBQVA7QUFDSDtBQUNKLGFBSk0sQ0FBUDtBQUtIO0FBQ0osSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQXlCRCxTLHNCQUFVLFEsRUFBVSxRLEVBQVU7QUFDMUIsWUFBSyxDQUFDLFFBQU4sRUFBaUI7QUFDYix1QkFBVyxRQUFYOztBQUVBLG1CQUFPLEtBQUssSUFBTCxDQUFXLFVBQUMsS0FBRCxFQUFRLENBQVIsRUFBYztBQUM1QixvQkFBSyxNQUFNLElBQU4sS0FBZSxNQUFwQixFQUE2QjtBQUN6QiwyQkFBTyxTQUFTLEtBQVQsRUFBZ0IsQ0FBaEIsQ0FBUDtBQUNIO0FBQ0osYUFKTSxDQUFQO0FBS0gsU0FSRCxNQVFPLElBQUssb0JBQW9CLE1BQXpCLEVBQWtDO0FBQ3JDLG1CQUFPLEtBQUssSUFBTCxDQUFXLFVBQUMsS0FBRCxFQUFRLENBQVIsRUFBYztBQUM1QixvQkFBSyxNQUFNLElBQU4sS0FBZSxNQUFmLElBQXlCLFNBQVMsSUFBVCxDQUFjLE1BQU0sUUFBcEIsQ0FBOUIsRUFBOEQ7QUFDMUQsMkJBQU8sU0FBUyxLQUFULEVBQWdCLENBQWhCLENBQVA7QUFDSDtBQUNKLGFBSk0sQ0FBUDtBQUtILFNBTk0sTUFNQTtBQUNILG1CQUFPLEtBQUssSUFBTCxDQUFXLFVBQUMsS0FBRCxFQUFRLENBQVIsRUFBYztBQUM1QixvQkFBSyxNQUFNLElBQU4sS0FBZSxNQUFmLElBQXlCLE1BQU0sUUFBTixLQUFtQixRQUFqRCxFQUE0RDtBQUN4RCwyQkFBTyxTQUFTLEtBQVQsRUFBZ0IsQ0FBaEIsQ0FBUDtBQUNIO0FBQ0osYUFKTSxDQUFQO0FBS0g7QUFDSixLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQWdDRCxXLHdCQUFZLEksRUFBTSxRLEVBQVU7QUFDeEIsWUFBSyxDQUFDLFFBQU4sRUFBaUI7QUFDYix1QkFBVyxJQUFYO0FBQ0EsbUJBQU8sS0FBSyxJQUFMLENBQVcsVUFBQyxLQUFELEVBQVEsQ0FBUixFQUFjO0FBQzVCLG9CQUFLLE1BQU0sSUFBTixLQUFlLFFBQXBCLEVBQStCO0FBQzNCLDJCQUFPLFNBQVMsS0FBVCxFQUFnQixDQUFoQixDQUFQO0FBQ0g7QUFDSixhQUpNLENBQVA7QUFLSCxTQVBELE1BT08sSUFBSyxnQkFBZ0IsTUFBckIsRUFBOEI7QUFDakMsbUJBQU8sS0FBSyxJQUFMLENBQVcsVUFBQyxLQUFELEVBQVEsQ0FBUixFQUFjO0FBQzVCLG9CQUFLLE1BQU0sSUFBTixLQUFlLFFBQWYsSUFBMkIsS0FBSyxJQUFMLENBQVUsTUFBTSxJQUFoQixDQUFoQyxFQUF3RDtBQUNwRCwyQkFBTyxTQUFTLEtBQVQsRUFBZ0IsQ0FBaEIsQ0FBUDtBQUNIO0FBQ0osYUFKTSxDQUFQO0FBS0gsU0FOTSxNQU1BO0FBQ0gsbUJBQU8sS0FBSyxJQUFMLENBQVcsVUFBQyxLQUFELEVBQVEsQ0FBUixFQUFjO0FBQzVCLG9CQUFLLE1BQU0sSUFBTixLQUFlLFFBQWYsSUFBMkIsTUFBTSxJQUFOLEtBQWUsSUFBL0MsRUFBc0Q7QUFDbEQsMkJBQU8sU0FBUyxLQUFULEVBQWdCLENBQWhCLENBQVA7QUFDSDtBQUNKLGFBSk0sQ0FBUDtBQUtIO0FBQ0osSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBa0JELFkseUJBQWEsUSxFQUFVO0FBQ25CLGVBQU8sS0FBSyxJQUFMLENBQVcsVUFBQyxLQUFELEVBQVEsQ0FBUixFQUFjO0FBQzVCLGdCQUFLLE1BQU0sSUFBTixLQUFlLFNBQXBCLEVBQWdDO0FBQzVCLHVCQUFPLFNBQVMsS0FBVCxFQUFnQixDQUFoQixDQUFQO0FBQ0g7QUFDSixTQUpNLENBQVA7QUFLSCxLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBc0JELE0scUJBQW9CO0FBQUEsMENBQVYsUUFBVTtBQUFWLG9CQUFVO0FBQUE7O0FBQ2hCLDZCQUFtQixRQUFuQixrSEFBOEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLGdCQUFwQixLQUFvQjs7QUFDMUIsZ0JBQUksUUFBUSxLQUFLLFNBQUwsQ0FBZSxLQUFmLEVBQXNCLEtBQUssSUFBM0IsQ0FBWjtBQUNBLGtDQUFrQixLQUFsQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsb0JBQVUsSUFBVjtBQUEwQixxQkFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixJQUFoQjtBQUExQjtBQUNIO0FBQ0QsZUFBTyxJQUFQO0FBQ0gsSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQXNCRCxPLHNCQUFxQjtBQUFBLDJDQUFWLFFBQVU7QUFBVixvQkFBVTtBQUFBOztBQUNqQixtQkFBVyxTQUFTLE9BQVQsRUFBWDtBQUNBLDhCQUFtQixRQUFuQix5SEFBOEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLGdCQUFwQixLQUFvQjs7QUFDMUIsZ0JBQUksUUFBUSxLQUFLLFNBQUwsQ0FBZSxLQUFmLEVBQXNCLEtBQUssS0FBM0IsRUFBa0MsU0FBbEMsRUFBNkMsT0FBN0MsRUFBWjtBQUNBLGtDQUFrQixLQUFsQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsb0JBQVUsSUFBVjtBQUEwQixxQkFBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixJQUFuQjtBQUExQixhQUNBLEtBQU0sSUFBSSxFQUFWLElBQWdCLEtBQUssT0FBckIsRUFBK0I7QUFDM0IscUJBQUssT0FBTCxDQUFhLEVBQWIsSUFBbUIsS0FBSyxPQUFMLENBQWEsRUFBYixJQUFtQixNQUFNLE1BQTVDO0FBQ0g7QUFDSjtBQUNELGVBQU8sSUFBUDtBQUNILEs7O3dCQUVELFMsc0JBQVUsVyxFQUFhO0FBQ25CLHdCQUFNLFNBQU4sWUFBZ0IsV0FBaEI7QUFDQSxZQUFLLEtBQUssS0FBVixFQUFrQjtBQUNkLGtDQUFrQixLQUFLLEtBQXZCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxvQkFBVSxJQUFWO0FBQStCLHFCQUFLLFNBQUwsQ0FBZSxXQUFmO0FBQS9CO0FBQ0g7QUFDSixLOzs7Ozs7Ozs7Ozs7Ozs7d0JBYUQsWSx5QkFBYSxLLEVBQU8sRyxFQUFLO0FBQ3JCLGdCQUFRLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBUjs7QUFFQSxZQUFJLE9BQVEsVUFBVSxDQUFWLEdBQWMsU0FBZCxHQUEwQixLQUF0QztBQUNBLFlBQUksUUFBUSxLQUFLLFNBQUwsQ0FBZSxHQUFmLEVBQW9CLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBcEIsRUFBdUMsSUFBdkMsRUFBNkMsT0FBN0MsRUFBWjtBQUNBLDhCQUFrQixLQUFsQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsZ0JBQVUsSUFBVjtBQUEwQixpQkFBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixLQUFsQixFQUF5QixDQUF6QixFQUE0QixJQUE1QjtBQUExQixTQUVBLElBQUksY0FBSjtBQUNBLGFBQU0sSUFBSSxFQUFWLElBQWdCLEtBQUssT0FBckIsRUFBK0I7QUFDM0Isb0JBQVEsS0FBSyxPQUFMLENBQWEsRUFBYixDQUFSO0FBQ0EsZ0JBQUssU0FBUyxLQUFkLEVBQXNCO0FBQ2xCLHFCQUFLLE9BQUwsQ0FBYSxFQUFiLElBQW1CLFFBQVEsTUFBTSxNQUFqQztBQUNIO0FBQ0o7O0FBRUQsZUFBTyxJQUFQO0FBQ0gsSzs7Ozs7Ozs7Ozs7O3dCQVVELFcsd0JBQVksSyxFQUFPLEcsRUFBSztBQUNwQixnQkFBUSxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQVI7O0FBRUEsWUFBSSxRQUFRLEtBQUssU0FBTCxDQUFlLEdBQWYsRUFBb0IsS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFwQixFQUF1QyxPQUF2QyxFQUFaO0FBQ0EsOEJBQWtCLEtBQWxCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxnQkFBVSxJQUFWO0FBQTBCLGlCQUFLLEtBQUwsQ0FBVyxNQUFYLENBQWtCLFFBQVEsQ0FBMUIsRUFBNkIsQ0FBN0IsRUFBZ0MsSUFBaEM7QUFBMUIsU0FFQSxJQUFJLGNBQUo7QUFDQSxhQUFNLElBQUksRUFBVixJQUFnQixLQUFLLE9BQXJCLEVBQStCO0FBQzNCLG9CQUFRLEtBQUssT0FBTCxDQUFhLEVBQWIsQ0FBUjtBQUNBLGdCQUFLLFFBQVEsS0FBYixFQUFxQjtBQUNqQixxQkFBSyxPQUFMLENBQWEsRUFBYixJQUFtQixRQUFRLE1BQU0sTUFBakM7QUFDSDtBQUNKOztBQUVELGVBQU8sSUFBUDtBQUNILEs7O3dCQUVELE0sbUJBQU8sSyxFQUFPO0FBQ1YsWUFBSyxPQUFPLEtBQVAsS0FBaUIsV0FBdEIsRUFBb0M7QUFDaEMsb0NBQVMscUNBQ0EsMkJBRFQ7QUFFQSxpQkFBSyxXQUFMLENBQWlCLEtBQWpCO0FBQ0gsU0FKRCxNQUlPO0FBQ0gsNEJBQU0sTUFBTjtBQUNIO0FBQ0QsZUFBTyxJQUFQO0FBQ0gsSzs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQWdCRCxXLHdCQUFZLEssRUFBTztBQUNmLGdCQUFRLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBUjtBQUNBLGFBQUssS0FBTCxDQUFXLEtBQVgsRUFBa0IsTUFBbEIsR0FBMkIsU0FBM0I7QUFDQSxhQUFLLEtBQUwsQ0FBVyxNQUFYLENBQWtCLEtBQWxCLEVBQXlCLENBQXpCOztBQUVBLFlBQUksY0FBSjtBQUNBLGFBQU0sSUFBSSxFQUFWLElBQWdCLEtBQUssT0FBckIsRUFBK0I7QUFDM0Isb0JBQVEsS0FBSyxPQUFMLENBQWEsRUFBYixDQUFSO0FBQ0EsZ0JBQUssU0FBUyxLQUFkLEVBQXNCO0FBQ2xCLHFCQUFLLE9BQUwsQ0FBYSxFQUFiLElBQW1CLFFBQVEsQ0FBM0I7QUFDSDtBQUNKOztBQUVELGVBQU8sSUFBUDtBQUNILEs7Ozs7Ozs7Ozs7Ozs7O3dCQVlELFMsd0JBQVk7QUFDUiw4QkFBa0IsS0FBSyxLQUF2QjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsZ0JBQVUsSUFBVjtBQUErQixpQkFBSyxNQUFMLEdBQWMsU0FBZDtBQUEvQixTQUNBLEtBQUssS0FBTCxHQUFhLEVBQWI7QUFDQSxlQUFPLElBQVA7QUFDSCxLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkE4QkQsYSwwQkFBYyxPLEVBQVMsSSxFQUFNLFEsRUFBVTtBQUNuQyxZQUFLLENBQUMsUUFBTixFQUFpQjtBQUNiLHVCQUFXLElBQVg7QUFDQSxtQkFBTyxFQUFQO0FBQ0g7O0FBRUQsYUFBSyxTQUFMLENBQWdCLGdCQUFRO0FBQ3BCLGdCQUFLLEtBQUssS0FBTCxJQUFjLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsS0FBSyxJQUF4QixNQUFrQyxDQUFDLENBQXRELEVBQTBEO0FBQzFELGdCQUFLLEtBQUssSUFBTCxJQUFjLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsS0FBSyxJQUF4QixNQUFrQyxDQUFDLENBQXRELEVBQTBEOztBQUUxRCxpQkFBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixPQUFuQixFQUE0QixRQUE1QixDQUFiO0FBQ0gsU0FMRDs7QUFPQSxlQUFPLElBQVA7QUFDSCxLOzs7Ozs7Ozs7Ozs7Ozs7d0JBYUQsSyxrQkFBTSxTLEVBQVc7QUFDYixlQUFPLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsU0FBakIsQ0FBUDtBQUNILEs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFhRCxJLGlCQUFLLFMsRUFBVztBQUNaLGVBQU8sS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixTQUFoQixDQUFQO0FBQ0gsSzs7Ozs7Ozs7Ozs7Ozs7d0JBWUQsSyxrQkFBTSxLLEVBQU87QUFDVCxZQUFLLE9BQU8sS0FBUCxLQUFpQixRQUF0QixFQUFpQztBQUM3QixtQkFBTyxLQUFQO0FBQ0gsU0FGRCxNQUVPO0FBQ0gsbUJBQU8sS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFuQixDQUFQO0FBQ0g7QUFDSixLOzs7Ozs7Ozs7Ozs7d0JBNEJELFMsc0JBQVUsSyxFQUFPLE0sRUFBUTtBQUFBOztBQUNyQixZQUFLLE9BQU8sS0FBUCxLQUFpQixRQUF0QixFQUFpQztBQUM3QixnQkFBSSxRQUFRLFFBQVEsU0FBUixDQUFaO0FBQ0Esb0JBQVEsWUFBWSxNQUFNLEtBQU4sRUFBYSxLQUF6QixDQUFSO0FBQ0gsU0FIRCxNQUdPLElBQUssQ0FBQyxNQUFNLE9BQU4sQ0FBYyxLQUFkLENBQU4sRUFBNkI7QUFDaEMsZ0JBQUssTUFBTSxJQUFOLEtBQWUsTUFBcEIsRUFBNkI7QUFDekIsd0JBQVEsTUFBTSxLQUFkO0FBQ0gsYUFGRCxNQUVPLElBQUssTUFBTSxJQUFYLEVBQWtCO0FBQ3JCLHdCQUFRLENBQUMsS0FBRCxDQUFSO0FBQ0gsYUFGTSxNQUVBLElBQUssTUFBTSxJQUFYLEVBQWtCO0FBQ3JCLG9CQUFLLE9BQU8sTUFBTSxLQUFiLEtBQXVCLFdBQTVCLEVBQTBDO0FBQ3RDLDBCQUFNLElBQUksS0FBSixDQUFVLHdDQUFWLENBQU47QUFDSCxpQkFGRCxNQUVPLElBQUssT0FBTyxNQUFNLEtBQWIsS0FBdUIsUUFBNUIsRUFBdUM7QUFDMUMsMEJBQU0sS0FBTixHQUFjLE9BQU8sTUFBTSxLQUFiLENBQWQ7QUFDSDtBQUNELHdCQUFRLENBQUMsMEJBQWdCLEtBQWhCLENBQUQsQ0FBUjtBQUNILGFBUE0sTUFPQSxJQUFLLE1BQU0sUUFBWCxFQUFzQjtBQUN6QixvQkFBSSxPQUFPLFFBQVEsUUFBUixDQUFYO0FBQ0Esd0JBQVEsQ0FBQyxJQUFJLElBQUosQ0FBUyxLQUFULENBQUQsQ0FBUjtBQUNILGFBSE0sTUFHQSxJQUFLLE1BQU0sSUFBWCxFQUFrQjtBQUNyQixvQkFBSSxTQUFTLFFBQVEsV0FBUixDQUFiO0FBQ0Esd0JBQVEsQ0FBQyxJQUFJLE1BQUosQ0FBVyxLQUFYLENBQUQsQ0FBUjtBQUNILGFBSE0sTUFHQSxJQUFLLE1BQU0sSUFBWCxFQUFrQjtBQUNyQix3QkFBUSxDQUFDLHNCQUFZLEtBQVosQ0FBRCxDQUFSO0FBQ0gsYUFGTSxNQUVBO0FBQ0gsc0JBQU0sSUFBSSxLQUFKLENBQVUsb0NBQVYsQ0FBTjtBQUNIO0FBQ0o7O0FBRUQsWUFBSSxZQUFZLE1BQU0sR0FBTixDQUFXLGFBQUs7QUFDNUIsZ0JBQUssT0FBTyxFQUFFLElBQVQsS0FBa0IsV0FBdkIsRUFBcUMsSUFBSSxPQUFLLE9BQUwsQ0FBYSxDQUFiLENBQUo7O0FBRXJDLGdCQUFLLEVBQUUsTUFBUCxFQUFnQixJQUFJLEVBQUUsS0FBRixFQUFKO0FBQ2hCLGdCQUFLLE9BQU8sRUFBRSxJQUFGLENBQU8sTUFBZCxLQUF5QixXQUE5QixFQUE0QztBQUN4QyxvQkFBSyxVQUFVLE9BQU8sT0FBTyxJQUFQLENBQVksTUFBbkIsS0FBOEIsV0FBN0MsRUFBMkQ7QUFDdkQsc0JBQUUsSUFBRixDQUFPLE1BQVAsR0FBZ0IsT0FBTyxJQUFQLENBQVksTUFBWixDQUFtQixPQUFuQixDQUEyQixRQUEzQixFQUFxQyxFQUFyQyxDQUFoQjtBQUNIO0FBQ0o7QUFDRCxjQUFFLE1BQUY7QUFDQSxtQkFBTyxDQUFQO0FBQ0gsU0FYZSxDQUFoQjs7QUFhQSxlQUFPLFNBQVA7QUFDSCxLOzt3QkFFRCxPLG9CQUFRLEksRUFBTSxNLEVBQVE7QUFBQTs7QUFDbEIsWUFBSSxZQUFKO0FBQ0EsWUFBSyxLQUFLLElBQUwsS0FBYyxNQUFuQixFQUE0QjtBQUN4QixnQkFBSSxPQUFPLFFBQVEsUUFBUixDQUFYO0FBQ0Esa0JBQU0sSUFBSSxJQUFKLEVBQU47QUFDSCxTQUhELE1BR08sSUFBSyxLQUFLLElBQUwsS0FBYyxRQUFuQixFQUE4QjtBQUNqQyxnQkFBSSxTQUFTLFFBQVEsV0FBUixDQUFiO0FBQ0Esa0JBQU0sSUFBSSxNQUFKLEVBQU47QUFDSCxTQUhNLE1BR0EsSUFBSyxLQUFLLElBQUwsS0FBYyxNQUFuQixFQUE0QjtBQUMvQixnQkFBSSxPQUFPLFFBQVEsUUFBUixDQUFYO0FBQ0Esa0JBQU0sSUFBSSxJQUFKLEVBQU47QUFDSCxTQUhNLE1BR0EsSUFBSyxLQUFLLElBQUwsS0FBYyxNQUFuQixFQUE0QjtBQUMvQixrQkFBTSwyQkFBTjtBQUNILFNBRk0sTUFFQSxJQUFLLEtBQUssSUFBTCxLQUFjLFNBQW5CLEVBQStCO0FBQ2xDLGtCQUFNLHVCQUFOO0FBQ0g7O0FBRUQsYUFBTSxJQUFJLENBQVYsSUFBZSxJQUFmLEVBQXNCO0FBQ2xCLGdCQUFLLE1BQU0sT0FBWCxFQUFxQjtBQUNqQixvQkFBSSxLQUFKLEdBQVksS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFnQjtBQUFBLDJCQUFLLE9BQUssT0FBTCxDQUFhLENBQWIsRUFBZ0IsR0FBaEIsQ0FBTDtBQUFBLGlCQUFoQixDQUFaO0FBQ0gsYUFGRCxNQUVPLElBQUssTUFBTSxRQUFOLElBQWtCLE1BQXZCLEVBQWdDO0FBQ25DLG9CQUFJLE1BQUosR0FBYSxNQUFiO0FBQ0gsYUFGTSxNQUVBLElBQUssS0FBSyxjQUFMLENBQW9CLENBQXBCLENBQUwsRUFBOEI7QUFDakMsb0JBQUksQ0FBSixJQUFTLEtBQUssQ0FBTCxDQUFUO0FBQ0g7QUFDSjs7QUFFRCxlQUFPLEdBQVA7QUFDSCxLOzt3QkFFRCxVLHVCQUFXLFEsRUFBVTtBQUNqQixnQ0FBUyx5Q0FDQSw2QkFEVDtBQUVBLGVBQU8sS0FBSyxJQUFMLENBQVUsUUFBVixDQUFQO0FBQ0gsSzs7d0JBRUQsUSxxQkFBUyxJLEVBQU0sUSxFQUFVO0FBQ3JCLGdDQUFTLHVDQUNBLGtDQURUO0FBRUEsZUFBTyxLQUFLLFNBQUwsQ0FBZSxJQUFmLEVBQXFCLFFBQXJCLENBQVA7QUFDSCxLOzt3QkFFRCxRLHFCQUFTLFEsRUFBVSxRLEVBQVU7QUFDekIsZ0NBQVMsdUNBQ0Esa0NBRFQ7QUFFQSxlQUFPLEtBQUssU0FBTCxDQUFlLFFBQWYsRUFBeUIsUUFBekIsQ0FBUDtBQUNILEs7O3dCQUVELFUsdUJBQVcsSSxFQUFNLFEsRUFBVTtBQUN2QixnQ0FBUyx5Q0FDQSxvQ0FEVDtBQUVBLGVBQU8sS0FBSyxXQUFMLENBQWlCLElBQWpCLEVBQXVCLFFBQXZCLENBQVA7QUFDSCxLOzt3QkFFRCxXLHdCQUFZLFEsRUFBVTtBQUNsQixnQ0FBUywwQ0FDQSxxQ0FEVDtBQUVBLGVBQU8sS0FBSyxZQUFMLENBQWtCLFFBQWxCLENBQVA7QUFDSCxLOzs7OzRCQXpIVztBQUNSLGdCQUFLLENBQUMsS0FBSyxLQUFYLEVBQW1CLE9BQU8sU0FBUDtBQUNuQixtQkFBTyxLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQVA7QUFDSDs7Ozs7Ozs7Ozs7Ozs0QkFVVTtBQUNQLGdCQUFLLENBQUMsS0FBSyxLQUFYLEVBQW1CLE9BQU8sU0FBUDtBQUNuQixtQkFBTyxLQUFLLEtBQUwsQ0FBVyxLQUFLLEtBQUwsQ0FBVyxNQUFYLEdBQW9CLENBQS9CLENBQVA7QUFDSDs7OzRCQTJHZTtBQUNaLG9DQUFTLHVEQUFUO0FBQ0EsbUJBQU8sS0FBSyxJQUFMLENBQVUsU0FBakI7QUFDSCxTOzBCQUVhLEcsRUFBSztBQUNmLG9DQUFTLHVEQUFUO0FBQ0EsaUJBQUssSUFBTCxDQUFVLFNBQVYsR0FBc0IsR0FBdEI7QUFDSDs7OzRCQUVXO0FBQ1Isb0NBQVMsK0NBQVQ7QUFDQSxtQkFBTyxLQUFLLElBQUwsQ0FBVSxLQUFqQjtBQUNILFM7MEJBRVMsRyxFQUFLO0FBQ1gsb0NBQVMsK0NBQVQ7QUFDQSxpQkFBSyxJQUFMLENBQVUsS0FBVixHQUFrQixHQUFsQjtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBZVUsUyIsImZpbGUiOiJjb250YWluZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRGVjbGFyYXRpb24gZnJvbSAnLi9kZWNsYXJhdGlvbic7XG5pbXBvcnQgd2Fybk9uY2UgICAgZnJvbSAnLi93YXJuLW9uY2UnO1xuaW1wb3J0IENvbW1lbnQgICAgIGZyb20gJy4vY29tbWVudCc7XG5pbXBvcnQgTm9kZSAgICAgICAgZnJvbSAnLi9ub2RlJztcblxuZnVuY3Rpb24gY2xlYW5Tb3VyY2Uobm9kZXMpIHtcbiAgICByZXR1cm4gbm9kZXMubWFwKCBpID0+IHtcbiAgICAgICAgaWYgKCBpLm5vZGVzICkgaS5ub2RlcyA9IGNsZWFuU291cmNlKGkubm9kZXMpO1xuICAgICAgICBkZWxldGUgaS5zb3VyY2U7XG4gICAgICAgIHJldHVybiBpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIEBjYWxsYmFjayBjaGlsZENvbmRpdGlvblxuICogQHBhcmFtIHtOb2RlfSBub2RlICAgIC0gY29udGFpbmVyIGNoaWxkXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBjaGlsZCBpbmRleFxuICogQHBhcmFtIHtOb2RlW119IG5vZGVzIC0gYWxsIGNvbnRhaW5lciBjaGlsZHJlblxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuXG4gLyoqXG4gICogQGNhbGxiYWNrIGNoaWxkSXRlcmF0b3JcbiAgKiBAcGFyYW0ge05vZGV9IG5vZGUgICAgLSBjb250YWluZXIgY2hpbGRcbiAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBjaGlsZCBpbmRleFxuICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICovXG5cbi8qKlxuICogVGhlIHtAbGluayBSb290fSwge0BsaW5rIEF0UnVsZX0sIGFuZCB7QGxpbmsgUnVsZX0gY29udGFpbmVyIG5vZGVzXG4gKiBpbmhlcml0IHNvbWUgY29tbW9uIG1ldGhvZHMgdG8gaGVscCB3b3JrIHdpdGggdGhlaXIgY2hpbGRyZW4uXG4gKlxuICogTm90ZSB0aGF0IGFsbCBjb250YWluZXJzIGNhbiBzdG9yZSBhbnkgY29udGVudC4gSWYgeW91IHdyaXRlIGEgcnVsZSBpbnNpZGVcbiAqIGEgcnVsZSwgUG9zdENTUyB3aWxsIHBhcnNlIGl0LlxuICpcbiAqIEBleHRlbmRzIE5vZGVcbiAqIEBhYnN0cmFjdFxuICogQGlnbm9yZVxuICovXG5jbGFzcyBDb250YWluZXIgZXh0ZW5kcyBOb2RlIHtcblxuICAgIHB1c2goY2hpbGQpIHtcbiAgICAgICAgY2hpbGQucGFyZW50ID0gdGhpcztcbiAgICAgICAgdGhpcy5ub2Rlcy5wdXNoKGNoaWxkKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgY29udGFpbmVy4oCZcyBpbW1lZGlhdGUgY2hpbGRyZW4sXG4gICAgICogY2FsbGluZyBgY2FsbGJhY2tgIGZvciBlYWNoIGNoaWxkLlxuICAgICAqXG4gICAgICogUmV0dXJuaW5nIGBmYWxzZWAgaW4gdGhlIGNhbGxiYWNrIHdpbGwgYnJlYWsgaXRlcmF0aW9uLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2Qgb25seSBpdGVyYXRlcyB0aHJvdWdoIHRoZSBjb250YWluZXLigJlzIGltbWVkaWF0ZSBjaGlsZHJlbi5cbiAgICAgKiBJZiB5b3UgbmVlZCB0byByZWN1cnNpdmVseSBpdGVyYXRlIHRocm91Z2ggYWxsIHRoZSBjb250YWluZXLigJlzIGRlc2NlbmRhbnRcbiAgICAgKiBub2RlcywgdXNlIHtAbGluayBDb250YWluZXIjd2Fsa30uXG4gICAgICpcbiAgICAgKiBVbmxpa2UgdGhlIGZvciBge31gLWN5Y2xlIG9yIGBBcnJheSNmb3JFYWNoYCB0aGlzIGl0ZXJhdG9yIGlzIHNhZmVcbiAgICAgKiBpZiB5b3UgYXJlIG11dGF0aW5nIHRoZSBhcnJheSBvZiBjaGlsZCBub2RlcyBkdXJpbmcgaXRlcmF0aW9uLlxuICAgICAqIFBvc3RDU1Mgd2lsbCBhZGp1c3QgdGhlIGN1cnJlbnQgaW5kZXggdG8gbWF0Y2ggdGhlIG11dGF0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Y2hpbGRJdGVyYXRvcn0gY2FsbGJhY2sgLSBpdGVyYXRvciByZWNlaXZlcyBlYWNoIG5vZGUgYW5kIGluZGV4XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSByZXR1cm5zIGBmYWxzZWAgaWYgaXRlcmF0aW9uIHdhcyBicm9rZVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCByb290ID0gcG9zdGNzcy5wYXJzZSgnYSB7IGNvbG9yOiBibGFjazsgei1pbmRleDogMSB9Jyk7XG4gICAgICogY29uc3QgcnVsZSA9IHJvb3QuZmlyc3Q7XG4gICAgICpcbiAgICAgKiBmb3IgKCBsZXQgZGVjbCBvZiBydWxlLm5vZGVzICkge1xuICAgICAqICAgICBkZWNsLmNsb25lQmVmb3JlKHsgcHJvcDogJy13ZWJraXQtJyArIGRlY2wucHJvcCB9KTtcbiAgICAgKiAgICAgLy8gQ3ljbGUgd2lsbCBiZSBpbmZpbml0ZSwgYmVjYXVzZSBjbG9uZUJlZm9yZSBtb3ZlcyB0aGUgY3VycmVudCBub2RlXG4gICAgICogICAgIC8vIHRvIHRoZSBuZXh0IGluZGV4XG4gICAgICogfVxuICAgICAqXG4gICAgICogcnVsZS5lYWNoKGRlY2wgPT4ge1xuICAgICAqICAgICBkZWNsLmNsb25lQmVmb3JlKHsgcHJvcDogJy13ZWJraXQtJyArIGRlY2wucHJvcCB9KTtcbiAgICAgKiAgICAgLy8gV2lsbCBiZSBleGVjdXRlZCBvbmx5IGZvciBjb2xvciBhbmQgei1pbmRleFxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGVhY2goY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCAhdGhpcy5sYXN0RWFjaCApIHRoaXMubGFzdEVhY2ggPSAwO1xuICAgICAgICBpZiAoICF0aGlzLmluZGV4ZXMgKSB0aGlzLmluZGV4ZXMgPSB7IH07XG5cbiAgICAgICAgdGhpcy5sYXN0RWFjaCArPSAxO1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RFYWNoO1xuICAgICAgICB0aGlzLmluZGV4ZXNbaWRdID0gMDtcblxuICAgICAgICBpZiAoICF0aGlzLm5vZGVzICkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgICAgICBsZXQgaW5kZXgsIHJlc3VsdDtcbiAgICAgICAgd2hpbGUgKCB0aGlzLmluZGV4ZXNbaWRdIDwgdGhpcy5ub2Rlcy5sZW5ndGggKSB7XG4gICAgICAgICAgICBpbmRleCAgPSB0aGlzLmluZGV4ZXNbaWRdO1xuICAgICAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2sodGhpcy5ub2Rlc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIGlmICggcmVzdWx0ID09PSBmYWxzZSApIGJyZWFrO1xuXG4gICAgICAgICAgICB0aGlzLmluZGV4ZXNbaWRdICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICBkZWxldGUgdGhpcy5pbmRleGVzW2lkXTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlcyB0aGUgY29udGFpbmVy4oCZcyBkZXNjZW5kYW50IG5vZGVzLCBjYWxsaW5nIGNhbGxiYWNrXG4gICAgICogZm9yIGVhY2ggbm9kZS5cbiAgICAgKlxuICAgICAqIExpa2UgY29udGFpbmVyLmVhY2goKSwgdGhpcyBtZXRob2QgaXMgc2FmZSB0byB1c2VcbiAgICAgKiBpZiB5b3UgYXJlIG11dGF0aW5nIGFycmF5cyBkdXJpbmcgaXRlcmF0aW9uLlxuICAgICAqXG4gICAgICogSWYgeW91IG9ubHkgbmVlZCB0byBpdGVyYXRlIHRocm91Z2ggdGhlIGNvbnRhaW5lcuKAmXMgaW1tZWRpYXRlIGNoaWxkcmVuLFxuICAgICAqIHVzZSB7QGxpbmsgQ29udGFpbmVyI2VhY2h9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtjaGlsZEl0ZXJhdG9yfSBjYWxsYmFjayAtIGl0ZXJhdG9yIHJlY2VpdmVzIGVhY2ggbm9kZSBhbmQgaW5kZXhcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHJldHVybnMgYGZhbHNlYCBpZiBpdGVyYXRpb24gd2FzIGJyb2tlXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJvb3Qud2Fsayhub2RlID0+IHtcbiAgICAgKiAgIC8vIFRyYXZlcnNlcyBhbGwgZGVzY2VuZGFudCBub2Rlcy5cbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICB3YWxrKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVhY2goIChjaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGNhbGxiYWNrKGNoaWxkLCBpKTtcbiAgICAgICAgICAgIGlmICggcmVzdWx0ICE9PSBmYWxzZSAmJiBjaGlsZC53YWxrICkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGNoaWxkLndhbGsoY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2VzIHRoZSBjb250YWluZXLigJlzIGRlc2NlbmRhbnQgbm9kZXMsIGNhbGxpbmcgY2FsbGJhY2tcbiAgICAgKiBmb3IgZWFjaCBkZWNsYXJhdGlvbiBub2RlLlxuICAgICAqXG4gICAgICogSWYgeW91IHBhc3MgYSBmaWx0ZXIsIGl0ZXJhdGlvbiB3aWxsIG9ubHkgaGFwcGVuIG92ZXIgZGVjbGFyYXRpb25zXG4gICAgICogd2l0aCBtYXRjaGluZyBwcm9wZXJ0aWVzLlxuICAgICAqXG4gICAgICogTGlrZSB7QGxpbmsgQ29udGFpbmVyI2VhY2h9LCB0aGlzIG1ldGhvZCBpcyBzYWZlXG4gICAgICogdG8gdXNlIGlmIHlvdSBhcmUgbXV0YXRpbmcgYXJyYXlzIGR1cmluZyBpdGVyYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB9IFtwcm9wXSAgIC0gc3RyaW5nIG9yIHJlZ3VsYXIgZXhwcmVzc2lvblxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBmaWx0ZXIgZGVjbGFyYXRpb25zIGJ5IHByb3BlcnR5IG5hbWVcbiAgICAgKiBAcGFyYW0ge2NoaWxkSXRlcmF0b3J9IGNhbGxiYWNrIC0gaXRlcmF0b3IgcmVjZWl2ZXMgZWFjaCBub2RlIGFuZCBpbmRleFxuICAgICAqXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmV0dXJucyBgZmFsc2VgIGlmIGl0ZXJhdGlvbiB3YXMgYnJva2VcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogcm9vdC53YWxrRGVjbHMoZGVjbCA9PiB7XG4gICAgICogICBjaGVja1Byb3BlcnR5U3VwcG9ydChkZWNsLnByb3ApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogcm9vdC53YWxrRGVjbHMoJ2JvcmRlci1yYWRpdXMnLCBkZWNsID0+IHtcbiAgICAgKiAgIGRlY2wucmVtb3ZlKCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiByb290LndhbGtEZWNscygvXmJhY2tncm91bmQvLCBkZWNsID0+IHtcbiAgICAgKiAgIGRlY2wudmFsdWUgPSB0YWtlRmlyc3RDb2xvckZyb21HcmFkaWVudChkZWNsLnZhbHVlKTtcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICB3YWxrRGVjbHMocHJvcCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCAhY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IHByb3A7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53YWxrKCAoY2hpbGQsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIGNoaWxkLnR5cGUgPT09ICdkZWNsJyApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGNoaWxkLCBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICggcHJvcCBpbnN0YW5jZW9mIFJlZ0V4cCApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndhbGsoIChjaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICggY2hpbGQudHlwZSA9PT0gJ2RlY2wnICYmIHByb3AudGVzdChjaGlsZC5wcm9wKSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGNoaWxkLCBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndhbGsoIChjaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICggY2hpbGQudHlwZSA9PT0gJ2RlY2wnICYmIGNoaWxkLnByb3AgPT09IHByb3AgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhjaGlsZCwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZXMgdGhlIGNvbnRhaW5lcuKAmXMgZGVzY2VuZGFudCBub2RlcywgY2FsbGluZyBjYWxsYmFja1xuICAgICAqIGZvciBlYWNoIHJ1bGUgbm9kZS5cbiAgICAgKlxuICAgICAqIElmIHlvdSBwYXNzIGEgZmlsdGVyLCBpdGVyYXRpb24gd2lsbCBvbmx5IGhhcHBlbiBvdmVyIHJ1bGVzXG4gICAgICogd2l0aCBtYXRjaGluZyBzZWxlY3RvcnMuXG4gICAgICpcbiAgICAgKiBMaWtlIHtAbGluayBDb250YWluZXIjZWFjaH0sIHRoaXMgbWV0aG9kIGlzIHNhZmVcbiAgICAgKiB0byB1c2UgaWYgeW91IGFyZSBtdXRhdGluZyBhcnJheXMgZHVyaW5nIGl0ZXJhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gW3NlbGVjdG9yXSAtIHN0cmluZyBvciByZWd1bGFyIGV4cHJlc3Npb25cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBmaWx0ZXIgcnVsZXMgYnkgc2VsZWN0b3JcbiAgICAgKiBAcGFyYW0ge2NoaWxkSXRlcmF0b3J9IGNhbGxiYWNrICAgLSBpdGVyYXRvciByZWNlaXZlcyBlYWNoIG5vZGUgYW5kIGluZGV4XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSByZXR1cm5zIGBmYWxzZWAgaWYgaXRlcmF0aW9uIHdhcyBicm9rZVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzZWxlY3RvcnMgPSBbXTtcbiAgICAgKiByb290LndhbGtSdWxlcyhydWxlID0+IHtcbiAgICAgKiAgIHNlbGVjdG9ycy5wdXNoKHJ1bGUuc2VsZWN0b3IpO1xuICAgICAqIH0pO1xuICAgICAqIGNvbnNvbGUubG9nKGBZb3VyIENTUyB1c2VzICR7c2VsZWN0b3JzLmxlbmd0aH0gc2VsZWN0b3JzJyk7XG4gICAgICovXG4gICAgd2Fsa1J1bGVzKHNlbGVjdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoICFjYWxsYmFjayApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gc2VsZWN0b3I7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLndhbGsoIChjaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICggY2hpbGQudHlwZSA9PT0gJ3J1bGUnICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soY2hpbGQsIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKCBzZWxlY3RvciBpbnN0YW5jZW9mIFJlZ0V4cCApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndhbGsoIChjaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICggY2hpbGQudHlwZSA9PT0gJ3J1bGUnICYmIHNlbGVjdG9yLnRlc3QoY2hpbGQuc2VsZWN0b3IpICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soY2hpbGQsIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMud2FsayggKGNoaWxkLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCBjaGlsZC50eXBlID09PSAncnVsZScgJiYgY2hpbGQuc2VsZWN0b3IgPT09IHNlbGVjdG9yICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soY2hpbGQsIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJhdmVyc2VzIHRoZSBjb250YWluZXLigJlzIGRlc2NlbmRhbnQgbm9kZXMsIGNhbGxpbmcgY2FsbGJhY2tcbiAgICAgKiBmb3IgZWFjaCBhdC1ydWxlIG5vZGUuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgcGFzcyBhIGZpbHRlciwgaXRlcmF0aW9uIHdpbGwgb25seSBoYXBwZW4gb3ZlciBhdC1ydWxlc1xuICAgICAqIHRoYXQgaGF2ZSBtYXRjaGluZyBuYW1lcy5cbiAgICAgKlxuICAgICAqIExpa2Uge0BsaW5rIENvbnRhaW5lciNlYWNofSwgdGhpcyBtZXRob2QgaXMgc2FmZVxuICAgICAqIHRvIHVzZSBpZiB5b3UgYXJlIG11dGF0aW5nIGFycmF5cyBkdXJpbmcgaXRlcmF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBbbmFtZV0gICAtIHN0cmluZyBvciByZWd1bGFyIGV4cHJlc3Npb25cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gZmlsdGVyIGF0LXJ1bGVzIGJ5IG5hbWVcbiAgICAgKiBAcGFyYW0ge2NoaWxkSXRlcmF0b3J9IGNhbGxiYWNrIC0gaXRlcmF0b3IgcmVjZWl2ZXMgZWFjaCBub2RlIGFuZCBpbmRleFxuICAgICAqXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmV0dXJucyBgZmFsc2VgIGlmIGl0ZXJhdGlvbiB3YXMgYnJva2VcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogcm9vdC53YWxrQXRSdWxlcyhydWxlID0+IHtcbiAgICAgKiAgIGlmICggaXNPbGQocnVsZS5uYW1lKSApIHJ1bGUucmVtb3ZlKCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBsZXQgZmlyc3QgPSBmYWxzZTtcbiAgICAgKiByb290LndhbGtBdFJ1bGVzKCdjaGFyc2V0JywgcnVsZSA9PiB7XG4gICAgICogICBpZiAoICFmaXJzdCApIHtcbiAgICAgKiAgICAgZmlyc3QgPSB0cnVlO1xuICAgICAqICAgfSBlbHNlIHtcbiAgICAgKiAgICAgcnVsZS5yZW1vdmUoKTtcbiAgICAgKiAgIH1cbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICB3YWxrQXRSdWxlcyhuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoICFjYWxsYmFjayApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gbmFtZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndhbGsoIChjaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICggY2hpbGQudHlwZSA9PT0gJ2F0cnVsZScgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhjaGlsZCwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIG5hbWUgaW5zdGFuY2VvZiBSZWdFeHAgKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53YWxrKCAoY2hpbGQsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIGNoaWxkLnR5cGUgPT09ICdhdHJ1bGUnICYmIG5hbWUudGVzdChjaGlsZC5uYW1lKSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGNoaWxkLCBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndhbGsoIChjaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICggY2hpbGQudHlwZSA9PT0gJ2F0cnVsZScgJiYgY2hpbGQubmFtZSA9PT0gbmFtZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGNoaWxkLCBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRyYXZlcnNlcyB0aGUgY29udGFpbmVy4oCZcyBkZXNjZW5kYW50IG5vZGVzLCBjYWxsaW5nIGNhbGxiYWNrXG4gICAgICogZm9yIGVhY2ggY29tbWVudCBub2RlLlxuICAgICAqXG4gICAgICogTGlrZSB7QGxpbmsgQ29udGFpbmVyI2VhY2h9LCB0aGlzIG1ldGhvZCBpcyBzYWZlXG4gICAgICogdG8gdXNlIGlmIHlvdSBhcmUgbXV0YXRpbmcgYXJyYXlzIGR1cmluZyBpdGVyYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2NoaWxkSXRlcmF0b3J9IGNhbGxiYWNrIC0gaXRlcmF0b3IgcmVjZWl2ZXMgZWFjaCBub2RlIGFuZCBpbmRleFxuICAgICAqXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmV0dXJucyBgZmFsc2VgIGlmIGl0ZXJhdGlvbiB3YXMgYnJva2VcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogcm9vdC53YWxrQ29tbWVudHMoY29tbWVudCA9PiB7XG4gICAgICogICBjb21tZW50LnJlbW92ZSgpO1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHdhbGtDb21tZW50cyhjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gdGhpcy53YWxrKCAoY2hpbGQsIGkpID0+IHtcbiAgICAgICAgICAgIGlmICggY2hpbGQudHlwZSA9PT0gJ2NvbW1lbnQnICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhjaGlsZCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluc2VydHMgbmV3IG5vZGVzIHRvIHRoZSBzdGFydCBvZiB0aGUgY29udGFpbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHsuLi4oTm9kZXxvYmplY3R8c3RyaW5nfE5vZGVbXSl9IGNoaWxkcmVuIC0gbmV3IG5vZGVzXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOb2RlfSB0aGlzIG5vZGUgZm9yIG1ldGhvZHMgY2hhaW5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3QgZGVjbDEgPSBwb3N0Y3NzLmRlY2woeyBwcm9wOiAnY29sb3InLCB2YWx1ZTogJ2JsYWNrJyB9KTtcbiAgICAgKiBjb25zdCBkZWNsMiA9IHBvc3Rjc3MuZGVjbCh7IHByb3A6ICdiYWNrZ3JvdW5kLWNvbG9yJywgdmFsdWU6ICd3aGl0ZScgfSk7XG4gICAgICogcnVsZS5hcHBlbmQoZGVjbDEsIGRlY2wyKTtcbiAgICAgKlxuICAgICAqIHJvb3QuYXBwZW5kKHsgbmFtZTogJ2NoYXJzZXQnLCBwYXJhbXM6ICdcIlVURi04XCInIH0pOyAgLy8gYXQtcnVsZVxuICAgICAqIHJvb3QuYXBwZW5kKHsgc2VsZWN0b3I6ICdhJyB9KTsgICAgICAgICAgICAgICAgICAgICAgIC8vIHJ1bGVcbiAgICAgKiBydWxlLmFwcGVuZCh7IHByb3A6ICdjb2xvcicsIHZhbHVlOiAnYmxhY2snIH0pOyAgICAgICAvLyBkZWNsYXJhdGlvblxuICAgICAqIHJ1bGUuYXBwZW5kKHsgdGV4dDogJ0NvbW1lbnQnIH0pICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbW1lbnRcbiAgICAgKlxuICAgICAqIHJvb3QuYXBwZW5kKCdhIHt9Jyk7XG4gICAgICogcm9vdC5maXJzdC5hcHBlbmQoJ2NvbG9yOiBibGFjazsgei1pbmRleDogMScpO1xuICAgICAqL1xuICAgIGFwcGVuZCguLi5jaGlsZHJlbikge1xuICAgICAgICBmb3IgKCBsZXQgY2hpbGQgb2YgY2hpbGRyZW4gKSB7XG4gICAgICAgICAgICBsZXQgbm9kZXMgPSB0aGlzLm5vcm1hbGl6ZShjaGlsZCwgdGhpcy5sYXN0KTtcbiAgICAgICAgICAgIGZvciAoIGxldCBub2RlIG9mIG5vZGVzICkgdGhpcy5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluc2VydHMgbmV3IG5vZGVzIHRvIHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Li4uKE5vZGV8b2JqZWN0fHN0cmluZ3xOb2RlW10pfSBjaGlsZHJlbiAtIG5ldyBub2Rlc1xuICAgICAqXG4gICAgICogQHJldHVybiB7Tm9kZX0gdGhpcyBub2RlIGZvciBtZXRob2RzIGNoYWluXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IGRlY2wxID0gcG9zdGNzcy5kZWNsKHsgcHJvcDogJ2NvbG9yJywgdmFsdWU6ICdibGFjaycgfSk7XG4gICAgICogY29uc3QgZGVjbDIgPSBwb3N0Y3NzLmRlY2woeyBwcm9wOiAnYmFja2dyb3VuZC1jb2xvcicsIHZhbHVlOiAnd2hpdGUnIH0pO1xuICAgICAqIHJ1bGUucHJlcGVuZChkZWNsMSwgZGVjbDIpO1xuICAgICAqXG4gICAgICogcm9vdC5hcHBlbmQoeyBuYW1lOiAnY2hhcnNldCcsIHBhcmFtczogJ1wiVVRGLThcIicgfSk7ICAvLyBhdC1ydWxlXG4gICAgICogcm9vdC5hcHBlbmQoeyBzZWxlY3RvcjogJ2EnIH0pOyAgICAgICAgICAgICAgICAgICAgICAgLy8gcnVsZVxuICAgICAqIHJ1bGUuYXBwZW5kKHsgcHJvcDogJ2NvbG9yJywgdmFsdWU6ICdibGFjaycgfSk7ICAgICAgIC8vIGRlY2xhcmF0aW9uXG4gICAgICogcnVsZS5hcHBlbmQoeyB0ZXh0OiAnQ29tbWVudCcgfSkgICAgICAgICAgICAgICAgICAgICAgLy8gY29tbWVudFxuICAgICAqXG4gICAgICogcm9vdC5hcHBlbmQoJ2Ege30nKTtcbiAgICAgKiByb290LmZpcnN0LmFwcGVuZCgnY29sb3I6IGJsYWNrOyB6LWluZGV4OiAxJyk7XG4gICAgICovXG4gICAgcHJlcGVuZCguLi5jaGlsZHJlbikge1xuICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuLnJldmVyc2UoKTtcbiAgICAgICAgZm9yICggbGV0IGNoaWxkIG9mIGNoaWxkcmVuICkge1xuICAgICAgICAgICAgbGV0IG5vZGVzID0gdGhpcy5ub3JtYWxpemUoY2hpbGQsIHRoaXMuZmlyc3QsICdwcmVwZW5kJykucmV2ZXJzZSgpO1xuICAgICAgICAgICAgZm9yICggbGV0IG5vZGUgb2Ygbm9kZXMgKSB0aGlzLm5vZGVzLnVuc2hpZnQobm9kZSk7XG4gICAgICAgICAgICBmb3IgKCBsZXQgaWQgaW4gdGhpcy5pbmRleGVzICkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhlc1tpZF0gPSB0aGlzLmluZGV4ZXNbaWRdICsgbm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFuUmF3cyhrZWVwQmV0d2Vlbikge1xuICAgICAgICBzdXBlci5jbGVhblJhd3Moa2VlcEJldHdlZW4pO1xuICAgICAgICBpZiAoIHRoaXMubm9kZXMgKSB7XG4gICAgICAgICAgICBmb3IgKCBsZXQgbm9kZSBvZiB0aGlzLm5vZGVzICkgbm9kZS5jbGVhblJhd3Moa2VlcEJldHdlZW4pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5zZXJ0IG5ldyBub2RlIGJlZm9yZSBvbGQgbm9kZSB3aXRoaW4gdGhlIGNvbnRhaW5lci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Tm9kZXxudW1iZXJ9IGV4aXN0ICAgICAgICAgICAgIC0gY2hpbGQgb3IgY2hpbGTigJlzIGluZGV4LlxuICAgICAqIEBwYXJhbSB7Tm9kZXxvYmplY3R8c3RyaW5nfE5vZGVbXX0gYWRkIC0gbmV3IG5vZGVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge05vZGV9IHRoaXMgbm9kZSBmb3IgbWV0aG9kcyBjaGFpblxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBydWxlLmluc2VydEJlZm9yZShkZWNsLCBkZWNsLmNsb25lKHsgcHJvcDogJy13ZWJraXQtJyArIGRlY2wucHJvcCB9KSk7XG4gICAgICovXG4gICAgaW5zZXJ0QmVmb3JlKGV4aXN0LCBhZGQpIHtcbiAgICAgICAgZXhpc3QgPSB0aGlzLmluZGV4KGV4aXN0KTtcblxuICAgICAgICBsZXQgdHlwZSAgPSBleGlzdCA9PT0gMCA/ICdwcmVwZW5kJyA6IGZhbHNlO1xuICAgICAgICBsZXQgbm9kZXMgPSB0aGlzLm5vcm1hbGl6ZShhZGQsIHRoaXMubm9kZXNbZXhpc3RdLCB0eXBlKS5yZXZlcnNlKCk7XG4gICAgICAgIGZvciAoIGxldCBub2RlIG9mIG5vZGVzICkgdGhpcy5ub2Rlcy5zcGxpY2UoZXhpc3QsIDAsIG5vZGUpO1xuXG4gICAgICAgIGxldCBpbmRleDtcbiAgICAgICAgZm9yICggbGV0IGlkIGluIHRoaXMuaW5kZXhlcyApIHtcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5pbmRleGVzW2lkXTtcbiAgICAgICAgICAgIGlmICggZXhpc3QgPD0gaW5kZXggKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleGVzW2lkXSA9IGluZGV4ICsgbm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5zZXJ0IG5ldyBub2RlIGFmdGVyIG9sZCBub2RlIHdpdGhpbiB0aGUgY29udGFpbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOb2RlfG51bWJlcn0gZXhpc3QgICAgICAgICAgICAgLSBjaGlsZCBvciBjaGlsZOKAmXMgaW5kZXhcbiAgICAgKiBAcGFyYW0ge05vZGV8b2JqZWN0fHN0cmluZ3xOb2RlW119IGFkZCAtIG5ldyBub2RlXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOb2RlfSB0aGlzIG5vZGUgZm9yIG1ldGhvZHMgY2hhaW5cbiAgICAgKi9cbiAgICBpbnNlcnRBZnRlcihleGlzdCwgYWRkKSB7XG4gICAgICAgIGV4aXN0ID0gdGhpcy5pbmRleChleGlzdCk7XG5cbiAgICAgICAgbGV0IG5vZGVzID0gdGhpcy5ub3JtYWxpemUoYWRkLCB0aGlzLm5vZGVzW2V4aXN0XSkucmV2ZXJzZSgpO1xuICAgICAgICBmb3IgKCBsZXQgbm9kZSBvZiBub2RlcyApIHRoaXMubm9kZXMuc3BsaWNlKGV4aXN0ICsgMSwgMCwgbm9kZSk7XG5cbiAgICAgICAgbGV0IGluZGV4O1xuICAgICAgICBmb3IgKCBsZXQgaWQgaW4gdGhpcy5pbmRleGVzICkge1xuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZGV4ZXNbaWRdO1xuICAgICAgICAgICAgaWYgKCBleGlzdCA8IGluZGV4ICkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhlc1tpZF0gPSBpbmRleCArIG5vZGVzLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlbW92ZShjaGlsZCkge1xuICAgICAgICBpZiAoIHR5cGVvZiBjaGlsZCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgICAgICB3YXJuT25jZSgnQ29udGFpbmVyI3JlbW92ZSBpcyBkZXByZWNhdGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICdVc2UgQ29udGFpbmVyI3JlbW92ZUNoaWxkJyk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgbm9kZSBmcm9tIHRoZSBjb250YWluZXIgYW5kIGNsZWFucyB0aGUgcGFyZW50IHByb3BlcnRpZXNcbiAgICAgKiBmcm9tIHRoZSBub2RlIGFuZCBpdHMgY2hpbGRyZW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge05vZGV8bnVtYmVyfSBjaGlsZCAtIGNoaWxkIG9yIGNoaWxk4oCZcyBpbmRleFxuICAgICAqXG4gICAgICogQHJldHVybiB7Tm9kZX0gdGhpcyBub2RlIGZvciBtZXRob2RzIGNoYWluXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJ1bGUubm9kZXMubGVuZ3RoICAvLz0+IDVcbiAgICAgKiBydWxlLnJlbW92ZUNoaWxkKGRlY2wpO1xuICAgICAqIHJ1bGUubm9kZXMubGVuZ3RoICAvLz0+IDRcbiAgICAgKiBkZWNsLnBhcmVudCAgICAgICAgLy89PiB1bmRlZmluZWRcbiAgICAgKi9cbiAgICByZW1vdmVDaGlsZChjaGlsZCkge1xuICAgICAgICBjaGlsZCA9IHRoaXMuaW5kZXgoY2hpbGQpO1xuICAgICAgICB0aGlzLm5vZGVzW2NoaWxkXS5wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGNoaWxkLCAxKTtcblxuICAgICAgICBsZXQgaW5kZXg7XG4gICAgICAgIGZvciAoIGxldCBpZCBpbiB0aGlzLmluZGV4ZXMgKSB7XG4gICAgICAgICAgICBpbmRleCA9IHRoaXMuaW5kZXhlc1tpZF07XG4gICAgICAgICAgICBpZiAoIGluZGV4ID49IGNoaWxkICkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhlc1tpZF0gPSBpbmRleCAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFsbCBjaGlsZHJlbiBmcm9tIHRoZSBjb250YWluZXJcbiAgICAgKiBhbmQgY2xlYW5zIHRoZWlyIHBhcmVudCBwcm9wZXJ0aWVzLlxuICAgICAqXG4gICAgICogQHJldHVybiB7Tm9kZX0gdGhpcyBub2RlIGZvciBtZXRob2RzIGNoYWluXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJ1bGUucmVtb3ZlQWxsKCk7XG4gICAgICogcnVsZS5ub2Rlcy5sZW5ndGggLy89PiAwXG4gICAgICovXG4gICAgcmVtb3ZlQWxsKCkge1xuICAgICAgICBmb3IgKCBsZXQgbm9kZSBvZiB0aGlzLm5vZGVzICkgbm9kZS5wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFzc2VzIGFsbCBkZWNsYXJhdGlvbiB2YWx1ZXMgd2l0aGluIHRoZSBjb250YWluZXIgdGhhdCBtYXRjaCBwYXR0ZXJuXG4gICAgICogdGhyb3VnaCBjYWxsYmFjaywgcmVwbGFjaW5nIHRob3NlIHZhbHVlcyB3aXRoIHRoZSByZXR1cm5lZCByZXN1bHRcbiAgICAgKiBvZiBjYWxsYmFjay5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWZ1bCBpZiB5b3UgYXJlIHVzaW5nIGEgY3VzdG9tIHVuaXQgb3IgZnVuY3Rpb25cbiAgICAgKiBhbmQgbmVlZCB0byBpdGVyYXRlIHRocm91Z2ggYWxsIHZhbHVlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0dGVybiAgICAtIHJlcGxhY2UgcGF0dGVyblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzICAgICAgICAgICAgICAtIG9wdGlvbnMgdG8gc3BlZWQgdXAgdGhlIHNlYXJjaFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnByb3AgICAgICAgICAtIGFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMuZmFzdCAgICAgICAgIC0gc3RyaW5nIHRoYXTigJlzIHVzZWRcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBuYXJyb3cgZG93biB2YWx1ZXMgYW5kIHNwZWVkIHVwXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHJlZ2V4cCBzZWFyY2hcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufHN0cmluZ30gY2FsbGJhY2sgLSBzdHJpbmcgdG8gcmVwbGFjZSBwYXR0ZXJuXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3IgY2FsbGJhY2sgdGhhdCByZXR1cm5zIGEgbmV3IHZhbHVlLlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBjYWxsYmFjayB3aWxsIHJlY2VpdmVcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgc2FtZSBhcmd1bWVudHMgYXMgdGhvc2UgcGFzc2VkXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gYSBmdW5jdGlvbiBwYXJhbWV0ZXJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiBgU3RyaW5nI3JlcGxhY2VgLlxuICAgICAqXG4gICAgICogQHJldHVybiB7Tm9kZX0gdGhpcyBub2RlIGZvciBtZXRob2RzIGNoYWluXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJvb3QucmVwbGFjZVZhbHVlcygvXFxkK3JlbS8sIHsgZmFzdDogJ3JlbScgfSwgc3RyaW5nID0+IHtcbiAgICAgKiAgIHJldHVybiAxNSAqIHBhcnNlSW50KHN0cmluZykgKyAncHgnO1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHJlcGxhY2VWYWx1ZXMocGF0dGVybiwgb3B0cywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCAhY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICAgICAgICBvcHRzID0geyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy53YWxrRGVjbHMoIGRlY2wgPT4ge1xuICAgICAgICAgICAgaWYgKCBvcHRzLnByb3BzICYmIG9wdHMucHJvcHMuaW5kZXhPZihkZWNsLnByb3ApID09PSAtMSApIHJldHVybjtcbiAgICAgICAgICAgIGlmICggb3B0cy5mYXN0ICAmJiBkZWNsLnZhbHVlLmluZGV4T2Yob3B0cy5mYXN0KSA9PT0gLTEgKSByZXR1cm47XG5cbiAgICAgICAgICAgIGRlY2wudmFsdWUgPSBkZWNsLnZhbHVlLnJlcGxhY2UocGF0dGVybiwgY2FsbGJhY2spO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBjYWxsYmFjayByZXR1cm5zIGB0cnVlYFxuICAgICAqIGZvciBhbGwgb2YgdGhlIGNvbnRhaW5lcuKAmXMgY2hpbGRyZW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2NoaWxkQ29uZGl0aW9ufSBjb25kaXRpb24gLSBpdGVyYXRvciByZXR1cm5zIHRydWUgb3IgZmFsc2UuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBpcyBldmVyeSBjaGlsZCBwYXNzIGNvbmRpdGlvblxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBub1ByZWZpeGVzID0gcnVsZS5ldmVyeShpID0+IGkucHJvcFswXSAhPT0gJy0nKTtcbiAgICAgKi9cbiAgICBldmVyeShjb25kaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXMuZXZlcnkoY29uZGl0aW9uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBjYWxsYmFjayByZXR1cm5zIGB0cnVlYCBmb3IgKGF0IGxlYXN0KSBvbmVcbiAgICAgKiBvZiB0aGUgY29udGFpbmVy4oCZcyBjaGlsZHJlbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Y2hpbGRDb25kaXRpb259IGNvbmRpdGlvbiAtIGl0ZXJhdG9yIHJldHVybnMgdHJ1ZSBvciBmYWxzZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IGlzIGV2ZXJ5IGNoaWxkIHBhc3MgY29uZGl0aW9uXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IGhhc1ByZWZpeCA9IHJ1bGUuZXZlcnkoaSA9PiBpLnByb3BbMF0gPT09ICctJyk7XG4gICAgICovXG4gICAgc29tZShjb25kaXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXMuc29tZShjb25kaXRpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBgY2hpbGRg4oCZcyBpbmRleCB3aXRoaW4gdGhlIHtAbGluayBDb250YWluZXIjbm9kZXN9IGFycmF5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOb2RlfSBjaGlsZCAtIGNoaWxkIG9mIHRoZSBjdXJyZW50IGNvbnRhaW5lci5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gY2hpbGQgaW5kZXhcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogcnVsZS5pbmRleCggcnVsZS5ub2Rlc1syXSApIC8vPT4gMlxuICAgICAqL1xuICAgIGluZGV4KGNoaWxkKSB7XG4gICAgICAgIGlmICggdHlwZW9mIGNoaWxkID09PSAnbnVtYmVyJyApIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGNvbnRhaW5lcuKAmXMgZmlyc3QgY2hpbGQuXG4gICAgICpcbiAgICAgKiBAdHlwZSB7Tm9kZX1cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogcnVsZS5maXJzdCA9PSBydWxlcy5ub2Rlc1swXTtcbiAgICAgKi9cbiAgICBnZXQgZmlyc3QoKSB7XG4gICAgICAgIGlmICggIXRoaXMubm9kZXMgKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdGhpcy5ub2Rlc1swXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY29udGFpbmVy4oCZcyBsYXN0IGNoaWxkLlxuICAgICAqXG4gICAgICogQHR5cGUge05vZGV9XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJ1bGUubGFzdCA9PSBydWxlLm5vZGVzW3J1bGUubm9kZXMubGVuZ3RoIC0gMV07XG4gICAgICovXG4gICAgZ2V0IGxhc3QoKSB7XG4gICAgICAgIGlmICggIXRoaXMubm9kZXMgKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdGhpcy5ub2Rlc1t0aGlzLm5vZGVzLmxlbmd0aCAtIDFdO1xuICAgIH1cblxuICAgIG5vcm1hbGl6ZShub2Rlcywgc2FtcGxlKSB7XG4gICAgICAgIGlmICggdHlwZW9mIG5vZGVzID09PSAnc3RyaW5nJyApIHtcbiAgICAgICAgICAgIGxldCBwYXJzZSA9IHJlcXVpcmUoJy4vcGFyc2UnKTtcbiAgICAgICAgICAgIG5vZGVzID0gY2xlYW5Tb3VyY2UocGFyc2Uobm9kZXMpLm5vZGVzKTtcbiAgICAgICAgfSBlbHNlIGlmICggIUFycmF5LmlzQXJyYXkobm9kZXMpICkge1xuICAgICAgICAgICAgaWYgKCBub2Rlcy50eXBlID09PSAncm9vdCcgKSB7XG4gICAgICAgICAgICAgICAgbm9kZXMgPSBub2Rlcy5ub2RlcztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIG5vZGVzLnR5cGUgKSB7XG4gICAgICAgICAgICAgICAgbm9kZXMgPSBbbm9kZXNdO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggbm9kZXMucHJvcCApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBub2Rlcy52YWx1ZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVmFsdWUgZmllbGQgaXMgbWlzc2VkIGluIG5vZGUgY3JlYXRpb24nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCB0eXBlb2Ygbm9kZXMudmFsdWUgIT09ICdzdHJpbmcnICkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy52YWx1ZSA9IFN0cmluZyhub2Rlcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGVzID0gW25ldyBEZWNsYXJhdGlvbihub2RlcyldO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggbm9kZXMuc2VsZWN0b3IgKSB7XG4gICAgICAgICAgICAgICAgbGV0IFJ1bGUgPSByZXF1aXJlKCcuL3J1bGUnKTtcbiAgICAgICAgICAgICAgICBub2RlcyA9IFtuZXcgUnVsZShub2RlcyldO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggbm9kZXMubmFtZSApIHtcbiAgICAgICAgICAgICAgICBsZXQgQXRSdWxlID0gcmVxdWlyZSgnLi9hdC1ydWxlJyk7XG4gICAgICAgICAgICAgICAgbm9kZXMgPSBbbmV3IEF0UnVsZShub2RlcyldO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggbm9kZXMudGV4dCApIHtcbiAgICAgICAgICAgICAgICBub2RlcyA9IFtuZXcgQ29tbWVudChub2RlcyldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbm9kZSB0eXBlIGluIG5vZGUgY3JlYXRpb24nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwcm9jZXNzZWQgPSBub2Rlcy5tYXAoIGkgPT4ge1xuICAgICAgICAgICAgaWYgKCB0eXBlb2YgaS5yYXdzID09PSAndW5kZWZpbmVkJyApIGkgPSB0aGlzLnJlYnVpbGQoaSk7XG5cbiAgICAgICAgICAgIGlmICggaS5wYXJlbnQgKSBpID0gaS5jbG9uZSgpO1xuICAgICAgICAgICAgaWYgKCB0eXBlb2YgaS5yYXdzLmJlZm9yZSA9PT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBzYW1wbGUgJiYgdHlwZW9mIHNhbXBsZS5yYXdzLmJlZm9yZSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgICAgICAgICAgICAgICAgIGkucmF3cy5iZWZvcmUgPSBzYW1wbGUucmF3cy5iZWZvcmUucmVwbGFjZSgvW15cXHNdL2csICcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpLnBhcmVudCA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByb2Nlc3NlZDtcbiAgICB9XG5cbiAgICByZWJ1aWxkKG5vZGUsIHBhcmVudCkge1xuICAgICAgICBsZXQgZml4O1xuICAgICAgICBpZiAoIG5vZGUudHlwZSA9PT0gJ3Jvb3QnICkge1xuICAgICAgICAgICAgbGV0IFJvb3QgPSByZXF1aXJlKCcuL3Jvb3QnKTtcbiAgICAgICAgICAgIGZpeCA9IG5ldyBSb290KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIG5vZGUudHlwZSA9PT0gJ2F0cnVsZScgKSB7XG4gICAgICAgICAgICBsZXQgQXRSdWxlID0gcmVxdWlyZSgnLi9hdC1ydWxlJyk7XG4gICAgICAgICAgICBmaXggPSBuZXcgQXRSdWxlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIG5vZGUudHlwZSA9PT0gJ3J1bGUnICkge1xuICAgICAgICAgICAgbGV0IFJ1bGUgPSByZXF1aXJlKCcuL3J1bGUnKTtcbiAgICAgICAgICAgIGZpeCA9IG5ldyBSdWxlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIG5vZGUudHlwZSA9PT0gJ2RlY2wnICkge1xuICAgICAgICAgICAgZml4ID0gbmV3IERlY2xhcmF0aW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIG5vZGUudHlwZSA9PT0gJ2NvbW1lbnQnICkge1xuICAgICAgICAgICAgZml4ID0gbmV3IENvbW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoIGxldCBpIGluIG5vZGUgKSB7XG4gICAgICAgICAgICBpZiAoIGkgPT09ICdub2RlcycgKSB7XG4gICAgICAgICAgICAgICAgZml4Lm5vZGVzID0gbm9kZS5ub2Rlcy5tYXAoIGogPT4gdGhpcy5yZWJ1aWxkKGosIGZpeCkgKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGkgPT09ICdwYXJlbnQnICYmIHBhcmVudCApIHtcbiAgICAgICAgICAgICAgICBmaXgucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgfSBlbHNlIGlmICggbm9kZS5oYXNPd25Qcm9wZXJ0eShpKSApIHtcbiAgICAgICAgICAgICAgICBmaXhbaV0gPSBub2RlW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpeDtcbiAgICB9XG5cbiAgICBlYWNoSW5zaWRlKGNhbGxiYWNrKSB7XG4gICAgICAgIHdhcm5PbmNlKCdDb250YWluZXIjZWFjaEluc2lkZSBpcyBkZXByZWNhdGVkLiAnICtcbiAgICAgICAgICAgICAgICAgJ1VzZSBDb250YWluZXIjd2FsayBpbnN0ZWFkLicpO1xuICAgICAgICByZXR1cm4gdGhpcy53YWxrKGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBlYWNoRGVjbChwcm9wLCBjYWxsYmFjaykge1xuICAgICAgICB3YXJuT25jZSgnQ29udGFpbmVyI2VhY2hEZWNsIGlzIGRlcHJlY2F0ZWQuICcgK1xuICAgICAgICAgICAgICAgICAnVXNlIENvbnRhaW5lciN3YWxrRGVjbHMgaW5zdGVhZC4nKTtcbiAgICAgICAgcmV0dXJuIHRoaXMud2Fsa0RlY2xzKHByb3AsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBlYWNoUnVsZShzZWxlY3RvciwgY2FsbGJhY2spIHtcbiAgICAgICAgd2Fybk9uY2UoJ0NvbnRhaW5lciNlYWNoUnVsZSBpcyBkZXByZWNhdGVkLiAnICtcbiAgICAgICAgICAgICAgICAgJ1VzZSBDb250YWluZXIjd2Fsa1J1bGVzIGluc3RlYWQuJyk7XG4gICAgICAgIHJldHVybiB0aGlzLndhbGtSdWxlcyhzZWxlY3RvciwgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIGVhY2hBdFJ1bGUobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgd2Fybk9uY2UoJ0NvbnRhaW5lciNlYWNoQXRSdWxlIGlzIGRlcHJlY2F0ZWQuICcgK1xuICAgICAgICAgICAgICAgICAnVXNlIENvbnRhaW5lciN3YWxrQXRSdWxlcyBpbnN0ZWFkLicpO1xuICAgICAgICByZXR1cm4gdGhpcy53YWxrQXRSdWxlcyhuYW1lLCBjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgZWFjaENvbW1lbnQoY2FsbGJhY2spIHtcbiAgICAgICAgd2Fybk9uY2UoJ0NvbnRhaW5lciNlYWNoQ29tbWVudCBpcyBkZXByZWNhdGVkLiAnICtcbiAgICAgICAgICAgICAgICAgJ1VzZSBDb250YWluZXIjd2Fsa0NvbW1lbnRzIGluc3RlYWQuJyk7XG4gICAgICAgIHJldHVybiB0aGlzLndhbGtDb21tZW50cyhjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgZ2V0IHNlbWljb2xvbigpIHtcbiAgICAgICAgd2Fybk9uY2UoJ05vZGUjc2VtaWNvbG9uIGlzIGRlcHJlY2F0ZWQuIFVzZSBOb2RlI3Jhd3Muc2VtaWNvbG9uJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnJhd3Muc2VtaWNvbG9uO1xuICAgIH1cblxuICAgIHNldCBzZW1pY29sb24odmFsKSB7XG4gICAgICAgIHdhcm5PbmNlKCdOb2RlI3NlbWljb2xvbiBpcyBkZXByZWNhdGVkLiBVc2UgTm9kZSNyYXdzLnNlbWljb2xvbicpO1xuICAgICAgICB0aGlzLnJhd3Muc2VtaWNvbG9uID0gdmFsO1xuICAgIH1cblxuICAgIGdldCBhZnRlcigpIHtcbiAgICAgICAgd2Fybk9uY2UoJ05vZGUjYWZ0ZXIgaXMgZGVwcmVjYXRlZC4gVXNlIE5vZGUjcmF3cy5hZnRlcicpO1xuICAgICAgICByZXR1cm4gdGhpcy5yYXdzLmFmdGVyO1xuICAgIH1cblxuICAgIHNldCBhZnRlcih2YWwpIHtcbiAgICAgICAgd2Fybk9uY2UoJ05vZGUjYWZ0ZXIgaXMgZGVwcmVjYXRlZC4gVXNlIE5vZGUjcmF3cy5hZnRlcicpO1xuICAgICAgICB0aGlzLnJhd3MuYWZ0ZXIgPSB2YWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG1lbWJlcm9mIENvbnRhaW5lciNcbiAgICAgKiBAbWVtYmVyIHtOb2RlW119IG5vZGVzIC0gYW4gYXJyYXkgY29udGFpbmluZyB0aGUgY29udGFpbmVy4oCZcyBjaGlsZHJlblxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCByb290ID0gcG9zdGNzcy5wYXJzZSgnYSB7IGNvbG9yOiBibGFjayB9Jyk7XG4gICAgICogcm9vdC5ub2Rlcy5sZW5ndGggICAgICAgICAgIC8vPT4gMVxuICAgICAqIHJvb3Qubm9kZXNbMF0uc2VsZWN0b3IgICAgICAvLz0+ICdhJ1xuICAgICAqIHJvb3Qubm9kZXNbMF0ubm9kZXNbMF0ucHJvcCAvLz0+ICdjb2xvcidcbiAgICAgKi9cblxufVxuXG5leHBvcnQgZGVmYXVsdCBDb250YWluZXI7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
