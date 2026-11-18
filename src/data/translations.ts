export type SiteLanguage = 'en' | 'bn';

export interface UiDictionary {
  nav: {
    bookAppointment: string;
    bookShort: string;
    signIn: string;
    adminStudio: string;
    myDashboard: string;
    switchChapterAria: string;
    languageSwitcherAria: string;
    brandShortMobile: string;
    jumpToPrefix: string;
  };
  hero: {
    explorePortfolio: string;
    scrollCue: string;
    bmdcPrefix: string;
  };
  bio: {
    missionLabel: string;
    coreFocusHeading: string;
    inspectPortraitAria: string;
  };
  pillars: {
    inspectMoment: string;
  };
  gallery: {
    allPrefix: string;
    clinicalFilter: string;
    honorsFilter: string;
    milestonesFilter: string;
    curatedCountSuffix: string;
    swipeToExplore: string;
    prevAria: string;
    nextAria: string;
  };
  credentials: {
    tabCredentials: string;
    tabFaqs: string;
    tabVisits: string;
    photoEvidence: string;
    hospitalOpd: string;
    remoteReview: string;
    inspectSpotlightAria: string;
  };
  footer: {
    durationTag: string;
    inPersonShort: string;
    teleCareShort: string;
    confirmSelectedSlot: string;
    openMedicalRecords: string;
    signInForRecords: string;
    navMission: string;
    navClinicalCare: string;
    navTenOccasions: string;
    navPrintableCv: string;
    navAdminStudio: string;
    copyEmailAria: string;
    copiedLabel: string;
  };
  drawer: {
    kickerPrefix: string;
    title: string;
    closeAria: string;
    signInTitle: string;
    signInBody: string;
    signInBtn: string;
    connectingBtn: string;
    savedLabel: string;
    requestedTitle: string;
    referenceLabel: string;
    patientLabel: string;
    modeLabel: string;
    dateSlotLabel: string;
    phoneLabel: string;
    viewDashboardBtn: string;
    bookAnotherBtn: string;
    consultTypeLabel: string;
    inPersonOption: string;
    teleOption: string;
    preferredDateLabel: string;
    selectSlotLabel: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    phoneInputLabel: string;
    emailInputLabel: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    confirmRequestBtn: string;
    submittingBtn: string;
    submitError: string;
    modeDisplayInPerson: string;
    modeDisplayTele: string;
    bmdcShort: string;
  };
  login: {
    portalAccessSuffix: string;
    title: string;
    body: string;
    feature1: string;
    feature2: string;
    feature3: string;
    continueGoogle: string;
    connectingGoogle: string;
    continueGuest: string;
    closeAria: string;
  };
  dashboard: {
    portalFallback: string;
    adminStudio: string;
    bookVisit: string;
    signOut: string;
    closeAria: string;
    tabRecords: string;
    tabDocuments: string;
    tabAppointments: string;
    privateFolder: string;
    noRecordsTitle: string;
    noRecordsBodyPrefix: string;
    noRecordsBodySuffix: string;
    scheduleFirst: string;
    visitDatePrefix: string;
    followUpPrefix: string;
    rxHeading: string;
    clinicalNotesHeading: string;
    standardCareFallback: string;
    attachPrompt: string;
    cancel: string;
    attachDocBtn: string;
    addDocTitle: string;
    docTitleLabel: string;
    docTitlePlaceholder: string;
    categoryLabel: string;
    sourceFormatLabel: string;
    uploadImgBtn: string;
    externalLinkBtn: string;
    selectPhotoLabel: string;
    docUrlLabel: string;
    notesOptLabel: string;
    notesPlaceholder: string;
    saveFolderBtn: string;
    savingDocBtn: string;
    noDocsTitle: string;
    noDocsBody: string;
    issuedByClinic: string;
    patientUpload: string;
    previewImgBtn: string;
    openLinkBtn: string;
    noApptsTitle: string;
    noApptsBody: string;
    requestApptBtn: string;
    clinicNotePrefix: string;
    cancelAppt: string;
    inPersonSmch: string;
    teleConsult: string;
    statusLabels: {
      requested: string;
      confirmed: string;
      completed: string;
      cancelled: string;
    };
    categories: {
      'Lab Report': string;
      Prescription: string;
      Imaging: string;
      'Discharge Summary': string;
      Other: string;
    };
  };
  cv: {
    title: string;
    downloadTxt: string;
    downloadPdf: string;
    generatingPdf: string;
    printCv: string;
    printBlockedHint: string;
    closeAria: string;
    clinicalObjective: string;
    bmdcRegPrefix: string;
  };
  lightbox: {
    institutionContext: string;
    prevAria: string;
    nextAria: string;
    closeAria: string;
  };
}

