import { InviteToken } from "../domain/invite-token.types";

export type ValidarInviteTokenResult =
  | {
      valido: true;
      inviteToken: InviteToken;
    }
  | {
      valido: false;
      motivo: "INVITE_TOKEN_NAO_ENCONTRADO" | "INVITE_TOKEN_STATUS_INVALIDO" | "INVITE_TOKEN_EXPIRADO";
    };
