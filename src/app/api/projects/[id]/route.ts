import { createItemHandlers } from "@/lib/api/crud-handler";
import { projectSchema } from "@/lib/validations/schemas";

export const { GET, PATCH, DELETE } = createItemHandlers({
  table: "projects",
  updateSchema: projectSchema.partial(),
});
