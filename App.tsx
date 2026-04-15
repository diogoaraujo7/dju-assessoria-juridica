import React from 'react';
import { WorkflowProvider, useWorkflowState } from './context/WorkflowContext';
import { UIProvider } from './context/UIContext';
import { GeminiProvider } from './context/GeminiContext';
import { WorkflowSidebar } from './components/WorkflowSidebar';
import { MainContent } from './components/MainContent';
import { InitialSelectionScreen } from './components/InitialSelectionScreen';

const AppContent: React.FC = () => {
  const { task } = useWorkflowState();

  const isEditorMode = task === 'EDITOR';
  const hideSidebar = isEditorMode;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {task ? (
        <>
          {!hideSidebar && <WorkflowSidebar />}
          <MainContent />
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
          <InitialSelectionScreen />
        </div>
      )}
    </div>
  );
};


const App: React.FC = () => {
  return (
    <UIProvider>
      <GeminiProvider>
        <WorkflowProvider>
          <AppContent />
        </WorkflowProvider>
      </GeminiProvider>
    </UIProvider>
  );
};

export default App;