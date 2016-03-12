import Declaration from './declaration';
import _stringify from './stringify';
import Processor from './processor';
import Comment from './comment';
import _vendor from './vendor';
import AtRule from './at-rule';
import _parse from './parse';
import _list from './list';
import Rule from './rule';
import Root from './root';
function postcss(...plugins) {
    // ReSharper restore RedundantQualifier
    if (plugins.length === 1 && Array.isArray(plugins[0])) {
        plugins = plugins[0];
    }
    return new Processor(plugins);
}
// ReSharper disable once InconsistentNaming
var postcss;
(function (postcss) {
    /**
     * Creates a PostCSS plugin with a standard API.
     * @param name Plugin name. Same as in name property in package.json. It will
     * be saved in plugin.postcssPlugin property.
     * @param initializer Will receive plugin options and should return functions
     * to modify nodes in input CSS.
     */
    function plugin(name, initializer) {
        let creator = function () {
            const transformer = initializer.apply(this, arguments);
            transformer.postcssPlugin = name;
            transformer.postcssVersion = (new Processor()).version;
            return transformer;
        };
        creator.postcss = creator();
        /**
         * Equivalent to postcss([ somePlugin(options) ]).process(css);
         */
        creator.process = (css, options) => {
            return postcss([creator(options)]).process(css, options);
        };
        return creator;
    }
    postcss.plugin = plugin;
    /**
     * Contains the Vendor module, which contains helpers for working with
     * vendor prefixes.
     */
    postcss.vendor = _vendor;
    /**
     * Default function to convert a node tree into a CSS string.
     */
    function stringify(node, builder) {
        return _stringify(node, builder);
    }
    postcss.stringify = stringify;
    /**
     * Parses source CSS.
     * @param css The CSS to parse.
     * @param options
     * @returns {} A new Root node, which contains the source CSS nodes.
     */
    function parse(css, options) {
        return _parse(css, options);
    }
    postcss.parse = parse;
    /**
     * Contains the List module, which contains helpers for safely splitting
     * lists of CSS values, preserving parentheses and quotes.
     */
    postcss.list = _list;
    /**
     * Creates a new Comment node.
     * @param defaults Properties for the new Comment node.
     * @returns The new node.
     */
    function comment(defaults) {
        return new Comment(defaults);
    }
    postcss.comment = comment;
    /**
     * Creates a new AtRule node.
     * @param defaults Properties for the new AtRule node.
     * @returns The new node.
     */
    function atRule(defaults) {
        return new AtRule(defaults);
    }
    postcss.atRule = atRule;
    /**
     * Creates a new Declaration node.
     * @param defaults Properties for the new Declaration node.
     * @returns The new node.
     */
    function decl(defaults) {
        return new Declaration(defaults);
    }
    postcss.decl = decl;
    /**
     * Creates a new Rule node.
     * @param defaults Properties for the new Rule node.
     * @returns The new node.
     */
    function rule(defaults) {
        return new Rule(defaults);
    }
    postcss.rule = rule;
    /**
     * Creates a new Root node.
     * @param defaults Properties for the new Root node.
     * @returns The new node.
     */
    function root(defaults) {
        return new Root(defaults);
    }
    postcss.root = root;
    ;
})(postcss || (postcss = {}));
export default postcss;
