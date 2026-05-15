import { DeviceSession } from "../domain/device-session.types";

export type ValidarDeviceSessionResult =
  | {
      valido: true;
      deviceSession: DeviceSession;
    }
  | {
      valido: false;
      motivo: "DEVICE_SESSION_NAO_ENCONTRADA" | "DEVICE_SESSION_STATUS_INVALIDO" | "DEVICE_SESSION_INVITE_TOKEN_DIVERGENTE";
    };
