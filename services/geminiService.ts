import { GoogleGenAI } from "@google/genai";
import { Student, Block, Gradient, Comment, EvaluationState, Trimester, Subject, UserProfile } from "../types";

// NOTE: In a real production app, this call would likely happen on a backend to protect the API Key.
// For this demo, we assume the environment variable is injected safely or we use a client-side key for personal use.

export const generatePrompt = (
  student: Student,
  subject: Subject,
  trimester: Trimester,
  blocks: Block[],
  gradients: Gradient[],
  comments: Comment[],
  evaluations: EvaluationState,
  teacherGender: 'mestre' | 'mestra' // Added teacherGender
): string => {
  
  let prompt =
    `Ets un${teacherGender === 'mestre' ? '' : 'a'} ${teacherGender} de primaria que esta avaluant als seus alumnes. Redacta en català un informe d’avaluació per a l’alumne ${student.name}, que és ${student.gender}, de ${student.course} de Primària.\n` +
    `Trimestre: ${trimester}\nÀrea: ${subject.name}\n\nBlocs avaluats:\n\n`;

  blocks.forEach((block) => {
    const ev = evaluations[block.id];
    if (!ev || !ev.gradientId) return; // Skip unevaluated blocks

    const gradient = gradients.find(g => g.id === ev.gradientId);
    const gradText = gradient ? gradient.text : 'Sense avaluació';

    const selectedComments = ev.commentIds
      .map(cid => comments.find(c => c.id === cid))
      .filter((c): c is Comment => !!c)
      .map(c => c.text);

    prompt +=
      `- Bloc: ${block.name}\n` +
      `  Gradient: ${gradText}\n` +
      `  Comentaris: ${selectedComments.join("; ")}\n\n`;
  });

  prompt +=
    `Condicions:\n` +
    `- L’informe no pot superar les 300 paraules.\n` +
    `- Fes un sol redactat: sense fer subapartats.\n` +
    `- Fes que les frases tinguin coherencia de genere ( ${student.gender} ) i persona.\n` +
    `- Ha de ser un text coherent, amb to pedagògic i positiu.\n` +
    `- Fes servir un llenguatge humà.\n` +
    `- Ha d’estar íntegrament escrit en català.\n`;

  return prompt;
};

export const fetchReportFromGemini = async (prompt: string, userApiKey?: string): Promise<string> => {
  try {
    const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY; // Utilitza la clau de l'usuari si existeix, sinó la general
    console.log("DEBUG: VITE_GEMINI_API_KEY:", apiKey ? "Loaded (length: " + apiKey.length + ")" : "NOT LOADED"); // Added debug log
    if (!apiKey) throw new Error("API_KEY not found in environment variables");

    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    
    console.log("DEBUG: Sending prompt to Gemini API..."); // Nou log
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    console.log("DEBUG: Received response from Gemini API."); // Nou log

    return response.text || "No s'ha generat cap text.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error generant l'informe: ${error.message || 'Error desconegut'}`;
  }
};