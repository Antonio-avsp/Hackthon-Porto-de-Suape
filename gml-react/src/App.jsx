import React from 'react';
import { useStore } from './store.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Toasts from './components/Toasts.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Licencas from './screens/Licencas.jsx';
import Prazos from './screens/Prazos.jsx';
import Evidencias from './screens/Evidencias.jsx';
import AssistenteIA from './screens/AssistenteIA.jsx';
import LicencaForm from './modals/LicencaForm.jsx';
import LicencaDetail from './modals/LicencaDetail.jsx';
import Historico from './modals/Historico.jsx';
import DemandaForm from './modals/DemandaForm.jsx';
import CondList from './modals/CondList.jsx';

const SCREENS = {
  dashboard: Dashboard,
  licencas: Licencas,
  prazos: Prazos,
  evidencias: Evidencias,
  ia: AssistenteIA,
};

function ModalHost() {
  const { modal } = useStore();
  if (!modal) return null;
  switch (modal.type) {
    case 'licForm': return <LicencaForm id={modal.payload} />;
    case 'licDetail': return <LicencaDetail id={modal.payload} />;
    case 'historico': return <Historico id={modal.payload} />;
    case 'demForm': return <DemandaForm />;
    case 'condList': return <CondList id={modal.payload} />;
    default: return null;
  }
}

export default function App() {
  const { screen } = useStore();
  const Screen = SCREENS[screen] || Dashboard;
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="scroll"><Screen key={screen} /></div>
      </main>
      <ModalHost />
      <Toasts />
    </div>
  );
}
