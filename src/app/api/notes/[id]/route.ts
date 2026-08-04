import { createItemHandlers } from "@/lib/api/crud-handler";
import { noteSchema } from "@/lib/validations/schemas";

export const { GET, PATCH, DELETE } = createItemHandlers({
  table: "notes",
  updateSchema: noteSchema.partial(),
});
