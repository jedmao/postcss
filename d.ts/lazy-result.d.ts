import Processor from './processor';
import postcss from './postcss';
import Result from './result';
export default class LazyResult implements postcss.LazyResult {
    private stringified;
    private processed;
    private result;
    private error;
    private plugin;
    private processing;
    /**
     * A promise proxy for the result of PostCSS transformations.
     */
    constructor(processor: Processor, 
        /**
         * String with input CSS or any object with toString() method, like a Buffer.
         * Optionally, send Result instance and the processor will take the existing
         * [Root] parser from it.
         */
        css: string | {
        toString(): string;
    } | LazyResult | Result, opts?: postcss.ProcessOptions);
    /**
     * @returns A processor used for CSS transformations.
     */
    readonly processor: postcss.Processor;
    /**
     * @returns Options from the Processor#process(css, opts) call that produced
     * this Result instance.
     */
    readonly opts: postcss.ResultOptions;
    /**
     * Processes input CSS through synchronous plugins and converts Root to a
     * CSS string. This property will only work with synchronous plugins. If
     * the processor contains any asynchronous plugins it will throw an error.
     * In this case, you should use LazyResult#then() instead.
     */
    readonly css: string;
    /**
     * Alias for css property to use when syntaxes generate non-CSS output.
     */
    readonly content: string;
    /**
     * Processes input CSS through synchronous plugins. This property will
     * only work with synchronous plugins. If the processor contains any
     * asynchronous plugins it will throw an error. In this case, you should
     * use LazyResult#then() instead.
     */
    readonly map: postcss.ResultMap;
    /**
     * Processes input CSS through synchronous plugins. This property will only
     * work with synchronous plugins. If the processor contains any asynchronous
     * plugins it will throw an error. In this case, you should use
     * LazyResult#then() instead.
     */
    readonly root: postcss.Root;
    /**
     * Processes input CSS through synchronous plugins. This property will only
     * work with synchronous plugins. If the processor contains any asynchronous
     * plugins it will throw an error. In this case, you should use
     * LazyResult#then() instead.
     */
    readonly messages: postcss.ResultMessage[];
    /**
     * Processes input CSS through synchronous plugins and calls Result#warnings().
     * This property will only work with synchronous plugins. If the processor
     * contains any asynchronous plugins it will throw an error. In this case, you
     * You should use LazyResult#then() instead.
     */
    warnings(): postcss.ResultMessage[];
    /**
     * Alias for css property.
     */
    toString(): string;
    /**
     * Processes input CSS through synchronous and asynchronous plugins.
     * @param onRejected Called if any plugin throws an error.
     */
    then(onFulfilled: (result: postcss.Result) => void, onRejected?: (error: Error) => void): Function | any;
    /**
     * Processes input CSS through synchronous and asynchronous plugins.
     * @param onRejected Called if any plugin throws an error.
     */
    catch(onRejected: (error: Error) => void): Function | any;
    private handleError(error, plugin);
    private asyncTick(resolve, reject);
    private async();
    sync(): Result;
    private run(plugin);
    stringify(): Result;
}
