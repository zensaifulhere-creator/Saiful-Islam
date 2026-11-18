import type { HeroMediaKind, HeroMediaSource } from '../lib/heroMedia';

export type OccasionCategory = 'clinical' | 'honors' | 'milestones';

export interface OccasionPhoto {
  id: string;
  figure: string;
  title: string;
  occasionLabel: string;
  category: OccasionCategory;
  categoryLabel: string;
  description: string;
  institution: string;
  primarySrc: string;
  fallbackSrc: string;
}

export interface AccordionPillar {
  id: string;
  code: string;
  tag: string;
  title: string;
  summary: string;
  photoId: string;
}

export interface CredentialItem {
  title: string;
  detail: string;
}

export interface CredentialTab {
  id: string;
  index: string;
  label: string;
  headline: string;
  summary: string;
  items: CredentialItem[];
  photoId: string;
  figureCaption: string;
}

export interface ClinicalFaq {
  id: string;
  question: string;
  answer: string;
}

export interface ConsultationModeOption {
  id: string;
  title: string;
  summary: string;
  ctaLabel: string;
  mode: 'in-person' | 'tele';
  photoId: string;
}

export interface BookingStepItem {
  index: string;
  title: string;
  detail: string;
}

export type SiteContentEditableData = Omit<SiteContentData, 'bnOverrides'>;
export type SiteContentBnOverrides = Partial<SiteContentEditableData>;

export interface SiteContentData {
  heroEyebrow: string;
  heroTitle: string;
  heroAccentName: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTrustMarker: string;
  heroMediaSource: HeroMediaSource;
  heroMediaKind: HeroMediaKind;
  heroMediaUrl: string;
  heroMediaUploadId: string;
  bioSectionKicker: string;
  bioHeading: string;
  bioMissionBn: string;
  bioMissionEn: string;
  bioParagraph1: string;
  bioParagraph2: string;
  portraitCaptionTitle: string;
  portraitCaptionSub: string;
  competencies: string[];
  pillarsSectionKicker: string;
  pillarsHeading: string;
  pillarsSubheading: string;
  pillars: AccordionPillar[];
  gallerySectionKicker: string;
  galleryHeading: string;
  galleryLeadTitle: string;
  galleryLeadCopy: string;
  occasions: OccasionPhoto[];
  credentialsSectionKicker: string;
  credentialsHeading: string;
  credentials: CredentialTab[];
  highlightKicker: string;
  highlightTitle: string;
  highlightSummary: string;
  highlightCtaLabel: string;
  highlightPhotoId: string;
  faqs: ClinicalFaq[];
  consultationModes: ConsultationModeOption[];
  bookingSteps: BookingStepItem[];
  connectSectionKicker: string;
  connectHeading: string;
  connectSubheading: string;
  doctorName: string;
  doctorShortName: string;
  doctorTitle: string;
  bmdcNumber: string;
  institution: string;
  phoneDisplay: string;
  email: string;
  cvObjective: string;
  hudBrandLabel: string;
  bnOverrides?: SiteContentBnOverrides;
}

export const DEFAULT_OCCASION_PHOTOS: OccasionPhoto[] = [
  {
    id: 'hospital-building',
    figure: '01',
    title: 'Satkhira Medical College & Hospital',
    occasionLabel: 'Where My Journey Began',
    category: 'milestones',
    categoryLabel: 'Campus & Milestones',
    description:
      'My second home throughout MBBS studies and internship rounds—the campus that shaped my love for patient care.',
    institution: 'Satkhira Medical College · Bangladesh',
    primarySrc: '/images/hospital-building.jpeg',
    fallbackSrc: '/src/assets/images/hospital_building_1794903187243.jpg',
  },
  {
    id: 'hero-portrait',
    figure: '02',
    title: 'Morning Rounds Courtyard',
    occasionLabel: 'Intern Physician',
    category: 'milestones',
    categoryLabel: 'Campus & Milestones',
    description:
      'A quiet pause between morning ward rounds and outpatient clinic hours at Satkhira Medical College & Hospital.',
    institution: 'SMCH Academic Grounds',
    primarySrc: '/images/hero-portrait.jpeg',
    fallbackSrc: '/src/assets/images/hero_portrait_1794903188719.jpg',
  },
  {
    id: 'surgery-action',
    figure: '03',
    title: 'Focused Teamwork in Theatre',
    occasionLabel: 'Operating Room Assistance',
    category: 'clinical',
    categoryLabel: 'Surgical & Clinical',
    description:
      'Standing beside senior surgeons in the operating room—every suture and steady hand dedicated to a patient’s safe recovery.',
    institution: 'Department of General Surgery · SMCH',
    primarySrc: '/images/surgery-action.jpeg',
    fallbackSrc: '/src/assets/images/surgery_action_1794903188766.jpg',
  },
  {
    id: 'surgery-green',
    figure: '04',
    title: 'Prepared for the Sterile Field',
    occasionLabel: 'Operating Theatre',
    category: 'clinical',
    categoryLabel: 'Surgical & Clinical',
    description:
      'Pre-operative scrubbing and sterile gowning under theatre lights, honoring every detail that keeps patients safe.',
    institution: 'Surgical Operation Theatre · SMCH',
    primarySrc: '/images/surgery-green.jpeg',
    fallbackSrc: '/src/assets/images/surgery_green_1794903189081.jpg',
  },
  {
    id: 'clinic-desk',
    figure: '05',
    title: 'Listening at the Outpatient Desk',
    occasionLabel: 'Patient Care Desk',
    category: 'clinical',
    categoryLabel: 'Surgical & Clinical',
    description:
      'Sitting face-to-face with patients—listening carefully to their worries, reviewing charts, and explaining care without rushing.',
    institution: 'Outpatient Department · SMCH',
    primarySrc: '/images/clinic-desk.jpeg',
    fallbackSrc: '/src/assets/images/clinic_desk_1794903191444.jpg',
  },
  {
    id: 'white-coat',
    figure: '06',
    title: 'The White Coat Promise',
    occasionLabel: 'Professional Induction',
    category: 'milestones',
    categoryLabel: 'Campus & Milestones',
    description:
      'Stepping into the white coat with a lifelong promise of kindness, honesty, patient safety, and continuous learning.',
    institution: 'Satkhira Medical College Ceremony',
    primarySrc: '/images/white-coat.jpeg',
    fallbackSrc: '/src/assets/images/white_coat_1794903191544.jpg',
  },
  {
    id: 'certificate-holding',
    figure: '07',
    title: 'Basic Surgical Skills Certification',
    occasionLabel: 'Surgical Workshop',
    category: 'honors',
    categoryLabel: 'Academic & Honors',
    description:
      'Hands-on training milestone mastering surgical knot tying, gentle tissue handling, and clean suturing technique.',
    institution: 'Society of Surgeons of Bangladesh & SMCH',
    primarySrc: '/images/certificate-holding.jpeg',
    fallbackSrc: '/src/assets/images/certificate_holding_1794903189691.jpg',
  },
  {
    id: 'certificate-stage',
    figure: '08',
    title: 'Surgical Skills Stage Recognition',
    occasionLabel: 'Symposium Presentation',
    category: 'honors',
    categoryLabel: 'Academic & Honors',
    description:
      'Receiving our surgical workshop certificate on stage from mentors who inspire us to practice medicine with heart.',
    institution: 'Department of Surgery · SMCH',
    primarySrc: '/images/certificate-stage.jpeg',
    fallbackSrc: '/src/assets/images/certificate_stage_1794903190332.jpg',
  },
  {
    id: 'awards-holding',
    figure: '09',
    title: 'Academic & Campus Distinctions',
    occasionLabel: 'Dual Honor',
    category: 'honors',
    categoryLabel: 'Academic & Honors',
    description:
      'Grateful moments celebrating clinical dedication and community spirit alongside fellow future physicians.',
    institution: 'Satkhira Medical College',
    primarySrc: '/images/awards-holding.jpeg',
    fallbackSrc: '/src/assets/images/awards_holding_1794903191990.jpg',
  },
  {
    id: 'award-stage',
    figure: '10',
    title: 'Annual Convocation Honors',
    occasionLabel: 'Institutional Recognition',
    category: 'honors',
    categoryLabel: 'Academic & Honors',
    description:
      'Sharing an unforgettable convocation milestone with faculty, classmates, and loved ones at SMCH.',
    institution: 'SMCH Auditorium Convocation',
    primarySrc: '/images/award-stage.jpeg',
    fallbackSrc: '/src/assets/images/award_stage_1794903192515.jpg',
  },
];

