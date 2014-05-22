/*!
 * Module dependencies.
 */

var util = require('util'),
    utils = require('keystone-utils'),
    super_ = require('../field');

module.exports = Field.extend({
    /**
     * Color FieldType Constructor
     * @extends Field
     * @api public
     */
    constructor: function(list, path, options) {
        this._nativeType = String;
        this._underscoreMethods = [];

        Field.apply(this, arguments);
    }
});
