import SynonymEdit from './SynonymEdit.jsx';
import OneWaySynonymEdit from './OneWaySynonymEdit.jsx';
import PlaceholderEdit from './PlaceholderEdit.jsx';
import AlternativeCorrectionEdit from './AlternativeCorrectionEdit.jsx';

const SynonymEditDispatcher = ({synonym, onUpdate}) => {
  switch (synonym.type) {
    case 'synonym':
      return <SynonymEdit synonym={synonym} onUpdate={onUpdate} />;
    case 'onewaysynonym':
      return <OneWaySynonymEdit synonym={synonym} onUpdate={onUpdate} />;
    case 'placeholder':
      return <PlaceholderEdit synonym={synonym} onUpdate={onUpdate} />;
    case 'altcorrection1':
    case 'altcorrection2':
      return <AlternativeCorrectionEdit synonym={synonym} onUpdate={onUpdate} />;
  }
};

export default SynonymEditDispatcher;
