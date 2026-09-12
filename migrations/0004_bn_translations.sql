-- Bangla translations for the existing blog posts.
--
-- Hand-written, not machine-translated, so this costs nothing to apply and
-- needs no ANTHROPIC_API_KEY. src/lib/translate.ts reads a stored translation
-- before it ever considers calling an API, so once these rows exist the
-- language button works on every one of these posts at zero cost.
--
-- Apply once with:
--   npx wrangler d1 execute taqwa-blog --remote --file=./migrations/0004_bn_translations.sql
--
-- Safe to re-run: each statement upserts on (post_id, language), and posts are
-- matched by slug, so a post that has been deleted is simply skipped.
-- Edit any of these afterwards in the admin panel - it writes to the same rows.


INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'এলপিজি নাকি সিএনজি: আপনার গাড়ির জন্য কোন কনভার্শন সঠিক?', 'দুটো জ্বালানিই আপনার চলার খরচ কমাতে পারে, তবে একেকটি একেক ধরনের গাড়ি ও চালানোর অভ্যাসের সঙ্গে মানানসই। কোন কনভার্শনটি আপনার জন্য উপযুক্ত, তা বেছে নেওয়ার উপায় জেনে নিন।', 'দুটো জ্বালানিই আপনার চলার খরচ কমাতে পারে, তবে একেকটি একেক ধরনের গাড়ি ও চালানোর অভ্যাসের সঙ্গে মানানসই। কোন কনভার্শনটি আপনার জন্য উপযুক্ত, তা বেছে নেওয়ার উপায় জেনে নিন।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'lpg-vs-cng-which-conversion-is-right-for-your-car'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', '৫টি লক্ষণ যা বলে দেয় এখনই গাড়ির ইঞ্জিন অয়েল বদলানো দরকার', 'ইঞ্জিন অয়েল বদলাতে দেরি হলে ইঞ্জিন নীরবে ক্ষয় হতে থাকে। বড় ক্ষতি হওয়ার আগেই এই পাঁচটি সতর্কসংকেত খেয়াল করুন।', 'ইঞ্জিন অয়েল বদলাতে দেরি হলে ইঞ্জিন নীরবে ক্ষয় হতে থাকে। বড় ক্ষতি হওয়ার আগেই এই পাঁচটি সতর্কসংকেত খেয়াল করুন।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = '5-signs-your-car-needs-an-oil-change-now'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'হাইব্রিড ব্যাটারির আয়ু বাড়াবেন যেভাবে', 'হাইব্রিড ব্যাটারি দীর্ঘস্থায়ী হওয়ার জন্যই তৈরি, তবে গাড়ি চালানো ও চার্জ দেওয়ার কয়েকটি অভ্যাস এর আয়ু আরও কয়েক বছর বাড়িয়ে দিতে পারে।', 'হাইব্রিড ব্যাটারি দীর্ঘস্থায়ী হওয়ার জন্যই তৈরি, তবে গাড়ি চালানো ও চার্জ দেওয়ার কয়েকটি অভ্যাস এর আয়ু আরও কয়েক বছর বাড়িয়ে দিতে পারে।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'how-to-extend-the-life-of-your-hybrid-battery'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'গরম আসার আগে নিয়মিত এসি সার্ভিস কেন জরুরি', 'এসি দুর্বল হয়ে পড়া বা শব্দ করা সাধারণত ভেতরের বড় কোনো সমস্যার ইঙ্গিত। সঠিক এসি সার্ভিসে কী কী দেখা হয় এবং সময়মতো করানো কেন জরুরি, জেনে নিন।', 'এসি দুর্বল হয়ে পড়া বা শব্দ করা সাধারণত ভেতরের বড় কোনো সমস্যার ইঙ্গিত। সঠিক এসি সার্ভিসে কী কী দেখা হয় এবং সময়মতো করানো কেন জরুরি, জেনে নিন।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'why-regular-ac-service-matters-before-summer'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'হাইব্রিড গাড়ি নিয়ে প্রচলিত ভুল ধারণাগুলো', '"ব্যাটারি তাড়াতাড়ি বদলাতেই হয়" থেকে শুরু করে "হাইব্রিড গাড়ি যানজট সামলাতে পারে না" — কোনটি সত্যি আর কোনটি নয়, আলাদা করে দেখিয়ে দিচ্ছি।', '"ব্যাটারি তাড়াতাড়ি বদলাতেই হয়" থেকে শুরু করে "হাইব্রিড গাড়ি যানজট সামলাতে পারে না" — কোনটি সত্যি আর কোনটি নয়, আলাদা করে দেখিয়ে দিচ্ছি।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'common-myths-about-hybrid-cars-debunked'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'রং নষ্ট না করে গাড়ি ধোয়ার সঠিক নিয়ম', 'ভুল সাবান, ভুল কাপড়, ভুল পদ্ধতি — ধোয়ার সময়ের ছোট ভুলগুলোই ধীরে ধীরে গাড়ির রং ম্লান করে দেয়। সঠিক উপায়টি জেনে নিন।', 'ভুল সাবান, ভুল কাপড়, ভুল পদ্ধতি — ধোয়ার সময়ের ছোট ভুলগুলোই ধীরে ধীরে গাড়ির রং ম্লান করে দেয়। সঠিক উপায়টি জেনে নিন।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'the-right-way-to-wash-your-car-without-damaging-the-paint'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'পুরনো গাড়িতে এলপিজি কনভার্শন কি নিরাপদ?', 'শুধু গাড়ির বয়সই মূল বিষয় নয় — ইঞ্জিনের অবস্থা আর কিটের মান বেশি গুরুত্বপূর্ণ। কনভার্শনের পরামর্শ দেওয়ার আগে আমরা যা যা পরীক্ষা করে দেখি।', 'শুধু গাড়ির বয়সই মূল বিষয় নয় — ইঞ্জিনের অবস্থা আর কিটের মান বেশি গুরুত্বপূর্ণ। কনভার্শনের পরামর্শ দেওয়ার আগে আমরা যা যা পরীক্ষা করে দেখি।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'is-lpg-conversion-safe-for-older-vehicles'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'অয়েল ও ফিল্টার বদল: কতদিন পরপর করা উচিত?', 'বেশি ঘন ঘন বদলানোই সবসময় ভালো নয়। তেলের ধরন, রাস্তার অবস্থা আর মাইলেজ অনুযায়ী সঠিক সময়সীমা কত, তা বুঝিয়ে বলছি।', 'বেশি ঘন ঘন বদলানোই সবসময় ভালো নয়। তেলের ধরন, রাস্তার অবস্থা আর মাইলেজ অনুযায়ী সঠিক সময়সীমা কত, তা বুঝিয়ে বলছি।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'oil-and-filter-change-how-often-is-too-often'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'তাকওয়া অটোমোবাইলের সার্ভিসের পেছনের দলটির সঙ্গে পরিচিত হোন', 'আমাদের ওয়ার্কশপের প্রতিটি কাজ যাঁরা মান বজায় রেখে সম্পন্ন করেন — সেই টেকনিশিয়ান, সার্ভিস অ্যাডভাইজার ও বিশেষজ্ঞদের সঙ্গে পরিচয় করিয়ে দিচ্ছি।', 'আমাদের ওয়ার্কশপের প্রতিটি কাজ যাঁরা মান বজায় রেখে সম্পন্ন করেন — সেই টেকনিশিয়ান, সার্ভিস অ্যাডভাইজার ও বিশেষজ্ঞদের সঙ্গে পরিচয় করিয়ে দিচ্ছি।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'meet-the-team-behind-taqwa-automobiles-service-quality'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'সিএনজি বনাম পেট্রোল: ঢাকার চালকদের জন্য প্রকৃত খরচের হিসাব', 'প্রতিদিনের সাধারণ যাতায়াতের হিসাব কষে আমরা দেখেছি, সিএনজি কনভার্শনের খরচ উঠে আসতে আসলে কত সময় লাগে।', 'প্রতিদিনের সাধারণ যাতায়াতের হিসাব কষে আমরা দেখেছি, সিএনজি কনভার্শনের খরচ উঠে আসতে আসলে কত সময় লাগে।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'cng-vs-petrol-a-real-cost-comparison-for-dhaka-drivers'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'ব্রেক রক্ষণাবেক্ষণের যে তালিকা প্রত্যেক চালকের জানা দরকার', 'ক্যাঁচক্যাঁচ শব্দ, একদিকে টেনে ধরা, প্যাডেল নরম লাগা — প্রতিটি লক্ষণ সাধারণত কী বোঝায় আর কখন দেখানো দরকার।', 'ক্যাঁচক্যাঁচ শব্দ, একদিকে টেনে ধরা, প্যাডেল নরম লাগা — প্রতিটি লক্ষণ সাধারণত কী বোঝায় আর কখন দেখানো দরকার।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'brake-maintenance-checklist-every-driver-should-know'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');

INSERT INTO post_translations (post_id, language, title, excerpt, content, seo_title, seo_description, created_at, updated_at)
SELECT p.id, 'bn', 'আমাদের ২৪/৭ রোডসাইড অ্যাসিসট্যান্স যেভাবে কাজ করে', 'গাড়ি বিকল, চাকা পাংচার, ব্যাটারি ডাউন — আপনার ফোন করার মুহূর্ত থেকে আমরা পৌঁছানো পর্যন্ত ঠিক কী কী ঘটে।', 'গাড়ি বিকল, চাকা পাংচার, ব্যাটারি ডাউন — আপনার ফোন করার মুহূর্ত থেকে আমরা পৌঁছানো পর্যন্ত ঠিক কী কী ঘটে।', '', '', datetime('now'), datetime('now')
  FROM posts p WHERE p.slug = 'how-our-24-7-roadside-assistance-works'
  ON CONFLICT(post_id, language) DO UPDATE SET
    title = excluded.title, excerpt = excluded.excerpt,
    content = excluded.content, updated_at = datetime('now');
