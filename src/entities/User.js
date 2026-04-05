import { base44 } from "@/api/base44Client";

export const User = {
  ...base44.entities.User,
  me: () => base44.auth.me(),
  updateMe: (updates) => base44.auth.updateMe(updates),
  filter: (...args) => base44.entities.User.filter(...args),
  list: (...args) => base44.entities.User.list(...args),
  get: (...args) => base44.entities.User.get(...args),
  create: (...args) => base44.entities.User.create(...args),
  update: (...args) => base44.entities.User.update(...args),
  delete: (...args) => base44.entities.User.delete(...args),
};
