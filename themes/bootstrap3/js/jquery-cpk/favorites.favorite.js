/**
 * Favorites - favorite.
 *
 * Constructor for single favorite also contains parsers for initializing
 * object from record's detail page and from search records.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function($) {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/favorites.favorite.js");
    }

    /**
     * @property {String} title
     * @property {String} titleLink
     * @property {String} author
     * @property {String} authorLink
     * @property {String} published
     * @property {String} format
     * @property {String} formatIconClass
     * @property {String} image
     * @property {String} icon
     * @property {String} iconStyle
     * @property {String} created
     * @returns {Favorite}
     * @constructor
     */
    var Favorite = function() {
        var $searchItems = undefined;

        /**
         * Updates "stored" search items.
         * @private
         */
        var updateSearchItems = function() {
            $searchItems = $("div#result-list-placeholder").children();
        };

        /**
         * @private
         * @type {Object} $vars Represents single favorite item
         */
        var $vars = {
            title: undefined,
            titleLink: undefined,
            author: undefined,
            authorLink: undefined,
            published: undefined,
            format: undefined,
            formatIconClass: undefined,
            image: undefined,
            icon: undefined,
            iconStyle: undefined,
            created: (new Date()).getTime()
        };

        // Create getter/setters according to $vars
        $.each($vars, function(prop) {
            if (CPK.verbose === true) {
                console.log(prop);
            }
            if (prop === "created") {
                Object.defineProperty(this, prop, {
                    get: function() { return $vars[prop]; }
                });
            } else {
                Object.defineProperty(this, prop, {
                    get: function() { return $vars[prop]; },
                    set: function(v) { $vars[prop] = v; }
                });
            }
        });

        /**
         * Creates Favorite from given object.
         * @param {Object} obj
         */
        this.fromObject = function(obj) {
            if (typeof obj !== "object" && CPK.verbose === true) {
                console.error("Trying to create Favorite from object, but no object was passed!");
            } else if (!obj.hasOwnProperty("created") && CPK.verbose === true) {
                console.error("Missing timestamp property in the passed object!");
            } else {
                $vars = obj;
            }
        };

        /**
         * Creates Favorite from record's detail.
         */
        this.fromRecordDetail = function() {
            parseRecordDetail().then(
                /**
                 * @param {Favorite} fav
                 */
                function(fav) { $vars = fav.toObject(); },
                /**
                 * @param {String} msg
                 */
                function(msg) {
                    if (CPK.verbose === true) {
                        console.error(msg);
                    }
                }
            );
        };

        /**
         * Creates record from search record.
         * @param {Number} rank
         */
        this.fromRecordSearch = function(rank) {
            parseRecordSearch(rank).then(
                /**
                 * @param {Favorite} fav
                 */
                function(fav) { $vars = fav.toObject(); },
                /**
                 * @param {String} msg
                 */
                function(msg) {
                    if (CPK.verbose === true) {
                        console.error(msg);
                    }
                }
            );
        };

        /**
         * @returns {Object}
         */
        this.toObject = function() {
            return $vars;
        };

        /**
         * @returns {String}
         */
        this.toString = function() {
            return JSON.stringify($vars);
        };

        /**
         * Parses Favorite from record's detail page.
         * @returns {Promise}
         */
        var parseRecordDetail = function() {
            return new Promise(function(resolve, reject) {
                var tablePointer = $("table[summary]");
                if (tablePointer.length === 0) {
                    reject("We are probably not on record detail page.");
                }

                var authorPointer = tablePointer.find("tbody tr td[property=author] a");

                if (authorPointer.length === 0) {
                    // Could also be a creator property
                    authorPointer = tablePointer.find("tbody tr td[property=creator] a");

                    if (authorPointer.length === 0) {
                        // Could also be an contributor
                        authorPointer = tablePointer.find("tbody tr td span[property=contributor] a");
                    }
                }

                var formatPointer = tablePointer.find("tbody tr td div.iconlabel");

                var fav = new favorites.Favorite();
                fav.titleLink = location.pathname;
                fav.title = (function() {
                    var expectedSiblingHeader = tablePointer.siblings("h2");
                    return (expectedSiblingHeader.length > 0)
                        ? expectedSiblingHeader.find("strong").text()
                        : (CPK.verbose === true) ? console.error("Parsing record title failed!") : null;
                })();
                fav.authorLink = (function() {
                    var link = authorPointer.prop("href");
                    return (typeof link === "string")
                        ? link
                        : CPK.verbose === true ? console.error("Parsing author's link failed!") : null;
                })();
                fav.author = (function() {
                    var author = authorPointer.text();
                    return (typeof author === "string")
                        ? author
                        : CPK.verbose === true ? console.error("Parsing author's name failed!") : null;
                })();
                fav.formatIconClass = (function() {
                    var expectedIcon = formatPointer.children("i");
                    return (expectedIcon.length)
                        ? expectedIcon.attr("class")
                        : CPK.verbose === true ? console.error("Parsing format icon class failed!") : null;
                })();
                fav.format = (function() {
                    var expectedSpan = formatPointer.children("span");
                    return (expectedSpan.length)
                        ? expectedSpan.attr("data-orig")
                        : CPK.verbose === true ? console.error("Parsing record format failed!") : null;
                })();
                fav.published = (function() {
                    var expectedSpan = tablePointer.find("tbody tr td span[property=publicationDate]");
                    return (expectedSpan.length)
                        ? expectedSpan.text()
                        : CPK.verbose === true ? console.error("Parsing publication year failed!") : null;
                })();
                fav.image = (function() {
                    var expectedParentSiblingSmallDivision = tablePointer.parent().siblings("div.col-sm-3");
                    if (expectedParentSiblingSmallDivision.length <= 0) {
                        return CPK.verbose === true ? console.error("Parsing record image's parent division failed!") : null;
                    }

                    var expectedImg = expectedParentSiblingSmallDivision.find("img");
                    if (expectedImg.length) {
                        // We found image
                        return expectedImg.attr("src");
                    }

                    // Parsing image has failed .. so try to parse an icon
                    var expectedIcon = expectedParentSiblingSmallDivision.find("i[class][style]");
                    if (expectedIcon.length <= 0) {
                        return CPK.verbose === true ? console.error("Parsing record image source or icon failed!") : null;
                    }

                    // Set at least the icon to the object
                    fav.icon = expectedIcon.attr("class");
                    fav.iconStyle = expectedIcon.attr("style");
                    // And image is undefined ..
                    return undefined;
                })();

                resolve(fav);
            });
        };

        /**
         * Parses Favorite from search record.
         * @param {Number} rank
         * @returns {Promise}
         */
        var parseRecordSearch = function(rank) {
            return new Promise(function(resolve, reject) {
                if (typeof rank === "undefined") {
                    reject("Can not parse from current search with unknown rank!");
                }

                rank = parseInt(rank);

                if (rank < 0) {
                    reject("Invalid rank provided for parsing current search!");
                }

                if (typeof $searchItems === "undefined") {
                    window.addEventListener("searchResultsLoaded", updateSearchItems);
                    updateSearchItems();
                }

                var record = $searchItems.get(rank);
                record = record.getElementsByClassName("row")[0];

                var fav = new Favorite();
                fav.title = (function() {
                    var anchor = record.querySelector("a.title");

                    if (anchor) {
                        this.titleLink = anchor.getAttribute("href");
                        return anchor.textContent.trim();
                    }

                    if (CPK.verbose === true) {
                        console.error("Parsing search record title and titleLink failed!");
                    }
                })();
                fav.author = (function() {
                    var anchor = record.querySelector("a.author-info");

                    if (anchor) {
                        this.authorLink = anchor.getAttribute("href");
                        return anchor.textContent.trim();
                    }

                    if (CPK.verbose === true) {
                        console.error("Parsing search record author and authorLink failed!");
                    }
                })();
                fav.format = (function() {
                    var iconDiv = record.querySelector("div.format-list div.iconlabel");

                    if (iconDiv) {
                        fav.formatIconClass(iconDiv.getElementsByTagName("i")[0].getAttribute("class"));
                        return iconDiv.getElementsByTagName("span")[0].getAttribute("data-orig");
                    }

                    if (CPK.verbose === true) {
                        console.error("Parsing format icon class failed!");
                        console.error("Parsing record format failed!");
                    }
                })();
                fav.published = (function() {
                    var span = record.querySelector("span.summDate");

                    if (span) {
                        return span.textContent.trim();
                    }

                    if (CPK.verbose === true) {
                        console.error("Parsing date of publishing failed!")
                    }
                })();
                fav.image = (function() {
                    var err = "Parsing image or icon failed!";
                    try {
                        var thumb = record.getElementsByClassName("coverThumbnail")[0];
                        var image = thumb.getElementsByTagName("img")[0];

                        if (typeof image !== "undefined") {
                            return image.getAttribute("src");
                        }

                        var icon = thumb.getElementsByTagName("i")[0];

                        if (typeof icon !== "undefined") {
                            fav.icon(icon.getAttribute("class"));
                            fav.iconStyle(icon.getAttribute("style"));
                            // Icon is set but image self is undefined
                            return undefined;
                        }

                        if (CPK.verbose === true) {
                            console.log(err);
                        }
                    } catch (e) {
                        console.error(err, e);
                    }
                })();

                resolve(fav);
            });
        };
    };

    /**
     * @type {Favorite}
     */
    CPK.favorites.Favorite = Favorite;

}(jQuery));