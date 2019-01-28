<?php

namespace CPK\Recommend;


class Facets {

    protected $facetSettings = [];

    public function prepareFacetDataFresh($data, $config) {
        $newData = $data;
        $newConfig = $config;

        $prepared = $this->getDataFacets($newData, $newConfig);

        return $prepared;
    }


    public function prepareFacetDataAsync($data, $config) {
        $newData = $data;
        $newConfig = $config;


        $prepared = $this->getDataFacets($newData, $newConfig);

        return $prepared;
    }

    // TODO tady ziskat data z configu

    public function getDataFacets($facetsData, $config) {
        //$facetSet = parent::getFacetSet();
        $facetSet = $facetsData;
        $this->facetSettings = $config;
        $keys = array_keys($facetSet);
        $filter = array_fill_keys($keys,['label' => '', 'show' => '', 'list' => array()]);
        foreach ($facetSet as $key => $facets) {
            $filter[$key]['display'] = $facets['label'];
            $facets['label'] = str_replace(' ', '', $facets['label']);
            $filter[$key]['label'] = $facets['label'];
            $filter[$key]['show'] = false;
            if (in_array($facets['label'], $this->facetSettings['open'], true)) {
                $filter[$key]['show'] = true;
            }
            $maxItems = $this->facetSettings['count'];
            $maxItems = (array_key_exists($facets['label'], $maxItems))? $maxItems[$facets['label']] : $maxItems['default'];
            $number = false;
            if (in_array($facets['label'], $this->facetSettings['number'], true)) {
                $number = true;
            }
            $filter[$key]['count'] = $maxItems;
            $filter[$key]['more'] = '-';
            $sequence = 0;
            foreach ($facets['list'] as $facet) {
                $name = $facets['label'].':'.$facet['value'];
                $children = false;
                $more = true;
                $active = false;
                if ($facet['operator'] == "OR") {
                    if (is_numeric($facet['value'][0])) {
                        if ($facet['value'][0] == '0') {
                            $sequence += 1;
                            $parent = $facets['label'];
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
                            $zbytek = implode('/', $pole);
                            $parent = $facets['label'] . ':' . $zbytek;
                            $parent = str_replace('/', '-', $parent);
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
                                    $rekParent = $facets['label'] . ':' . (string)$rek . '/' . $rekName;
                                    $rekParent = str_replace('/', '-', $rekParent);
                                    $filter[$key]['list'][$rekParent]['actived'] += 1;
                                }
                            }
                        }
                    } else {
                        $sequence += 1;
                        $parent = $facets['label'];
                    }
                } else {
                    $sequence += 1;
                    $parent = $facets['label'];
                }
                $link = ''; // TODO vlozit odkaz ktery se pote vlozi do href=""
                $count = null;
                if ($number) {
                    $count = $facet['count'];
                }
                $open = false;
                if (in_array($facet['displayText'], $this->facetSettings['subOpen'], true)) {
                    $open = True;
                }
                $bold = false;
                if (in_array($facet['displayText'], $this->facetSettings['bold'], true)) {
                    $bold = true;
                }
                $dataFacet = (($facet['operator'] == "OR")? '~' : '') . $key . ':"' . $facet['value'] . '"';
                /*if ($facet['isApplied']) {
                    array_push($this->usedFacetFilter, ['category' => $facets['label'], 'dataFacet' => $dataFacet, 'displayText' => $facet['displayText'], 'operator' => $facet['operator']]);
                }*/
                $show = true;
                if ($sequence > $filter[$key]['count'] && $filter[$key]['count'] != -1 && !$facet['isApplied'] && $more) {
                    $show = false; // TODO pokud je isApplied tak ji zobrazit vzdy
                }
                if ($more && $sequence >= $filter[$key]['count'] && $filter[$key]['count'] != -1 && $filter[$key]['more'] == '-') {
                     $filter[$key]['more'] = $facet['value'];
                }
                $name = substr(str_replace('/', '-', $name),0, strlen($name)-1);
                $filter[$key]['list'][$name] = [
                        'name' => $name,
                        'value' => $facet['value'], // TODO nahradit diakritiku a mezery, upravy co se provadi s name musi se provadet aji s parent
                        'displayText' => $facet['displayText'],
                        'tooltipText' => $facet['tooltiptext'],
                        'count' => $count,
                        'operator' => $facet['operator'],
                        'fullActive' => $facet['isApplied'],
                        'show' => $show,
                        'open' => $open,
                        'parent' => $parent,
                        'children' => $children,
                        'link' => $link,
                        'bold' => $bold,
                        'dataFacet' => $dataFacet,
                        'actived' => 0,
                        'seq' => 0,
                ];
            }
        }
        $this->facetFilter = $filter;
        return $this->facetFilter;
    }


}