export const UI_TRANSLATIONS: Record<SiteLanguage, UiDictionary> = {
  en: {
    nav: {
      bookAppointment: 'Book Appointment',
      bookShort: 'Book',
      signIn: 'Sign In',
      adminStudio: 'Admin Studio',
      myDashboard: 'My Dashboard',
      switchChapterAria: 'Switch portfolio chapter',
      languageSwitcherAria: 'Switch website language',
      brandShortMobile: 'Dr. Fariha',
      jumpToPrefix: 'Jump to',
    },
    hero: {
      explorePortfolio: 'Explore Story',
      scrollCue: 'Scroll',
      bmdcPrefix: 'BMDC',
    },
    bio: {
      missionLabel: 'Guiding Purpose',
      coreFocusHeading: 'Areas of Everyday Care',
      inspectPortraitAria: 'View portrait closely',
    },
    pillars: {
      inspectMoment: 'See Moment',
    },
    gallery: {
      allPrefix: 'All',
      clinicalFilter: 'Clinical & Theatre',
      honorsFilter: 'Honors & Awards',
      milestonesFilter: 'Milestones',
      curatedCountSuffix: 'Cherished Moments',
      swipeToExplore: 'Swipe to explore',
      prevAria: 'Previous photo card',
      nextAria: 'Next photo card',
    },
    credentials: {
      tabCredentials: 'Credentials',
      tabFaqs: 'Patient FAQs',
      tabVisits: 'Visit Options',
      photoEvidence: 'View Photo',
      hospitalOpd: 'Hospital OPD',
      remoteReview: 'Remote Review',
      inspectSpotlightAria: 'View spotlight photo',
    },
    footer: {
      durationTag: '30 Min Consultation',
      inPersonShort: 'In-Person',
      teleCareShort: 'Tele-Care',
      confirmSelectedSlot: 'Confirm Selected Slot',
      openMedicalRecords: 'Open My Health Records',
      signInForRecords: 'Sign In for My Records',
      navMission: 'Mission',
      navClinicalCare: 'How I Care',
      navTenOccasions: 'Ten Moments',
      navPrintableCv: 'Printable CV',
      navAdminStudio: 'Admin Studio',
      copyEmailAria: 'Copy email address',
      copiedLabel: 'Copied',
    },
    drawer: {
      kickerPrefix: 'Care Request',
      title: 'Book an Appointment',
      closeAria: 'Close appointment drawer',
      signInTitle: 'Sign In to Book & Stay Updated',
      signInBody:
        'Please sign in with Google so your appointment status, doctor’s notes, and prescriptions remain safely synced in your personal dashboard.',
      signInBtn: 'Continue with Google',
      connectingBtn: 'Connecting...',
      savedLabel: 'Saved to Your Dashboard',
      requestedTitle: 'We’ve Received Your Request',
      referenceLabel: 'Reference',
      patientLabel: 'Patient',
      modeLabel: 'Visit Type',
      dateSlotLabel: 'Date & Time',
      phoneLabel: 'Phone',
      viewDashboardBtn: 'Open My Dashboard',
      bookAnotherBtn: 'Book Another Slot',
      consultTypeLabel: 'How Would You Like to Meet?',
      inPersonOption: 'In-Person · SMCH',
      teleOption: 'Tele-Consultation',
      preferredDateLabel: 'Preferred Date',
      selectSlotLabel: 'Choose a Time Slot',
      fullNameLabel: 'Patient Name',
      fullNamePlaceholder: 'Enter full name',
      phoneInputLabel: 'Mobile Number',
      emailInputLabel: 'Email Address',
      reasonLabel: 'How Can Dr. Fariha Help?',
      reasonPlaceholder: 'Share symptoms, questions, or report details briefly...',
      confirmRequestBtn: 'Request Appointment',
      submittingBtn: 'Sending Request...',
      submitError: 'Sorry, we couldn’t save your request right now. Please try again.',
      modeDisplayInPerson: 'In-Person · SMCH Outpatient',
      modeDisplayTele: 'Tele-Consultation (Online)',
      bmdcShort: 'BMDC Reg.',
    },
    login: {
      portalAccessSuffix: 'Patient Care Space',
      title: 'Welcome—Your Care Space Is Ready',
      body: 'Sign in with Google to view your personal health folder, doctor-issued prescriptions, and appointment updates—or explore the portfolio as a guest.',
      feature1: 'Keep prescriptions, visit notes, and lab reports together',
      feature2: 'See real-time updates on your booked appointments',
      feature3: 'Private, protected access powered by your Google account',
      continueGoogle: 'Continue with Google',
      connectingGoogle: 'Connecting with Google...',
      continueGuest: 'Continue as Guest',
      closeAria: 'Close sign-in window',
    },
    dashboard: {
      portalFallback: 'Patient Dashboard',
      adminStudio: 'Admin Studio',
      bookVisit: 'Book Visit',
      signOut: 'Sign Out',
      closeAria: 'Close dashboard',
      tabRecords: 'Prescriptions & Notes',
      tabDocuments: 'My Reports',
      tabAppointments: 'Appointments',
      privateFolder: 'Private Health Folder',
      noRecordsTitle: 'No Visit Notes Yet',
      noRecordsBodyPrefix: 'Once',
      noRecordsBodySuffix:
        'shares a prescription or visit summary after your consultation, it will appear right here for easy access anytime.',
      scheduleFirst: 'Book Your First Visit',
      visitDatePrefix: 'Visit Date:',
      followUpPrefix: 'Follow-up:',
      rxHeading: 'Prescription (Rx)',
      clinicalNotesHeading: 'Care Notes & Advice',
      standardCareFallback: 'Rest well and follow your medication schedule carefully.',
      attachPrompt: 'Upload lab report photos or links so Dr. Fariha can review them easily.',
      cancel: 'Cancel',
      attachDocBtn: 'Add Medical Report',
      addDocTitle: 'Add a Report or Scan',
      docTitleLabel: 'Report Name',
      docTitlePlaceholder: 'e.g., CBC Blood Test – Nov 2026',
      categoryLabel: 'Report Type',
      sourceFormatLabel: 'How to Attach',
      uploadImgBtn: 'Upload Photo / Scan',
      externalLinkBtn: 'Paste Document Link',
      selectPhotoLabel: 'Choose image (automatically optimized)',
      docUrlLabel: 'Report URL (Drive, Lab Portal, PDF Link)',
      notesOptLabel: 'Short Note (Optional)',
      notesPlaceholder: 'Anything helpful for the doctor to know...',
      saveFolderBtn: 'Save to My Folder',
      savingDocBtn: 'Saving Report...',
      noDocsTitle: 'No Reports Uploaded Yet',
      noDocsBody:
        'Keep lab tests, X-rays, ultrasound scans, or external report links organized safely in one place.',
      issuedByClinic: 'Shared by Clinic',
      patientUpload: 'Added by You',
      previewImgBtn: 'View Report Photo',
      openLinkBtn: 'Open Report Link',
      noApptsTitle: 'No Appointments Yet',
      noApptsBody: 'Book an in-person visit or tele-consultation to track confirmations here.',
      requestApptBtn: 'Book an Appointment',
      clinicNotePrefix: 'Clinic Note:',
      cancelAppt: 'Cancel',
      inPersonSmch: 'In-Person (SMCH)',
      teleConsult: 'Tele-Consultation',
      statusLabels: {
        requested: 'Requested',
        confirmed: 'Confirmed',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      categories: {
        'Lab Report': 'Lab Report',
        Prescription: 'Prescription',
        Imaging: 'Imaging / X-Ray / USG',
        'Discharge Summary': 'Discharge Summary',
        Other: 'Other',
      },
    },
    cv: {
      title: 'Curriculum Vitae Summary',
      downloadTxt: 'Download TXT',
      downloadPdf: 'Download PDF',
      generatingPdf: 'Creating PDF...',
      printCv: 'Print CV',
      printBlockedHint: 'Preview frame blocked browser print dialog — use Download PDF to save directly.',
      closeAria: 'Close CV preview',
      clinicalObjective: 'Clinical Objective',
      bmdcRegPrefix: 'BMDC Reg:',
    },
    lightbox: {
      institutionContext: 'Place & Context',
      prevAria: 'Previous photo',
      nextAria: 'Next photo',
      closeAria: 'Close photo viewer',
    },
  },
  bn: {
    nav: {
      bookAppointment: 'অ্যাপয়েন্টমেন্ট নিন',
      bookShort: 'বুক',
      signIn: 'সাইন ইন',
      adminStudio: 'অ্যাডমিন স্টুডিও',
      myDashboard: 'আমার ড্যাশবোর্ড',
      switchChapterAria: 'অধ্যায় পরিবর্তন করুন',
      languageSwitcherAria: 'ওয়েবসাইটের ভাষা পরিবর্তন করুন',
      brandShortMobile: 'ডা. ফারিহা',
      jumpToPrefix: 'যান',
    },
    hero: {
      explorePortfolio: 'পরিচিতি দেখুন',
      scrollCue: 'নিচে যান',
      bmdcPrefix: 'বিএমডিসি',
    },
    bio: {
      missionLabel: 'চিকিৎসার মূল লক্ষ্য',
      coreFocusHeading: 'যে বিষয়গুলোতে বিশেষ যত্ন দেওয়া হয়',
      inspectPortraitAria: 'ছবিটি বড় করে দেখুন',
    },
    pillars: {
      inspectMoment: 'মুহূর্তটি দেখুন',
    },
    gallery: {
      allPrefix: 'সবগুলো',
      clinicalFilter: 'সার্জারি ও সেবা',
      honorsFilter: 'সম্মাননা ও সনদ',
      milestonesFilter: 'ক্যাম্পাস ও স্মৃতি',
      curatedCountSuffix: 'টি স্মরণীয় মুহূর্ত',
      swipeToExplore: 'পাশে স্লাইড করে দেখুন',
      prevAria: 'আগের ছবি',
      nextAria: 'পরের ছবি',
    },
    credentials: {
      tabCredentials: 'যোগ্যতা ও সনদ',
      tabFaqs: 'সাধারণ প্রশ্ন',
      tabVisits: 'পরামর্শের ধরন',
      photoEvidence: 'ছবি দেখুন',
      hospitalOpd: 'হাসপাতাল বহির্বিভাগ',
      remoteReview: 'অনলাইন পরামর্শ',
      inspectSpotlightAria: 'ছবিটি বড় করে দেখুন',
    },
    footer: {
      durationTag: '৩০ মিনিটের পরামর্শ',
      inPersonShort: 'সরাসরি',
      teleCareShort: 'টেলি-সেবা',
      confirmSelectedSlot: 'নির্বাচিত সময় নিশ্চিত করুন',
      openMedicalRecords: 'আমার স্বাস্থ্য ফাইল খুলুন',
      signInForRecords: 'রিপোর্ট দেখতে সাইন ইন করুন',
      navMission: 'মূল লক্ষ্য',
      navClinicalCare: 'সেবার ধরন',
      navTenOccasions: 'দশটি মুহূর্ত',
      navPrintableCv: 'সিভি দেখুন',
      navAdminStudio: 'অ্যাডমিন স্টুডিও',
      copyEmailAria: 'ইমেইল কপি করুন',
      copiedLabel: 'কপি হয়েছে',
    },
    drawer: {
      kickerPrefix: 'স্বাস্থ্য পরামর্শ অনুরোধ',
      title: 'অ্যাপয়েন্টমেন্ট বুক করুন',
      closeAria: 'অ্যাপয়েন্টমেন্ট উইন্ডো বন্ধ করুন',
      signInTitle: 'বুকিং ও আপডেট পেতে সাইন ইন করুন',
      signInBody:
        'দয়া করে গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন—যাতে আপনার অ্যাপয়েন্টমেন্টের অবস্থা, ডাক্তারের পরামর্শ ও প্রেসক্রিপশন সবসময় আপনার ড্যাশবোর্ডে সুরক্ষিত থাকে।',
      signInBtn: 'গুগল দিয়ে যুক্ত হোন',
      connectingBtn: 'যুক্ত হচ্ছে...',
      savedLabel: 'আপনার ড্যাশবোর্ডে সংরক্ষিত হয়েছে',
      requestedTitle: 'আপনার অনুরোধটি পৌঁছে গেছে',
      referenceLabel: 'রেফারেন্স নম্বর',
      patientLabel: 'রোগীর নাম',
      modeLabel: 'পরামর্শের ধরন',
      dateSlotLabel: 'তারিখ ও সময়',
      phoneLabel: 'মোবাইল নম্বর',
      viewDashboardBtn: 'আমার ড্যাশবোর্ড দেখুন',
      bookAnotherBtn: 'আরেকটি সময় বুক করুন',
      consultTypeLabel: 'কীভাবে পরামর্শ নিতে চান?',
      inPersonOption: 'সরাসরি · এসএমসিএইচ',
      teleOption: 'টেলি-কনসাল্টেশন',
      preferredDateLabel: 'পছন্দের তারিখ',
      selectSlotLabel: 'সময় বেছে নিন',
      fullNameLabel: 'রোগীর পূর্ণ নাম',
      fullNamePlaceholder: 'রোগীর নাম লিখুন',
      phoneInputLabel: 'মোবাইল নম্বর',
      emailInputLabel: 'ইমেইল ঠিকানা',
      reasonLabel: 'কী ধরনের পরামর্শ প্রয়োজন?',
      reasonPlaceholder: 'আপনার শারীরিক সমস্যা বা প্রশ্ন সংক্ষেপে লিখুন...',
      confirmRequestBtn: 'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন',
      submittingBtn: 'অনুরোধ পাঠানো হচ্ছে...',
      submitError: 'দুঃখিত, এই মুহূর্তে বুকিং সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
      modeDisplayInPerson: 'সরাসরি · এসএমসিএইচ বহির্বিভাগ',
      modeDisplayTele: 'টেলি-কনসাল্টেশন (অনলাইন)',
      bmdcShort: 'বিএমডিসি রেজি.',
    },
    login: {
      portalAccessSuffix: 'রোগীর ব্যক্তিগত পোর্টাল',
      title: 'স্বাগতম—আপনার ব্যক্তিগত স্বাস্থ্য সেবা পোর্টাল তৈরি',
      body: 'আপনার প্রেসক্রিপশন, পরীক্ষার রিপোর্ট এবং অ্যাপয়েন্টমেন্টের সর্বশেষ তথ্য দেখতে গুগল দিয়ে সাইন ইন করুন—অথবা অতিথি হিসেবে ওয়েবসাইটটি ঘুরে দেখুন।',
      feature1: 'সব প্রেসক্রিপশন, ডাক্তারের নোট ও রিপোর্ট এক জায়গায় সংরক্ষিত',
      feature2: 'আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত হলো কিনা তা সরাসরি দেখে নিন',
      feature3: 'গুগল অ্যাকাউন্টের মাধ্যমে সম্পূর্ণ গোপনীয় ও নিরাপদ ব্যবহার',
      continueGoogle: 'গুগল দিয়ে চালিয়ে যান',
      connectingGoogle: 'গুগলের সাথে যুক্ত হচ্ছে...',
      continueGuest: 'অতিথি হিসেবে ঘুরে দেখুন',
      closeAria: 'সাইন ইন উইন্ডো বন্ধ করুন',
    },
    dashboard: {
      portalFallback: 'রোগীর ড্যাশবোর্ড',
      adminStudio: 'অ্যাডমিন স্টুডিও',
      bookVisit: 'ভিজিট বুক করুন',
      signOut: 'সাইন আউট',
      closeAria: 'ড্যাশবোর্ড বন্ধ করুন',
      tabRecords: 'প্রেসক্রিপশন ও পরামর্শ',
      tabDocuments: 'আমার রিপোর্টসমূহ',
      tabAppointments: 'অ্যাপয়েন্টমেন্ট',
      privateFolder: 'ব্যক্তিগত স্বাস্থ্য ফোল্ডার',
      noRecordsTitle: 'এখনো কোনো ভিজিট নোট যুক্ত হয়নি',
      noRecordsBodyPrefix: 'আপনার পরামর্শের পর',
      noRecordsBodySuffix:
        'প্রেসক্রিপশন বা ভিজিট নোট যুক্ত করলে তা সাথে সাথেই এখানে দেখতে পাবেন।',
      scheduleFirst: 'প্রথম অ্যাপয়েন্টমেন্ট নিন',
      visitDatePrefix: 'ভিজিটের তারিখ:',
      followUpPrefix: 'পরবর্তী ফলো-আপ:',
      rxHeading: 'প্রেসক্রিপশন (Rx)',
      clinicalNotesHeading: 'ডাক্তারের পরামর্শ ও নির্দেশনা',
      standardCareFallback: 'পর্যাপ্ত বিশ্রাম নিন এবং নিয়মমতো ওষুধ সেবন করুন।',
      attachPrompt: 'ডাক্তারের দেখার জন্য আপনার টেস্ট রিপোর্টের ছবি বা লিংক এখানে যুক্ত করুন।',
      cancel: 'বাতিল করুন',
      attachDocBtn: 'মেডিকেল রিপোর্ট যুক্ত করুন',
      addDocTitle: 'নতুন রিপোর্ট বা ছবি যোগ করুন',
      docTitleLabel: 'রিপোর্টের নাম',
      docTitlePlaceholder: 'যেমন: সিবিসি ব্লাড টেস্ট – নভেম্বর ২০২৬',
      categoryLabel: 'রিপোর্টের ধরন',
      sourceFormatLabel: 'কীভাবে যুক্ত করবেন',
      uploadImgBtn: 'ছবি আপলোড করুন',
      externalLinkBtn: 'লিংক যোগ করুন',
      selectPhotoLabel: 'রিপোর্টের ছবি বেছে নিন (স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হবে)',
      docUrlLabel: 'রিপোর্টের লিংক (ড্রাইভ, ল্যাব পোর্টাল বা পিডিএফ)',
      notesOptLabel: 'সংক্ষিপ্ত নোট (ঐচ্ছিক)',
      notesPlaceholder: 'ডাক্তারের জানার মতো কোনো তথ্য থাকলে লিখুন...',
      saveFolderBtn: 'ফোল্ডারে সংরক্ষণ করুন',
      savingDocBtn: 'সংরক্ষণ হচ্ছে...',
      noDocsTitle: 'এখনো কোনো রিপোর্ট যুক্ত করা হয়নি',
      noDocsBody: 'রক্তের পরীক্ষা, এক্স-রে, আল্ট্রাসাউন্ড বা পূর্বের প্রেসক্রিপশন এক জায়গায় গুছিয়ে রাখুন।',
      issuedByClinic: 'ক্লিনিক থেকে পাঠানো',
      patientUpload: 'আপনার যোগ করা',
      previewImgBtn: 'রিপোর্টের ছবি দেখুন',
      openLinkBtn: 'রিপোর্টের লিংক খুলুন',
      noApptsTitle: 'কোনো অ্যাপয়েন্টমেন্ট নেই',
      noApptsBody: 'সরাসরি সাক্ষাৎ বা টেলি-কনসাল্টেশনের অনুরোধ পাঠালে এখানে আপডেট পাবেন।',
      requestApptBtn: 'অ্যাপয়েন্টমেন্ট অনুরোধ করুন',
      clinicNotePrefix: 'ক্লিনিক নোট:',
      cancelAppt: 'বাতিল করুন',
      inPersonSmch: 'সরাসরি (এসএমসিএইচ)',
      teleConsult: 'টেলি-কনসাল্টেশন',
      statusLabels: {
        requested: 'অনুরোধকৃত',
        confirmed: 'নিশ্চিত হয়েছে',
        completed: 'সম্পন্ন হয়েছে',
        cancelled: 'বাতিলকৃত',
      },
      categories: {
        'Lab Report': 'ল্যাব রিপোর্ট',
        Prescription: 'প্রেসক্রিপশন',
        Imaging: 'ইমেজিং / এক্স-রে / ইউএসজি',
        'Discharge Summary': 'ডিসচার্জ সামারি',
        Other: 'অন্যান্য',
      },
    },
    cv: {
      title: 'জীবনবৃত্তান্ত (CV) সারসংক্ষেপ',
      downloadTxt: 'টেক্সট ডাউনলোড',
      downloadPdf: 'পিডিএফ ডাউনলোড',
      generatingPdf: 'পিডিএফ তৈরি হচ্ছে...',
      printCv: 'প্রিন্ট করুন',
      printBlockedHint: 'প্রিভিউ ফ্রেম প্রিন্ট ডায়ালগ ব্লক করেছে — সরাসরি সেভ করতে “পিডিএফ ডাউনলোড” ব্যবহার করুন।',
      closeAria: 'সিভি প্রিভিউ বন্ধ করুন',
      clinicalObjective: 'পেশাগত লক্ষ্য',
      bmdcRegPrefix: 'বিএমডিসি রেজি:',
    },
    lightbox: {
      institutionContext: 'স্থান ও প্রেক্ষাপট',
      prevAria: 'আগের ছবি',
      nextAria: 'পরের ছবি',
      closeAria: 'ছবি প্রিভিউ বন্ধ করুন',
    },
  },
};

const BN_TIME_SLOTS: Record<string, string> = {
  '09:30 AM': 'সকাল ০৯:৩০',
  '11:00 AM': 'সকাল ১১:০০',
  '02:30 PM': 'দুপুর ০২:৩০',
  '04:30 PM': 'বিকাল ০৪:৩০',
  '06:30 PM': 'সন্ধ্যা ০৬:৩০',
};

export function formatSlotLabel(slot: string, lang: SiteLanguage): string {
  if (lang === 'en') return slot;
  return BN_TIME_SLOTS[slot] || slot;
}

export function formatNumberLocale(num: number | string, lang: SiteLanguage): string {
  const s = String(num);
  if (lang === 'en') return s;
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return s.replace(/\d/g, (d) => digits[Number(d)] ?? d);
}
