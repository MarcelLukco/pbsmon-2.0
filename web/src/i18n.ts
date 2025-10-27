import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        pages: {
          personalView: "Personal View",
          qsubAssembler: "Qsub Assembler",
          machines: "Machines",
          jobs: "Jobs",
          queues: "Jobs Queues",
          propertiesOfMachines: "Properties of Machines",
          users: "Users",
        },
      },
    },
    cs: {
      translation: {
        pages: {
          personalView: "Osobní pohled",
          qsubAssembler: "Sestavovač Qsub",
          machines: "Stroje",
          jobs: "Úlohy",
          queues: "Fronty úloh",
          propertiesOfMachines: "Vlastnosti strojů",
          users: "Uživatelé",
        },
      },
    },
  },
  lng: "cs",
  fallbackLng: "cs",
  interpolation: { escapeValue: false },
});
