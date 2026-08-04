import { createItemHandlers } from "@/lib/api/crud-handler";
import { resourceSchema } from "@/lib/validations/schemas";

export const { GET, PATCH, DELETE } = createItemHandlers({
  table: "resources",
  updateSchema: resourceSchema.partial(),
});
