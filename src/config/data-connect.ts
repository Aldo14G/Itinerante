import { FirebaseApp } from "firebase/app";
import { getDataConnect, connectDataConnectEmulator } from "firebase/data-connect";

export const connectorConfig = {
  connector: "connector",
  location: "us-central1",
  service: "itinerante-service",
};

export default (firebaseApp: FirebaseApp) => {
  const dataConnect = getDataConnect(firebaseApp, connectorConfig);
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_DATA_CONNECT_EMULATOR_HOST) {
    connectDataConnectEmulator(
      dataConnect,
      process.env.NEXT_PUBLIC_DATA_CONNECT_EMULATOR_HOST,
      9399,
      false
    );
  }
  return dataConnect;
};
