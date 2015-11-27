$(document).ready( function () {
    "use strict";

    // Move the JS to the preview code box
    $('code.javascript').text($('script#example-js').text());

    // Highlight it
    $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
});
