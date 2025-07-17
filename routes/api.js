/**
 * API endpoints for OpenAI powered recipe generation.
 */
const Subject = require('../models/subject');

const fs = require('fs');
const path = require('path');
const { setInitError } = require('../utils/initStatus');

let openai_api_key = "";

const apiKeyPath = path.join(__dirname, '../../data/openai_api_key.txt');
if (fs.existsSync(apiKeyPath)) {
  try {
    openai_api_key = fs.readFileSync(apiKeyPath, 'utf8').trim();
  } catch (err) {
    setInitError('Cannot read OpenAI API Key.');
  }
} else if (process.env.OPENAI_API_KEY) {
  openai_api_key = process.env.OPENAI_API_KEY;
} else {
  setInitError('Cannot establish OpenAI API Key.');
}

const API_CONFIG = { apiKey: openai_api_key };
const PRIMARY_MODEL = "gpt-4.1";
const PREVIEW_MODEL = "gpt-4.1-mini";

const express = require('express');
const router = express.Router();

// Pass async errors to Express error handler
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
const openai = require('openai');
const showdown = require('showdown')

const db = require("../utils/db");
const getSpecChunks = require("../utils/specChunker")

const zod = require('zod');
const { zodResponseFormat } = require("openai/helpers/zod");

const GeneratedPromptWithReason = zod.object({
  prompt_heading: zod.string(),
  prompt: zod.string(),
  reason_for_choosing: zod.string(),
});

const GeneratedPromptWithReasonList = zod.object({
  prompts: zod.array(GeneratedPromptWithReason),
});

const GeneratedPromptVariation = zod.object({
  prompt: zod.string(),
  what_makes_it_different: zod.string(),
});

const GeneratedPromptVariationList = zod.object({
  prompts: zod.array(GeneratedPromptVariation),
});

/**
 * Middleware to log API calls
 */
