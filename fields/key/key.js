/*!
 * Module dependencies.
 */

var utils = require('keystone-utils'),
	keystone = require('../../'),
	Field = keystone.Field;

module.exports = Field.extend({
	/**
	 * Key FieldType Constructor
	 * @extends Field
	 * @api public
	 */
	constructor: function(list, path, options) {
		this._nativeType = String;
		this.separator = options.separator || '-';
		Field.apply(this, arguments);
	},

	/**
	 * Generates a valid key from a string
	 *
	 * @api public
	 */
	generateKey: function(str) {
		return utils.slug(String(str), this.separator);
	},

	/**
	 * Checks that a valid key has been provided in a data object
	 *
	 * @api public
	 */
	validateInput: function(data, required, item) {
		if (!(this.path in data) && item && item.get(this.path)) return true;

		var newValue = this.generateKey(data[this.path]);

		return (newValue || !required);
	},

	/**
	 * Updates the value for this field in the item from a data object
	 *
	 * @api public
	 */
	updateItem: function(item, data) {
		if (!(this.path in data))
			return;

		var newValue = this.generateKey(data[this.path]);

		if (item.get(this.path) != newValue) {
			item.set(this.path, newValue);
		}
	},

	getSearchFilters: function (filter, filters) {
		if (filter.exact) {
			if (filter.value) {
				var cond = new RegExp('^' + utils.escapeRegExp(filter.value) + '$', 'i');
				filters[filter.field.path] = filter.inv ? { $not: cond } : cond;
			} else {
				if (filter.inv) {
					filters[filter.field.path] = { $nin: ['', null] };
				} else {
					filters[filter.field.path] = { $in: ['', null] };
				}
			}
		} else if (filter.value) {
			var cond = new RegExp(utils.escapeRegExp(filter.value), 'i');
			filters[filter.field.path] = filter.inv ? { $not: cond } : cond;
		}
	}
});