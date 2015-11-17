/**
 * @summary     KeepConditions
 * @description Store the status of the DataTable within the URL, making
 *              sharing the exact page/length/etc via copy/paste possible
 * @version     1.0.0
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
 *           page:   true,
 *           length: true,
 *           search: true,
 *           order:  true
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
 */

(function(window, document, $) {
    // Process the URL hash into an object
    function _queryString(){
        var _queryString = {};
        var query        = window.location.hash.substring(1);
        var vars         = query.split("&");

        for ( var i = 0; i < vars.length; i++)	{
            var pair = vars[ i ].split ( "=");
            // If first entry with this name
            if ( typeof _queryString[ pair [ 0 ] ] === "undefined") {
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

    // Update the URL hash by processing the DT instance settings (page,
    // length, search, etc) and setting the URL hash string value
    // @todo Something tells me this is going to need improvement
    function _updateHash( e ){
        var api         = e.data.api,
            options     = e.data.options,
            this_id     = $( api.table().node() ).attr('id'),
            hash        = {}, // End result hash (will be processed into URL hash)
            this_hash   = [], // The conditions for THIS table
            url_hash    = []; // Gets joined by &

        // Grab all the existing hashes - to carefuly not disturb any conditions NOT for this table
        $.each(_queryString(), function(table, cons){

            if( ! table && ! cons ) return;

            // If this id isn't this table, store the hash and move on
            if( table !== this_id ){
                hash[ table ] = cons || '';
            }
            // Were ignoring THIS table id because were going to re-create it
        });

        if( options.keepConditions === true
            || options.keepConditions.order === true
            && api.order()[0]
            && JSON.stringify(api.order()) !== JSON.stringify($.fn.dataTable.defaults.aaSorting ) )
                this_hash.push( 'o' + api.order()[0][1].charAt(0) + api.order()[0][0] );

        if( options.keepConditions === true
            || options.keepConditions.search === true
            && api.search() )
                this_hash.push( 's'+api.search() );

        // Only set the page if its not the default
        if( options.keepConditions === true
            || options.keepConditions.page === true
            && api.page.info()
            && api.page.info().page !== 0 )
                this_hash.push( 'p'+api.page.info().page );

        // Only set the length if its not the default
        if( options.keepConditions === true
            || options.keepConditions.length === true
            &&  api.page.len()
            && api.page.len() !== (options.pageLength || 10) )
                this_hash.push( 'l' + api.page.len() );

        hash[this_id] = this_hash.join(':');

        $.each(hash, function(table,conditions){
            if( ! conditions) return;

            url_hash.push(table +'='+conditions);
        });

        window.location.hash = url_hash.join('&');
    }

    function _parseHash(id){
        var conditions = {};

        // Process each condition within the query string
        $.each(_queryString(), function(table, cons){
            // If somehow thers more than one condition for this table, just take the first one..
            if ( typeof cons === 'array' || typeof cons === 'object' )
                cons = cons[0];

            // Ensure were processing the condition for the correct table
            if( table !== id )
                return;

            // @todo check if table is a DT table
            var availableCons = {
                    s: 'search',
                    o: 'order',
                    l: 'length',
                    p: 'page'
                },
                parsedCons = {};

            $.each(cons.split(':'), function(i,c){
                if( typeof availableCons[ c.charAt(0) ] !== 'undefined' )
                    switch( c.charAt(0) ){
                        case 'o':
                            var dir = { a: 'asc', d: 'desc' };
                            parsedCons[ availableCons[ c.charAt(0) ] ] = [
                                parseInt( c.substring(1).substring(1) ), dir[ c.substring(1).charAt(0) ]
                            ];
                            break;
                        default:
                            parsedCons[ availableCons[ c.charAt(0) ] ] = c.substring(1);
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

        if ($.isPlainObject(options) || options === true) {
            var config     = $.isPlainObject(options) ? options : {},
                api        = new $.fn.dataTable.Api( dtSettings ),
                hash       = _parseHash($( api.table().node() ).attr('id')),
                hashParams = {
                    api: api,
                    options: dtSettings.oInit
                };

            // Order Condition
            if(options === true || options.order === true){
                api.on( 'order.dt', hashParams , _updateHash );

                if ( typeof hash.order !== 'array' )
                    api.order( hash.order );
            }

            // Search condition
            if(options === true || options.search === true) {
                api.on( 'search.dt', hashParams, _updateHash );

                if ( typeof hash.search !== 'undefined')
                    api.search( hash.search );
            }

            // Length condition
            if(options === true || options.length === true) {
                api.on( 'length.dt', hashParams, _updateHash );

                if ( typeof hash.length !== 'undefined' )
                    api.page.len( parseInt( hash.length ) );
            }

            // Page condition
            if(options === true || options.page === true) {
                api.on( 'page.dt', hashParams, _updateHash );

                if ( hash.page && parseInt( hash.page ) !== 0 )
                    api.page( parseInt( hash.page ) );
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

                if(typeof success === 'undefined'){
                    dt.buttons.info( 'URL Copied', $( '<input />' ).val( document.location.href ).css({width: '90%'}), 6000 );
                }
            }


        }
    };
})(window, document, jQuery);
