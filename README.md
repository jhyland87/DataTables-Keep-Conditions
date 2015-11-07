# DataTables Plugin - Keep Conditions #

Store the DataTable conditions within the URL hash every time a condition is changed, such as the page, length, search or a column order, making it possible to copy/paste the URL. Once said URL is loaded, the conditions will be retrieved from the URL hash and implemented to the table on DT initialization

*([Demo Here](http://www.justinhyland.com/p/dt/datatables-keep-conditions/examples/example-button.html#example-1=oa3:s201:p1:l25))*

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
$('#example-1').DataTable({
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
