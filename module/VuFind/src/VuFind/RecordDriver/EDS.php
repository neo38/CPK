<?php
/**
 * Model for EDS records.
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
 * @package  RecordDrivers
 * @author   Demian Katz <demian.katz@villanova.edu>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:record_drivers Wiki
 */
namespace VuFind\RecordDriver;
use DOMDocument;

/**
 * Model for EDS records.
 *
 * @category VuFind2
 * @package  RecordDrivers
 * @author   Demian Katz <demian.katz@villanova.edu>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:record_drivers Wiki
 */
class EDS extends SolrDefault
{
    const MINIMAL_FULLTEXT_LENGTH = 500;

    /**
     * Document types that are treated as PDF links.
     *
     * @var array
     */
    protected $pdfTypes = ['ebook-pdf', 'pdflink'];

    /**
     * Allowed tags comes from EBSCO in book description
     *
     * @var array
     */
    private $allowedEbscoTags = ["p", "b", "i", "em", "strong", "a", "span"];

    /**
     * Return the unique identifier of this record within the Solr index;
     * useful for retrieving additional information (like tags and user
     * comments) from the external MySQL database.
     *
     * @return string Unique identifier.
     */
    public function getUniqueID()
    {
        $dbid = $this->fields['Header']['DbId'];
        $an = $this->fields['Header']['An'];
        return $dbid . ',' . $an;
    }

    /**
     * Get the short (pre-subtitle) title of the record.
     *
     * @return string
     */
    public function getShortTitle()
    {
        $title = $this->getTitle();
        if (null == $title) {
            return '';
        }
        if (mb_strlen($title, 'UTF-8') > 20) {
            $title = mb_substr($title, 0, 17, 'UTF-8') . '...';
        }
        return $title;
    }

    /**
     * Get the abstract (summary) of the record.
     *
     * @return string
     */
    public function getItemsAbstract()
    {
        if (isset($this->fields['Items'])) {
            foreach ($this->fields['Items'] as $item) {
                if ('Ab' == $item['Group']) {
                    return $this->toHTML($item['Data'], $item['Group']);
                }
            }
        }
        return '';
    }

    /**
     * Get the access level of the record.
     *
     * @return string
     */
    public function getAccessLevel()
    {
        return isset($this->fields['Header']['AccessLevel'])
            ? $this->fields['Header']['AccessLevel'] : '';
    }

    /**
     * Get the authors of the record
     *
     * @return string
     */
    public function getItemsAuthors()
    {
        $authors = $this->getItemsAuthorsArray();
        return empty($authors) ? '' : implode('; ', $authors);
    }

    /**
     * Obtain an array or authors indicated on the record
     *
     * @return array
     */
    protected function getItemsAuthorsArray()
    {
        $authors = [];
        if (isset($this->fields['Items'])) {
            foreach ($this->fields['Items'] as $item) {
                if ('Au' == $item['Group']) {
                    $authors[] = $this->toHTML($item['Data'], $item['Group']);
                }
            }
        }
        return $authors;
    }

    /**
     * Get the custom links of the record.
     *
     * @return array
     */
    public function getCustomLinks()
    {
        return isset($this->fields['CustomLinks'])
            ? $this->fields['CustomLinks'] : [];
    }

    /**
     * Get the full text custom links of the record.
     *
     * @return array
     */
    public function getFTCustomLinks()
    {
        return isset($this->fields['FullText']['CustomLinks'])
            ? $this->fields['FullText']['CustomLinks'] : [];
    }

    /**
     * Get the database label of the record.
     *
     * @return string
     */
    public function getDbLabel()
    {
        return isset($this->fields['Header']['DbLabel'])
            ? $this->fields['Header']['DbLabel'] : '';
    }

    /**
     * Get the full text of the record.
     *
     * @return string
     */
    public function getHTMLFullText()
    {
        return isset($this->fields['FullText']['Text']['Value'])
            ? $this->toHTML($this->fields['FullText']['Text']['Value']) : '';
    }

