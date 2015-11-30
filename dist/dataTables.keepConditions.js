/**
 * @summary     KeepConditions
 * @updated     11/27/15
 * @description Store the status of the DataTable within the URL, making
 *              sharing the exact page/length/etc via copy/paste possible
 * @version     1.2.0
 * @file        dataTables.keepConditions.js
 * @author      Justin Hyland (http://www.justinhyland.com)
 * @contact     j@linux.com
 * @copyright   Copyright 2015 Justin Hyland
 * @url         https://github.com/jhyland87/DataTables-Keep-Conditions
 *
 * License      MIT - http://datatables.net/license/mit
 *
 * Store the DataTable conditions within the URL hash every time a condition is changed,
 * such as the page, length, search or a column order, making it possible to copy/paste
 * the URL. Once said URL is loaded, the conditions will be retrieved from the URL hash
 * and implemented to the table on dt.init
 *
 * KeepConditions is compatable with the following settings/extensions/plugins:
 *      Pagination          (name: page;     key: p)
 *      Page Length         (name: length;   key: l)
 *      Table Searching     (name: search;   key: f)
 *      Column Sorting      (name: order;    key: o)
 *      Scroller Extension  (name: scroller; key: s)
 *          http://datatables.net/extensions/scroller/
 *      Column Visibility   (name: colvis;   key: v)
 *          http://datatables.net/reference/button/colvis/
 *      Column Reorder      (name: colorder; key: c)
 *          http://datatables.net/extensions/colreorder/
 *
 * @example
 *    // Basic Initialization (All conditions by default)
 *    $('#example').DataTable({
 *        keepConditions: true
 *    });
 *
 * @example
 *    // Basic Initialization (Specifically specifying enabled conditions, individually)
 *    $('#example').DataTable({
 *        keepConditions: ['order','page','length','search','colvis','colorder','scroller']
 *    });
 *
 * @example
 *    // Same as above, only quicker (Using condition keys in string, instead of names)
 *    $('#example').DataTable({
 *        keepConditions: 'oplfvcs'
 *    });
 *
 * @example
 *    // Basic Initialization with "Copy Conditions" button
 *    $('#example').DataTable({
 *        keepConditions: true,
 *        buttons: [
 *           'copyConditions'
 *        ]
 *    });
 *
 * @example
 *    // Initialization with plugins
 *    $('#example').DataTable({
 *        ajax:           "dataSrc.txt",
 *        deferRender:    true,
 *        scrollY:        200,
 *        scrollCollapse: true,
 *        scroller:       true,
 *        keepConditions: {
 *          conditions: ['order','length','search','scroller']
 *        }
 *    });
 *
 * @example
 *    // Same as above, but don't attach the auto-update to the events associated to
 *    // each condition (since it can also be ran manually via the API methods)
 *    $('#example').DataTable({
 *        ajax:           "dataSrc.txt",
 *        deferRender:    true,
 *        scrollY:        200,
 *        scrollCollapse: true,
 *        scroller:       true,
 *        keepConditions: {
 *          conditions: 'olfs',
 *          attachEvents: false
 *        }
 *    });
 */

