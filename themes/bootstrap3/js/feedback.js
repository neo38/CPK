//Enable more chaptchas on one site

$_feedbackData = {};
let initData = (siteKey, activeTab) => {
    $_feedbackData.siteKey = siteKey;
    $_feedbackData.activeTab = activeTab;
}

var CaptchaCallback = function() {
    grecaptcha.render('RecaptchaField1', {'sitekey' : $_feedbackData.siteKey});
    grecaptcha.render('RecaptchaField2', {'sitekey' : $_feedbackData.siteKey});
};

// Open tab, that was opened before captcha or form submit failed
if ($_feedbackData.activeTab) {
    jQuery( `.nav-tabs a[href="#${$_feedbackData.activeTab}"]` ).tab( 'show' );
}

jQuery( document ).ready( function() {

    //Javascript to enable link to tab
    var url = document.location.toString();
    if (url.match('#')) {
        $('.nav-tabs a[href="#' + url.split('#')[1] + '"]').tab('show');
    }

    // Change hash for page-reload
    $('.nav-tabs a').on('shown.bs.tab', function (e) {
        window.location.hash = e.target.hash;
    });

    $('#help .btn-primary').on('click', function() {
        dataLayer.push({
            'event': 'action.contact',
            'actionContext': {
                'eventCategory': 'contact',
                'eventAction': 'feedback',
                'eventLabel': 'help',
                'eventValue': undefined,
                'nonInteraction': false
            }
        });
    });

    $('#bugreport .btn-primary').on('click', function() {
        dataLayer.push({
            'event': 'action.contact',
            'actionContext': {
                'eventCategory': 'contact',
                'eventAction': 'feedback',
                'eventLabel': 'bugreport',
                'eventValue': undefined,
                'nonInteraction': false
            }
        });
    });

});