    /**
     * Get the full text availability of the record.
     *
     * @return bool
     */
    public function hasHTMLFullTextAvailable()
    {
        return isset($this->fields['FullText']['Text']['Availability'])
            && ('1' == $this->fields['FullText']['Text']['Availability']);
    }

    /**
     * Get the items of the record.
     *
     * @return array
     */
    public function getItems()
    {
        $items = [];
        if (isset($this->fields['Items']) && !empty($this->fields['Items'])) {
            foreach ($this->fields['Items'] as $item) {
                $items[] = [
                    'Label' => isset($item['Label']) ? (($item['Label'] == 'Source')? 'Published in' : $item['Label']) : '',
                    'Group' => isset($item['Group']) ? $item['Group'] : '',
                    'Data'  => isset($item['Data'])
                        ? $this->toHTML($item['Data'], $item['Group']) : ''
                ];
            }
        }
        return $items;
    }

    /**
     * Get the full text url of the record.
     *
     * @return string
     */
    public function getPLink()
    {
        return isset($this->fields['PLink']) ? $this->fields['PLink'] : '';
    }

    /**
     * Get the publication type of the record.
     *
     * @return string
     */
    public function getPubType()
    {
        return isset($this->fields['Header']['PubType'])
            ? $this->fields['Header']['PubType'] : '';
    }

    /**
     * Get the publication type id of the record.
     *
     * @return string
     */
    public function getPubTypeId()
    {
        return isset($this->fields['Header']['PubTypeId'])
            ? $this->fields['Header']['PubTypeId'] : '';
    }

