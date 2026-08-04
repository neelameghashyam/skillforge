import { createCollectionHandlers } from "@/lib/api/crud-handler";
import { noteSchema } from "@/lib/validations/schemas";

export const { GET, POST } = createCollectionHandlers({
  table: "notes",
  insertSchema: noteSchema,
  defaultOrder: { column: "updated_at", ascending: false },
  searchableFilters: ["skill_id","pinned"],
});
