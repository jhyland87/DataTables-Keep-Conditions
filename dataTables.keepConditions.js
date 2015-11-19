/**
 * @summary     KeepConditions
 * @description Store the status of the DataTable within the URL, making
 *              sharing the exact page/length/etc via copy/paste possible
 * @version     1.1.0
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
 *      Pagination
 *      Page Length
 *      Table Searching
 *      Column Ordering
 *      Scroller Extension ( http://datatables.net/extensions/scroller/ )
 *      Column Visibility ( http://datatables.net/reference/button/colvis )
 *
 * @example
 *    // Basic Initialization (All conditions by default)
 *    $('#example').DataTable({
 *        keepConditions: true
 *    });
 *
 * @example
 *    // Advanced Initialization (Selecting all conditions individually)
 *    $('#example').DataTable({
 *        keepConditions: {
 *           page:      true,
 *           length:    true,
 *           search:    true,
 *           order:     true
 *        }
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
 *           page:      false,
 *           length:    true,
 *           search:    true,
 *           order:     true,
 *           scroller:  true
 *        }
 *    });
 *
 */

(function(window, document, $, undefined) {
    var _dtSettings;

    // Process the URL hash into an object
    function _queryString(){
        var _queryString = {};
        var query        = window.location.hash.substring( 1 );
        var vars         = query.split("&");

        for ( var i = 0; i < vars.length; i++)	{
            var pair = vars[ i ].split ( "=");
            // If first entry with this name
            if ( _queryString[ pair [ 0 ] ] === undefined) {
                _queryString[ pair [ 0 ] ] = pair [ 1 ];
                // If second entry with this name
            } else if ( typeof _queryString [ pair [ 0 ] ] === "string") {
                _queryString[ pair [ 0 ] ] = [ _queryString [ pair [ 0 ] ], pair[ 1 ] ];
                // If third or later entry with this name
            } else {
                _queryString[ pair [ 0 ] ].push ( pair [1 ]);
            }
        }

        return _queryString || false;
    }

    // Check if a specific condition is enabled for a specific table
    function _isEnabled( setting ){
        return ( _dtSettings.oInit.keepConditions === true || _dtSettings.oInit.keepConditions[ setting ] === true );
    }

    // Update the URL hash by processing the DT instance settings (page,
    // length, search, etc) and setting the URL hash string value
    // @todo Something tells me this is going to need improvement
    function _updateHash( e ){
        var api         = e.data.api,
            options     = e.data.options,
            tableID     = $( api.table().node() ).attr('id'),
            hash        = {}, // End result hash (will be processed into URL hash)
            tableHash   = [], // The conditions for THIS table
            urlHash     = []; // Gets joined by &

        // Grab all the existing hashes - to carefuly not disturb any conditions NOT for this table
        $.each(_queryString(), function(table, cons){

            if ( ! table && ! cons ) return;

            // If this id isn't this table, store the hash and move on
            if ( table !== tableID ){
                hash[ table ] = cons || '';
            }
            // Were ignoring THIS table id because were going to re-create it
        });

        // Only set the order if the current order isn't the default order
        // (taking into account the possibility of a custom setting)
        if ( _isEnabled( 'order' )
            && api.order()[0]
            && JSON.stringify(api.order()) !== JSON.stringify($.fn.dataTable.defaults.aaSorting ) )
                tableHash.push( 'o' + api.order()[0][1].charAt( 0 ) + api.order()[0][0] );

        // Only set the search if something is searched for
        if ( _isEnabled( 'search' )
            && api.search() )
                tableHash.push( 's' + encodeURIComponent(api.search()) );

        // Only set the page if its not the default
        if ( _isEnabled( 'page' )
            && api.page.info()
            && api.page.info().page !== 0 )
            tableHash.push( 'p'+api.page.info().page );

        // Only set the length if its not the default
        if ( _isEnabled( 'length' )
            && api.page.len()
            && api.page.len() !== (options.pageLength || 10) )
                tableHash.push( 'l' + api.page.len() );

        // Only set the scroller position if the extension is included and the rounded scroller position isn't 0
        if ( _isEnabled( 'scroller' )
            && _dtSettings.oScroller !== undefined 
            && Math.round(_dtSettings.oScroller.s.baseRowTop) !== 0){
            // _dtSettings.oScroller.s.baseRowTop
            // _dtSettings.oScroller.s.topRowFloat
            // Math.round()
            //console.debug('_dtSettings',_dtSettings);
            tableHash.push( 'c' + Math.round(_dtSettings.oScroller.s.baseRowTop) );
        }

        // Only set column visibility if one or more columns are hidden, and only store the lesser value
        // in the hash (Visible vs Hidden)
        if ( _isEnabled( 'colvis' )
            && api.columns().visible().filter( function ( v ) { return ! v; } ).any() ) {
            var t = [], f = [];
            // Add the visible col indexes to t, and hidden to f
            api.columns().visible().each( function ( value, index ) {
                if ( value === true )
                    t.push( index );
                else
                    f.push( index );
            } );

            // If visible column count is greater, then use non-vis
            if( t.length >= f.length )
                tableHash.push( 'vf' + f.join('.') );
            // Otherwise, use visible count
            else
                tableHash.push( 'vt' + t.join('.') );
        }

        hash[ tableID ] = tableHash.join(':');

        $.each(hash, function(table,conditions){
            if ( ! conditions) return;

            urlHash.push(table +'='+conditions);
        });

        window.location.hash = urlHash.join('&');
    }

    function _parseHash( id ){
        var conditions = {};

        // Process each condition within the query string
        $.each(_queryString(), function(table, cons){
            // If somehow thers more than one condition for this table, just take the first one..
            if ( typeof cons === 'array' || typeof cons === 'object' )
                cons = cons[0];

            // Ensure were processing the condition for the correct table
            if ( table !== id )
                return;

            // @todo check if table is a DT table
            var availableCons = {
                    s: 'search',
                    o: 'order',
                    l: 'length',
                    p: 'page',
                    c: 'scroller',
                    v: 'colvis'
                },
                parsedCons = {};

            $.each(cons.split(':'), function(i,c){
                if ( availableCons[ c.charAt( 0 ) ] !== undefined )
                    switch( c.charAt( 0 ) ){
                        // Column Order
                        case 'o':
                            var dir = { a: 'asc', d: 'desc' };
                            parsedCons[ availableCons[ c.charAt( 0 ) ] ] = [
                                parseInt( c.substring( 1 ).substring( 1 ) ), dir[ c.substring( 1 ).charAt( 0 ) ]
                            ];
                            break;
                        // Search String
                        case 's': // The search string should be URL Decoded (Mainly for in case the : is used)
                            parsedCons[ availableCons[ c.charAt( 0 ) ] ] = decodeURIComponent( c.substring( 1 ) );
                            break;

                        // Column Visibility
                        case 'v':
                            // If the header was messed with, just skip the col vis
                            if ( c.charAt( 1 ) !== 'f' &&  c.charAt( 1 ) !== 't') return;

                            parsedCons[ availableCons[ c.charAt( 0 ) ] ] = [
                                // Dictate if this list is hidden or visible
                                c.charAt( 1 ) === 't' ? 'visible' : 'hidden' ,
                                // List of said columns
                                c.substring( 1 ).substring( 1 ).split('.')
                            ];
                            break;

                        default:
                            parsedCons[ availableCons[ c.charAt( 0 ) ] ] = c.substring( 1 );
                            break;
                    }
            });

            conditions = parsedCons;
        });

        return conditions;
    }

    // On DT Initialization
    $(document).on('init.dt', function(e, dtSettings) {
        if ( e.namespace !== 'dt' )
            return;

        var options = dtSettings.oInit.keepConditions;
        _dtSettings = dtSettings;

        if ($.isPlainObject(options) || options === true) {
            var config     = $.isPlainObject(options) ? options : {},
                api        = new $.fn.dataTable.Api( dtSettings ),
                hash       = _parseHash($( api.table().node() ).attr('id')),
                hashParams = {
                    api: api,
                    options: dtSettings.oInit
                };

            // Order Condition
            if ( _isEnabled( 'order' ) ){
                api.on( 'order.dt', hashParams , _updateHash );

                if ( typeof hash.order !== 'array' )
                    api.order( hash.order );
            }

            // Search condition
            if ( _isEnabled( 'search' ) ) {
                api.on( 'search.dt', hashParams, _updateHash );

                if ( hash.search !== undefined )
                    api.search( hash.search );
            }

            // Length condition
            if ( _isEnabled( 'length' ) ) {
                api.on( 'length.dt', hashParams, _updateHash );

                if ( hash.length !== undefined )
                    api.page.len( parseInt( hash.length ) );
            }

            // Page condition
            if ( _isEnabled( 'page' ) ) {
                api.on( 'page.dt', hashParams, _updateHash );

                if ( hash.page && parseInt( hash.page ) !== 0 )
                    api.page( parseInt( hash.page ) );
            }

            if ( _isEnabled( 'scroller' ) ) {
                api.on( 'draw.dt', hashParams, _updateHash );

                if ( hash.scroller && parseInt( hash.scroller ) !== 0 )
                    api.row( parseInt( hash.scroller ) ).scrollTo();
            }

            if ( _isEnabled( 'colvis' ) ) {
                api.on( 'column-visibility.dt', hashParams, _updateHash );

                if ( hash.colvis ) {
                    api.columns().indexes().each( function ( value, index ) {
                        // Parse as visible list
                        if ( hash.colvis[ 0 ] === 'visible') {
                            if ( $.inArray( value.toString(), hash.colvis[ 1 ] ) === - 1 ) {
                                api.column( value ).visible( false );
                            }
                            else {
                                api.column( value ).visible( true );
                            }
                        }
                        // Parse as hidden list
                        else {
                            if (  $.inArray( value.toString(), hash.colvis[ 1 ] ) === - 1 ) {
                                api.column( value ).visible( true );
                            }
                            else {
                                api.column( value ).visible( false );
                            }
                        }
                    } );
                }
            }

            api.draw( false );
        }
    });

    // Copy Conditions Button
    $.fn.dataTable.ext.buttons.copyConditions = {
        text: 'Copy Conditions',
        action: function ( e, dt, node, config ) {

            $( '<input />' )
                .val( document.location.href )
                .attr('id', 'copyConditions-text' )
                .css({
                    position: 'absolute',
                    left: '-9999px',
                    top: (window.pageYOffset || document.documentElement.scrollTop) + 'px'
                })
                .appendTo('body');

            $( "input#copyConditions-text" ).select();

            var success = undefined;

            try {
                document.execCommand('copy');

                dt.buttons.info( 'URL Copied','The URL with the DataTables conditions has been copied to your clipboard', 4000 );

                success = true;
            } catch (err) {
                dt.buttons.info( 'Copy URL','Copy be below input to easily share the URL<br><input id="keepConditions-input" value="'+document.location.href+'" style="width:90%;">', 10000 );

                $( "input#keepConditions-input" ).select();
            }
            finally {
                $( "input#copyConditions-text" ).remove();

                if ( success === undefined ){
                    dt.buttons.info( 'URL Copied', $( '<input />' ).val( document.location.href ).css({width: '90%'}), 6000 );
                }
            }


        }
    };
})(window, document, jQuery);