"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KeepConditions = (function () {
    /**
     * KeepConditions Constructor
     *
     * This can be initiated automatically when the keepConditions setting is set in
     * the DT initiation settings, or by manually creating a new KeepConditions
     * instance via the 'new' keyword. When manually executing new KeepConditions(),
     * the user can pass either the DataTables instance, an API instance, or a CSS
     * selector for the DataTables instance, the DataTables settings and API are
     * extracted from any of the above.
     *
     * @param   {object}    dtSettings          DataTable settings object, Required to bind KC instance to
     *                                          specific DT instance
     * @var     {object}    _dtApi              DataTables API Instance
     * @var     {object}    _dtSettings         DT Settings
     * @var     {object}    _dtDefaults         DataTables default settings
     * @var     {array}     _enabledConditions  List of enabled conditions (As in conditions being kept via
     *                                          KeepConditions)
     */

    function KeepConditions(dtSettings) {
        _classCallCheck(this, KeepConditions);

        // Check that we were initiated on an actual DataTable (Either by selector,
        // a DT instance, or an API instance of a DT)
        if (!$.fn.DataTable.isDataTable(dtSettings) && !dtSettings instanceof $.fn.dataTable.Api) {
            throw new Error('Failed to initialize KeepConditions plugin on non-datatable object');
        }

        /**
         * Retrieve the DataTables API Instance
         */
        if (dtSettings instanceof $.fn.dataTable.Api) this._dtApi = dtSettings;else this._dtApi = new $.fn.dataTable.Api(dtSettings);

        /**
         * In case this was initiated via something like a CSS selector, reset the settings
         * via the API we know is legit
         */
        dtSettings = this._dtApi.settings()[0];

        /**
         * DataTables settings object for this DT instance
         */
        this._dtSettings = dtSettings;

        /**
         * Unique table ID of this DT Instance
         */
        this._tableId = $(this._dtApi.table().node()).attr('id');

        /**
         * DataTables default settings
         */
        this._dtDefaults = $.fn.dataTable.defaults;

        /**
         * Map of the condition keys to the condition names
         */
        this._keysToCons = this._keyMap();

        /**
         * Boolean value to determine if the table should be redrawn whenever
         * _drawTable( ) is called, should be set to true if any changes are made
         * to the table, and the table wasn't redrawn
         */
        this._shouldDraw = false;

        /**
         * List of enabled conditions, populated when DataTables is initiated
         */
        this._enabledConditions = [];

        /**
         * Just the namespace to attach/detach events from for DT events. This is added to the
         * DT Event namespace, so when we attach/detach functions from the 'draw.dt' event,
         * it's then 'draw.dt.keepConditions' (If defaulted)
         */
        this._eventNamespace = 'keepConditions';

        /**
         * Add this object to the DataTables setting object, so each table can have its own
         * unique KeepConditions object, this is what makes it possible to have multiple
         * tables using the plugin, on the same page
         */
        dtSettings.oKeepConditions = this;

        /**
         * Initiate the main KeepConditions plugin functionality, such as parsing the initial
         * URL hash value and implementing the results in the table, attaching the enabled
         * conditions to be managed to the associated Datatables events, etc etc.
         */
        this._init();
    }

    // -----------------------------------------------------------

    /**
     * (Hash) Query String
     *
     * Parse the url query-like string value of the URL hash. EG: #var1=val1&var2=val2
     * will result in {var1: 'val1', var2: 'val2'};
     *
     * @access  public
     * @return  object
     */

    _createClass(KeepConditions, [{
        key: '_init',

        // -----------------------------------------------------------

        /**
         * Initiate (Main KeepConditions Plugin Functions)
         *
         * Initiate the main KeepConditions plugin functionality, such as parsing the initial
         * URL hash value and implementing the results in the table, attaching the enabled
         * conditions to be managed to the associated Datatables events, etc etc.
         *
         * @access  private
         * @return  {void}
         */
        value: function _init() {
            // Enable any enabled/initiated settings/Extensions/Plugins
            this._collectEnabled();

            // Check if the events should be attached, they can be detached if the keepConditions
            // setting is an object, with 'attachEvents' set to false
            if (this._dtSettings.oInit.keepConditions === true || typeof this._dtSettings.oInit.keepConditions === 'string' || $.isArray(this._dtSettings.oInit.keepConditions) || $.isPlainObject(this._dtSettings.oInit.keepConditions) && (typeof this._dtSettings.oInit.keepConditions.attachEvents === 'undefined' || this._dtSettings.oInit.keepConditions.attachEvents === true)) this.attachEvents();

            // Parse the URL hash value, have each condition object process it's associated
            // hash element value, re-drawing the table accordingly
            this.processHash();
        }

        // -----------------------------------------------------------

        /**
         * Collect Enabled (Conditions)
         *
         * Set any conditions that are enabled in the keepConditions initial settings, by adding them
         * to the enabledConditions
         */

    }, {
        key: '_collectEnabled',
        value: function _collectEnabled() {
            var _this = this;

            // Loop through all available conditions, checking if enabled
            $.each(this.conditions(), function (sCondition, oCondition) {

                // Check if condition is enabled in plugin settings, and if the table was initialized
                // with said setting/extension/plugin (The latter is unique per condition, so each
                // condition object has it's own method to check if table was init with condition)
                if (!_this._isEnabled(sCondition) || !oCondition.isInit()) return;

                // Add it to the enabled conditions list/array
                _this.enableCondition(sCondition);
            });
        }

        // -----------------------------------------------------------

        /**
         * Map (Condition) Keys (To Condition Names)
         *
         * Executed by _keysToCons to basically map each conditions key to the condition name,
         * primarily used to associate the condition keys within the hash string to the condition
         * name themselves.
         *
         * @access  private
         * @return  {object}    Returns: { f: 'search', l: 'length', ... }
         */

    }, {
        key: '_keyMap',
        value: function _keyMap() {
            return (function (conditions) {
                var ret = {};

                $.each(conditions, function (name, con) {
                    ret[con.key] = name;
                });

                return ret;
            })(this.conditions());
        }

        // -----------------------------------------------------------

        /**
         * Is (Specific Condition) Enabled
         *
         * Check if a specific condition is enabled to be managed via KeepConditions
         * plugin. Condition(s) can be enabled if the DT setting 'keepConditions' is
         * simply 'true', which would enable all available conditions, or it can be
         * a string of condition keys, or an array of condition names, or an object,
         * which may contain a 'conditions' property, which can also be either an
         * array of enabled conditions, or a string of condition names, or if it is
         * undefined, then all available conditions are enabled.
         * Note: This does not validate if the associated setting/extension/plugin
         * is enabled within DataTables, but rather just set to be managed via
         * KeepConditions
         *
         * @param   {string}    condition   Condition name to validate
         * @access  private
         * @return  {boolean}
         */

    }, {
        key: '_isEnabled',
        value: function _isEnabled(condition) {
            var options = this._dtSettings.oInit.keepConditions;

            // If were verifying a condition status by the key...
            if (condition.length === 1) {
                // Attempt to get the name, if it fails, throw an error..
                var name = this.nameByKey(condition);

                if (!condition) throw new Error('Unable to find an existing condition with the key \'' + condition + '\'');

                // .. Otherwise, set the condition to the retreived name and continue
                condition = name;
            }
            // If were verifying by the name, and the name wasn't found...
            else if (this.conditions(condition) === false) {
                    throw new Error('Unable to find an existing condition with the name \'' + condition + '\'');
                }

            // Return the result based on the initial DT 'keepConditions' value, (Details on
            // logic process in the above DocBlock comment)
            return(
                // A) If the initial 'keepConditions' is 'true', just say yes to all conditions
                options === true
                // If its undefined (This should only happen if KeepConditions is being
                // initialized via manually executing: new KeepConditions( table )
                 || typeof options === 'undefined'
                // B) If the init config is a string of conditions (by keys)..
                 || typeof options === 'string' && options.indexOf(this.conditions(condition).key) !== -1
                // C) If the init config is an array of enabled conditions..
                 || $.isArray(options) && $.inArray(condition, options) !== -1
                // D) If the init configs 'conditions' property is an array of conditions..
                 || $.isPlainObject(options) && $.isArray(options.conditions) && $.inArray(condition, options.conditions) !== -1
                // E) If the init configs 'conditions' property is a string of conditions (by keys)..
                 || $.isPlainObject(options) && typeof options.conditions === 'string' && options.conditions.indexOf(this.conditions(condition).key) !== -1
            );
        }

        // -----------------------------------------------------------

        /**
         * Redraw the table
         *
         * This is mainly ran after all the onLoads have done for the conditions, instead of drawing the
         * table after each condition is loaded, they will set _shouldDraw to true, then execute this,
         * and this will check the _shouldDraw, then draw if necessary, and reset _shouldDraw.
         *
         * @param   {boolean}   force           Force the draw, regardless of the value of this._shouldDraw
         * @param   {boolean}   resetPaging     Reset the paging or not (Sending view to first page)
         * @access  private
         * @return  {void}
         */

    }, {
        key: '_drawTable',
        value: function _drawTable(force, resetPaging) {
            if (this._shouldDraw === true || force === true) {
                this._dtApi.draw(resetPaging === true);
                this._shouldDraw = false;
            }
        }

        // -----------------------------------------------------------

    }, {
        key: '_lang',
        value: function _lang(key, string) {}

        // -----------------------------------------------------------

        /**
         * Structure Hash (Conditions)
         *
         * Basically a non-static value of KeepConditions.structureHash(), mainly
         * used via the API Methods
         *
         * @param   {boolean}   retrieve        Return the hash value, as opposed
         *                                      to updating the URL hash
         * @access  public
         * @return  {void|string}   Either returns the hash string, or updates hash
         */

    }, {
        key: 'structureHash',
        value: function structureHash(retrieve) {
            return KeepConditions.structureHash(this._dtSettings, retrieve);
        }

        // -----------------------------------------------------------

        /**
         * Just return DT Settings
         */

    }, {
        key: 'dtSettings',
        value: function dtSettings() {
            return this._dtSettings;
        }

        // -----------------------------------------------------------

        /**
         * Attach (Condition Update) Events
         *
         * Attach the KeepConditions.structureHash() method to any DT events that may require the hash to
         * be updated (such as Col Reordering, Col Sort Order, Draw, etc)
         *
         * @access  public
         * @return  {void}
         */

    }, {
        key: 'attachEvents',
        value: function attachEvents() {
            var _this2 = this;

            var eventParams = {
                dtSettings: this._dtSettings
            },
                enabledConditions = this.getEnabledConditions();

            if (enabledConditions === false) throw new Error('No enabled conditions to attach to events');

            var conditions = this.conditions(enabledConditions);

            // Loop through all available conditions
            $.each(conditions, function (sCondition, oCondition) {
                // Attach the method that updates the hash, to the event associated with this condition
                _this2._dtApi.on(oCondition.event + '.' + _this2._eventNamespace, eventParams, KeepConditions.structureHash.bind(KeepConditions));
            });
        }

        // -----------------------------------------------------------

        /**
         * Detach (Condition Update) Events
         *
         * Detach the KeepConditions.structureHash() method to any DT events that may require the hash to
         * be updated (such as Col Reordering, Col Sort Order, Draw, etc)
         *
         * @access  public
         * @return  {void}
         */

    }, {
        key: 'detachEvents',
        value: function detachEvents() {
            var _this3 = this;

            var eventParams = {
                dtSettings: this._dtSettings
            },
                enabledConditions = this.getEnabledConditions();

            if (enabledConditions === false) throw new Error('No enabled conditions to attach to events');

            var conditions = this.conditions(enabledConditions);

            // Loop through all available conditions
            $.each(conditions, function (sCondition, oCondition) {
                // Check if condition is enabled in plugin settings, and if the table was initialized
                // with said setting/extension/plugin (The latter is unique per condition, so each
                // condition object has it's own method to check if table was init with condition)
                if (!_this3._isEnabled(sCondition) || !oCondition.isInit()) return;

                // Attach the method that updates the hash, to the event associated with this condition
                _this3._dtApi.off(oCondition.event + '.' + _this3._eventNamespace);
            });
        }

        // -----------------------------------------------------------

        /**
         * Detach (Hash Update from conditions) Event
         *
         * The KeepConditions.structureHash() method is attached to the events specified by the 'event' property
         * for each condition. This method can be used to detach that method from a specific DataTables event,
         * which can be specified by giving the condition (which then the event is retrieved), or the exact
         * DataTables event (ending in .dt, eg: draw.dt)
         *
         * @param   {string|array}     condition    Either an array if multiple, or string of single condition(s)
         *                                          or DT event(s)
         * @access  public
         * @return  {void}
         */

    }, {
        key: 'detachEvent',
        value: function detachEvent(condition) {
            var _this4 = this;

            if (typeof condition === 'undefined') {
                console.warn('No condition or event specified for KeepConditions.detachEvent(), nothing is getting detached');

                return;
            }

            // Retrieve the condition, also to make sure it exists
            var oCondition = this.conditions(condition);

            if (!oCondition) return false;

            var event;

            // Single condition or event
            if (typeof condition === 'string') {
                // If were given the exact event
                if (condition.endsWith('.dt')) event = condition;

                // If were given the condition to retrieve the event name from
                else event = oCondition.event;

                // Detach event callback
                this._dtApi.off(event, KeepConditions.structureHash.bind(KeepConditions));
            }

            // Multiple events or conditions
            else if ($.isArray(condition) && condition.length > 0) {
                    $.each(condition, function (i, c) {
                        // If were given the exact event
                        if (c.endsWith('.dt')) event = c;

                        // If were given the condition to retrieve the event name from, make sure it exists
                        else if (typeof oCondition[c] !== 'undefined') event = oCondition[c].event;

                            // Abort if we were given an incorrect condition
                            else throw new Error('Unknown condition specified: ' + c);

                        // Detach event callback
                        _this4._dtApi.off(event + '.' + _this4._eventNamespace);
                    });
                }

                // Whatever else
                else {
                        // If we were given something that wasnt caught
                        console.warn('Illegal parameter type for KeepConditions.detachEvent(), should be array or string, was: ', typeof condition === 'undefined' ? 'undefined' : _typeof(condition));
                    }
        }

        // -----------------------------------------------------------

        /**
         * Attach (Hash Update to conditions) Event
         *
         * Attach the KeepConditions.structureHash() method to one or more specific event(s), specified either
         * by the condition name (search, paging, etc) or the specific event itself (which should end with
         * '.dt', EG: draw.dt)
         *
         * @param   {string|array}     condition    Either an array if multiple, or string of single condition(s)
         *                                          or DT event(s)
         * @access  public
         * @return  {void}
         * @todo    Should 'this.enableCondition( sCondition );' be added? Dont think so
         */

    }, {
        key: 'attachEvent',
        value: function attachEvent(condition) {
            var _this5 = this;

            if (typeof condition === 'undefined') {
                console.warn('No condition or event specified for KeepConditions.attachEvent(), nothing is getting attached');

                return;
            }

            // Data handed to the jQuery event
            var eventParams = {
                dtSettings: this._dtSettings
            };

            // Retrieve the condition, also to make sure it exists
            var oCondition = this.conditions(condition);

            if (!oCondition) return false;

            var event;

            //this._dtApi.on( oCondition.event, eventParams, KeepConditions.structureHash.bind( KeepConditions ) );

            // Single condition or event
            if (typeof condition === 'string') {
                // If were given the exact event
                if (condition.endsWith('.dt')) event = condition;

                // If were given the condition to retrieve the event name from
                else event = oCondition.event;

                // Detach event callback
                this._dtApi.on(event, eventParams, KeepConditions.structureHash.bind(KeepConditions));
            }

            // Multiple events or conditions
            else if ($.isArray(condition) && condition.length > 0) {
                    $.each(condition, function (i, c) {
                        // If were given the exact event
                        if (c.endsWith('.dt')) event = c;

                        // If were given the condition to retrieve the event name from, make sure it exists
                        else if (typeof oCondition[c] !== 'undefined') event = oCondition[c].event;

                            // Abort if we were given an incorrect condition
                            else throw new Error('Unknown condition specified: ' + c);

                        // Detach event callback
                        _this5._dtApi.on(event + '.' + _this5._eventNamespace, KeepConditions.structureHash.bind(KeepConditions));
                    });
                }

                // Whatever else
                else {
                        // If we were given something that wasn't caught
                        console.warn('Illegal parameter type for KeepConditions.attachEvent(), should be array or string, was: ' + (typeof condition === 'undefined' ? 'undefined' : _typeof(condition)));
                    }
        }

        // -----------------------------------------------------------

        /**
         * Process (Initial) URL Hash
         *
         * This is executed after KeepConditions has been initiated by DataTables, any conditions
         * found in the URL hash will be parsed by the conditions onLoad( ) method (If the condition
         * is enabled/initiated), then the table will be redrawn (if needed)
         *
         * @access  public
         * @return  {void}
         */

    }, {
        key: 'processHash',
        value: function processHash() {
            var _this6 = this;

            // Loop through each element in the hash, until we find an element whos key matches the table ID
            $.each(KeepConditions.queryString(), function (table, cons) {
                // If somehow thers more than one condition for this table, just take the first one..
                if ($.isArray(cons) || $.isPlainObject(cons)) cons = cons[0];

                // Skip to the next hash element if this one isn't for the current table
                if (table !== _this6._tableId) return;

                // Loop through each condition within the Hash, which is delimited by :
                $.each(cons.split(':'), function (i, c) {
                    var conKey = c.charAt(0),
                        conVal = c.substring(1),
                        conName = _this6.nameByKey(conKey),
                        oCondition = _this6.conditions()[conName];

                    // Skip condition if its not enabled
                    if ($.inArray(conName, _this6.getEnabledConditions()) === -1) return;

                    if (typeof oCondition === 'undefined') {
                        console.warn('[keepConditions:\' ' + _this6._tableId + '] No condition object found for condition key:', conKey);
                        return;
                    }

                    // Have the condition object parse the hash
                    oCondition.onLoad(conVal);
                });

                // Draw the table if needed
                _this6._drawTable();
            });
        }

        // -----------------------------------------------------------

        /**
         * Enable Condition(s)
         *
         * Enable condition(s) to be managed via KeepConditions plugin - Basically just adds the condition(s) to
         * this._enabledConditions. Conditions can be specified by either the full name,
         * or the single character condition key
         *
         * @param   {string|array}  condition       DataTables condition(s) to enable, condition(s) can be
         *                                          specified either by the full name, or the condition key
         * @param   {boolean}       structureHash   Restructure the hash after said condition has been enabled
         * @access  public
         * @return  {void}
         */

    }, {
        key: 'enableCondition',
        value: function enableCondition(condition, structureHash) {
            var _this7 = this;

            var done = false;

            // Process multiple conditions to enable
            if ($.isArray(condition)) {
                $.each(condition, function (i, c) {
                    // If its a key, then get the name from the key
                    if (c.length === 1) c = _this7.nameByKey(c);

                    if (_this7.conditions(c) !== false) {
                        _this7._enabledConditions.push(c);

                        done = true;
                    }
                });
            } else if (typeof condition === 'string') {
                // If its a key, then get the name from the key
                if (condition.length === 1) condition = this.nameByKey(condition);

                if (this.conditions(condition) !== false) {
                    this._enabledConditions.push(condition);

                    done = true;
                }
            }

            // If a condition was successfully enabled, and were requested to update the hash, do eeet!
            if (structureHash === true && done === true) KeepConditions.structureHash(this._dtSettings, false);
        }

        // -----------------------------------------------------------

        /**
         * Disable Condition(s)
         *
         * Disable condition(s) from being managed via KeepConditions plugin - Basically just removes the
         * condition(s) from this._enabledConditions. Conditions can be specified by either the full name,
         * or the single character condition key
         *
         * @param   {string|array}  condition       DataTables condition(s) to disable, condition(s) can be
         *                                          specified either by the full name, or the condition key
         * @param   {boolean}       structureHash   Restructure the hash after said condition has been disabled
         * @access  public
         * @return  {void}
         */

    }, {
        key: 'disableCondition',
        value: function disableCondition(condition, structureHash) {
            var _this8 = this;

            var done = false;

            // Process multiple conditions to disable
            if ($.isArray(condition)) {
                $.each(condition, function (i, c) {
                    // If its a key, then get the name from the key
                    if (c.length === 1) c = _this8.nameByKey(c);

                    if (_this8.conditions(c) !== false) {
                        _this8._enabledConditions.splice($.inArray(c, _this8._enabledConditions), 1);

                        done = true;
                    }
                });
            } else if (typeof condition === 'string') {
                // If its a key, then get the name from the key
                if (condition.length === 1) condition = this.nameByKey(condition);

                if (this.conditions(condition) !== false) {
                    this._enabledConditions.splice($.inArray(condition, this._enabledConditions), 1);

                    done = true;
                }
            }

            // If a condition was successfully disabled, and were requested to update the hash, do eeet!
            if (structureHash === true && done === true) KeepConditions.structureHash(this._dtSettings, false);
        }

        // -----------------------------------------------------------

        /**
         * Get Enabled Conditions
         *
         * Returns a list of conditions being managed via plugin
         *
         * @access  public
         * @return  {array|boolean}     Array of conditions being kept, or false if none
         */

    }, {
        key: 'getEnabledConditions',
        value: function getEnabledConditions() {
            return this._enabledConditions.length > 0 ? $.unique(this._enabledConditions) : false;
        }

        // -----------------------------------------------------------

        /**
         * Condition Name by Key
         *
         * Return the name of a condition (search, length, colorder), given the key (f, l, c). Useful for
         * when referencing conditions using the keys from the hash value
         *
         * @param   {string}    key     Key of condition (Single alpha value, usually first name of
         *                              condition, but not always)
         * @access  public
         * @return  {string}    Full condition name (name of condition within this.conditions( ) obj)
         */

    }, {
        key: 'nameByKey',
        value: function nameByKey(key) {
            return this._keysToCons[key] || false;
        }

        // -----------------------------------------------------------

        /**
         * Conditions Manager
         *
         * Manages the object that contains the primary functionality for managing conditions,
         * such as checkinf if the condition is enabled via DT, checking if the plugin/extension
         * is initiated (if required), checking if hash value is set and valid, creating new hash
         * value, etc etc
         *
         * @param   {string|array|null}     con     Either string of single condition, or array of
         *                                          conditions, or null for all conditions
         * @access  public
         * @return  {object}    Object of objects (conditions)
         */

    }, {
        key: 'conditions',
        value: function conditions(con) {
            var _this9 = this;

            var _parent = this;

            /**
             * Main conditions object
             *
             * Each object within this object should be a unique condition that can be
             * managed via KeepConditions. The keys need to be the name of the values
             * stored within the DT initiation setting 'keepConditions', should conditions
             * be specified, instead of just 'true'
             */
            var conditions = {
                /**
                 * Table searching (aka Filtering) condition
                 */
                search: {
                    // Hash Key
                    key: 'f',

                    // Event to trigger the hash update for
                    event: 'search.dt',

                    // Check if condition is setup on table
                    isInit: function isInit() {
                        return typeof _parent._dtSettings.oInit.searching === 'undefined' || _parent._dtSettings.oInit.searching !== false;
                    },

                    // Function to check if a condition exists in the hash, and to process it
                    onLoad: function onLoad(hashComponent) {
                        if (typeof hashComponent !== 'undefined' && _parent._dtApi.search() !== decodeURIComponent(hashComponent)) {
                            _parent._dtApi.search(decodeURIComponent(hashComponent));
                            _parent._shouldDraw = true;
                        }
                    },

                    // Check if a value for this condition is currently set for the table (and not at default)
                    isset: function isset() {
                        return _parent._dtApi.search().length !== 0;
                    },

                    // Return the new value to be stored in the hash for this conditions component
                    newHashVal: function newHashVal() {
                        return encodeURIComponent(_parent._dtApi.search());
                    }
                },

                /**
                 * Condition: Length
                 *
                 * @todo Check if the hash value is an existing value in the page length list
                 */
                length: {
                    // Hash Key
                    key: 'l',

                    // Event to trigger the hash update for
                    event: 'length.dt',

                    // Check if condition is setup on table
                    isInit: function isInit() {
                        return !(_parent._dtSettings.oInit.lengthChange === false || typeof _parent._dtSettings.oInit.lengthChange === 'undefined' && _parent._dtDefaults.bLengthChange === false);
                    },

                    // Function to check if a condition exists in the hash, and to process it
                    onLoad: function onLoad(hashComponent) {
                        if (typeof hashComponent !== 'undefined') {
                            _parent._dtApi.page.len(parseInt(hashComponent));

                            _parent._shouldDraw = true;
                        }
                    },

                    // Check if a value for this condition is currently set for the table (and not at default)
                    isset: function isset() {
                        return _parent._dtApi.page.len() && _parent._dtApi.page.len() !== (_parent._dtSettings.oInit.pageLength || _parent._dtDefaults.iDisplayLength);
                    },

                    // Return the new value to be stored in the hash for this conditions component
                    newHashVal: function newHashVal() {
                        return _parent._dtApi.page.len();
                    }
                },

                /**
                 * Pagination
                 */
                page: {
                    // Hash Key
                    key: 'p',

                    // Event to trigger the hash update for
                    event: 'page.dt',

                    // Check if condition is setup on table
                    isInit: function isInit() {
                        return !(_parent._dtSettings.oInit.paging === false || typeof _parent._dtSettings.oInit.paging === 'undefined' && _parent._dtDefaults.bPaginate === false);
                    },

                    // Function to check if a condition exists in the hash, and to process it
                    onLoad: function onLoad(hashComponent) {
                        if (typeof hashComponent !== 'undefined' && parseInt(hashComponent) !== 0) {
                            _parent._dtApi.page(parseInt(hashComponent));

                            _parent._shouldDraw = true;
                        }
                    },

                    // Check if a value for this condition is currently set for the table (and not at default)
                    isset: function isset() {
                        return _parent._dtApi.page.info() && _parent._dtApi.page.info().page !== 0;
                    },

                    // Return the new value to be stored in the hash for this conditions component
                    newHashVal: function newHashVal() {
                        return _parent._dtApi.page.info().page;
                    }
                },

                /**
                 * Column Visibility
                 */
                colvis: {
                    // Hash Key
                    key: 'v',

                    // Event to trigger the hash update for
                    event: 'column-visibility.dt',

                    // Colvis is always true, since it's actually just a column setting, nothing more
                    isInit: function isInit() {
                        return true;
                    },

                    // Function to check if a condition exists in the hash, and to process it
                    onLoad: function onLoad(hashComponent) {
                        if (typeof hashComponent !== 'undefined') {
                            var _ret = (function () {
                                var isVis = hashComponent.charAt(0),
                                    columns = hashComponent.substring(1).split('.');

                                // If the header was messed with, just skip the col vis
                                if (isVis !== 'f' && isVis !== 't') {
                                    console.warn('Unknown ColVis condition visibility value, expected t or f, found:', isVis);
                                    return {
                                        v: undefined
                                    };
                                }

                                _parent._dtApi.columns().indexes().each(function (value, index) {
                                    // Parse as visible list
                                    if (isVis === 't') {
                                        if ($.inArray(value.toString(), columns) === -1) _parent._dtApi.column(value).visible(false);else _parent._dtApi.column(value).visible(true);
                                    }
                                    // Parse as hidden list
                                    else {
                                            if ($.inArray(value.toString(), columns) === -1) _parent._dtApi.column(value).visible(true);else _parent._dtApi.column(value).visible(false);
                                        }
                                });

                                _parent._shouldDraw = true;
                            })();

                            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                        }
                    },

                    // Check if a value for this condition is currently set for the table (and not at default)
                    isset: function isset() {
                        return _parent._dtApi.columns().visible().filter(function (v) {
                            return !v;
                        }).any();
                    },

                    // Return the new value to be stored in the hash for this conditions component
                    newHashVal: function newHashVal() {
                        var t = [],
                            // visible
                        f = []; // hidden

                        // Add the visible col indexes to t, and hidden to f
                        _parent._dtApi.columns().visible().each(function (value, index) {
                            if (value === true) t.push(index);else f.push(index);
                        });

                        // If nothings hidden, don't update the hash
                        // @todo What if columns are hidden by default? And viewer wants to unhide all
                        //if ( f.length === 0 ) return false;

                        // If visible column count is greater, then use non-vis
                        if (t.length >= f.length) return 'f' + f.join('.');

                        // Otherwise, use visible count
                        return 't' + t.join('.');
                    }
                },

                /**
                 * Scroller Extension
                 *
                 * Scroll position of the DT instance
                 */
                scroller: {
                    // Hash Key
                    key: 's',

                    // Scroller is ran on every draw event
                    event: 'draw.dt',

                    // Check if condition is setup on table
                    isInit: function isInit() {
                        return typeof _parent._dtSettings.oScroller !== 'undefined';
                    },

                    // Function to check if a condition exists in the hash, and to process it
                    onLoad: function onLoad(hashComponent) {
                        if (parseInt(hashComponent) !== 0) _parent._dtApi.row(parseInt(hashComponent)).scrollTo();

                        // No redraw necessary for scroller
                    },

                    // Check if a value for this condition is currently set for the table (and not at default)
                    isset: function isset() {
                        return Math.trunc(parseInt(_parent._dtSettings.oScroller.s.baseRowTop)) !== 0;
                    },

                    // Return the new value to be stored in the hash for this conditions component
                    newHashVal: function newHashVal() {
                        var scrollPos = Math.trunc(parseInt(_parent._dtSettings.oScroller.s.baseRowTop));

                        return scrollPos !== 0 ? scrollPos : false;
                    }
                },

                /**
                 * Column Sequence Order
                 *
                 * Order of columns as seen in header of table
                 */
                colorder: {
                    // Hash Key
                    key: 'c',

                    // Event to trigger the hash update for
                    event: 'column-reorder.dt',

                    // Check if setting/extension/plugin is setup on table
                    isInit: function isInit() {
                        return typeof _parent._dtSettings._colReorder !== 'undefined';
                    },

                    // Function to check if a condition exists in the hash, and to process it
                    onLoad: function onLoad(hashComponent) {
                        var preSeq = hashComponent.split('.'),
                            res = [];

                        // Check for any array items that are sequences (eg: 2-6)
                        $.each(preSeq, function (is, s) {
                            if (s.indexOf('-') !== -1) {
                                var spl = s.split('-'),
                                    a = parseInt(spl[0]),
                                    b = parseInt(spl[1]);
                                if (a > b) for (var i = a; b < i + 1; i--) {
                                    res.push(i);
                                } else for (var i = a; b > i - 1; i++) {
                                    res.push(i);
                                }
                            } else {
                                res.push(s);
                            }
                        });

                        var hashColOrder = res.map(function (i) {
                            return parseInt(i);
                        });

                        // @todo remove after fixing init issue
                        if (typeof _parent._dtApi.colReorder === 'undefined') return false;

                        if (JSON.stringify(hashColOrder) !== JSON.stringify(_parent._dtApi.colReorder.order())) {
                            _parent._dtApi.colReorder.order(hashColOrder, true);

                            _parent._shouldDraw = true;
                        }
                    },

                    // Check if a value for this condition is currently set for the table (and not at default)
                    isset: function isset() {
                        // @todo remove after fixing init issue
                        if (typeof _parent._dtApi.colReorder === 'undefined') return false;

                        return JSON.stringify(_parent._dtApi.colReorder.order()) !== JSON.stringify(_parent._dtApi.columns().indexes().toArray());
                    },

                    // Return the new value to be stored in the hash for this conditions component
                    newHashVal: function newHashVal() {
                        var sequence = _parent._dtApi.colReorder.order(),

                        // Temp var used to store the previous number, reset on every iteration
                        prev = undefined,

                        // Gets joined by '.' on return
                        result = [],

                        // Current collection if sequenced numbers
                        collection = [],

                        // Return the number in the collection that is i spaces from the end
                        lastInCol = function lastInCol(i) {
                            return collection[collection.length - i];
                        },

                        // Compile the collection (If > 2 characters, then it adds 'first-last',
                        // if its just two characters, then it adds 'first.second'). Then empty
                        // the collection array, and return the newly constructed string
                        compileColl = function compileColl() {
                            var ret = undefined;

                            if (collection.length === 2) ret = collection[0] + '.' + collection[1];else ret = collection[0] + '-' + lastInCol(1);

                            collection = [];
                            return ret;
                        };

                        // Shorten the sequence of numbers (Converting something like
                        // 1, 2, 3, 4 to 1-4, going in both directions
                        $.each(sequence, function (i, s) {
                            s = parseInt(s);

                            // First one just gets added to result
                            if (typeof prev === 'undefined') {
                                result.push(s);
                            }
                            // Anything after the first..
                            else {
                                    // If were on a roll with the sequence..
                                    if (collection.length > 0) {
                                        // Check if were in sequence with the collection (Going positive)
                                        if (lastInCol(1) > lastInCol(2) && s === lastInCol(1) + 1) {
                                            collection.push(s);
                                        }
                                        // Check if were in sequence with the collection (Going negative)
                                        else if (lastInCol(1) < lastInCol(2) && s === lastInCol(1) - 1) {
                                                collection.push(s);
                                            }
                                            // Were running a collection, but this number isnt in sequence, so
                                            // terminate the collection and add the collection and the current
                                            // int to the result array
                                            else {
                                                    result.push(compileColl());
                                                    result.push(s);
                                                }
                                    }
                                    // Otherwise, check if we should start a sequence..
                                    else {
                                            // If this int and the prev are sequential in either direction,
                                            // start the collection
                                            if (s === prev + 1 || s === prev - 1) {
                                                // Pull the last item from the result
                                                result.splice(result.length - 1, 1);
                                                // add it to the collection
                                                collection.push(prev);
                                                collection.push(s);
                                            }
                                            // This number isnt in sequence with the last one, so dont start
                                            // a collection
                                            else {
                                                    result.push(s);
                                                }
                                        }
                                }

                            prev = s;
                        });

                        // Once the $.each loop is done, we need to ensure that
                        // there's no leftover collection numbers
                        if (collection.length > 0) result.push(compileColl());

                        // Result should convert something like '[9,1,2,3,4,8,6,5,0]' to '9.1-4.8-5.0',
                        // which is easily kept in the URL, and converted back later
                        return result.join('.');
                    }
                },

                /**
                 * Column Sorting Order
                 *
                 * Order condition (As in the sorting direction, NOT same as colorder)
                 */
                order: {
                    // Hash Key
                    key: 'o',

                    // Event to trigger the hash update for
                    event: 'order.dt',

                    // Check if at least one column is sortable
                    isInit: function isInit() {
                        var result = false;

                        // Loop through the columns, as soon as one is found to be sortable,
                        // set result to true, and quit the each loop
                        $.each(_this9._dtSettings.aoColumns, function (colIndx, col) {
                            if (col.bSortable === true) {
                                result = true;
                                return false;
                            }
                        });

                        return result;
                    },

                    // Function to check if a condition exists in the hash, and to process it
                    onLoad: function onLoad(hashComponent) {
                        if (typeof hashComponent !== 'undefined') {
                            // Direction keys
                            var dir = { a: 'asc', d: 'desc' };

                            // @todo Should maybe check if the order found is current order?...

                            // Execute the api method to order the column accordingly
                            _parent._dtApi.order([parseInt(hashComponent.substring(1)), dir[hashComponent.charAt(0)]]);

                            _parent._shouldDraw = true;
                        }
                    },

                    // Check if an order is set - and its not the default order
                    isset: function isset() {
                        return _parent._dtApi.order()[0] && JSON.stringify(_parent._dtApi.order()) !== JSON.stringify($.fn.dataTable.defaults.aaSorting);
                    },

                    // Return the new value to be stored in the hash for this conditions component
                    newHashVal: function newHashVal() {
                        return _parent._dtApi.order()[0][1].charAt(0) + _parent._dtApi.order()[0][0];
                    }
                }
            };

            // If retrieving a single condition - Return conditions object without the condition
            // name as key
            if (typeof con === 'string') {
                // Make sure the condition exists
                if (typeof conditions[con] === 'undefined') return false;
                //throw new Error (`Unable to retrieve condition by name: ${con}`);

                return conditions[con];
            }

            // Retrieving an array of conditions - Return an object with condition names as keys
            else if ($.isArray(con) && con.length > 0) {
                    var result = {};

                    $.each(con, function (i, c) {
                        if (typeof conditions[c] === 'undefined') throw new Error('Unable to retrieve condition by name: ' + c);

                        result[c] = conditions[c];
                    });

                    return result;
                }

            // Return all conditions if nothing was requested specifically
            return conditions;
        }
    }], [{
        key: 'queryString',
        value: function queryString() {
            var queryString = {},
                query = window.location.hash.substring(1),
                vars = query.split("&");

            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                // If first entry with this name
                if (typeof queryString[pair[0]] === 'undefined') queryString[pair[0]] = pair[1];else
                    // If second entry with this name
                    if (typeof queryString[pair[0]] === "string") queryString[pair[0]] = [queryString[pair[0]], pair[1]];

                    // If third or later entry with this name
                    else queryString[pair[0]].push(pair[1]);
            }

            return queryString || false;
        }

        // -----------------------------------------------------------

        /**
         * Structure Hash
         *
         * This is the function that's called when any of the events stored in each
         * condition object gets triggered. There are two variables added to the
         * data of the event object, 'dtApi' and 'dtSettings', explained below.
         * Since this is a static member, any unique table-related data must be
         * handed to it
         *
         * @param   {object}    e_dtSettings    jQuery event (containing data for
         *                                      dtSettings) or dtSettings itself
         * @param   {boolean}   retrieve        Return the hash value, as opposed
         *                                      to updating the URL hash
         * @var     {object}    dtSettings      DataTables instance settings object
         * @var     {object}    dtApi           DataTables instance API object
         * @access  public
         * @return  {void|string}   Either returns the hash string, or updates hash
         */

    }, {
        key: 'structureHash',
        value: function structureHash(e_dtSettings, retrieve) {
            var dtSettings;

            if (!e_dtSettings) throw new Error('Illegal execution of KeepConditions.structureHash()');

            // If we were handed a KeepConditions object, extract the dtSettings from that
            if (e_dtSettings instanceof KeepConditions) dtSettings = e_dtSettings.dtSettings();

            // If this is from a jQuery event, then the data should be handed to us
            else if (typeof e_dtSettings.type !== 'undefined' && typeof e_dtSettings.data.dtSettings !== 'undefined') dtSettings = e_dtSettings.data.dtSettings;

                // If we were handed an instance of the DataTables API, we can get the settings from that
                else if (e_dtSettings instanceof $.fn.dataTable.Api) dtSettings = e_dtSettings.settings()[0];

                    // If its just a Table selector or something, get the new API instance
                    else if ($.fn.DataTable.isDataTable(e_dtSettings)) dtSettings = new $.fn.dataTable.Api(e_dtSettings).settings()[0];else if ($.isPlainObject(e_dtSettings) && _typeof($.isPlainObject(e_dtSettings.oKeepConditions))) dtSettings = e_dtSettings;

                        // Nothing else should be accepted, since the dtSettings is required
                        else throw new Error('Unable to determine what you passed to KeepConditions.structureHash(), should be either an instance of KeepConditions, a proper jQuery event, or a DataTable instance with keepConditions enabled');

            var dtApi = new $.fn.dataTable.Api(dtSettings),
                dtOptions = dtSettings.oInit,
                conditions = dtSettings.oKeepConditions.getEnabledConditions(),
                hashParsed = KeepConditions.queryString(),
                tableID = $(dtApi.table().node()).attr('id'),
                hash = {},
                // End result hash (will be processed into URL hash)
            tableHash = [],
                // The conditions for THIS table
            urlHash = []; // Gets joined by &

            if (typeof conditions === 'undefined' || conditions === false) throw new Error('Couldn\'t get conditions from table settings');

            // Grab all the existing hashes - to carefully not disturb any conditions NOT for this table
            $.each(hashParsed, function (table, cons) {
                // @todo Might still want to continue if !cons, to clear conditions
                if (!table && !cons) return;

                // If this id isn't this table, store the hash and move on
                if (table !== tableID) hash[table] = cons || '';

                // Were ignoring THIS table id because were going to re-create it
            });

            // Loop through each enabled condition, setting the new hash value, if needed
            $.each(conditions, function (i, c) {
                if (dtSettings.oKeepConditions.conditions()[c].isset()) {
                    var conHashVal = dtSettings.oKeepConditions.conditions()[c].newHashVal();

                    // Prevent any elements from being added as - vfundefined:sundefined:oundefined, etc
                    if (typeof conHashVal !== 'undefined' && conHashVal !== false) tableHash.push(dtSettings.oKeepConditions.conditions()[c].key + conHashVal);
                }
            });

            hash[tableID] = tableHash.join(':');

            $.each(hash, function (table, conditions) {
                if (conditions.length > 0) urlHash.push(table + '=' + conditions);
            });

            var newHash = urlHash.join('&');

            // If were just retrieving the hash, then return it...
            if (retrieve === true) return newHash;

            // Otherwise, update the URL Hash. If there is no hash value to update,
            // then just set an underscore, to prevent the page from scrolling to
            // the top
            window.location.hash = newHash || '_';
        }
    }]);

    return KeepConditions;
})();

