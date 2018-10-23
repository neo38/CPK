<?php
/**
 * Record driver view helper
 *
 * PHP version 5
 *
 * Copyright (C) MZK 2015.
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
 * @author	Martin Kravec	<kravec@mzk.cz>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 */
namespace CPK\View\Helper\CPK;
use VuFind\View\Helper\Root\Record as ParentRecord;
use CPK\Db\Row\User;

/**
 * Record driver view helper
 *
 * @author	Martin Kravec	<kravec@mzk.cz>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 */

class Record extends ParentRecord
{
    /**
     * Display values of 7xx fields
     *
     * @param   boolean $showDescription
     *
     * @return string
     */
    public function displayFieldsOf7xx($showDescription)
    {
        return $this->contextHelper->renderInContext(
            'RecordDriver/SolrDefault/fieldsOf7xx.phtml', array('showDescription' => $showDescription)
        );
    }

	/**
     * Render an HTML checkbox control for the current record.
     *
     * @param string $idPrefix Prefix for checkbox HTML ids
     *
     * @return string
     */
    public function getCheckbox($idPrefix = '')
    {
        static $checkboxCount = 0;
        $id = $this->driver->getResourceSource() . '|'
            . $this->driver->getUniqueId();
        $context
            = array('id' => $id, 'count' => $checkboxCount++, 'prefix' => $idPrefix);
        return $this->contextHelper->renderInContext(
            'record/checkboxAutoAddToCart.phtml', $context
        );
    }

    /**
     * Display field 773
     *
     * @return string
     */
    public function displayField773()
    {
        return $this->contextHelper->renderInContext(
            'RecordDriver/SolrDefault/field773.phtml',
            []
        );
    }

	public function getObalkyKnihJSON()
    {
        $bibinfo = $this->driver->tryMethod('getBibinfoForObalkyKnih');
        if (empty($bibinfo)) {
            $bibinfo = array(
                "authors" => array($this->driver->getPrimaryAuthor()),
                "title" => $this->driver->getTitle(),
            );
            $isbn = $this->driver->getCleanISBN();
            if (!empty($isbn)) {
                $bibinfo['isbn'] = $isbn;
            }
            $year = $this->driver->getPublicationDates();
            if (!empty($year)) {
                $bibinfo['year'] = $year[0];
            }
        }
        return json_encode($bibinfo, JSON_HEX_QUOT | JSON_HEX_TAG);
    }

	public function getObalkyKnihAdvert($description) {
        $sigla = '';
        if (isset($this->config->ObalkyKnih->sigla)) {
            $sigla = $this->config->ObalkyKnih->sigla;
        }
        return 'advert' . $sigla . ' ' . $description;
    }

	public function getObalkyKnihJSONV3()
    {
        $bibinfo = $this->driver->tryMethod('getBibinfoForObalkyKnihV3');
        if (empty($bibinfo)) {
            $isbn = $this->driver->getCleanISBN();
            if (!empty($isbn)) {
                $bibinfo['isbn'] = $isbn;
            }
            $year = $this->driver->getPublicationDates();
            if (!empty($year)) {
                $bibinfo['year'] = $year[0];
            }
        }
        if (empty($bibinfo)) return false;
        return json_encode($bibinfo, JSON_HEX_QUOT | JSON_HEX_TAG);
    }

	/**
     * Render an HTML checkbox control for the current record.
     *
     * @param string $idPrefix Prefix for checkbox HTML ids
     *
     * @return string
     */
    public function getCheckboxWithoutAutoAddingToCart($idPrefix = '')
    {
    	static $checkboxCount = 0;
    	$id = $this->driver->getResourceSource() . '|'
    			. $this->driver->getUniqueId();
    	$context
    	= array('id' => $id, 'count' => $checkboxCount++, 'prefix' => $idPrefix);
    	return $this->contextHelper->renderInContext(
    			'record/checkbox.phtml', $context
    	);
    }

    /**
     * This functions gets recordsId, finds parent and all the local IDs
     * and finds the one, that fits users preferences (favorite library)
     *
     * @param string            $recordId
     *
     * @return string
     */
    public function getRelevantRecord($recordId)
    {
        $authManager = $this->view->auth()->getManager();
        $user = $authManager->isLoggedIn();

        if ($user instanceof \CPK\Db\Row\User) {

            $sm = $this->getView()->getHelperPluginManager()->getServiceLocator();
            $ajaxController = $sm->get('ajaxCtrl');
            $availablesRecords = $ajaxController->getRecordSiblings($recordId);

            $myLibraries = $user->getNonDummyInstitutions();
            sort($myLibraries);

            foreach ($availablesRecords as $record) {
                foreach ($myLibraries as $myLibrary) {
                    if (explode(".", $record, 2)[0] == $myLibrary) {
                        return $record;
                    }
                }
            }
        }
        return $recordId;
    }

    public function getEnabled7xxFields($id, $field733)
    {
        $enabled7xxFields = explode(",", $this->config->Record->fields_in_core);
        $fieldsOf7xx = [];
        foreach($enabled7xxFields as $enabledField) {
            $varName = 'field'.$enabledField;
            $fieldsOf7xx[$enabledField] = $this->$varName;
        }

        foreach($fieldsOf7xx as $number => $activeField) {
            $i = 0;
            if (! $activeField) continue;
            foreach ($activeField as $field) {

                if (null === $field)
                    continue;

                if (count($activeField)) {
                    ++$i;
                    if($i === 1)
                        echo "<tr><th>".$this->translate('field'.$number)."</th><td>";
                }

                if ( ! empty($field['t']) || ! empty($field['g']) ) {

                    if($activeField === $field733) {
                        $anchor = join(" ", $field);
                    } else {
                        $anchor = $field['t']." ".$field['g'];
                    }

                    if (! empty($field['x']) || ! empty($field['z']) || ! empty($field['t'])) {

                        if (! empty($field['x'])) {
                            $link = '/Search/Results?join=AND&bool0[]=AND&lookfor0[]="'.$field['x'].'"&type0[]=isn&bool1[]=NOT&lookfor1[]="'.$id.'"&type1[]=id&sort=title&view=list';
                        } else if (! empty($field['z'])) {
                            $link = '/Search/Results?join=AND&bool0[]=AND&lookfor0[]="'.$field['z'].'"&type0[]=isn&bool1[]=NOT&lookfor1[]="'.$id.'"&type1[]=id&sort=title&view=list';
                        } else if (! empty($field['t'])) {
                            $link = '/Search/Results?join=AND&bool0[]=AND&lookfor0[]="'.$field['t'].'"&type0[]=AllFields&bool1[]=NOT&lookfor1[]="'.$id.'"&type1[]=id&sort=title&view=list';
                        }

                        echo "<a href='".$link."' title='".$anchor."'>".$anchor."</a><br>\n";
                    } else {
                        echo $anchor."<br>\n";
                    }

                }

            }
            echo "</td>";
            echo "</tr>";

        }
    }
}
