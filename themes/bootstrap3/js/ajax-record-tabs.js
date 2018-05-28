/**
 * Gets Buy Links via AjaxController
 * 
 * @param	{string}	recordID
 * @param	{string}	parentRecordID
 * @param	{function}	callback
 * @return	{undefined}
 */
function getBuyLinks( recordID, parentRecordID, callback ) {
	$.ajax({
		dataType: 'json',
		url: '/AJAX/JSON?method=getBuyLinks',
		data: { recordID: recordID, parentRecordID: parentRecordID },
		async: true,
		success: function( response ) {
			if( response.status !== 'OK' ) {
				// display the error message on each of the ajax status place holder
				$( "#ajax-error-info" ).empty().append( response.data );
			} else {
				callback( response );
			}
		}
	});
}

/**
 * Prints SFX JIB Results
 * 
 * @param	{string}	sfxUrl
 * @param	{string}	recordID
 * @param	{string}	institute
 * @param	{array}		arrayOf866
 * @return	{undefined}	
 */
function getSfxJibResult( recordID, sourceInstitute, arrayOf866 ) {
	
	/**
	 * Institute ID.
	 * @type {string}
	 */
	var sourceInstitute = typeof sourceInstitute !== 'undefined' ? sourceInstitute : 'default';

	$.ajax({
		dataType: 'json',
		async: true,
		url: '/AJAX/JSON?method=callLinkServer',
		data: { recordID: recordID, sourceInstitute: sourceInstitute },
		success: function( sfxJibResult ) {

			if( sfxJibResult.status !== 'OK' ) {

				// display the error message on each of the ajax status place holder
				$( "#ajax-error-info" ).empty().append( response.data );
			} else {

				var c = sfxJibResult.data[0].sfxResult.length;

				for (var j = 0; j < c; j++){

					if ( sfxJibResult.data[0].sfxResult[j].targets.target[0] !== '' && arrayOf866 !== '') {

						var count = sfxJibResult.data[0].sfxResult[j].targets.target.length;
				
						for (var i = 0; i < count; i++) {
							var targetServiceId = sfxJibResult.data[0].sfxResult[j].targets.target[i].target_service_id;
							if ( arrayOf866[targetServiceId] != null ) {
								var record = arrayOf866[targetServiceId];
								var anchor = record.anchor;
								var source = record.source;
								var url = sfxJibResult.data[0].sfxResult[j].targets.target[i].target_url;
								$( "#e-version-table tbody" ).append( "<tr>"
										+"<td>"+databaseTranslation+"</td>"
										+"<td><span class='label label-warning'>"+unknownTranslation+"</span></td>"
										+"<td><a href='"+url+"'>"+anchor+"</a></td>"
										+"<td>"+source+"</td>"
										+"</tr>");
	
							}
						}
					}
				}	
				
			}
		}
	});
}

/**
 * Gets Buy Links via AjaxController
 * 
 * @param recordUniqueID
 * @param	{string}	parentRecordID
 * @param 	{string}	sourceInstitute
 * @param	{function}	callback
 * @return	{undefined}
 */
function get866( recordUniqueID, parentRecordID, sourceInstitute, callback ) {
	$.ajax({
		dataType: 'json',
		async: true,
		url: '/AJAX/JSON?method=get866',
		data: { parentRecordID: parentRecordID },
		success: function( response ) {
			if( response.status !== 'OK' ) {
				// display the error message on each of the ajax status place holder
				$( "#ajax-error-info" ).empty().append( response.data );
			} else {
				callback( recordUniqueID, response['data'][0]['field866'], sourceInstitute );
			}
		}
	});
}

/**
 * Downloads SFX JIB content for current record 
 * and displays it via getSfxJibResult() callback
 * 
 * @param	{string}	recordUniqueID
 * @param	{array}		rawDataArrayOf866
 * @param 	{string}	sourceInstitute
 * @return	{getSfxJibResult}
 */
function display866( recordUniqueID, rawDataArrayOf866, sourceInstitute ) {
	
	/**
	 * Array of values from field 866
	 * @type {array}
	 */
	var arrayOf866 = {};
	
	if (false != rawDataArrayOf866) {
		rawDataArrayOf866.forEach(function(entry) {
			var pole = entry.split("|");

			arrayOf866[pole[1]] = {
				'source': pole[0], 
				'anchor': pole[2]
			}
		});

		getSfxJibResult(recordUniqueID, sourceInstitute, arrayOf866);

	}
}

/**
 * Get record unique id
 *
 * @param {string} recordUniqueId
 * @returns {promise}
 */
function getParentRecordId( recordUniqueId ) {
    return $.ajax( {
        dataType: 'json',
        async: true,
        type: 'POST',
        url: '/AJAX/JSON?method=getParentRecordId',
        data: {
            recordUniqueId: recordUniqueId,
        },
    } );
}

/**
 * Get number of items for record tabs
 *
 * @param {string} parentRecordId
 * @returns {promise}
 */
function getItemsCountForTabsInRecord( parentRecordId ) {
    return $.ajax( {
        dataType: 'json',
        async: true,
        type: 'POST',
        url: '/AJAX/JSON?method=getItemsCountForTabsInRecord',
        data: {
            parentRecordId: parentRecordId,
        },
    } );
}