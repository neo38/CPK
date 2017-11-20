<?php
/**
 * Created by PhpStorm.
 * User: ondrejd
 * Date: 16.11.17
 * Time: 9:19
 */
namespace CPK\View\Helper\CPK;
use Zend\View\Helper\AbstractHelper;

/**
 * Simple view helper moved from `themes/bootstrap3/templates/search/results.phtml`.
 * @package CPK\View\Helper\CPK
 */
class AddUrlArrayParamsToJson extends AbstractHelper
{
    /**
     * Add Url scalar params to JSON. This function will return JS.
     *
     * @param $jsonVarName string
     * @param $paramName string
     * @param $index int
     * @return string
     */
    public function __invoke($jsonVarName, $paramName, $index)
    {
        $fullParamName = "{$paramName}{$index}";
        $outputHtml    = $jsonVarName . "['{$fullParamName}'] = [];" . PHP_EOL;
        $escapeVal     = function($val) { return str_replace("'", "\'", $val); };

        if (!isset($_GET[$fullParamName])) {
            return $outputHtml;
        }

        $paramValues = $_GET[$fullParamName];

        if (is_array($paramValues)) {
            foreach ($paramValues as $_val) {
                $val = $escapeVal($_val);
                $outputHtml .= $jsonVarName . "['{$fullParamName}'].push('{$val}');" . PHP_EOL;
            }
        } else {
            $val = $escapeVal($paramValues);
            $outputHtml .= $jsonVarName . "['{$fullParamName}'].push('{$val}');'" . PHP_EOL;
        }

        $index++;
        return $outputHtml . $this->getView()->addUrlArrayParamsToJson($jsonVarName, $paramName, $index);
    }
}