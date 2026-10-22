// Multi-Language Translation Engine for AI Food & Waste Scan
// Supports 8 Languages: English (en), Tamil (ta), Hindi (hi), Telugu (te),
// Kannada (kn), Malayalam (ml), Spanish (es), French (fr)

export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'te' | 'kn' | 'ml' | 'es' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export interface TranslatedScanPayload {
  displayName: string;
  category: string;
  freshness: string;
  risk: string;
  wasteGroup: string;
  processingType: string;
  recommendation: string;
  shelfLife: string;
  ecoImpact: string;
  forensicNote: string;
  badgeGrade: string;
}

// Translations for all 8 Dataset Waste Classes & 6 Freshness Classes
const CLASS_TRANSLATIONS: Record<string, Record<SupportedLanguage, TranslatedScanPayload>> = {
  // Prepared Fast Food & Junk Food (Burgers, French Fries, Fried Chicken, Snacks)
  fast_food_junk_food: {
    en: {
      displayName: 'Prepared Fast Food & Junk Food (Burgers, Fries, Fried Snacks)',
      category: 'Prepared Fast Food Organic',
      freshness: 'Freshly Prepared Meal / Edible Leftovers',
      risk: 'Low',
      wasteGroup: 'Biodegradable',
      processingType: 'Surplus Redistribution / Industrial Aerobic Composting',
      recommendation: '100% Organic cooked biomass. If freshly prepared and wholesome, consume or donate surplus to relief shelters. Discarded scraps go to organic composting.',
      shelfLife: '1 - 2 Days',
      ecoImpact: '+0.82 kg CO2 avoided by preventing landfill methane',
      forensicNote: 'Deep learning verified carbohydrate golden fry crust and cooked organic protein structures.',
      badgeGrade: 'BIODEGRADABLE ORGANIC FOOD'
    },
    ta: {
      displayName: 'துரித உணவு & வறுத்த தின்பண்டங்கள் (பர்கர், பிரெஞ்ச் பிரைஸ்)',
      category: 'தயாரிக்கப்பட்ட துரித உணவு / இயற்கை கழிவு',
      freshness: 'புதிதாக தயாரிக்கப்பட்ட உணவு / உண்ணக்கூடியது',
      risk: 'குறைவு',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'உணவு பகிர்வு / இயற்கை உரம் தயாரித்தல்',
      recommendation: '100% மக்கும் இயற்கை உணவு. உண்ணக்கூடிய நல்ல நிலையில் இருந்தால் ஏழை எளியோருக்கு தானம் செய்யவும். மீதமுள்ளவற்றை இயற்கை உரத் தொட்டியில் போடவும்.',
      shelfLife: '1 - 2 நாட்கள்',
      ecoImpact: '+0.82 கிலோ CO2 வெளியேற்றம் சேமிக்கப்பட்டது',
      forensicNote: 'வறுத்த உருளைக்கிழங்கு, ரொட்டி மற்றும் சமைக்கப்பட்ட புரத அமைப்புகள் துல்லியமாக கண்டறியப்பட்டன.',
      badgeGrade: 'மக்கும் உணவுக் கழிவு'
    },
    hi: {
      displayName: 'तैयार फास्ट फूड और स्नैक्स (बर्गर, फ्रेंच फ्राइज)',
      category: 'फास्ट फूड / जैविक भोजन',
      freshness: 'ताज़ा तैयार भोजन / खाने योग्य',
      risk: 'कम',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'अधिशेष भोजन दान / जैविक खाद निर्माण',
      recommendation: '100% बायोडिग्रेडेबल जैविक भोजन। यदि ताज़ा और स्वच्छ है तो जरूरतमंदों को दान करें। बचा हुआ खाना गीले कचरे (खाद) में डालें।',
      shelfLife: '1 - 2 दिन',
      ecoImpact: '+0.82 किग्रा CO2 उत्सर्जन रोका गया',
      forensicNote: 'कार्बोहाइड्रेट, तली हुई सामग्री और पके हुए प्रोटीन संरचनाओं की पुष्टि हुई।',
      badgeGrade: 'बायोडिग्रेडेबल जैविक भोजन'
    },
    te: {
      displayName: 'ఫాస్ట్ ఫుడ్ & స్నాక్స్ (బర్గర్, ఫ్రెంచ్ ఫ్రైస్)',
      category: 'ఫాస్ట్ ఫుడ్ / సేంద్రీయ ఆహారం',
      freshness: 'తాజా ఆహారం / తినదగినది',
      risk: 'తక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'ఆహార విరాళం / సేంద్రీయ కంపోస్టింగ్',
      recommendation: '100% బయోడిగ్రేడబుల్ సేంద్రీయ ఆహారం. తాజాగా ఉంటే అవసరమైన వారికి దానం చేయండి. వ్యర్థాలను సేంద్రీయ బుట్టలో వేయండి.',
      shelfLife: '1 - 2 రోజులు',
      ecoImpact: '+0.82 కిలోల CO2 ఆదా చేయబడింది',
      forensicNote: 'వేయించిన బంగాళాదుంపలు మరియు ఆహార పదార్థాల స్పెక్ట్రమ్ నిర్ధారించబడింది.',
      badgeGrade: 'బయోడిగ్రేడబుల్ సేంద్రీయ ఆహారం'
    },
    kn: {
      displayName: 'ಸಿದ್ಧಪಡಿಸಿದ ಫಾಸ್ಟ್ ಫುಡ್ ಮತ್ತು ತಿಂಡಿಗಳು (ಬರ್ಗರ್, ಫ್ರೆಂಚ್ ಫ್ರೈಸ್)',
      category: 'ಫಾಸ್ಟ್ ಫುಡ್ / ಸಾವಯವ ಆಹಾರ',
      freshness: 'ತಾಜಾ ಸಿದ್ಧಪಡಿಸಿದ ಆಹಾರ / ತಿನ್ನಲು ಯೋಗ್ಯ',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ಆಹಾರ ದಾನ / ಸಾವಯವ ಗೊಬ್ಬರ ತಯಾರಿಕೆ',
      recommendation: '100% ಜೈವಿಕ ವಿಘಟನೀಯ ಸಾವಯವ ಆಹಾರ. ತಾಜಾವಾಗಿದ್ದರೆ ದಾನ ಮಾಡಿ. ಉಳಿದದ್ದನ್ನು ಸಾವಯವ ಕಸದ ಬುಟ್ಟಿಗೆ ಹಾಕಿ.',
      shelfLife: '1 - 2 ದಿನಗಳು',
      ecoImpact: '+0.82 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆ ಉಳಿಸಲಾಗಿದೆ',
      forensicNote: 'ಹುರಿದ ತಿನಿಸುಗಳು ಮತ್ತು ಬೇಯಿಸಿದ ಆಹಾರ ಪದಾರ್ಥಗಳ ಗುಣಲಕ್ಷಣಗಳು ಪತ್ತೆಯಾಗಿವೆ.',
      badgeGrade: 'ಜೈವಿಕ ವಿಘಟನೀಯ ಆಹಾರ'
    },
    ml: {
      displayName: 'ഫാസ്റ്റ് ഫുഡ് & പലഹാരങ്ങൾ (ബർഗർ, ഫ്രഞ്ച് ഫ്രൈസ്)',
      category: 'ഫാസ്റ്റ് ഫുഡ് / ജൈവ ഭക്ഷണം',
      freshness: 'പുതിയ ഭക്ഷണം / കഴിക്കാൻ യോഗ്യം',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'ഭക്ഷണ ദാനം / കമ്പോസ്റ്റിംഗ്',
      recommendation: '100% ബയോഡീഗ്രേഡബിൾ ജൈവ ഭക്ഷണം. നല്ല നിലയിലാണെങ്കിൽ ദാനം ചെയ്യുക, ബാക്കിയുള്ളവ ജൈവ മാലിന്യത്തിൽ നിക്ഷേപിക്കുക.',
      shelfLife: '1 - 2 ദിവസങ്ങൾ',
      ecoImpact: '+0.82 കിലോഗ്രാം കാർബൺ ഉദ്‌വമനം കുറച്ചു',
      forensicNote: 'ഫ്രൈ ചെയ്ത ഭക്ഷണത്തിന്റെയും പാകം ചെയ്ത പ്രോട്ടീനുകളുടെയും സാന്നിധ്യം സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ബയോഡീഗ്രേഡബിൾ ഓർഗാനിക്'
    },
    es: {
      displayName: 'Comida Rápida y Frituras (Hamburguesas, Papas Fritas)',
      category: 'Comida Rápida / Orgánico',
      freshness: 'Comida Recién Preparada / Comestible',
      risk: 'Bajo',
      wasteGroup: 'Biodegradable',
      processingType: 'Donación de Alimentos / Compostaje Orgánico',
      recommendation: '100% biomasa orgánica cocinada. Si está en buen estado, donar a comedores sociales. Descartar restos en contenedor orgánico.',
      shelfLife: '1 - 2 Días',
      ecoImpact: '+0.82 kg CO2 evitado vía compostaje',
      forensicNote: 'Estructura celular de carbohidratos fritos y proteínas cocidas detectada.',
      badgeGrade: 'ALIMENTO ORGÁNICO BIODEGRADABLE'
    },
    fr: {
      displayName: 'Restauration Rapide & Fritures (Burgers, Frites)',
      category: 'Fast Food / Organique',
      freshness: 'Plat Fraîchement Préparé / Comestible',
      risk: 'Faible',
      wasteGroup: 'Biodégradable',
      processingType: 'Don Alimentaire / Compostage Organique',
      recommendation: 'Biomasse cuite 100% organique. Si sain, redistribuer aux banques alimentaires. Déposer les restes au bac à compost.',
      shelfLife: '1 - 2 Jours',
      ecoImpact: '+0.82 kg de CO2 évité via compostage',
      forensicNote: 'Structures de glucides dorés et protéines cuites confirmées par vision neuronale.',
      badgeGrade: 'ALIMENT BIODÉGRADABLE'
    }
  },

  // 1. Organic Food Waste
  food_waste: {
    en: {
      displayName: 'Organic Food Waste & Leftovers',
      category: 'Food / Organic',
      freshness: 'Food Scraps / Leftovers',
      risk: 'High',
      wasteGroup: 'Biodegradable',
      processingType: 'Industrial Aerobic Bio-Composting & Biogas Digestion',
      recommendation: 'Active organic matter. Route to municipal anaerobic digester for methane recovery and bio-fertilizer conversion.',
      shelfLife: '0 days (Waste Stream)',
      ecoImpact: '+0.45 kg CO2 avoided per kg via bio-composting',
      forensicNote: 'Visible biological breakdown and high volatile moisture content detected.',
      badgeGrade: 'BIODEGRADABLE ORGANIC'
    },
    ta: {
      displayName: 'சமையல் மற்றும் உணவுக் கழிவுகள்',
      category: 'உணவு / மக்கும் இயற்கை கழிவு',
      freshness: 'உணவு மீதங்கள் / அழுகிய உணவுகள்',
      risk: 'அதிகம்',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'தொழில்துறை உயிரி உரம் மற்றும் உயிர்வாயு ஆலை',
      recommendation: 'இயற்கை உணவுக் கழிவு. உலர் கழிவுகளிலிருந்து பிரித்து நகராட்சி உரம் அல்லது பயோ-காஸ் ஆலைக்கு அனுப்பவும்.',
      shelfLife: '0 நாட்கள் (கழிவு)',
      ecoImpact: '+0.45 கிலோ கார்பன் வெளியேற்றம் தடுக்கப்பட்டது',
      forensicNote: 'உயிரியல் சிதைவு மற்றும் ஈரப்பதம் கண்டறியப்பட்டது.',
      badgeGrade: 'மக்கும் உணவுக் கழிவு'
    },
    hi: {
      displayName: 'जैविक खाद्य अपशिष्ट और बचा हुआ भोजन',
      category: 'भोजन / जैविक',
      freshness: 'खाद्य अवशेष / बचा हुआ भोजन',
      risk: 'उच्च',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'औद्योगिक खाद निर्माण और बायोगैस संयंत्र',
      recommendation: 'सक्रिय जैविक पदार्थ। मीथेन रिकवरी और जैविक उर्वरक के लिए नगरपालिका बायोगैस डाइजेस्टर में भेजें।',
      shelfLife: '0 दिन (अपशिष्ट प्रवाह)',
      ecoImpact: '+0.45 किग्रा CO2 उत्सर्जन रोका गया',
      forensicNote: 'जैविक अपघटन और उच्च नमी की उपस्थिति दर्ज की गई।',
      badgeGrade: 'बायोडिग्रेडेबल जैविक'
    },
    te: {
      displayName: 'సేంద్రీయ ఆహార వ్యర్థాలు & మిగిలిన ఆహారం',
      category: 'ఆహారం / సేంద్రీయ',
      freshness: 'ఆహార వ్యర్థాలు / పాడైపోయిన ఆహారం',
      risk: 'ఎక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'పారిశ్రామిక సేంద్రీయ కంపోస్టింగ్ & బయోగ్యాస్ ప్లాంట్',
      recommendation: 'సేంద్రీయ పదార్థం. పొడి వ్యర్థాల నుండి వేరుచేసి మునిసిపల్ కంపోస్టింగ్ లేదా బయోగ్యాస్ కేంద్రానికి తరలించండి.',
      shelfLife: '0 రోజులు (వ్యర్థాలు)',
      ecoImpact: '+0.45 కిలోల CO2 ఆదా చేయబడింది',
      forensicNote: 'జీవ రసాయన క్షీణత మరియు తేమ కనుగొనబడింది.',
      badgeGrade: 'బయోడిగ్రేడబుల్ ఆర్గానిక్'
    },
    kn: {
      displayName: 'ಸಾವಯವ ಆಹಾರ ತ್ಯಾಜ್ಯ ಮತ್ತು ಉಳಿದ ಆಹಾರ',
      category: 'ಆಹಾರ / ಸಾವಯವ',
      freshness: 'ಆಹಾರದ ಚೂರುಗಳು / ಕೊಳೆತ ಆಹಾರ',
      risk: 'ಹೆಚ್ಚು',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ಕೈಗಾರಿಕಾ ಗೊಬ್ಬರ ತಯಾರಿಕೆ ಮತ್ತು ಬಯೋಗ್ಯಾಸ್ ಸ್ಥಾವರ',
      recommendation: 'ಸಾವಯವ ತ್ಯಾಜ್ಯ. ಒಣ ತ್ಯಾಜ್ಯದಿಂದ ಬೇರ್ಪಡಿಸಿ ಗೊಬ್ಬರ ಅಥವಾ ಜೈವಿಕ ಅನಿಲ ಘಟಕಕ್ಕೆ ಕಳುಹಿಸಿ.',
      shelfLife: '0 ದಿನಗಳು (ತ್ಯಾಜ್ಯ)',
      ecoImpact: '+0.45 ಕೆಜಿ ಇಂಗಾಲದ ಹೊರಸೂಸುವಿಕೆ ತಡೆಗಟ್ಟಲಾಗಿದೆ',
      forensicNote: 'ಜೈವಿಕ ವಿಘಟನೆ ಮತ್ತು ತೇವಾಂಶ ಪತ್ತೆಯಾಗಿದೆ.',
      badgeGrade: 'ಜೈವಿಕ ವಿಘಟನೀಯ ಸಾವಯವ'
    },
    ml: {
      displayName: 'ജൈവ ഭക്ഷ്യ അവശിഷ്ടങ്ങൾ',
      category: 'ഭക്ഷണം / ജൈവം',
      freshness: 'ഭക്ഷണ അവശിഷ്ടങ്ങൾ',
      risk: 'ഉയർന്നത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'കംപോസ്റ്റിംഗ് & ബയോഗ്യാസ് സംസ്കരണം',
      recommendation: 'ജൈവ മാലിന്യം. ഉണങ്ങിയ മാലിന്യങ്ങളിൽ നിന്ന് വേർതിരിച്ച് കമ്പോസ്റ്റിംഗ് കേന്ദ്രത്തിലേക്ക് മാറ്റുക.',
      shelfLife: '0 ദിവസങ്ങൾ (മാലിന്യം)',
      ecoImpact: '+0.45 കിലോഗ്രാം കാർബൺ ഉദ്‌വമനം കുറച്ചു',
      forensicNote: 'ജൈവപരമായ വിഘടനവും ഈർപ്പവും സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ബയോഡീഗ്രേഡബിൾ ഓർഗാനിക്'
    },
    es: {
      displayName: 'Residuos Orgánicos de Alimentos y Sobras',
      category: 'Alimentos / Orgánico',
      freshness: 'Restos de Comida',
      risk: 'Alto',
      wasteGroup: 'Biodegradable',
      processingType: 'Compostaje Biológico y Digestión Anaeróbica',
      recommendation: 'Materia orgánica activa. Enviar a planta de biogás o compostaje municipal.',
      shelfLife: '0 días (Residuo)',
      ecoImpact: '+0.45 kg CO2 evitado por kg vía compostaje',
      forensicNote: 'Descomposición biológica y humedad activa detectadas.',
      badgeGrade: 'ORGÁNICO BIODEGRADABLE'
    },
    fr: {
      displayName: 'Déchets Alimentaires Organiques et Restes',
      category: 'Aliments / Organique',
      freshness: 'Restes Alimentaires',
      risk: 'Élevé',
      wasteGroup: 'Biodégradable',
      processingType: 'Compostage Industriel et Méthanisation',
      recommendation: 'Matière organique active. Acheminer vers un méthaniseur ou centre de compostage.',
      shelfLife: '0 jour (Déchet)',
      ecoImpact: '+0.45 kg de CO2 évité par kg via compostage',
      forensicNote: 'Dégradation biologique et humidité élevée détectées.',
      badgeGrade: 'ORGANIQUE BIODÉGRADABLE'
    }
  },

  // 2. Leaf & Garden Waste
  leaf_waste: {
    en: {
      displayName: 'Garden Green Waste & Foliage',
      category: 'Garden & Yard Waste',
      freshness: 'Organic Biomass',
      risk: 'Low',
      wasteGroup: 'Biodegradable',
      processingType: 'Windrow Aerobic Composting & Biomass Mulch',
      recommendation: 'Collect in dedicated green compost bins. Rapidly bioconverts into nitrogen-rich organic soil amendment.',
      shelfLife: 'N/A (Biomass)',
      ecoImpact: '+0.32 kg CO2 avoided per kg via mulching',
      forensicNote: 'High natural chlorophyll vegetative spectrum observed.',
      badgeGrade: 'BIODEGRADABLE BIOMASS'
    },
    ta: {
      displayName: 'தோட்ட இலைக் கழிவுகள் மற்றும் தாவரங்கள்',
      category: 'தோட்டம் / தாவரக் கழிவு',
      freshness: 'இயற்கை உயிரித் தொகுதி',
      risk: 'குறைவு',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'காற்று சுழற்சி உரமாக்கல் மற்றும் மரத்தூள் உரம்',
      recommendation: 'பச்சை நிற குப்பைத் தொட்டியில் சேகரிக்கவும். சத்துமிக்க இயற்கை உரமாக மாறும்.',
      shelfLife: 'பொருந்தாது (உயிரித் தொகுதி)',
      ecoImpact: '+0.32 கிலோ CO2 வெளியேற்றம் சேமிக்கப்பட்டது',
      forensicNote: 'இயற்கை பச்சைய தாவர அலைவரிசை கண்டறியப்பட்டது.',
      badgeGrade: 'மக்கும் தாவரக் கழிவு'
    },
    hi: {
      displayName: 'बगीचे की हरी पत्तियां और वनस्पति कचरा',
      category: 'उद्यान और बागवानी अपशिष्ट',
      freshness: 'जैविक बायोमास',
      risk: 'निम्न',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'एरोबिक खाद और मल्चिंग',
      recommendation: 'हरे डिब्बे में इकट्ठा करें। यह तेजी से नाइट्रोजन युक्त जैविक खाद में परिवर्तित हो जाता है।',
      shelfLife: 'लागू नहीं (बायोमास)',
      ecoImpact: '+0.32 किग्रा CO2 की बचत',
      forensicNote: 'प्राकृतिक क्लोरोफिल वनस्पति स्पेक्ट्रम देखा गया।',
      badgeGrade: 'बायोडिग्रेडेबल बायोमास'
    },
    te: {
      displayName: 'తోట పచ్చని ఆకులు & వృక్షసంపద వ్యర్థాలు',
      category: 'తోట & యార్డ్ వ్యర్థాలు',
      freshness: 'సేంద్రీయ బయోమాస్',
      risk: 'తక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'ఏరోబిక్ కంపోస్టింగ్ & మల్చింగ్',
      recommendation: 'ఆకుపచ్చ తొట్టెలో సేకరించండి. త్వరగా నత్రజని అధికంగా ఉండే సహజ ఎరువుగా మారుతుంది.',
      shelfLife: 'వర్తించదు (బయోమాస్)',
      ecoImpact: '+0.32 కిలోల CO2 ఆదా',
      forensicNote: 'సహజ హరితరేణు వృక్ష స్పెక్ట్రం గుర్తించబడింది.',
      badgeGrade: 'బయోడిగ్రేడబుల్ బయోమాస్'
    },
    kn: {
      displayName: 'ತೋಟದ ಹಸಿರು ಎಲೆಗಳು ಮತ್ತು ಸಸ್ಯ ತ್ಯಾಜ್ಯ',
      category: 'ತೋಟದ ತ್ಯಾಜ್ಯ',
      freshness: 'ಸಾವಯವ ಜೈವಿಕ ರಾಶಿ',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ಗೊಬ್ಬರ ಮತ್ತು ಹಸಿರೆಲೆ ಗೊಬ್ಬರ ಸಂಸ್ಕರಣೆ',
      recommendation: 'ಹಸಿರು ಕಸದ ಬುಟ್ಟಿಯಲ್ಲಿ ಸಂಗ್ರಹಿಸಿ. ಪೌಷ್ಟಿಕಾಂಶ ಭರಿತ ಸಾವಯವ ಗೊಬ್ಬರವಾಗುತ್ತದೆ.',
      shelfLife: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
      ecoImpact: '+0.32 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ನೈಸರ್ಗಿಕ ಹಸಿರು ಸಸ್ಯ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ.',
      badgeGrade: 'ಜೈವಿಕ ವಿಘಟನೀಯ ಸಸ್ಯ ತ್ಯಾಜ್ಯ'
    },
    ml: {
      displayName: 'തോട്ടത്തിലെ ഇല അവശിഷ്ടങ്ങൾ',
      category: 'തോട്ടം / പുല്ല് മാലിന്യം',
      freshness: 'ജൈവ ബയോമാസ്',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'വിൻഡ്രോ കമ്പോസ്റ്റിംഗ് & മൾച്ചിംഗ്',
      recommendation: 'പച്ച ബിന്നിൽ ശേഖരിക്കുക. എളുപ്പത്തിൽ മികച്ച ജൈവവളമായി മാറുന്നു.',
      shelfLife: 'ബാധകമല്ല',
      ecoImpact: '+0.32 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'സ്വാഭാവിക സസ്യ ഘടന സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ബയോഡീഗ്രേഡബിൾ ബയോമാസ്'
    },
    es: {
      displayName: 'Residuos Vegetales y Hojas de Jardín',
      category: 'Jardinería / Vegetal',
      freshness: 'Biomasa Orgánica',
      risk: 'Bajo',
      wasteGroup: 'Biodegradable',
      processingType: 'Compostaje Aeróbico y Trituración de Mantillo',
      recommendation: 'Depositar en contenedor verde de restos vegetales para transformación en abono natural.',
      shelfLife: 'N/A (Biomasa)',
      ecoImpact: '+0.32 kg CO2 evitado por kg vía mantillo',
      forensicNote: 'Espectro vegetal rico en clorofila natural detectado.',
      badgeGrade: 'BIOMASA BIODEGRADABLE'
    },
    fr: {
      displayName: 'Déchets Verts de Jardin et Feuillage',
      category: 'Jardinage / Végétal',
      freshness: 'Biomasse Végétale',
      risk: 'Faible',
      wasteGroup: 'Biodégradable',
      processingType: 'Compostage en Andain et Paillage',
      recommendation: 'Collecter dans les bacs verts pour valorisation horticole en paillage et terreau.',
      shelfLife: 'N/A (Biomasse)',
      ecoImpact: '+0.32 kg de CO2 évité par kg',
      forensicNote: 'Spectre végétal de chlorophylle naturelle identifié.',
      badgeGrade: 'BIOMASSE BIODÉGRADABLE'
    }
  },

  // 3. Paper & Cardboard
  paper_waste: {
    en: {
      displayName: 'Corrugated Cardboard & Mixed Paper',
      category: 'Paper & Fibre',
      freshness: 'Dry Packaging',
      risk: 'Low',
      wasteGroup: 'Biodegradable Recyclable',
      processingType: 'Hydrapulper Fibre Reprocessing & Recycled Board Milling',
      recommendation: 'Keep clean and dry. Flatten and bind for municipal recycled paper reclamation.',
      shelfLife: 'N/A (Recyclable)',
      ecoImpact: '+0.80 kg CO2 avoided per kg via paper recycling',
      forensicNote: 'Fibrous cellulose matting with planar orientation confirmed.',
      badgeGrade: 'RECYCLABLE DRY STREAM'
    },
    ta: {
      displayName: 'அட்டைப்பெட்டி மற்றும் கலப்பு காகிதக் கழிவுகள்',
      category: 'காகிதம் & நார்ச்சத்து',
      freshness: 'உலர் பேக்கேஜிங்',
      risk: 'குறைவு',
      wasteGroup: 'மக்கும் தன்மை கொண்ட மறுசுழற்சிக் கழிவு',
      processingType: 'காகிதக் கூழ் மறுசுழற்சி மற்றும் அட்டை தயாரிப்பு',
      recommendation: 'ஈரப்பதம் படாமல் உலர் கழிவாக வைத்திருக்கவும். மறுசுழற்சி மையத்திற்கு அனுப்பவும்.',
      shelfLife: 'பொருந்தாது (மறுசுழற்சி)',
      ecoImpact: '+0.80 கிலோ CO2 வெளியேற்றம் சேமிக்கப்பட்டது',
      forensicNote: 'செல்லுலோஸ் ஃபைபர் அமைப்பு உறுதிப்படுத்தப்பட்டது.',
      badgeGrade: 'மறுசுழற்சி உலர் காகிதம்'
    },
    hi: {
      displayName: 'गत्ता और मिश्रित कागज कचरा',
      category: 'कागज और फाइबर',
      freshness: 'सूखी पैकेजिंग',
      risk: 'निम्न',
      wasteGroup: 'बायोडिग्रेडेबल रिसाइकिल योग्य',
      processingType: 'पल्प फाइबर रीसाइक्लिंग और रिसाइकिल बोर्ड मिलिंग',
      recommendation: 'साफ और सूखा रखें। रीसाइक्लिंग के लिए नीले या सूखे कचरे के डिब्बे में डालें।',
      shelfLife: 'लागू नहीं (पुनर्चक्रण)',
      ecoImpact: '+0.80 किग्रा CO2 उत्सर्जन रोका गया',
      forensicNote: 'रेशेदार सेल्यूलोज बनावट की पुष्टि की गई।',
      badgeGrade: 'रीसाइक्लिंग योग्य सूखा कचरा'
    },
    te: {
      displayName: 'కార్డ్‌బోర్డ్ మరియు పేపర్ వ్యర్థాలు',
      category: 'పేపర్ & ఫైబర్',
      freshness: 'పొడి ప్యాకేజింగ్',
      risk: 'తక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్ రీసైకిల్ చేయదగినది',
      processingType: 'పల్ప్ ఫైబర్ రీసైక్లింగ్',
      recommendation: 'శుభ్రంగా మరియు పొడిగా ఉంచండి. మునిసిపల్ పేపర్ రీసైక్లింగ్ కోసం ఇవ్వండి.',
      shelfLife: 'వర్తించదు (రీసైక్లింగ్)',
      ecoImpact: '+0.80 కిలోల CO2 ఆదా',
      forensicNote: 'సహజ సెల్యులోజ్ ఫైబర్ స్పెక్ట్రం గుర్తించబడింది.',
      badgeGrade: 'రీసైకిల్ చేయదగిన పేపర్'
    },
    kn: {
      displayName: 'ರಟ್ಟಿನ ಪೆಟ್ಟಿಗೆ ಮತ್ತು ಕಾಗದದ ತ್ಯಾಜ್ಯ',
      category: 'ಕಾಗದ ಮತ್ತು ನಾರು',
      freshness: 'ಒಣ ಪ್ಯಾಕೇಜಿಂಗ್',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ ಮರುಬಳಕೆಯಾಗುವ',
      processingType: 'ತಿರುಳು ಕಾಗದ ಮರುಸಂಸ್ಕರಣೆ',
      recommendation: 'ತೇವವಾಗದಂತೆ ಒಣಗಿಸಿ ಇಡಿ. ಮರುಬಳಕೆಗಾಗಿ ಒಣ ಕಸದೊಂದಿಗೆ ನೀಡಿ.',
      shelfLife: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
      ecoImpact: '+0.80 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಸೆಲ್ಯುಲೋಸ್ ನಾರಿನ ರಚನೆ ಪತ್ತೆಯಾಗಿದೆ.',
      badgeGrade: 'ಮರುಬಳಕೆಯಾಗುವ ಒಣ ಕಾಗದ'
    },
    ml: {
      displayName: 'കാർഡ്ബോർഡ് & പേപ്പർ മാലിന്യങ്ങൾ',
      category: 'പേപ്പർ & ഫൈബർ',
      freshness: 'ഉണങ്ങിയ പാക്കേജിംഗ്',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ റീസൈക്കിൾ ചെയ്യാവുന്നത്',
      processingType: 'ഹൈഡ്രാപൾപ്പർ പൾപ്പ് റീസൈക്ലിംഗ്',
      recommendation: 'ഈർപ്പമില്ലാതെ ഉണക്കി സൂക്ഷിക്കുക. പേപ്പർ പുനരുപയോഗ കേന്ദ്രത്തിലേക്ക് അയയ്ക്കുക.',
      shelfLife: 'ബാധകമല്ല',
      ecoImpact: '+0.80 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'സെല്ലുലോസ് ഫൈബർ ഘടന സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'റീസൈക്കിൾ ചെയ്യപ്പെടാവുന്ന പേപ്പർ'
    },
    es: {
      displayName: 'Cartón Corrugado y Papel Mixto',
      category: 'Papel y Fibra',
      freshness: 'Embalaje Seco',
      risk: 'Bajo',
      wasteGroup: 'Biodegradable Reciclable',
      processingType: 'Reprocesamiento de Pasta de Papel y Cartón Reciclado',
      recommendation: 'Mantener limpio y seco. Plegar y depositar en el contenedor azul de papel y cartón.',
      shelfLife: 'N/A (Reciclable)',
      ecoImpact: '+0.80 kg CO2 evitado por kg vía reciclaje de papel',
      forensicNote: 'Estructura fibrosa de celulosa plana confirmada.',
      badgeGrade: 'RECICLABLE LÍNEA SECA'
    },
    fr: {
      displayName: 'Carton Ondulé et Papiers Mixtes',
      category: 'Papier et Fibre',
      freshness: 'Emballage Sec',
      risk: 'Faible',
      wasteGroup: 'Biodégradable Recyclable',
      processingType: 'Recyclage en Pâte à Papier et Cartonnage',
      recommendation: 'Garder propre et sec. Aplatir et déposer dans le bac jaune/bleu de tri sélectif.',
      shelfLife: 'N/A (Recyclable)',
      ecoImpact: '+0.80 kg de CO2 évité par kg',
      forensicNote: 'Fibres de cellulose et structure plane validées.',
      badgeGrade: 'FLUX SEC RECYCLABLE'
    }
  },

  // 4. Wood & Timber Scrap
  wood_waste: {
    en: {
      displayName: 'Timber & Wood Scrap',
      category: 'Timber & Biomass Waste',
      freshness: 'Lignin Biomass',
      risk: 'Low',
      wasteGroup: 'Biodegradable',
      processingType: 'Biomass Pelletizing & Horticultural Ground Cover',
      recommendation: 'Deposit to Wood Recovery or Biomass Energy Plant. Clean wood chips make high-value carbon pellets.',
      shelfLife: 'N/A (Biomass)',
      ecoImpact: '+0.60 kg CO2 avoided per kg via wood reclamation',
      forensicNote: 'Lignin grain pattern with organic matte cellulose reflectance.',
      badgeGrade: 'BIODEGRADABLE TIMBER'
    },
    ta: {
      displayName: 'மரக்கழிவுகள் மற்றும் துகள்கள்',
      category: 'மரம் / உயிரி எரிபொருள்',
      freshness: 'லிக்னின் மர உயிரி',
      risk: 'குறைவு',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'மரத்தூள் உருண்டை தயாரிப்பு மற்றும் உயிரி ஆற்றல்',
      recommendation: 'மர மறுசுழற்சி அல்லது உயிரி எரிபொருள் ஆலைக்கு அனுப்பவும்.',
      shelfLife: 'பொருந்தாது (உயிரித் தொகுதி)',
      ecoImpact: '+0.60 கிலோ CO2 வெளியேற்றம் சேமிக்கப்பட்டது',
      forensicNote: 'இயற்கை மர நார் மற்றும் லிக்னின் அமைப்பு கண்டறியப்பட்டது.',
      badgeGrade: 'மக்கும் மரக்கழிவு'
    },
    hi: {
      displayName: 'इमारती लकड़ी और लकड़ी का स्क्रैप',
      category: 'टिम्बर और बायोमास अपशिष्ट',
      freshness: 'लिग्निन बायोमास',
      risk: 'निम्न',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'बायोमास पेलेटाइजिंग और ऊर्जा संयंत्र',
      recommendation: 'लकड़ी वसूली संयंत्र में जमा करें। साफ लकड़ी के टुकड़े उच्च-मूल्य ईंधन छर्रों में बदलते हैं।',
      shelfLife: 'लागू नहीं (बायोमास)',
      ecoImpact: '+0.60 किग्रा CO2 उत्सर्जन में कमी',
      forensicNote: 'लकड़ी के रेशे और लिग्निन बनावट सत्यापित।',
      badgeGrade: 'बायोडिग्रेडेबल लकड़ी'
    },
    te: {
      displayName: 'కలప మరియు చెక్క ముక్కల వ్యర్థాలు',
      category: 'చెక్క & బయోమాస్ వ్యర్థాలు',
      freshness: 'లిగ్నిన్ బయోమాస్',
      risk: 'తక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'బయోమాస్ పెల్లెటైజింగ్ & శక్తి రికవరీ',
      recommendation: 'చెక్క రికవరీ లేదా బయోమాస్ ఇంధన కేంద్రానికి తరలించండి.',
      shelfLife: 'వర్తించదు (బయోమాస్)',
      ecoImpact: '+0.60 కిలోల CO2 ఆదా',
      forensicNote: 'చెక్క ఫైబర్ నిర్మాణం నిర్ధారించబడింది.',
      badgeGrade: 'బయోడిగ్రేడబుల్ కలప'
    },
    kn: {
      displayName: 'ಮರದ ತುಂಡುಗಳು ಮತ್ತು ಮರದ ತ್ಯಾಜ್ಯ',
      category: 'ಮರ ಮತ್ತು ಜೈವಿಕ ಇಂಧನ',
      freshness: 'ಲಿಗ್ನಿನ್ ಮರದ ತ್ಯಾಜ್ಯ',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ಜೈವಿಕ ಇಂಧನ ಸಂಸ್ಕರಣೆ',
      recommendation: 'ಮರ ಮರುಬಳಕೆ ಕೇಂದ್ರ ಅಥವಾ ಬಯೋಮಾಸ್ ಇಂಧನ ಸ್ಥಾವರಕ್ಕೆ ಕಳುಹಿಸಿ.',
      shelfLife: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
      ecoImpact: '+0.60 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಮರದ ನೈಸರ್ಗಿಕ ರಚನೆ ದೃಢಪಟ್ಟಿದೆ.',
      badgeGrade: 'ಜೈವಿಕ ವಿಘಟನೀಯ ಮರ'
    },
    ml: {
      displayName: 'തടി & തടി അവശിഷ്ടങ്ങൾ',
      category: 'തടി / ബയോമാസ് മാലിന്യം',
      freshness: 'ലിഗ്നിൻ ബയോമാസ്',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'ബയോമാസ് പെല്ലറ്റൈസിംഗ് & ഊർജ്ജോത്പാദനം',
      recommendation: 'തടി റിക്കവറി പ്ലാന്റിലേക്ക് മാറ്റുക. ഉയർന്ന നിലവാരമുള്ള ബയോഫ്യൂവൽ ആയി ഉപയോഗിക്കാം.',
      shelfLife: 'ബാധകമല്ല',
      ecoImpact: '+0.60 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'തടിയുടെ സ്വാഭാവിക ഘടന സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ബയോഡീഗ്രേഡബിൾ തടി'
    },
    es: {
      displayName: 'Madera y Restos de Carpintería',
      category: 'Madera y Biomasa',
      freshness: 'Biomasa de Lignina',
      risk: 'Bajo',
      wasteGroup: 'Biodegradable',
      processingType: 'Peletización de Biomasa y Acolchado Forestal',
      recommendation: 'Llevar a planta de reciclaje de madera o valorización energética de biomasa.',
      shelfLife: 'N/A (Biomasa)',
      ecoImpact: '+0.60 kg CO2 evitado por kg de madera recuperada',
      forensicNote: 'Vetas de madera y estructura de lignina verificadas.',
      badgeGrade: 'MADERA BIODEGRADABLE'
    },
    fr: {
      displayName: 'Bois et Chutes de Menuiserie',
      category: 'Bois et Biomasse',
      freshness: 'Biomasse de Lignine',
      risk: 'Faible',
      wasteGroup: 'Biodégradable',
      processingType: 'Granulation en Pellets et Valorisation Énergétique',
      recommendation: 'Déposer en déchetterie pour broyage en pellets de chauffage ou paillis décoratif.',
      shelfLife: 'N/A (Biomasse)',
      ecoImpact: '+0.60 kg de CO2 évité par kg',
      forensicNote: 'Fibres de bois et texture de lignine confirmées.',
      badgeGrade: 'BOIS BIODÉGRADABLE'
    }
  },

  // 5. Metal Cans & Tins
  metal_cans: {
    en: {
      displayName: 'Metal Cans & Tins (Aluminum / Steel)',
      category: 'Metals & Alloys',
      freshness: 'Metal Packaging',
      risk: 'Low',
      wasteGroup: 'Non-Biodegradable Recyclable',
      processingType: 'Foundry Smelting & Infinite Metal Recycling',
      recommendation: 'Rinse and compress into dry metallic bin. 100% infinitely recyclable with 95% energy savings over virgin mining.',
      shelfLife: 'N/A (Recyclable)',
      ecoImpact: '+1.25 kg CO2 avoided per kg via aluminum recycling',
      forensicNote: 'Specular glint and neutral metallic luminance confirmed.',
      badgeGrade: 'INFINITELY RECYCLABLE METAL'
    },
    ta: {
      displayName: 'உலோக கேன்கள் மற்றும் தகர டின்கள்',
      category: 'உலோகங்கள் & கலவைகள்',
      freshness: 'உலோக பேக்கேஜிங்',
      risk: 'குறைவு',
      wasteGroup: 'மக்காத மறுசுழற்சிக் கழிவு',
      processingType: 'உலோக உருக்காலை மற்றும் முடிவில்லா மறுசுழற்சி',
      recommendation: 'கழுவி, நசுக்கி நீல நிற உலர் மறுசுழற்சி தொட்டியில் போடவும். 100% மறுசுழற்சி செய்யக்கூடியது.',
      shelfLife: 'பொருந்தாது (மறுசுழற்சி)',
      ecoImpact: '+1.25 கிலோ CO2 வெளியேற்றம் சேமிக்கப்பட்டது',
      forensicNote: 'உலோக பளபளப்பு மற்றும் பிரதிபலிப்பு உறுதி செய்யப்பட்டது.',
      badgeGrade: 'மறுசுழற்சி உலோகம்'
    },
    hi: {
      displayName: 'धातु के डिब्बे और टिन (एल्युमिनियम / स्टील)',
      category: 'धातु और मिश्र धातु',
      freshness: 'धातु पैकेजिंग',
      risk: 'निम्न',
      wasteGroup: 'गैर-बायोडिग्रेडेबल रिसाइकिल योग्य',
      processingType: 'फाउंड्री स्मेल्टिंग और अनंत धातु पुनर्चक्रण',
      recommendation: 'धोकर चपटा करें और सूखे रीसाइक्लिंग डिब्बे में डालें। यह 100% पुनर्चक्रण योग्य है।',
      shelfLife: 'लागू नहीं (पुनर्चक्रण)',
      ecoImpact: '+1.25 किग्रा CO2 की बचत',
      forensicNote: 'धात्विक चमक और परावर्तन की पुष्टि हुई।',
      badgeGrade: 'अनंत पुनर्चक्रण योग्य धातु'
    },
    te: {
      displayName: 'లోహపు డబ్బాలు మరియు టిన్నులు',
      category: 'లోహాలు & మిశ్రమాలు',
      freshness: 'లోహపు ప్యాకేజింగ్',
      risk: 'తక్కువ',
      wasteGroup: 'నాన్-బయోడిగ్రేడబుల్ రీసైకిల్ చేయదగినది',
      processingType: 'మెటల్ స్మెల్టింగ్ & ఇన్ఫినిట్ రీసైక్లింగ్',
      recommendation: 'కడిగి డ్రై రీసైక్లింగ్ బిన్‌లో వేయండి. 100% రీసైకిల్ చేయదగినది.',
      shelfLife: 'వర్తించదు (రీసైక్లింగ్)',
      ecoImpact: '+1.25 కిలోల CO2 ఆదా',
      forensicNote: 'లోహపు కాంతి మరియు రిఫ్లెక్షన్ ధృవీకరించబడింది.',
      badgeGrade: 'రీసైకిల్ చేయదగిన లోహం'
    },
    kn: {
      displayName: 'ಲೋಹದ ಕ್ಯಾನ್‌ಗಳು ಮತ್ತು ಟಿನ್ಗಳು',
      category: 'ಲೋಹಗಳು',
      freshness: 'ಲೋಹದ ಪ್ಯಾಕೇಜಿಂಗ್',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯವಲ್ಲದ ಮರುಬಳಕೆಯಾಗುವ',
      processingType: 'ಕರಗಿಸುವಿಕೆ ಮತ್ತು ಲೋಹ ಮರುಬಳಕೆ',
      recommendation: 'ತೊಳೆದು ಒಣ ಕಸದ ಬುಟ್ಟಿಗೆ ಹಾಕಿ. 100% ಮರುಬಳಕೆ ಮಾಡಬಹುದು.',
      shelfLife: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
      ecoImpact: '+1.25 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಲೋಹದ ಹೊಳಪು ಪತ್ತೆಯಾಗಿದೆ.',
      badgeGrade: 'ಮರುಬಳಕೆಯಾಗುವ ಲೋಹ'
    },
    ml: {
      displayName: 'ലോഹ ക്യാനുകൾ & ടിന്നുകൾ',
      category: 'ലോഹങ്ങൾ',
      freshness: 'മെറ്റൽ പാക്കേജിംഗ്',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'നോൺ-ബയോഡീഗ്രേഡബിൾ റീസൈക്കിൾ ചെയ്യാവുന്നത്',
      processingType: 'മെറ്റൽ സ്മെൽറ്റിംഗ് & റീസൈക്ലിംഗ്',
      recommendation: 'കഴുകി വൃത്തിയാക്കി ഉണങ്ങിയ റീസൈക്ലിംഗ് ബിന്നിൽ നിക്ഷേപിക്കുക. 100% പുനരുപയോഗം സാധ്യമാണ്.',
      shelfLife: 'ബാധകമല്ല',
      ecoImpact: '+1.25 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'ലോഹത്തിന്റെ പ്രകാശപ്രതിഫലനം സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'റീസൈക്കിൾ ചെയ്യാവുന്ന ലോഹം'
    },
    es: {
      displayName: 'Latas de Aluminio y Envases Metálicos',
      category: 'Metales y Aleaciones',
      freshness: 'Embalaje Metálico',
      risk: 'Bajo',
      wasteGroup: 'No Biodegradable Reciclable',
      processingType: 'Fundición en Horno y Reciclaje Infinito',
      recommendation: 'Enjuagar, aplastar y depositar en el contenedor amarillo. 100% reciclable infinitamente.',
      shelfLife: 'N/A (Reciclable)',
      ecoImpact: '+1.25 kg CO2 evitado por kg vía reciclaje de aluminio',
      forensicNote: 'Brillo especular y tono metálico neutro confirmados.',
      badgeGrade: 'METAL INFINITAMENTE RECICLABLE'
    },
    fr: {
      displayName: 'Canettes en Aluminium et Boîtes Métalliques',
      category: 'Métaux et Alliages',
      freshness: 'Emballage Métallique',
      risk: 'Faible',
      wasteGroup: 'Non Biodégradable Recyclable',
      processingType: 'Fonderie et Recyclage Métallique Infini',
      recommendation: 'Rincer, écraser et jeter dans le bac jaune de tri. 100% recyclable à l’infini avec 95% d’énergie économisée.',
      shelfLife: 'N/A (Recyclable)',
      ecoImpact: '+1.25 kg de CO2 évité par kg',
      forensicNote: 'Éclat métallique spéculaire caractéristique validé.',
      badgeGrade: 'MÉTAL RECYCLABLE À L’INFINI'
    }
  },

  // 6. PET Plastic Bottles
  plastic_bottles: {
    en: {
      displayName: 'PET Plastic Beverage Bottles (#1)',
      category: 'Plastics (PET #1)',
      freshness: 'Plastic Packaging',
      risk: 'Low',
      wasteGroup: 'Non-Biodegradable Recyclable',
      processingType: 'Optical Flake Sorting & Polymer Pelletizing',
      recommendation: 'Empty liquids, crush container, replace cap, and route to dry recyclable bin.',
      shelfLife: 'N/A (Recyclable)',
      ecoImpact: '+1.10 kg CO2 avoided per kg via polymer recovery',
      forensicNote: 'High specular transmissive polymer sheen and PET contour observed.',
      badgeGrade: 'RECYCLABLE POLYMER PET #1'
    },
    ta: {
      displayName: 'பிஇடி பிளாஸ்டிக் பாட்டில்கள் (PET #1)',
      category: 'நெகிழிகள் (PET #1)',
      freshness: 'பிளாஸ்டிக் பேக்கேஜிங்',
      risk: 'குறைவு',
      wasteGroup: 'மக்காத மறுசுழற்சிக் கழிவு',
      processingType: 'ஒளியியல் பிரித்தெடுத்தல் மற்றும் பாலிமர் துகளாக்கல்',
      recommendation: 'நீரை முழுமையாக வெளியேற்றி, நசுக்கி மறுசுழற்சி தொட்டியில் போடவும்.',
      shelfLife: 'பொருந்தாது (மறுசுழற்சி)',
      ecoImpact: '+1.10 கிலோ CO2 வெளியேற்றம் சேமிக்கப்பட்டது',
      forensicNote: 'பாலிமர் பிளாஸ்டிக் ஒளி ஊடுருவல் தன்மை கண்டறியப்பட்டது.',
      badgeGrade: 'மறுசுழற்சி பிளாஸ்டிக்'
    },
    hi: {
      displayName: 'पीईटी प्लास्टिक की बोतलें (PET #1)',
      category: 'प्लास्टिक (PET #1)',
      freshness: 'प्लास्टिक पैकेजिंग',
      risk: 'निम्न',
      wasteGroup: 'गैर-बायोडिग्रेडेबल रिसाइकिल योग्य',
      processingType: 'ऑप्टिकल सॉर्टिंग और पॉलीमर पेलेटाइजिंग',
      recommendation: 'तरल पदार्थ खाली करें, बोतल को पिचकाएं और नीले रीसाइक्लिंग डिब्बे में डालें।',
      shelfLife: 'लागू नहीं (पुनर्चक्रण)',
      ecoImpact: '+1.10 किग्रा CO2 की बचत',
      forensicNote: 'पॉलीमर की चमक और पीईटी संरचना सत्यापित।',
      badgeGrade: 'पुनर्चक्रण योग्य प्लास्टिक'
    },
    te: {
      displayName: 'పిఈటి ప్లాస్టిక్ సీసాలు (PET #1)',
      category: 'ప్లాస్టిక్స్ (PET #1)',
      freshness: 'ప్లాస్టిక్ ప్యాకేజింగ్',
      risk: 'తక్కువ',
      wasteGroup: 'నాన్-బయోడిగ్రేడబుల్ రీసైకిల్ చేయదగినది',
      processingType: 'ఆప్టికల్ సార్టింగ్ & పాలిమర్ రీసైక్లింగ్',
      recommendation: 'ద్రవాలను ఖాళీ చేసి, క్రష్ చేసి డ్రై రీసైక్లింగ్ బిన్‌లో వేయండి.',
      shelfLife: 'వర్తించదు (రీసైక్లింగ్)',
      ecoImpact: '+1.10 కిలోల CO2 ఆదా',
      forensicNote: 'పారదర్శక పాలిమర్ లక్షణాలు గుర్తించబడ్డాయి.',
      badgeGrade: 'రీసైకిల్ చేయదగిన ప్లాస్టిక్'
    },
    kn: {
      displayName: 'ಪಿಇಟಿ ಪ್ಲಾಸ್ಟಿಕ್ ಬಾಟಲಿಗಳು (PET #1)',
      category: 'ಪ್ಲಾಸ್ಟಿಕ್',
      freshness: 'ಪ್ಲಾಸ್ಟಿಕ್ ಪ್ಯಾಕೇಜಿಂಗ್',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯವಲ್ಲದ ಮರುಬಳಕೆಯಾಗುವ',
      processingType: 'ಪಾಲಿಮರ್ ಮರುಬಳಕೆ',
      recommendation: 'ದ್ರವವನ್ನು ಖಾಲಿ ಮಾಡಿ, ಬಾಟಲಿಯನ್ನು ಅದುಮಿ ಒಣ ಕಸದೊಂದಿಗೆ ನೀಡಿ.',
      shelfLife: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
      ecoImpact: '+1.10 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಪಾರದರ್ಶಕ ಪ್ಲಾಸ್ಟಿಕ್ ಗುಣಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ.',
      badgeGrade: 'ಮರುಬಳಕೆಯಾಗುವ ಪ್ಲಾಸ್ಟಿಕ್'
    },
    ml: {
      displayName: 'പെറ്റ് പ്ലാസ്റ്റിക് കുപ്പികൾ (PET #1)',
      category: 'പ്ലാസ്റ്റിക് (PET #1)',
      freshness: 'പ്ലാസ്റ്റിക് പാക്കേജിംഗ്',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'നോൺ-ബയോഡീഗ്രേഡബിൾ റീസൈക്കിൾ ചെയ്യാവുന്നത്',
      processingType: 'പോളിമർ പെല്ലറ്റൈസിംഗ് & റീസൈക്ലിംഗ്',
      recommendation: 'ദ്രാവകം പൂർണ്ണമായും ഒഴുക്കിക്കളഞ്ഞ്, കുപ്പി ചതച്ച് റീസൈക്ലിംഗ് ബിന്നിലിടുക.',
      shelfLife: 'ബാധകമല്ല',
      ecoImpact: '+1.10 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'സുതാര്യമായ പോളിമർ ഉപരിതലം സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'റീസൈക്കിൾ ചെയ്യപ്പെടാവുന്ന പ്ലാസ്റ്റിക്'
    },
    es: {
      displayName: 'Botellas de Plástico PET (#1)',
      category: 'Plásticos (PET #1)',
      freshness: 'Envase Plástico',
      risk: 'Bajo',
      wasteGroup: 'No Biodegradable Reciclable',
      processingType: 'Separación Óptica y Granulado de Polímero',
      recommendation: 'Vaciar líquidos, aplastar la botella y depositar en el contenedor amarillo.',
      shelfLife: 'N/A (Reciclable)',
      ecoImpact: '+1.10 kg CO2 evitado por kg vía recuperación de polímeros',
      forensicNote: 'Brillo translúcido y contorno característico de PET observados.',
      badgeGrade: 'POLÍMERO RECICLABLE PET #1'
    },
    fr: {
      displayName: 'Bouteilles en Plastique PET (#1)',
      category: 'Plastiques (PET #1)',
      freshness: 'Emballage Plastique',
      risk: 'Faible',
      wasteGroup: 'Non Biodégradable Recyclable',
      processingType: 'Tri Optique et Régénération en Granulés Plastiques',
      recommendation: 'Vider le liquide, écraser la bouteille avec son bouchon et mettre dans le bac jaune.',
      shelfLife: 'N/A (Recyclable)',
      ecoImpact: '+1.10 kg de CO2 évité par kg',
      forensicNote: 'Translucidité et réflectance caractéristiques du PET confirmées.',
      badgeGrade: 'POLYMÈRE RECYCLABLE PET #1'
    }
  },

  // 7. Plastic Bags & Wrappers
  plastic_bags: {
    en: {
      displayName: 'Plastic Bags & Film Wrappers (LDPE #4)',
      category: 'Plastics (LDPE #4 / Film)',
      freshness: 'Soft Film Waste',
      risk: 'Medium',
      wasteGroup: 'Non-Biodegradable',
      processingType: 'Mechanical Film Pelletizing & Pyrolysis Recovery',
      recommendation: 'Clean, dry, and deliver to dedicated soft plastic / film collection channels. Do not contaminate organic bins.',
      shelfLife: 'N/A (Non-Biodegradable)',
      ecoImpact: '+0.70 kg CO2 avoided per kg via film repurposing',
      forensicNote: 'High spatial edge-frequency wrinkles and flexible thin polymer film detected.',
      badgeGrade: 'SOFT FILM POLYMER'
    },
    ta: {
      displayName: 'பாலித்தீன் பைகள் மற்றும் மெல்லிய உறைகள்',
      category: 'நெகிழிகள் (LDPE #4)',
      freshness: 'மெல்லிய நெகிழி கழிவு',
      risk: 'நடுத்தரம்',
      wasteGroup: 'மக்காத கழிவு',
      processingType: 'இயந்திர பிளாஸ்டிக் துகளாக்கல் மற்றும் வெப்பப் பிரிப்பு',
      recommendation: 'சுத்தம் செய்து உலர் பிளாஸ்டிக் சேகரிப்பு மையத்தில் ஒப்படைக்கவும். சாக்கடையில் போடாதீர்கள்.',
      shelfLife: 'பொருந்தாது (மக்காது)',
      ecoImpact: '+0.70 கிலோ CO2 வெளியேற்றம் சேமிக்கப்பட்டது',
      forensicNote: 'மெல்லிய நெகிழி சுருக்கங்கள் மற்றும் ஃபிலிம் வடிவம் கண்டறியப்பட்டது.',
      badgeGrade: 'மக்காத மெல்லிய நெகிழி'
    },
    hi: {
      displayName: 'प्लास्टिक की थैलियां और फिल्म रैपर (LDPE #4)',
      category: 'प्लास्टिक (LDPE #4 / फिल्म)',
      freshness: 'सॉफ्ट फिल्म कचरा',
      risk: 'मध्यम',
      wasteGroup: 'गैर-बायोडिग्रेडेबल',
      processingType: 'फिल्म पेलेटाइजिंग और पायरोलिसिस रिकवरी',
      recommendation: 'साफ और सूखा रखें। समर्पित प्लास्टिक संग्रह केंद्र में जमा करें। नालियों में न फेंके।',
      shelfLife: 'लागू नहीं (गैर-बायोडिग्रेडेबल)',
      ecoImpact: '+0.70 किग्रा CO2 की बचत',
      forensicNote: 'पतली पॉलीमर फिल्म और सिलवटों की उच्च आवृत्ति दर्ज की गई।',
      badgeGrade: 'सॉफ्ट प्लास्टिक फिल्म'
    },
    te: {
      displayName: 'ప్లాస్టిక్ సంచులు మరియు ప్యాకింగ్ ర్యాపర్లు',
      category: 'ప్లాస్టిక్స్ (LDPE #4)',
      freshness: 'సాఫ్ట్ ఫిల్మ్ వ్యర్థాలు',
      risk: 'మధ్యస్థం',
      wasteGroup: 'నాన్-బయోడిగ్రేడబుల్',
      processingType: 'మెకానికల్ ఫిల్మ్ రీసైక్లింగ్',
      recommendation: 'శుభ్రం చేసి సాఫ్ట్ ప్లాస్టిక్ కలెక్షన్ పాయింట్‌కు అందజేయండి.',
      shelfLife: 'వర్తించదు (నాన్-బయోడిగ్రేడబుల్)',
      ecoImpact: '+0.70 కిలోల CO2 ఆదా',
      forensicNote: 'సన్నని పాలిమర్ ముడుతలు గుర్తించబడ్డాయి.',
      badgeGrade: 'నాన్-బయోడిగ్రేడబుల్ ప్లాస్టిక్'
    },
    kn: {
      displayName: 'ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲಗಳು ಮತ್ತು ಹೊದಿಕೆಗಳು',
      category: 'ಪ್ಲಾಸ್ಟಿಕ್ (LDPE #4)',
      freshness: 'ಮೃದುವಾದ ಪ್ಲಾಸ್ಟಿಕ್ ತ್ಯಾಜ್ಯ',
      risk: 'ಮಧ್ಯಮ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯವಲ್ಲದ',
      processingType: 'ಯಾಂತ್ರಿಕ ಮರುಬಳಕೆ',
      recommendation: 'ಸ್ವಚ್ಛಗೊಳಿಸಿ ಪ್ಲಾಸ್ಟಿಕ್ ಮರುಬಳಕೆ ಕೇಂದ್ರಕ್ಕೆ ನೀಡಿ. ಚರಂಡಿಗಳಿಗೆ ಎಸೆಯಬೇಡಿ.',
      shelfLife: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
      ecoImpact: '+0.70 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ತೆಳುವಾದ ಪ್ಲಾಸ್ಟಿಕ್ ಫಿಲ್ಮ್ ಗುಣಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ.',
      badgeGrade: 'ಮೃದುವಾದ ಪ್ಲಾಸ್ಟಿಕ್'
    },
    ml: {
      displayName: 'പ്ലാസ്റ്റിക് സഞ്ചികൾ & ഫിലിം റാപ്പറുകൾ',
      category: 'പ്ലാസ്റ്റിക് (LDPE #4)',
      freshness: 'സോഫ്റ്റ് ഫിലിം വേസ്റ്റ്',
      risk: 'ഇടത്തരം',
      wasteGroup: 'നോൺ-ബയോഡീഗ്രേഡബിൾ',
      processingType: 'മെക്കാനിക്കൽ ഫിലിം റീസൈക്ലിംഗ്',
      recommendation: 'വൃത്തിയാക്കി സോഫ്റ്റ് പ്ലാസ്റ്റിക് കളക്ഷൻ പോയിന്റിൽ ഏൽപ്പിക്കുക.',
      shelfLife: 'ബാധകമല്ല',
      ecoImpact: '+0.70 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'പോളിമർ ഫിലിമിന്റെ നേർത്ത ഘടന സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'നോൺ-ബയോഡീഗ്രേഡബിൾ'
    },
    es: {
      displayName: 'Bolsas de Plástico y Envoltorios Flexibles',
      category: 'Plásticos (LDPE #4 / Film)',
      freshness: 'Residuo Film Plástico',
      risk: 'Medio',
      wasteGroup: 'No Biodegradable',
      processingType: 'Pelletizado de Film y Pirolisis',
      recommendation: 'Limpiar y llevar a puntos específicos de recogida de plásticos blandos.',
      shelfLife: 'N/A (No biodegradable)',
      ecoImpact: '+0.70 kg CO2 evitado por kg vía reprocesamiento',
      forensicNote: 'Arrugas de alta frecuencia espacial y película plástica delgada.',
      badgeGrade: 'PLÁSTICO FILM FLEXIBLE'
    },
    fr: {
      displayName: 'Sacs Plastiques et Emballages Souples',
      category: 'Plastiques (LDPE #4 / Film)',
      freshness: 'Film Plastique Souple',
      risk: 'Moyen',
      wasteGroup: 'Non Biodégradable',
      processingType: 'Régénération Mécanique et Recyclage Chimique',
      recommendation: 'Nettoyer, sécher et déposer dans les points de collecte des plastiques souples.',
      shelfLife: 'N/A (Non biodégradable)',
      ecoImpact: '+0.70 kg de CO2 évité par kg',
      forensicNote: 'Ondulations caractéristiques du film polyéthylène mince détectées.',
      badgeGrade: 'PLASTIQUE FILM SOUPLE'
    }
  },

  // 8. Electronic Scrap & Hardware
  ewaste: {
    en: {
      displayName: 'Electronic Scrap & Hardware (E-Waste)',
      category: 'Electronic Waste (E-Waste)',
      freshness: 'Electronic Hardware',
      risk: 'High',
      wasteGroup: 'Non-Biodegradable Hazardous',
      processingType: 'Certified WEEE Dismantling & Precious Metal Reclamation',
      recommendation: 'Hazardous heavy metals present. Strictly prohibited from general trash. Deliver to authorized municipal E-Waste collection facility.',
      shelfLife: 'N/A (Hazardous E-Waste)',
      ecoImpact: '+2.40 kg CO2 avoided per kg via toxic metal sequestration',
      forensicNote: 'Printed circuit board traces, solder nodes, and IC chip geometry verified.',
      badgeGrade: 'HAZARDOUS E-WASTE'
    },
    ta: {
      displayName: 'மின்னணுக் கழிவுகள் மற்றும் சர்க்யூட்டுகள்',
      category: 'மின்னணுக் கழிவு (E-Waste)',
      freshness: 'மின்னணு உபகரணம்',
      risk: 'அதிகம்',
      wasteGroup: 'ஆபத்தான மக்காத கழிவு',
      processingType: 'சான்றளிக்கப்பட்ட இ-வேஸ்ட் பிரித்தெடுத்தல் மற்றும் உலோக மீட்பு',
      recommendation: 'விஷத்தன்மை கொண்ட கன உலோகங்கள் உள்ளன. பொது குப்பையில் போடக் கூடாது. இ-வேஸ்ட் மையத்தில் ஒப்படைக்கவும்.',
      shelfLife: 'பொருந்தாது (ஆபத்தான கழிவு)',
      ecoImpact: '+2.40 கிலோ நச்சு உலோக மாசுபாடு தடுக்கப்பட்டது',
      forensicNote: 'சர்க்யூட் போர்டு மற்றும் சாலிடர் புள்ளிகள் கண்டறியப்பட்டது.',
      badgeGrade: 'ஆபத்தான இ-வேஸ்ட்'
    },
    hi: {
      displayName: 'इलेक्ट्रॉनिक कचरा और हार्डवेयर (ई-कचरा)',
      category: 'इलेक्ट्रॉनिक अपशिष्ट (ई-अपशिष्ट)',
      freshness: 'इलेक्ट्रॉनिक हार्डवेयर',
      risk: 'उच्च',
      wasteGroup: 'खतरनाक गैर-बायोडिग्रेडेबल',
      processingType: 'प्रमाणित ई-कचरा निराकरण और कीमती धातु पुनर्प्राप्ति',
      recommendation: 'खतरनाक भारी धातुएं मौजूद हैं। सामान्य कचरे में न डालें। अधिकृत ई-कचरा केंद्र पर जमा करें।',
      shelfLife: 'लागू नहीं (खतरनाक ई-कचरा)',
      ecoImpact: '+2.40 किग्रा विषैली धातु प्रदूषण रोका गया',
      forensicNote: 'पीसीबी सर्किट बोर्ड और सोल्डर नोड्स सत्यापित।',
      badgeGrade: 'खतरनाक ई-कचरा'
    },
    te: {
      displayName: 'ఎలక్ట్రానిక్ వ్యర్థాలు మరియు సర్క్యూట్ బోర్డులు (ఇ-వేస్ట్)',
      category: 'ఎలక్ట్రానిక్ వేస్ట్ (E-Waste)',
      freshness: 'ఎలక్ట్రానిక్ హార్డ్‌వేర్',
      risk: 'ఎక్కువ',
      wasteGroup: 'ప్రమాదకరమైన నాన్-బయోడిగ్రేడబుల్',
      processingType: 'సర్టిఫైడ్ ఇ-వేస్ట్ రికవరీ & మెటల్ ఎక్స్‌ట్రాక్షన్',
      recommendation: 'హానికరమైన లోహాలు ఉన్నాయి. సాధారణ చెత్తలో వేయరాదు. అధీకృత ఈ-వేస్ట్ కేంద్రానికి ఇవ్వండి.',
      shelfLife: 'వర్తించదు (ప్రమాదకరం)',
      ecoImpact: '+2.40 కిలోల విషపూరిత లోహ కాలుష్యం ఆపబడింది',
      forensicNote: 'సర్క్యూట్ బోర్డ్ నమూనాలు మరియు ఎలక్ట్రానిక్ విభాగాలు గుర్తించబడ్డాయి.',
      badgeGrade: 'ప్రమాదకరమైన ఇ-వేస్ట్'
    },
    kn: {
      displayName: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ತ್ಯಾಜ್ಯ ಮತ್ತು ಸರ್ಕ್ಯೂಟ್ ಘಟಕಗಳು',
      category: 'ಇ-ತ್ಯಾಜ್ಯ (E-Waste)',
      freshness: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಹಾರ್ಡ್‌ವೇರ್',
      risk: 'ಹೆಚ್ಚು',
      wasteGroup: 'ಅಪಾಯಕಾರಿ ಜೈವಿಕ ವಿಘಟನೀಯವಲ್ಲದ',
      processingType: 'ಅಧಿಕೃತ ಇ-ತ್ಯಾಜ್ಯ ಸಂಸ್ಕರಣೆ',
      recommendation: 'ವಿಷಕಾರಿ ಭಾರೀ ಲೋಹಗಳನ್ನು ಒಳಗೊಂಡಿದೆ. ಸಾಮಾನ್ಯ ಕಸಕ್ಕೆ ಹಾಕಬೇಡಿ. ಅಧಿಕೃತ ಇ-ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹಣಾ ಕೇಂದ್ರಕ್ಕೆ ನೀಡಿ.',
      shelfLife: 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
      ecoImpact: '+2.40 ಕೆಜಿ ವಿಷಕಾರಿ ಲೋಹ ಮಾಲಿನ್ಯ ತಡೆಗಟ್ಟಲಾಗಿದೆ',
      forensicNote: 'ಸರ್ಕ್ಯೂಟ್ ಬೋರ್ಡ್ ಮತ್ತು ಬೆಸುಗೆ ಬಿಂದುಗಳು ಪತ್ತೆಯಾಗಿವೆ.',
      badgeGrade: 'ಅಪಾಯಕಾರಿ ಇ-ತ್ಯಾಜ್ಯ'
    },
    ml: {
      displayName: 'ഇലക്ട്രോണിക് അവശിഷ്ടങ്ങൾ (ഇ-മാലിന്യം)',
      category: 'ഇ-മാലിന്യം (E-Waste)',
      freshness: 'ഇലക്ട്രോണിക് ഹാർഡ്‌വെയർ',
      risk: 'ഉയർന്നത്',
      wasteGroup: 'അപകടകരമായ നോൺ-ബയോഡീഗ്രേഡബിൾ',
      processingType: 'പ്രത്യേക ഇ-മാലിന്യ നിർമാർജനവും ലോഹ വീണ്ടെടുക്കലും',
      recommendation: 'വിഷാംശമുള്ള ഘടകങ്ങൾ അടങ്ങിയിരിക്കുന്നു. സാധാരണ മാലിന്യത്തിൽ നിക്ഷേപിക്കരുത്. അംഗീകൃത ഇ-വേസ്റ്റ് കേന്ദ്രത്തിൽ ഏൽപ്പിക്കുക.',
      shelfLife: 'ബാധകമല്ല (അപകടകരമായ മാലിന്യം)',
      ecoImpact: '+2.40 കിലോഗ്രാം വിഷ ലോഹ മലിനീകരണം തടഞ്ഞു',
      forensicNote: 'സർക്യൂട്ട് ബോർഡുകളും മെറ്റൽ പാടുകളും സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'അപകടകരമായ ഇ-മാലിന്യം'
    },
    es: {
      displayName: 'Residuos Electrónicos y Placas de Circuitos (E-Waste)',
      category: 'Residuos Electrónicos (RAEE)',
      freshness: 'Hardware Electrónico',
      risk: 'Alto',
      wasteGroup: 'No Biodegradable Peligroso',
      processingType: 'Desmantelamiento RAEE y Recuperación de Metales Preciosos',
      recommendation: 'Contiene metales pesados tóxicos. Estrictamente prohibido en basura común. Llevar a punto limpio autorizado.',
      shelfLife: 'N/A (Residuo Peligroso)',
      ecoImpact: '+2.40 kg CO2 evitado por kg vía retención de metales tóxicos',
      forensicNote: 'Pistas de placa de circuito impreso y componentes soldados verificados.',
      badgeGrade: 'RESIDUO ELECTRÓNICO PELIGROSO'
    },
    fr: {
      displayName: 'Déchets d’Équipements Électroniques (D3E)',
      category: 'Déchets Électroniques (DEEE)',
      freshness: 'Matériel Électronique',
      risk: 'Élevé',
      wasteGroup: 'Non Biodégradable Dangereux',
      processingType: 'Démantèlement DEEE et Extraction des Métaux Lourds',
      recommendation: 'Contient des substances toxiques. Dépôt obligatoire en déchetterie ou point de collecte agréé DEEE.',
      shelfLife: 'N/A (Déchet Dangereux)',
      ecoImpact: '+2.40 kg de CO2 et métaux lourds séquestrés par kg',
      forensicNote: 'Circuits imprimés et composants électroniques identifiés.',
      badgeGrade: 'DÉCHET ÉLECTRONIQUE DANGEREUX'
    }
  },

  // 9. Fresh Orange
  freshoranges: {
    en: {
      displayName: 'Fresh Valencia Orange (Citrus sinensis)',
      category: 'Produce',
      freshness: 'Fresh',
      risk: 'Low',
      wasteGroup: 'Biodegradable',
      processingType: 'Direct Surplus Redistribution / NGO Kitchens',
      recommendation: 'Certified Grade A regulatory freshness. Firm peel, intact oil glands, zero blemishes. 100% eligible for immediate surplus donation.',
      shelfLife: '7-10 days',
      ecoImpact: '+0.50 kg CO2 avoided via direct redistribution',
      forensicNote: 'Optimal carotenoid hydration curve and intact peel cuticle structure.',
      badgeGrade: 'GRADE A (REGULATORY FRESH)'
    },
    ta: {
      displayName: 'புதிய ஆரஞ்சு பழம்',
      category: 'பழங்கள் & காய்கறிகள்',
      freshness: 'புதியது',
      risk: 'குறைவு',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'நேரடி உபரி உணவு நன்கொடை / தொண்டு நிறுவனங்கள்',
      recommendation: 'உயர்தர முதல் நிலை புதிய உணவு. கெட்டுப்போகாத தோல். 100% உணவு நன்கொடைக்கு தகுதியானது.',
      shelfLife: '7-10 நாட்கள்',
      ecoImpact: '+0.50 கிலோ CO2 சேமிக்கப்பட்டது',
      forensicNote: 'ஆரோக்கியமான தோல் அமைப்பு மற்றும் கரோட்டினாய்டு உறுதி செய்யப்பட்டது.',
      badgeGrade: 'முதல் தரம் (புதிய உணவு)'
    },
    hi: {
      displayName: 'ताजा संतरा (साइट्रस साइनेंसिस)',
      category: 'ताजे फल और सब्जियां',
      freshness: 'ताजा',
      risk: 'निम्न',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'प्रत्यक्ष अधिशेष दान / एनजीओ रसोई',
      recommendation: 'प्रमाणित ग्रेड ए ताजगी। सख्त छिलका, शून्य दाग। 100% तुरंत दान के लिए योग्य।',
      shelfLife: '7-10 दिन',
      ecoImpact: '+0.50 किग्रा CO2 की बचत',
      forensicNote: 'इष्टतम कैरोटीनॉयड हाइड्रेशन और अक्षुण्ण छिलका देखा गया।',
      badgeGrade: 'ग्रेड ए (ताजा खाद्य)'
    },
    te: {
      displayName: 'తాజా నారింజ పండు',
      category: 'తాజా పండ్లు',
      freshness: 'తాజా',
      risk: 'తక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'నేరుగా మిగులు ఆహార విరాళం / ఎన్జీవో కేంద్రాలు',
      recommendation: 'సర్టిఫైడ్ గ్రేడ్ A నాణ్యత. ఎటువంటి మచ్చలు లేవు. వెంటనే విరాళం ఇవ్వడానికి 100% అనుకూలం.',
      shelfLife: '7-10 రోజులు',
      ecoImpact: '+0.50 కిలోల CO2 ఆదా',
      forensicNote: 'ఆరోగ్యకరమైన తొక్క నిర్మాణం గుర్తించబడింది.',
      badgeGrade: 'గ్రేడ్ A (తాజాది)'
    },
    kn: {
      displayName: 'ತಾಜಾ ಕಿತ್ತಳೆ ಹಣ್ಣು',
      category: 'ತಾಜಾ ಹಣ್ಣುಗಳು',
      freshness: 'ತಾಜಾ',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ನೇರ ಆಹಾರ ದಾನ / ಸಮುದಾಯ ಅಡುಗೆಮನೆ',
      recommendation: 'ದೃಢೀಕೃತ ಗ್ರೇಡ್ ಎ ತಾಜಾತನ. ಯಾವುದೇ ಕಲೆಗಳಿಲ್ಲ. ದಾನ ಮಾಡಲು 100% ಸೂಕ್ತವಾಗಿದೆ.',
      shelfLife: '7-10 ದಿನಗಳು',
      ecoImpact: '+0.50 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಸಿಪ್ಪೆ ರಚನೆ ದೃಢಪಟ್ಟಿದೆ.',
      badgeGrade: 'ಗ್ರೇಡ್ ಎ (ತಾಜಾ ಆಹಾರ)'
    },
    ml: {
      displayName: 'പുതിയ ഓറഞ്ച്',
      category: 'പഴങ്ങൾ',
      freshness: 'പുതിയത്',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'നേരിട്ടുള്ള മിച്ചഭക്ഷണ വിതരണം',
      recommendation: 'ഗ്രേഡ് എ ഗുണനിലവാരം. പാടുകളില്ലാത്ത നല്ല തൊലി. ഭക്ഷണമായി നൽകാൻ 100% അനുയോജ്യം.',
      shelfLife: '7-10 ദിവസങ്ങൾ',
      ecoImpact: '+0.50 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'ആരോഗ്യമുള്ള കോശഘടന സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ഗ്രേഡ് എ (ഫ്രഷ്)'
    },
    es: {
      displayName: 'Naranja Valencia Fresca (Citrus sinensis)',
      category: 'Frutas y Verduras',
      freshness: 'Fresco',
      risk: 'Bajo',
      wasteGroup: 'Biodegradable',
      processingType: 'Redistribución Directa de Excedentes / Comedores Sociales',
      recommendation: 'Certificado de frescura regulatoria Grado A. Piel firme sin manchas. 100% apto para donación de alimentos.',
      shelfLife: '7-10 días',
      ecoImpact: '+0.50 kg CO2 evitado vía redistribución directa',
      forensicNote: 'Hidratación óptima de carotenoides y cutícula intacta.',
      badgeGrade: 'GRADO A (FRESCO)'
    },
    fr: {
      displayName: 'Orange Valencia Fraîche (Citrus sinensis)',
      category: 'Fruits et Légumes',
      freshness: 'Frais',
      risk: 'Faible',
      wasteGroup: 'Biodégradable',
      processingType: 'Redistribution Directe des Surplus / Banques Alimentaires',
      recommendation: 'Fraîcheur certifiée Catégorie A. Écorce ferme sans lésion. 100% éligible au don alimentaire immédiat.',
      shelfLife: '7-10 jours',
      ecoImpact: '+0.50 kg de CO2 évité par kg',
      forensicNote: 'Hydratation optimale et intégrité cellulaire confirmées.',
      badgeGrade: 'CATÉGORIE A (FRAIS)'
    }
  },

  // 10. Rotten Orange
  rottenoranges: {
    en: {
      displayName: 'Spoiled Orange (Penicillium Mold Infiltration)',
      category: 'Produce',
      freshness: 'Spoiled',
      risk: 'High',
      wasteGroup: 'Biodegradable',
      processingType: 'Municipal Organic Composting & Anaerobic Bio-Digestion',
      recommendation: 'Penicillium fungal mold spores detected on citrus rind. Ineligible for consumption or food donation. Divert to aerobic bio-composting.',
      shelfLife: 'Expired / Unsafe',
      ecoImpact: '+0.50 kg CO2 avoided via composting',
      forensicNote: 'Penicillium digitatum/italicum fungal mycelium patch localized on citrus rind.',
      badgeGrade: 'GRADE C (SPOILED / COMPOST)'
    },
    ta: {
      displayName: 'அழுகிய ஆரஞ்சு பழம் (பூஞ்சை தொற்று)',
      category: 'பழங்கள் / கழிவு',
      freshness: 'கெட்டுப்போனது',
      risk: 'அதிகம்',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'இயற்கை உரம் தயாரிப்பு / உயிர்வாயு ஆலை',
      recommendation: 'ஆரஞ்சு தோலில் பூஞ்சை தொற்று கண்டறியப்பட்டது. மனித நுகர்வுக்கு அல்லது நன்கொடைக்கு தகுதியற்றது. இயற்கை உரமாக மாற்றவும்.',
      shelfLife: 'காலாவதியானது / பாதுகாப்பற்றது',
      ecoImpact: '+0.50 கிலோ CO2 வெளியேற்றம் தடுக்கப்பட்டது',
      forensicNote: 'தோலில் பெனிசிலியம் பூஞ்சை மைசீலியம் வளர்ச்சி தெளிவாக கண்டறியப்பட்டது.',
      badgeGrade: 'தரம் சி (அழுகிய உரம்)'
    },
    hi: {
      displayName: 'सड़ा हुआ संतरा (पेनिसिलियम फफूंद संक्रमण)',
      category: 'खराब फल और सब्जियां',
      freshness: 'सड़ा हुआ',
      risk: 'उच्च',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'नगरपालिका जैविक खाद और अवायवीय जैव-पाचन',
      recommendation: 'संतरे के छिलके पर फफूंद के बीजाणु पाए गए। सेवन या दान के लिए अयोग्य। जैविक खाद में बदलें।',
      shelfLife: 'समाप्त / असुरक्षित',
      ecoImpact: '+0.50 किग्रा CO2 उत्सर्जन रोका गया',
      forensicNote: 'पेनिसिलियम फफूंद संक्रमण और छिलके का क्षय स्पष्ट रूप से दर्ज हुआ।',
      badgeGrade: 'ग्रेड सी (सड़ा हुआ / खाद)'
    },
    te: {
      displayName: 'కుళ్ళిన నారింజ పండు (బూజు సంక్రమణ)',
      category: 'పాడైన పండ్లు',
      freshness: 'కుళ్ళినది',
      risk: 'ఎక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'మునిసిపల్ ఆర్గానిక్ కంపోస్టింగ్',
      recommendation: 'తొక్కపై ఫంగల్ బూజు గుర్తించబడింది. తినడానికి లేదా దానం చేయడానికి అనర్హమైనది. కంపోస్టింగ్ కోసం పంపండి.',
      shelfLife: 'గడువు ముగిసింది / సురక్షితం కాదు',
      ecoImpact: '+0.50 కిలోల CO2 ఆదా',
      forensicNote: 'పెన్సిలియం ఫంగస్ తెగులు ధృవీకరించబడింది.',
      badgeGrade: 'గ్రేడ్ C (కుళ్ళినది)'
    },
    kn: {
      displayName: 'ಕೊಳೆತ ಕಿತ್ತಳೆ ಹಣ್ಣು (ಶಿಲೀಂಧ್ರ ಸೋಂಕು)',
      category: 'ಕೊಳೆತ ಹಣ್ಣುಗಳು',
      freshness: 'ಕೊಳೆತಿದೆ',
      risk: 'ಹೆಚ್ಚು',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ಸಾವಯವ ಗೊಬ್ಬರ ಸಂಸ್ಕರಣೆ',
      recommendation: 'ಕಿತ್ತಳೆ ಸಿಪ್ಪೆಯ ಮೇಲೆ ಶಿಲೀಂಧ್ರ ಕಲೆಗಳು ಕಂಡುಬಂದಿವೆ. ತಿನ್ನಲು ಯೋಗ್ಯವಲ್ಲ. ಗೊಬ್ಬರ ತಯಾರಿಕೆಗೆ ರವಾನಿಸಿ.',
      shelfLife: 'ಅಸುರಕ್ಷಿತ / ಸೇವನೆಗೆ ಯೋಗ್ಯವಲ್ಲ',
      ecoImpact: '+0.50 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಶಿಲೀಂಧ್ರ ಬೆಳವಣಿಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಪತ್ತೆಯಾಗಿದೆ.',
      badgeGrade: 'ಗ್ರೇಡ್ ಸಿ (ಕೊಳೆತ ಗೊಬ್ಬರ)'
    },
    ml: {
      displayName: 'പൂപ്പൽ ബാധിച്ച ഓറഞ്ച്',
      category: 'നശിച്ച പഴങ്ങൾ',
      freshness: 'നശിച്ചത്',
      risk: 'ഉയർന്നത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'ജൈവ കമ്പോസ്റ്റിംഗ്',
      recommendation: 'തൊലിപ്പുറത്ത് ഫംഗസ് ബാധ കണ്ടെത്തി. കഴിക്കാനോ ദാനം ചെയ്യാനോ യോഗ്യമല്ല. കമ്പോസ്റ്റിലേക്ക് മാറ്റുക.',
      shelfLife: 'കാലഹരണപ്പെട്ടു / അപകടകരം',
      ecoImpact: '+0.50 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'പെനിസിലിയം ഫംഗസ് സാന്നിധ്യം സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ഗ്രേഡ് സി (നശിച്ച ഭക്ഷണം)'
    },
    es: {
      displayName: 'Naranja en Descomposición (Moho Penicillium)',
      category: 'Frutas y Verduras',
      freshness: 'Podrido',
      risk: 'Alto',
      wasteGroup: 'Biodegradable',
      processingType: 'Compostaje Orgánico Municipal y Biodigestión',
      recommendation: 'Esporas de moho Penicillium detectadas en la corteza. No apto para consumo ni donación. Desviar a compostaje.',
      shelfLife: 'Caducado / Inseguro',
      ecoImpact: '+0.50 kg CO2 evitado vía compostaje',
      forensicNote: 'Micelio de hongo Penicillium localizado sobre la cáscara del cítrico.',
      badgeGrade: 'GRADO C (SPOIL / COMPOST)'
    },
    fr: {
      displayName: 'Orange Avariée (Moisissure Penicillium)',
      category: 'Fruits et Légumes',
      freshness: 'Avarié',
      risk: 'Élevé',
      wasteGroup: 'Biodégradable',
      processingType: 'Compostage Industriel et Biométhanisation',
      recommendation: 'Moisissure fongique Penicillium détectée sur le zeste. Inapte à la consommation et au don. Acheminer vers compost.',
      shelfLife: 'Périmé / Dangereux',
      ecoImpact: '+0.50 kg de CO2 évité par kg',
      forensicNote: 'Mycélium fongique et pourriture active localisés sur l’écorce.',
      badgeGrade: 'CATÉGORIE C (AVARIÉ / COMPOST)'
    }
  },

  // 11. Fresh Apple
  freshapples: {
    en: {
      displayName: 'Fresh Royal Gala / Red Apple',
      category: 'Produce',
      freshness: 'Fresh',
      risk: 'Low',
      wasteGroup: 'Biodegradable',
      processingType: 'Direct Surplus Redistribution / NGO Kitchens',
      recommendation: 'Grade A regulatory freshness. Intact cuticle, firm texture. Certified 100% eligible for immediate surplus donation.',
      shelfLife: '10-14 days',
      ecoImpact: '+0.45 kg CO2 avoided via redistribution',
      forensicNote: 'Optimal anthocyanin cuticle structure and firm cellular density.',
      badgeGrade: 'GRADE A (FRESH)'
    },
    ta: {
      displayName: 'புதிய ஆப்பிள் பழம்',
      category: 'பழங்கள் & காய்கறிகள்',
      freshness: 'புதியது',
      risk: 'குறைவு',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'நேரடி உபரி உணவு நன்கொடை / தொண்டு நிறுவனங்கள்',
      recommendation: 'முதல் நிலை புதிய பழம். தோல் உறுதியாகவும் சேதமின்றியும் உள்ளது. 100% உணவு நன்கொடைக்கு தகுதியானது.',
      shelfLife: '10-14 நாட்கள்',
      ecoImpact: '+0.45 கிலோ CO2 சேமிக்கப்பட்டது',
      forensicNote: 'ஆரோக்கியமான ஆப்பிள் தோல் அமைப்பு உறுதிப்படுத்தப்பட்டது.',
      badgeGrade: 'முதல் தரம் (புதிய ஆப்பிள்)'
    },
    hi: {
      displayName: 'ताजा सेब (रॉयल गाला)',
      category: 'ताजे फल और सब्जियां',
      freshness: 'ताजा',
      risk: 'निम्न',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'प्रत्यक्ष अधिशेष दान / एनजीओ रसोई',
      recommendation: 'ग्रेड ए ताजगी। मजबूत छिलका और उत्कृष्ट बनावट। तुरंत दान और उपभोग के लिए 100% योग्य।',
      shelfLife: '10-14 दिन',
      ecoImpact: '+0.45 किग्रा CO2 की बचत',
      forensicNote: 'एंथोसायनिन छिलके की संरचना और दृढ़ कोशिकीय घनत्व देखा गया।',
      badgeGrade: 'ग्रेड ए (ताजा सेब)'
    },
    te: {
      displayName: 'తాజా ఆపిల్ పండు',
      category: 'తాజా పండ్లు',
      freshness: 'తాజా',
      risk: 'తక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'నేరుగా మిగులు ఆహార విరాళం',
      recommendation: 'గ్రేడ్ A నాణ్యత. తొక్క చెక్కుచెదరకుండా దృఢంగా ఉంది. విరాళం ఇవ్వడానికి 100% అనుకూలం.',
      shelfLife: '10-14 రోజులు',
      ecoImpact: '+0.45 కిలోల CO2 ఆదా',
      forensicNote: 'దృఢమైన కణ నిర్మాణం నిర్ధారించబడింది.',
      badgeGrade: 'గ్రేడ్ A (తాజాది)'
    },
    kn: {
      displayName: 'ತಾಜಾ ಸೇಬು ಹಣ್ಣು',
      category: 'ತಾಜಾ ಹಣ್ಣುಗಳು',
      freshness: 'ತಾಜಾ',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ನೇರ ಆಹಾರ ದಾನ',
      recommendation: 'ಗ್ರೇಡ್ ಎ ಗುಣಮಟ್ಟ. ಗಟ್ಟಿಯಾದ ಹಣ್ಣು ಮತ್ತು ಹೊಳಪುಳ್ಳ ಸಿಪ್ಪೆ. ಆಹಾರ ದಾನಕ್ಕೆ ಪರಿಪೂರ್ಣ.',
      shelfLife: '10-14 ದಿನಗಳು',
      ecoImpact: '+0.45 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಉತ್ತಮ ಕೋಶ ಸಾಂದ್ರತೆ ದೃಢಪಟ್ಟಿದೆ.',
      badgeGrade: 'ಗ್ರೇಡ್ ಎ (ತಾಜಾ)'
    },
    ml: {
      displayName: 'പുതിയ ആപ്പിൾ',
      category: 'പഴങ്ങൾ',
      freshness: 'പുതിയത്',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'നേരിട്ടുള്ള മിച്ചഭക്ഷണ വിതരണം',
      recommendation: 'ഗ്രേഡ് എ ഗുണനിലവാരം. കേടുപാടുകളില്ലാത്ത തൊലി. ഭക്ഷ്യയോഗ്യവും ദാനത്തിന് 100% അനുയോജ്യവുമാണ്.',
      shelfLife: '10-14 ദിവസങ്ങൾ',
      ecoImpact: '+0.45 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'കോശ സാന്ദ്രതയും ആരോഗ്യവും സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ഗ്രേഡ് എ (ഫ്രഷ്)'
    },
    es: {
      displayName: 'Manzana Fresca (Royal Gala)',
      category: 'Frutas y Verduras',
      freshness: 'Fresco',
      risk: 'Bajo',
      wasteGroup: 'Biodegradable',
      processingType: 'Redistribución Directa de Excedentes',
      recommendation: 'Frescura Grado A. Cutícula intacta y pulpa firme. 100% apto para donación inmediata.',
      shelfLife: '10-14 días',
      ecoImpact: '+0.45 kg CO2 evitado vía redistribución',
      forensicNote: 'Estructura celular óptima y densidad celular firme.',
      badgeGrade: 'GRADO A (FRESCO)'
    },
    fr: {
      displayName: 'Pomme Fraîche (Gala / Rouge)',
      category: 'Fruits et Légumes',
      freshness: 'Frais',
      risk: 'Faible',
      wasteGroup: 'Biodégradable',
      processingType: 'Redistribution Directe des Surplus',
      recommendation: 'Catégorie A. Cuticule intacte, texture ferme. 100% éligible au don alimentaire immédiat.',
      shelfLife: '10-14 jours',
      ecoImpact: '+0.45 kg de CO2 évité par kg',
      forensicNote: 'Densité cellulaire ferme et cuticule saine confirmées.',
      badgeGrade: 'CATÉGORIE A (FRAIS)'
    }
  },

  // 12. Rotten Apple
  rottenapples: {
    en: {
      displayName: 'Spoiled Apple (Soft Rot & Cuticle Collapse)',
      category: 'Produce',
      freshness: 'Spoiled',
      risk: 'High',
      wasteGroup: 'Biodegradable',
      processingType: 'Municipal Organic Composting Facility',
      recommendation: 'Visible internal tissue breakdown and fungal mycelium detected. Route safely to municipal organic composting.',
      shelfLife: 'Expired / Unsafe',
      ecoImpact: '+0.45 kg CO2 avoided via composting',
      forensicNote: 'Internal pulp degradation and cuticle breakdown observed.',
      badgeGrade: 'GRADE C (SPOILED)'
    },
    ta: {
      displayName: 'கெட்டுப்போன ஆப்பிள் (திசு சிதைவு & பூஞ்சை)',
      category: 'பழங்கள் / கழிவு',
      freshness: 'கெட்டுப்போனது',
      risk: 'அதிகம்',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'நகராட்சி இயற்கை உரம் ஆலை',
      recommendation: 'திசு சிதைவு மற்றும் பூஞ்சை தொற்று கண்டறியப்பட்டது. உண்ண தகுதியற்றது. உரமாக மாற்றவும்.',
      shelfLife: 'காலாவதியானது',
      ecoImpact: '+0.45 கிலோ CO2 சேமிக்கப்பட்டது',
      forensicNote: 'உட்புற திசு அழிவு மற்றும் மென்மையான அழுகல் கண்டறியப்பட்டது.',
      badgeGrade: 'தரம் சி (அழுகிய ஆப்பிள்)'
    },
    hi: {
      displayName: 'सड़ा हुआ सेब (ऊतक क्षय और फफूंद)',
      category: 'खराब फल और सब्जियां',
      freshness: 'सड़ा हुआ',
      risk: 'उच्च',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'नगरपालिका जैविक खाद संयंत्र',
      recommendation: 'आंतरिक ऊतक क्षति और फफूंद पाई गई। खाने के लिए असुरक्षित। खाद बनाने के लिए भेजें।',
      shelfLife: 'समाप्त / असुरक्षित',
      ecoImpact: '+0.45 किग्रा CO2 की बचत',
      forensicNote: 'आंतरिक गूदे का क्षरण और छिलके का पतन देखा गया।',
      badgeGrade: 'ग्रेड सी (सड़ा हुआ सेब)'
    },
    te: {
      displayName: 'కుళ్ళిన ఆపిల్ పండు',
      category: 'పాడైన పండ్లు',
      freshness: 'కుళ్ళినది',
      risk: 'ఎక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'సేంద్రీయ కంపోస్టింగ్ ప్లాంట్',
      recommendation: 'లోపలి కణజాలం పాడైపోయింది మరియు ఫంగస్ వచ్చింది. కంపోస్ట్ కోసం పంపండి.',
      shelfLife: 'గడువు ముగిసింది',
      ecoImpact: '+0.45 కిలోల CO2 ఆదా',
      forensicNote: 'మృదువైన కుళ్ళిన మచ్చలు గుర్తించబడ్డాయి.',
      badgeGrade: 'గ్రేడ్ C (కుళ్ళినది)'
    },
    kn: {
      displayName: 'ಕೊಳೆತ ಸೇಬು ಹಣ್ಣು',
      category: 'ಕೊಳೆತ ಹಣ್ಣುಗಳು',
      freshness: 'ಕೊಳೆತಿದೆ',
      risk: 'ಹೆಚ್ಚು',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ಸಾವಯವ ಗೊಬ್ಬರ ಘಟಕ',
      recommendation: 'ಒಳಭಾಗದ ಅಂಗಾಂಶ ಹಾಳಾಗಿದೆ ಮತ್ತು ಶಿಲೀಂಧ್ರ ಕಂಡುಬಂದಿದೆ. ಗೊಬ್ಬರಕ್ಕೆ ಕಳುಹಿಸಿ.',
      shelfLife: 'ಅಸುರಕ್ಷಿತ',
      ecoImpact: '+0.45 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಕೊಳೆತ ಅಂಗಾಂಶಗಳು ಪತ್ತೆಯಾಗಿವೆ.',
      badgeGrade: 'ಗ್ರೇಡ್ ಸಿ (ಕೊಳೆತಿದೆ)'
    },
    ml: {
      displayName: 'ചീഞ്ഞ ആപ്പിൾ',
      category: 'നശിച്ച പഴങ്ങൾ',
      freshness: 'നശിച്ചത്',
      risk: 'ഉയർന്നത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'ജൈവ കമ്പോസ്റ്റിംഗ്',
      recommendation: 'അകത്തെ പൾപ്പ് ചീഞ്ഞുപോയിട്ടുണ്ട്. കഴിക്കാൻ സുരക്ഷിതമല്ല. കമ്പോസ്റ്റിലേക്ക് മാറ്റുക.',
      shelfLife: 'കാലഹരണപ്പെട്ടു',
      ecoImpact: '+0.45 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'കോശ വിഘടനവും പൂപ്പലും സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ഗ്രേഡ് സി (നശിച്ച ആപ്പിൾ)'
    },
    es: {
      displayName: 'Manzana Podrida (Necrosis y Descomposición)',
      category: 'Frutas y Verduras',
      freshness: 'Podrido',
      risk: 'Alto',
      wasteGroup: 'Biodegradable',
      processingType: 'Instalación de Compostaje Orgánico',
      recommendation: 'Descomposición tisular interna y micelio fúngico detectados. Enviar a compostaje.',
      shelfLife: 'Caducado / Inseguro',
      ecoImpact: '+0.45 kg CO2 evitado vía compostaje',
      forensicNote: 'Colapso de cutícula y pudrición blanda detectadas.',
      badgeGrade: 'GRADO C (PODRIDO)'
    },
    fr: {
      displayName: 'Pomme Pourrie (Nécrose et Moisissure)',
      category: 'Fruits et Légumes',
      freshness: 'Avarié',
      risk: 'Élevé',
      wasteGroup: 'Biodégradable',
      processingType: 'Plateforme de Compostage Organique',
      recommendation: 'Dégradation tissulaire interne et mycélium fongique détectés. Acheminer vers compost.',
      shelfLife: 'Périmé / Dangereux',
      ecoImpact: '+0.45 kg de CO2 évité par kg',
      forensicNote: 'Affaissement de la pulpe et pourriture active observés.',
      badgeGrade: 'CATÉGORIE C (AVARIÉ)'
    }
  },

  // 13. Fresh Banana
  freshbanana: {
    en: {
      displayName: 'Fresh Cavendish Banana (Grade A)',
      category: 'Produce',
      freshness: 'Fresh',
      risk: 'Low',
      wasteGroup: 'Biodegradable',
      processingType: 'Direct Surplus Redistribution / NGO Kitchens',
      recommendation: 'Vibrant golden peel with zero fungal blemishes. Optimal firmness, certified 100% eligible for immediate surplus donation.',
      shelfLife: '4-5 days',
      ecoImpact: '+0.40 kg CO2 avoided via redistribution',
      forensicNote: 'Optimal lutein pigment distribution across intact peel cuticle.',
      badgeGrade: 'GRADE A (FRESH)'
    },
    ta: {
      displayName: 'புதிய வாழைப்பழம் (முதல் தரம்)',
      category: 'பழங்கள் & காய்கறிகள்',
      freshness: 'புதியது',
      risk: 'குறைவு',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'நேரடி உபரி உணவு நன்கொடை / தொண்டு நிறுவனங்கள்',
      recommendation: 'பொன்னிற தோல் மற்றும் சிறந்த உறுதி. பூஞ்சை கறைகள் இல்லை. 100% உணவு நன்கொடைக்கு தகுதியானது.',
      shelfLife: '4-5 நாட்கள்',
      ecoImpact: '+0.40 கிலோ CO2 சேமிக்கப்பட்டது',
      forensicNote: 'ஆரோக்கியமான பழத்தோல் நிறம் உறுதி செய்யப்பட்டது.',
      badgeGrade: 'முதல் தரம் (புதிய வாழைப்பழம்)'
    },
    hi: {
      displayName: 'ताजा केला (कैवेंडिश - ग्रेड ए)',
      category: 'ताजे फल और सब्जियां',
      freshness: 'ताजा',
      risk: 'निम्न',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'प्रत्यक्ष अधिशेष दान / एनजीओ रसोई',
      recommendation: 'बिना दाग-धब्बों वाला सुनहरी छिलका। तुरंत दान और उपभोग के लिए 100% योग्य।',
      shelfLife: '4-5 दिन',
      ecoImpact: '+0.40 किग्रा CO2 की बचत',
      forensicNote: 'अक्षुण्ण छिलके पर इष्टतम ल्यूटिन वर्णक वितरण देखा गया।',
      badgeGrade: 'ग्रेड ए (ताजा केला)'
    },
    te: {
      displayName: 'తాజా అరటిపండు (గ్రేడ్ A)',
      category: 'తాజా పండ్లు',
      freshness: 'తాజా',
      risk: 'తక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'నేరుగా మిగులు ఆహార విరాళం',
      recommendation: 'మచ్చలు లేని బంగారు రంగు తొక్క. వెంటనే దానం చేయడానికి 100% అనుకూలం.',
      shelfLife: '4-5 రోజులు',
      ecoImpact: '+0.40 కిలోల CO2 ఆదా',
      forensicNote: 'ఆరోగ్యకరమైన తొక్క నిర్మాణం గుర్తించబడింది.',
      badgeGrade: 'గ్రేడ్ A (తాజాది)'
    },
    kn: {
      displayName: 'ತಾಜಾ ಬಾಳೆಹಣ್ಣು (ಗ್ರೇಡ್ ಎ)',
      category: 'ತಾಜಾ ಹಣ್ಣುಗಳು',
      freshness: 'ತಾಜಾ',
      risk: 'ಕಡಿಮೆ',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ನೇರ ಆಹಾರ ದಾನ',
      recommendation: 'ಯಾವುದೇ ಕಲೆಗಳಿಲ್ಲದ ಚಿನ್ನದ ಬಣ್ಣದ ಸಿಪ್ಪೆ. ಆಹಾರ ದಾನಕ್ಕೆ 100% ಯೋಗ್ಯವಾಗಿದೆ.',
      shelfLife: '4-5 ದಿನಗಳು',
      ecoImpact: '+0.40 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ನೈಸರ್ಗಿಕ ಹಳದಿ ವರ್ಣದ್ರವ್ಯ ದೃಢಪಟ್ಟಿದೆ.',
      badgeGrade: 'ಗ್ರೇಡ್ ಎ (ತಾಜಾ)'
    },
    ml: {
      displayName: 'പുതിയ പഴം / ഏത്തപ്പഴം',
      category: 'പഴങ്ങൾ',
      freshness: 'പുതിയത്',
      risk: 'കുറഞ്ഞത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'നേരിട്ടുള്ള മിച്ചഭക്ഷണ വിതരണം',
      recommendation: 'സ്വർണ്ണനിറത്തിലുള്ള നല്ല തൊലി. കറുത്ത പാടുകളില്ല. ഭക്ഷണമായി നൽകാൻ 100% അനുയോജ്യം.',
      shelfLife: '4-5 ദിവസങ്ങൾ',
      ecoImpact: '+0.40 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'സ്വാഭാവിക കാന്തിയും ഗുണനിലവാരവും സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ഗ്രേഡ് എ (ഫ്രഷ്)'
    },
    es: {
      displayName: 'Plátano Cavendish Fresco (Grado A)',
      category: 'Frutas y Verduras',
      freshness: 'Fresco',
      risk: 'Bajo',
      wasteGroup: 'Biodegradable',
      processingType: 'Redistribución Directa de Excedentes',
      recommendation: 'Piel dorada vibrante sin manchas fúngicas. Firmeza óptima, 100% apto para donación inmediata.',
      shelfLife: '4-5 días',
      ecoImpact: '+0.40 kg CO2 evitado vía redistribución',
      forensicNote: 'Distribución óptima de luteína en la cutícula intacta.',
      badgeGrade: 'GRADO A (FRESCO)'
    },
    fr: {
      displayName: 'Banane Cavendish Fraîche (Catégorie A)',
      category: 'Fruits et Légumes',
      freshness: 'Frais',
      risk: 'Faible',
      wasteGroup: 'Biodégradable',
      processingType: 'Redistribution Directe des Surplus',
      recommendation: 'Peau jaune vif sans moisissure. Fermeté optimale, 100% éligible au don alimentaire immédiat.',
      shelfLife: '4-5 jours',
      ecoImpact: '+0.40 kg de CO2 évité par kg',
      forensicNote: 'Répartition idéale des pigments de lutéine sur la cuticule.',
      badgeGrade: 'CATÉGORIE A (FRAIS)'
    }
  },

  // 14. Rotten Banana
  rottenbanana: {
    en: {
      displayName: 'Rotten Cavendish Banana (Anthracnose Decay)',
      category: 'Produce',
      freshness: 'Spoiled',
      risk: 'High',
      wasteGroup: 'Biodegradable',
      processingType: 'Aerobic Bio-Composting & Biogas Recovery',
      recommendation: 'Severe decay and microbial senescence detected. Ineligible for consumption or food donation. Divert to aerobic bio-composting.',
      shelfLife: 'Expired / Unsafe',
      ecoImpact: '+0.40 kg CO2 avoided via composting',
      forensicNote: 'Anthracnose necrosis and cellular cuticle collapse confirmed.',
      badgeGrade: 'GRADE C (SPOILED)'
    },
    ta: {
      displayName: 'அழுகிய வாழைப்பழம் (கருப்பு அழுகல் & பூஞ்சை)',
      category: 'பழங்கள் / கழிவு',
      freshness: 'கெட்டுப்போனது',
      risk: 'அதிகம்',
      wasteGroup: 'மக்கும் தன்மை கொண்டது',
      processingType: 'இயற்கை உரம் தயாரிப்பு மற்றும் உயிர்வாயு ஆலை',
      recommendation: 'கடுமையான சிதைவு மற்றும் பூஞ்சை தொற்று உள்ளது. மனித நுகர்வுக்கு தகுதியற்றது. உரமாக மாற்றவும்.',
      shelfLife: 'காலாவதியானது',
      ecoImpact: '+0.40 கிலோ CO2 சேமிக்கப்பட்டது',
      forensicNote: 'ஆந்த்ராக்னோஸ் நெக்ரோசிஸ் மற்றும் தோல் சிதைவு கண்டறியப்பட்டது.',
      badgeGrade: 'தரம் சி (அழுகிய வாழைப்பழம்)'
    },
    hi: {
      displayName: 'सड़ा हुआ केला (एंथ्रेक्नोज क्षय)',
      category: 'खराब फल और सब्जियां',
      freshness: 'सड़ा हुआ',
      risk: 'उच्च',
      wasteGroup: 'बायोडिग्रेडेबल',
      processingType: 'एरोबिक बायो-कंपोस्टिंग और बायोगैस रिकवरी',
      recommendation: 'गंभीर क्षय और सूक्ष्मजीवी सड़न पाई गई। खाने या दान के लिए अयोग्य। जैविक खाद में बदलें।',
      shelfLife: 'समाप्त / असुरक्षित',
      ecoImpact: '+0.40 किग्रा CO2 की बचत',
      forensicNote: 'गंभीर कालापन और ऊतक क्षरण स्पष्ट देखा गया।',
      badgeGrade: 'ग्रेड सी (सड़ा हुआ केला)'
    },
    te: {
      displayName: 'కుళ్ళిన అరటిపండు (తీవ్రమైన తెగులు)',
      category: 'పాడైన పండ్లు',
      freshness: 'కుళ్ళినది',
      risk: 'ఎక్కువ',
      wasteGroup: 'బయోడిగ్రేడబుల్',
      processingType: 'బయోగ్యాస్ రికవరీ & కంపోస్టింగ్',
      recommendation: 'తీవ్రమైన కుళ్ళిపోవడం జరిగింది. తినడానికి లేదా దానం చేయడానికి పనికిరాదు. కంపోస్ట్ కోసం పంపండి.',
      shelfLife: 'గడువు ముగిసింది',
      ecoImpact: '+0.40 కిలోల CO2 ఆదా',
      forensicNote: 'కణజాల క్షీణత మరియు నల్లటి మచ్చలు నిర్ధారించబడ్డాయి.',
      badgeGrade: 'గ్రేడ్ C (కుళ్ళినది)'
    },
    kn: {
      displayName: 'ಕೊಳೆತ ಬಾಳೆಹಣ್ಣು (ಕಪ್ಪು ಕಲೆಗಳ ಕೊಳೆತ)',
      category: 'ಕೊಳೆತ ಹಣ್ಣುಗಳು',
      freshness: 'ಕೊಳೆತಿದೆ',
      risk: 'ಹೆಚ್ಚು',
      wasteGroup: 'ಜೈವಿಕ ವಿಘಟನೀಯ',
      processingType: 'ಸಾವಯವ ಗೊಬ್ಬರ ಮತ್ತು ಬಯೋಗ್ಯಾಸ್',
      recommendation: 'ತೀವ್ರ ಕೊಳೆತ ಮತ್ತು ಶಿಲೀಂಧ್ರ ಕಂಡುಬಂದಿದೆ. ತಿನ್ನಲು ಯೋಗ್ಯವಲ್ಲ. ಗೊಬ್ಬರಕ್ಕೆ ಕಳುಹಿಸಿ.',
      shelfLife: 'ಅಸುರಕ್ಷಿತ',
      ecoImpact: '+0.40 ಕೆಜಿ ಇಂಗಾಲ ಉಳಿತಾಯ',
      forensicNote: 'ಕಪ್ಪಾದ ಕೊಳೆತ ಲಕ್ಷಣಗಳು ದೃಢಪಟ್ಟಿವೆ.',
      badgeGrade: 'ಗ್ರೇಡ್ ಸಿ (ಕೊಳೆತಿದೆ)'
    },
    ml: {
      displayName: 'ചീഞ്ഞ പഴം (കറുത്ത് നശിച്ചത്)',
      category: 'നശിച്ച പഴങ്ങൾ',
      freshness: 'നശിച്ചത്',
      risk: 'ഉയർന്നത്',
      wasteGroup: 'ബയോഡീഗ്രേഡബിൾ',
      processingType: 'ജൈവ കമ്പോസ്റ്റിംഗ് & ബയോഗ്യാസ്',
      recommendation: 'പൂർണ്ണമായും നശിച്ച അവസ്ഥയിലാണ്. കഴിക്കാൻ സുരക്ഷിതമല്ല. കമ്പോസ്റ്റിലേക്ക് മാറ്റുക.',
      shelfLife: 'കാലഹരണപ്പെട്ടു',
      ecoImpact: '+0.40 കിലോഗ്രാം CO2 കുറച്ചു',
      forensicNote: 'ആന്ത്രക്നോസ് ബാധയും കോശ നശീകരണവും സ്ഥിരീകരിച്ചു.',
      badgeGrade: 'ഗ്രേഡ് സി (നശിച്ച പഴം)'
    },
    es: {
      displayName: 'Plátano Podrido (Antracnosis y Descomposición)',
      category: 'Frutas y Verduras',
      freshness: 'Podrido',
      risk: 'Alto',
      wasteGroup: 'Biodegradable',
      processingType: 'Compostaje Biológico y Recuperación de Biogás',
      recommendation: 'Descomposición severa y senescencia microbiana. Inapropiado para consumo o donación. Enviar a compost.',
      shelfLife: 'Caducado / Inseguro',
      ecoImpact: '+0.40 kg CO2 evitado vía compostaje',
      forensicNote: 'Necrosis por antracnosis y colapso tisular confirmados.',
      badgeGrade: 'GRADO C (PODRIDO)'
    },
    fr: {
      displayName: 'Banane Pourrie (Nécrose Anthracnose)',
      category: 'Fruits et Légumes',
      freshness: 'Avarié',
      risk: 'Élevé',
      wasteGroup: 'Biodégradable',
      processingType: 'Compostage Aérobie et Valorisation Biogaz',
      recommendation: 'Décomposition avancée et sénescence microbienne. Inapte à la consommation et au don. Acheminer vers compost.',
      shelfLife: 'Périmé / Dangereux',
      ecoImpact: '+0.40 kg de CO2 évité par kg',
      forensicNote: 'Nécrose anthracnose et effondrement cellulaire confirmés.',
      badgeGrade: 'CATÉGORIE C (AVARIÉ)'
    }
  }
};