export const DEFAULT_SITE_CONTENT: SiteContentData = {
  heroEyebrow: 'Satkhira Medical College & Hospital · BMDC Reg. 162503',
  heroTitle: 'Dr. Fariha Ferdousy',
  heroAccentName: 'Munia',
  heroSubtitle:
    'Intern Physician devoted to warm, unhurried patient care, calm surgical precision, and accessible evidence-based medicine for every family.',
  heroPrimaryCta: 'Book Appointment',
  heroSecondaryCta: 'Printable CV',
  heroTrustMarker: 'Satkhira Medical College & Hospital · General Surgery & Emergency Care',
  heroMediaSource: 'none',
  heroMediaKind: 'mp4',
  heroMediaUrl: '',
  heroMediaUploadId: '',
  bioSectionKicker: 'Mission & Story',
  bioHeading: 'Warm Empathy, Guided by Surgical Discipline',
  bioMissionBn:
    '“চিকিৎসার লক্ষ্য - দক্ষতার সাথে রোগ নির্ণয় ও চিকিৎসা দেওয়া এবং আন্ডার প্রিভিলেজ মানুষদের সহযোগিতা করা”',
  bioMissionEn:
    '“My goal in medicine is simple—to diagnose and treat with skill and care, while standing faithfully beside underprivileged communities.”',
  bioParagraph1:
    'Dr. Fariha Ferdousy Munia earned her MBBS from Satkhira Medical College, Bangladesh. Today, as an Intern Doctor at SMCH, she serves across general surgery, inpatient wards, and acute casualty—listening closely to every patient story behind every chart.',
  bioParagraph2:
    'Drawn to general surgery and emergency medicine, she believes great care starts with patience: explaining diagnoses in plain, reassuring words, honoring sterile theatre safety, and making sure no one feels left behind.',
  portraitCaptionTitle: 'Dr. Fariha Ferdousy Munia',
  portraitCaptionSub: 'Intern Physician · Satkhira Medical College & Hospital',
  competencies: [
    'Thoughtful Clinical Diagnosis',
    'Surgical Theatre Assisting',
    'Calm Emergency Triage',
    'Clear Patient Counseling',
    'Gentle Sterile Wound Care',
  ],
  pillarsSectionKicker: 'How I Care',
  pillarsHeading: 'Four Pillars of Everyday Practice',
  pillarsSubheading: 'Choose any chapter below to glimpse the moment behind it.',
  pillars: [
    {
      id: 'pillar-operative',
      code: 'I',
      tag: 'Operative Practice',
      title: 'Surgical Assistance',
      summary:
        'Steady, attentive hands beside senior surgeons in general and emergency procedures—prioritizing gentle tissue care and safety.',
      photoId: 'surgery-action',
    },
    {
      id: 'pillar-theatre',
      code: 'II',
      tag: 'Theatre Readiness',
      title: 'Aseptic Discipline',
      summary:
        'Quiet preparation inside the operating theatre—protecting sterile fields, anticipating instruments, and keeping every patient safe.',
      photoId: 'surgery-green',
    },
    {
      id: 'pillar-outpatient',
      code: 'III',
      tag: 'Outpatient Care',
      title: 'Empathetic Listening',
      summary:
        'Taking time to hear each patient’s concerns, answer family questions honestly, and offer clear guidance without medical jargon.',
      photoId: 'clinic-desk',
    },
    {
      id: 'pillar-oath',
      code: 'IV',
      tag: 'Medical Integrity',
      title: 'The White Coat Promise',
      summary:
        'Staying humble, keeping up with modern evidence-based care, and showing up wholeheartedly for underserved communities.',
      photoId: 'white-coat',
    },
  ],
  gallerySectionKicker: 'Visual Chronicle',
  galleryHeading: 'Ten Cherished Clinical Moments',
  galleryLeadTitle: 'From Ward to Theatre',
  galleryLeadCopy:
    'Glide through real moments from campus mornings, surgical training, outpatient conversations, and shared academic milestones.',
  occasions: DEFAULT_OCCASION_PHOTOS,
  credentialsSectionKicker: 'Background & Training',
  credentialsHeading: 'Training, Hands-On Skills & Honors',
  credentials: [
    {
      id: 'education',
      index: '01',
      label: 'Education & Registration',
      headline: 'Academic Foundation',
      summary:
        'Medical training in Bangladesh and official national medical council registration.',
      items: [
        {
          title: 'Bachelor of Medicine, Bachelor of Surgery (MBBS)',
          detail: 'Satkhira Medical College (2015 – 2021)',
        },
        { title: 'BMDC Registration', detail: '162503 (Registered Physician)' },
        { title: 'Current Role', detail: 'Intern Doctor · Satkhira Medical College & Hospital' },
      ],
      photoId: 'hospital-building',
      figureCaption: 'Satkhira Medical College & Hospital Campus',
    },
    {
      id: 'rotations',
      index: '02',
      label: 'Clinical Rotations',
      headline: 'Departmental Experience',
      summary:
        'Hands-on inpatient ward, outpatient clinic, and emergency rounds across core specialties.',
      items: [
        { title: 'General Surgery', detail: 'Pre-op preparation, theatre assisting & recovery care' },
        { title: 'Internal Medicine', detail: 'Daily ward workups & long-term illness support' },
        { title: 'Obstetrics & Gynecology', detail: 'Antenatal guidance, delivery room & maternal care' },
        { title: 'Pediatrics & Casualty', detail: 'Urgent pediatric triage & acute stabilization' },
      ],
      photoId: 'clinic-desk',
      figureCaption: 'Outpatient Consultation & Ward Practice',
    },
    {
      id: 'procedures',
      index: '03',
      label: 'Surgical Procedures',
      headline: 'Core Bedside & Operative Skills',
      summary:
        'Dependable, gentle execution of essential bedside, emergency, and minor surgical procedures.',
      items: [
        { title: 'Wound Care & Suturing', detail: 'Clean debridement, local anesthesia & layered closure' },
        { title: 'Vascular & Tube Access', detail: 'Gentle IV cannulation, blood draw, NG tube & catheter care' },
        { title: 'Theatre Assisting', detail: 'Retraction, knot tying & coordinated surgical support' },
      ],
      photoId: 'surgery-action',
      figureCaption: 'Operating Theatre Assistance · SMCH',
    },
    {
      id: 'certifications',
      index: '04',
      label: 'Certifications & Research',
      headline: 'Clinical Standards & Audit',
      summary: 'Accredited surgical skills workshops and hospital quality-improvement audits.',
      items: [
        {
          title: 'Basic Surgical Skills (BSS)',
          detail: 'Society of Surgeons of Bangladesh · SMCH Workshop',
        },
        {
          title: 'Basic Life Support (BLS) & GCP',
          detail: 'American Heart Association · NIHR Good Clinical Practice',
        },
        {
          title: 'Emergency Laparotomy Outcomes (2023)',
          detail: 'Poster Presentation at SMCH Surgical Forum',
        },
        {
          title: 'Antibiotic Prophylaxis Compliance Audit (2024)',
          detail: 'Surgical Ward Quality Improvement Review',
        },
      ],
      photoId: 'certificate-stage',
      figureCaption: 'Basic Surgical Skills Symposium Recognition',
    },
    {
      id: 'memberships',
      index: '05',
      label: 'Memberships & Honors',
      headline: 'Community & Distinctions',
      summary:
        'Active involvement in national medical associations and college honors.',
      items: [
        { title: 'Bangladesh Medical Association (BMA)', detail: 'Active Member' },
        { title: 'Society of Surgeons of Bangladesh (SSB)', detail: 'Associate Member' },
        {
          title: 'Satkhira Medical College Alumni',
          detail: 'Academic & Cultural Honors Recipient',
        },
      ],
      photoId: 'awards-holding',
      figureCaption: 'Institutional Honors & Awards',
    },
  ],
  highlightKicker: 'Care Philosophy',
  highlightTitle: 'Skilled Medicine, Explained Like Family',
  highlightSummary:
    'Whether in Bengali or English, every visit gives you unhurried listening, clear next steps, and thoughtful surgical or medical follow-up.',
  highlightCtaLabel: 'Book Appointment',
  highlightPhotoId: 'surgery-action',
  faqs: [
    {
      id: 'faq-1',
      question: 'How do I book a visit or online consultation?',
      answer:
        'Click “Book Appointment” in the top corner or pick any quick slot on the final screen. Signing in with Google lets you track confirmation updates and keep everything saved safely.',
    },
    {
      id: 'faq-2',
      question: 'Where can I see my prescriptions and share lab reports?',
      answer:
        'Once signed in, open “My Dashboard” from the top menu. You can read every prescription or visit note from Dr. Fariha and upload photos or links of your test reports anytime.',
    },
    {
      id: 'faq-3',
      question: 'Can I book either an in-person hospital visit or a video/phone review?',
      answer:
        'Yes! You can choose In-Person OPD & Ward coordination at Satkhira Medical College & Hospital, or choose Tele-Consultation to review reports and follow-up plans from home.',
    },
    {
      id: 'faq-4',
      question: 'What kind of health concerns does Dr. Fariha help with most?',
      answer:
        'General surgical follow-ups, sterile wound & dressing care, minor surgical assessments, acute triage guidance, and compassionate primary health counseling.',
    },
  ],
  consultationModes: [
    {
      id: 'mode-inperson',
      title: 'In-Person Visits',
      summary:
        'Face-to-face clinical checkups, post-operative wound & stitch care, and inpatient coordination at Satkhira Medical College & Hospital.',
      ctaLabel: 'Book In-Person Visit',
      mode: 'in-person',
      photoId: 'clinic-desk',
    },
    {
      id: 'mode-tele',
      title: 'Tele-Consultations',
      summary:
        'Thoughtful report reviews, medicine guidance, and post-discharge check-ins from home so distance never delays care.',
      ctaLabel: 'Book Tele-Consultation',
      mode: 'tele',
      photoId: 'white-coat',
    },
  ],
  bookingSteps: [
    {
      index: '01',
      title: 'Unhurried Listening',
      detail: 'Understanding your symptoms, history, and what matters most to you.',
    },
    {
      index: '02',
      title: 'Clear Assessment',
      detail: 'Reviewing test reports, imaging, and whether surgical care is needed.',
    },
    {
      index: '03',
      title: 'Personal Care Plan',
      detail: 'Simple medication and care instructions saved straight to your dashboard.',
    },
    {
      index: '04',
      title: 'Warm Follow-Up',
      detail: 'Checking in on your healing, dressings, and peace of mind.',
    },
  ],
  connectSectionKicker: 'Here For You',
  connectHeading: 'Let’s Talk About Your Care With Warmth & Clarity',
  connectSubheading:
    'Pick a convenient date and time below, open your personal health folder, or download a formatted CV summary.',
  doctorName: 'Dr. Fariha Ferdousy Munia',
  doctorShortName: 'Dr. Fariha Ferdousy',
  doctorTitle: 'Intern Physician · MBBS (SMCH)',
  bmdcNumber: '162503',
  institution: 'Satkhira Medical College & Hospital',
  phoneDisplay: '01979-907027',
  email: '',
  cvObjective:
    'Compassionate MBBS graduate and Intern Doctor at Satkhira Medical College & Hospital dedicated to general surgery, calm emergency triage, and dignified, evidence-based healthcare for underserved communities.',
  hudBrandLabel: 'Dr. Fariha Ferdousy',
};

