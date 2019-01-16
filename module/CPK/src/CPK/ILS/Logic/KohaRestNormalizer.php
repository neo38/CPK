<?php

namespace CPK\ILS\Logic;

use \VuFind\Date\Converter as DateConverter;

class KohaRestNormalizer
{
    /**
     * An action driver is doing now
     *
     * @var
     */
    protected $methodName;

    protected $dateConverter;

    public function __construct($method, DateConverter $converter)
    {
        $this->methodName = $method;
        $this->dateConverter = $converter;
    }

    public function normalize($response) {
        switch ($this->methodName) {
            case 'getMyProfile':
                $this->normalizeUserProfileResponse($response);
                break;
        }

        return $response;
    }

    public function normalizeUserProfileResponse(&$response) {
        $response['expiry_date'] = !empty($response['expiry_date'])
            ? $this->dateConverter->convertToDisplayDate(
                'Y-m-d', $response['expiry_date']
            ) : '';
    }
}