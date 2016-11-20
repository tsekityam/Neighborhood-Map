/*
 * The file is modified from the following Bootstrap example file, released under MIT license.
 * https://github.com/twbs/bootstrap/blob/master/docs/examples/offcanvas/offcanvas.js
 */

$(document).ready(function() {
    $('[data-toggle="offcanvas"]').click(function() {
        $('.row-offcanvas').toggleClass('active')
    });
});
