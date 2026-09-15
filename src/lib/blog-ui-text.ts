// ===== The blog's own wording, in both languages =====
// Post titles and bodies come from the database and are translated per post
// (see translate.ts). Everything around them - section headings, the sidebar,
// "Read More", the breadcrumb - is written in the templates, so switching a
// post to Bangla used to leave a Bangla article inside an English page.
//
// Scope is deliberately the blog only. The header menu and footer are shared
// with every other page on the site, and those pages are English, so putting
// them in Bangla here would read as a mistake rather than a translation.
import type { PostLanguage } from './blog-db';

export const BLOG_TEXT = {
  en: {
    pageTitle: 'Blog - Taqwa Automobile Service Center',
    pageDescription:
      'Car care tips, LPG & CNG conversion advice, hybrid maintenance guides and news from Taqwa Automobile Service Center in Uttara, Dhaka.',
    eyebrow: 'TIPS & UPDATES',
    headingLead: 'OUR',
    headingAccent: 'BLOG',
    intro:
      'Practical advice on LPG & CNG conversion, hybrid care, maintenance and more — written by the technicians who service your car.',
    home: 'Home',
    blog: 'Blog',
    emptyFiltered: 'No posts match this search/category yet.',
    emptyNone: 'No posts published yet — check back soon.',
    readMore: 'Read More',
    loadMore: 'Load More Articles',
    showLess: 'Show Less',
    search: 'Search',
    searchPlaceholder: 'Search articles...',
    categories: 'Categories',
    recentPosts: 'Recent Posts',
    popularTags: 'Popular Tags',
    newsletter: 'Newsletter',
    newsletterText:
      'Get new car care tips and LPG/CNG conversion advice sent straight to your inbox.',
    emailPlaceholder: 'Your email address',
    subscribe: 'Subscribe',
    ctaTitle: 'Need Expert Advice?',
    ctaText: 'Have a question about your car? Our team is one call away.',
    ctaButton: 'Call 01854226757',
    byAuthor: 'By',
    relatedLead: 'More From The',
    relatedAccent: 'Blog',
  },
  bn: {
    pageTitle: 'ব্লগ - তাকওয়া অটোমোবাইল সার্ভিস সেন্টার',
    pageDescription:
      'গাড়ির যত্ন, এলপিজি ও সিএনজি কনভার্শনের পরামর্শ, হাইব্রিড রক্ষণাবেক্ষণের নির্দেশিকা ও খবর — উত্তরা, ঢাকার তাকওয়া অটোমোবাইল সার্ভিস সেন্টার থেকে।',
    eyebrow: 'টিপস ও আপডেট',
    headingLead: 'আমাদের',
    headingAccent: 'ব্লগ',
    intro:
      'এলপিজি ও সিএনজি কনভার্শন, হাইব্রিড গাড়ির যত্ন, রক্ষণাবেক্ষণ — আপনার গাড়ি যাঁরা সার্ভিস করেন, তাঁদেরই লেখা বাস্তব পরামর্শ।',
    home: 'হোম',
    blog: 'ব্লগ',
    emptyFiltered: 'এই খোঁজ বা বিভাগে এখনো কোনো লেখা নেই।',
    emptyNone: 'এখনো কোনো লেখা প্রকাশ করা হয়নি — শিগগিরই দেখুন।',
    readMore: 'বিস্তারিত পড়ুন',
    loadMore: 'আরও লেখা দেখুন',
    showLess: 'কম দেখুন',
    search: 'খুঁজুন',
    searchPlaceholder: 'লেখা খুঁজুন...',
    categories: 'বিভাগ',
    recentPosts: 'সাম্প্রতিক লেখা',
    popularTags: 'জনপ্রিয় ট্যাগ',
    newsletter: 'নিউজলেটার',
    newsletterText:
      'গাড়ির যত্ন আর এলপিজি/সিএনজি কনভার্শনের নতুন পরামর্শ সরাসরি আপনার ইনবক্সে পান।',
    emailPlaceholder: 'আপনার ইমেইল ঠিকানা',
    subscribe: 'সাবস্ক্রাইব',
    ctaTitle: 'বিশেষজ্ঞের পরামর্শ দরকার?',
    ctaText: 'গাড়ি নিয়ে কোনো প্রশ্ন? আমাদের টিম এক ফোন দূরে।',
    ctaButton: 'কল করুন ০১৮৫৪২২৬৭৫৭',
    byAuthor: 'লিখেছেন',
    relatedLead: 'ব্লগের আরও',
    relatedAccent: 'লেখা',
  },
} satisfies Record<PostLanguage, Record<string, string>>;

export type BlogText = (typeof BLOG_TEXT)['en'];

export function blogText(language: PostLanguage): BlogText {
  return BLOG_TEXT[language];
}
