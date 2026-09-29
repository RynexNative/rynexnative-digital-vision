// Starter alerts shown when the database is unreachable or not yet migrated.
// Keep in sync with the seed data in
// supabase/migrations/20260929120000_security_alerts_and_estimates.sql
import type { SecurityAlert } from "./types"

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

export const fallbackAlerts: SecurityAlert[] = [
  {
    id: "fallback-1",
    slug: "ujumbe-wa-tuma-kwa-namba-hii",
    title: "Ujumbe wa \"Ile pesa tuma kwa namba hii\"",
    summary: "Matapeli wanatuma SMS inayoonekana kama imetoka kwa mtu unayemfahamu, wakikuomba utume pesa kwenye namba nyingine. Usitume kabla ya kuthibitisha.",
    description: "Huu ni mmoja wa utapeli unaoenea zaidi Tanzania. Unapokea SMS ya kawaida (sio ya mtandao wa simu) inayosema kitu kama \"Ile pesa usitume kwenye namba yangu, tuma kwa namba hii 07XX...\" au \"Nimekosea kukutumia pesa, naomba unirudishie\".\n\nMatapeli hutuma ujumbe huu kwa maelfu ya watu kwa matumaini kwamba baadhi yao kweli wanasubiri kutuma au kupokea pesa. Mara nyingi hutumia majina ya kawaida kama \"Mama\", \"Boss\" au \"Kaka\" ili uamini.",
    category: "Mobile Money",
    severity: "high",
    signs: [
      "Ujumbe umetoka kwenye namba usiyoifahamu au isiyohifadhiwa kwenye simu yako",
      "Unaambiwa utume pesa kwenye namba tofauti na ile uliyoizoea",
      "Ujumbe una haraka: \"tuma sasa hivi\", \"niko hospitali\", \"nimekwama\"",
      "Ujumbe wa \"umetumiwa pesa kimakosa\" haujatoka kwa M-Pesa, Mixx by Yas au Airtel Money wenyewe",
    ],
    prevention: [
      "Kabla ya kutuma pesa, mpigie mhusika simu kwenye namba unayoifahamu na uthibitishe",
      "Angalia salio lako moja kwa moja kwenye menyu ya mtandao wako (mf. *150*00# kwa M-Pesa) kabla ya \"kurudisha\" pesa",
      "Ujumbe halali wa kupokea pesa hutoka kwa jina la mtandao (mf. M-PESA), sio namba ya kawaida",
      "Wafundishe wazazi na wazee wa familia kuhusu utapeli huu",
    ],
    if_affected: [
      "Piga simu huduma kwa wateja wa mtandao wako mara moja na uombe muamala uzuiwe",
      "Hifadhi ujumbe na namba ya tapeli; usifute chochote",
      "Toa taarifa kituo cha polisi kilicho karibu (Kitengo cha Uhalifu wa Mtandao) upate RB",
      "Ripoti namba hiyo kwa TCRA kupitia kwa kutuma SMS kwenda namba 15040",
    ],
    is_published: true,
    published_at: daysAgo(2),
  },
  {
    id: "fallback-2",
    slug: "kazi-feki-za-mtandaoni",
    title: "Kazi feki za mtandaoni kupitia WhatsApp na Telegram",
    summary: "Unaalikwa kwenye group ukiahidiwa malipo kwa ku-like video au kuandika review, kisha unaombwa \"kuweka mtaji\" ili upate zaidi. Ni utapeli.",
    description: "Utapeli huu huanza na ujumbe wa WhatsApp kutoka namba ya nje au ya ndani: \"Habari, tunatafuta watu wa kufanya kazi za muda kutoka nyumbani. Unaweza kupata Tsh 50,000 hadi 300,000 kwa siku.\"\n\nMwanzoni unalipwa kiasi kidogo kwa kazi rahisi (ku-like video za YouTube au TikTok) ili uamini. Baadaye unaambiwa ujiunge na \"kazi za VIP\" au \"task za malipo\" ambazo zinahitaji uweke pesa kwanza. Ukishaweka, pesa haitoki tena na unaombwa uongeze zaidi ili \"kufungua\" akaunti yako.",
    category: "WhatsApp & Telegram",
    severity: "high",
    signs: [
      "Umetumiwa ofa ya kazi bila kuomba, na kutoka namba usiyoifahamu",
      "Malipo ni makubwa sana kwa kazi ndogo sana",
      "Unaombwa kulipa ada, \"mtaji\" au \"deposit\" ili upate kazi au utoe mapato yako",
      "Kuna \"mentor\" au \"receptionist\" anayekushinikiza kwenye Telegram",
    ],
    prevention: [
      "Kampuni halali haikuombi ulipe ili upate kazi",
      "Usiweke pesa kwenye jukwaa lolote ili \"kufungua\" mapato yako",
      "Tafuta jina la kampuni mtandaoni pamoja na neno \"scam\" kabla ya kujiunga",
      "Block na ripoti namba hiyo kwenye WhatsApp",
    ],
    if_affected: [
      "Acha kutuma pesa zaidi mara moja, hata ukiahidiwa kurudishiwa",
      "Piga huduma kwa wateja wa mtandao uliotumia kutuma pesa na toa taarifa",
      "Hifadhi screenshots za mazungumzo, namba na miamala yote",
      "Toa taarifa polisi (Kitengo cha Uhalifu wa Mtandao)",
    ],
    is_published: true,
    published_at: daysAgo(6),
  },
  {
    id: "fallback-3",
    slug: "link-za-verify-akaunti",
    title: "Link za \"Verify akaunti yako\" kwenye Instagram na Facebook",
    summary: "Unapokea ujumbe kwamba akaunti yako itafungwa au utapewa \"blue tick\" ukibonyeza link. Link hiyo inaiba password yako na kuchukua akaunti.",
    description: "Matapeli hutuma DM au email zinazoonekana kama zimetoka Meta, Instagram au Facebook: \"Akaunti yako imekiuka copyright na itafungwa ndani ya saa 24\" au \"Umechaguliwa kupata verification badge\".\n\nLink inakupeleka kwenye ukurasa unaofanana kabisa na wa Instagram au Facebook. Ukiweka username, password au code ya SMS, matapeli wanaingia kwenye akaunti yako, wanabadilisha password na kuanza kuwatapeli marafiki zako kwa jina lako.",
    category: "Mitandao ya Kijamii",
    severity: "medium",
    signs: [
      "Ujumbe unakutishia kwamba akaunti itafungwa ndani ya muda mfupi",
      "Link haiishii na instagram.com au facebook.com halisi (mf. instagram-support-help.com)",
      "Unaombwa code ya SMS au ya \"2FA\" uliyotumiwa",
      "Ujumbe umetoka kwenye akaunti isiyo na verification au iliyofunguliwa hivi karibuni",
    ],
    prevention: [
      "Washa Two-Factor Authentication (2FA) kwa kutumia app kama Google Authenticator",
      "Instagram na Facebook hawatumi ujumbe wa aina hii kupitia DM",
      "Usimpe mtu yeyote code uliyotumiwa kwa SMS, hata akijitambulisha kama mfanyakazi wa Meta",
      "Angalia ujumbe rasmi ndani ya Settings > Security > Emails from Instagram",
    ],
    if_affected: [
      "Badilisha password mara moja kama bado unaweza kuingia, na utoke kwenye vifaa vyote",
      "Kama umefungiwa nje, tumia instagram.com/hacked au facebook.com/hacked",
      "Wajulishe marafiki zako kupitia njia nyingine wasitume pesa kwa jina lako",
      "Wasiliana nasi tukusaidie kurejesha akaunti na kuiimarisha",
    ],
    is_published: true,
    published_at: daysAgo(10),
  },
  {
    id: "fallback-4",
    slug: "zawadi-feki-za-bando",
    title: "Link za \"Umeshinda bando la bure\" zinazosambaa WhatsApp",
    summary: "Ujumbe unaosema kampuni ya simu inatoa GB za bure au zawadi ya maadhimisho, ukiomba ushare kwa watu 10. Link hizo zinakusanya taarifa zako.",
    description: "Ujumbe huu husambazwa na marafiki na familia bila wao kujua kuwa ni utapeli: \"Vodacom/Yas/Airtel inasherehekea miaka 25, pata GB 50 bure! Bonyeza hapa.\"\n\nLink inakuuliza maswali machache, kisha inakutaka ushare ujumbe kwa watu 10 au kwenye group 5 ili \"upokee zawadi\". Zawadi haifiki kamwe, lakini link hiyo inakusanya namba yako, inaweza kukujiandikisha kwenye huduma za kulipia, au kukupeleka kwenye matangazo yenye virusi.",
    category: "WhatsApp & Telegram",
    severity: "low",
    signs: [
      "Unaambiwa ushare kwa watu wengi ili upate zawadi",
      "Link haiko kwenye tovuti rasmi ya kampuni ya simu",
      "Ujumbe una makosa mengi ya lugha au emoji nyingi",
      "Ofa inaonekana nzuri kupita kiasi",
    ],
    prevention: [
      "Hakiki ofa kwenye tovuti au kurasa rasmi za kampuni husika",
      "Usishare ujumbe wa zawadi usiothibitishwa, hata kama umetumwa na rafiki",
      "Usiweke namba ya simu, PIN au taarifa binafsi kwenye link hizo",
    ],
    if_affected: [
      "Kama uliweka namba, angalia kama umejiandikisha kwenye huduma za kulipia na ujiondoe",
      "Kama ulipakua app au faili, liondoe na ufanye scan ya simu",
      "Waambie uliowatumia kwamba ujumbe ule ni utapeli",
    ],
    is_published: true,
    published_at: daysAgo(14),
  },
]
