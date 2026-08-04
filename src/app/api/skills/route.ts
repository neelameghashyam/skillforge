import { createCollectionHandlers } from "@/lib/api/crud-handler";
import { skillSchema } from "@/lib/validations/schemas";

export const { GET, POST } = createCollectionHandlers({
  table: "skills",
  insertSchema: skillSchema,
  defaultOrder: { column: "created_at", ascending: false },
  searchableFilters: ["category","level"],
});
