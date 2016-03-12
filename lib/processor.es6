import LazyResult from './lazy-result';
export default class Processor {
    constructor(plugins = []) {
        this.plugins = this.normalize(plugins);
    }
    /**
     * Adds a plugin to be used as a CSS processor. Plugins can also be
     * added by passing them as arguments when creating a postcss instance.
     */
    use(plugin) {
        this.plugins = this.plugins.concat(this.normalize([plugin]));
        return this;
    }
    /**
     * Parses source CSS. Because some plugins can be asynchronous it doesn't
     * make any transformations. Transformations will be applied in LazyResult's
     * methods.
     * @param css Input CSS or any object with toString() method, like a file
     * stream. If a Result instance is passed the processor will take the
     * existing Root parser from it.
     */
    process(css, options = {}) {
        return new LazyResult(this, css, options);
    }
    normalize(plugins) {
        let normalized = [];
        for (let i of plugins) {
            if (i.postcss) {
                i = i.postcss;
            }
            if (typeof i === 'object' && Array.isArray(i.plugins)) {
                normalized = normalized.concat(i.plugins);
            }
            else if (typeof i === 'function') {
                normalized.push(i);
            }
            else {
                throw new Error(`${i} is not a PostCSS plugin`);
            }
        }
        return normalized;
    }
}
