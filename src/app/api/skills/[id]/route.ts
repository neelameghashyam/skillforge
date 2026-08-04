import { createItemHandlers } from "@/lib/api/crud-handler";
import { skillSchema } from "@/lib/validations/schemas";

export const { GET, PATCH, DELETE } = createItemHandlers({
  table: "skills",
  updateSchema: skillSchema.partial(),
});
