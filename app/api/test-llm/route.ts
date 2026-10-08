import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
    });

    const result = await model.generateContent(
      "Explain in one sentence what an AI agent is."
    );

    const text = result.response.text();

    return Response.json({
      success: true,
      text,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to call LLM",
      },
      { status: 500 }
    );
  }
}