router.use((req, res, next) => {
  const logEntry = {
    userEmail: req.user ? req.user.Email : "",
    path: req.originalUrl,
    ip: req.ip,
    timestamp: (new Date()).toISOString(),
    requestBody: JSON.stringify(req.body),
  };

  // Capture the original res.send method
  const originalSend = res.send.bind(res);
  let responseBody;

  // Override res.send to capture the response body
  res.send = function (body) {
    responseBody = body;
    return originalSend(body);
  };

  res.on('finish', () => {
    logEntry.responseBody = typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody;
    logEntry.error = res.statusCode >= 400 ? res.statusMessage : null;

    try {
      // Insert into APILogs with better-sqlite3
      db.prepare(`
        INSERT INTO APILogs (Timestamp, UserEmail, PathAccessed, SourceIP, RequestBody, ResponseBody, Error)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        logEntry.timestamp,
        logEntry.userEmail,
        logEntry.path,
        logEntry.ip,
        logEntry.requestBody,
        logEntry.responseBody,
        logEntry.error
      );
    } catch (err) {
      console.error('Error logging API access:', err);
    }
  });

  next();
});


/**
 * POST /api/generatePrompts
 * 1. Build prompt using OpenAI API
 * 2. Return generated list
 */
router.post('/generatePrompts', asyncHandler(async (req, res, next) => {

  const subjectId = req.body.subjectId;
  const topic = req.body.topic.toLowerCase();
  const subject = await Subject.findById(subjectId);
  const existing = req.body.existing;
  const templates = req.body.templates;
  const individuals = req.body.individuals;

  // Load the default recipe templates from disk
  const recipeTemplates = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../assets/recipe_templates.json'), 'utf8')
  );

  let generated_prompt_list;

  if (topic === "demo") {

    generated_prompt_list = {
      content: `{
    "prompts": [
      {
        "prompt_heading": "Demonstration prompt 1",
        "prompt": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue eros non ligula fermentum sollicitudin. Vivamus lacus odio, elementum vitae urna maximus, pellentesque congue odio. Cras iaculis eros nec nulla efficitur porta. Curabitur blandit arcu id dapibus sodales. Duis a dapibus mauris. Phasellus placerat lorem ac lacus eleifend ullamcorper. Integer in dui vel elit mollis dignissim nec sed lectus. Mauris dictum, orci quis tempor malesuada, metus neque finibus erat, eu posuere lorem neque eu tortor. Duis id turpis vel magna ultrices interdum. Donec a dolor vulputate, hendrerit lacus quis, tempor justo. Maecenas eu ornare nisl. Mauris iaculis turpis nunc, sit amet ultrices lectus convallis ac. Integer ac egestas tortor.",
        "reason_for_choosing": "What a great idea!"
      },
      {
        "prompt_heading": "Demonstration prompt 2",
        "prompt": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue eros non ligula fermentum sollicitudin. Vivamus lacus odio, elementum vitae urna maximus, pellentesque congue odio. Cras iaculis eros nec nulla efficitur porta. Curabitur blandit arcu id dapibus sodales. Duis a dapibus mauris. Phasellus placerat lorem ac lacus eleifend ullamcorper. Integer in dui vel elit mollis dignissim nec sed lectus. Mauris dictum, orci quis tempor malesuada, metus neque finibus erat, eu posuere lorem neque eu tortor. Duis id turpis vel magna ultrices interdum. Donec a dolor vulputate, hendrerit lacus quis, tempor justo. Maecenas eu ornare nisl. Mauris iaculis turpis nunc, sit amet ultrices lectus convallis ac. Integer ac egestas tortor.",
        "reason_for_choosing": "What a great idea!"
      },
      {
        "prompt_heading": "Demonstration prompt 3",
        "prompt": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue eros non ligula fermentum sollicitudin. Vivamus lacus odio, elementum vitae urna maximus, pellentesque congue odio. Cras iaculis eros nec nulla efficitur porta. Curabitur blandit arcu id dapibus sodales. Duis a dapibus mauris. Phasellus placerat lorem ac lacus eleifend ullamcorper. Integer in dui vel elit mollis dignissim nec sed lectus. Mauris dictum, orci quis tempor malesuada, metus neque finibus erat, eu posuere lorem neque eu tortor. Duis id turpis vel magna ultrices interdum. Donec a dolor vulputate, hendrerit lacus quis, tempor justo. Maecenas eu ornare nisl. Mauris iaculis turpis nunc, sit amet ultrices lectus convallis ac. Integer ac egestas tortor.",
        "reason_for_choosing": "What a great idea!"
      }
    ]
  }`};

  } else if (Array.isArray(individuals) && individuals.length > 0) {

    // Build the list of specific templates referenced by the user
    let promptList = [];
    for (let indexString of individuals.split(",")) {
      promptList.push(recipeTemplates[parseInt(indexString)]);
    }
  
    // Stringify templates for injection into the system prompt
    const preppredPromptList = JSON.stringify(promptList).replaceAll("\n", "");


    const OpenAI = new openai(API_CONFIG);

    const systemPrompt = `From the following list, output the prompts with the {{student}} 
and {{topic}} placeholders replaced, as required. Alter the capitalisation of {{topic}} so 
that the resulting prompt is gramatically correct, i.e. use capital letters for proper nouns, 
acronyms, titles of works and people, etc. Use UK spellings. 

For each of these, output out a heading (use the 'heading' field, but remove any extra 
text in square brackets), then the prompt, then give a reason why the prompt may be suitable 
to the given context, i.e. why it is a good match for the topic. 

Here is the list of prompt forms: 
${preppredPromptList}`;

    const userPrompt = `{{student}} is '${subject.Level} ${subject.Subject}'
{{topic}} is '${topic}'` + (existing.length === 0 ? "" : `
{{existing}} is '${JSON.stringify(existing)}'`);

    const completion = await OpenAI.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1.25,
      response_format: zodResponseFormat(GeneratedPromptWithReasonList, "generated_prompt_list"),
    });

    generated_prompt_list = completion.choices[0].message

  } else {

    // Helper to randomise the template list and limit its length
    const shuffleAndLimit = (array, limit) => {
      array.forEach((_, i) => {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      });
      array.length = limit;
    };

    const classicPrompts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const rapidPrompts = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const extraSTEMPrompts = [22, 23, 24, 25, 26, 27];
    const extraCreativeArtsPrompts = [28, 29, 30, 31, 32, 33];
    const extraHumanitiesPrompts = [34, 35, 36, 37, 38, 39];
    const extraSocialSciencePrompts = [40, 41, 42, 43, 44, 45];
    const extraLanguagesPrompts = [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
    const outOfTheBoxPrompts = [58, 59, 60, 61, 62, 63];

    const extractTemplates = (indicies) => {
      let extracted = [];
      for (let i = 0; i < recipeTemplates.length; i++) {
        if (indicies.includes(i)) {
          extracted.push(recipeTemplates[i]);
        }
      }
      return extracted;
    }
    
    let promptList = [];

    if (templates == "") {
      promptList = extractTemplates(classicPrompts);
    } else {
      if (templates.includes("C")) promptList = [...promptList, ...extractTemplates(classicPrompts)];
      if (templates.includes("R")) promptList = [...promptList, ...extractTemplates(rapidPrompts)];
      if (templates.includes("S")) promptList = [...promptList, ...extractTemplates(extraSTEMPrompts)];
      if (templates.includes("O")) promptList = [...promptList, ...extractTemplates(extraSocialSciencePrompts)];
      if (templates.includes("H")) promptList = [...promptList, ...extractTemplates(extraHumanitiesPrompts)];
      if (templates.includes("L")) promptList = [...promptList, ...extractTemplates(extraLanguagesPrompts)];
      if (templates.includes("A")) promptList = [...promptList, ...extractTemplates(extraCreativeArtsPrompts)];
      if (templates.includes("X")) promptList = [...promptList, ...extractTemplates(outOfTheBoxPrompts)];
    }

    shuffleAndLimit(promptList, 10);

    // Stringify templates for injection into the system prompt
    const preppredPromptList = JSON.stringify(promptList).replaceAll("\n", "");


    const OpenAI = new openai(API_CONFIG);

    const systemPrompt = `From the following list, pick three prompts which would work well with the user 
specificied values for {{student}} and {{topic}}. Don't just pick the first prompt from the list, 
it's vital you think critically have a good reason for which you pick based on the subject and topic. 
Reject any prompt you don't think works with the user's subject and topic. Output the three prompts you 
have chosen with the {{student}} and {{topic}} placeholders replaced, as required. Alter the 
capitalisation of {{topic}} so that the resulting prompt is gramatically correct, i.e. use 
capital letters for proper nouns, acronyms, titles of works and people, etc. Use UK spellings. 

For each of the three, output out a heading (use the 'heading' field, but remove any extra text in 
square brackets), then the prompt, then give a reason why you chose the prompt, i.e. why it is a good match 
for the topic. 
` +
      (existing.length === 0 ? "" : `
Finally, reject any prompts that are are very similar to, or have the same activity style as, any existing 
prompts that have already generated. These are listed in the user specified value of {{existing}}. 
`) + `
Here is the list of potential prompt forms: 
${preppredPromptList}`;

    const userPrompt = `{{student}} is '${subject.Level} ${subject.Subject}'
{{topic}} is '${topic}'` + (existing.length === 0 ? "" : `
{{existing}} is '${JSON.stringify(existing)}'`);

    const completion = await OpenAI.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1.25,
      response_format: zodResponseFormat(GeneratedPromptWithReasonList, "generated_prompt_list"),
    });

    generated_prompt_list = completion.choices[0].message

  }

  if (generated_prompt_list.refusal) {
    res.json({ error: generated_prompt_list.refusal });
  } else {
    const parsed = JSON.parse(generated_prompt_list.content.replaceAll(" a A level ", " an A level "));
    res.json(parsed);
  }


}));


router.post('/thinkDeeper', asyncHandler(async (req, res, next) => {
    const startingPoints = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../assets/levels_of_thinking.json'), 'utf8')
    );

  const original = req.body.prompt;
  const subject = await Subject.findById(req.body.subjectId);

  let subjectKey = subject.Category;
  if (subjectKey == "") {
    subjectKey = "Generic Statement";
  }

  const systemPrompt = `Rewrite the user provided prompt for an educational 
activity so that it encourages deeper levels of thinking. In addition to the 
prompt, include a brief explanation of 'what makes it different'.
  
It is essential that these three rules are followed:
1. The prompt must remain in the 1st person, starting with "I am a ..."
2. The prompt must remain focused on the original topic, as specified in the 
original prompt, and ensure the topic remains clearly stated in the new prompt. 
3. The prompt must initiate a two-way conversation, and any safeguards in the 
original prompt to maintain the conversation flow must be preserved. For example, 
if the original prompt says 'ask me one question at a time', it is essential this 
directive is copied to the new prompt. There's no need to add any superflous 
'let's begin' style endings. Under no circumstances should you start actually 
undertaking the activity described in the prompt - the prompt is a 'recipe' 
describing a future conversation. For example, if this is a 'fill in the gaps' 
activity, just describe the activity, don't actually generate the text with gaps. 
Use UK spellings.

To guide this process, refer to the following subject specific 'starting points' 
where the numbered list shows increasing level of depth of thought. If you find statements 
in the prompt that look like one of these list items, try to replace it with a statement 
from further down the list (i.e. a larger number):
${JSON.stringify(startingPoints[subjectKey])}`


  const OpenAI = new openai(API_CONFIG);

  const completion = await OpenAI.chat.completions.create({
    model: PRIMARY_MODEL,
    max_completion_tokens: 2500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${original}` },
    ],
    temperature: 0.75,
    response_format: zodResponseFormat(GeneratedPromptVariation, "enhanced_prompt"),
  });

  const enhanced_prompt = completion.choices[0].message

  if (enhanced_prompt.refusal) {
    res.json({ error: enhanced_prompt.refusal });
  } else {
    const parsed = JSON.parse(enhanced_prompt.content);
    res.json(parsed);
  }


}));

