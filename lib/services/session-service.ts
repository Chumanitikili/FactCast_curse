import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Session {
  id: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    mode: "voice_only" | "text_only" | "hybrid";
    voiceResponse: boolean;
    autoSave: boolean;
  };
}

interface FactCheckSession {
  sessionId: string;
  claim: string;
  sources: any[];
  summary: string;
  confidence: number;
  timestamp: Date;
}

export class SessionService {
  private static instance: SessionService;
  private constructor() {}

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  async createSession(userId: string | null): Promise<string> {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        mode: "hybrid",
        voiceResponse: true,
        autoSave: true,
      },
    };

    await supabase
      .from("sessions")
      .insert([session]);

    return sessionId;
  }

  async updateSessionSettings(sessionId: string, settings: Partial<Session["settings"]>) {
    await supabase
      .from("sessions")
      .update({ settings })
      .eq("id", sessionId);
  }

  async saveFactCheck(sessionId: string, factCheck: Omit<FactCheckSession, "sessionId">) {
    const factCheckSession: FactCheckSession = {
      sessionId,
      ...factCheck,
      timestamp: new Date(),
    };

    await supabase
      .from("fact_check_sessions")
      .insert([factCheckSession]);
  }

  async getRecentFactChecks(sessionId: string): Promise<FactCheckSession[]> {
    const { data, error } = await supabase
      .from("fact_check_sessions")
      .select()
      .eq("sessionId", sessionId)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSessionSettings(sessionId: string): Promise<Session["settings"]> {
    const { data, error } = await supabase
      .from("sessions")
      .select("settings")
      .eq("id", sessionId)
      .single();

    if (error) throw error;
    return data.settings;
  }
}
