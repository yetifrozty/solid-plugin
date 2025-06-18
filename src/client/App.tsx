import { createContext, Suspense, useContext, type Component } from "solid-js";
import { type ClientAPI } from "./types.js";
import { generateHydrationScript } from "solid-js/web";

const ClientAPIContext = createContext<ClientAPI>();

export const useClientAPI = () => {
  const context = useContext(ClientAPIContext);
  if (!context) {
    throw new Error("useClientAPI must be used within a ClientAPIProvider");
  }
  return context;
};

interface AppProps {
  clientAPI: ClientAPI;
}

const App: Component<AppProps> = (props) => {
  const getDynamicComponent = () => props.clientAPI.component!;
  return (
    <ClientAPIContext.Provider value={props.clientAPI}>
      {/* Dynamic component rendering based on clientAPI.component */}
      {/* <Suspense fallback={<div>Loading...</div>}> */}
        {(() => {
          const DynamicComponent = getDynamicComponent();
          return <DynamicComponent />;
        })()}
      {/* </Suspense> */}
    </ClientAPIContext.Provider>
    
  );
};

export default App; 