/**
 * Universal Translator function for any AI scan result object.
 */
export function translateScanResult(
  result: any,
  targetLang: SupportedLanguage
): TranslatedScanPayload {
  if (!result) {
    return {
      displayName: 'Inspected Specimen',
      category: 'General Waste',
      freshness: 'Uncertain',
      risk: 'Low',
      wasteGroup: 'Biodegradable',
      processingType: 'Recycling / Composting',
      recommendation: 'Inspect manually or follow municipal waste segregation guidelines.',
      shelfLife: 'N/A',
      ecoImpact: '+0.50 kg CO2 avoided',
      forensicNote: 'Visual analysis complete.',
      badgeGrade: 'INSPECTED'
    };
  }

  // Identify matching key
  const detectedClass = (
    result.predicted_class ||
    result.detected_class ||
    result.food ||
    result.item ||
    result.display_name ||
    ''
  ).toLowerCase().replace(/[\s\-_]+/g, '_');

  let matchKey: string | null = null;
  if (CLASS_TRANSLATIONS[detectedClass]) {
    matchKey = detectedClass;
  } else {
    // Fuzzy matching against known keys
    const keys = Object.keys(CLASS_TRANSLATIONS);
    for (const k of keys) {
      if (detectedClass.includes(k) || k.includes(detectedClass)) {
        matchKey = k;
        break;
      }
    }
  }

  if (matchKey && CLASS_TRANSLATIONS[matchKey][targetLang]) {
    return CLASS_TRANSLATIONS[matchKey][targetLang];
  }

  // Fallback translation if not directly in dictionary
  const defaultPayload = CLASS_TRANSLATIONS.food_waste[targetLang] || CLASS_TRANSLATIONS.food_waste.en;
  return {
    displayName: result.display_name || result.detected_item || result.food || defaultPayload.displayName,
    category: result.category || defaultPayload.category,
    freshness: result.freshness || result.visual_freshness || defaultPayload.freshness,
    risk: result.risk || defaultPayload.risk,
    wasteGroup: result.waste_group || result.degradability || defaultPayload.wasteGroup,
    processingType: result.processing_type || defaultPayload.processingType,
    recommendation: result.recommendation || result.recommended_action || defaultPayload.recommendation,
    shelfLife: result.shelf_life || defaultPayload.shelfLife,
    ecoImpact: result.ecoImpact || defaultPayload.ecoImpact,
    forensicNote: result.explanation || defaultPayload.forensicNote,
    badgeGrade: defaultPayload.badgeGrade
  };
}
