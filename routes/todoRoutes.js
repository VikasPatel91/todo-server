import express from "express";
import {
  getTodos,
  addTodo,
  deleteTodo,
  summarizeTodos,
  
} from "../controller/todoController.js";

const router = express.Router();

router.get("/todos", getTodos);
router.post("/todos", addTodo);
router.delete("/todos/:id", deleteTodo);
router.post("/summarize", summarizeTodos);

export default router;
