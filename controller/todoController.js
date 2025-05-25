import Todo from "../models/todo.js";
import axios from "axios";
import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const getTodos = async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
};

export const addTodo = async (req, res) => {
  const todo = new Todo({ title: req.body.title });
  await todo.save();
  res.status(201).json(todo);
};

export const deleteTodo = async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);

    if (!deletedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({
      message: "Error deleting todo",
      error: error.message,
    });
  }
};

export const summarizeTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ completed: false });

    if (!todos.length) {
      return res
        .status(200)
        .json({ message: "No pending todos to summarize." });
    }

    const todoText = todos.map((t, i) => `${i + 1}. ${t.title}`).join("\n");
    const prompt = `Summarize the following pending to-dos in a concise bullet-point list:\n\n${todoText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = completion.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ error: "Failed to generate summary." });
    }

    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `📝 *Pending Todo Summary*\n${summary}`,
    });

    res.status(200).json({
      message: "Summary posted to Slack.",
      summary,
    });
  } catch (error) {
    const status = error.response?.status;
    const message =
      status === 429
        ? "Quota exceeded or too many requests. Check your OpenAI usage or slow down the request rate."
        : error.response?.data?.error?.message || error.message;

    console.error("Summarization error:", message);
    res.status(500).json({ error: message });
  }
};
