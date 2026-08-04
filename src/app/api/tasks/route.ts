import { createCollectionHandlers } from "@/lib/api/crud-handler";
import { taskSchema } from "@/lib/validations/schemas";

export const { GET, POST } = createCollectionHandlers({
  table: "tasks",
  insertSchema: taskSchema,
  defaultOrder: { column: "scheduled_date", ascending: true },
  searchableFilters: ["status","priority","project_id","skill_id"],
});
