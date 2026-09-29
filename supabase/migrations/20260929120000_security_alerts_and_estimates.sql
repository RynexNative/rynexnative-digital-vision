-- Security alerts ("Tahadhari"), project estimates and admin access.
-- Run this once in the Supabase SQL editor (or with `supabase db push`).

-- ---------------------------------------------------------------------------
-- Admins: only users listed here can manage alerts and read estimates.
-- After creating your account (Authentication > Users > Add user), grant it:
--   insert into public.admin_users (user_id) values ('<your-user-id>');
-- ---------------------------------------------------------------------------
CREATE TABLE public.admin_users (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- A signed-in user may check whether they themselves are an admin
CREATE POLICY "Users can see their own admin row"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Security alerts
-- ---------------------------------------------------------------------------
CREATE TABLE public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 500),
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  signs TEXT[] NOT NULL DEFAULT '{}',
  prevention TEXT[] NOT NULL DEFAULT '{}',
  if_affected TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_alerts_published
ON public.security_alerts (is_published, published_at DESC);

CREATE TRIGGER security_alerts_updated_at
BEFORE UPDATE ON public.security_alerts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published alerts"
ON public.security_alerts
FOR SELECT
USING (is_published OR public.is_admin());

CREATE POLICY "Admins can create alerts"
ON public.security_alerts
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update alerts"
ON public.security_alerts
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete alerts"
ON public.security_alerts
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Project estimates submitted from the estimator
-- ---------------------------------------------------------------------------
CREATE TABLE public.project_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 20),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 254),
  company TEXT CHECK (company IS NULL OR char_length(company) <= 100),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  project_type TEXT NOT NULL,
  selections JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimate_min BIGINT NOT NULL CHECK (estimate_min >= 0),
  estimate_max BIGINT NOT NULL CHECK (estimate_max >= estimate_min),
  weeks_min INTEGER NOT NULL CHECK (weeks_min >= 0),
  weeks_max INTEGER NOT NULL CHECK (weeks_max >= weeks_min),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_estimates_created_at
ON public.project_estimates (created_at DESC);

ALTER TABLE public.project_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an estimate request"
ON public.project_estimates
FOR INSERT
WITH CHECK (status = 'new');

CREATE POLICY "Admins can read estimate requests"
ON public.project_estimates
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update estimate requests"
ON public.project_estimates
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Starter alerts (same content as src/features/alerts/fallback-alerts.ts)
-- ---------------------------------------------------------------------------
INSERT INTO public.security_alerts
  (slug, title, summary, description, category, severity, signs, prevention, if_affected, is_published, published_at)
