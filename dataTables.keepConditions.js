/**
 * @summary     KeepConditions
 * @description Store the status of the DataTable within the URL, making
 *              sharing the exact page/length/etc via copy/paste possible
 * @version     1.0.0
 * @file        dataTables.keepConditions.js
 * @author      Justin Hyland (http://www.justinhyland.com)
 * @contact     j@linux.com
 * @copyright   Copyright 2015 Justin Hyland
 *
 * License      MIT - http://datatables.net/license/mit
 *
 * Store the DataTable conditions within the URL hash every time a condition is changed,
 * such as the page, length, search or a column order, making it possible to copy/paste
 * the URL. Once said URL is loaded, the conditions will be retrieved from the URL hash
 * and implemented to the table on dt.init
 *
 * @example
 *    $('#example').DataTable({
 *        keepConditions: true
 *    });
 *
 * @example
 *    $('#example').DataTable({
 *        keepConditions: {
 *           page:   true,
 *           length: true,
 *           search: true,
 *           order:  true
 *        }
 *    });
 */

(function(window, document, $) {
    // Process the URL hash into an object
    function queryString(){
        var queryString = {};
        var query        = window.location.hash.substring(1);
        var vars         = query.split("&");

        for ( var i = 0; i < vars.length; i++)	{
            var pair = vars[ i ].split ( "=");
            // If first entry with this name
            if ( typeof queryString[ pair [ 0 ] ] === "undefined") {
                queryString[ pair [ 0 ] ] = pair [ 1 ];
                // If second entry with this name
            } else if ( typeof queryString [ pair [ 0 ] ] === "string") {
                queryString[ pair [ 0 ] ] = [ queryString [ pair [ 0 ] ], pair[ 1 ] ];
                // If third or later entry with this name
            } else {
                queryString[ pair [ 0 ] ].push ( pair [1 ]);
            }
        }

        return queryString || false;
    }

    // Update the URL hash by processing the DT instance settings (page,
    // length, search, etc) and setting the URL hash string value
    function updateHash( e ){
        var api     = e.data.api,
            options = e.data.options;

        var hash = [];

        if( options.keepConditions === true
            || options.keepConditions.order === true
            && api.order()[0]
            && JSON.stringify(api.order()) !== JSON.stringify($.fn.dataTable.defaults.aaSorting ) )
                hash.push( 'order=' + api.order()[0][0]+':'+api.order()[0][1] );

        if( options.keepConditions === true
            || options.keepConditions.search === true
            && api.search() )
                hash.push( 'search='+api.search() );

        // Only set the page if its not the default
        if( options.keepConditions === true
            || options.keepConditions.page === true
            && api.page.info()
            && api.page.info().page !== 0 )
                hash.push( 'page='+api.page.info().page );

        // Only set the length if its not the default
        if( options.keepConditions === true
            || options.keepConditions.length === true
            &&  api.page.len()
            && api.page.len() !== (options.pageLength || 10) )
                hash.push( 'length=' + api.page.len() );

        window.location.hash = hash.join('&');
    }

    // On DT Initialization
    $(document).on('init.dt', function(e, dtSettings) {
        if ( e.namespace !== 'dt' )
            return;

        var options = dtSettings.oInit.keepConditions;

        if ($.isPlainObject(options) || options === true) {
            var config     = $.isPlainObject(options) ? options : {},
                api        = new $.fn.dataTable.Api( dtSettings ),
                hash       = queryString(),
                hashParams = { api: api, options: dtSettings.oInit };

            // Order Condition
            if(options === true || options.order === true){
                api.on( 'order.dt', hashParams , updateHash );

                if ( hash.order )
                    api.order( hash.order.split( ':' ) );
            }

            // Search condition
            if(options === true || options.search === true) {
                api.on( 'search.dt', hashParams, updateHash );

                if ( hash.search )
                    api.search( hash.search );
            }

            // Length condition
            if(options === true || options.length === true) {
                api.on( 'length.dt', hashParams, updateHash );

                if ( hash.length )
                    api.page.len( parseInt( hash.length ) );
            }

            // Page condition
            if(options === true || options.page === true) {
                api.on( 'page.dt', hashParams, updateHash );

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
                throw new Error('Didnt work :(');
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
