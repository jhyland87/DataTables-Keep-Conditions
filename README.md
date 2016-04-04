# DataTables Plugin - Keep Conditions #

Store the DataTable conditions within the URL hash every time a condition is changed, such as the page, length, search or a column order, making it possible to copy/paste the URL. Once said URL is loaded, the conditions will be retrieved from the URL hash and implemented to the table on DT initialization.

### Conditions ###
The *Keep Conditions* plugin has the capability of keeping the conditions for the following:


Setting/Extension		| Name			| Key	| Links
----------------------- | ------------- | ----- | --------------
Table Search String		| `search`		| `f`	|
Column Ordering/Sorting | `order`		| `o`	|
Pagination				| `page`		| `p`	|
Table Length			| `length`		| `l`	|
Column Visibility		| `colvis` 		| `v`	| [ColVis](http://datatables.net/reference/button/colvis) (A [buttons](http://datatables.net/extensions/buttons/) extension)
Scroll Position			| `scroller`	| `s`	| [Scroller](https://datatables.net/extensions/scroller/)
Column Reordering		| `colorder`	| `c`	| [ColOrder](http://datatables.net/extensions/colreorder/)

**Note:** The only condition that I decided to *not* implement, would be the row order (for the [RowReorder](http://datatables.net/extensions/rowreorder/) extension). There are several reasons I decided not to, but primarily, because it would be difficult to know which rows were in what order, unless the [RowId](http://datatables.net/reference/option/rowId) option was used, which is mostly only for JSON or AJAX sourced tables, which I found its a pain to get rowReorder to work for those data sources anyways.

#### Links ####
* *[Live Demo](http://demo.jsdigest.com/DataTables-Keep-Conditions/examples/)*
* *[Blog Post](http://www.jsdigest.com/datatables-keep-conditions-plugin-link-exact-settings-within-current-table//)

### Parameters ###
Parameter 			  			| Type 		  					| Default 	| Description
------------------------------- | ----------------------------- | --------- | ------------
`keepConditions`	  			| boolean/object/string/array	| `true`  	| Main setting object, or array of conditions to enable, or string of condition keys)
`keepConditions.conditions`		| string/array					| *None*	| Conditions to enable (Array of names, or string of keys)
`keepConditions.attachEvents`	| boolean						| `true`	| Enable auto-updating of the URL hash whenever the events associated to the conditions are triggered

### API Methods ###
Method								| Parameters
----------------------------------- | ---------------------------
`keepConditions.detachEvents`		| [`conditions` *Null* (all events/conditions), *Array* (Specific events/conditions)]
`keepConditions.attachEvents`		| [`conditions` *Null* (all events/conditions), *Array* (Specific events/conditions)]
`keepConditions.structureHash`		| [`returnHash` *Null*/`false` (Updates URL hash), `true` (Returns URL Hash as string)]
`keepConditions.enableCondition`	| [`condition` *String* (Condition name/key to enable)], [`updateHash` `true` (Updates hash after condition enables)]
`keepConditions.disableCondition`	| [`condition` *String* (Condition name/key to disable)], [`updateHash` `true` (Updates hash after condition disables)]

##### Keep Conditions Button #####
Keep Conditions plugin comes with a button! As long as you properly setup the [buttons extension](http://datatables.net/extensions/buttons/), you can include the button `copyConditions`, which will display a button, when clicked, the URL will either be copied to the viewers clipboard (with the table conditions), or display an input with selected text, making it easy to copy and share the URL. An example if this is below.

### Initiation ###
KeepConditions can be initiated 2 different ways:

1. Setting the `keepConditions` item within the DataTables initial settings to either `true`, or define an object with configuration settings.
2. Manually initializing a new KeepConditions object via the *new* keyword, specifying the DataTable by passing one of three different items as the only parameter
  1. The DataTable instance: `var table = $('#table').DataTable(); new KeepConditions(table);`
  2. The DataTable API instance: `var api = new $.fn.dataTable.Api(table); new KeepConditions(api);`
  3. A CSS selector for the table: `new KeepConditions($('#table'));`


### Example Usage ###

Basic Initialization (Enabling all available and initialized options)

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
    	conditions: ['page','length','search','order','scroller','colvis','colorder']
    	// Or by keys..
    	conditions: 'plfosvc'
    }
});
```

Same result as the above, specifying

```javascript
$('#example').DataTable({
    dom: 'lfrtip',
    keepConditions: ['page','length','search','order','scroller','colvis','colorder']
    // Or by keys..
    keepConditions: 'plfosvc'
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
    keepConditions: ['search','order','page','length']
});
```

Customizing the button settings, as well as changing the text for the button and related alerts (Usful for when custom languages are needed)

```javascript
$('#example').DataTable({
    language: {
        // Customize the text for the button
        keepConditions: {
            // Title to show if text was successfully copied
            btnCopyTitle: 'URL Copied',
            // Body for above
            btnCopyBody: 'The URL was copied to your clipboard! Have a nice day',

            // Title to show if text was NOT copied, and an input is
            // shown with the content selected, and viewer must copy
            btnSelectTitle: 'Copy URL',
            // Body for above
            btnSelectBody: 'Copy the content of the input by either right clicking ' +
            'and selecting "copy", or press Ctrl + "c" on your keyboard'
        }
    },
    // Initialize KeepConditions for all available settings/extensions/plugins
    keepConditions: true,
    dom: 'Blftipr',
    buttons: [
        // Initialize button with customizations
        {
            extend: 'copyConditions',
            // Text for the button itself
            text: 'Copy Table Conditions',
            // Timeout for the dialog if content was successfully copied
            selectTimeout: 1500,
            // Timeout for dialog if viewer needs to manually copy content
            copyTimeout: 4000
        }
    ]
});
```

Initiation with the [ColVis](http://datatables.net/reference/button/colvis) button, as well as the [ColReorder](http://datatables.net/extensions/colreorder/)  and [Scroller](https://datatables.net/extensions/scroller/) extensions, on an AJAX sourced table, as well as disabling un-necessary conditions.

```javascript
$('#example').DataTable({
    ajax:           "dataSrc.txt",
    deferRender:    true,
    scrollY:        200,
    scrollCollapse: true,
    scroller:       true,
    dom: 'Bfrtip',
    colReorder: true,
    buttons: [
        'colvis'
    ],
    keepConditions: 'fovs'
});
```

### Example API Usage ###

Update the URL Hash manually
```javascript
table.keepConditions.structureHash();
```

Retrieve the potential URL hash as a string (without updating)
```javascript
var hashStr = table.keepConditions.structureHash(true);
```

Enable all conditions by attaching the update function to all associated events
```javascript
table.keepConditions.attachEvents();
```

Disable specific conditions by detaching the update function from the events associated with the conditions
```javascript
table.keepConditions.detachEvents(['search','order']);
```