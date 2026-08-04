import { createItemHandlers } from "@/lib/api/crud-handler";
import { eventSchema } from "@/lib/validations/schemas";

export const { GET, PATCH, DELETE } = createItemHandlers({
  table: "events",
  updateSchema: eventSchema.innerType().partial(),
});
