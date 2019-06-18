/* eslint-disable max-statements-per-line */
/* eslint-disable no-param-reassign */
/* eslint-disable id-length */

module.exports.linearTween = function (t, b, c, d) {
    if (c > b) {
        return c * t / d + b;
    }
    return b - (b * t / d + c);
};

module.exports.easeInQuad = function (t, b, c, d) {
    t /= d;
    if (c > b) {
        return c * t * t + b;
    }
    return b - (b * t * t + c);
};

module.exports.easeInOutQuad = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) { return c / 2 * t * t + b; }
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
};

module.exports.easeInCubic = function (t, b, c, d) {
    t /= d;
    return c * t * t * t + b;
};

module.exports.easeOutCubic = function (t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
};

module.exports.easeInOutCubic = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) { return c / 2 * t * t * t + b; }
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
};

module.exports.easeInQuart = function (t, b, c, d) {
    t /= d;
    return c * t * t * t * t + b;
};

module.exports.easeOutQuart = function (t, b, c, d) {
    t /= d;
    t--;
    return -c * (t * t * t * t - 1) + b;
};

module.exports.easeInOutQuart = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) { return c / 2 * t * t * t * t + b; }
    t -= 2;
    return -c / 2 * (t * t * t * t - 2) + b;
};

module.exports.easeInQuint = function (t, b, c, d) {
    t /= d;
    return c * t * t * t * t * t + b;
};


module.exports.easeOutQuint = function (t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t * t * t + 1) + b;
};

module.exports.easeInOutQuint = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) { return c / 2 * t * t * t * t * t + b; }
    t -= 2;
    return c / 2 * (t * t * t * t * t + 2) + b;
};

module.exports.easeInSine = function (t, b, c, d) {
    return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
};

module.exports.easeOutSine = function (t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
};

module.exports.easeInOutSine = function (t, b, c, d) {
    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
};

module.exports.easeInExpo = function (t, b, c, d) {
    return c * Math.pow(2, 10 * (t / d - 1)) + b;
};

module.exports.easeOutExpo = function (t, b, c, d) {
    return c * (-Math.pow(2, -10 * t / d) + 1) + b;
};

module.exports.easeInOutExpo = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) { return c / 2 * Math.pow(2, 10 * (t - 1)) + b; }
    t--;
    return c / 2 * (-Math.pow(2, -10 * t) + 2) + b;
};

module.exports.easeInCirc = function (t, b, c, d) {
    t /= d;
    return -c * (Math.sqrt(1 - t * t) - 1) + b;
};

module.exports.easeOutCirc = function (t, b, c, d) {
    t /= d;
    t--;
    return c * Math.sqrt(1 - t * t) + b;
};

module.exports.easeInOutCirc = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) { return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b; }
    t -= 2;
    return c / 2 * (Math.sqrt(1 - t * t) + 1) + b;
};
