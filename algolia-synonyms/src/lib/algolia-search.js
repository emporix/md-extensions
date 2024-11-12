import algoliasearch from 'algoliasearch';

const getIndex = () => {
  const algoliaConfig = JSON.parse(localStorage.getItem('algoliaConfig'));
  const client = algoliasearch(algoliaConfig.applicationId, algoliaConfig.writeKey);
  return client.initIndex(algoliaConfig.indexName);
};

export const getAllSynonyms = async () => {
  let synonymsFromBrowse = [];
  await getIndex().browseSynonyms(
    {
      batch: batch => synonymsFromBrowse = synonymsFromBrowse.concat(batch),
    },
  );
  return synonymsFromBrowse;
};

export const saveSynonym = async (synonym, forwardToReplicas) => {
  getIndex().
    saveSynonym(synonym, {forwardToReplicas: forwardToReplicas}).wait().
    then(result => {
      alert(JSON.stringify(result));
      console.log(result);
    }).
    catch(error => {
      alert(error.message);
      console.error(error);
    });
};

export const deleteSynonym = async (objectId, forwardToReplicas) => {
  getIndex().
    deleteSynonym(objectId, {forwardToReplicas: forwardToReplicas}).wait().
    then(result => {
      alert(JSON.stringify(result));
      console.log(result);
    }).
    catch(error => {
      alert(error.message);
      console.error(error);
    });
};
