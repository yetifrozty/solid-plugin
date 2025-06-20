import { Suspense, useContext, type Component } from "solid-js";
import { type ClientAPI } from "./types.js";
import _ClientAPIContext from "./context.js";

let ClientAPIContext = _ClientAPIContext;

import.meta.hot?.accept("./context.js", (Context) => {
  ClientAPIContext = Context?.default;
});

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
  const DynamicComponent = () => {
    const Component = props.clientAPI.component!;
    return <Component />;
  }
  return (
    <ClientAPIContext.Provider value={props.clientAPI}>
      {/* Dynamic component rendering based on clientAPI.component */}
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicComponent />
      </Suspense>
    </ClientAPIContext.Provider>
  );
};

export default App; 