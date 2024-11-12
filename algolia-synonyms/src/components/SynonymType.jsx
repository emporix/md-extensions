const SynonymType = ({type}) => {
  switch (type) {
    case 'synonym':
      return 'Synonym';
    case 'onewaysynonym':
      return 'One-way Synonym';
    case 'placeholder':
      return 'Placeholder';
    case 'altcorrection1':
      return <span>Alternative Correction <span
        className="border rounded-full bg-gray-100 px-2 py-1">Typo=1</span></span>;
    case 'altcorrection2':
      return <span>Alternative Correction <span
        className="border rounded-full bg-gray-100 px-2 py-1">Typo=2</span></span>;
  }
};

export default SynonymType;
