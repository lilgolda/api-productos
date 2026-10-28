import { KnownUser } from "./known-user.model.js";

export const knownUserRepository = {
  save: ({ username, registeredAt }) =>
    KnownUser.updateOne({ username }, { $setOnInsert: { registeredAt } }, { upsert: true }),
};
