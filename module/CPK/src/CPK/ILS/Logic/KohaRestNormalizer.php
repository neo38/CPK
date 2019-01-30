<?php

namespace CPK\ILS\Logic;

use \VuFind\Date\Converter as DateConverter;
use Zend\I18n\Translator\TranslatorInterface;
use Zend\Log\LoggerInterface;

class KohaRestNormalizer
{
    /**
     * An action driver is doing now
     *
     * @var string
     */
    protected $methodName;

    protected $dateConverter;
    protected $translator;
    protected $logger;

    public function __construct(
        $method,
        DateConverter $converter,
        TranslatorInterface $translator,
        LoggerInterface $logger
    )
    {
        $this->methodName = $method;
        $this->dateConverter = $converter;
        $this->translator = $translator;
        $this->logger = $logger;
    }

    public function normalize($response) {
        switch ($this->methodName) {
            case 'getMyProfile':
                $this->normalizeUserProfileResponse($response);
                break;
            case 'getMyFines':
                $this->normalizeUserFinesResponse($response);
                break;
            case 'getMyHolds':
                $this->normalizeHoldItemsResponse($response);
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

    public function normalizeUserFinesResponse(&$response) {
        foreach ($response['outstanding_debits']['lines'] as $key => $entry) {
            if ($entry['account_type'] == 'Pay'
                || (int)$entry['amount_outstanding'] == 0
            ) {
                unset($response['outstanding_debits']['lines'][$key]);
                continue;
            }

            $entry['date'] = !empty($entry['date'])
                ? $this->dateConverter->convertToDisplayDate('Y-m-d', $entry['date'])
                : '';

            $entry['account_type'] = $this->translator->translate('KohaFine_' . $entry['account_type']);

            $entry['amount'] *= 100;
            $entry['amount_outstanding'] *= 100;
            $entry['description'] = trim($entry['description']);

            $response['outstanding_debits']['lines'][$key] = $entry;
        }
    }

    public function normalizeHoldItemsResponse(&$response) {
        foreach ($response as $key => $entry) {
            $entry['biblionumber'] = isset($entry['biblionumber']) ? $entry['biblionumber'] : null; //TODO deal with 'KOHA-OAI-TEST:'
            $entry['itemnumber'] = isset($entry['itemnumber']) ? $entry['itemnumber'] : null;

            $entry['reservedate'] = !empty($entry['reservedate'])
                ? $this->dateConverter->convertToDisplayDate('Y-m-d', $entry['reservedate'])
                : '';
            $entry['expirationdate'] = !empty($entry['expirationdate'])
                ? $this->dateConverter->convertToDisplayDate('Y-m-d', $entry['expirationdate'])
                : '';

            $response[$key] = $entry;
        }
    }
}