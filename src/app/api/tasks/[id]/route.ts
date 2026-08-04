import { createItemHandlers } from "@/lib/api/crud-handler";
import { taskSchema } from "@/lib/validations/schemas";

export const { GET, PATCH, DELETE } = createItemHandlers({
  table: "tasks",
  updateSchema: taskSchema.partial(),
});
