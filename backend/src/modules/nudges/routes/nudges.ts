import { Router } from "express";
import { runNudgePipeline } from "../Pipeline/index";
import { PrismaNudgeRepo } from "../Repo/PrismaNudgeRepo";
import { PrismaActionRepo } from "../Repo/PrismaActionRepo";

const router = Router();
const nudgeRepo = new PrismaNudgeRepo();
const actionRepo = new PrismaActionRepo();

// GET /nudges → list latest nudges
router.get("/", async (req, res) => {
  const userId = req.user.id; // assuming auth middleware
  const nudges = await nudgeRepo.listByUser(userId);
  res.json(nudges);
});

// POST /nudges/generate → manually trigger pipeline (for testing)
router.post("/generate", async (req, res) => {
  const userId = req.user.id;
  const nudges = await runNudgePipeline(userId);
  for (const nudge of nudges) await nudgeRepo.create(nudge);
  res.json({ message: "Nudges generated", count: nudges.length });
});

// POST /nudges/:id/accept
router.post("/:id/accept", async (req, res) => {
  const userId = req.user.id;
  const nudgeId = req.params.id;
  await actionRepo.create({ nudgeId, userId, type: "accept" });
  await nudgeRepo.updateStatus(nudgeId, "accepted");
  res.json({ message: "Nudge accepted" });
});

// POST /nudges/:id/dismiss
router.post("/:id/dismiss", async (req, res) => {
  const userId = req.user.id;
  const nudgeId = req.params.id;
  await actionRepo.create({ nudgeId, userId, type: "dismiss" });
  await nudgeRepo.updateStatus(nudgeId, "dismissed");
  res.json({ message: "Nudge dismissed" });
});

export default router;
