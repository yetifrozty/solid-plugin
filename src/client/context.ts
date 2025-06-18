import { createContext } from "solid-js";
import type { ClientAPI } from "./types.js";

let ClientAPIContext = createContext<ClientAPI>();

export default ClientAPIContext;