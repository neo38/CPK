<?php
$toRet = array(
    'extends' => 'root',
    'css' => array(
        // 'vendor/bootstrap.min.css',
        // 'vendor/bootstrap-accessibility.css',
        // 'bootstrap-custom.css',
        'compiled.css',
        'vendor/font-awesome.min.css',
        'vendor/bootstrap-slider.css',
        'vendor/bootstrap-select.min.css',
        'print.css:print',
		'ol.css'
    ),
    'js' => array(
        'vendor/base64.js:lt IE 10', // btoa polyfill
        'vendor/jquery.min.js',
        'vendor/bootstrap.min.js',
        'vendor/rc4.js',
        'vendor/js.cookie.js',
        'vendor/bootstrap-datepicker.js',
        'vendor/bootstrap-datepicker.cs.js',
        'vendor/bootstrap-select.min.js',
        'vendor/bootstrap-slider.js',
        'vendor/jquery.validate.min.js',
        'vendor/validation-additional-methods.js',
		'autocomplete.js',
        'vendor/validator.min.js',
        'common.js',
        'lightbox.js',
        'eu-cookies.js',
        'search-results.js',
        'vendor/jsTree/jstree.min.js',
        'facets.js',
        'lz-string.js',
		'obalkyknih.js',
        'vendor/jquery.visible.min.js',
        'vendor/jquery.bootstrap-growl.js',
        'jquery-cpk/common.js',
        //'jquery-cpk/favorites.js',
        'jquery-cpk/favorites.notifications.js',
        'jquery-cpk/favorites.favorite.js',
        'jquery-cpk/favorites.storage.js',
        'jquery-cpk/favorites.broadcaster.js',
        'jquery-cpk/federative-login.js',
        'jquery-cpk/notifications.js',
        'jquery-cpk/admin.js',
        'jquery-cpk/history.js',
        //'jquery-cpk/module.js',
        //'jquery-cpk/global.controller.js',
        //'jquery-cpk/translate.filter.js',
    ),
    'less' => array(
        'active' => false,
        'compiled.less'
    ),
    'favicon' => 'favicon.ico',
    'helpers' => array(
        'factories' => array(
            'record' => 'CPK\View\Helper\CPK\Factory::getRecord',
            'flashmessages' => 'CPK\View\Helper\CPK\Factory::getFlashmessages',
            'logos' => 'CPK\View\Helper\CPK\Factory::getLogos',
            'globalNotifications' => 'CPK\View\Helper\CPK\Factory::getGlobalNotifications',
            'portalpages' => 'CPK\View\Helper\CPK\Factory::getPortalPages',
            'layoutclass' => 'VuFind\View\Helper\Bootstrap3\Factory::getLayoutClass',
            'piwik' => 'Statistics\View\Helper\Root\Factory::getPiwik',
            'identityProviders' => 'CPK\View\Helper\CPK\Factory::getIdentityProviders',
            'help' => 'CPK\View\Helper\CPK\Factory::getHelp',
            'obalkyknih' => 'CPK\View\Helper\CPK\Factory::getObalkyKnih'
        ),
        'invokables' => array(
            'highlight' => 'VuFind\View\Helper\Bootstrap3\Highlight',
            'search' => 'VuFind\View\Helper\Bootstrap3\Search',
            'vudl' => 'VuDL\View\Helper\Bootstrap3\VuDL',
            'parseFilterOptions' => 'CPK\View\Helper\CPK\ParseFilterOptions',
            'renderarray' => 'CPK\View\Helper\CPK\RenderArray',
            'currenturl' => 'CPK\View\Helper\CPK\CurrentURL'
        )
    )
);

return $toRet;
