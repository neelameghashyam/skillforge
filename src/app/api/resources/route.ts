import { createCollectionHandlers } from "@/lib/api/crud-handler";
import { resourceSchema } from "@/lib/validations/schemas";

export const { GET, POST } = createCollectionHandlers({
  table: "resources",
  insertSchema: resourceSchema,
  defaultOrder: { column: "created_at", ascending: false },
  searchableFilters: ["type","skill_id","is_favorite"],
});
