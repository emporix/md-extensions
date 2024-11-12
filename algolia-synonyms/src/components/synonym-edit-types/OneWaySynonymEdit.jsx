import { useState } from 'react';
import { saveSynonym } from '../../lib/algolia-search.js';
import SynonymType from '../SynonymType.jsx';

const OneWaySynonymEdit = ({synonym, onUpdate}) => {

  const [formData, setFormData] = useState(synonym);

  const handleInputChange = (event) => {
    const target = event.target;
    const name = target.name;
    const value = target.type === 'checkbox' ?
      target.checked :
      (['synonyms', 'replacements', 'corrections'].includes(name) ?
        target.value.split(',') :
        target.value);

    const newFormData = {
      ...formData, [name]: value,
    };
    setFormData(newFormData);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const {forwardToReplicas, ...synonym} = formData;
    await saveSynonym(synonym, forwardToReplicas ?? false);
    onUpdate && onUpdate(synonym, false);
  };

  return <form className="flex flex-col m-10" onSubmit={handleSubmit}>
    <div>{`Edit expansion: ${formData.objectID}`}</div>
    <div className="mt-3">
      <label className="mr-2" htmlFor="synonymType">Type:</label>
      <SynonymType type={synonym.type}/>
    </div>
    <label className="mt-3" htmlFor="input">Search term</label>
    <input type={'text'} name="input" id="input"
           placeholder="Input expression" value={formData.input}
           onChange={handleInputChange}/>
    <label className="mt-3" htmlFor="synonyms">Alternatives (comma
      separated)</label>
    <input type={'text'} name="synonyms" id="synonyms"
           placeholder="List of synonyms" value={formData.synonyms}
           onChange={handleInputChange}/>
    <div className="mt-3">
      <input type={'checkbox'} name="forwardToReplicas" id="forwardToReplicas"
             value={formData.forwardToReplicas} onChange={handleInputChange}/>
      <label className="ml-2" htmlFor="forwardToReplicas">Copy this expansion to
        other indices</label>
    </div>
    <button className="bg-blue-600 text-white p-2 rounded mt-3"
            type="submit">Save
    </button>
  </form>;
};

export default OneWaySynonymEdit;
