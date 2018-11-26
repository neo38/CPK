<?php
/**
 * SideFacets Recommendations Module
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
 * @package  Recommendations
 * @author   Demian Katz <demian.katz@villanova.edu>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:recommendation_modules Wiki
 */

namespace CPK\Recommend;

use Exception;
use \VuFind\Recommend\SideFacets as SideFacetsBase;

/**
 * SideFacets Recommendations Module
 *
 * This class provides recommendations displaying facets beside search results
 *
 * @category VuFind2
 * @package  Recommendations
 * @author   Demian Katz <demian.katz@villanova.edu>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:recommendation_modules Wiki
 */
class SideFacets extends SideFacetsBase
{

    protected $institutionsMappings = [];

    /**
     * Checkbox facet configuration
     *
     * @var array
     */
    protected $ajaxFacets = [];

    /**
     * Facets with timeline
     *
     * @var array
     */
    protected $timelineFacets = [];

    /**
     * @var array
     */
    protected $facetSettings = [];

    /**
     *
     */
    protected $facetFilter = [];

    /**
     *
     */
    protected $usedFacetFilter = [];


    /**
     * Store the configuration of the recommendation module.
     *
     * @param string $settings Settings from searches.ini.
     *
     * @return void
     */
    public function setConfig($settings)
    {
        // Start of version from module VuFind
        // Parse the additional settings:
        $settings = explode(':', $settings);
        $mainSection = empty($settings[0]) ? 'Results' : $settings[0];
        $checkboxSection = isset($settings[1]) ? $settings[1] : false;
        $iniName = isset($settings[2]) ? $settings[2] : 'facets';

        // Load the desired facet information...
        $config = $this->configLoader->get($iniName);

        // All standard facets to display:
        $this->mainFacets = isset($config->$mainSection) ?
                $config->$mainSection->toArray() : [];


        // Load boolean configurations:
        $this->loadBooleanConfigs($config, array_keys($this->mainFacets));

        // Get a list of fields that should be displayed as ranges rather than
        // standard facet lists.
        if (isset($config->SpecialFacets->dateRange)) {
            $this->dateFacets = $config->SpecialFacets->dateRange->toArray();
        }
        if (isset($config->SpecialFacets->fullDateRange)) {
            $this->fullDateFacets = $config->SpecialFacets->fullDateRange->toArray();
        }
        if (isset($config->SpecialFacets->genericRange)) {
            $this->genericRangeFacets
                    = $config->SpecialFacets->genericRange->toArray();
        }
        if (isset($config->SpecialFacets->numericRange)) {
            $this->numericRangeFacets
                    = $config->SpecialFacets->numericRange->toArray();
        }

        // Checkbox facets:
        if (substr($checkboxSection, 0, 1) == '~') {
            $checkboxSection = substr($checkboxSection, 1);
            $flipCheckboxes = true;
        }
        $this->checkboxFacets
                = ($checkboxSection && isset($config->$checkboxSection))
                ? $config->$checkboxSection->toArray() : [];
        if (isset($flipCheckboxes) && $flipCheckboxes) {
            $this->checkboxFacets = array_flip($this->checkboxFacets);
        }

        // Collapsed facets:
        if (isset($config->Results_Settings->collapsedFacets)) {
            $this->collapsedFacets = $config->Results_Settings->collapsedFacets;
        }

        // Hierarchical facets:
        if (isset($config->SpecialFacets->hierarchical)) {
            $this->hierarchicalFacets
                    = $config->SpecialFacets->hierarchical->toArray();
        }

        // Hierarchical facet sort options:
        if (isset($config->SpecialFacets->hierarchicalFacetSortOptions)) {
            $this->hierarchicalFacetSortOptions
                    = $config->SpecialFacets->hierarchicalFacetSortOptions->toArray();
        }
        // End of version from module VuFind

        if (isset($config->SpecialFacets->ajax)) {
            $this->ajaxFacets = $config->SpecialFacets->ajax->toArray();
        }

        if (isset($config->InstitutionsMappings)) {
            $this->institutionsMappings = $config->InstitutionsMappings->toArray();
        }

        // Facets with timeline
        if (isset($config->SpecialFacets->timeline)) {
            $this->timelineFacets = $config->SpecialFacets->timeline->toArray();
        }


        if (isset($config->Facet_Settings)) {
            $this->facetSettings = $config->Facet_Settings->toArray();
        }

    }

