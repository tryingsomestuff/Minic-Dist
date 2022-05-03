$(document).ready(function () {
    $('#collapseSettings').collapse('show');

    w = $(".sidepanel-box").width();
    if (w < 300) {
        $(".flexpanel").each(function () {
            $(this).removeClass("col-3");
            $(this).addClass("col-6");
        });
    }


    $(window).resize(function () {
        w = $(".sidepanel-box").width();
        if (w < 300) {
            $(".flexpanel").each(function () {
                $(this).removeClass("col-3");
                $(this).addClass("col-6");
            });

            $('.query-badge').each(function () {
                $('.badge', this).css({'font-size': '.9em', 'padding': '0.2em 0.20em'});
            });
        } else {
            $(".flexpanel").each(function () {
                $(this).removeClass("col-6");
                $(this).addClass("col-3");
            });

            $('.query-badge').each(function () {
                $('.badge', this).css({'font-size': '1em', 'padding': '0.35em 0.65em'});
            });

        }
    }).resize();

});
