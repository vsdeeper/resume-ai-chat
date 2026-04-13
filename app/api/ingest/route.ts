import { NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    console.log("🚀 开始构建知识库...");

    // 加载文档
    // 注意：这里使用 path.join 确保路径正确指向 public 文件夹下的文件
    const filePath = path.join(process.cwd(), "public", "data", "profile.pdf");

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "文件不存在，请确保 public/data/profile.pdf 存在" },
        { status: 400 },
      );
    }

    const loader = new PDFLoader(filePath);
    const rawDocs = await loader.load();
    console.log(`📄 加载完成，原始文档页数: ${rawDocs.length}`);

    // 文本分割 (核心步骤)
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // 每块 1000 字符
      chunkOverlap: 200, // 重叠 200 字符，保持语义连贯
    });

    // splitDocuments 会保留 metadata (如来源文件路径)
    const splitDocs = await textSplitter.splitDocuments(rawDocs);
    console.log(`🔪 分割完成，文本块数量: ${splitDocs.length}`);

    // 初始化向量化模型
    // 使用 OpenAI 的 embedding 模型将文本转化为向量
    // const embeddings = new OpenAIEmbeddings({
    //   modelName: "text-embedding-3-small", // 推荐使用这个模型，便宜且效果好
    // });
    const cleanDocs = splitDocs.map((doc) => {
      // 方案 A：强制将 pdf 字段转为字符串（推荐，保留信息）
      // if (doc.metadata.pdf) {
      //   doc.metadata.pdf = String(doc.metadata.pdf);
      // }

      // 方案 B：如果不需要 pdf 字段，直接删除（最稳妥）
      delete doc.metadata.pdf;

      return doc;
    });
    // 只需要修改这两个参数，就能接入国内模型
    const embeddings = new OpenAIEmbeddings({
      // 关键：指定国内平台的接口地址
      configuration: {
        baseURL: "https://api.siliconflow.cn/v1", // 例如硅基流动
        // baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", // 例如阿里云百炼
      },
      modelName: "Qwen/Qwen3-Embedding-8B", // 这里填国内平台支持的具体模型名称
    });

    // 存入 ChromaDB
    // fromDocuments 会自动遍历数组，转化向量并插入数据库
    await Chroma.fromDocuments(cleanDocs, embeddings, {
      collectionName: "my-knowledge-base", // 集合名称，相当于数据库表名
      url: "http://localhost:8000", // 你的 ChromaDB 地址
    });

    console.log("✅ 知识库构建成功！");
    return NextResponse.json({
      message: "知识库构建成功",
      count: splitDocs.length,
      data: splitDocs,
    });
  } catch (error: any) {
    console.error("❌ 构建失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