router.post('/generateVariations', asyncHandler(async (req, res, next) => {

  const original = req.body.prompt;

  const OpenAI = new openai(API_CONFIG);

  const completion = await OpenAI.chat.completions.create({
    model: PRIMARY_MODEL,
    temperature: 1.25,
    messages: [
      {
        role: "system",
        content: `Come up with three variations of the user provided prompt. 
Accompany each new prompt with a brief explanation of 'what makes it different'.
      
Each variation should modify the activity in an interesting way. For example:
1. Add an extra rule to the game or activity to encourage engagement and challenge.
2. Tweak the presentation style, as long as the two-way conversation nature of the prompt is preserved.
3. Change the interpretation of the topic, perhaps looking at it through a different perspective.

When generating the variations, it is essential that these three rules are followed:
1. The prompt must remain in the 1st person, starting with "I am a ..."
2. The prompt must remain focused on the original topic, as specified in the original prompt, and 
ensure the topic remains clearly stated in the new prompt. 
3. The prompt must initiate a two-way conversation, and any safeguards in the original prompt to 
maintain the conversation flow must be preserved. For example, if the original prompt says 'ask me 
one question at a time', it is essential this directive is copied to the new prompt. There's no need 
to add any superfluous 'let's begin' style endings. Use UK spellings. 

Under no circumstances should you start actually undertaking the activity described in the prompt - 
the prompt is a 'recipe' describing a future conversation.`
      },
      { role: "user", content: `${original}` },
    ],
    response_format: zodResponseFormat(GeneratedPromptVariationList, "generated_variation_list"),
  });

  const generated_variation_list = completion.choices[0].message

  if (generated_variation_list.refusal) {
    res.json({ error: generated_variation_list.refusal });
  } else {
    const parsed = JSON.parse(generated_variation_list.content);
    res.json(parsed);
  }


}));


