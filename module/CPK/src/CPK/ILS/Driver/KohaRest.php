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

    /**
     * Get Patron Profile
     *
     * This is responsible for retrieving the profile for a specific patron.
     *
     * @param array $patron The patron array
     *
     * @return array        Array of the patron's profile data on success.
     */
    public function getMyProfile($patron)
    {
        $result = $this->makeRequest(
            ['v1', 'patrons', 52], false, 'GET', $patron
        );
        $expirationDate = !empty($result['dateexpiry'])
            ? $this->dateConverter->convertToDisplayDate(
                'Y-m-d', $result['dateexpiry']
            ) : '';


        return [
            'firstname' => $result['firstname'],
            'lastname' => $result['surname'],
            'phone' => $result['mobile'],
            'smsnumber' => $result['smsalertnumber'],
            'email' => $result['email'],
            'address1' => $result['address'],
            'address2' => $result['address2'],
            'zip' => $result['zipcode'],
            'city' => $result['city'],
            'country' => $result['country'],
            'expire' => $expirationDate,
            'cat_username' => $patron['cat_username']
        ];
    }

    /**
     * Get Patron Fines
     *
     * This is responsible for retrieving all fines by a specific patron.
     *
     * @param array $patron The patron array from patronLogin
     *
     * @return array        Array of the patron's fines on success.
     */
    public function getMyFines($patron)
    {
        $fines = parent::getMyFines($patron);
        foreach ($fines as &$fine) {
            $fine['payableOnline'] = true;
        }
        return $fines;
    }

    /**
     * Get statuses for an item
     *
     * @param array $item Item from Koha
     *
     * @return array Status array and possible due date
     */
    protected function getItemStatusCodes($item)
    {
        $statuses = [];
        if ($item['availability']['available']) {
            $statuses[] = $this->translator->translate('status_available');
        } elseif (isset($item['availability']['unavailabilities'])) {
            foreach ($item['availability']['unavailabilities'] as $key => $reason) {
                if (isset($this->config['ItemStatusMappings'][$key])) {
                    $statuses[] = $this->config['ItemStatusMappings'][$key];
                } elseif (strncmp($key, 'Item::', 6) == 0) {
                    $status = substr($key, 6);
                    switch ($status) {
                        case 'CheckedOut':
                            $overdue = false;
                            if (!empty($reason['date_due'])) {
                                $duedate = $this->dateConverter->convert(
                                    'Y-m-d',
                                    'U',
                                    $reason['date_due']
                                );
                                $overdue = $duedate < time();
                            }
                            $statuses[] = $overdue ? 'Overdue' : $this->translator->translate('status_On Loan');
                            break;
                        case 'Lost':
                            $statuses[] = $this->translator->translate('status_Lost');
                            break;
                        case 'NotForLoan':
                        case 'NotForLoanForcing':
                            if (isset($reason['code'])) {
                                switch ($reason['code']) {
                                    case 'Not For Loan':
                                        $statuses[] = 'On Reference Desk';
                                        break;
                                    default:
                                        $statuses[] = $reason['code'];
                                        break;
                                }
                            } else {
                                $statuses[] = 'On Reference Desk';
                            }
                            break;
                        case 'Transfer':
                            $onHold = false;
                            if (!empty($item['availability']['notes'])) {
                                foreach ($item['availability']['notes'] as $noteKey
                                => $note
                                ) {
                                    if ('Item::Held' === $noteKey) {
                                        $onHold = true;
                                        break;
                                    }
                                }
                            }
                            $statuses[] = $onHold ? 'In Transit On Hold' : 'In Transit';
                            break;
                        case 'Held':
                            $statuses[] = 'On Hold';
                            break;
                        case 'Waiting':
                            $statuses[] = 'On Hold';
                            break;
                        default:
                            $statuses[] = !empty($reason['code'])
                                ? $reason['code'] : $status;
                    }
                }
            }
            if (empty($statuses)) {
                $statuses[] = 'Not Available';
            }
        } else {
            $this->error(
                "Unable to determine status for item: " . print_r($item, true)
            );
        }

        if (empty($statuses)) {
            $statuses[] = 'No information available';
        }
        return array_unique($statuses);
    }
}
