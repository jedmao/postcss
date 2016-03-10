let printed = { };

/* istanbul ignore next */
export default (message: string) => {
    if ( printed[message] ) return;
    printed[message] = true;

    if ( typeof console !== 'undefined' && console.warn ) console.warn(message);
}
