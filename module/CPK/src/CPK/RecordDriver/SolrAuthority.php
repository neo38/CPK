<?php
namespace CPK\RecordDriver;

use CPK\RecordDriver\SolrMarc as ParentSolrMarc;
use VuFind\RecordDriver\Response;
use Exception;

class SolrAuthority extends ParentSolrMarc
{
    private $searchController = null;
    private $searchRunner = null;

    public function __construct($mainConfig = null, $recordConfig = null,
            $searchSettings = null, $searchController = null, $searchRunner = null
    ) {
        $this->searchController = $searchController;
        $this->searchRunner = $searchRunner;
        parent::__construct($mainConfig, $recordConfig, $searchSettings);
    }

    /**
     * Get the full name of authority.
     *
     * @return string
     */
    public function getPersonalName()
    {
        $field = $this->getFieldArray('100', array('a', 'c', 'd'));
        $name = empty($field) ? '' : $field[0];
        return $name;
    }

    /**
     * Get the alternatives of the full name.
     *
     * @return aray
     */
    public function getAddedEntryPersonalNames()
    {
        $field = $this->getFieldArray('400', array('a', 'd'));
        $name = empty($field) ? '' : $field;
        return $name;
    }

    /**
     * Get the authority's pseudonyms.
     *
     * @return array
     */
    public function getPseudonyms() {
        $array = array();
        $fields = $this->getMarcRecord()->getFields('500');
        if (is_array($fields)) {
            foreach($fields as $currentField) {
                foreach (array('a', 'd', '7') as $subfield ) {
                    if (!isset($array[$subfield])) $array[$subfield] = array();
                    $currentVal = $currentField->getSubfield($subfield);
                    $currentVal = is_object($currentVal) ? $currentVal->getData() : "";
                    array_push($array[$subfield], $currentVal);
                }
            }
        }
        return $array;
    }

    /**
     * Get authority's source.
     *
     * @return array
     */
    public function getSource()
    {
        $field = $this->getFieldArray('670');
        return $field;
    }

    /**
     * Get the authority's name, shown as title of record.
     *
     * @return string
     */
    public function getHighlightedTitle()
    {
        $field = $this->getFieldArray('100', array('a', 'c', 'd'));
        $name = empty($field) ? '' : $field[0];
        if (substr($name, -1) == ',') $name = substr($name, 0, -1);
        return $name;
    }

    public function getBibinfoForObalkyKnihV3()
    {
        $bibinfo = array();
        $field = $this->getMarcRecord()->getField('001');
        $bibinfo['auth_id'] = empty($field) ? '' : $field->getData();
        return $bibinfo;
    }

    /**
     * Get the url of authority's cover from obalkyknih.
     *
     * Example of return value https://cache.obalkyknih.cz/file/cover/1376898/medium
     *
     * @return string $coverUrl
     */
    public function getAuthorityCover()
    {
        $obalky = $this->getAuthorityFromObalkyKnih();
        $coverUrl = empty($obalky[0]['cover_medium_url']) ? '' : $obalky[0]['cover_medium_url'];
        $coverUrl = str_replace('http://', 'https://', $coverUrl);
        return $coverUrl;
    }

    /**
     * Get the authority's bibliographic details.
     *
     * @return array $field
     */
    public function getSummary()
    {
        $field = $this->getFieldArray('678', array('a'));
        return empty($field) ? '' : $field;
    }

    /**
     * Get authority's e-version links.
     *
     * @return array
     */
    public function getLinks()
    {
        $links = array();
        $field998 = $this->getFieldArray('998', array('a'));
        foreach ($field998 as $part) {
            $links[] = 'auth|online|' . $part;
        }

        $field856 = $this->getFieldArray('856', array('u'));
        foreach ($field856 as $part) {
            if (strpos($part, 'osobnostiregionu') !== false) {
                $links[] = 'osobnostiregionu|online|' . $part;
            } else {
                $links[] = 'auth|online|' . $part;
            }
        }
        return $links;
    }

    /**
     * Get the bibliographic details of authority.
     *
     * @return string $details
     */
    public function getBibliographicDetails()
    {
        $field = $this->getFieldArray('678', array('a'));
        $details = empty($field) ? '' : $field[0];
        return $details;
    }

    private function getAuthorityFromObalkyKnih()
    {
        if (! isset($this->obalky)) {
            $field = $this->getMarcRecord()->getField('001');
            $auth_id = empty($field) ? '' : $field->getData();

            if (! empty($auth_id)) {
                try {
                    $cacheUrl = !isset($this->mainConfig->ObalkyKnih->cacheUrl)
                        ? 'https://cache.obalkyknih.cz' : $this->mainConfig->ObalkyKnih->cacheUrl;
                    $metaUrl = $cacheUrl . "/api/auth/meta";
                    $client = new \Zend\Http\Client($metaUrl);
                    $client->setParameterGet(array(
                        'auth_id' => $auth_id
                    ));

                    $response = $client->send();
                    $responseBody = $response->getBody();
                    $phpResponse = json_decode($responseBody, true);
                    $this->obalky = empty($phpResponse) ? null : $phpResponse;
                }
                catch (Exception $e) {
                    $this->obalky = null;
                }
            }
            else {
                $this->obalky = null;
            }
        }
        return $this->obalky;
    }

    /**
     * Get short note for authority (not record)
     *
     * @return string
     */
    public function getShortNoteEn()
    {
        return isset($this->fields['short_note_en_display']) ? $this->fields['short_note_en_display'] : '';
    }

    /**
     * Get short note for authority (not record)
     *
     * @return string
     */
    public function getShortNoteCs()
    {
        return isset($this->fields['short_note_cs_display']) ? $this->fields['short_note_cs_display'] : '';
    }

    /**
     * Get heading for authority (not record)
     *
     * @return string
     */
    public function getHeading()
    {
        return isset($this->fields['heading_display']) ? $this->fields['heading_display'] : '';
    }

    /**
     * Get id_authority.
     *
     * @return string
     */
    public function getAuthorityId()
    {
        $id = $this->getMarcRecord()->getField('001', [])->getData();

        return (! empty($id)) ? $id : '';
    }

    /**
     * Returns true, if authority has publications.
     *
     * @return bool
     */
    public function hasPublications()
    {
        $results = $this->searchController->getAuthorityPublicationsCount($this->getAuthorityId());
        return ($results > 1);
    }

    /**
     * Returns true, if there are publications about this authority.
     *
     * @return bool
     */
    public function publicationsAboutAvailable()
    {
        $results = $this->searchController->getPublicationsAboutAvailable($this->getAuthorityId());
        return ($results > 0);
    }

    /**
     * Get link to search publications of authority.
     *
     * @return string
     */
    public function getPublicationsUrl()
    {
        return "/Search/Results?"
            . "sort=relevance&join=AND&type0[]=adv_search_author_corporation"
            . "&bool0[]=AND&searchTypeTemplate=advanced&lookfor0[]="
            . $this->getAuthorityId();
    }

    /**
     * Get link to search publications about authority.
     *
     * @return string
     */
    public function getAboutPublicationsUrl()
    {
        return "/Search/Results?"
            . "sort=relevance&join=AND&type0[]=adv_search_subject_keywords"
            . "&bool0[]=AND&searchTypeTemplate=advanced&lookfor0[]="
            . $this->getAuthorityId();
    }
}
