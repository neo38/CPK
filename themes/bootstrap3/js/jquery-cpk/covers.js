/**
 * Covers for books.
 *
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function( $ ) {
	if ( CPK.verbose === true ) {
		console.log( "jquery-cpk/covers.js" );
	}

	// Here are some extensions to jQuery self
	$.fn.cpkCover = cover;

	// Default options
	$.fn.cpkCover.defaults = {
		normal: {
			width: 63,
			height: 80,
			noImg: "themes/bootstrap3/images/noCover.jpg"
		},
		small: {
			width: 63,
			height: 80,
			noImg: "themes/bootstrap3/images/noCover.jpg"
		}
	};

	/**
	 * @param {string} profile
	 * @param {Object} options
	 * @return {jQuery}
	 */
	function cover( profile, options ) {

		// Check if only options are passed
		if ( typeof profile === "object" && typeof options === undefined ) {
			options = profile;
			profile = "normal";
		}

		// Ensure the profile is correct
		if ( [ "normal", "small"].indexOf( profile ) === -1 ) {
			profile = "normal";
		}

		var opts = $.extend( {}, $.fn.cpkCover.defaults, options[ profile ] ),
			requests = [],
			responses = [];

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function prepareRequest( idx, elm ) {
			//...
		}

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function makeRequest( idx, elm ) {
			//...
		}

		/**
		 * @param {number} idx
		 * @param {HTMLElement} elm
		 */
		function useRequest( idx, elm ) {
			//...
		}

		this
			// Collect info about all covers we need
			.each( prepareRequest )
			// Make request for needed covers
			.each( makeRequest )
			// Apply images into the page
			.each( useRequest );

		// Return context to allow chaining
		return this;
	}

	// Return context to allow chaining
	return this;

}( jQuery ));