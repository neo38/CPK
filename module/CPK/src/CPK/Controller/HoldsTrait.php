<?php
/**
 * Holds trait (for subclasses of AbstractRecord)
 *
 * PHP version 5
 *
 * Copyright (C) Villanova University 2010.
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
 * @package  Controller
 * @author   Demian Katz <demian.katz@villanova.edu>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org   Main Site
 */
namespace CPK\Controller;

/**
 * Holds trait (for subclasses of AbstractRecord)
 *
 * @category VuFind2
 * @package Controller
 * @author Demian Katz <demian.katz@villanova.edu>
 * @license http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link http://vufind.org Main Site
 */
trait HoldsTrait
{

    /**
     * Action for dealing with holds.
     *
     * @return mixed
     */
    public function holdAction()
    {
        $driver = $this->loadRecord();
        $uniqueId = $driver->getUniqueID();

        // Stop now if the user does not have valid catalog credentials available:
        if (! is_array($patron = $this->catalogLogin())) {
            return $patron;
        }

        $explodedUniqueId = explode('.', $uniqueId);
        $source = reset($explodedUniqueId);

        $user = $this->getUser();

        $libCardToUse = false;

        if ($user instanceof \CPK\Db\Row\User) {
            $libCards = $user->getLibraryCards();
            foreach ($libCards as $libCard) {
                $instutition = $libCard->home_library;

                if (empty($instutition))
                    continue;

                if ($instutition === $source) {
                    $libCardToUse = $libCard;
                    break;
                }
            }
        }

        // Some curious user tries to reserve holding which doesn't belong to any of his institutions..
        if ($libCardToUse === false) {
            $this->forceLogin();
        }

        $patron = $user->libCardToPatronArray($libCardToUse);

        // If we're not supposed to be here, give up now!
        $catalog = $this->getILS();
        $checkHolds = $catalog->checkFunction('Holds',
            [
                'id' => $uniqueId,
                'patron' => $patron
            ]);
        if (! $checkHolds) {
            return $this->redirectToRecord();
        }

        // Do we have valid information?
        // Sets $this->logonURL and $this->gatheredDetails
        $gatheredDetails = $this->holds()->validateRequest($checkHolds['HMACKeys']);
        if (! $gatheredDetails) {
            return $this->redirectToRecord();
        }

        // Block invalid requests:
        if (! $catalog->checkRequestIsValid($driver->getUniqueID(), $gatheredDetails,
            $patron)) {
            return $this->blockedholdAction();
        }

        // Send various values to the view so we can build the form:
        $pickup = $catalog->getPickUpLocations($patron, $gatheredDetails);
        $requestGroups = $catalog->checkCapability('getRequestGroups',
            [
                $driver->getUniqueID(),
                $patron
            ]) ? $catalog->getRequestGroups($driver->getUniqueID(), $patron) : [];
        $extraHoldFields = isset($checkHolds['extraHoldFields']) ? explode(":",
            $checkHolds['extraHoldFields']) : [];

        // Process form submissions if necessary:
        if (! is_null($this->params()->fromPost('placeHold'))) {
            // If the form contained a pickup location or request group, make sure
            // they are valid:
            $valid = $this->holds()->validateRequestGroupInput($gatheredDetails,
                $extraHoldFields, $requestGroups);
            if (! $valid) {
                $this->flashMessenger()
                    ->setNamespace('error')
                    ->addMessage('hold_invalid_request_group');
            } elseif (isset($gatheredDetails['pickUpLocation']) && ! $this->holds()->validatePickUpInput(
                $gatheredDetails['pickUpLocation'], $extraHoldFields, $pickup)) {
                $this->flashMessenger()
                    ->setNamespace('error')
                    ->addMessage('hold_invalid_pickup');
            } else {
                // If we made it this far, we're ready to place the hold;
                // if successful, we will redirect and can stop here.

                // Add Patron Data to Submitted Data
                $holdDetails = $gatheredDetails + [
                    'patron' => $patron
                ];

                // Attempt to place the hold:
                $function = (string) $checkHolds['function'];
                $results = $catalog->$function($holdDetails);

                // Success: Go to Display Holds
                if (isset($results['success']) && $results['success'] == true) {
                    $msg = [
                        'html' => true,
                        'source' => (isset($results['source']))
                            ? $results['source']
                            : null,
                        'msg' => 'hold_place_success_html',
                        'tokens' => [
                            '%%url%%' => $this->url()->fromRoute('myresearch-holds')
                        ]
                    ];
                    $this->flashMessenger()
                        ->setNamespace('info')
                        ->addMessage($msg);
                    return $this->redirectToRecord('#top');
                } else {
                    // Failure: use flash messenger to display messages, stay on
                    // the current form.
                    if (isset($results['status'])) {
                        $this->flashMessenger()
                            ->setNamespace('error')
                            ->addMessage($results['status']);
                    }
                    if (isset($results['sysMessage'])) {
                        $this->flashMessenger()
                            ->setNamespace('error')
                            ->addMessage($results['sysMessage']);
                    }
                }
            }
        }

        // Find and format the default required date:
        $defaultRequired = $this->holds()->getDefaultRequiredDate($checkHolds,
            $catalog, $patron, $gatheredDetails);
        $defaultRequired = $this->getServiceLocator()
            ->get('VuFind\DateConverter')
            ->convertToDisplayDate("U", $defaultRequired);
        try {
            $defaultPickup = $catalog->getDefaultPickUpLocation($patron,
                $gatheredDetails);
        } catch (\Exception $e) {
            $defaultPickup = false;
        }
        try {
            $defaultRequestGroup = empty($requestGroups)
                ? false
                : $catalog->getDefaultRequestGroup($patron, $gatheredDetails);
        } catch (\Exception $e) {
            $defaultRequestGroup = false;
        }

        $requestGroupNeeded = in_array('requestGroup', $extraHoldFields) &&
             ! empty($requestGroups) && (empty($gatheredDetails['level']) ||
             $gatheredDetails['level'] != 'copy');

        if (! empty($pickup))
            $extraHoldFields[] = 'pickUpLocation';

        $status = $catalog->getItemStatus($gatheredDetails['item_id'], $gatheredDetails['id'], $patron);

        $holdQueue = null;
        $isLend = false;
        if (isset($status['requests_placed']) && ! empty($status['requests_placed'])) {
            $holdQueue = $status['requests_placed'] + 1;
        }
        if (isset($status['duedate']) && ! empty($status['duedate'])) {
            $isLend = true;
        }
        if (isset($status['status']) && $status['status'] != 'Available On Shelf') {
            $isLend = true;
        }
        if ($isLend && empty($holdQueue)) $holdQueue = 1;
        if (! $isLend) $holdQueue = null;

        $view = $this->createViewModel(
            [
                'gatheredDetails' => $gatheredDetails,
                'pickup' => $pickup,
                'defaultPickup' => $defaultPickup,
                'homeLibrary' => $this->getUser()->home_library,
                'extraHoldFields' => $extraHoldFields,
                'defaultRequiredDate' => $defaultRequired,
                'requestGroups' => $requestGroups,
                'defaultRequestGroup' => $defaultRequestGroup,
                'requestGroupNeeded' => $requestGroupNeeded,
                'holdQueue' => $holdQueue,
                'isLend' => $isLend,
                'helpText' => isset($checkHolds['helpText']) ? $checkHolds['helpText'] : null
            ]);
        $view->setTemplate('record/hold');

        $view->id     = $this->driver->getUniqueID();
        $view->source = explode(".", $view->id)[0];

        return $view;
    }
}
