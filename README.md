# DataTables Plugin - Keep Conditions #

Store the DataTable conditions within the URL hash every time a condition is changed, such as the page, length, search or a column order, making it possible to copy/paste the URL. Once said URL is loaded, the conditions will be retrieved from the URL hash and implemented to the table on DT initialization.

The *Keep Conditions* plugin has the capability of keeping the conditions for the following:

* Table Search String
* Column Ordering
* Pagination
* Table Length
* [Column Visibility](http://datatables.net/reference/button/colvis) (A [buttons](http://datatables.net/extensions/buttons/) extension)
* [Scroll Position](https://datatables.net/extensions/scroller/)

#### Links ####
* *[Live Demo](http://www.linuxdigest.org/misc/script_examples/DataTables-Keep-Conditions/examples/)*
* *[Blog Post](http://www.linuxdigest.org/blog/2015/11/17/datatables-keep-conditions-plugin-link-to-the-exact-settings-within-the-current-table/)*

### Parameters ###
Parameter 			  	| Type 		  		| Default | Description
----------------------- | ----------------- | ------- | ------------
`keepConditions`	  	| boolean/object	| true	  | Enable/Disable keepConditions plugin
`keepConditions.page` 	| boolean		  	| true	  | Enable keepConditions for pagination
`keepConditions.length` | boolean		  	| true	  | Enable keepConditions for page length
`keepConditions.search` | boolean		  	| true	  | Enable keepConditions for table search/filter
`keepConditions.order` 	| boolean		  	| true	  | Enable keepConditions for column ordering

##### Keep Conditions Button #####
Keep Conditions plugin comes with a button! As long as you properly setup the [buttons extension](http://datatables.net/extensions/buttons/), you can include the button `copyConditions`, which will display a button, when clicked, the URL will either be copied to the viewers clipboard (with the table conditions), or display an input with selected text, making it easy to copy and share the URL. An example if this is below.


### Example Usage ###

Basic Initialization (Enabling for Paging, Length, Search and Order)

```javascript
$('#example').DataTable({
    keepConditions: true
});
```

Advanced Initialization (Select what conditions to keep)

```javascript
$('#example').DataTable({
    dom: 'lfrtip',
    keepConditions: {
        page:   true,
        length: true,
        search: true,
        order:  true
    }
});
```

Basic Initialization (With button)

```javascript
$('#example').DataTable({
    keepConditions: true,
    dom: 'Blfrtip',
    buttons: [
        'copyConditions'
    ]
});
```

Multiple Tables, Basic & Advanced w/ Button

```javascript
$('#example-1').DataTable({
    dom: 'Blftipr',
    keepConditions: true,
    buttons: [
        'copyConditions'
    ]
});

$('.example-2').DataTable({ // Using Class
    dom: 'lftipr',
    pageLength: 25,
    keepConditions: {
        search: true,
        order: true,
        page: true,
        length: true
    }
});
```

Initiation with the [ColVis](http://datatables.net/reference/button/colvis) button and [Scroller](https://datatables.net/extensions/scroller/) extension on an AJAX sourced table, as well as disabling un-necessary conditions.

```javascript
$('#example').DataTable({
    ajax:           "dataSrc.txt",
    deferRender:    true,
    scrollY:        200,
    scrollCollapse: true,
    scroller:       true,
    dom: 'Bfrtip',
    buttons: [
        'colvis'
    ],
    keepConditions: {
        page:     false,
        length:   false,
        search:   true,
        order:    true,
        colvis:   true,
        scroller: true
    }
});
```
