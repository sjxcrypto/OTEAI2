import { Router } from 'express';
import { SimpleGit, simpleGit } from 'simple-git';
import { z } from 'zod';

const router = Router();
const git: SimpleGit = simpleGit();

const commitSchema = z.object({
  message: z.string().min(1).max(200)
});

router.get('/status', async (req, res, next) => {
  try {
    const status = await git.status();
    res.json({
      modified: status.modified,
      added: status.created,
      deleted: status.deleted,
      staged: status.staged,
      branch: status.current
    });
  } catch (error) {
    next(error);
  }
});

router.post('/commit', async (req, res, next) => {
  try {
    const { message } = commitSchema.parse(req.body);
    await git.add('./*');
    await git.commit(message);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/branches', async (req, res, next) => {
  try {
    const branches = await git.branchLocal();
    res.json({ branches: branches.all });
  } catch (error) {
    next(error);
  }
});

export { router as gitRouter }; 