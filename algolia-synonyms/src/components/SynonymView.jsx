import { Fragment, useEffect, useState } from 'react';
import { SplitButton } from 'primereact/splitbutton';
import { getAllSynonyms } from '../lib/algolia-search.js';
import SynonymExpansion from './SynonymExpansion.jsx';
import SynonymType from './SynonymType.jsx';
import Dialog from './Dialog.jsx';
import SynonymEditDispatcher
  from './synonym-edit-types/SynonymEditDispatcher.jsx';
import SynonymDelete from './SynonymDelete.jsx';

const SynonymView = () => {
  const [synonyms, setSynonyms] = useState([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [synonymToEdit, setSynonymToEdit] = useState();

  useEffect(() => {
    getAllSynonyms().then((synonyms) => {
      setSynonyms(synonyms);
    });
  }, []);

  const handleEdit = (synonym) => {
    setSynonymToEdit(synonym);
    setShowEditDialog(true);
  };

  const handleDelete = (synonym) => {
    setSynonymToEdit(synonym);
    setShowDeleteDialog(true);
  };

  const handleUpdate = (synonym, isDelete) => {
    const addedSynonyms = synonyms.map((item) => {
      return item.objectID === synonym.objectID ? synonym : item;
    });
    if (!addedSynonyms.some(item => item.objectID === synonym.objectID)) {
      addedSynonyms.push(synonym);
    }
    const newSynonyms = isDelete ?
      addedSynonyms.filter(item => item.objectID !== synonym.objectID) :
      addedSynonyms;
    setSynonyms(newSynonyms);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
  };

  const handleAdd = (synonymTypeToAdd) => {
    const newSynonym = () => {
      switch (synonymTypeToAdd) {
        case 'synonym':
          return {
            objectID: 'syn-' + crypto.randomUUID().toString(),
            type: "synonym",
            synonyms: [],
          };
        case 'onewaysynonym':
          return {
            objectID: 'syn-' + crypto.randomUUID().toString(),
            type: "onewaysynonym",
            input: '',
            synonyms: []
          };
        case 'placeholder':
          return {
            objectID: 'syn-' + crypto.randomUUID().toString(),
            type: "placeholder",
            placeholder: '',
            replacements: []
          };
        case 'altcorrection1':
          return {
            objectID: 'syn-' + crypto.randomUUID().toString(),
            type: "altcorrection1",
            word: '',
            corrections: []
          };
        case 'altcorrection2':
          return {
            objectID: 'syn-' + crypto.randomUUID().toString(),
            type: 'altcorrection2',
            word: '',
            corrections: []
          };
      }
    };
    setSynonymToEdit(newSynonym);
    setShowEditDialog(true);
  };

  return <>
    <div>
      <div className="gap-2 w-[calc(100%-20px)] flex place-content-end">
        <SplitButton
          label="Add new synonym"
          icon="pi pi-plus"
          model={[
            { label: 'Synonym', command: () => { handleAdd('synonym'); } },
            { label: 'One-way Synonym', command: () => { handleAdd('onewaysynonym'); } },
            { label: 'Placeholder', command: () => { handleAdd('placeholder'); } },
            { label: 'Alternative Correction (Typo=1)', command: () => { handleAdd('altcorrection1'); } },
            { label: 'Alternative Correction (Typo=2)', command: () => { handleAdd('altcorrection2'); } }
          ]}
          className="p-splitbutton-defaultbutton"
          onClick={() => handleAdd('synonym')}
          style={{
            background: 'linear-gradient(180deg, #4db1fd 0%, #128afb 100%)',
            border: '1px solid #128afb',
            alignItems: 'center',
            boxShadow: '0 1px 1px #00000040',
            borderRadius: '2px',
            marginTop: '20px',
            padding: '5px',
            color: 'white'
          }}
        />
      </div>
    </div>
    <div className="w-[calc(100%-20px)] max-w-[calc(100%-20px)] m-6 overflow-x-auto">
      <div className="grid grid-cols-[30ch,1fr,20ch] w-[calc(100%-20px)]">
        <div className="border-b mb-3 p-2 bg-gray-100">Type</div>
        <div className="border-b mb-3 p-2 bg-gray-100 flex col-span-2">Expansion</div>
        {synonyms.map((synonym) => (
          <Fragment key={synonym.objectID}>
            <div className="p-2 border-b"><SynonymType type={synonym.type} /></div>
            <div className="p-2 border-b"><SynonymExpansion synonym={synonym} /></div>
            <div className="p-2 border-b place-content-end flex">
              <button className="p-button p-component p-button-text p-button-icon-only hover:text-[rgb(18,138,251)]" onClick={() => handleEdit(synonym)}><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" data-test-id="edit-button" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"></path></svg><span className="p-button-label p-c">&nbsp;</span></button>
              <button className="p-button p-component p-button-text p-button-icon-only hover:text-[rgb(18,138,251)]" onClick={() => handleDelete(synonym)}><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" data-test-id="delete-button" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"></path></svg><span className="p-button-label p-c">&nbsp;</span></button>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
    {showEditDialog && <Dialog open={showEditDialog}
      onClose={() => setShowEditDialog(false)}><SynonymEditDispatcher
        synonym={synonymToEdit} onUpdate={handleUpdate} /></Dialog>}
    {showDeleteDialog && <Dialog open={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}><SynonymDelete
        synonym={synonymToEdit} onUpdate={handleUpdate} /></Dialog>}
  </>;
};

export default SynonymView;
