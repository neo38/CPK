<?php
$toRet = array(
    'extends' => 'bootstrap3',
    'js' => array(),
);

/**
 * Implementation of easy switching between ng-apps minified & not minified
 *
 * Don't forget to run the bootstrap3/js/compile-ng-apps.sh script after an change is made to non-compiled code if minified version is desired.
 * <b>But don't also forget to update bootstrap3/js/compile-ng-apps.sh's list of files to compile!</b>
 *
 * @var boolean
 */
$useCompiledAngular = false;

$angularForbiddenForIE = true;

if (!($angularForbiddenForIE && USES_IE)) {

    if ($useCompiledAngular) {

        // Add compiled angular apps
        array_push($toRet['js'], 'vendor/angular.min.js', 'ng-cpk/ng-cpk.min.js');
    } else {

        $jsToInclude = [

            'vendor/angular.min.js',

            'ng-cpk/federative-login/module.js',
            'ng-cpk/federative-login/login.controller.js',

            'ng-cpk/notifications/module.js',
            'ng-cpk/notifications/notif.controller.js',

            'ng-cpk/admin/module.js',
            'ng-cpk/admin/configurations/conf.controller.js',

            'ng-cpk/history/module.js',
            'ng-cpk/history/checkedouthistory.controller.js',

            'ng-cpk/module.js',
            'ng-cpk/global.controller.js',
            'ng-cpk/translate.filter.js'
        ];

        $toRet['js'] = array_merge($toRet['js'], $jsToInclude);
    }
}
return $toRet;
