-- ============================================================
-- 006_monthly_review.sql
-- 월간 회고 지원을 위한 summaries 테이블 수정
-- ============================================================
--
-- 변경 사항:
--   summaries.period CHECK 제약조건에 'monthly' 추가
--   기존: ('daily', 'weekly')
--   변경: ('daily', 'weekly', 'monthly')
--
-- 기존 데이터 영향: 없음 (새 값만 허용 추가)
-- 롤백: ALTER TABLE summaries DROP CONSTRAINT summaries_period_check;
--        ALTER TABLE summaries ADD CONSTRAINT summaries_period_check
--          CHECK (period IN ('daily', 'weekly'));
-- ============================================================

-- 1. 기존 CHECK 제약조건 제거
ALTER TABLE summaries DROP CONSTRAINT IF EXISTS summaries_period_check;

-- 2. monthly 포함하여 재생성
ALTER TABLE summaries ADD CONSTRAINT summaries_period_check
  CHECK (period IN ('daily', 'weekly', 'monthly'));

-- 확인: 제약조건 적용 검증
DO $$
BEGIN
  RAISE NOTICE '✅ summaries_period_check updated: daily, weekly, monthly';
END $$;
