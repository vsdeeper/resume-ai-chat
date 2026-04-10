import { NextResponse } from "next/server";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export async function POST(req) {
  const { message } = await req.json();

  // 初始化组件
  const embeddings = new OpenAIEmbeddings({
    // 关键：指定国内平台的接口地址
    configuration: {
      baseURL: "https://api.siliconflow.cn/v1", // 例如硅基流动
    },
    modelName: "Qwen/Qwen3-Embedding-8B", // 这里填国内平台支持的具体模型名称
  });
  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: "my-knowledge-base",
    url: "http://localhost:8000",
  });

  // 检索相关文档 (Retriever)
  // similaritySearch 会找到与问题最相关的文本块
  const relevantDocs = await vectorStore.similaritySearch(message, 10);
  const contextText = relevantDocs
    .map((doc) => doc.pageContent)
    .join("\n---\n");

  // 定义提示词模板
  // 告诉 LLM 只能根据提供的上下文回答
  const prompt = PromptTemplate.fromTemplate(`
    你是一个智能助手。请仅根据以下参考资料回答用户的问题。
    如果资料中没有答案，请直接说“我在知识库中没找到相关信息”。

    参考资料:
    {context}

    用户问题: {question}
    回答:
  `);

  // 初始化大模型
  const model = new ChatOpenAI({
    // 替换为你的硅基流动 API Key，直接从.env文件中拾取
    openAIApiKey: process.env.SILICONFLOW_API_KEY,

    // 指定你要用的模型名称 (例如: Qwen/Qwen2.5-72B-Instruct)
    modelName: "deepseek-ai/DeepSeek-V3.2",

    // 【关键】替换为硅基流动的兼容接口地址
    configuration: {
      baseURL: "https://api.siliconflow.cn/v1",
    },

    temperature: 0,
  });

  // 构建执行链 (Chain)
  const chain = RunnableSequence.from([
    {
      context: () => contextText, // 传入检索到的上下文
      question: () => message, // 传入用户问题
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  // 生成回答
  const response = await chain.invoke({});

  return NextResponse.json({ answer: response });
}
