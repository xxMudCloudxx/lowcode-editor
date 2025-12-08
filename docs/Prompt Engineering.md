# Prompt Engineering

**Author:** Lee Boonstra  
**Date:** February 2025

## Acknowledgements

### Content contributors

- Michael Sherman
- Yuan Cao
- Erick Armbrust
- Anant Nawalgaria
- Antonio Gulli
- Simone Cammel

### Curators and Editors

- Antonio Gulli
- Anant Nawalgaria
- Grace Mollison

### Technical Writer

- Joey Haymaker

### Designer

- Michael Lanning

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prompt Engineering](#prompt-engineering-1)
3. [LLM Output Configuration](#llm-output-configuration)
   - [Output Length](#output-length)
   - [Sampling Controls](#sampling-controls)
   - [Temperature](#temperature)
   - [Top-K and Top-P](#top-k-and-top-p)
   - [Putting It All Together](#putting-it-all-together)
4. [Prompting Techniques](#prompting-techniques)
   - [General Prompting / Zero Shot](#general-prompting--zero-shot)
   - [One-shot & Few-shot](#one-shot--few-shot)
   - [System, Contextual and Role Prompting](#system-contextual-and-role-prompting)
   - [Step-back Prompting](#step-back-prompting)
   - [Chain of Thought (CoT)](#chain-of-thought-cot)
   - [Self-consistency](#self-consistency)
   - [Tree of Thoughts (ToT)](#tree-of-thoughts-tot)
   - [ReAct (Reason & Act)](#react-reason--act)
   - [Automatic Prompt Engineering](#automatic-prompt-engineering)
5. [Code Prompting](#code-prompting)
   - [Prompts for Writing Code](#prompts-for-writing-code)
   - [Prompts for Explaining Code](#prompts-for-explaining-code)
   - [Prompts for Translating Code](#prompts-for-translating-code)
   - [Prompts for Debugging and Reviewing Code](#prompts-for-debugging-and-reviewing-code)
6. [What About Multimodal Prompting?](#what-about-multimodal-prompting)
7. [Best Practices](#best-practices)
8. [Summary](#summary)
9. [Endnotes](#endnotes)

---

## Introduction

When thinking about a large language model input and output, a text prompt (sometimes accompanied by other modalities such as image prompts) is the input the model uses to predict a specific output. You don't need to be a data scientist or a machine learning engineer – **everyone can write a prompt**. However, crafting the most effective prompt can be complicated.

Many aspects of your prompt affect its efficacy:

- The model you use
- The model's training data
- The model configurations
- Your word-choice, style and tone
- Structure
- Context

Therefore, prompt engineering is an **iterative process**. Inadequate prompts can lead to ambiguous, inaccurate responses, and can hinder the model's ability to provide meaningful output.

---

## Prompt Engineering

When you chat with the Gemini chatbot, you basically write prompts, however this whitepaper focuses on writing prompts for the Gemini model within Vertex AI or by using the API, because by prompting the model directly you will have access to the configuration such as temperature etc.

Remember how an LLM works; it's a **prediction engine**. The model takes sequential text as an input and then predicts what the following token should be, based on the data it was trained on. The LLM is operationalized to do this over and over again, adding the previously predicted token to the end of the sequential text for predicting the following token.

**Prompt engineering** is the process of designing high-quality prompts that guide LLMs to produce accurate outputs. This process involves:

- Tinkering to find the best prompt
- Optimizing prompt length
- Evaluating a prompt's writing style and structure in relation to the task

These prompts can be used to achieve various kinds of understanding and generation tasks such as:

- Text summarization
- Information extraction
- Question and answering
- Text classification
- Language or code translation
- Code generation
- Code documentation or reasoning

---

## LLM Output Configuration

Once you choose your model you will need to figure out the model configuration. Most LLMs come with various configuration options that control the LLM's output. Effective prompt engineering requires setting these configurations optimally for your task.

### Output Length

An important configuration setting is the number of tokens to generate in a response. Generating more tokens requires more computation from the LLM, leading to:

- Higher energy consumption
- Potentially slower response times
- Higher costs

> **Note:** Reducing the output length of the LLM doesn't cause the LLM to become more stylistically or textually succinct in the output it creates, it just causes the LLM to stop predicting more tokens once the limit is reached.

Output length restriction is especially important for some LLM prompting techniques, like **ReAct**, where the LLM will keep emitting useless tokens after the response you want.

### Sampling Controls

LLMs do not formally predict a single token. Rather, LLMs predict probabilities for what the next token could be, with each token in the LLM's vocabulary getting a probability. Those token probabilities are then sampled to determine what the next produced token will be.

**Temperature**, **top-K**, and **top-P** are the most common configuration settings that determine how predicted token probabilities are processed to choose a single output token.

### Temperature

Temperature controls the degree of randomness in token selection:

- **Lower temperatures** are good for prompts that expect a more deterministic response
- **Higher temperatures** can lead to more diverse or unexpected results
- **Temperature of 0** (greedy decoding) is deterministic: the highest probability token is always selected

The Gemini temperature control can be understood similarly to the softmax function used in machine learning:

- A **low temperature** setting emphasizes a single, preferred output with high certainty
- A **higher temperature** setting makes a wider range of outputs more acceptable, accommodating scenarios where a rigid, precise output may not be essential (like experimenting with creative outputs)

### Top-K and Top-P

Top-K and top-P (also known as **nucleus sampling**) are two sampling settings used in LLMs to restrict the predicted next token to come from tokens with the top predicted probabilities.

- **Top-K sampling** selects the top K most likely tokens from the model's predicted distribution
  - Higher top-K = more creative and varied output
  - Lower top-K = more restrictive and factual output
  - Top-K of 1 is equivalent to greedy decoding

- **Top-P sampling** selects the top tokens whose cumulative probability does not exceed a certain value (P)
  - Values range from 0 (greedy decoding) to 1 (all tokens in the vocabulary)

### Putting It All Together

Choosing between top-K, top-P, temperature, and the number of tokens to generate depends on the specific application and desired outcome.

**Recommended Starting Points:**

| Use Case                               | Temperature | Top-P | Top-K |
| -------------------------------------- | ----------- | ----- | ----- |
| Relatively coherent, somewhat creative | 0.2         | 0.95  | 30    |
| Especially creative                    | 0.9         | 0.99  | 40    |
| Less creative, more factual            | 0.1         | 0.9   | 20    |
| Single correct answer (e.g., math)     | 0           | -     | -     |

> **Warning:** Have you ever seen a response ending with a large amount of filler words? This is known as the "**repetition loop bug**", a common issue where the model gets stuck in a cycle, repeatedly generating the same word, phrase, or sentence structure. This can occur at both low and high temperature settings.

---

## Prompting Techniques

LLMs are tuned to follow instructions and are trained on large amounts of data so they can understand a prompt and generate an answer. But LLMs aren't perfect; the clearer your prompt text, the better it is for the LLM to predict the next likely text.

### General Prompting / Zero Shot

A **zero-shot** prompt is the simplest type of prompt. It only provides:

- A description of a task
- Some text for the LLM to get started with

This input could be anything: a question, a start of a story, or instructions. The name "zero-shot" stands for "no examples".

**Example: Movie Classification**

| Field           | Value                                                                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**        | 1_1_movie_classification                                                                                                                                                                                                                                    |
| **Goal**        | Classify movie reviews as positive, neutral or negative                                                                                                                                                                                                     |
| **Model**       | gemini-pro                                                                                                                                                                                                                                                  |
| **Temperature** | 0.1                                                                                                                                                                                                                                                         |
| **Token Limit** | 5                                                                                                                                                                                                                                                           |
| **Top-K**       | N/A                                                                                                                                                                                                                                                         |
| **Top-P**       | 1                                                                                                                                                                                                                                                           |
| **Prompt**      | Classify movie reviews as POSITIVE, NEUTRAL or NEGATIVE.<br>Review: "Her" is a disturbing study revealing the direction humanity is headed if AI is allowed to keep evolving, unchecked. I wish there were more movies like this masterpiece.<br>Sentiment: |
| **Output**      | POSITIVE                                                                                                                                                                                                                                                    |

### One-shot & Few-shot

When zero-shot doesn't work, you can provide demonstrations or examples in the prompt.

- **One-shot prompt**: Provides a single example
- **Few-shot prompt**: Provides multiple examples to the model

**Guidelines for Few-shot Prompting:**

- Use at least **3-5 examples** as a general rule
- Examples should be relevant, diverse, high quality, and well written
- Include **edge cases** for robust output
- One small mistake can confuse the model

**Example: Pizza Order Parsing**

| Field           | Value                      |
| --------------- | -------------------------- |
| **Goal**        | Parse pizza orders to JSON |
| **Model**       | gemini-pro                 |
| **Temperature** | 0.1                        |
| **Token Limit** | 250                        |

**Prompt:**

```
Parse a customer's pizza order into valid JSON:

EXAMPLE:
I want a small pizza with cheese, tomato sauce, and pepperoni.
JSON Response:
{
  "size": "small",
  "type": "normal",
  "ingredients": ["cheese", "tomato sauce", "pepperoni"]
}

EXAMPLE:
Can I get a large pizza with tomato sauce, basil and mozzarella
{
  "size": "large",
  "type": "normal",
  "ingredients": ["tomato sauce", "basil", "mozzarella"]
}

Now, I would like a large pizza, with the first half cheese and mozzarella. And the other tomato sauce, ham and pineapple.
JSON Response:
```

**Output:**

```json
{
  "size": "large",
  "type": "half-half",
  "ingredients": [
    ["cheese", "mozzarella"],
    ["tomato sauce", "ham", "pineapple"]
  ]
}
```

### System, Contextual and Role Prompting

These are techniques used to guide how LLMs generate text, focusing on different aspects:

#### System Prompting

Sets the overall context and purpose for the language model. It defines the "big picture" of what the model should be doing.

**Example with JSON Output:**

```
Classify movie reviews as positive, neutral or negative. Return valid JSON:

Review: "Her" is a disturbing study revealing the direction humanity is headed if AI is allowed to keep evolving, unchecked. It's so disturbing I couldn't watch it.

Schema:
MOVIE:
{
  "sentiment": String "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "name": String
}
MOVIE REVIEWS:
{
  "movie_reviews": [MOVIE]
}

JSON Response:
```

**Benefits of returning JSON:**

- Returns always in the same style
- Focus on the data you want to receive
- Less chance for hallucinations
- Relationship aware
- Data types included
- Sortable

#### Role Prompting

Assigns a specific character or identity for the language model to adopt.

**Example: Travel Guide**

```
I want you to act as a travel guide. I will write to you about my location and you will suggest 3 places to visit near me. In some cases, I will also give you the type of places I will visit.

My suggestion: "I am in Amsterdam and I want to visit only museums."

Travel Suggestions:
```

**Effective Styles:**

- Confrontational, Descriptive, Direct, Formal, Humorous
- Influential, Informal, Inspirational, Persuasive

#### Contextual Prompting

Provides specific details or background information relevant to the current conversation or task.

**Example:**

```
Context: You are writing for a blog about retro 80's arcade video games.

Suggest 3 topics to write an article about with a few lines of description of what this article should contain.
```

### Step-back Prompting

A technique for improving performance by prompting the LLM to first consider a **general question** related to the specific task, and then feeding that answer into a subsequent prompt for the specific task.

This "step back" allows the LLM to:

- Activate relevant background knowledge
- Apply reasoning processes before attempting the specific problem
- Generate more accurate and insightful responses

**Two-Step Process:**

1. **Step-back prompt:**

```
Based on popular first-person shooter action games, what are 5 fictional key settings that contribute to a challenging and engaging level storyline?
```

2. **Main prompt with context:**

```
Context: 5 engaging themes for a first person shooter video game:
1. Abandoned Military Base
2. Cyberpunk City
3. Alien Spaceship
4. Zombie-Infested Town
5. Underwater Research Facility

Take one of the themes and write a one paragraph storyline for a new level of a first-person shooter video game that is challenging and engaging.
```

### Chain of Thought (CoT)

A technique for improving reasoning capabilities by generating **intermediate reasoning steps**.

**Advantages:**

- Low-effort while being very effective
- Works well with off-the-shelf LLMs (no finetuning needed)
- Provides interpretability - you can see the reasoning steps
- Improves robustness across different LLM versions

**Disadvantages:**

- More output tokens = higher cost and longer response time

**Example: Mathematical Problem**

❌ **Without CoT:**

```
When I was 3 years old, my partner was 3 times my age. Now, I am 20 years old. How old is my partner?
```

Output: 63 years old (Wrong!)

✅ **With CoT:**

```
When I was 3 years old, my partner was 3 times my age. Now, I am 20 years old. How old is my partner? Let's think step by step.
```

Output:

1. When I was 3 years old, my age was 3 years.
2. My partner's age at that time was 3 × 3 = 9 years.
3. Now, I am 20 years old, which means my age has increased by 20 - 3 = 17 years.
4. My partner's age must have also increased by 17 years.
5. My partner's current age is 9 + 17 = **26 years**.

### Self-consistency

Combines **sampling and majority voting** to generate diverse reasoning paths and select the most consistent answer.

**Steps:**

1. Generate diverse reasoning paths by providing the same prompt multiple times with high temperature
2. Extract the answer from each generated response
3. Choose the **most common answer**

This gives a pseudo-probability likelihood of an answer being correct, but has high costs.

### Tree of Thoughts (ToT)

Generalizes chain of thought prompting by allowing LLMs to explore **multiple different reasoning paths simultaneously**, rather than following a single linear chain.

ToT is particularly well-suited for complex tasks that require exploration. It works by maintaining a tree of thoughts, where each thought represents a coherent language sequence that serves as an intermediate step toward solving a problem.

### ReAct (Reason & Act)

A paradigm for enabling LLMs to solve complex tasks using **natural language reasoning combined with external tools** (search, code interpreter, etc.), allowing the LLM to perform certain actions.

ReAct mimics how humans operate in the real world - we reason verbally and can take actions to gain information. It's a first step towards **agent modeling**.

**How it works:**

1. LLM reasons about the problem and generates a plan
2. Performs actions in the plan and observes results
3. Uses observations to update reasoning and generate new actions
4. Continues until reaching a solution

**Example with LangChain:**

```python
from langchain.agents import load_tools, initialize_agent, AgentType
from langchain.llms import VertexAI

prompt = "How many kids do the band members of Metallica have?"
llm = VertexAI(temperature=0.1)
tools = load_tools(["serpapi"], llm=llm)
agent = initialize_agent(tools, llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True)
agent.run(prompt)
```

**Execution Flow:**

```
> Entering new AgentExecutor chain...
Metallica has 4 members.
Action: Search
Action Input: How many kids does James Hetfield have?
Observation: three children
Thought: 1/4 Metallica band members have 3 children
...
Thought: 4/4 Metallica band members have 10 children
Final Answer: 10
```

### Automatic Prompt Engineering

A method where you **prompt a model to generate more prompts**. This alleviates the need for human input and can enhance model performance.

**Process:**

1. Write a prompt to generate output variants
2. Evaluate candidates using metrics (BLEU, ROUGE)
3. Select the highest-scoring instruction
4. Optionally tweak and re-evaluate

**Example:**

```
We have a band merchandise t-shirt webshop, and to train a chatbot we need various ways to order: "One Metallica t-shirt size S". Generate 10 variants, with the same semantics but keep the same meaning.
```

---

## Code Prompting

Gemini focuses primarily on text-based prompts, which also includes writing prompts for returning code.

### Prompts for Writing Code

**Example: Bash Script for Renaming Files**

```
Write a code snippet in Bash, which asks for a folder name. Then it takes the contents of the folder and renames all the files inside by prepending the name draft to the file name.
```

**Output:**

```bash
#!/bin/bash
# Ask for the folder name
echo "Enter the folder name: "
read folder_name

# Check if the folder exists
if [ ! -d "$folder_name" ]; then
  echo "Folder does not exist."
  exit 1
fi

# Get the list of files in the folder
files=( "$folder_name"/* )

# Rename each file by prepending "draft" to the file name
for file in "${files[@]}"; do
  new_file_name="draft_$(basename "$file")"
  mv "$file" "$new_file_name"
done

echo "Files renamed successfully."
```

### Prompts for Explaining Code

Gemini can explain code to help developers understand someone else's work.

**Example:**

```
Explain to me the below Bash code:
[paste code here]
```

### Prompts for Translating Code

LLMs can translate code from one language to another.

**Example:**

```
Translate the below Bash code to a Python snippet.
[paste Bash code here]
```

### Prompts for Debugging and Reviewing Code

**Example:**

```
The below Python code gives an error:
Traceback (most recent call last):
  File "rename_files.py", line 7, in <module>
    text = toUpperCase(prefix)
NameError: name 'toUpperCase' is not defined

Debug what's wrong and explain how I can improve the code.
[paste code here]
```

The model will:

1. Identify the bug (use `prefix.upper()` instead of `toUpperCase(prefix)`)
2. Suggest additional improvements
3. Provide the corrected code

---

## What About Multimodal Prompting?

Multimodal prompting refers to a technique where you use **multiple input formats** to guide a large language model, instead of just relying on text. This can include combinations of:

- Text
- Images
- Audio
- Code
- Other formats

This depends on the model's capabilities and the task at hand.

---

## Best Practices

### 1. Provide Examples

The most important best practice is to provide (one-shot/few-shot) examples within a prompt. This:

- Acts as a powerful teaching tool
- Showcases desired outputs
- Improves accuracy, style, and tone

### 2. Design with Simplicity

Prompts should be concise, clear, and easy to understand. Don't use complex language or provide unnecessary information.

**Before:**

```
I am visiting New York right now, and I'd like to hear more about great locations. I am with two 3 year old kids. Where should we go during our vacation?
```

**After:**

```
Act as a travel guide for tourists. Describe great places to visit in New York Manhattan with a 3 year old.
```

**Useful Action Verbs:**
Act, Analyze, Categorize, Classify, Compare, Contrast, Create, Define, Describe, Evaluate, Extract, Find, Generate, Identify, List, Measure, Organize, Parse, Pick, Predict, Provide, Rank, Recommend, Return, Retrieve, Rewrite, Select, Show, Sort, Summarize, Translate, Write

### 3. Be Specific About the Output

✅ **Do:**

```
Generate a 3 paragraph blog post about the top 5 video game consoles. The blog post should be informative and engaging, and it should be written in a conversational style.
```

❌ **Don't:**

```
Generate a blog post about video game consoles.
```

### 4. Use Instructions over Constraints

- **Instruction**: Explicit directions on desired format, style, or content (what to do)
- **Constraint**: Limitations or boundaries (what not to do)

Focusing on positive instructions is more effective than relying heavily on constraints.

✅ **Do:**

```
Generate a 1 paragraph blog post about the top 5 video game consoles. Only discuss the console, the company who made it, the year, and total sales.
```

❌ **Don't:**

```
Generate a 1 paragraph blog post about the top 5 video game consoles. Do not list video game names.
```

### 5. Control the Max Token Length

Either set a max token limit in the configuration or explicitly request a specific length:

```
Explain quantum physics in a tweet length message.
```

### 6. Use Variables in Prompts

```
VARIABLES
{city} = "Amsterdam"

PROMPT
You are a travel guide. Tell me a fact about the city: {city}
```

### 7. Experiment with Input Formats and Writing Styles

The same goal can be formulated as:

- **Question**: What was the Sega Dreamcast and why was it revolutionary?
- **Statement**: The Sega Dreamcast was a sixth-generation video game console...
- **Instruction**: Write a single paragraph that describes the Sega Dreamcast...

### 8. Mix Up Classes for Few-shot Classification

For classification tasks, mix up the possible response classes in few-shot examples to avoid overfitting to a specific order.

A good rule of thumb: start with **6 few-shot examples** and test accuracy from there.

### 9. Adapt to Model Updates

Stay on top of model architecture changes, added data, and capabilities. Adjust your prompts to leverage new features.

### 10. Experiment with Output Formats

For non-creative tasks (extracting, parsing, ranking, categorizing), try returning output in structured formats like **JSON** or **XML**.

**Benefits of JSON Output:**

- Consistent style
- Focused data
- Fewer hallucinations
- Relationship awareness
- Data types
- Sortable

### 11. JSON Repair

When JSON output is truncated due to token limits, use tools like the `json-repair` library (available on PyPI) to automatically fix incomplete or malformed JSON objects.

### 12. Working with Schemas

Provide a JSON Schema to define the expected structure and data types of your input/output. This:

- Gives the LLM a clear blueprint
- Helps focus attention on relevant information
- Reduces misinterpretation risk

### 13. CoT Best Practices

- Put the answer **after** the reasoning
- Set temperature to **0** for CoT prompting
- Extract the final answer separately from reasoning

### 14. Document Your Prompt Attempts

Create a documentation template:

| Field           | Value                             |
| --------------- | --------------------------------- |
| **Name**        | [name and version of your prompt] |
| **Goal**        | [One sentence explanation]        |
| **Model**       | [name and version]                |
| **Temperature** | [value between 0-1]               |
| **Token Limit** | [number]                          |
| **Top-K**       | [number]                          |
| **Top-P**       | [number]                          |
| **Prompt**      | [Full prompt text]                |
| **Output**      | [Output or multiple outputs]      |
| **Version**     | [Iteration number]                |
| **Result**      | OK / NOT OK / SOMETIMES OK        |
| **Feedback**    | [Notes]                           |

---

## Summary

This whitepaper covered various prompting techniques:

- **Zero prompting** - No examples provided
- **Few shot prompting** - Multiple examples provided
- **System prompting** - Overall context and purpose
- **Role prompting** - Assign a character or identity
- **Contextual prompting** - Task-specific background
- **Step-back prompting** - Consider general questions first
- **Chain of thought** - Intermediate reasoning steps
- **Self consistency** - Multiple reasoning paths with voting
- **Tree of thoughts** - Explore multiple paths simultaneously
- **ReAct** - Reasoning combined with external actions

We also explored:

- Automatic prompt engineering
- Code prompting techniques
- Multimodal prompting concepts
- Best practices for effective prompt engineering

**Key takeaway:** Prompt engineering is an **iterative process**. Craft and test different prompts, analyze and document the results, refine based on performance, and keep experimenting until you achieve the desired output.

---

## Endnotes

1. Google, 2023, Gemini by Google. Available at: https://gemini.google.com
2. Google, 2024, Gemini for Google Workspace Prompt Guide. Available at: https://inthecloud.withgoogle.com/gemini-for-google-workspace-prompt-guide/dl-cd.html
3. Google Cloud, 2023, Introduction to Prompting. Available at: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/introduction-prompt-design
4. Google Cloud, 2023, Text Model Request Body: Top-P & top-K sampling methods. Available at: https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text#request_body
5. Wei, J., et al., 2023, Zero Shot - Fine Tuned language models are zero shot learners. Available at: https://arxiv.org/pdf/2109.01652.pdf
6. Google Cloud, 2023, Google Cloud Model Garden. Available at: https://cloud.google.com/model-garden
7. Brown, T., et al., 2023, Few Shot - Language Models are Few Shot learners. Available at: https://arxiv.org/pdf/2005.14165.pdf
8. Zheng, L., et al., 2023, Take a Step Back: Evoking Reasoning via Abstraction in Large Language Models. Available at: https://openreview.net/pdf?id=3bq3jsvcQ1
9. Wei, J., et al., 2023, Chain of Thought Prompting. Available at: https://arxiv.org/pdf/2201.11903.pdf
10. Google Cloud Platform, 2023, Chain of Thought and React. Available at: https://github.com/GoogleCloudPlatform/generative-ai/blob/main/language/prompts/examples/chain_of_thought_react.ipynb
11. Wang, X., et al., 2023, Self Consistency Improves Chain of Thought reasoning in language models. Available at: https://arxiv.org/pdf/2203.11171.pdf
12. Yao, S., et al., 2023, Tree of Thoughts: Deliberate Problem Solving with Large Language Models. Available at: https://arxiv.org/pdf/2305.10601.pdf
13. Yao, S., et al., 2023, ReAct: Synergizing Reasoning and Acting in Language Models. Available at: https://arxiv.org/pdf/2210.03629.pdf
14. Google Cloud Platform, 2023, Advance Prompting: Chain of Thought and React. Available at: https://github.com/GoogleCloudPlatform/applied-ai-engineering-samples/blob/main/genai-on-vertex-ai/advanced_prompting_training/cot_react.ipynb
15. Zhou, C., et al., 2023, Automatic Prompt Engineering - Large Language Models are Human-Level Prompt Engineers. Available at: https://arxiv.org/pdf/2211.01910.pdf
