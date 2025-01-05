import { Router } from 'express';
import { Configuration, OpenAIApi } from 'openai';

const router = Router();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post('/completion', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 150,
      n: 3,
    });

    res.json({
      completion: completion.data.choices[0].text,
      alternatives: completion.data.choices.slice(1).map(c => c.text)
    });
  } catch (error) {
    next(error);
  }
});

export { router as aiRouter }; 