export const DEFAULT_BN_SITE_CONTENT: SiteContentEditableData = {
  heroEyebrow: 'সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতাল · বিএমডিসি রেজি. ১৬২৫০৩',
  heroTitle: 'ডা. ফারিহা ফেরদৌসী',
  heroAccentName: 'মুনিয়া',
  heroSubtitle:
    'আন্তরিক যত্ন, নিখুঁত সার্জিক্যাল দক্ষতা এবং বিজ্ঞানসম্মত চিকিৎসার মাধ্যমে প্রতিটি মানুষ ও পরিবারের পাশে থাকতে প্রতিশ্রুতিবদ্ধ একজন ইন্টার্ন চিকিৎসক।',
  heroPrimaryCta: 'অ্যাপয়েন্টমেন্ট নিন',
  heroSecondaryCta: 'সিভি দেখুন',
  heroTrustMarker: 'সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতাল · জেনারেল সার্জারি ও জরুরি চিকিৎসা',
  heroMediaSource: 'none',
  heroMediaKind: 'mp4',
  heroMediaUrl: '',
  heroMediaUploadId: '',
  bioSectionKicker: 'পরিচিতি ও মূল লক্ষ্য',
  bioHeading: 'আন্তরিক মমতা ও নিখুঁত সার্জিক্যাল যত্ন',
  bioMissionBn:
    '“চিকিৎসার লক্ষ্য - দক্ষতার সাথে রোগ নির্ণয় ও চিকিৎসা দেওয়া এবং আন্ডার প্রিভেলেইজ মানুষদের সহযোগিতা করা”',
  bioMissionEn:
    '“চিকিৎসার লক্ষ্য - দক্ষতার সাথে রোগ নির্ণয় ও চিকিৎসা দেওয়া এবং সুবিধাবঞ্চিত মানুষদের পাশে দাঁড়ানো।”',
  bioParagraph1:
    'ডা. ফারিহা ফেরদৌসী মুনিয়া সাতক্ষীরা মেডিকেল কলেজ থেকে এমবিবিএস সম্পন্ন করেছেন। বর্তমানে তিনি সাতক্ষীরা মেডিকেল কলেজ হাসপাতালে ইন্টার্ন চিকিৎসক হিসেবে জেনারেল সার্জারি, ওয়ার্ড এবং জরুরি বিভাগে নিয়মিত রোগীদের সেবা দিচ্ছেন।',
  bioParagraph2:
    'জেনারেল সার্জারি ও জরুরি চিকিৎসায় তার বিশেষ আগ্রহ রয়েছে। তার বিশ্বাস—সফল চিকিৎসার প্রথম ধাপ হলো রোগীর কথা মনোযোগ দিয়ে শোনা, সহজ বাংলায় রোগের অবস্থা বুঝিয়ে বলা এবং অসহায় মানুষের পাশে নিঃস্বার্থভাবে থাকা।',
  portraitCaptionTitle: 'ডা. ফারিহা ফেরদৌসী মুনিয়া',
  portraitCaptionSub: 'ইন্টার্ন চিকিৎসক · সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতাল',
  competencies: [
    'যত্নসহকারে রোগ নির্ণয়',
    'অপারেশন থিয়েটারে সহযোগিতা',
    'দ্রুত জরুরি চিকিৎসা ব্যবস্থাপনা',
    'সহজ ভাষায় রোগীর পরামর্শ',
    'জীবাণুমুক্ত ক্ষত ও সেলাই পরিচর্যা',
  ],
  pillarsSectionKicker: 'সেবার ধরন',
  pillarsHeading: 'প্রতিদিনের চিকিৎসায় চারটি মূল স্তম্ভ',
  pillarsSubheading: 'যেকোনো ধাপে ক্লিক করে পেছনের গল্প ও মুহূর্তটি দেখে নিন।',
  pillars: [
    {
      id: 'pillar-operative',
      code: '১ম',
      tag: 'অপারেশন থিয়েটার',
      title: 'সার্জিক্যাল সহযোগিতা',
      summary:
        'জেনারেল ও জরুরি অপারেশনে সিনিয়র সার্জনদের পাশে থেকে অত্যন্ত যত্ন ও সতর্কতার সাথে টিস্যু সুরক্ষা এবং অস্ত্রোপচারে সহায়তা করা।',
      photoId: 'surgery-action',
    },
    {
      id: 'pillar-theatre',
      code: '২য়',
      tag: 'থিয়েটার প্রস্তুতি',
      title: 'জীবাণুমুক্ত শৃঙ্খলা',
      summary:
        'অপারেশনের আগে স্টেরাইল ফিল্ড রক্ষা, যন্ত্রপাতি প্রস্তুত রাখা এবং রোগীর সর্বোচ্চ নিরাপত্তা নিশ্চিত করার প্রতি অটল মনোযোগ।',
      photoId: 'surgery-green',
    },
    {
      id: 'pillar-outpatient',
      code: '৩য়',
      tag: 'বহির্বিভাগ সেবা',
      title: 'সহানুভূতিশীল কথা শোনা',
      summary:
        'তাড়াহুড়ো না করে রোগী ও পরিবারের প্রতিটি প্রশ্ন শোনা এবং জটিল চিকিৎসা পরিভাষা ছাড়া সহজ ভাষায় সমাধান বুঝিয়ে দেওয়া।',
      photoId: 'clinic-desk',
    },
    {
      id: 'pillar-oath',
      code: '৪র্থ',
      tag: 'চিকিৎসকের শপথ',
      title: 'সাদা অ্যাপ্রোনের অঙ্গীকার',
      summary:
        'সততা বজায় রাখা, নতুন চিকিৎসা জ্ঞান অর্জন করে চলা এবং সমাজের সুবিধাবঞ্চিত মানুষদের সেবায় নিজেকে নিয়োজিত রাখা।',
      photoId: 'white-coat',
    },
  ],
  gallerySectionKicker: 'ছবির গল্প',
  galleryHeading: 'স্মরণীয় দশটি চিকিৎসা মুহূর্ত',
  galleryLeadTitle: 'ওয়ার্ড থেকে অপারেশন থিয়েটার',
  galleryLeadCopy:
    'মেডিকেল ক্যাম্পাস, অপারেশন থিয়েটারের প্রশিক্ষণ, রোগীদের সাথে কথা বলা এবং সম্মাননা অর্জনের বাস্তব মুহূর্তগুলো ঘুরে দেখুন।',
  occasions: [
    {
      id: 'hospital-building',
      figure: '০১',
      title: 'সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতাল',
      occasionLabel: 'পথচলার শুরু',
      category: 'milestones',
      categoryLabel: 'ক্যাম্পাস ও মাইলফলক',
      description:
        'এমবিবিএস শিক্ষাজীবন ও ইন্টার্নশিপের প্রতিটি দিন যেখানে কেটেছে—সেবা শেখার আমার সবচেয়ে প্রিয় প্রাঙ্গণ।',
      institution: 'সাতক্ষীরা মেডিকেল কলেজ · বাংলাদেশ',
      primarySrc: '/images/hospital-building.jpeg',
      fallbackSrc: '/src/assets/images/hospital_building_1794903187243.jpg',
    },
    {
      id: 'hero-portrait',
      figure: '০২',
      title: 'সকালের রাউন্ডের ফাঁকে',
      occasionLabel: 'ইন্টার্ন চিকিৎসক',
      category: 'milestones',
      categoryLabel: 'ক্যাম্পাস ও মাইলফলক',
      description:
        'সকালের ওয়ার্ড রাউন্ড আর বহির্বিভাগে রোগী দেখার ব্যস্ত সময়ের মাঝে ক্যাম্পাসের আঙিনায় একটি শান্ত মুহূর্ত।',
      institution: 'এসএমসিএইচ ক্যাম্পাস প্রাঙ্গণ',
      primarySrc: '/images/hero-portrait.jpeg',
      fallbackSrc: '/src/assets/images/hero_portrait_1794903188719.jpg',
    },
    {
      id: 'surgery-action',
      figure: '০৩',
      title: 'অপারেশন থিয়েটারে দলগত যত্ন',
      occasionLabel: 'অস্ত্রোপচার সহায়তা',
      category: 'clinical',
      categoryLabel: 'সার্জারি ও ক্লিনিক্যাল',
      description:
        'সিনিয়র সার্জনদের সাথে অপারেশন টেবিলে প্রতিটি সেলাই ও ধাপে মনোযোগ—যেন রোগী নিরাপদে সুস্থ হয়ে ফিরে যান।',
      institution: 'সার্জারি বিভাগ · এসএমসিএইচ',
      primarySrc: '/images/surgery-action.jpeg',
      fallbackSrc: '/src/assets/images/surgery_action_1794903188766.jpg',
    },
    {
      id: 'surgery-green',
      figure: '০৪',
      title: 'জীবাণুমুক্ত প্রস্তুতি',
      occasionLabel: 'অপারেশন থিয়েটার',
      category: 'clinical',
      categoryLabel: 'সার্জারি ও ক্লিনিক্যাল',
      description:
        'অস্ত্রোপচারের আগে সম্পূর্ণ জীবাণুমুক্ত গাউন ও প্রস্তুতি—রোগীর সংক্রমণমুক্ত সুস্থতার প্রথম সুরক্ষা।',
      institution: 'সার্জিক্যাল অপারেশন থিয়েটার · এসএমসিএইচ',
      primarySrc: '/images/surgery-green.jpeg',
      fallbackSrc: '/src/assets/images/surgery_green_1794903189081.jpg',
    },
    {
      id: 'clinic-desk',
      figure: '০৫',
      title: 'বহির্বিভাগে রোগীর কথা শোনা',
      occasionLabel: 'রোগী সেবা ডেস্ক',
      category: 'clinical',
      categoryLabel: 'সার্জারি ও ক্লিনিক্যাল',
      description:
        'রোগীর সামনে বসে ধৈর্য নিয়ে কষ্টের কথা শোনা, পরীক্ষার রিপোর্ট দেখা এবং আন্তরিকভাবে চিকিৎসা বুঝিয়ে দেওয়া।',
      institution: 'বহির্বিভাগ · এসএমসিএইচ',
      primarySrc: '/images/clinic-desk.jpeg',
      fallbackSrc: '/src/assets/images/clinic_desk_1794903191444.jpg',
    },
    {
      id: 'white-coat',
      figure: '০৬',
      title: 'সাদা অ্যাপ্রোনের শপথ',
      occasionLabel: 'পেশাগত অভিষেক',
      category: 'milestones',
      categoryLabel: 'ক্যাম্পাস ও মাইলফলক',
      description:
        'রোগীর নিরাপত্তা, মানবিক মূল্যবোধ এবং আজীবন চিকিৎসা শেখার শপথ নিয়ে সাদা অ্যাপ্রোন গায়ে জড়িয়ে নেওয়ার দিন।',
      institution: 'সাতক্ষীরা মেডিকেল কলেজ অনুষ্ঠান',
      primarySrc: '/images/white-coat.jpeg',
      fallbackSrc: '/src/assets/images/white_coat_1794903191544.jpg',
    },
    {
      id: 'certificate-holding',
      figure: '০৭',
      title: 'বেসিক সার্জিক্যাল স্কিলস সনদ',
      occasionLabel: 'সার্জিক্যাল কর্মশালা',
      category: 'honors',
      categoryLabel: 'শিক্ষা ও সম্মাননা',
      description:
        'সার্জারির মূল নট বাঁধা, নিখুঁত সেলাই এবং কোমল টিস্যু হ্যান্ডলিংয়ের হাতে-কলমে প্রশিক্ষণ সনদ অর্জন।',
      institution: 'সোসাইটি অব সার্জনস অব বাংলাদেশ ও এসএমসিএইচ',
      primarySrc: '/images/certificate-holding.jpeg',
      fallbackSrc: '/src/assets/images/certificate_holding_1794903189691.jpg',
    },
    {
      id: 'certificate-stage',
      figure: '০৮',
      title: 'মঞ্চে সার্জিক্যাল প্রশিক্ষণ স্বীকৃতি',
      occasionLabel: 'সিম্পোজিয়াম সম্মাননা',
      category: 'honors',
      categoryLabel: 'শিক্ষা ও সম্মাননা',
      description:
        'শ্রদ্ধেয় সার্জারি শিক্ষকদের হাত থেকে বেসিক সার্জিক্যাল স্কিলস সনদ গ্রহণের অনুপ্রেরণাদায়ক মুহূর্ত।',
      institution: 'সার্জারি বিভাগ · এসএমসিএইচ',
      primarySrc: '/images/certificate-stage.jpeg',
      fallbackSrc: '/src/assets/images/certificate_stage_1794903190332.jpg',
    },
    {
      id: 'awards-holding',
      figure: '০৯',
      title: 'শিক্ষা ও সহশিক্ষা সম্মাননা',
      occasionLabel: 'যুগ্ম সম্মাননা',
      category: 'honors',
      categoryLabel: 'শিক্ষা ও সম্মাননা',
      description:
        'ক্যাম্পাসের একাডেমিক উৎকর্ষ এবং সহপাঠীদের সাথে মানবিক উদ্যোগের স্বীকৃতি হিসেবে প্রাপ্ত পুরস্কার।',
      institution: 'সাতক্ষীরা মেডিকেল কলেজ',
      primarySrc: '/images/awards-holding.jpeg',
      fallbackSrc: '/src/assets/images/awards_holding_1794903191990.jpg',
    },
    {
      id: 'award-stage',
      figure: '১০',
      title: 'বার্ষিক পুরস্কার বিতরণী মঞ্চ',
      occasionLabel: 'প্রাতিষ্ঠানিক সম্মাননা',
      category: 'honors',
      categoryLabel: 'শিক্ষা ও সম্মাননা',
      description:
        'বার্ষিক একাডেমিক ও সাংস্কৃতিক সপ্তাহে শিক্ষক ও সহপাঠীদের উপস্থিতিতে মঞ্চে সম্মাননা গ্রহণের আনন্দঘন স্মৃতি।',
      institution: 'এসএমসিএইচ অডিটোরিয়াম',
      primarySrc: '/images/award-stage.jpeg',
      fallbackSrc: '/src/assets/images/award_stage_1794903192515.jpg',
    },
  ],
  credentialsSectionKicker: 'শিক্ষা ও দক্ষতা',
  credentialsHeading: 'প্রশিক্ষণ, অভিজ্ঞতা ও সম্মাননা',
  credentials: [
    {
      id: 'education',
      index: '০১',
      label: 'শিক্ষাগত যোগ্যতা ও নিবন্ধন',
      headline: 'প্রাতিষ্ঠানিক ভিত্তি',
      summary: 'বাংলাদেশে এমবিবিএস ডিগ্রি এবং জাতীয় মেডিকেল কাউন্সিল নিবন্ধন।',
      items: [
        {
          title: 'ব্যাচেলর অব মেডিসিন, ব্যাচেলর অব সার্জারি (এমবিবিএস)',
          detail: 'সাতক্ষীরা মেডিকেল কলেজ (২০১৫ – ২০২১)',
        },
        { title: 'বিএমডিসি নিবন্ধন', detail: '১৬২৫০৩ (নিবন্ধিত চিকিৎসক)' },
        { title: 'বর্তমান পদবি', detail: 'ইন্টার্ন চিকিৎসক · সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতাল' },
      ],
      photoId: 'hospital-building',
      figureCaption: 'সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতাল প্রাঙ্গণ',
    },
    {
      id: 'rotations',
      index: '০২',
      label: 'বিভাগীয় ক্লিনিক্যাল রোটেইশন',
      headline: 'হাসপাতালের বাস্তব অভিজ্ঞতা',
      summary: 'ওয়ার্ড, বহির্বিভাগ ও জরুরি বিভাগে সমন্বিত রোগী সেবার অভিজ্ঞতা।',
      items: [
        { title: 'জেনারেল সার্জারি', detail: 'অপারেশন পূর্ব প্রস্তুতি, থিয়েটার সহায়তা ও পরবর্তী যত্ন' },
        { title: 'মেডিসিন বিভাগ', detail: 'ওয়ার্ডে রোগ নির্ণয় ও দীর্ঘমেয়াদী রোগের চিকিৎসা' },
        { title: 'গাইনি ও প্রসূতি বিদ্যা', detail: 'গর্ভকালীন পরামর্শ, প্রসব সহায়তা ও মাতৃসুরক্ষা' },
        { title: 'শিশু ও জরুরি বিভাগ', detail: 'শিশু রোগীর দ্রুত মূল্যায়ন ও তাৎক্ষণিক চিকিৎসা' },
      ],
      photoId: 'clinic-desk',
      figureCaption: 'বহির্বিভাগ পরামর্শ ও ওয়ার্ড সেবা',
    },
    {
      id: 'procedures',
      index: '০৩',
      label: 'সার্জিক্যাল ও ক্লিনিক্যাল দক্ষতা',
      headline: 'জরুরি ও ওয়ার্ড প্রসিডিউর',
      summary: 'যত্ন ও নিরাপদ কৌশলে প্রয়োজনীয় শয্যাপাশের ও মাইনর সার্জিক্যাল কাজ সম্পাদন।',
      items: [
        { title: 'ক্ষত পরিষ্কার ও সেলাই', detail: 'জীবাণুমুক্ত ড্রেসিং, লোকাল অ্যানেস্থেশিয়া ও লেয়ার ক্লোজার' },
        { title: 'ক্যানুলা ও টিউব ব্যবস্থাপনা', detail: 'আইভি ক্যানুলেশন, রক্ত সংগ্রহ, এনজি টিউব ও ক্যাথেটার' },
        { title: 'অপারেশন থিয়েটার সহায়তা', detail: 'রিট্র্যাকশন, নট বাঁধা ও সার্জিক্যাল টিম সাপোর্ট' },
      ],
      photoId: 'surgery-action',
      figureCaption: 'অপারেশন থিয়েটার সহায়তা · এসএমসিএইচ',
    },
    {
      id: 'certifications',
      index: '০৪',
      label: 'সার্টিফিকেশন ও গবেষণা',
      headline: 'পেশাগত মান ও অডিট',
      summary: 'স্বীকৃত সার্জিক্যাল প্রশিক্ষণ ও হাসপাতালের মানোন্নয়ন গবেষণা।',
      items: [
        {
          title: 'বেসিক সার্জিক্যাল স্কিলস (BSS)',
          detail: 'সোসাইটি অব সার্জনস অব বাংলাদেশ · এসএমসিএইচ কর্মশালা',
        },
        {
          title: 'বেসিক লাইফ সাপোর্ট (BLS) ও GCP',
          detail: 'আমেরিকান হার্ট অ্যাসোসিয়েশন · এনআইএইচআর ক্লিনিক্যাল প্র্যাকটিস',
        },
        {
          title: 'ইমার্জেন্সি ল্যাপারোটমি ফলাফল (২০২৩)',
          detail: 'এসএমসিএইচ সার্জিক্যাল ফোরামে পোস্টার উপস্থাপনা',
        },
        {
          title: 'অ্যান্টিবায়োটিক প্রোফিল্যাক্সিস অডিট (২০২৪)',
          detail: 'সার্জারি ওয়ার্ড মানোন্নয়ন পর্যালোচনা',
        },
      ],
      photoId: 'certificate-stage',
      figureCaption: 'সার্জিক্যাল স্কিলস সম্মাননা মঞ্চ',
    },
    {
      id: 'memberships',
      index: '০৫',
      label: 'সদস্যপদ ও সম্মাননা',
      headline: 'পেশাগত সংযোগ ও স্বীকৃতি',
      summary: 'জাতীয় চিকিৎসা সংগঠনের সদস্যপদ এবং প্রাতিষ্ঠানিক সম্মাননা।',
      items: [
        { title: 'বাংলাদেশ মেডিকেল অ্যাসোসিয়েশন (BMA)', detail: 'সক্রিয় সদস্য' },
        { title: 'সোসাইটি অব সার্জনস অব বাংলাদেশ (SSB)', detail: 'সহযোগী সদস্য' },
        {
          title: 'সাতক্ষীরা মেডিকেল কলেজ অ্যালামনাই',
          detail: 'একাডেমিক ও সাংস্কৃতিক সম্মাননা প্রাপ্ত',
        },
      ],
      photoId: 'awards-holding',
      figureCaption: 'প্রাতিষ্ঠানিক পুরস্কার ও স্বীকৃতি',
    },
  ],
  highlightKicker: 'চিকিৎসা দর্শন',
  highlightTitle: 'দক্ষ চিকিৎসা, পরিবারের মতো যত্ন',
  highlightSummary:
    'বাংলা কিংবা ইংরেজি—প্রতিটি পরামর্শেই পাবেন ধৈর্য ধরে কথা শোনার পরিবেশ, সহজ সমাধান এবং পরবর্তী সুস্থতার সঠিক দিকনির্দেশনা।',
  highlightCtaLabel: 'অ্যাপয়েন্টমেন্ট নিন',
  highlightPhotoId: 'surgery-action',
  faqs: [
    {
      id: 'faq-1',
      question: 'কীভাবে সরাসরি বা অনলাইন পরামর্শের অ্যাপয়েন্টমেন্ট নেব?',
      answer:
        'উপরে থাকা “অ্যাপয়েন্টমেন্ট নিন” বোতামে ক্লিক করুন অথবা শেষ পেজে পছন্দের তারিখ ও সময় বেছে নিন। গুগল দিয়ে সাইন ইন করলে আপনার বুকিংয়ের অবস্থা ড্যাশবোর্ডে সংরক্ষিত থাকবে।',
    },
    {
      id: 'faq-2',
      question: 'আমার প্রেসক্রিপশন ও টেস্টের রিপোর্ট কোথায় দেখতে পারব?',
      answer:
        'সাইন ইন করার পর উপরের “আমার ড্যাশবোর্ড” থেকে ডা. ফারিহার দেওয়া প্রেসক্রিপশন, পরামর্শ এবং আপনার নিজস্ব ল্যাব রিপোর্টের ছবি বা লিংক যেকোনো সময় দেখতে ও সংরক্ষণ করতে পারবেন।',
    },
    {
      id: 'faq-3',
      question: 'হাসপাতালে সরাসরি দেখানো এবং টেলি-কনসাল্টেশন—দুই সুবিধাই কি আছে?',
      answer:
        'হ্যাঁ! আপনি সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতালে সরাসরি দেখা করতে পারেন অথবা ঘরে বসেই টেলি-কনসাল্টেশনের মাধ্যমে রিপোর্ট দেখিয়ে পরামর্শ নিতে পারেন।',
    },
    {
      id: 'faq-4',
      question: 'ডা. ফারিহা মূলত কোন ধরনের স্বাস্থ্যসমস্যায় পরামর্শ দেন?',
      answer:
        'জেনারেল সার্জারি পরবর্তী ফলো-আপ, জীবাণুমুক্ত ক্ষত ও ড্রেসিং পরিচর্যা, মাইনর সার্জিক্যাল মূল্যায়ন, জরুরি প্রাথমিক দিকনির্দেশনা এবং সাধারণ রোগের যত্নশীল চিকিৎসা পরামর্শ।',
    },
  ],
  consultationModes: [
    {
      id: 'mode-inperson',
      title: 'সরাসরি সাক্ষাৎ',
      summary:
        'সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতালে মুখোমুখি স্বাস্থ্য পরীক্ষা, অপারেশন পরবর্তী ক্ষত ও সেলাই পরিচর্যা এবং ওয়ার্ড সমন্বয়।',
      ctaLabel: 'সরাসরি ভিজিট বুক করুন',
      mode: 'in-person',
      photoId: 'clinic-desk',
    },
    {
      id: 'mode-tele',
      title: 'টেলি-কনসাল্টেশন',
      summary:
        'দূরত্ব যেন চিকিৎসায় বাধা না হয়—ঘরে বসেই ল্যাব রিপোর্ট পর্যালোচনা, ওষুধের পরামর্শ ও ফলো-আপ সেবা নিন।',
      ctaLabel: 'টেলি-কনসাল্টেশন বুক করুন',
      mode: 'tele',
      photoId: 'white-coat',
    },
  ],
  bookingSteps: [
    {
      index: '০১',
      title: 'মনোযোগ দিয়ে শোনা',
      detail: 'আপনার কষ্ট, পূর্বের ইতিহাস এবং দুশ্চিন্তার কথা সময় নিয়ে জানা।',
    },
    {
      index: '০২',
      title: 'সহজ রোগ নির্ণয়',
      detail: 'ল্যাব রিপোর্ট, পরীক্ষা ও অপারেশনের প্রয়োজন আছে কিনা তা পরিষ্কারভাবে যাচাই।',
    },
    {
      index: '০৩',
      title: 'যত্ন ও প্রেসক্রিপশন',
      detail: 'সহজ ভাষায় ওষুধ ও পথ্যের নিয়মাবলি সরাসরি আপনার ড্যাশবোর্ডে সংরক্ষণ।',
    },
    {
      index: '০৪',
      title: 'নিয়মিত খোঁজখবর',
      detail: 'সুস্থ হয়ে ওঠা পর্যন্ত ড্রেসিং, ফলো-আপ ও সুস্থতার পাশে থাকা।',
    },
  ],
  connectSectionKicker: 'পাশেই আছি',
  connectHeading: 'আন্তরিকতা ও স্পষ্টতার সাথে আপনার স্বাস্থ্য পরামর্শ',
  connectSubheading:
    'নিচ থেকে সুবিধাজনক দিন ও সময় বেছে নিন, আপনার রোগীর ড্যাশবোর্ড খুলুন অথবা সিভি ডাউনলোড করুন।',
  doctorName: 'ডা. ফারিহা ফেরদৌসী মুনিয়া',
  doctorShortName: 'ডা. ফারিহা ফেরদৌসী',
  doctorTitle: 'ইন্টার্ন চিকিৎসক · এমবিবিএস (এসএমসিএইচ)',
  bmdcNumber: '১৬২৫০৩',
  institution: 'সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতাল',
  phoneDisplay: '01979-907027',
  email: '',
  cvObjective:
    'সাতক্ষীরা মেডিকেল কলেজ ও হাসপাতালের এমবিবিএস ও ইন্টার্ন চিকিৎসক—জেনারেল সার্জারি, জরুরি চিকিৎসা এবং সুবিধাবঞ্চিত মানুষের জন্য মানবিক ও বিজ্ঞানসম্মত স্বাস্থ্যসেবা নিশ্চিত করতে নিবেদিত।',
  hudBrandLabel: 'ডা. ফারিহা ফেরদৌসী',
};

export const APPOINTMENT_SLOTS = [
  '09:30 AM',
  '11:00 AM',
  '02:30 PM',
  '04:30 PM',
  '06:30 PM',
];

export const SECTION_META = [
  { id: 'hero', index: '01', label: 'Overview', labelBn: 'পরিচিতি' },
  { id: 'mission', index: '02', label: 'Mission', labelBn: 'মূল লক্ষ্য' },
  { id: 'pillars', index: '03', label: 'Clinical Focus', labelBn: 'সেবার ধরন' },
  { id: 'gallery', index: '04', label: 'Ten Occasions', labelBn: 'দশটি মুহূর্ত' },
  { id: 'credentials', index: '05', label: 'Credentials', labelBn: 'যোগ্যতা ও তথ্য' },
  { id: 'connect', index: '06', label: 'Connect', labelBn: 'যোগাযোগ' },
];