VALUES
(
  'ujumbe-wa-tuma-kwa-namba-hii',
  'Ujumbe wa "Ile pesa tuma kwa namba hii"',
  'Matapeli wanatuma SMS inayoonekana kama imetoka kwa mtu unayemfahamu, wakikuomba utume pesa kwenye namba nyingine. Usitume kabla ya kuthibitisha.',
  E'Huu ni mmoja wa utapeli unaoenea zaidi Tanzania. Unapokea SMS ya kawaida (sio ya mtandao wa simu) inayosema kitu kama "Ile pesa usitume kwenye namba yangu, tuma kwa namba hii 07XX..." au "Nimekosea kukutumia pesa, naomba unirudishie".\n\nMatapeli hutuma ujumbe huu kwa maelfu ya watu kwa matumaini kwamba baadhi yao kweli wanasubiri kutuma au kupokea pesa. Mara nyingi hutumia majina ya kawaida kama "Mama", "Boss" au "Kaka" ili uamini.',
  'Mobile Money',
  'high',
  ARRAY[
    'Ujumbe umetoka kwenye namba usiyoifahamu au isiyohifadhiwa kwenye simu yako',
    'Unaambiwa utume pesa kwenye namba tofauti na ile uliyoizoea',
    'Ujumbe una haraka: "tuma sasa hivi", "niko hospitali", "nimekwama"',
    'Ujumbe wa "umetumiwa pesa kimakosa" haujatoka kwa M-Pesa, Mixx by Yas au Airtel Money wenyewe'
  ],
  ARRAY[
    'Kabla ya kutuma pesa, mpigie mhusika simu kwenye namba unayoifahamu na uthibitishe',
    'Angalia salio lako moja kwa moja kwenye menyu ya mtandao wako (mf. *150*00# kwa M-Pesa) kabla ya "kurudisha" pesa',
    'Ujumbe halali wa kupokea pesa hutoka kwa jina la mtandao (mf. M-PESA), sio namba ya kawaida',
    'Wafundishe wazazi na wazee wa familia kuhusu utapeli huu'
  ],
  ARRAY[
    'Piga simu huduma kwa wateja wa mtandao wako mara moja na uombe muamala uzuiwe',
    'Hifadhi ujumbe na namba ya tapeli; usifute chochote',
    'Toa taarifa kituo cha polisi kilicho karibu (Kitengo cha Uhalifu wa Mtandao) upate RB',
    'Ripoti namba hiyo kwa TCRA kupitia kwa kutuma SMS kwenda namba 15040'
  ],
  true,
  now() - interval '2 days'
),
(
  'kazi-feki-za-mtandaoni',
  'Kazi feki za mtandaoni kupitia WhatsApp na Telegram',
  'Unaalikwa kwenye group ukiahidiwa malipo kwa ku-like video au kuandika review, kisha unaombwa "kuweka mtaji" ili upate zaidi. Ni utapeli.',
  E'Utapeli huu huanza na ujumbe wa WhatsApp kutoka namba ya nje au ya ndani: "Habari, tunatafuta watu wa kufanya kazi za muda kutoka nyumbani. Unaweza kupata Tsh 50,000 hadi 300,000 kwa siku."\n\nMwanzoni unalipwa kiasi kidogo kwa kazi rahisi (ku-like video za YouTube au TikTok) ili uamini. Baadaye unaambiwa ujiunge na "kazi za VIP" au "task za malipo" ambazo zinahitaji uweke pesa kwanza. Ukishaweka, pesa haitoki tena na unaombwa uongeze zaidi ili "kufungua" akaunti yako.',
  'WhatsApp & Telegram',
  'high',
  ARRAY[
    'Umetumiwa ofa ya kazi bila kuomba, na kutoka namba usiyoifahamu',
    'Malipo ni makubwa sana kwa kazi ndogo sana',
    'Unaombwa kulipa ada, "mtaji" au "deposit" ili upate kazi au utoe mapato yako',
    'Kuna "mentor" au "receptionist" anayekushinikiza kwenye Telegram'
  ],
  ARRAY[
    'Kampuni halali haikuombi ulipe ili upate kazi',
    'Usiweke pesa kwenye jukwaa lolote ili "kufungua" mapato yako',
    'Tafuta jina la kampuni mtandaoni pamoja na neno "scam" kabla ya kujiunga',
    'Block na ripoti namba hiyo kwenye WhatsApp'
  ],
  ARRAY[
    'Acha kutuma pesa zaidi mara moja, hata ukiahidiwa kurudishiwa',
    'Piga huduma kwa wateja wa mtandao uliotumia kutuma pesa na toa taarifa',
    'Hifadhi screenshots za mazungumzo, namba na miamala yote',
    'Toa taarifa polisi (Kitengo cha Uhalifu wa Mtandao)'
  ],
  true,
  now() - interval '6 days'
),
(
  'link-za-verify-akaunti',
  'Link za "Verify akaunti yako" kwenye Instagram na Facebook',
  'Unapokea ujumbe kwamba akaunti yako itafungwa au utapewa "blue tick" ukibonyeza link. Link hiyo inaiba password yako na kuchukua akaunti.',
  E'Matapeli hutuma DM au email zinazoonekana kama zimetoka Meta, Instagram au Facebook: "Akaunti yako imekiuka copyright na itafungwa ndani ya saa 24" au "Umechaguliwa kupata verification badge".\n\nLink inakupeleka kwenye ukurasa unaofanana kabisa na wa Instagram au Facebook. Ukiweka username, password au code ya SMS, matapeli wanaingia kwenye akaunti yako, wanabadilisha password na kuanza kuwatapeli marafiki zako kwa jina lako.',
  'Mitandao ya Kijamii',
  'medium',
  ARRAY[
    'Ujumbe unakutishia kwamba akaunti itafungwa ndani ya muda mfupi',
    'Link haiishii na instagram.com au facebook.com halisi (mf. instagram-support-help.com)',
    'Unaombwa code ya SMS au ya "2FA" uliyotumiwa',
    'Ujumbe umetoka kwenye akaunti isiyo na verification au iliyofunguliwa hivi karibuni'
  ],
  ARRAY[
    'Washa Two-Factor Authentication (2FA) kwa kutumia app kama Google Authenticator',
    'Instagram na Facebook hawatumi ujumbe wa aina hii kupitia DM',
    'Usimpe mtu yeyote code uliyotumiwa kwa SMS, hata akijitambulisha kama mfanyakazi wa Meta',
    'Angalia ujumbe rasmi ndani ya Settings > Security > Emails from Instagram'
  ],
  ARRAY[
    'Badilisha password mara moja kama bado unaweza kuingia, na utoke kwenye vifaa vyote',
    'Kama umefungiwa nje, tumia instagram.com/hacked au facebook.com/hacked',
    'Wajulishe marafiki zako kupitia njia nyingine wasitume pesa kwa jina lako',
    'Wasiliana nasi tukusaidie kurejesha akaunti na kuiimarisha'
  ],
  true,
  now() - interval '10 days'
),
(
  'zawadi-feki-za-bando',
  'Link za "Umeshinda bando la bure" zinazosambaa WhatsApp',
  'Ujumbe unaosema kampuni ya simu inatoa GB za bure au zawadi ya maadhimisho, ukiomba ushare kwa watu 10. Link hizo zinakusanya taarifa zako.',
  E'Ujumbe huu husambazwa na marafiki na familia bila wao kujua kuwa ni utapeli: "Vodacom/Yas/Airtel inasherehekea miaka 25, pata GB 50 bure! Bonyeza hapa."\n\nLink inakuuliza maswali machache, kisha inakutaka ushare ujumbe kwa watu 10 au kwenye group 5 ili "upokee zawadi". Zawadi haifiki kamwe, lakini link hiyo inakusanya namba yako, inaweza kukujiandikisha kwenye huduma za kulipia, au kukupeleka kwenye matangazo yenye virusi.',
  'WhatsApp & Telegram',
  'low',
  ARRAY[
    'Unaambiwa ushare kwa watu wengi ili upate zawadi',
    'Link haiko kwenye tovuti rasmi ya kampuni ya simu',
    'Ujumbe una makosa mengi ya lugha au emoji nyingi',
    'Ofa inaonekana nzuri kupita kiasi'
  ],
  ARRAY[
    'Hakiki ofa kwenye tovuti au kurasa rasmi za kampuni husika',
    'Usishare ujumbe wa zawadi usiothibitishwa, hata kama umetumwa na rafiki',
    'Usiweke namba ya simu, PIN au taarifa binafsi kwenye link hizo'
  ],
  ARRAY[
    'Kama uliweka namba, angalia kama umejiandikisha kwenye huduma za kulipia na ujiondoe',
    'Kama ulipakua app au faili, liondoe na ufanye scan ya simu',
    'Waambie uliowatumia kwamba ujumbe ule ni utapeli'
  ],
  true,
  now() - interval '14 days'
)
ON CONFLICT (slug) DO NOTHING;
