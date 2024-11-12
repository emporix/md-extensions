import { deleteSynonym } from '../lib/algolia-search.js';
import { useState } from 'react';

const SynonymDelete = ({synonym, onUpdate}) => {

  const [forwardToReplicas, setForwardToReplicas] = useState(false);

  const handleDelete = async () => {
    await deleteSynonym(synonym, forwardToReplicas ?? false);
    onUpdate && onUpdate(synonym, true);
  };

  const handleInputChange = (event) => {
    const target = event.target;
    const name = target.name;
    setForwardToReplicas(target.checked);
  };

  return <div className="m-10">
    <div>Deleting synonym: {synonym.objectID}</div>
    <div className="mt-3">
      <input className="focus:ring-0" type={'checkbox'} name="forwardToReplicas" id="forwardToReplicas"
             value={forwardToReplicas} onChange={handleInputChange}/>
      <label className="ml-2" htmlFor="forwardToReplicas">Copy this expansion to
        other indices</label>
    </div>
    <button className="w-full bg-red-500 text-white p-2 rounded mt-5"
            onClick={handleDelete}>
      Confirm
    </button>
  </div>;
};

export default SynonymDelete;
