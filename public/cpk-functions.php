<?php

function notEmpty($arr, $key)
{
    return isset($arr[$key]) && ! empty($arr[$key]);
}

/*
 * The User-Agent header is optional.
 * Firewalls may filter it or people may configure their clients to omit it.
 * Simply check using isset() if it exists. Or even better, use !empty()
 * as an empty header won't be useful either
 */
$userAgent = isset($_SERVER['HTTP_USER_AGENT'])
    ? ! empty($_SERVER['HTTP_USER_AGENT']) ? strtolower($_SERVER['HTTP_USER_AGENT']) : ''
    : '';
defined('USES_IE') || define('USES_IE', preg_match('/MSIE|Trident/i', $userAgent));

/*
 * This functions is used like standard urlencode,
 * but insted of double encode, this creates url friedly string for
 * base64 encoding/decoding.
 *
 * @param   string  $input
 *
 * @return  string
 */
function specialUrlEncode($input) {
    return strtr($input, '+/=', '-_.');
}

/*
 * This functions is used like standard urldecode,
 * but insted of double decode, this creates url friedly string for
 * base64 encoding/decoding.
 *
 * @param   string  $input
 *
 * @return  string
 */
function specialUrlDecode($input) {
    if (is_array($input)) {
        $input = $input[0];
    }
    return strtr($input, '-_.', '+/=');
}

function friendlyErrorType($type)		
{		
    switch($type)		
    {		
        case E_ERROR: // 1 //		
            return 'E_ERROR';		
        case E_WARNING: // 2 //		
            return 'E_WARNING';		
        case E_PARSE: // 4 //		
            return 'E_PARSE';		
        case E_NOTICE: // 8 //		
            return 'E_NOTICE';		
        case E_CORE_ERROR: // 16 //		
            return 'E_CORE_ERROR';		
        case E_CORE_WARNING: // 32 //		
            return 'E_CORE_WARNING';		
        case E_COMPILE_ERROR: // 64 //		
            return 'E_COMPILE_ERROR';		
        case E_COMPILE_WARNING: // 128 //		
            return 'E_COMPILE_WARNING';		
        case E_USER_ERROR: // 256 //		
            return 'E_USER_ERROR';		
        case E_USER_WARNING: // 512 //		
            return 'E_USER_WARNING';		
        case E_USER_NOTICE: // 1024 //		
            return 'E_USER_NOTICE';		
        case E_STRICT: // 2048 //		
            return 'E_STRICT';		
        case E_RECOVERABLE_ERROR: // 4096 //		
            return 'E_RECOVERABLE_ERROR';		
        case E_DEPRECATED: // 8192 //		
            return 'E_DEPRECATED';		
        case E_USER_DEPRECATED: // 16384 //		
            return 'E_USER_DEPRECATED';		
        default:		
            return 'UNKNOWN ERROR TYPE';		
    }		
    return "";		
}

/**
 * Dump and die
 * @param mixed $var
 */
function dd($var) {
    var_dump($var);
    exit();
}

/**
 * Die
 * @param mixed $var
 */
function d($var) {
    var_dump($var);
}

/**
 * Redirect to user friendly error page
 * @return  mixed
 */
function redirectToUserFriendlyErrorPage()
{
    $host  = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    $uri   = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
    $extra = 'error.php';
    header("Location: http://$host$uri/$extra");

    include_once(__DIR__ . "/../themes/bootstrap3/templates/error/fatal-error-redirect.phtml");
    exit;
}

/**
 * Show error
 * @param  string $message
 * @return string
 */
function showError(string $message)
{
    die("Error!<br>\n" . $message);
}

/**
 * Log error to file
 * @param   string  $message
 * @return  void
 */
function logError(string $message)
{
    $logFile = __DIR__ . "/../log/fatal-errors.log";
    $fp = fopen($logFile, "a");
    fwrite($fp, $message);
    fwrite($fp, "");
    fclose($fp);
}

function cpkErrorHandler($errorSeverity, $errorMessage, $errorFile, $errorLine, array $errorContext)
{
    $message = date("Y-m-d H:i:s ") . PHP_EOL;
    $message .= friendlyErrorType($errorSeverity) . PHP_EOL;
    $message .= $errorMessage . PHP_EOL;
    $message .= "Error on line $errorLine in file $errorFile" . PHP_EOL . PHP_EOL;

    logError($message);

    if (0 === error_reporting() || // error was suppressed with the @-operator
        in_array(
            friendlyErrorType($errorSeverity),
            array_map('trim', explode(',', IGNORED_ERROR_TYPES))
        )
    ) {
        return false;
    }

    if (php_sapi_name() == 'cli' ||
        defined('STDIN') ||
        (isset($_SERVER['argc']) && is_numeric($_SERVER['argc'])) ||
        (isset($_SERVER['argc']) && $_SERVER['argc'] > 0)
    ) {
        return false;
    }

    if (! isset($_SERVER['VUFIND_ENV'])) {
        exit('Variable VUFIND_ENV is not set in Apache config! [Ignore this message when in CLI]');
    }

    switch ($_SERVER['VUFIND_ENV']) {
        case 'production':
            redirectToUserFriendlyErrorPage();
            break;
        case 'development':
            showError($message);
            break;
        default:
            die('Variable VUFIND_ENV has strange value in Apache config! [Ignore this message when in CLI]');
    }
};

function cpkExceptionHandler(\Exception $exception)
{
    $message = date("Y-m-d H:i:s ");
    $message .= get_class($exception) . PHP_EOL;
    $message .= htmlentities($exception->getMessage()) . PHP_EOL . PHP_EOL;

    logError($message);

    if (php_sapi_name() == 'cli' ||
        defined('STDIN') ||
        (isset($_SERVER['argc']) && is_numeric($_SERVER['argc'])) ||
        (isset($_SERVER['argc']) && $_SERVER['argc'] > 0)
    ) {
        return false;
    }

    if (! isset($_SERVER['VUFIND_ENV'])) {
        exit('Variable VUFIND_ENV is not set in Apache config! [Ignore this message when in CLI]');
    }

    switch ($_SERVER['VUFIND_ENV']) {
        case 'production':
            redirectToUserFriendlyErrorPage();
            break;
        case 'development':
            showError($message);
            throw $exception;
            break;
        default:
            die('Variable VUFIND_ENV has strange value in Apache config! [Ignore this message when in CLI]');
    }
}