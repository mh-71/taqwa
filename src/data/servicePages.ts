// Shared content model for the "single service landing page" template
// (Car AC Service, Car Wash & Detailing, CNG Conversion, Engine Repair).
//
// These four pages used to be four separate .astro files that each carried
// their own ~1,200-line copy of the same markup/CSS, differing only in the
// text, images and icons below. That markup+CSS now lives once in
// src/components/services/ServiceDetail.astro; this file holds only the
// per-page content it renders.
//
// `icon` fields hold the raw inner SVG markup (just the <path>/<circle>/<rect>
// elements) exactly as it appeared in the original page markup, so the visual
// output is unchanged. `heading` fields split a title into the plain-text
// part(s) and the part that should render inside <span class="accent">.

export interface AccentHeading {
  pre: string;
  accent: string;
  post?: string;
}

export interface ReasonItem {
  icon: string;
  title: string;
  text: string;
}

export interface ProcessStep {
  title: string;
  text: string;
}

export interface RecapItem {
  icon: string;
  title: string;
  text: string;
}

export type WhyChooseCardClass = 'tech' | 'tools' | 'parts' | 'service';

export interface WhyChooseCard {
  cardClass: WhyChooseCardClass;
  image: string;
  alt: string;
  label: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ServicePageData {
  slug: string;
  seo: {
    title: string;
    description: string;
    path: string;
  };
  hero: {
    eyebrow: string;
    heading: AccentHeading;
    intro: string;
    breadcrumbLabel: string;
  };
  overview: {
    heading: AccentHeading;
    paragraphs: string[];
    image: string;
    imageAlt: string;
    reasons: ReasonItem[];
    trustStrip: string[];
  };
  process: {
    heading: AccentHeading;
    intro: string;
    steps: ProcessStep[];
  };
  recap: {
    heading: AccentHeading;
    items: RecapItem[];
  };
  whyChoose: {
    heading: AccentHeading;
    paragraph: string;
    ctaLabel: string;
    cards: WhyChooseCard[];
  };
  faq: {
    heading: AccentHeading;
    items: FaqItem[];
  };
  cta: {
    heading: string;
    paragraph: string;
  };
}

export const servicePages: Record<string, ServicePageData> = {
  'car-ac-service': {
    slug: 'car-ac-service',
    seo: {
      title: 'Car AC Service - Taqwa Automobile Service Center',
      description:
        'Professional car AC service and repair in Uttara, Dhaka. Gas refill, leak detection, compressor repair, and full AC diagnostics at Taqwa Automobile Service Center.',
      path: 'car-ac-service.html',
    },
    hero: {
      eyebrow: 'STAY COOL ALL YEAR',
      heading: { pre: 'CAR AC ', accent: 'SERVICE' },
      intro:
        "Full AC diagnostics, gas refill and repair to keep your car cool, whatever the weather — done right the first time.",
      breadcrumbLabel: 'Car AC Service',
    },
    overview: {
      heading: { pre: 'COLD AIR, EVERY TIME ', accent: 'YOU TURN THE KEY' },
      paragraphs: [
        "Weak airflow, warm air, strange smells or noises from the vents — car AC problems are easy to ignore until the heat makes them impossible to. At Taqwa Automobile, we properly diagnose your AC system before recommending any repair, so you know exactly what's wrong and what it will cost.",
        'From a simple gas refill to compressor replacement, our technicians handle it all with genuine refrigerant, proper leak detection equipment, and a careful process that keeps your cooling system reliable long after you leave.',
      ],
      image: 'img/Car-ac-Service.jpg',
      imageAlt: 'Car AC service and repair at Taqwa Automobile',
      reasons: [
        {
          icon: '<circle cx="10" cy="10" r="6.5" stroke="#F97316" stroke-width="1.4"/><line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#F97316" stroke-width="1.5" stroke-linecap="round"/><path d="M7 10h1.5l1-2 1.5 4 1-2H13" stroke="#F97316" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>',
          title: 'Full Leak Detection',
          text: "We trace the exact source of gas loss instead of just refilling and hoping the problem doesn't come back.",
        },
        {
          icon: '<rect x="3" y="7" width="15" height="10" rx="1.5" stroke="#F97316" stroke-width="1.4"/><rect x="18" y="10" width="2" height="4" fill="#F97316"/>',
          title: 'Genuine Refrigerant & Parts',
          text: 'Only correct-grade refrigerant and manufacturer-approved parts, protecting your compressor and system.',
        },
        {
          icon: '<path d="M12 2l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V5l7-3z" stroke="#F97316" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="#F97316" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
          title: 'Experienced AC Technicians',
          text: 'Our team is trained on modern and older AC systems alike, including hybrid and CNG-converted vehicles.',
        },
        {
          icon: '<circle cx="12" cy="12" r="9" stroke="#F97316" stroke-width="1.5"/><path d="M8 12.5l2.5 2.5L16 9" stroke="#F97316" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
          title: 'Fast, Reliable Cooling',
          text: "Most AC services are completed the same day, so you're back on the road with cold air, fast.",
        },
      ],
      trustStrip: [
        'Certified AC Technicians',
        'Genuine Refrigerant',
        'Leak Detection Equipment',
        'Warranty on Service',
        'No Hidden Charges',
        'Quick Same-Day Turnaround',
      ],
    },
    process: {
      heading: { pre: 'OUR AC ', accent: 'SERVICE PROCESS' },
      intro:
        'From the first performance check to the final cooling test, every AC service at Taqwa Automobile follows the same careful process.',
      steps: [
        { title: 'AC Performance Check', text: 'We check cooling output, airflow and cabin temperature to understand exactly how your AC is performing.' },
        { title: 'Refrigerant & Pressure Test', text: 'We measure refrigerant levels and system pressure to identify gas loss or component issues.' },
        { title: 'Leak Detection', text: 'If gas is low, we trace the exact leak point instead of just topping it up temporarily.' },
        { title: 'Component Repair or Replacement', text: 'Compressor, condenser, evaporator or other parts are repaired or replaced using genuine components.' },
        { title: 'Re-Gas & Cooling Test', text: 'The system is recharged with the correct refrigerant and tested to confirm strong, cold airflow.' },
        { title: 'Warranty & Follow-Up', text: 'We back our AC work with a service warranty and are here if you notice any issues afterward.' },
      ],
    },
    recap: {
      heading: { pre: 'OUR ', accent: 'CAR AC SERVICES' },
      items: [
        { icon: '<circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.4"/><path d="M8 12l2 2 4-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', title: 'AC Gas Refill (Re-gas)', text: 'Precise refrigerant top-up or full recharge to restore strong, cold airflow.' },
        { icon: '<rect x="4" y="8" width="16" height="10" rx="1.5" stroke="#fff" stroke-width="1.4"/><circle cx="12" cy="13" r="2.5" stroke="#fff" stroke-width="1.3"/>', title: 'Compressor Repair & Replacement', text: 'Diagnosis and repair of noisy, seized or failing AC compressors, the heart of your cooling system.' },
        { icon: '<path d="M3 12h4l2-5 4 10 2-5h6" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Condenser & Evaporator Service', text: 'Cleaning, repair or replacement of condenser and evaporator coils for efficient heat exchange.' },
        { icon: '<circle cx="10" cy="10" r="6.5" stroke="#fff" stroke-width="1.4"/><line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M7 10h1.5l1-2 1.5 4 1-2H13" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>', title: 'AC Leak Detection & Repair', text: 'Finding and fixing the exact source of refrigerant leaks so your cooling stays consistent.' },
        { icon: '<rect x="6" y="6" width="12" height="12" rx="1.5" stroke="#fff" stroke-width="1.4"/><line x1="6" y1="10" x2="18" y2="10" stroke="#fff" stroke-width="1.2"/><line x1="6" y1="14" x2="18" y2="14" stroke="#fff" stroke-width="1.2"/>', title: 'Cabin Filter Replacement', text: 'Fresh cabin air filters for cleaner air inside your car and better AC airflow.' },
        { icon: '<circle cx="12" cy="12" r="7" stroke="#fff" stroke-width="1.4"/><path d="M12 8v4l3 2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Blower Motor Repair', text: 'Repair or replacement of blower motors for strong, consistent cabin airflow.' },
        { icon: '<circle cx="8" cy="8" r="3" stroke="#fff" stroke-width="1.3"/><circle cx="16" cy="16" r="3" stroke="#fff" stroke-width="1.3"/><line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="#fff" stroke-width="1.3"/>', title: 'AC Belt & Pulley Service', text: 'Inspection and replacement of worn belts and pulleys that drive your AC compressor.' },
        { icon: '<rect x="3" y="3" width="18" height="18" rx="3" stroke="#fff" stroke-width="1.4"/><path d="M8 8h8v8H8z" stroke="#fff" stroke-width="1.3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>', title: 'Full AC System Diagnostics', text: 'Complete performance check covering pressure, temperature, airflow and every major component.' },
      ],
    },
    whyChoose: {
      heading: { pre: 'With Your ', accent: 'Car AC Service', post: '?' },
      paragraph:
        'A quick gas top-up might feel like a fix, but it rarely lasts. Our workshop combines proper leak detection, genuine refrigerant and experienced technicians to solve the real problem, not just mask it.',
      ctaLabel: 'Book Your AC Service',
      cards: [
        { cardClass: 'tech', image: 'img/expert-technitian.jpg', alt: 'Certified Car AC Technicians', label: 'Certified AC Technicians' },
        { cardClass: 'tools', image: 'img/car-parts.jpg', alt: 'Genuine Refrigerant and AC Parts', label: 'Genuine Refrigerant & Parts' },
        { cardClass: 'parts', image: 'img/Car-ac-Service.jpg', alt: 'Advanced AC Leak Detection', label: 'Advanced Leak Detection' },
        { cardClass: 'service', image: 'img/Trusted-Service.jpg', alt: 'Fast and Reliable AC Service', label: 'Fast, Reliable Service' },
      ],
    },
    faq: {
      heading: { pre: 'CAR AC SERVICE ', accent: 'FAQ' },
      items: [
        { q: 'Why is my car AC not cooling properly?', a: 'Weak cooling is usually caused by low refrigerant, a leak, a failing compressor, or a clogged condenser. We run a full diagnostic to pinpoint the exact cause before recommending a fix.' },
        { q: 'How often should I service my car AC?', a: 'We recommend a check-up at least once a year, or sooner if you notice weaker cooling, unusual smells, or strange noises from the AC system.' },
        { q: 'Do you handle AC gas leaks?', a: 'Yes. We use proper leak detection equipment to find the exact source of the leak and repair it, rather than just refilling gas that will leak out again.' },
        { q: 'Can hybrid or CNG vehicles get AC service here too?', a: 'Absolutely. Our technicians are experienced with AC systems in hybrid and CNG-converted vehicles as well as standard petrol and diesel cars.' },
        { q: 'Do you offer warranty on AC repairs?', a: 'Yes, our AC repairs and part replacements come with a service warranty. Ask our team for details specific to the work done on your vehicle.' },
      ],
    },
    cta: {
      heading: 'Beat the Heat — Book Your AC Service Today',
      paragraph: 'Book a full AC checkup or ask our specialists a question — call, message us on WhatsApp, or visit our workshop in Uttara.',
    },
  },

  'car-wash-detailing': {
    slug: 'car-wash-detailing',
    seo: {
      title: 'Car Wash & Detailing - Taqwa Automobile Service Center',
      description:
        'Professional car wash and detailing in Uttara, Dhaka. Hand wash, interior deep cleaning, wax and polish, ceramic coating at Taqwa Automobile Service Center.',
      path: 'car-wash-detailing.html',
    },
    hero: {
      eyebrow: 'SHOWROOM SHINE, EVERY VISIT',
      heading: { pre: 'CAR WASH & ', accent: 'DETAILING' },
      intro:
        'A careful hand wash and deep interior clean that leaves your car looking, feeling and smelling like new.',
      breadcrumbLabel: 'Car Wash & Detailing',
    },
    overview: {
      heading: { pre: 'MORE THAN A WASH — ', accent: 'A COMPLETE REFRESH' },
      paragraphs: [
        'Dust, road grime and everyday wear build up fast in Dhaka traffic. At Taqwa Automobile, our wash and detailing team treats every car with care — no rushed rub-downs, no harsh chemicals that dull your paint.',
        "From a quick exterior wash to a full interior-and-exterior detailing package, we use the right products and techniques for your car's finish, so it comes out looking sharp and feeling fresh inside and out.",
      ],
      image: 'img/car-wash.jpg',
      imageAlt: 'Car wash and detailing service at Taqwa Automobile',
      reasons: [
        {
          icon: '<path d="M5 12c0-4 3-8 7-8s7 4 7 8" stroke="#F97316" stroke-width="1.4" stroke-linecap="round"/><path d="M4 16h16M6 20h12" stroke="#F97316" stroke-width="1.3" stroke-linecap="round"/>',
          title: 'Careful Hand Wash Process',
          text: 'Every car is washed by hand, with attention paid to trim, wheels and hard-to-reach spots that machines skip.',
        },
        {
          icon: '<circle cx="12" cy="12" r="9" stroke="#F97316" stroke-width="1.5"/><path d="M8 12.5l2.5 2.5L16 9" stroke="#F97316" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
          title: 'Premium Cleaning Products',
          text: 'Paint-safe shampoos and quality microfiber tools that clean thoroughly without scratching or fading your finish.',
        },
        {
          icon: '<rect x="4" y="6" width="16" height="12" rx="2" stroke="#F97316" stroke-width="1.4"/><path d="M8 10h8M8 14h5" stroke="#F97316" stroke-width="1.2" stroke-linecap="round"/>',
          title: 'Interior Deep Cleaning',
          text: 'Vacuuming, upholstery cleaning and dashboard care that removes dust, odors and everyday grime from the cabin.',
        },
        {
          icon: '<path d="M13 2L4.5 13.5H11l-1.3 8L18.5 9.5H12z" stroke="#F97316" stroke-width="1.4" stroke-linejoin="round"/>',
          title: 'Paint Protection & Shine',
          text: 'Wax and polish that restore gloss and add a protective layer against dust, sun and light scratches.',
        },
      ],
      trustStrip: [
        'Hand Wash & Dry',
        'Interior Vacuum & Sanitize',
        'Premium Wax & Polish',
        'Paint-Safe Products',
        'Same-Day Service',
        'Affordable Packages',
      ],
    },
    process: {
      heading: { pre: 'OUR WASH & ', accent: 'DETAILING PROCESS' },
      intro: 'From the first inspection to the final walk-around, every car gets the same careful attention at Taqwa Automobile.',
      steps: [
        { title: 'Pre-Wash Inspection', text: 'We check your car\'s condition and note any spots that need extra attention before we begin.' },
        { title: 'Exterior Hand Wash', text: 'A thorough hand wash with paint-safe shampoo, followed by a careful hand dry to avoid water spots.' },
        { title: 'Interior Vacuum & Cleaning', text: 'Seats, carpets, dashboard and door panels are vacuumed and wiped down to remove dust and grime.' },
        { title: 'Wax, Polish & Shine', text: 'Quality wax and polish restore gloss and add a protective layer against dust and sun damage.' },
        { title: 'Tire & Trim Detailing', text: 'Tires, rims and exterior trim are cleaned and dressed for a finished, showroom look.' },
        { title: 'Final Quality Check', text: 'We do a final walk-around with you to make sure every detail meets our standard before you drive off.' },
      ],
    },
    recap: {
      heading: { pre: 'OUR ', accent: 'WASH & DETAILING SERVICES' },
      items: [
        { icon: '<path d="M5 12c0-4 3-8 7-8s7 4 7 8" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M4 16h16M6 20h12" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>', title: 'Exterior Hand Wash', text: "A careful, paint-safe hand wash and dry that leaves your car's exterior spotless." },
        { icon: '<rect x="4" y="6" width="16" height="12" rx="2" stroke="#fff" stroke-width="1.4"/><path d="M8 10h8M8 14h5" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>', title: 'Interior Vacuuming & Cleaning', text: 'Seats, carpets and dashboard vacuumed and wiped down for a fresh, clean cabin.' },
        { icon: '<circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.4"/><path d="M12 7v5l3 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Wax & Polish', text: 'Quality wax and polish that restore shine and add a protective layer to your paint.' },
        { icon: '<path d="M2 12h4V6h4v12h4V6h4v12h4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Engine Bay Cleaning', text: 'Safe, careful cleaning of the engine bay to remove dust, grease and grime buildup.' },
        { icon: '<rect x="6" y="6" width="12" height="12" rx="1.5" stroke="#fff" stroke-width="1.4"/><rect x="9.5" y="9.5" width="5" height="5" stroke="#fff" stroke-width="1.2"/>', title: 'Upholstery & Seat Shampoo', text: 'Deep shampoo cleaning that lifts stains and odors from fabric and leather seats.' },
        { icon: '<circle cx="12" cy="12" r="7" stroke="#fff" stroke-width="1.4"/><path d="M12 8v4l3 2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Headlight Restoration', text: 'Removing yellowing and cloudiness from headlights for better night visibility and looks.' },
        { icon: '<path d="M13 2L4.5 13.5H11l-1.3 8L18.5 9.5H12z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>', title: 'Ceramic Coating', text: 'Long-lasting protective coating for a deep shine and stronger resistance to dust and water.' },
        { icon: '<circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.4"/><path d="M8 12l2 2 4-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Full Detailing Package', text: 'Complete interior and exterior detailing that covers every part of your car in one visit.' },
      ],
    },
    whyChoose: {
      heading: { pre: 'With Your ', accent: 'Car Wash & Detailing', post: '?' },
      paragraph:
        'A rushed wash can leave swirl marks and missed spots. Our team takes the time to do it properly, with paint-safe products and real attention to detail — inside and out.',
      ctaLabel: 'Book Your Wash & Detailing',
      cards: [
        { cardClass: 'tech', image: 'img/car-servicing.jpg', alt: 'Careful Trained Car Detailers', label: 'Careful, Trained Detailers' },
        { cardClass: 'tools', image: 'img/car-wash.jpg', alt: 'Premium Car Cleaning Products', label: 'Premium Cleaning Products' },
        { cardClass: 'parts', image: 'img/Car-Wash-detailing.jpg', alt: 'Attention to Every Car Detail', label: 'Attention to Every Detail' },
        { cardClass: 'service', image: 'img/Trusted-Service.jpg', alt: 'Affordable Car Wash Packages', label: 'Affordable Packages' },
      ],
    },
    faq: {
      heading: { pre: 'CAR WASH & DETAILING ', accent: 'FAQ' },
      items: [
        { q: 'How long does a full detailing take?', a: "A basic wash usually takes under an hour, while a full interior-and-exterior detailing package can take a few hours depending on your car's condition." },
        { q: "Do you use products safe for my car's paint?", a: "Yes, we use paint-safe shampoos and microfiber tools designed to clean without scratching or dulling your car's finish." },
        { q: 'Can you remove stains from my seats?', a: 'In most cases, yes. Our upholstery and seat shampoo service targets stains and odors on both fabric and leather seats — results depend on the stain type and age.' },
        { q: 'Do you offer packages for regular customers?', a: 'Yes, we offer affordable wash and detailing packages for customers who want to keep their car looking fresh on a regular schedule. Ask our team for current options.' },
        { q: 'Can I get my car washed while getting other service done?', a: 'Absolutely. Many customers combine a wash and detailing with engine repair, AC service, or other work during the same visit to save time.' },
      ],
    },
    cta: {
      heading: 'Give Your Car the Shine It Deserves',
      paragraph: 'Book a wash, detailing package, or ask our team a question — call, message us on WhatsApp, or visit our workshop in Uttara.',
    },
  },

  'cng-conversion': {
    slug: 'cng-conversion',
    seo: {
      title: 'CNG Conversion - Taqwa Automobile Service Center',
      description:
        'Certified CNG conversion in Uttara, Dhaka. Safety-tested cylinder installation, genuine kits, ECU tuning and 2 year warranty at Taqwa Automobile Service Center.',
      path: 'cng-conversion.html',
    },
    hero: {
      eyebrow: 'OUR CORE SPECIALTY',
      heading: { pre: 'CNG ', accent: 'CONVERSION' },
      intro:
        'Certified, safety-tested CNG conversion for private cars and commercial vehicles — genuine kits, careful installation, and real fuel savings from day one.',
      breadcrumbLabel: 'CNG Conversion',
    },
    overview: {
      heading: { pre: 'GAS CONVERSION IS ', accent: 'WHAT WE DO BEST' },
      paragraphs: [
        "CNG conversion isn't a side job at Taqwa Automobile — it's our core specialty. Every cylinder installation, injector fitting and pressure test is handled by our dedicated gas conversion team, following the same careful process on every single car.",
        'Whether you drive daily in city traffic or run a commercial vehicle, converting to CNG can cut your fuel cost significantly while keeping performance smooth — as long as the conversion is done right. That\'s where we come in.',
      ],
      image: 'img/lpg-and-cng.jpg',
      imageAlt: 'CNG conversion installation at Taqwa Automobile',
      reasons: [
        {
          icon: '<path d="M13 2L4.5 13.5H11l-1.3 8L18.5 9.5H12z" stroke="#F97316" stroke-width="1.4" stroke-linejoin="round"/>',
          title: 'Lower Running Cost',
          text: 'CNG is among the cheapest fuels on the road, meaning noticeably lower cost per kilometer compared to petrol.',
        },
        {
          icon: '<path d="M12 21s7-6.5 7-11.5a7 7 0 10-14 0C5 14.5 12 21 12 21z" stroke="#F97316" stroke-width="1.5"/><circle cx="12" cy="9.5" r="2.3" stroke="#F97316" stroke-width="1.5"/>',
          title: 'Widely Available Refills',
          text: 'CNG filling stations are common across Dhaka, making it a practical everyday fuel choice for daily driving.',
        },
        {
          icon: '<path d="M4 12a8 8 0 0113-6" stroke="#F97316" stroke-width="1.4" stroke-linecap="round"/><path d="M17 6l-1-3.5L20 4" stroke="#F97316" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12a8 8 0 01-13 6" stroke="#F97316" stroke-width="1.4" stroke-linecap="round"/><path d="M7 18l1 3.5L4 20" stroke="#F97316" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>',
          title: 'Cleaner Emissions',
          text: 'CNG burns cleaner than petrol, producing fewer harmful emissions — better for the environment and engine health.',
        },
        {
          icon: '<rect x="6" y="6" width="12" height="12" rx="1.5" stroke="#F97316" stroke-width="1.4"/><rect x="9.5" y="9.5" width="5" height="5" stroke="#F97316" stroke-width="1.2"/><line x1="8" y1="2" x2="8" y2="6" stroke="#F97316" stroke-width="1.2"/><line x1="16" y1="2" x2="16" y2="6" stroke="#F97316" stroke-width="1.2"/><line x1="8" y1="18" x2="8" y2="22" stroke="#F97316" stroke-width="1.2"/><line x1="16" y1="18" x2="16" y2="22" stroke="#F97316" stroke-width="1.2"/>',
          title: 'Durable, Long-Lasting Cylinder',
          text: 'Quality cylinders built for daily, high-mileage driving, backed by our own installation and safety checks.',
        },
      ],
      trustStrip: [
        'Certified Conversion Kits',
        'Safety-Checked Installation',
        '2 Year Service Warranty',
        'Experienced Gas Conversion Specialists',
        'Government Safety Standard Compliant',
        'Honest Fuel-Type Advice',
      ],
    },
    process: {
      heading: { pre: 'OUR CNG ', accent: 'CONVERSION PROCESS' },
      intro: 'From first inspection to final road test, every CNG conversion at Taqwa Automobile follows the same careful, safety-first process.',
      steps: [
        { title: 'Free Consultation & Inspection', text: 'We check your engine and driving pattern to confirm CNG is the right fit and explain what to expect before we begin.' },
        { title: 'Kit & Cylinder Selection', text: 'We help you choose the right cylinder size and injection kit based on your vehicle and how you drive.' },
        { title: 'Certified Installation', text: 'Our trained technicians fit the cylinder, injectors, reducer and wiring with precision, following manufacturer guidelines.' },
        { title: 'Leak & Pressure Testing', text: 'Every connection is pressure tested and leak checked before your car is cleared as safe to drive on CNG.' },
        { title: 'ECU Tuning & Road Test', text: 'We fine-tune the system for smooth performance, then take your car out for a real road test on CNG.' },
        { title: 'Warranty & Ongoing Support', text: 'We back every conversion with a 2 year service warranty and are always available for follow-up checks.' },
      ],
    },
    recap: {
      heading: { pre: 'OUR ', accent: 'CNG SERVICES' },
      items: [
        { icon: '<rect x="6" y="6" width="12" height="12" rx="1.5" stroke="#fff" stroke-width="1.4"/><rect x="9.5" y="9.5" width="5" height="5" stroke="#fff" stroke-width="1.2"/><line x1="8" y1="2" x2="8" y2="6" stroke="#fff" stroke-width="1.2"/><line x1="16" y1="2" x2="16" y2="6" stroke="#fff" stroke-width="1.2"/><line x1="8" y1="18" x2="8" y2="22" stroke="#fff" stroke-width="1.2"/><line x1="16" y1="18" x2="16" y2="22" stroke="#fff" stroke-width="1.2"/>', title: 'CNG Cylinder Installation', text: 'Safe, precise fitting of certified CNG cylinders sized to match your vehicle and driving needs.' },
        { icon: '<path d="M2 12h4V6h4v12h4V6h4v12h4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Injector Kit Fitting', text: 'Careful installation of injector and wiring kits for smooth, reliable gas delivery to the engine.' },
        { icon: '<circle cx="10" cy="10" r="6.5" stroke="#fff" stroke-width="1.4"/><line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M7 10h1.5l1-2 1.5 4 1-2H13" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Pressure & Leak Testing', text: 'Every conversion is pressure tested and leak checked before your car is cleared as safe to drive.' },
        { icon: '<rect x="3" y="3" width="18" height="18" rx="3" stroke="#fff" stroke-width="1.4"/><path d="M8 8h8v8H8z" stroke="#fff" stroke-width="1.3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>', title: 'ECU Remapping & Tuning', text: 'Precise software tuning so your engine runs smoothly and efficiently on CNG.' },
        { icon: '<circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.4"/><path d="M12 7v5l3 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Cylinder Re-testing & Renewal', text: 'Periodic cylinder re-testing and certification renewal to keep your vehicle compliant and safe.' },
        { icon: '<path d="M4 12a8 8 0 0113-6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M17 6l-1-3.5L20 4" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12a8 8 0 01-13 6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M7 18l1 3.5L4 20" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Reducer & Regulator Service', text: 'Inspection and servicing of the gas reducer and regulator for consistent pressure and performance.' },
        { icon: '<path d="M13 2L4.5 13.5H11l-1.3 8L18.5 9.5H12z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>', title: 'Conversion Kit Upgrade', text: 'Upgrade an older CNG kit to a newer, more efficient system for better mileage and reliability.' },
        { icon: '<circle cx="12" cy="12" r="7" stroke="#fff" stroke-width="1.4"/><circle cx="12" cy="12" r="2.4" stroke="#fff" stroke-width="1.2"/><path d="M12 3.5a8.5 8.5 0 018.5 8.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/><path d="M22 8l-1.5-2L18 7" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>', title: 'CNG System Troubleshooting', text: 'Diagnosing power loss, rough idling or gas-switching issues in existing CNG-converted vehicles.' },
      ],
    },
    whyChoose: {
      heading: { pre: 'With Your ', accent: 'CNG Conversion', post: '?' },
      paragraph:
        'A poorly done gas conversion can be dangerous and costly. Our workshop combines certified training, genuine kits and rigorous safety testing to get it right the first time.',
      ctaLabel: 'Book Your CNG Conversion',
      cards: [
        { cardClass: 'tech', image: 'img/expert-technitian.jpg', alt: 'Certified CNG Installation Team', label: 'Certified Installation Team' },
        { cardClass: 'tools', image: 'img/lpg-and-cng.jpg', alt: 'Genuine CNG Conversion Kits', label: 'Genuine CNG Kits' },
        { cardClass: 'parts', image: 'img/advanced-tools.jpg', alt: 'Rigorous CNG Safety Testing', label: 'Rigorous Safety Testing' },
        { cardClass: 'service', image: 'img/Trusted-Service.jpg', alt: 'Honest CNG Conversion Service', label: 'No Hidden Charges' },
      ],
    },
    faq: {
      heading: { pre: 'CNG CONVERSION ', accent: 'FAQ' },
      items: [
        { q: 'Is CNG conversion safe for my car?', a: 'Yes, when installed and tested correctly. Every conversion at Taqwa Automobile goes through pressure and leak testing before the car leaves our workshop.' },
        { q: 'How long does CNG conversion take?', a: "Most conversions are completed within a day, depending on your vehicle and the kit chosen. We'll give you a clear time estimate at consultation." },
        { q: 'Will CNG conversion affect my engine warranty?', a: "This can vary by manufacturer, so we recommend checking with your vehicle's warranty provider. We always use genuine kits and proper installation to minimize any risk to your engine." },
        { q: 'How much can I save by switching to CNG?', a: 'Savings depend on your vehicle, engine size and how much you drive. Our team can walk you through the numbers for your specific car during a free consultation.' },
        { q: 'Do I need to renew my CNG cylinder certification?', a: 'Yes, CNG cylinders require periodic re-testing and renewal. We handle this for you and can remind you when your next check is due.' },
      ],
    },
    cta: {
      heading: 'Ready to Save on Fuel with CNG?',
      paragraph: 'Book your free consultation or ask our specialists a question — call, message us on WhatsApp, or visit our workshop in Uttara.',
    },
  },

  'engine-repair': {
    slug: 'engine-repair',
    seo: {
      title: 'Engine Repair - Taqwa Automobile Service Center',
      description:
        'Expert engine diagnostics and repair in Uttara, Dhaka. Computerized diagnostics, genuine parts, and warranty-backed engine repair at Taqwa Automobile Service Center.',
      path: 'engine-repair.html',
    },
    hero: {
      eyebrow: 'EXPERT ENGINE CARE',
      heading: { pre: 'ENGINE ', accent: 'REPAIR' },
      intro:
        'Accurate diagnostics and honest engine repair for every make and model — genuine parts, skilled technicians, and no unnecessary work.',
      breadcrumbLabel: 'Engine Repair',
    },
    overview: {
      heading: { pre: 'ENGINE PROBLEMS DIAGNOSED RIGHT, ', accent: 'FIXED RIGHT' },
      paragraphs: [
        'A strange noise, a loss of power, a warning light on the dashboard — engine problems can be confusing and stressful. At Taqwa Automobile, we start every engine repair with a proper diagnosis, not guesswork, so you only pay for the work your car actually needs.',
        'From minor tune-ups to full engine overhauls, our technicians work on all major makes and models using genuine parts and the right tools for the job, so your engine runs smoothly for the long run.',
      ],
      image: 'img/engine-repeir.jpg',
      imageAlt: 'Engine repair work at Taqwa Automobile',
      reasons: [
        {
          icon: '<circle cx="10" cy="10" r="6.5" stroke="#F97316" stroke-width="1.4"/><line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#F97316" stroke-width="1.5" stroke-linecap="round"/><path d="M7 10h1.5l1-2 1.5 4 1-2H13" stroke="#F97316" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>',
          title: 'Accurate Diagnostics First',
          text: "We pinpoint the real cause before touching a single part, so you avoid paying for repairs you don't actually need.",
        },
        {
          icon: '<rect x="3" y="7" width="15" height="10" rx="1.5" stroke="#F97316" stroke-width="1.4"/><rect x="18" y="10" width="2" height="4" fill="#F97316"/>',
          title: 'Genuine Parts & Fluids',
          text: 'We use genuine or manufacturer-approved parts and quality fluids, never generic substitutes that wear out fast.',
        },
        {
          icon: '<path d="M12 2l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V5l7-3z" stroke="#F97316" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="#F97316" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
          title: 'Skilled, Experienced Technicians',
          text: 'Our mechanics have years of hands-on experience across a wide range of engines, from everyday cars to commercial vehicles.',
        },
        {
          icon: '<circle cx="12" cy="12" r="9" stroke="#F97316" stroke-width="1.5"/><path d="M8 12.5l2.5 2.5L16 9" stroke="#F97316" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
          title: 'Built for Long-Term Reliability',
          text: "Our goal isn't just a quick fix — it's making sure your engine keeps running well long after you leave our workshop.",
        },
      ],
      trustStrip: [
        'Certified Engine Technicians',
        'Computerized Diagnostics',
        'Genuine Parts Only',
        'Warranty on Repairs',
        'No Hidden Charges',
        'All Makes & Models Welcome',
      ],
    },
    process: {
      heading: { pre: 'OUR ENGINE ', accent: 'REPAIR PROCESS' },
      intro: 'From the first diagnostic scan to the final road test, every engine repair at Taqwa Automobile follows the same careful, honest process.',
      steps: [
        { title: 'Initial Diagnostic Scan', text: 'We run a computerized diagnostic scan to read fault codes and get a clear starting point for the problem.' },
        { title: 'Detailed Inspection', text: 'Our technicians physically inspect the engine to confirm the diagnosis and check for any related issues.' },
        { title: 'Transparent Quote & Approval', text: "We explain what's wrong in plain language and give you a clear quote before any repair work begins." },
        { title: 'Expert Repair Work', text: 'Our skilled mechanics carry out the repair using genuine parts and proper procedures for your engine type.' },
        { title: 'Quality Testing & Road Test', text: 'We test the repair thoroughly and take your car for a road test to confirm the problem is truly fixed.' },
        { title: 'Warranty & Follow-Up', text: 'We back our engine repairs with a service warranty and are here if you have any questions afterward.' },
      ],
    },
    recap: {
      heading: { pre: 'OUR ', accent: 'ENGINE REPAIR SERVICES' },
      items: [
        { icon: '<circle cx="10" cy="10" r="6.5" stroke="#fff" stroke-width="1.4"/><line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M7 10h1.5l1-2 1.5 4 1-2H13" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Engine Diagnostic Scan', text: 'Computerized scanning to read fault codes and identify the exact source of engine trouble.' },
        { icon: '<circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.4"/><path d="M12 7v5l3 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Timing Belt & Chain Replacement', text: 'Timely replacement to prevent costly engine damage from a worn or snapped timing belt.' },
        { icon: '<rect x="3" y="7" width="15" height="10" rx="1.5" stroke="#fff" stroke-width="1.4"/><rect x="18" y="10" width="2" height="4" fill="#fff"/>', title: 'Head Gasket Repair', text: 'Expert repair of blown or leaking head gaskets to stop overheating and oil or coolant loss.' },
        { icon: '<path d="M12 2l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V5l7-3z" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Engine Overhaul & Rebuild', text: 'Complete engine rebuilds for high-mileage or heavily worn engines, restoring performance and reliability.' },
        { icon: '<path d="M6 12h2l1.2-2.5L11 15l1.2-3h2.3" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="7" width="15" height="10" rx="1.5" stroke="#fff" stroke-width="1.4"/>', title: 'Oil & Filter Change', text: 'Regular oil and filter changes using quality lubricants to keep your engine protected and running clean.' },
        { icon: '<path d="M4 12a8 8 0 0113-6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M17 6l-1-3.5L20 4" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 12a8 8 0 01-13 6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M7 18l1 3.5L4 20" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Cooling System Repair', text: 'Radiator, water pump and thermostat repair to keep your engine from overheating.' },
        { icon: '<rect x="6" y="6" width="12" height="12" rx="1.5" stroke="#fff" stroke-width="1.4"/><rect x="9.5" y="9.5" width="5" height="5" stroke="#fff" stroke-width="1.2"/><line x1="8" y1="2" x2="8" y2="6" stroke="#fff" stroke-width="1.2"/><line x1="16" y1="2" x2="16" y2="6" stroke="#fff" stroke-width="1.2"/><line x1="8" y1="18" x2="8" y2="22" stroke="#fff" stroke-width="1.2"/><line x1="16" y1="18" x2="16" y2="22" stroke="#fff" stroke-width="1.2"/>', title: 'Fuel System Service', text: 'Cleaning and repair of injectors, fuel pumps and filters for smooth starts and better fuel efficiency.' },
        { icon: '<path d="M2 12h4V6h4v12h4V6h4v12h4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', title: 'Exhaust System Repair', text: 'Muffler, pipe and catalytic converter repair to fix noise, smoke and performance issues.' },
      ],
    },
    whyChoose: {
      heading: { pre: 'With Your ', accent: 'Engine Repair', post: '?' },
      paragraph:
        'Engine problems left undiagnosed only get worse and more expensive. Our workshop combines skilled technicians, genuine parts and honest diagnostics to fix it right the first time.',
      ctaLabel: 'Book Your Engine Checkup',
      cards: [
        { cardClass: 'tech', image: 'img/expert-technitian.jpg', alt: 'Certified Engine Repair Technicians', label: 'Certified Technicians' },
        { cardClass: 'tools', image: 'img/car-parts.jpg', alt: 'Genuine Engine Parts', label: 'Genuine Parts' },
        { cardClass: 'parts', image: 'img/Car-Diagnostics.jpg', alt: 'Computerized Engine Diagnostics', label: 'Computerized Diagnostics' },
        { cardClass: 'service', image: 'img/Trusted-Service.jpg', alt: 'Honest Engine Repair Service', label: 'No Hidden Charges' },
      ],
    },
    faq: {
      heading: { pre: 'ENGINE REPAIR ', accent: 'FAQ' },
      items: [
        { q: 'How do I know if my engine needs repair?', a: "Warning signs include unusual noises, loss of power, excessive smoke, warning lights, or rough idling. If you notice any of these, it's best to get a diagnostic check right away." },
        { q: 'Do you use genuine parts for engine repair?', a: "Yes, we use genuine or manufacturer-approved parts for every repair, so your engine performs the way it's meant to and lasts longer." },
        { q: 'How long does an engine repair take?', a: "It depends on the issue — a minor repair may take a few hours, while a full engine overhaul can take a few days. We'll give you a clear timeline after diagnosis." },
        { q: 'Is an engine overhaul the same as replacement?', a: "No. An overhaul rebuilds and restores your existing engine's internal parts, while replacement means installing a different engine entirely. We'll recommend whichever makes more sense for your car and budget." },
        { q: 'Do you offer warranty on engine repairs?', a: 'Yes, our engine repairs come with a service warranty. Ask our team for details specific to the work done on your vehicle.' },
      ],
    },
    cta: {
      heading: 'Get Your Engine Running Smoothly Again',
      paragraph: 'Book a diagnostic checkup or ask our specialists a question — call, message us on WhatsApp, or visit our workshop in Uttara.',
    },
  },
};
