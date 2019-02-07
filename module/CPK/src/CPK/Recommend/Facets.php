<?php

namespace CPK\Recommend;


class Facets {

    protected $facetSettings = [];

    public function prepareFacetDataFresh($data, $config, $filterList, $usedF) {
        $newData = $data;
        $newConfig = $config;

        $prepared = $this->getDataFacets($newData, $newConfig, $filterList, $usedF);

        return $prepared;
    }


    public function prepareFacetDataAsync($data, $config, $filterList, $usedF) {
        $newData = $data;
        $newConfig = $config;


        $prepared = $this->getDataFacets($newData, $newConfig, $filterList, $usedF);

        return $prepared;
    }

    public function getDataFacets($facetsData, $config, $filterList, $usedF) {
        $facetSet = $facetsData;
        $facetSettings = $config;
        $keys = array_keys($facetSet);
        $filter = array_fill_keys($keys,['label' => '', 'show' => '', 'list' => array()]);
        foreach ($facetSet as $key => $facets) {
            $filter[$key]['display'] = $facets['label'];
            $facets['label'] = str_replace(' ', '', $facets['label']);
            $facets['encoded'] = $this->repairId($facets['label']);
            $filter[$key]['encoded'] = $facets['encoded'];
            //$filter[$key]['label'] = $facets['label'];
            $filter[$key]['show'] = false;
            if (in_array($facets['label'], $facetSettings['open'], true)) {
                $filter[$key]['show'] = true;
            }
            $maxItems = $facetSettings['count'];
            $maxItems = (array_key_exists($facets['label'], $maxItems))? $maxItems[$facets['label']] : $maxItems['default'];
            $number = false;
            if (in_array($facets['label'], $facetSettings['number'], true)) {
                $number = true;
            }
            $filter[$key]['count'] = $maxItems;
            $filter[$key]['more'] = '-';
            $sequence = 0;
            foreach ($facets['list'] as $facet) {
                $name = $facets['encoded'].$this->repairId($facet['value']);
                $more = true;
                $children = false;
                if ($facet['operator'] == "OR") {
                    if (is_numeric($facet['value'][0])) {
                        if ($facet['value'][0] == '0') {
                            $sequence += 1;
                            $parent = $facets['encoded'];
                            $filter[$key]['list'][$parent]['seq'] = 0;
                            $filter[$key]['list'][$parent]['actived'] = 0;
                            if ($facet['isApplied']) {
                                $filter[$key]['show'] = True;
                            }
                        } else {
                            $more = false;
                            $retezec = (string)(((int)$facet['value'][0]) - 1) . substr($facet['value'], 1, strlen($facet['value']) - 2);
                            $pole = explode('/', $retezec);
                            array_pop($pole);
                            $zbytek = implode('/', $pole) . '/';
                            $parent = $facets['encoded'] . $this->repairId($zbytek);
                            $filter[$key]['list'][$parent]['children'] = true;
                            $filter[$key]['list'][$parent]['seq'] += 1;
                            if ($facet['isApplied']) {
                                $filter[$key]['show'] = True;
                                $rekName = substr($facet['value'], 2, $facet['value'] - 3);
                                $rek = (int)$facet['value'][0];
                                while ($rek > 0) {
                                    $rek -= 1;

                                    $pole = explode('/', $rekName);
                                    array_pop($pole);
                                    $rekName = implode('/', $pole);
                                    //echo $rekName;
                                    $rekParent = $facets['encoded'] . $this->repairId((string)$rek . '/' . $rekName . '/');
                                    $filter[$key]['list'][$rekParent]['actived'] += 1;
                                }
                            }
                        }
                    } else {
                        $sequence += 1;
                        $parent = $facets['encoded'];
                    }
                } else {
                    $sequence += 1;
                    $parent = $facets['encoded'];
                }
                $count = null;
                if ($number) {
                    $count = $facet['count'];
                }
                $open = false;
                if (in_array($facet['displayText'], $facetSettings['subOpen'], true)) {
                    $open = True;
                }
                $bold = false;
                if (in_array($facet['displayText'], $facetSettings['bold'], true)) {
                    $bold = true;
                }
                $dataFacet = (($facet['operator'] == "OR")? '~' : '') . $key . ':"' . $facet['value'] . '"';
                $link = $this->createLink($usedF, $dataFacet, $facet['isApplied']);
                /*if ($facet['isApplied']) {
                    array_push($usedFacetFilter, ['category' => $facets['label'], 'dataFacet' => $dataFacet, 'displayText' => $facet['displayText'], 'operator' => $facet['operator']]);
                }*/
                $show = true;
                if ($sequence > $filter[$key]['count'] && $filter[$key]['count'] != -1 && !$facet['isApplied'] && $more) {
                    $show = false; // TODO pokud je isApplied tak ji zobrazit vzdy
                }
                if ($more && $sequence > $filter[$key]['count'] && $filter[$key]['count'] != -1 && $filter[$key]['more'] == '-') {
                     $filter[$key]['more'] = $facet['value'];// TODO mozna tady
                }
                /*if ($facet['operator'] == "OR") {
                    $name = substr(str_replace('/', '-', $name), 0, strlen($name) - 1);
                }*/

                $displayText = $this->repairConspectus($key, $facet['displayText']);

                $filter[$key]['list'][$name] = [
                        'name' => $name,
                        'value' => $facet['value'], // TODO nahradit diakritiku a mezery, upravy co se provadi s name musi se provadet aji s parent
                        'displayText' => $displayText,
                        'tooltipText' => $facet['tooltiptext'],
                        'count' => $count,
                        'operator' => $facet['operator'],
                        'fullActive' => $facet['isApplied'],
                        'show' => $show,
                        'open' => $open,
                        'parent' => $parent,
                        'link' => $link,
                        'bold' => $bold,
                        'dataFacet' => $dataFacet,
                        'children' => $children,
                        'actived' => 0,
                        'seq' => 0,
                ];
            }
        }

        $usedF = array();
        foreach ($filterList as $key => $sub) {
            $usedF[$key];
            foreach ($sub as $id => $usedFacet) {
                $display = $this->repairConspectus($key, $usedFacet['displayText']);
                $operator = $usedFacet['operator'];
                $dataFacet = (($operator == 'OR')? '~' : '') . $usedFacet['field'] . ':"' . $usedFacet['value'] . '"';
                $usedF[$key][] = [
                        'display' => $display,
                        'operator' => $operator,
                        'dataFacet' => $dataFacet,
                ];
            }
        }

        return array($filter, $usedF);
    }

