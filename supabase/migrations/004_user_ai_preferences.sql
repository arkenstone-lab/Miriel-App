-- 004: AI Personalization preferences table
-- Run in Supabase Dashboard SQL Editor

CREATE TABLE public.user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- AI에 전달할 컨텍스트
  summary_style TEXT DEFAULT '',          -- 요약 스타일 ("간결하게", "구체적으로" 등)
  focus_areas TEXT[] DEFAULT '{}',        -- 집중 영역 ("프로젝트관리", "자기개발" 등)
  custom_instructions TEXT DEFAULT '',    -- 사용자 커스텀 지시 (최대 500자)

  -- 페르소나 연동 토글
  share_persona BOOLEAN DEFAULT true,     -- 닉네임/직업/관심사를 AI에 전달할지

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ai preferences"
  ON public.user_ai_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_user_ai_preferences_updated_at
  BEFORE UPDATE ON public.user_ai_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
