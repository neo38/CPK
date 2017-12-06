/**
 * New implementation of admin controller. Is based on jQuery but is based
 * previous Angular-based code.
 *
 * @author Jiří Kozlovský, original Angular solution
 * @author Ondřej Doněk, <ondrejd@gmail.com>
 */

(function() {
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
		 * @property {HTMLElement} submit
		 * @property {jQuery} editCols
		 * @property {jQuery} inputs
		 * @type {Object}
		 */
		var domLinker = Object.create( null );

		/**
		 * @type {Number} Holds timestamp when some value is edited.
		 */
		var editedAt;

		/**
		 * @property {HTMLElement} div
		 * @property {HTMLElement} input
		 * @type {Object}
		 */
		var currentTableRow = {
			div : undefined,
			input : undefined
		};

		/**
		 * @returns {Promise<boolean>}
		 */
		function init() {
			return Promise
				.resolve( initDom() )
				.then( initEventHandlers );
		}

		/**
		 * @private Initializes DOM needed by the controller.
		 * @returns {Promise<boolean>}
		 */
		function initDom() {
			var result = true;

			domLinker.table    = document.getElementById( "configurationsApprovalTable" );
			domLinker.tbody    = document.getElementById( "configurationsApprovalTableTbody" );
			domLinker.submit   = document.getElementById( "configurationsApprovalTableSubmit" );
			domLinker.editCols = jQuery( ".approval-conf-edit-col", domLinker.tbody );
			domLinker.inputs   = jQuery( "input", domLinker.tbody );

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
		 * @private Initializes event handlers.
		 * @param {boolean} result
		 * @returns {Promise<boolean>}
		 */
		function initEventHandlers( result ) {
			if ( result !== true ) {
				return Promise.resolve( true );
			}

			try {
				domLinker.editCols.click( edit );
				domLinker.inputs.keydown( inputKeyDown );
				domLinker.inputs.blur( inputBlurred );

				return Promise.resolve( true );
			} catch ( e ) {
				return Promise.resolve( true );
			}
		}

		/**
		 * @private Handles edit event.
		 * @param {Event} event
		 * @todo Maybe we should check which elements we are get :) !
		 */
		function edit( event ) {
			currentTableRow.div = event.currentTarget.children[0];
			currentTableRow.input = currentTableRow.div.nextElementSibling;

			showCurrentInput();

			editedAt = ( new Date() ).getTime();
		}

		/**
		 * @private Handles keyDown event.
		 * @param {Event} event
		 */
		function inputKeyDown( event ) {
			if ( event.keyCode === 13 ) { // Enter -> committing changes
				event.preventDefault();

				if ( setNewDivValue( event.target.value ) ) {
					hideCurrentInput();
				} else {
					// Perform dummy submit to show what's wrong
					domLinker.submit.click();
				}
			} else if ( event.keyCode === 27 ) { // Esc -> cancelling changes
				event.target.value = getNewDivValue();
				hideCurrentInput();
			}
		}

		/**
		 * @private Handles blur event on input elements.
		 * @param {Event} event
		 * @todo (ondrejd) What exactly means "special treatment" for number inputs?!
		 */
		function inputBlurred( event ) {
			if ( event.target.type === "number" ) {
				// input of type number needs special treatment
				if ( ( new Date() ).getTime() - 100 < editedAt ) {
					return;
				}
			}

			var newValue = event.target.type === "checkbox"
				? ( event.target.checked ? "1" : "0" )
				: event.target.value;

			if ( ! setNewDivValue( newValue ) ) {
				// Cancelling changes
				event.target.value = getNewDivValue();
			}

			hideCurrentInput();
		}

		/**
		 * @private Shows input within current table row & hides current div.
		 */
		function showCurrentInput() {
			jQuery( currentTableRow.input ).removeClass( "hidden" );
			CPK.global.hideDOM( currentTableRow.div );
			currentTableRow.input.focus();
		}

		/**
		 * @private Hides input within current table row & shows current div.
		 */
		function hideCurrentInput() {
			jQuery( currentTableRow.input ).addClass( "hidden" );
			CPK.global.showDOM(currentTableRow.div);
		}

		/**
		 * @private Sets new value to the <ins> element within a div.
		 * @param {String} val
		 * @returns {boolean} Returns FALSE if the field being set is required but its conditions are not met.
		 */
		function setNewDivValue( val ) {
			if ( typeof currentTableRow.input !== "object" ) {
				return true;
			}

			if ( val === "" ) {
				var isNumber = currentTableRow.input.type === "number",
					isRequired = currentTableRow.input.required;

				if ( isNumber === true ) {
					val = currentTableRow.input.placeholder;
				} else if (isRequired === true) {
					return false;
				}
			}

			var ins = currentTableRow.div.getElementsByTagName( "ins" );

			if ( ins.length === 0 ) {
				var contents = currentTableRow.div.textContent.trim();

				if ( contents === val.trim() ) {
					return true;
				}

				if ( contents.length > 0 ) {
					currentTableRow.div.innerHTML = "<del style='color: red;'>" + contents + "</del><br>";
				}

				ins = document.createElement( "ins" );
				ins.style.color = "green";
				currentTableRow.div.appendChild( ins );
			} else {
				var del = currentTableRow.div.getElementsByTagName( "del" );

				if ( del.length > 0 ) {
					var previousContents = del[0].textContent.trim();

					if ( previousContents === val.trim() ) {
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
		 * @private Gets the proposed value of the <ins> element within a div.
		 * @returns {string} If <ins> isn't found returns the contents of the div.
		 */
		function getNewDivValue() {
			var ins = currentTableRow.div.getElementsByTagName( "ins" ),
				contents;

			if ( ins.length === 0 ) {
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

	/**
	 * @type {ApprovalController}
	 */
	CPK.admin.ApprovalController = new ApprovalController();
}());