(function (window, document, $, undefined) {
    // Setting defaults
    $.extend(true, $.fn.dataTable.defaults, {
        language: {
            // Default button related text values
            keepConditions: {
                button: {
                    // When the URL is successfully sent to clipboard
                    btnCopyTitle: 'URL Copied',
                    btnCopyBody: 'The URL with the DataTables conditions has been ' + 'copied to your clipboard',
                    // When clipboard interaction failed, and user needs to manually
                    // copy the selected text in the input
                    btnSelectTitle: 'Copy URL',
                    btnSelectBody: 'Copy be below input to easily share the URL'
                }
            }
        }
    });

    // Auto-initialize KeepConditions on tables having it configured
    $(document).on('init.dt', function (e, dtSettings) {
        if (e.namespace !== 'dt') return;

        if (dtSettings.oInit.keepConditions !== undefined) new KeepConditions(dtSettings);
    });

    /**
     * Attach Events
     *
     * Attach the structureHash method to a DataTables event associated with one or more specified
     * conditions. This will have the URL Hash updated whenever that event is triggered.
     *
     * @param   {string|array}  conditions  Conditions to retrieve events from
     * @return  {object}        DataTables API
     */
    $.fn.dataTable.Api.register('keepConditions.attachEvents()', function (conditions) {
        return this.iterator('table', function (dtSettings) {
            return dtSettings.oKeepConditions.attachEvents();
        });
    });

    /**
     * Detach Events
     *
     * Detach the structureHash method to a DataTables event associated with one or more specified
     * conditions. This will have the URL Hash updated whenever that event is triggered.
     *
     * @param   {string|array}  conditions  Conditions to retrieve events from
     * @return  {object}        DataTables API
     */
    $.fn.dataTable.Api.register('keepConditions.detachEvents()', function (conditions) {
        return this.iterator('table', function (dtSettings) {
            return dtSettings.oKeepConditions.detachEvents();
        });
    });

    /**
     * Structure Hash
     *
     * Structure the hash value for the current conditions on the associated table, and either update
     * the URL hash, or just return the hash string itself.
     *
     * @param   {boolean}   returnHash      Return the hash string (if true), or update the URL hash
     * @return  {string|null}               If returnHash is true, then the hash string is returned
     */
    $.fn.dataTable.Api.register('keepConditions.structureHash()', function (returnHash) {
        return this.context[0].oKeepConditions.structureHash(returnHash);
    });

    /**
     * Enable Condition(s)
     *
     * Enable one or more conditions, which can be specified by the condition key or condition name,
     * and optionally update the URL hash after the condition(s) have been enabled (Adding the settings
     * for the newly enabled condition(s) to the hash).
     *
     * @param   {string|array}  condition   Condition(s) to enable
     * @param   {boolean}       updateHash  If true, the URL hash will be updated
     * @return  {object}        DataTables API
     */
    $.fn.dataTable.Api.register('keepConditions.enableCondition()', function (condition, updateHash) {
        return this.iterator('table', function (dtSettings) {
            return dtSettings.oKeepConditions.enableCondition(condition, updateHash);
        });
    });

    /**
     * Disable Condition(s)
     *
     * Disable one or more conditions, which can be specified by the condition key or condition name,
     * and optionally update the URL hash after the condition(s) have been disabled (removing the settings
     * for the newly disabled condition(s) from the hash).
     *
     * @param   {string|array}  condition   Condition(s) to enable
     * @param   {boolean}       updateHash  If true, the URL hash will be updated
     * @return  {object}        DataTables API
     */
    $.fn.dataTable.Api.register('keepConditions.disableCondition()', function (condition, updateHash) {
        return this.iterator('table', function (dtSettings) {
            return dtSettings.oKeepConditions.disableCondition(condition, updateHash);
        });
    });

    /**
     * Copy Conditions Button
     *
     * This button will attempt to copy the URL with the current table conditions, if the copy
     * fails (which it will in some browsers), then a simple input is shown with the contents
     * being the URL, which should also be selected, the viewer then just has to copy the
     * contents. The URL in the input is not taken from the current document location, because
     * if the hash in the URL is not currently up-to-date, then it may not be the correct version,
     * thus, the KeepConditions.structureHash() is used to retrieve the current hash. The timeouts
     * for the alert dialogs can be configured, as well as the button text and the dialog texts
     */
    $.fn.dataTable.ext.buttons.copyConditions = {
        text: 'Copy Conditions',
        action: function action(e, dt, node, config) {
            var dtLanguage = dt.settings()[0].oLanguage.keepConditions,
                conditionsHash = dt.settings()[0].oKeepConditions.structureHash(true),
                copyThis = document.location.protocol + '//' + document.location.host + (document.location.port.length ? ':' + document.location.port : '') + document.location.pathname + '#' + conditionsHash,
                success,
                language = {
                btnNoHashTitle: dtLanguage.btnNoHashTitle || 'No Conditions',
                btnNoHashBody: dtLanguage.btnNoHashBody || 'Thre are no conditions to be copied',
                btnCopyTitle: dtLanguage.btnCopyTitle || 'URL Copied',
                btnCopyBody: dtLanguage.btnCopyBody || 'The URL with the DataTables conditions has been copied to your clipboard',
                btnSelectTitle: dtLanguage.btnSelectTitle || 'Copy URL',
                btnSelectBody: dtLanguage.btnSelectBody || 'Copy be below input to easily share the URL'
            };

            // If there were no conditions to be copied, then show a notification and don't copy anything
            if (!conditionsHash) {
                dt.buttons.info(language.btnNoHashTitle, language.btnNoHashBody, 3000);

                return;
            }

            // Create the input that will hold the text to select/copy, move it off screen
            $('<input />').val(copyThis).attr('id', 'copyConditions-text').css({
                position: 'absolute',
                left: '-9999px',
                top: (window.pageYOffset || document.documentElement.scrollTop) + 'px'
            }).appendTo('body');

            // Attempt to select the contents (which should be the current URL)
            $('#copyConditions-text').select();

            // Try to execute a 'copy' command, which if successful, show the DT info dialog
            // with a notice
            try {
                document.execCommand('copy');

                dt.buttons.info(language.btnCopyTitle, language.btnCopyBody, config.copyTimeout || 4000);

                success = true;
            }
            // If the copy command was unsuccessful, then show a DT info dialog with an input
            // box, containing the URL
            catch (err) {
                dt.buttons.info(language.btnSelectTitle, language.btnSelectBody + '<br><input id="keepConditions-input" value="' + copyThis + '" style="width:90%;">', config.selectTimeout || 10000);

                // Try to select the contents to make it easier
                $('input#keepConditions-input').select();
            } finally {
                // Remove the select input once this has finished
                $("#copyConditions-text").remove();
            }
        }
    };
})(window, document, jQuery);