    /**
     * Called at the end of the Search Params objects' initFromRequest() method.
     * This method is responsible for setting search parameters needed by the
     * recommendation module and for reading any existing search parameters that may
     * be needed.
     *
     * @param \VuFind\Search\Base\Params $params Search parameter object
     * @param \Zend\StdLib\Parameters $request Parameter object representing user
     * request.
     *
     * @return void
     */
    public function init($params, $request)
    {
        // Turn on side facets in the search results:
        foreach ($this->mainFacets as $name => $desc) {
            if (!in_array($name, $this->ajaxFacets)) {
                $params->addFacet($name, $desc, in_array($name, $this->orFacets));
            }
        }
        foreach ($this->checkboxFacets as $name => $desc) {
            $params->addCheckboxFacet($name, $desc);
        }
    }

    public function getFacetSet()
    {
        $facetSet = parent::getFacetSet();
        $newFacetSet = [];
        foreach ($this->mainFacets as $name => $desc) {
            if (in_array($name, $this->ajaxFacets)) {
                $newFacetSet[$name] = ['label' => $desc, 'list' => [], 'ajax' => true];
            } else {
                $newFacetSet[$name] = &$facetSet[$name];
            }
        }
        return $newFacetSet;
    }

    public function getInstutitionMapping($institution)
    {
        if (isset($this->institutionsMappings[$institution]))
            return $this->institutionsMappings[$institution];
        return $institution;
    }

    /**
     * Return the list of facets with timeline
     *
     * @return array
     */
    public function getTimelineFacets()
    {
        return $this->timelineFacets;
    }

    public function facetSettings()
    {
        return $this->facetSettings;
    }

    public function getFacetFilter() {
        $facetSet = parent::getFacetSet();

        $keys=array_keys($facetSet);

        $filter = array_fill_keys($keys,['label' => '', 'show' => '', 'list' => array()]);

        foreach ($facetSet as $key => $facets) {
            $filter[$key]['label'] = $facets['label'];

            $filter[$key]['show'] = false;
            if (in_array($facets['label'], $this->facetSettings['open'])) {
                $filter[$key]['show'] = true;
            }

            try {
                $maxItems = $this->facetSettings['count'][$facets['label']];
            } catch (Exception $e) {
                $maxItems = $this->facetSettings['count']['default'];
            }

            foreach ($facets['list'] as $id => $facet) {
                $name = $facets['label'].':'.$facet['value'];
                $children = false;
                if ($facet['operator'] == "OR") {
                    if (is_numeric($facet['value'][0])) {
                        if ($facet['value'][0] == "0") {
                            $parent = $facets['label'];
                            $active = $facet['isApplied'];
                            if ($active) {
                                $filter[$key]['show'] = True;
                            }
                        } else {
                            $retezec = (string)(((int)$facet['value'][0]) - 1).substr($facet['value'], 1, strlen($facet['value']) - 3);
                            $pole = explode('/', $retezec);
                            $koks = array_pop($pole);
                            $zbytek = implode('/', $pole);
                            $parent = $facets['label'] . ':' . $zbytek . '/';

                            if ($filter[$key]['list'][$parent]['isApplied']) {
                                $active = True;
                            } else {
                                $active = $facet['isApplied'];
                                $filter[$key]['list'][$parent]['children'] = true;
                            }
                        }
                    } else {
                        $active = $facet['isApplied'];
                        $parent = '';
                    }
                } else {
                    $active = $facet['isApplied'];
                    $parent = '';
                }

                $link = ''; // TODO vlozit odkaz ktery se pote vlozi do href=""

                $count = null;
                if (in_array($facets['label'], $this->facetSettings['number'])) {
                    $count = $facet['count'];
                }
                $show = true;
                if ($maxItems != -1 && $id > $maxItems) {
                    $show = false;
                }

                $open = false;
                if (in_array($facet['displayText'], $this->facetSettings['subOpen'])) {
                    $open = True;
                }

                $bold = false;
                if (in_array($facet['displayText'], $this->facetSettings['bold'])) {
                    $bold = true;
                }

                if ($active) {
                    array_push($this->usedFacetFilter, $name);
                }

                $filter[$key]['list'][$name] = [
                        'value' => $facet['value'],
                        'displayText' => $facet['displayText'],
                        'tooltipText' => $facet['tooltiptext'],
                        'count' => $count,
                        'operator' => $facet['operator'],
                        'isApplied' => $active,
                        'show' => $show,
                        'open' => $open,
                        'parent' => $parent,
                        'children' => $children,
                        'link' => $link,
                        'bold' => $bold,
                    ];
            }
        }

        $this->facetFilter = $filter;
        return $this->facetFilter;
        //return $facetSet;
    }

    public function getUsedFacetFilter() {
        return $this->usedFacetFilter;
    }
}
