import React, { useState, useEffect, Fragment } from 'react';
import { registerCallback, registerClient } from 'md-ext/lib';
import SynonymView from './components/SynonymView.jsx';
import axios from 'axios';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/md-light-indigo/theme.css";

const App = () => {

  const [algoliaConfig, setAlgoliaConfig] = useState(null);
  const [missingAlgoliaConfig, setMissingAlgoliaConfig] = useState(false);

  registerClient();
  registerCallback('callbackId', async (ctx) => {
    console.log('context update', ctx);
    try {
      const res = await axios.get(
        `${ctx.value.emporixApiUrl}/indexing/${ctx.value.tenant}/configurations/ALGOLIA`,
        {
          headers: {
            'Authorization': `Bearer ${ctx.value.accessToken}`,
            'Emporix-tenant': ctx.value.tenant,
            'Content-Type': 'application/json',
          }
        }
      );
      console.log("R", res.data);
      if (res.status === 404) {
        setMissingAlgoliaConfig(true);
        return;
      }
      setAlgoliaConfig(res.data);
      localStorage.setItem('algoliaConfig', JSON.stringify(res.data));
    } catch (error) {
      console.log("E", error)
      setMissingAlgoliaConfig(true);
    }
  });

  if (algoliaConfig) {
    return (
      <>
        <PrimeReactProvider>
          <SynonymView />


        </PrimeReactProvider>
      </>
    );
  } else {
    return (
      <>
        <h1>Algolia Config not found</h1>
      </>
    );
  }

};

export default App;
