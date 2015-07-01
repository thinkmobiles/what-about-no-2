'use strict';

module.exports.format = function (str, options) {
    var mask;
    
    if (options && options.international) {
        mask = '(+$1)$2-$3-$4';
    } else {
        mask = '$2-$3-$4';
    }
    
    if (str.length === 12) {
        return str.replace(/^\+(\d{1})(\d{3})(\d{3})(\d{4}).*/, mask);
    }
    else if (str.length === 13) {
        return str.replace(/^\+(\d{2})(\d{3})(\d{3})(\d{4}).*/, mask);
    } else {
        return str;
    }
};