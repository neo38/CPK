<?php
/**
 * KohaRest ILS Driver
 *
 * PHP version 7
 *
 * Copyright (C) Moravian Library 2018
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
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * @category VuFind
 * @package  ILS_Drivers
 * @author   Bohdan Inhliziian <inhliziian@mzk.cz>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     https://vufind.org/wiki/development:plugins:ils_drivers Wiki
 */
namespace CPK\ILS\Driver;

use VuFind\ILS\Driver\KohaRest as KohaRestBase;

/**
 * VuFind Driver for Koha, using REST API
 *
 * @category VuFind
 * @package  ILS_Drivers
 * @author   Bohdan Inhliziian <inhliziian@mzk.cz>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     https://vufind.org/wiki/development:plugins:ils_drivers Wiki
 */
class KohaRest extends KohaRestBase
{
    public function __construct(\VuFind\Date\Converter $dateConverter, Callable $sessionFactory)
    {
        parent::__construct($dateConverter, $sessionFactory);
    }

    /**
     * Get Statuses
     *
     * This is responsible for retrieving the status information for a
     * collection of records.
     *
     * @param array $ids The array of record ids to retrieve the status for
     *
     * @return mixed     An array of getStatus() return values on success.
     */
    public function getStatuses($ids, ...$params)
    {
        $biblioId = explode(":" ,$params[2]);
        $biblioId = $biblioId[1];
        $items = $this->getItemStatusesForBiblio($biblioId);

        return $items;
    }
}
