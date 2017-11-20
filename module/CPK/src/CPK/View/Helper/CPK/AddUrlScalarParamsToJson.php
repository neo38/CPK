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
class AddUrlScalarParamsToJson extends AbstractHelper
{
    /**
     * Add Url array params to JSON. This function will return JS.
     *
     * @param $jsonVarName string
     * @param $paramName string
     * @param $defaultValue string
     * @return string
     */
    public function __invoke($jsonVarName, $paramName, $defaultValue = '')
    {
        $_paramValue = filter_input( INPUT_GET, $paramName);
        $paramValue  = empty($_paramValue) ? htmlspecialchars($_paramValue) : $defaultValue;

        return $jsonVarName . "['{$paramName}'] = '{$paramValue}';" . PHP_EOL;
    }
}