router.post('/generatePreview', asyncHandler(async (req, res, next) => {

  const prompt = req.body.prompt;

  const OpenAI = new openai(API_CONFIG);

  const completion = await OpenAI.chat.completions.create({
    model: PREVIEW_MODEL,
    max_completion_tokens: 1000,
    temperature: 0.8,
    messages: [
      {
        "role": "user",
        "content": prompt
      }
    ]
  });

  let text = completion.choices[0].message.content;

  if (completion.choices[0].finish_reason == 'length') {
    text += "...";
  }

  res.json({ text });

}));


router.post('/continuePreview', asyncHandler(async (req, res, next) => {

  const history = req.body.history;
  const prompt = req.body.prompt;

  const OpenAI = new openai(API_CONFIG);

  const completion = await OpenAI.chat.completions.create({
    model: PREVIEW_MODEL,
    temperature: 0.8,
    max_completion_tokens: 10000,
    messages: [
      {
        role: "system",
        content: `Continue the conversation based on the history provided and the latest response from the user. 
Use UK spellings.

Here is the conversation so far:
${JSON.stringify(history)}`
      },
      {
        "role": "user",
        "content": prompt
      }
    ]
  });


  let text = completion.choices[0].message.content;

  if (completion.choices[0].finish_reason == 'length') {
    text += "...";
  }

  res.json({ text });

}));

/**
 * Query specification chunks and summarise them via OpenAI.
 * @param {number} subjectId - Subject identifier
 * @param {string} topic - Topic to search within the syllabus
 */
