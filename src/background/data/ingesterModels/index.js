import * as yup from 'yup';

export * from "./accountDetails";
export * from "./boatAction";
export * from "./getBoatInfos";
export * from "./getFleet";
export * from "./getTeam";
export * from "./legList";
export * from "./polar";

export type IncomingMessage = z.infer<typeof incomingMessageSchema>;

export const incomingMessageSchema = yup.object({
  type: yup.string().oneOf(["response"]).required(),
  requestType: z.union([
    yup.string().oneOf(["AccountDetailsRequest"]).required(),
    yup.string().oneOf(["LogEventRequest"]).required(),
    yup.string().oneOf(["getboatinfos"]).required(),
    yup.string().oneOf(["getfleet"]).required(),
    yup.string().oneOf(["getlegranks"]).required(),
  ]),
  uniqueRaceId: yup.string().required().notRequired(),
  requestData: yup.mixed().required(),
  responseJson: yup.string().required(),
});

export const logEventRequestRequestDataSchema = yup.object({
  "@class": yup.string().oneOf(["LogEventRequest"]).required(),
  eventKey: z.union([
    yup.string().oneOf(["LogEventRequest"]).required(),
    yup.string().oneOf(["Leg_GetList"]).required(),
    yup.string().oneOf(["Meta_GetPolar"]).required(),
    yup.string().oneOf(["Game_AddBoatAction"]).required(),
    yup.string().oneOf(["Game_GetGhostTrack"]).required(),
    yup.string().oneOf(["User_GetCard"]).required(),
    yup.string().oneOf(["Game_GetSettings"]).required(),
    yup.string().oneOf(["Team_Get"]).required(),
    yup.string().oneOf(["Team_GetList"]).required(),
    yup.string().oneOf(["Game_GetFollowedBoats"]).required(),
    yup.string().oneOf(["Game_GetOpponents"]).required(),
    yup.string().oneOf(["Social_GetPlayers"]).required(),
    yup.string().oneOf(["Race_SelectorData"]).required(),
    yup.string().oneOf(["Race_Calendar"]).required(),
    yup.string().oneOf(["Catalog_GetBoats"]).required(),
    yup.string().oneOf(["Inventory_GetUserConsumables"]).required(),
  ]),
  playerId: yup.string().required(),
});
