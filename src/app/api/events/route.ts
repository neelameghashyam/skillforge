import { createCollectionHandlers } from "@/lib/api/crud-handler";
import { eventSchema } from "@/lib/validations/schemas";

export const { GET, POST } = createCollectionHandlers({
  table: "events",
  insertSchema: eventSchema,
  defaultOrder: { column: "start_time", ascending: true },
  searchableFilters: [],
});