    /**
     * Get the PDF availability of the record.
     *
     * @return bool
     */
    public function hasPdfAvailable()
    {
        if (isset($this->fields['FullText']['Links'])) {
            foreach ($this->fields['FullText']['Links'] as $link) {
                if (isset($link['Type'])
                    && in_array($link['Type'], $this->pdfTypes)
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Get the PDF url of the record. If missing, return false
     *
     * @return string
     */
    public function getPdfLink()
    {
        if (isset($this->fields['FullText']['Links'])) {
            foreach ($this->fields['FullText']['Links'] as $link) {
                if (isset($link['Type'])
                    && in_array($link['Type'], $this->pdfTypes)
                    && isset($link['Url'])) {
                    return $link['Url']; // return PDF link
                }
            }
        }
        return false;
    }

    /**
     * Get the subject data of the record.
     *
     * @return string
     */
    public function getItemsSubjects()
    {
        $subjects = [];
        if (isset($this->fields['Items'])) {
            foreach ($this->fields['Items'] as $item) {
                if ('Su' == $item['Group']) {
                    $subjects[] = $this->toHTML($item['Data'], $item['Group']);
                }
            }
        }
        return empty($subjects) ? '' : implode(', ', $subjects);
    }

    /**
     * Return a URL to a thumbnail preview of the record, if available; false
     * otherwise.
     *
     * @param string $size Size of thumbnail (small, medium or large -- small is
     * default).
     *
     * @return string
     */
    public function getThumbnail($size = 'small')
    {
        if (!empty($this->fields['ImageInfo'])) {
            foreach ($this->fields['ImageInfo'] as $image) {
                if (isset($image['Size']) && $size == $image['Size']) {
                    return (isset($image['Target'])) ? $image['Target'] : '';
                }
            }
        }
        return false;
    }

    /**
     * Get the title of the record.
     *
     * @return string
     */
    public function getItemsTitle()
    {
        if (isset($this->fields['Items'])) {
            foreach ($this->fields['Items'] as $item) {
                if ('Ti' == $item['Group']) {
                    return $this->toHTML($item['Data']);
                }
            }
        }
        return '';
    }

    /**
     * Obtain the title of the record from the record info section
     *
     * @return string
     */
    public function getTitle()
    {
        if (isset($this->fields['RecordInfo']['BibRecord']['BibEntity']['Titles'])) {
            foreach ($this->fields['RecordInfo']['BibRecord']['BibEntity']['Titles']
                as $titleRecord
            ) {
                if (isset($titleRecord['Type']) && 'main' == $titleRecord['Type']) {
                    return $titleRecord['TitleFull'];
                }
            }
        }
        return '';
    }

    /**
     * Obtain the authors from a record from the RecordInfo section
     *
     * @return array
     */
    public function getAuthors()
    {
        $authors = [];
        if (isset($this->fields['RecordInfo']['BibRecord']['BibRelationships'])) {
            $bibRels
                = & $this->fields['RecordInfo']['BibRecord']['BibRelationships'];
        }
        if (isset($bibRels['HasContributorRelationships'])
            && !empty($bibRels['HasContributorRelationships'])
        ) {
            foreach ($bibRels['HasContributorRelationships'] as $entry) {
                if (isset($entry['PersonEntity']['Name']['NameFull'])) {
                    $authors[] = $entry['PersonEntity']['Name']['NameFull'];
                }
            }
        }
        return $authors;
    }

    /**
     * Obtain the primary author of the record
     *
     * @return string
     */
    public function getPrimaryAuthor()
    {
        $authors = $this->getAuthors();
        return empty($authors) ? '' : $authors[0];
    }

    /**
     * Get the source of the record.
     *
     * @return string
     */
    public function getItemsTitleSource()
    {
        if (isset($this->fields['Items'])) {
            foreach ($this->fields['Items'] as $item) {
                if ('Src' == $item['Group']) {
                    return $this->toHTML($item['Data']);
                }
            }

        }
        return '';
    }

    /**
     * Performs a regex and replaces any url's with links containing themselves
     * as the text
     *
     * @param string $string String to process
     *
     * @return string        HTML string
     */
    public function linkUrls($string)
    {
        $linkedString = preg_replace_callback(
            "/\b(https?):\/\/([-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]*)\b/i",
            create_function(
                '$matches',
                'return "<a href=\'".($matches[0])."\'>".($matches[0])."</a>";'
            ),
            $string
        );
        return $linkedString;
    }

    /**
     * Remove DOM element from string with tag content
     *
     * @param $str
     * @return mixed
     * @internal param $text
     * @internal param string $tags
     * @internal param bool $invert
     */
    function stripTagsAndAttrs($str)
    {
        if (!strlen($str)) {
            return false;
        }

        $str = '<span>' . $str . '</span>';

        $xml = new DOMDocument();

        //Suppress warnings: proper error handling is beyond scope of example
        libxml_use_internal_errors(true);
        $str = mb_convert_encoding($str, 'HTML-ENTITIES', 'UTF-8');

        if ($xml->loadHTML($str, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD)) {
            foreach ($xml->getElementsByTagName("*") as $tag) {
                if (!in_array($tag->tagName, $this->allowedEbscoTags)) {
                    $tag->parentNode->removeChild($tag);
                }
            }
        }

        return $xml->saveHTML();
    }

    /**
     * Parse a SimpleXml element and
     * return it's inner XML as an HTML string
     *
     * @param SimpleXml $data  A SimpleXml DOM
     * @param string    $group Group identifier
     *
     * @return string          The HTML string
     */
    protected function toHTML($data, $group = null)
    {
        // Map xml tags to the HTML tags
        // This is just a small list, the total number of xml tags is far greater

        // Any group can be added here, but we only use Au (Author)
        // Other groups, not present here, won't be transformed to HTML links
        $allowed_searchlink_groups = ['au','su'];

        $xml_to_html_tags = [
                '<jsection'    => '<section',
                '</jsection'   => '</section',
                '<highlight'   => '<span class="highlight"',
                '<highligh'    => '<span class="highlight"', // Temporary bug fix
                '</highlight>' => '</span>', // Temporary bug fix
                '</highligh'   => '</span>',
                '<text'        => '<div',
                '</text'       => '</div',
                '<title'       => '<h2',
                '</title'      => '</h2',
                '<anid'        => '<p',
                '</anid'       => '</p',
                '<aug'         => '<p class="aug"',
                '</aug'        => '</p',
                '<hd'          => '<h3',
                '</hd'         => '</h3',
                '<linebr'      => '<br',
                '</linebr'     => '',
                '<olist'       => '<ol',
                '</olist'      => '</ol',
                '<reflink'     => '<a',
                '</reflink'    => '</a',
                '<blist'       => '<p class="blist"',
                '</blist'      => '</p',
                '<bibl'        => '<a',
                '</bibl'       => '</a',
                '<bibtext'     => '<span',
                '</bibtext'    => '</span',
                '<ref'         => '<div class="ref"',
                '</ref'        => '</div',
                '<ulink'       => '<a',
                '</ulink'      => '</a',
                '<superscript' => '<sup',
                '</superscript' => '</sup',
                '<relatesTo'   => '<sup',
                '</relatesTo'  => '</sup'
        ];

        //  The XML data is escaped, let's unescape html entities (e.g. &lt; => <)
        $data = html_entity_decode($data, ENT_QUOTES, "utf-8");

        // Start parsing the xml data
        if (!empty($data)) {
            // Replace the XML tags with HTML tags
            $search = array_keys($xml_to_html_tags);
            $replace = array_values($xml_to_html_tags);
            $data = str_replace($search, $replace, $data);

            // Temporary : fix unclosed tags
            $data = preg_replace('/<\/highlight/', '</span>', $data);
            $data = preg_replace('/<\/span>>/', '</span>', $data);
            $data = preg_replace('/<\/searchLink/', '</searchLink>', $data);
            $data = preg_replace('/<\/searchLink>>/', '</searchLink>', $data);

            //$searchBase = $this->url('eds-search');
            // Parse searchLinks
            if (!empty($group)) {
                $group = strtolower($group);
                if (in_array($group, $allowed_searchlink_groups)) {
                    $type = strtoupper($group);



                    $link_xml = '/<searchLink fieldCode="([^\"]*)" '
                        . 'term="%22([^\"]*)%22">/';
                    $link_html
                        = "<a href=\"../../EDS/Search?lookfor=$2&amp;type={$type}&amp;searchTypeTemplate=advanced\">";
                    $data = preg_replace($link_xml, $link_html, $data);
                    $data = str_replace('</searchLink>', '</a>', $data);
                }
            }

            // Replace the rest of searchLinks with simple spans
            $link_xml = '/<searchLink fieldCode="([^\"]*)" term="%22([^\"]*)%22">/';
            $link_html = '<span>';
            $data = preg_replace($link_xml, $link_html, $data);
            $data = str_replace('</searchLink>', '</span>', $data);

            // Parse bibliography (anchors and links)
            $data = preg_replace('/<a idref="([^\"]*)"/', '<a href="#$1"', $data);
            $data = preg_replace(
                '/<a id="([^\"]*)" idref="([^\"]*)" type="([^\"]*)"/',
                '<a id="$1" href="#$2"', $data
            );

            $data = $this->replaceBRWithCommas($data, $group);
        }

        //remove prohibited tags
        $data = $this->stripTagsAndAttrs($data);

        return $data;
    }

    /**
     * Replace <br> tags that are embedded in data to commas
     *
     * @param string $data  Data to process
     * @param string $group Group identifier
     *
     * @return string
     */
    protected function replaceBRWithCommas($data, $group)
    {
        $groupsToReplace = ['au','su'];
        if (in_array($group, $groupsToReplace)) {
            $br =  '/<br \/>/';
            $comma = '<span>, </span>';
            return preg_replace($br, $comma, $data);
        }
        return $data;
    }

    /**
     * Get an array of strings representing citation formats supported
     * by this record's data (empty if none).  For possible legal values,
     * see /application/themes/root/helpers/Citation.php, getCitation()
     * method.
     *
     * @return array Strings representing citation formats.
     */
    protected function getSupportedCitationFormats()
    {
        return [];
    }

    /**
     * Indicate whether export is disabled for a particular format.
     *
     * @param string $format Export format
     *
     * @return bool
     *
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public function exportDisabled($format)
    {
        // EDS is not export-friendly; disable all formats.
        return true;
    }

    public function getFields() {
        return $this->fields;
    }

    /**
     * Get parsed data
     * Returns array or string or false if no data found.
     *
     * @param   $group  string
     * @param   $delimeter  string
     * @param   $positionIndex  int PositionIndex 1 is meaned to get first array value,
     *          2 measn 1, etc.
     * @param   $strimCharacters    string  Characters, that shoul be trimmed. E.g. "()[],. "
     *
     * @return mixed
     */
    public function getParsedData($group, $label = false, $delimeter = false, $positionIndex = false, $trimCharacters = false)
    {
        if (isset($this->fields['Items'])) {
            foreach ($this->fields['Items'] as $item) {
                if ($label) {
                    if ($item['Group'] == $group && $item['Label'] == $label) {
                        $itemData = trim($item['Data'], ". ");

                        if ($delimeter) {
                            $data = array_map('trim', explode($delimeter, $itemData));

                            if ($trimCharacters) {
                                foreach ($data as $key => $value) {
                                    $string = trim($value, $trimCharacters);
                                    if (! empty($string)) {
                                        $data[$key] = $string;
                                    }
                                }
                            }

                            if ($positionIndex) {
                                $data = $data[$positionIndex-1];
                            }

                        }
                        else {
                            $data = $itemData;
                        }
                        break;
                    }
                } else {
                    if ($item['Group'] == $group) {

                        $itemData = trim($item['Data'], ". ");

                        if ($delimeter) {
                            $data = array_map('trim', explode($delimeter, $itemData));

                            if ($trimCharacters) {
                                foreach ($data as $key => $value) {
                                    $string = trim($value, $trimCharacters);
                                    if (! empty($string)) {
                                        $data[$key] = $string;
                                    }
                                }
                            }

                            if ($positionIndex) {
                                $data = $data[$positionIndex-1];
                            }

                        }
                        else {
                            $data = $itemData;
                        }
                        break;
                    }
                }
            }
        }
        return (isset($data)) ? $data : false;
    }

    protected function neco()
    {

    }

    /**
     * Get ISSNs
     *
     * @return array
     */
    public function getIssns()
    {
        $group = "ISSN";
        $delimeter = "&lt;br /&gt;";
        return $this->getParsedData($group, false, $delimeter);
    }

    /**
     * Get electronic ISSNs
     *
     * @return array
     */
    public function getElectronicIssns()
    {
        $group = "Src";
        $label = "Journal Info";
        //$delimeter = "&lt;br /&gt;";

        $data = strip_tags(html_entity_decode($this->getParsedData($group, $label)));

        $issns = [];
        preg_match_all("/\d{4}-\d{4}/",
            $data, $issns);

        if (is_array($issns) && ! empty($issns)) {
            if (!empty($issns[0])) {
                return $issns[0];
            }
        }

        return false;
    }

    /**
     * Get ISBNs
     *
     * @return array
     */
    public function getIsbns()
    {
        $group = "ISBN";
        $delimeter = ".";
        return $this->getParsedData($group, false, $delimeter);
    }

    protected function findeClosestDelimeter($possibleDelimeters, $string){
        $delimeter = false;

        $results = [];
        foreach ($possibleDelimeters as $key => $char) {
            if (strpos($string, $char, 0 != false)) {
                $results[$key] = strpos($string, $char, 0);
            }
        }

        if (empty($results)) return false;

        $minKey = min(array_keys($results, min($results)));

        return $possibleDelimeters[$minKey];
    }

    /**
     * Get source title
     *
     * @return array
     */
    public function getSourceTitle()
    {
        $group = "Src";
        $possibleDelimeters = [",", ".", ";"];
        $trimCharacters = "()[]'";
        $positionIndex = 1;

        if (isset($this->fields['Items'])) {
            foreach ($this->fields['Items'] as $item) {
                if ($item['Group'] == $group) {

                    $string = $item['Data'];
                    // remove HTML entities
                    $string = strip_tags(html_entity_decode($string));

                    // find some delimeter
                    $delimeter = $this->findeClosestDelimeter($possibleDelimeters, $string);

                    // split string by delimeter
                    if ($delimeter) {
                        $data = array_map('trim', explode($delimeter, $string));

                        // if we want to return n-th occurence
                        if ($positionIndex) {
                            $data = $data[$positionIndex-1];
                        }

                    } // or return full string
                    else {
                        $data = $string;
                    }

                    // trim selected chars from start and end of string
                    if ($trimCharacters) {
                        if (is_array($data)) {
                            foreach ($data as $key => $value) {
                                $data[$key] = trim($value, $trimCharacters);
                            }
                        } else {
                            $data = trim($data, $trimCharacters);
                        }
                    }
                    break;
                }
            }
        }
        return (! is_null($data)) ? $data : false;
    }

    /**
     * Get date
     *
     * @return string
     */
    public function getPublishDate()
    {
        $group = "Date";
        $publishDate = $this->getParsedData($group);

        if (! $publishDate) {
            $group = '';
            $label = 'Publication Year';
            $publishDate = $this->getParsedData($group, $label);
        }

        return $publishDate;
    }

    /**
     * Obtain the titles of the record from the record info section
     *
     * @return array
     */
    public function getTitles()
    {
        if (isset($this->fields['RecordInfo']['BibRecord']['BibEntity']['Titles'])) {
            foreach ($this->fields['RecordInfo']['BibRecord']['BibEntity']['Titles']
                     as $titleRecord
            ) {
                $data[] = $titleRecord['TitleFull'];
            }
        }
        return (! is_null($data)) ? $data : false;
    }

    /**
     * Obtain the volume of the record from the record info section
     *
     * @return string
     */
    public function getVolume()
    {
        if (isset($this->fields['RecordInfo']['BibRecord']['BibRelationships']['IsPartOfRelationships'])) {
            foreach ($this->fields['RecordInfo']['BibRecord']['BibRelationships']['IsPartOfRelationships']
                     as $titleRecord
            ) {
                if (isset($titleRecord['BibEntity']['Numbering'])) {
                    foreach($titleRecord['BibEntity']['Numbering'] as $numbering) {
                        if ($numbering['Type'] == 'volume') {
                            $data[] = $numbering['Value'];
                        }
                    }
                }
            }
        }
        return (! is_null($data)) ? $data[0] : false;
    }

    /**
     * Get access url
     *
     * @return string
     */
    public function getAccessUrl()
    {
        $group = "URL";
        $label = "Access URL";

        $data = $this->getParsedData($group, $label);

        $url = strip_tags(html_entity_decode($data));

        return filter_var($url, FILTER_VALIDATE_URL);
    }

    /**
     * Returns bool value whether EdsRecord contains plain fulltext or not.
     *
     * @return bool
     */
    public function containsFulltext()
    {
        return isset($this->fields['FullText']['Text']['Availability'])
               && $this->fields['FullText']['Text']['Availability'] == 1
               && isset($this->fields['FullText']['Text']['Value'])
               && strlen($this->fields['FullText']['Text']['Value']) > MINIMAL_FULLTEXT_LENGTH;
    }
}
