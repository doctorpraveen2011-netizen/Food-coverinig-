import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      foodAnalysis: 'Food Analysis',
      donations: 'Donations',
      complaints: 'Complaints',
      tracking: 'Tracking',
      mapView: 'Map View',
      reports: 'Reports',
      users: 'Users',
      settings: 'Settings',
      welcomeMessage: "Welcome back, {{name}}! Here's what's happening with FoodCovering.",
      totalDonations: 'Total Donations',
      activeVolunteers: 'Active Volunteers',
      complaintsResolved: 'Complaints Resolved',
      foodSafetyScore: 'Food Safety Score',
      vsLastWeek: 'vs. last week',
      login: {
        welcome: 'Welcome to FoodCovering',
        subtitle: 'Smart food safety, donation and community protection.',
        emailPlaceholder: 'Email / Username',
        passwordPlaceholder: 'Password',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot password?',
        loginBtn: 'LOGIN',
        privacyPolicy: 'Privacy Policy',
        terms: 'Terms',
        support: 'Support'
      }
    }
  },
  ta: {
    translation: {
      dashboard: 'டாஷ்போர்டு',
      foodAnalysis: 'உணவு பகுப்பாய்வு',
      donations: 'நன்கொடைகள்',
      complaints: 'புகார்கள்',
      tracking: 'கண்காணிப்பு',
      mapView: 'வரைபட காட்சி',
      reports: 'அறிக்கைகள்',
      users: 'பயனர்கள்',
      settings: 'அமைப்புகள்',
      welcomeMessage: "மீண்டும் வருக, {{name}}! FoodCovering இல் என்ன நடக்கிறது என்பது இங்கே.",
      totalDonations: 'மொத்த நன்கொடைகள்',
      activeVolunteers: 'செயலில் உள்ள தொண்டர்கள்',
      complaintsResolved: 'தீர்க்கப்பட்ட புகார்கள்',
      foodSafetyScore: 'உணவு பாதுகாப்பு மதிப்பெண்',
      vsLastWeek: 'கடந்த வாரத்துடன்',
      login: {
        welcome: 'FoodCovering க்கு வருக',
        subtitle: 'ஸ்மார்ட் உணவு பாதுகாப்பு, நன்கொடை மற்றும் சமூக பாதுகாப்பு.',
        emailPlaceholder: 'மின்னஞ்சல் / பயனர் பெயர்',
        passwordPlaceholder: 'கடவுச்சொல்',
        rememberMe: 'என்னை நினைவில் கொள்க',
        forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
        loginBtn: 'உள்நுழைக',
        privacyPolicy: 'தனியுரிமைக் கொள்கை',
        terms: 'விதிமுறைகள்',
        support: 'ஆதரவு'
      }
    }
  },
  hi: {
    translation: {
      dashboard: 'डैशबोर्ड',
      foodAnalysis: 'खाद्य विश्लेषण',
      donations: 'दान',
      complaints: 'शिकायतें',
      tracking: 'ट्रैकिंग',
      mapView: 'मानचित्र दृश्य',
      reports: 'रिपोर्ट',
      users: 'उपयोगकर्ता',
      settings: 'सेटिंग्स',
      welcomeMessage: "वापसी पर स्वागत है, {{name}}! यहाँ FoodCovering के साथ क्या हो रहा है।",
      totalDonations: 'कुल दान',
      activeVolunteers: 'सक्रिय स्वयंसेवक',
      complaintsResolved: 'सुलझाई गई शिकायतें',
      foodSafetyScore: 'खाद्य सुरक्षा स्कोर',
      vsLastWeek: 'पिछले सप्ताह की तुलना में',
      login: {
        welcome: 'FoodCovering में आपका स्वागत है',
        subtitle: 'स्मार्ट खाद्य सुरक्षा, दान और सामुदायिक सुरक्षा।',
        emailPlaceholder: 'ईमेल / उपयोगकर्ता नाम',
        passwordPlaceholder: 'पासवर्ड',
        rememberMe: 'मुझे याद रखें',
        forgotPassword: 'पासवर्ड भूल गए?',
        loginBtn: 'लॉग इन करें',
        privacyPolicy: 'गोपनीयता नीति',
        terms: 'शर्तें',
        support: 'समर्थन'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
