import { useState } from 'react';
import { saveSynonym } from '../../lib/algolia-search.js';
import SynonymType from '../SynonymType.jsx';

const PlaceholderEdit = ({synonym, onUpdate}) => {

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
    <label className="mt-3" htmlFor="placeholder">Placeholder</label>
    <input type={'text'} name="placeholder" id="placeholder"
           placeholder="<identifier>" value={formData.placeholder}
           onChange={handleInputChange}/>
    <label className="mt-3" htmlFor="replacements">Replacements (comma
      separated)</label>
    <input type={'text'} name="replacements" id="replacements"
           placeholder="List of synonyms" value={formData.replacements}
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

export default PlaceholderEdit;