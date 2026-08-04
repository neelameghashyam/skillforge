import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const models = await client.models.list();

models.data.forEach((m) => console.log(m.id));