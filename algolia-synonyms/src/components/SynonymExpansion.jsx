const SynonymExpansion = ({synonym}) => {
  switch (synonym.type) {
    case 'synonym':
      return synonym.synonyms.map((s, index) => <span key={index}>{s}
        {index < synonym.synonyms.length - 1 &&
          <span className="text-gray-400"> ↔ </span>}</span>);
    case 'onewaysynonym':
      return <span>{synonym.input}<span
        className="text-gray-400"> → </span>({synonym.synonyms.map(
        (r, index) => <span key={index}>{r}
          {index < synonym.synonyms.length - 1 &&
            <span className="text-gray-400"> OR </span>}</span>)})</span>;
    case 'placeholder':
      return <span>{synonym.placeholder}<span
        className="text-gray-400"> → </span>({synonym.replacements.map(
        (r, index) => <span key={index}>{r}
          {index < synonym.replacements.length - 1 &&
            <span className="text-gray-400"> OR </span>}</span>)})</span>;
    case 'altcorrection1':
    case 'altcorrection2':
      return <span>{synonym.word}<span
        className="text-gray-400"> → </span>({synonym.corrections.map(
        (r, index) => <span key={index}>{r}
          {index < synonym.corrections.length - 1 &&
            <span className="text-gray-400"> OR </span>}</span>)})</span>;
  }
};

export default SynonymExpansion;
