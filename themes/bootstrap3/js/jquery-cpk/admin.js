/**
 * New implementation of admin controller. Is based on jQuery but is based
 * previous Angular-based code.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
    if (CPK.verbose === true) {
        console.log("jquery-cpk/admin.js");
    }

    /**
     * Controller for Admin -> Configurations Approval.
	 * @returns {Object}
	 * @constructor
     */
    function ApprovalController() {
		/**
		 * Holds array of linked HTML elements.
		 * @property {HTMLElement} table
		 * @property {HTMLElement} tbody
		 * @property {HTMLElement} editCols
		 * @property {HTMLElement} submit
		 * @type {Object}
		 */
		var domLinker = Object.create( null );

		var editedAt = undefined,
			currentTableRow = {
				div : undefined,
				input : undefined
			};

		/**
		 * @returns {Promise<boolean>}
		 */
		function init() {
			return Promise
				.resolve( initDom() )
				.then( resolveInitDom )
				.then( resolveInitEventHandlers );
		}

		/**
		 * @private Initializes DOM needed by the controller.
		 * @returns {Promise<boolean>}
		 */
		function initDom() {
			var result = true;

			domLinker.table    = document.getElementById( "configurationsApprovalTable" );
			domLinker.tbody    = document.getElementById( "configurationsApprovalTableTbody" );
			domLinker.editCols = jQuery( ".approval-conf-edit-col", domLinker.tbody );
			domLinker.submit   = document.getElementById( "configurationsApprovalTableSubmit" );

			/**
			 * @param {HTMLElement} elm
			 */
			function checkElm( elm ) {
				try {
					if ( elm.nodeType !== 1 ) {
						result = false;
					}
				} catch ( e ) {
					result = false;
				}
			}

			// Check if we found all DOM elements we need
			[ domLinker.table, domLinker.tbody, domLinker.submit ].forEach( checkElm );

			return Promise.resolve( result );
		}

		/**
		 * @private Resolves initialization of DOM.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function resolveInitDom( result ) {
			if ( CPK.verbose === true ) {
				console.info( result === true
					? "The initialization of DOM for ApprovalController succeeded."
					: "The initialization of DOM for ApprovalController failed." );
			}

			return Promise.resolve( initEventHandlers() );
		}

		/**
		 * @private Initializes event handlers.
		 * @returns {Promise<boolean>}
		 * @todo Finish this!
		 */
		function initEventHandlers() {
			return Promise.resolve( false );
		}

		/**
		 * @private Resolves initialization of event handlers.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function resolveInitEventHandlers( result ) {
			if ( CPK.verbose === true ) {
				console.info( result === true
					? "The initialization of event handlers for ApprovalController succeeded."
					: "The initialization of event handlers for ApprovalController failed." );
			}

			return Promise.resolve( result );
		}


        // Public

        /**
         * Handler for edit event.
         * @param {Event} event
         * @todo Maybe we should check which elements we are get!
         */
        function edit(event) {
            currentTableRow.div = event.currentTarget.children[0];
            currentTableRow.input = currentTableRow.div.nextElementSibling;

            showCurrentInput();

            editedAt = (new Date()).getTime();
        }

        /**
         * Handler for keyDown event.
         * @param {Event} event
         */
        function inputKeyDown(event) {
            if (event.keyCode === 13) { // Enter -> committing changes
                event.preventDefault();

                if (setNewDivValue(event.target.value)) {
                    hideCurrentInput();
                } else {
                    // Perform dummy submit to show what's wrong
                    submitApprovalBtn.click();
                }
            } else if (event.keyCode === 27) { // Esc -> cancelling changes
                event.target.value = getNewDivValue();
                hideCurrentInput();
            }
        }

        /**
         * Handler for blur event on input elements.
         * @param {Event} event
         * @todo What exactly means "special treatment" for number inputs?!
         */
        function inputBlurred(event) {
            if (event.target.type === "number") {
                // input of type number needs special treatment
                if ((new Date()).getTime() - 100 < editedAt) {
                    // If I understand correctly - this checks timeout but that
                    // depends on machine speed also... I don't think this can
                    // be possibly good...
                    return;
                }
            }

            var newValue = event.target.type === "checkbox"
                ? (event.target.checked ? "1" : "0")
                : event.target.value;

            if (!setNewDivValue(newValue)) {
                // Cancelling changes
                event.target.value = getNewDivValue();
            }

            hideCurrentInput();
        }

        // Private

        /**
         * Shows input within current table row & hides current div
         */
        function showCurrentInput() {
            currentTableRow.input.className = currentTableRow.input.className.replace(/\shidden|hidden\s?/g, "");
            CPK.global.hideDOM(currentTableRow.div);
            currentTableRow.input.focus();
        }

        /**
         * Hides input within current table row & shows current div
         */
        function hideCurrentInput() {
            currentTableRow.input.className = currentTableRow.input.className + " hidden";
            CPK.global.showDOM(currentTableRow.div);
        }

        /**
         * Sets new value to the <ins> element within a div.
         *
         * It also moves all contents into <del> element when no <ins> found &
         * creates new <ins> element with value provided
         *
         * Returns false only if the field being set is required & it's not met
         * the conditions
         * @param {String} val
         * @returns {Boolean} Returns FALSE if the field being set is required
         *                    but its conditions are not met.
         */
        function setNewDivValue(val) {
            if (val === "") {
                var isNumber = currentTableRow.input.type === "number",
                    isRequired = currentTableRow.input.required;

                if (isNumber === true) {
                    // Before here was this construct:
                    //  `value = currentTableRow.input.currentTableRow.input.placeholder;`
                    val = currentTableRow.input.placeholder;
                } else if (isRequired === true) {
                    return false;
                }
            }

            var ins = currentTableRow.div.getElementsByTagName("ins");

            if (ins.length === 0) {
                var contents = currentTableRow.div.textContent.trim();

                if (contents === val.trim()) {
                    return true;
                }

                if (contents.length) {
                    /**
                     * @todo There should be better of using class not directly written color!
                     */
                    currentTableRow.div.innerHTML = "<del style='color: red;'>" + contents + "</del><br>";
                }

                ins = document.createElement("ins");
                ins.style.color = "green";
                currentTableRow.div.appendChild(ins);
            } else {
                var del = currentTableRow.div.getElementsByTagName("del");

                if (del.length) {
                    var previousContents = del[0].textContent.trim();

                    if (previousContents === val.trim()) {
                        currentTableRow.div.innerHTML = previousContents;
                        return true;
                    }
                }

                ins = ins[0];
            }

            ins.textContent = val;

            return true;
        }

        /**
         * Gets the proposed value of the <ins> element within a div.
         *
         * If <ins> is not found, then are returned the contents of the div.
         */
        function getNewDivValue() {
            var ins = currentTableRow.div.getElementsByTagName("ins"),
                contents;

            if (ins.length === 0) {
                contents = currentTableRow.div.textContent.trim();
            } else {
                contents = ins[0].textContent.trim();
            }

            return contents;
        }

		// Public API
		var Controller = Object.create( null );
		Controller.initialize = init;

		return Controller;
    }

    /*function submitApproval() {
        return {
            restrict : 'A',
            link : linker
        };

        function linker(scope, elements, attrs) {
            submitApprovalBtn = elements.context;
        }
    }*/

    /**
     * @type {ApprovalController}
     */
    CPK.admin.ApprovalController = new ApprovalController();

}());