<?php
/**
 * Created by PhpStorm.
 * User: ondrejd
 * Date: 16.11.17
 * Time: 9:19
 */

namespace CPK\View\Helper\CPK;

/**
 * Simple view helper moved from `themes/bootstrap3/templates/search/results.phtml`.
 * @package CPK\View\Helper\CPK
 */
class AddUrlScalarParamsToJson extends \Zend\View\Helper\AbastractHelper
{
    /**
     * Add Url array params to JSON. This function will return JS.
     *
     * @param $jsonVarName string
     * @param $paramName string
     * @param $index int
     * @return string
     */
    public function __invoke($jsonVarName, $paramName, $index)
    {
        $fullParamName = $paramName.$index;

        if ($index == 0) {
            echo $jsonVarName . "['{$fullParamName}'] = [];" . PHP_EOL;
        }

        $escapeVal = function($val) { return str_replace("'", "\'", $val); };

        if (!isset($_GET[$fullParamName])) {
            return;
        }

        $paramValues = $_GET[$fullParamName];

        if (is_array($paramValues)) {
            foreach ($paramValues as $_val) {
                $val = $escapeVal($_val);
                echo $jsonVarName . "['{$fullParamName}'].push('{$val}');" . PHP_EOL;
            }
        } else {
            $val = $escapeVal($paramValues);
            echo $jsonVarName . "['{$fullParamName}'].push('{$val}');'" . PHP_EOL;
        }

        $index++;
        $this->view->addUrlArrayParamsToJson($jsonVarName, $paramName, $index);
    }
}