    public function repairId($input) {
        $output = base64_encode($input);
        return str_replace(array('=', '/'), "", $output);
    }

    public function repairConspectus($key, $input) {
        if ($key == 'conspectus_str_mv' || $key == 'Conspectus') {
            $pole = explode('/', substr($input, 0, strlen($input) - 1));
            return array_pop($pole);
        }
        return $input;
    }

    public function createLink($usedF, $newF, $add) {
        // TODO ty co jsou hierarch a maji nejake pod sebou tak sejeste musi dotunit :D
        if ($add) {
            array_splice($usedF,array_search($newF,$usedF),1);
//            /unset($usedF[array_search($newF,$usedF)]);
            $str = implode('|', $usedF);
        } else {
            $usedF[] = $newF;
            $str = implode('|', $usedF);
        }
        return $str;
        //return "http://localhost:8080/Search/Results/?bool0%5B%5D=AND&type0%5B%5D=AllFields&lookfor0%5B%5D=&join=AND&searchTypeTemplate=basic&database=Solr" . "&filter%5B%5D=" . specialUrlEncode(base64_encode($str));

        /*
         * var filtersAsString = filters.join( '|' );
         * compressedFilters = specialUrlEncode( LZString.compressToBase64( filtersAsString ) );
         * href': window.location.href + "&filter%5B%5D=" + compressedFilters ,
         */

    }

    /**
     * Turn an array into a properly URL-encoded query string.  This is
     * equivalent to the built-in PHP http_build_query function, but it handles
     * arrays in a more compact way and ensures that ampersands don't get
     * messed up based on server-specific settings.
     *
     * @param array $a      Array of parameters to turn into a GET string
     * @param bool  $escape Should we escape the string for use in the view?
     *
     * @return string
     */
    function buildQueryString($a, $escape = true)
    {
        $parts = [];
        foreach ($a as $key => $value) {
            if (is_array($value)) {
                foreach ($value as $current) {
                    $parts[] = urlencode($key . '[]') . '=' . urlencode($current);
                }
            } else {
                $parts[] = urlencode($key) . '=' . urlencode($value);
            }
        }
        $retVal = implode('&', $parts);
        return $escape ? htmlspecialchars($retVal) : $retVal;
    }


}