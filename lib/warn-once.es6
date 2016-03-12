let printed = {};
export default (message) => {
    if (printed[message])
        return;
    printed[message] = true;
    if (typeof console !== 'undefined' && console.warn)
        console.warn(message);
};
