/**
 * SimpleNav
 */
(function ($) {

    $.fn.simplenav = function (options) {

        var simplenavElement = $(this);
        var support = typeof(Storage) !== "undefined";
        var settings = $.extend({
            toggle: 'js-simplenav-toggle',
            toggleWrapper: 'js-simplenav-wrapper',
            dropdown: 'js-simplenav-dropdown',
            activeclass: 'is-open',
            throttle: 250
        }, options);

        if (!support) {
            console.warn('sorry this browser sucks');
            return;
        }

        var app = {
            init: function () {
                var _this = this;
                var instance = 0;
                simplenavElement.each(function () {

                    /**
                     * Set data object to store settings & breakpoints
                     * @type {{}}
                     */
                    var data = {};
                    data.instance = instance++;
                    data.settings = settings;
                    data.element = $(this);
                    data.breaks = [];

                    _this.prepareHtml(data);
                    _this.check(data);
                    _this.toggleDropdown(data);
                    _this.bindResize(data);
                })
            },


            /**
             * Prepare html
             * @param data
             */
            prepareHtml: function (data) {
                if (data.element.find(data.settings.toggle).length) return;
                data.element.append('' +
                    '<li class="' + data.settings.toggleWrapper + '" style="display:none;">' +
                    '<button id="menu-button-' + data.instance + '" aria-label="Menu" aria-expanded="false" aria-controls="menu-' + data.instance + '" type="button" class="' + data.settings.toggle + '">toggle</button>' +
                    '<ul id="menu-' + data.instance + '" aria-hidden="true" aria-labelledby="menu-button-' + data.instance + '" style="position: absolute;" class="' + data.settings.dropdown + '"></ul>' +
                    '</li>' +
                    '')
            },


            /**
             * Update variables
             */
            checkVars: function (data) {
                data.viewportWidth = $(window).width();
                data.menuHeight = data.element.height();
                data.itemHeight = this.maxHeight(data.element.children('li'));
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
            maxHeight: function (selector) {
                var maxHeight = 0;
                selector.each(function () {
                    if (!$(this).is(":visible")) return;
                    var height = $(this).outerHeight();
                    if (height > maxHeight) {
                        maxHeight = height;
                    }
                })
                return maxHeight;
            },

            /**
             * Check if we have to move an item to dropdown
             * [menu item]--->>[dropdown]
             */
            checkMove: function (data) {
                console.log('menuHeight: ' + data.menuHeight);
                console.log('itemHeight: ' + data.itemHeight);
                var i = 0;
                while (data.menuHeight > data.itemHeight + 5 && data.element.children('li').length > 0 && i < 15) {
                    i++;
                    var item = data.element.children('li:nth-last-child(2)');
                    this.moveItem(item, data);
                    this.checkVars(data);
                }
            },
            moveItem: function (element, data) {
                element.prependTo(data.element.find('.' + data.settings.dropdown));
                data.breaks.push({'break': data.viewportWidth});
            },


            /**
             * Check if we have to retrieve an item
             * [dropdown item]--->>[menu]
             */
            checkRetrieve: function (data) {
                while (data.viewportWidth > data.lowestViewport && data.breaks.length > 0) {
                    this.retrieveItem(data);
                    this.checkVars(data);
                }
            },
            retrieveItem: function (data) {
                var item = data.element.find('.' + data.settings.dropdown).children('li:first-child');
                item.insertBefore(data.element.children('li:last-child'));
                data.breaks.pop();
            },

            /**
             * Toggle dropdown
             * @param data
             */
            toggleDropdown: function (data) {
                var _this = this;
                $('.' + data.settings.toggle).on('click', function () {
                    if($(this).hasClass(data.settings.activeclass)){
                        _this.closeDropdown(data);
                    }else{
                        _this.openDropdown(data, $(this));
                    }
                });
                $(document).on('click', function (e) {
                    if (!$(e.target).closest('.' + data.settings.toggleWrapper).length) {
                        _this.closeDropdown(data);
                    }
                });
                $(document).keyup(function(e) {
                    if (e.keyCode === 27) _this.closeDropdown(data);
                });

                /**
                 * Open dropdown
                 *
                 * @param element
                 */
                this.openDropdown = function(data, element){

                    // Toggle aria attributes
                    console.log(data.element.find('.' + data.settings.toggle));
                    data.element.find('.' + data.settings.toggle).attr('aria-expanded', 'true');
                    data.element.find('.' + data.settings.dropdown).attr('aria-hidden', 'false');
                    data.element.find('.' + data.settings.toggleWrapper).attr('tabindex', '0');
                    data.element.find('.'+data.settings.dropdown).children('li:first-child').find('a').focus();

                    // Add active classes
                    $(element)
                        .addClass(data.settings.activeclass)
                        .closest('.' + data.settings.toggleWrapper)
                        .addClass(data.settings.activeclass)
                        .find('.' + data.settings.dropdown)
                        .addClass(data.settings.activeclass);
                };

                /**
                 * Close dropdown
                 */
                this.closeDropdown = function(data){

                    // Toggle aria attributes
                    $('.' + data.settings.toggle).attr('aria-expanded', 'false');
                    $('.' + data.settings.dropdown).attr('aria-hidden', 'true');

                    // Toggle classes
                    $(data.element).find('.' + data.settings.activeclass).removeClass(data.settings.activeclass)
                }
            },


            /**
             * Check if we have to show the more dropdown
             * @param data
             */
            checkDropdown: function (data) {
                if (data.breaks.length > 0) {
                    data.element.find('.' + data.settings.toggleWrapper).show();
                    this.checkVars(data);
                    this.checkMove(data);
                } else {
                    data.element.find('.' + data.settings.toggleWrapper).hide();
                    this.checkVars(data);
                    this.checkRetrieve(data);
                }
            },

            /**
             * Main logic check
             * @param data
             */
            check: function (data) {
                this.checkVars(data);
                this.checkMove(data);
                this.checkRetrieve(data);
                this.checkDropdown(data);
            },


            /**
             * Debounced resize for optimized resize event
             *
             * source: https://davidwalsh.name/javascript-debounce-function
             * @param func
             * @param wait
             * @param immediate
             * @returns {Function}
             */
            debounce: function (func, wait, immediate) {
                var timeout;
                return function () {
                    var context = this, args = arguments;
                    var later = function () {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            },

            /**
             * Bind resize event
             * @param data
             */
            bindResize: function (data) {
                // Bind resize event to window object
                var check = this.debounce(function () {
                    app.check(data)
                }, data.settings.throttle);
                $(window).on('resize', check);
            }
        }

        app.init();

    };

}(jQuery));