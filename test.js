import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

try {
  const res = await client.models.list();
  console.log(res.data[0]);
} catch (e) {
  console.log(e.status);
  console.log(e.error || e.message);
}