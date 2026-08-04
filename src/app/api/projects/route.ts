import { createCollectionHandlers } from "@/lib/api/crud-handler";
import { projectSchema } from "@/lib/validations/schemas";

export const { GET, POST } = createCollectionHandlers({
  table: "projects",
  insertSchema: projectSchema,
  defaultOrder: { column: "deadline", ascending: true },
  searchableFilters: ["status","skill_id"],
});
