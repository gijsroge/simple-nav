/**
 * SimpleNav
 */
(function ( $ ) {

    $.fn.simplenav = function (options) {

        var settings = $.extend({
            selector: "#556b2f"
        }, options );

        var simplenavElement = $(this);
        var support = typeof(Storage) !== "undefined";

        if (!support) {
            console.warn('sorry this browser sucks');
            return;
        }

        var app = {
            init: function () {
                var _this = this;
                simplenavElement.each(function () {
                    var data= {};
                    data.element = $(this);
                    data.breaks = [];
                    _this.prepareHtml(data);
                    _this.check(data);
                    _this.trigger(data);
                })
            },


            prepareHtml: function (data) {
                data.element.append('' +
                    '<li class="js-mainnav-toggle-wrapper" style="display:none;">' +
                    '<a href="#" class="u-relative c-nav__list-item c-nav__link ">toggle</a>' +
                    '<ul style="position: absolute;" class="js-mainnav-dropdown"></ul>' +
                    '</li>' +
                    '')
            },


            /**
             * Update variables
             */
            checkVars: function (data) {
                data.toggleWidth = data.element.find('.js-mainnav-toggle-wrapper').outerWidth();
                data.viewportWidth = $(window).width();
                data.menuHeight = data.element.height();
                //console.log('menuHeight: '+data.menuHeight);
                data.itemHeight = this.maxHeight(data.element.children('li'));
                //console.log('itemHeight: '+data.itemHeight);
                data.lowestViewport = this.getLowestViewportBreak(data.breaks);
            },


            /**
             * Retrieve lowest item
             *
             * @param array
             * @returns {number}
             */
            getLowestViewportBreak: function (array) {
                return Math.min.apply(Math, array.map(function (o) {
                    return o.break;
                }))
            },


            /**
             * Select tallest element in object
             *
             * @param selector must be jQuery object
             */
            maxHeight: function(selector){
                var maxHeight = 0;
                selector.each(function(){
                    var height = $(this).height();
                    if (height > maxHeight) { maxHeight = height; }
                })
                return maxHeight;
            },

            /**
             * Check if we have to move an item to dropdown
             */
            checkMove: function (data) {
                while (data.menuHeight > data.itemHeight && data.element.children('li').length > 0) {
                    console.log('menuHeight: '+data.menuHeight);
                    console.log('itemHeight: '+data.itemHeight);
                    var item = data.element.children('li:nth-last-child(2)');
                    this.moveItem(item, data);
                    this.checkVars(data);
                }
                console.log('menuHeight outside: '+data.menuHeight);
            },
            moveItem: function (element, data) {
                element.prependTo(data.element.find('.js-mainnav-dropdown'));
                data.breaks.push({'break': data.viewportWidth + data.toggleWidth});
            },


            /**
             * Check if we have to retrieve an item
             */
            checkRetrieve: function (data) {
                while (data.viewportWidth > data.lowestViewport && data.breaks.length > 0) {
                    this.retrieveItem(data);
                    this.checkVars(data);
                }
            },
            retrieveItem: function (data) {
                var item = data.element.find('.js-mainnav-dropdown').children('li:first-child');
                item.insertBefore(data.element.children('li:last-child'));
                data.breaks.pop();
            },


            checkDropdown: function (data) {
                if (data.breaks.length > 0) {
                    data.element.find('.js-mainnav-toggle-wrapper').show();
                } else {
                    data.element.find('.js-mainnav-toggle-wrapper').hide();
                }
            },


            check: function (data) {
                this.checkVars(data);
                this.checkMove(data);
                this.checkRetrieve(data);
                this.checkDropdown(data);
            },


            trigger: function (data) {
                $(window).on('resize', function () {
                    app.check(data);
                })
            }
        }

        app.init();

        return 'lol';
    };

}( jQuery ));