async function querySpec(subjectId, topic) {

  let chunks = getSpecChunks(subjectId, topic, 5);

  const userPrompt = `Use the information below to sumarise the syllabus content
related to the provided topic. The information contains 5 'chunks' extracted from 
the course syllabus document because of keyword matches. Be aware, the chunks have 
been selected due to keyword relevance, their order doesn't match where they were in 
the original syllabus document, they will likely start/end mid-sentence, and there 
is a high likelyhood of repeated information. Where applicable, quote the 
specification point numbers, e.g. 1.2.3 (not all courses have these.) Do not give 
any acknowledguement or commentary, just provide the summary. Use UK spellings.

Use markdown formatting for your response.

The topic is: '${topic}'

Here's the information:\n--------\n` + chunks.join("\n--------\n") + "\n--------"

  const OpenAI = new openai(API_CONFIG);

  const completion = await OpenAI.chat.completions.create({
    temperature: 0.66,
    model: PRIMARY_MODEL,
    max_completion_tokens: 1000,
    messages: [
      {
        role: "user",
        content: userPrompt,
      }
    ]
  });

  const specSummary = completion.choices[0].message

  if (specSummary.refusal) {
    return "";
  } else {
    let text = specSummary.content;
    return text;
  }
}


router.post('/clarifyTopic', asyncHandler(async (req, res, next) => {

  const topic = req.body.topic;
  const subjectId = req.body.subjectId;
  const userPrompt = req.body.prompt;

  let specDetails = await querySpec(subjectId, topic);
  let subject = Subject.findById(subjectId);

  const systemPrompt = `Use the specification points provided to write a short passage 
that will be presented alongside the user provided prompt recipe. This passage should 
sumarise the specification points, making clear what student need to know, and outline 
the essential skills and knowledge. This passage will be displayed to the user in addition 
to the original prompt, so do not repeat anything from that prompt. Don't use bullet 
points, new lines, or any other formatting in the passage. Describe the sylabus themes 
that the activity aims to help the student master, mentioning spec point numbers or 
codes as appropriate. Write the passage in the third person plural, e.g. 'Students needs to...'
Use UK spellings.

Under no circumstances should you start actually undertaking the activity described 
in the prompt - the prompt is a 'recipe' describing a future conversation. Do not give 
any acknowledgement, just the additional passage of text.`;

  const OpenAI = new openai(API_CONFIG);

  const completion = await OpenAI.chat.completions.create({
    model: PRIMARY_MODEL,
    temperature: 1,
    max_completion_tokens: 2500,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `User provided prompt recipe:
${userPrompt}

Specification points:
${specDetails}`
      }
    ]
  });

  const clarificationText = completion.choices[0].message

  if (clarificationText.refusal) {
    res.json({ error: clarificationText.refusal });
  } else {
    const prompt = userPrompt + `\n\nAdditional context (${subject.Level} ${subject.Subject}, ${subject.ExamBoard}):\n` + clarificationText.content.replaceAll("\n", "");
    let converter = new showdown.Converter();
    res.json({ prompt, specDetails: converter.makeHtml(specDetails) });
  }


}));

/**
 * POST /api/reduceComplexity
 * Simplify a prompt via OpenAI
 */
router.post('/reduceComplexity', asyncHandler(async (req, res, next) => {

  const userPrompt = req.body.prompt;

  const topic = req.body.topic;
  const subject = await Subject.findById(req.body.subjectId);

  const systemPrompt = `Reword the following prompt to be more suitable for a typical 14 year old. 
Adjust the instructions (as described in the prompt) towards simpler, age appropriate pedagogical 
techniques. Ensure the topic (${topic}) is preserved and the prompt remains relavent to the 
subject (${subject.Level + ' ' + subject.Subject}).

Whilst rewording, it is essential that these three rules are followed: 
1. The prompt must remain in the 1st person, starting with "I am a ...". Do not state the student's age.
2. The prompt must remain focused on the original topic, and ensure the topic remains clearly stated 
in the new prompt. 
3. The prompt must initiate a two-way conversation, and any safeguards in the original prompt to 
maintain the conversation flow must be preserved. For example, if the original prompt says 'ask me 
one question at a time', it is essential this directive is preserved to the new prompt. There's no need 
to add any superflous 'let's begin' style text. Use UK spellings.`;

  const OpenAI = new openai(API_CONFIG);

  const completion = await OpenAI.chat.completions.create({
    model: PRIMARY_MODEL,
    max_completion_tokens: 2500,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      }
    ]
  });

  const generated_prompt = completion.choices[0].message

  if (generated_prompt.refusal) {
    res.json({ error: generated_prompt.refusal });
  } else {
    const prompt = generated_prompt.content.replaceAll("\n", "");
    res.json({ prompt });
  }


}));

module.exports = router;
