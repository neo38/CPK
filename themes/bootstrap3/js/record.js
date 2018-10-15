/*global checkSaveStatuses, deparam, extractClassParams, getListUrlFromHTML, htmlEncode, Lightbox, syn_get_widget, userIsLoggedIn, VuFind */

/**
 * Functions and event handlers specific to record pages.
 */
function checkRequestIsValid(element, requestType, blockedClass) {
  var recordId = element.href.match(/\/Record\/([^\/]+)\//)[1];
  var vars = deparam(element.href);
  vars['id'] = recordId;

  var url = VuFind.getPath() + '/AJAX/JSON?' + $.param({method:'checkRequestIsValid', id: recordId, requestType: requestType, data: vars});
  $.ajax({
    dataType: 'json',
    cache: false,
    url: url,
    success: function(response) {
      if (response.status == 'OK') {
        if (response.data.status) {
          $(element).removeClass('disabled')
            .attr('title', response.data.msg)
            .html('<i class="fa fa-flag"></i>&nbsp;'+response.data.msg);
        } else {
          $(element).remove();
        }
      } else if (response.status == 'NEED_AUTH') {
        $(element).replaceWith('<span class="' + blockedClass + '">' + response.data.msg + '</span>');
      }
    }
  });
}

function setUpCheckRequest() {
  $('.checkRequest').each(function(i) {
    checkRequestIsValid(this, 'Hold', 'holdBlocked');
  });
  $('.checkStorageRetrievalRequest').each(function(i) {
    checkRequestIsValid(this, 'StorageRetrievalRequest', 'StorageRetrievalRequestBlocked');
  });
  $('.checkILLRequest').each(function(i) {
    checkRequestIsValid(this, 'ILLRequest', 'ILLRequestBlocked');
  });
}

function deleteRecordComment(element, recordId, recordSource, commentId) {
  var url = VuFind.getPath() + '/AJAX/JSON?' + $.param({method:'deleteRecordComment',id:commentId});
  $.ajax({
    dataType: 'json',
    url: url,
    success: function(response) {
      if (response.status == 'OK') {
        $($(element).closest('.comment')[0]).remove();
      }
    }
  });
}

function refreshCommentList($target, recordId, recordSource) {
  var url = VuFind.getPath() + '/AJAX/JSON?' + $.param({method:'getRecordCommentsAsHTML',id:recordId,'source':recordSource});
  $.ajax({
    dataType: 'json',
    url: url,
    success: function(response) {
      // Update HTML
      if (response.status == 'OK') {
        var $commentList = $target.find('.comment-list');
        $commentList.empty();
        $commentList.append(response.data);
        $commentList.find('.delete').unbind('click').click(function() {
          var commentId = $(this).attr('id').substr('recordComment'.length);
          deleteRecordComment(this, recordId, recordSource, commentId);
          return false;
        });
        $target.find('.comment-form input[type="submit"]').button('reset');
      }
    }
  });
}

function refreshCommentListObalkyKnih(recordId, recordSource) {
  var url = path + '/AJAX/JSON?' + $.param({method:'getRecordCommentsObalkyKnihAsHTML',id:recordId,'source':recordSource});
  $.ajax({
    dataType: 'json',
    url: url,
    success: function(response) {
      // Update HTML
      if (response.status == 'OK') {
        $('#commentList').empty();
        $('#commentList').append(response.data);
        $('input[type="submit"]').button('reset');
        $('.delete').unbind('click').click(function() {
          var commentId = $(this).attr('id').substr('recordComment'.length);
          deleteRecordComment(this, recordId, recordSource, commentId);
          return false;
        });
      }
    }
  });
}

function registerAjaxCommentRecord() {
  // Form submission
  $('form.comment-form').unbind('submit').submit(function() {
    var form = this;
    var id = form.id.value;
    var recordSource = form.source.value;
    var url = VuFind.getPath() + '/AJAX/JSON?' + $.param({method:'commentRecord'});
    var data = {
      comment:form.comment.value,
      id:id,
      source:recordSource
    };
    $.ajax({
      type: 'POST',
      url:  url,
      data: data,
      dataType: 'json',
      success: function(response) {
        if (response.status == 'OK') {
          var $tab = $(form).closest('.tab-pane');
          refreshCommentList($tab, id, recordSource);
          $(form).find('textarea[name="comment"]').val('');
          $(form).find('input[type="submit"]').button('loading');
        } else {
          Lightbox.displayError(response.data);
        }
      }
    });
    return false;
  });
  // Delete links
  $('.delete').click(function() {
    var commentId = this.id.substr('recordComment'.length);
    deleteRecordComment(this, $('.hiddenId').val(), $('.hiddenSource').val(), commentId);
    return false;
  });
}


function registerAjaxCommentRecordObalkyKnih() {
  // Form submission
  $('form[name="commentRecordObalkyKnih"]').unbind('submit').submit(function(){
    var form = this;
    var id = form.id.value;
    var recordSource = form.source.value;
    var obalkyknihbookid = form.obalkyknihbookid.value;
    var url = path + '/AJAX/JSON?' + $.param({method:'commentRecordObalkyKnih'});
    var data = {
      comment:form.comment.value,
      id:id,
      source:recordSource,
      obalkyknihbookid:obalkyknihbookid
    };
    $.ajax({
      type: 'POST',
      url:  url,
      data: data,
      dataType: 'json',
      success: function(response) {
        var form = 'form[name="commentRecord"]';
        if (response.status == 'OK') {
          refreshCommentListObalkyKnih(id, recordSource);
          $(form).find('textarea[name="comment"]').val('');
          $(form).find('input[type="submit"]').button('loading');
        } else {
          Lightbox.displayError(response.data);
        }
      }
    });
    return false;
  });
  // Delete links
  $('.delete').click(function(){deleteRecordComment(this, $('.hiddenId').val(), $('.hiddenSource').val(), this.id.substr(13));return false;});
}

function registerTabEvents() {
  // register the record comment form to be submitted via AJAX
  registerAjaxCommentRecord();
  registerAjaxCommentRecordObalkyKnih();

  setUpCheckRequest();

  // Place a Hold
  // Place a Storage Hold
  // Place an ILL Request
  $('.placehold,.placeStorageRetrievalRequest,.placeILLRequest').click(function() {
    var parts = $(this).attr('href').split('?');
    parts = parts[0].split('/');
    var params = deparam($(this).attr('href'));
    params.id = parts[parts.length-2];
    params.hashKey = params.hashKey.split('#')[0]; // Remove #tabnav
    return Lightbox.get('Record', parts[parts.length-1], params, false, function(html) {
      Lightbox.checkForError(html, Lightbox.changeContent);
    });
  });
}

function ajaxLoadTab($newTab, tabid, setHash) {
  // Parse out the base URL for the current record:
  var urlParts = document.URL.split(/[?#]/);
  var urlWithoutFragment = urlParts[0];
  var path = VuFind.getPath();
  var urlroot = null;
  if (path === '') {
    // special case -- VuFind installed at site root:
    var chunks = urlWithoutFragment.split('/');

    urlroot = '/' + chunks[3] + '/' + chunks[4];

  } else {
    // standard case -- VuFind has its own path under site:
    var pathInUrl = urlWithoutFragment.indexOf(path);
    var parts = urlWithoutFragment.substring(pathInUrl + path.length + 1).split('/');
    urlroot = '/' + parts[0] + '/' + parts[1];
  }

  // Request the tab via AJAX:
  $.ajax({
    url: path + urlroot + '/AjaxTab',
    type: 'POST',
    data: {tab: tabid},
    success: function(data) {
      $newTab.html(data);
      registerTabEvents();
      if(typeof syn_get_widget === "function") {
        syn_get_widget();
      }
      if (typeof setHash == 'undefined' || setHash) {
        window.location.hash = tabid;
      }
    }
  });
  return false;
}

function refreshTagList(target, loggedin) {
  loggedin = !!loggedin || userIsLoggedIn;
  if (typeof target === 'undefined') {
    target = document;
  }
  var recordId = $(target).find('.hiddenId').val();
  var recordSource = $(target).find('.hiddenSource').val();
  var $tagList = $(target).find('.tagList');
  if ($tagList.length > 0) {
    $tagList.empty();
    var url = VuFind.getPath() + '/AJAX/JSON?' + $.param({method:'getRecordTags',id:recordId,'source':recordSource});
    $.ajax({
      dataType: 'json',
      url: url,
      complete: function(response) {
        if(response.status == 200) {
          $tagList.replaceWith(response.responseText);
          if(loggedin) {
            $tagList.addClass('loggedin');
          } else {
            $tagList.removeClass('loggedin');
          }
        }
      }
    });
  }
}

function ajaxTagUpdate(link, tag, remove) {
  if(typeof link === "undefined") {
    link = document;
  }
  if(typeof remove === "undefined") {
    remove = false;
  }
  var $target = $(link).closest('.record');
  var recordId = $target.find('.hiddenId').val();
  var recordSource = $target.find('.hiddenSource').val();
  $.ajax({
    url:VuFind.getPath() + '/AJAX/JSON?method=tagRecord',
    method:'POST',
    data:{
      tag:'"'+tag.replace(/\+/g, ' ')+'"',
      id:recordId,
      source:recordSource,
      remove:remove
    },
    complete: function() {
      refreshTagList($target, false);
    }
  });
}

function applyRecordTabHash() {
  var activeTab = $('.record-tabs li.active a').attr('class');
  var $initiallyActiveTab = $('.record-tabs li.initiallyActive a');
  var newTab = typeof window.location.hash !== 'undefined'
    ? window.location.hash.toLowerCase() : '';

  // Open tag in url hash
  if (newTab.length == 0 || newTab == '#tabnav') {
    $initiallyActiveTab.click();
  } else if (newTab.length > 0 && '#' + (activeTab || '') != newTab) {
    $('.'+newTab.substr(1)).click();
  }
}

$(window).on('hashchange', applyRecordTabHash);

function setupRecordToolbar(target) {
  if (typeof target === 'undefined') {
    target = document;
  }
  // Cite lightbox
  var $elem = $(target);
  var id = $elem.find('.hiddenId').val();
  $elem.find('.cite-record').click(function() {
    var params = extractClassParams(this);
    return Lightbox.get(params['controller'], 'Cite', {id:id});
  });
  // Mail lightbox
  $elem.find('.mail-record').click(function() {
    var params = extractClassParams(this);
    return Lightbox.get(params['controller'], 'Email', {id:id});
  });
  // Save lightbox
  $elem.find('.save-record').click(function() {
    var params = extractClassParams(this);
    return Lightbox.get(params['controller'], 'Save', {id:id});
  });
  // SMS lightbox
  $elem.find('.sms-record').click(function() {
    var params = extractClassParams(this);
    return Lightbox.get(params['controller'], 'SMS', {id:id});
  });
  $elem.find('.tag-record').click(function() {
    var parts = this.href.split('/');
    return Lightbox.get(parts[parts.length-3],'AddTag',{id:id});
  });
}

function recordDocReady() {
  registerTabEvents();

  $('.record-tabs .nav-tabs a').click(function (e) {
    if ($(this.parentNode).hasClass('active')) {
      return true;
    }
    var tabid = this.className;
    var $top = $(this).closest('.record-tabs');
    $top.find('.tab-pane.active').removeClass('active');
    $(this).tab('show');
    if ($top.find('.'+tabid+'-tab').length > 0) {
      $top.find('.'+tabid+'-tab').addClass('active');
      window.location.hash = tabid;
      return false;
    } else {
      // if we're flagged to skip AJAX for this tab, just return true and let the browser handle it.
      if ($(this.parentNode).hasClass('noajax')) {
        return true;
      }
      var newTab = $('<div class="tab-pane active '+tabid+'-tab"><i class="fa fa-spinner fa-spin"></i> '+VuFind.translate('loading')+'...</div>');
      $top.find('.tab-content').append(newTab);
      return ajaxLoadTab(newTab, tabid, !$(this).parent().hasClass('initiallyActive'));
    }
  });
  applyRecordTabHash();

  /* --- LIGHTBOX --- */
  setupRecordToolbar();
  // Form handlers
  Lightbox.addFormCallback('emailRecord', function(){
    Lightbox.confirm(VuFind.translate('bulk_email_success'));
  });
  Lightbox.addFormCallback('placeHold', function(html) {
    Lightbox.checkForError(html, function(html) {
      var divPattern = '<div class="alert alert-info">';
      var fi = html.indexOf(divPattern);
      var li = html.indexOf('</div>', fi+divPattern.length);
      Lightbox.confirm(html.substring(fi+divPattern.length, li).replace(/^[\s<>]+|[\s<>]+$/g, ''));
    });
  });
  Lightbox.addFormCallback('placeILLRequest', function() {
    document.location.href = VuFind.getPath() + '/MyResearch/ILLRequests';
  });
  Lightbox.addFormCallback('placeStorageRetrievalRequest', function() {
    document.location.href = VuFind.getPath() + '/MyResearch/StorageRetrievalRequests';
  });
  Lightbox.addFormCallback('saveRecord', function(html) {
    checkSaveStatuses();
    refreshTagList();
    // go to list link
    var msg = getListUrlFromHTML(html);
    Lightbox.success(msg);
  });
  Lightbox.addFormCallback('smsRecord', function() {
    Lightbox.confirm(VuFind.translate('sms_success'));
  });
  // Tag lightbox
  Lightbox.addFormCallback('tagRecord', function(html) {
    refreshTagList(true);
    Lightbox.confirm(VuFind.translate('add_tag_success'));
  });
}

/**
 * Dispay citation
 * 
 * @author	Martin Kravec <martin.kravec@mzk.cz>
 * 
 * @return	{undefined}
 */
function displayCitationLink() {
	jQuery( '#citace-pro > a' ).addClass( 'citations-link' );
	jQuery( '#citace-pro > a' ).removeClass( 'disabled-link' );
	jQuery( '#citation-link-spinner' ).addClass( 'hidden' );
}

/**
 * Get citation
 * 
 * @author	Martin Kravec <martin.kravec@mzk.cz>
 * 
 * @param	{string}	recordId
 * @param	{function}	callback
 * @return	{undefined}
 */
function getCitation( recordId, citationValue , callback ) {
	$( '.citation-loader' ).removeClass( 'hidden' );
	$( '#citation-style-selector' ).addClass( 'hidden' );
	$( '#citation-placeholder' ).addClass( 'hidden' );
	$.ajax({
		dataType: 'json',
		async: true,
		type: 'POST',
		url: '/AJAX/JSON?method=getCitation',
		data: { recordId: recordId, citationValue: citationValue },
		success: function( result ) {
			if( result.status !== 'OK' ) {
				$( "#ajax-error-info" ).empty().append( result.data );
				$( '#citation-link-spinner' ).addClass( 'hidden' );
			} else {
				callback( result.data );
				displayCitationLink();
				$( '.citation-loader' ).addClass( 'hidden' );
				$( '#citation-placeholder' ).removeClass( 'hidden' );
			}
		},
		fail: function( jqXHR, textStatus ) {
			console.log( "Request failed: " + textStatus );
		}
	});
}

function selectText( containerid ) {
    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(containerid));
        range.select();
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().addRange(range);
    }
}

/**
 * Insert citation
 * 
 * @author	Martin Kravec <martin.kravec@mzk.cz>
 * 
 * @return	{undefined}
 */
function insertCitation( citation ) {
	var html = "<span id=\"selectable\" onclick=\"selectText('selectable')\">"+citation+"</span>";
	jQuery( '#citation-placeholder' ).html( html );
	$( '#citation-style-selector' ).removeClass( 'hidden' );
}

jQuery( document ).ready( function( $ ) {
	$( '.style' ).on( 'change', function() {
		var recordId = $( this ).attr( 'id' ).replace( 'record_', '' );
		getCitation( recordId, $( this ).val(), insertCitation);
	});
	
	$( '.selectOnClick' ).on( 'click', function() {
		$( this ).select();
	});
	
	/* Record email form client-side validation */
	$( '#email-record' ).validate({ // initialize the plugin
        rules: {
            from: {
                required: true,
                email: true
            },
            to: {
                required: true,
                email: true
            }
        },
        messages: {
        	from: {
              required: VuFind.translate( 'Enter email' ),
              email: VuFind.translate( 'Wrong email format' )
            },
            to: {
                required: VuFind.translate( 'Enter email' ),
                email: VuFind.translate( 'Wrong email format' )
              }
          }
    });

  $('#mail-record').on('click', function() {
    dataLayer.push({
      'event': 'action.record',
      'actionContext': {
        'eventCategory': 'record',
        'eventAction': 'sendEmail',
        'eventLabel': $('input.hiddenId').val(),
        'eventValue': undefined,
        'nonInteraction': false
      }
    });
  });

  $('.export-toggle').on('click', function() {
    dataLayer.push({
      'event': 'action.record',
      'actionContext': {
        'eventCategory': 'record',
        'eventAction': 'export',
        'eventLabel': $('input.hiddenId').val(),
        'eventValue': undefined,
        'nonInteraction': false
      }
    });
  });

  $('#permalinkAnchor').on('click', function() {
    dataLayer.push({
      'event': 'action.record',
      'actionContext': {
        'eventCategory': 'record',
        'eventAction': 'permalink',
        'eventLabel': $('input.hiddenId').val(),
        'eventValue': undefined,
        'nonInteraction': false
      }
    });
  });

  $('#save-record').on('click', function() {
    dataLayer.push({
      'event': 'action.record',
      'actionContext': {
        'eventCategory': 'record',
        'eventAction': 'favourite',
        'eventLabel': $('input.hiddenId').val(),
        'eventValue': undefined,
        'nonInteraction': false
      }
    });
  });

  $('#citace-pro').on('click', function() {
    dataLayer.push({
      'event': 'action.record',
      'actionContext': {
        'eventCategory': 'record',
        'eventAction': 'showCitation',
        'eventLabel': $('input.hiddenId').val(),
        'eventValue': undefined,
        'nonInteraction': false
      }
    });
  });

  $('#e-version-table a').on('click', function() {
    dataLayer.push({
      'event': 'action.record',
      'actionContext': {
        'eventCategory': 'record',
        'eventAction': 'ebook',
        'eventLabel': $('input.hiddenId').val(),
        'eventValue': undefined,
        'nonInteraction': false
      }
    });
  });

  const sigla = $( '#library-sigla' ).text();
  if (sigla !== '' && sigla !== 'undefined') {
    dataLayer.push( {
      'page': {
        'library': sigla,
      },
    } );
  }
});

/**
 * Smooth scroll to the top of the element
 *
 * @param	{string}	elementId
 * @return	{undefined}
 */
var smoothScrollToElement = function( elementId ) {
    $( 'html,body' ).animate( {
        scrollTop: $( elementId ).offset().top
    }, 1000);
};
