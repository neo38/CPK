<?php
/**
 * Authentication Factory Class
 *
 * PHP version 5
 *
 * Copyright (C) Villanova University 2014.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * @category VuFind2
 * @package  RecordDrivers
 * @author   Luke O'Sullivan <l.osullivan@swansea.ac.uk>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:hierarchy_components Wiki
 */
namespace CPK\Auth;
use Zend\ServiceManager\ServiceManager, CPK\Db\Table\User;

/**
 * Authentication Factory Class
 *
 * @category VuFind2
 * @package  RecordDrivers
 * @author   Luke O'Sullivan <l.osullivan@swansea.ac.uk>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:hierarchy_components Wiki
 */
class Factory
{
    /**
     * Factory for AuthManager.
     *
     * @param ServiceManager $sm Service manager.
     *
     * @return Manager
     */
    public static function getAuthManager(ServiceManager $sm)
    {
        $config = $sm->get('VuFind\Config')->get('config');
        try {
            // Check if the catalog wants to hide the login link, and override
            // the configuration if necessary.
            $catalog = $sm->get('VuFind\ILSConnection');
            if ($catalog->loginIsHidden()) {
                $config = new \Zend\Config\Config($config->toArray(), true);
                $config->Authentication->hideLogin = true;
                $config->setReadOnly();
            }
        } catch (\Exception $e) {
            // Ignore exceptions; if the catalog is broken, throwing an exception
            // here may interfere with UI rendering. If we ignore it now, it will
            // still get handled appropriately later in processing.
            error_log($e->getMessage());
        }

        // Load remaining dependencies:
        $userTable = $sm->get('VuFind\DbTablePluginManager')->get('user');
        $sessionManager = $sm->get('VuFind\SessionManager');
        $pm = $sm->get('VuFind\AuthPluginManager');
        $cookieManager = $sm->get('VuFind\CookieManager');
        $userSettingsTable = $sm->get('VuFind\DbTablePluginManager')
            ->get('usersettings');

        // Build the object:
        return new Manager($config, $userTable, $sessionManager, $pm,
            $cookieManager, $userSettingsTable);
    }

    public static function getShibbolethIdentityManager(ServiceManager $sm) {

        return new ShibbolethIdentityManager($sm->getServiceLocator());
    }

    /**
     * Construct the ILS authenticator.
     *
     * @param ServiceManager $sm Service manager.
     *
     * @return ILSAuthenticator
     */
    public static function getILSAuthenticator(ServiceManager $sm)
    {
        // Construct the ILS authenticator as a lazy loading value holder so that
        // the object is not instantiated until it is called. This helps break a
        // potential circular dependency with the MultiBackend driver as well as
        // saving on initialization costs in cases where the authenticator is not
        // actually utilized.
        $callback = function (& $wrapped, $proxy) use ($sm) {
            // Generate wrapped object:
            $auth = $sm->get('VuFind\AuthManager');
            $catalog = $sm->get('VuFind\ILSConnection');
            $wrapped = new ILSAuthenticator($auth, $catalog);

            // Indicate that initialization is complete to avoid reinitialization:
            $proxy->setProxyInitializer(null);
        };
        $factory = new \ProxyManager\Factory\LazyLoadingValueHolderFactory();
        return $factory->createProxy('CPK\Auth\ILSAuthenticator', $callback);
    }

}