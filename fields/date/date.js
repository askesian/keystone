/*!
 * Module dependencies.
 */

var moment = require('moment'),
	utils = require('keystone-utils'),
	keystone = require('../../'),
	Field = keystone.Field;


module.exports = Field.extend({
	/**
	 * Date FieldType Constructor
	 * @extends Field
	 * @api public
	 */
	constructor: function(list, path, options) {
		this._nativeType = Date;
		this._underscoreMethods = ['format', 'moment', 'parse'];

		this._formatString = (options.format === false) ? false : (options.format || 'Do MMM YYYY');
		if (this._formatString && 'string' != typeof this._formatString) {
			throw new Error('FieldType.Date: options.format must be a string.');
		}

		Field.apply(this, arguments);
	},

	/**
	 * Formats the field value
	 *
	 * @api public
	 */
	format: function(item, format) {
		if (format || this._formatString) {
			return item.get(this.path) ? moment(item.get(this.path)).format(format || this._formatString) : '';
		} else {
			return item.get(this.path) || '';
		}
	},

	/**
	 * Returns a new `moment` object with the field value
	 *
	 * @api public
	 */
	moment: function(item) {
		return moment(item.get(this.path));
	},

	/**
	 * Parses input using moment, sets the value, and returns the moment object.
	 *
	 * @api public
	 */
	parse: function(item) {
		var newValue = moment.apply(moment, Array.prototype.slice.call(arguments, 1));
		item.set(this.path, (newValue && newValue.isValid()) ? newValue.toDate() : null);
		return newValue;
	},

	/**
	 * Checks that a valid date has been provided in a data object
	 *
	 * An empty value clears the stored value and is considered valid
	 *
	 * @api public
	 */
	validateInput: function(data, required, item) {
		if (!(this.path in data) && item && item.get(this.path)) return true;

		var newValue = moment(data[this.path]);

		if (required && (!newValue || !newValue.isValid())) {
			return false;
		} else if (data[this.path] && newValue && !newValue.isValid()) {
			return false;
		} else {
			return true;
		}
	},

	/**
	 * Updates the value for this field in the item from a data object
	 *
	 * @api public
	 */
	updateItem: function(item, data) {
		if (!(this.path in data))
			return;

		var newValue = moment(data[this.path]);

		if (newValue && newValue.isValid()) {
			if (!item.get(this.path) || !newValue.isSame(item.get(this.path))) {
				item.set(this.path, newValue.toDate());
			}
		} else if (item.get(this.path)) {
			item.set(this.path, null);
		}
	},

	/**
	 * Processes a filter array into a filters object
	 *
	 * @param {Object} ops
	 * @param {Array} filter
	 * @api private
	 */

	processFilters: function (ops, filter) {
		if (filter[0] == 'gt' || filter[0] == 'lt') {
			ops.operator = filter[0];
			filter.shift();
		}
		ops.value = filter[0];
	},

	getSearchFilters: function (filter, filters) {
		var val = moment(filter.value);
		if (val && val.isValid()) {
			var start = moment(filter.value).startOf('day');
			var end = moment(filter.value).endOf('day');
			if (filter.operator == 'gt') {
				filters[filter.field.path] = { $gt: end.toDate() };
			} else if (filter.operator == 'lt') {
				filters[filter.field.path] = { $lt: start.toDate() };
			} else {
				filters[filter.field.path] = { $lte: end.toDate(), $gte: start.toDate() };
			}
		}
	}
});